const Movie = require('../models/Movie');
const Show = require('../models/Show');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const mongoose = require('mongoose');

/**
 * Get all movies with search, filters, pagination, and sorting
 * GET /api/v1/movies
 */
async function getMovies(req, res, next) {
  try {
    const {
      search,
      genre,
      language,
      status,
      sort = '-rating',
      page = 1,
      limit = 10,
    } = req.query;

    const query = {};

    // Filter by release status (now_showing, coming_soon, ended)
    if (status) {
      query.status = status;
    }

    // Filter by genre
    if (genre) {
      query.genre = { $in: [new RegExp(genre, 'i')] };
    }

    // Filter by language
    if (language) {
      query.language = { $in: [new RegExp(language, 'i')] };
    }

    // Text search or title regex
    if (search && search.trim()) {
      query.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(50, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    // Execute query with pagination and total count
    const [movies, totalCount] = await Promise.all([
      Movie.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Movie.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalCount / limitNum) || 1;

    res.status(200).json(
      new ApiResponse(
        200,
        {
          movies,
          pagination: {
            page: pageNum,
            limit: limitNum,
            totalCount,
            totalPages,
            hasNextPage: pageNum < totalPages,
            hasPrevPage: pageNum > 1,
          },
        },
        'Movies retrieved successfully'
      )
    );
  } catch (err) {
    next(err);
  }
}

/**
 * Get single movie details by ID
 * GET /api/v1/movies/:id
 */
async function getMovieById(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new ApiError(400, `Invalid movie ID format: ${id}`));
    }

    const movie = await Movie.findById(id).lean();
    if (!movie) {
      return next(new ApiError(404, `Movie not found with ID: ${id}`));
    }

    res.status(200).json(new ApiResponse(200, { movie }, 'Movie details retrieved'));
  } catch (err) {
    next(err);
  }
}

/**
 * Get shows for a specific movie, grouped or filtered by date and city
 * GET /api/v1/movies/:id/shows
 */
async function getMovieShows(req, res, next) {
  try {
    const { id } = req.params;
    const { date, city, theatreId } = req.query;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new ApiError(400, `Invalid movie ID format: ${id}`));
    }

    const showQuery = {
      movie: id,
      status: { $in: ['scheduled', 'running'] },
    };

    if (theatreId && mongoose.Types.ObjectId.isValid(theatreId)) {
      showQuery.theatre = theatreId;
    }

    // Filter by specific date if provided (defaults to today and future)
    if (date) {
      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
      showQuery.startTime = { $gte: startOfDay, $lte: endOfDay };
    } else {
      // Default: shows scheduled for today onwards
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      showQuery.startTime = { $gte: todayStart };
    }

    const shows = await Show.find(showQuery)
      .populate('theatre', 'name city state address amenities screens location')
      .sort('startTime')
      .lean();

    // Optional filter by city if requested
    const filteredShows = city
      ? shows.filter((s) => s.theatre?.city?.toLowerCase() === city.toLowerCase())
      : shows;

    // Map shows without huge embedded seat array for lightweight listing
    const sanitizedShows = filteredShows.map((s) => {
      const availableSeats = (s.seats || []).filter((seat) => {
        if (seat.status === 'available') return true;
        if (seat.status === 'locked' && seat.lockExpiresAt && new Date(seat.lockExpiresAt) < new Date()) {
          return true;
        }
        return false;
      }).length;

      return {
        _id: s._id,
        movie: s.movie,
        theatre: s.theatre,
        screenName: s.screenName,
        startTime: s.startTime,
        endTime: s.endTime,
        tierPricing: s.tierPricing,
        status: s.status,
        totalSeats: s.seats?.length || 0,
        availableSeats,
      };
    });

    res.status(200).json(
      new ApiResponse(
        200,
        { shows: sanitizedShows, count: sanitizedShows.length },
        'Movie showtimes retrieved successfully'
      )
    );
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getMovies,
  getMovieById,
  getMovieShows,
};

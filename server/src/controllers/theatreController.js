const Theatre = require('../models/Theatre');
const Show = require('../models/Show');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const mongoose = require('mongoose');

/**
 * Get all theatres with city and amenity filters
 * GET /api/v1/theatres
 */
async function getTheatres(req, res, next) {
  try {
    const { city, amenity, search } = req.query;
    const query = {};

    if (city) {
      query.city = { $regex: new RegExp(`^${city.trim()}$`, 'i') };
    }

    if (amenity) {
      query.amenities = { $in: [new RegExp(amenity.trim(), 'i')] };
    }

    if (search && search.trim()) {
      query.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { city: { $regex: search.trim(), $options: 'i' } },
        { address: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const theatres = await Theatre.find(query).sort('name').lean();

    res.status(200).json(
      new ApiResponse(200, { theatres, count: theatres.length }, 'Theatres retrieved successfully')
    );
  } catch (err) {
    next(err);
  }
}

/**
 * Get single theatre by ID
 * GET /api/v1/theatres/:id
 */
async function getTheatreById(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new ApiError(400, `Invalid theatre ID format: ${id}`));
    }

    const theatre = await Theatre.findById(id).lean();
    if (!theatre) {
      return next(new ApiError(404, `Theatre not found with ID: ${id}`));
    }

    res.status(200).json(new ApiResponse(200, { theatre }, 'Theatre details retrieved'));
  } catch (err) {
    next(err);
  }
}

/**
 * Get shows for a specific theatre with populated movie details
 * GET /api/v1/theatres/:id/shows
 */
async function getTheatreShows(req, res, next) {
  try {
    const { id } = req.params;
    const { date } = req.query;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new ApiError(400, `Invalid theatre ID format: ${id}`));
    }

    const showQuery = {
      theatre: id,
      status: { $in: ['scheduled', 'running'] },
    };

    if (date) {
      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
      showQuery.startTime = { $gte: startOfDay, $lte: endOfDay };
    } else {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      showQuery.startTime = { $gte: todayStart };
    }

    const shows = await Show.find(showQuery)
      .populate('movie', 'title posterUrl durationMinutes certification genre language rating')
      .sort('startTime')
      .lean();

    const sanitizedShows = shows.map((s) => ({
      _id: s._id,
      movie: s.movie,
      screenName: s.screenName,
      startTime: s.startTime,
      endTime: s.endTime,
      tierPricing: s.tierPricing,
      status: s.status,
      totalSeats: s.seats?.length || 0,
      availableSeats: (s.seats || []).filter((seat) => seat.status === 'available').length,
    }));

    res.status(200).json(
      new ApiResponse(200, { shows: sanitizedShows, count: sanitizedShows.length }, 'Theatre shows retrieved')
    );
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getTheatres,
  getTheatreById,
  getTheatreShows,
};

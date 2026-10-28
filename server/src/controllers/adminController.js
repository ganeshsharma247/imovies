const mongoose = require('mongoose');
const { Movie, Theatre, Show, Booking, Payment, Notification } = require('../models');
const { checkScheduleConflict } = require('./showController');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');

/**
 * Get aggregated administrative platform metrics
 * GET /api/v1/admin/stats
 */
async function getAdminStats(req, res, next) {
  try {
    const [
      totalMovies,
      totalTheatres,
      totalShows,
      bookingsAgg,
      totalUsers,
    ] = await Promise.all([
      Movie.countDocuments(),
      Theatre.countDocuments(),
      Show.countDocuments({ status: { $in: ['scheduled', 'running'] } }),
      Booking.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalRevenue: {
              $sum: {
                $cond: [{ $eq: ['$status', 'confirmed'] }, '$pricing.totalAmount', 0],
              },
            },
            ticketsSold: {
              $sum: {
                $cond: [{ $eq: ['$status', 'confirmed'] }, { $size: '$seats' }, 0],
              },
            },
          },
        },
      ]),
      mongoose.model('User').countDocuments({ role: 'user' }),
    ]);

    let totalRevenue = 0;
    let totalTicketsSold = 0;
    let confirmedBookings = 0;
    let cancelledBookings = 0;

    for (const group of bookingsAgg) {
      if (group._id === 'confirmed') {
        totalRevenue += group.totalRevenue;
        totalTicketsSold += group.ticketsSold;
        confirmedBookings = group.count;
      } else if (group._id === 'cancelled') {
        cancelledBookings = group.count;
      }
    }

    res.status(200).json(
      new ApiResponse(
        200,
        {
          stats: {
            totalRevenue: +totalRevenue.toFixed(2),
            totalTicketsSold,
            confirmedBookings,
            cancelledBookings,
            totalBookings: confirmedBookings + cancelledBookings,
            activeMovies: totalMovies,
            activeTheatres: totalTheatres,
            activeShows: totalShows,
            registeredUsers: totalUsers,
          },
        },
        'Platform metrics retrieved successfully'
      )
    );
  } catch (err) {
    next(err);
  }
}

/**
 * Create new movie
 * POST /api/v1/admin/movies
 */
async function createMovie(req, res, next) {
  try {
    const movie = new Movie(req.body);
    await movie.save();
    res.status(201).json(new ApiResponse(201, { movie }, 'Movie created successfully'));
  } catch (err) {
    next(err);
  }
}

/**
 * Update movie
 * PUT /api/v1/admin/movies/:id
 */
async function updateMovie(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new ApiError(400, 'Invalid movie ID format'));
    }

    const movie = await Movie.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!movie) {
      return next(new ApiError(404, 'Movie not found'));
    }

    res.status(200).json(new ApiResponse(200, { movie }, 'Movie updated successfully'));
  } catch (err) {
    next(err);
  }
}

/**
 * Delete movie
 * DELETE /api/v1/admin/movies/:id
 */
async function deleteMovie(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new ApiError(400, 'Invalid movie ID format'));
    }

    // Check for active scheduled shows
    const activeShowsCount = await Show.countDocuments({
      movie: id,
      status: { $in: ['scheduled', 'running'] },
    });

    if (activeShowsCount > 0) {
      return next(
        new ApiError(
          400,
          `Cannot delete movie: It has ${activeShowsCount} active scheduled shows. Please cancel or reassign those shows first.`
        )
      );
    }

    const movie = await Movie.findByIdAndDelete(id);
    if (!movie) {
      return next(new ApiError(404, 'Movie not found'));
    }

    res.status(200).json(new ApiResponse(200, null, 'Movie deleted successfully'));
  } catch (err) {
    next(err);
  }
}

/**
 * Create new theatre
 * POST /api/v1/admin/theatres
 */
async function createTheatre(req, res, next) {
  try {
    const theatre = new Theatre(req.body);
    await theatre.save();
    res.status(201).json(new ApiResponse(201, { theatre }, 'Theatre created successfully'));
  } catch (err) {
    next(err);
  }
}

/**
 * Update theatre
 * PUT /api/v1/admin/theatres/:id
 */
async function updateTheatre(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new ApiError(400, 'Invalid theatre ID format'));
    }

    const theatre = await Theatre.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!theatre) {
      return next(new ApiError(404, 'Theatre not found'));
    }

    res.status(200).json(new ApiResponse(200, { theatre }, 'Theatre updated successfully'));
  } catch (err) {
    next(err);
  }
}

/**
 * Create new show with screening collision detection and automatic seat matrix initialization
 * POST /api/v1/admin/shows
 */
async function createShow(req, res, next) {
  try {
    const { movie: movieId, theatre: theatreId, screenName, startTime, endTime, tierPricing } = req.body;

    if (!movieId || !theatreId || !screenName || !startTime || !endTime || !tierPricing) {
      return next(new ApiError(400, 'All fields (movie, theatre, screenName, startTime, endTime, tierPricing) are required'));
    }

    // 1. Verify Theatre & Screen existence
    const theatre = await Theatre.findById(theatreId);
    if (!theatre) {
      return next(new ApiError(404, 'Theatre not found'));
    }

    const screen = theatre.screens.find((s) => s.name.trim().toLowerCase() === screenName.trim().toLowerCase());
    if (!screen) {
      return next(
        new ApiError(
          400,
          `Screen '${screenName}' not found in theatre. Available screens: ${theatre.screens.map((s) => s.name).join(', ')}`
        )
      );
    }

    // 2. Schedule Conflict Check (prevent overlapping shows on same screen)
    const conflict = await checkScheduleConflict(theatreId, screenName, startTime, endTime);
    if (conflict) {
      return next(
        new ApiError(
          409,
          `Schedule conflict: Screen '${screenName}' already has show '${conflict.movie?.title}' scheduled from ${new Date(conflict.startTime).toLocaleTimeString()} to ${new Date(conflict.endTime).toLocaleTimeString()}.`
        )
      );
    }

    // 3. Generate Seat Matrix matching screen layout
    const seats = [];
    for (const row of screen.seatLayout.rows) {
      for (let i = 1; i <= row.seatsCount; i++) {
        const seatId = `${row.rowLabel}-${i}`;
        const price = tierPricing[row.tier] || tierPricing.silver;
        seats.push({
          seatId,
          row: row.rowLabel,
          number: i,
          tier: row.tier,
          price,
          status: 'available',
        });
      }
    }

    const show = new Show({
      movie: movieId,
      theatre: theatreId,
      screenName: screen.name,
      startTime,
      endTime,
      tierPricing,
      seats,
      status: 'scheduled',
    });

    await show.save();

    res.status(201).json(new ApiResponse(201, { show }, 'Show created successfully with seat matrix initialized'));
  } catch (err) {
    next(err);
  }
}

/**
 * Cancel or delete show
 * DELETE /api/v1/admin/shows/:id
 */
async function deleteShow(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new ApiError(400, 'Invalid show ID format'));
    }

    const show = await Show.findById(id);
    if (!show) {
      return next(new ApiError(404, 'Show not found'));
    }

    // If bookings exist for this show, mark show as cancelled and cascade refunds
    const bookings = await Booking.find({ show: id, status: 'confirmed' });
    for (const booking of bookings) {
      booking.status = 'cancelled';
      booking.paymentStatus = 'refunded';
      booking.cancellation = {
        cancelledAt: new Date(),
        reason: 'Show cancelled by cinema administration',
        refundAmount: booking.pricing.totalAmount,
      };
      await booking.save();

      if (booking.payment) {
        await Payment.findByIdAndUpdate(booking.payment, {
          status: 'refunded',
          refundedAt: new Date(),
        });
      }

      await Notification.create({
        recipient: booking.user,
        title: 'Show Cancelled by Cinema',
        message: `The show scheduled for booking ${booking.bookingReference} has been cancelled by administration. Full refund has been issued.`,
        type: 'booking_cancellation',
      });
    }

    show.status = 'cancelled';
    await show.save();

    res.status(200).json(
      new ApiResponse(
        200,
        { cancelledBookingsCount: bookings.length },
        `Show cancelled successfully. ${bookings.length} affected bookings refunded.`
      )
    );
  } catch (err) {
    next(err);
  }
}

/**
 * Platform-wide bookings audit
 * GET /api/v1/admin/bookings
 */
async function getAllBookings(req, res, next) {
  try {
    const { status, page = 1, limit = 20, search } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const query = {};
    if (status) query.status = status;
    if (search && search.trim()) {
      query.bookingReference = { $regex: search.trim(), $options: 'i' };
    }

    const [bookings, totalCount] = await Promise.all([
      Booking.find(query)
        .populate('user', 'name email phone')
        .populate('movie', 'title')
        .populate('theatre', 'name city')
        .populate('show', 'startTime screenName')
        .populate('payment', 'transactionId method status')
        .sort('-bookedAt')
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Booking.countDocuments(query),
    ]);

    res.status(200).json(
      new ApiResponse(
        200,
        {
          bookings,
          pagination: {
            page: pageNum,
            limit: limitNum,
            totalCount,
            totalPages: Math.ceil(totalCount / limitNum) || 1,
          },
        },
        'All platform bookings retrieved'
      )
    );
  } catch (err) {
    next(err);
  }
}

/**
 * Re-seed database with default catalog data
 * POST /api/v1/admin/seed
 */
async function triggerDatabaseSeed(req, res, next) {
  try {
    const { seedDatabase } = require('../../seed/seeder');
    const result = await seedDatabase({ log: false });
    res.status(200).json(new ApiResponse(200, result, 'Database re-seeded successfully'));
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAdminStats,
  createMovie,
  updateMovie,
  deleteMovie,
  createTheatre,
  updateTheatre,
  createShow,
  deleteShow,
  getAllBookings,
  triggerDatabaseSeed,
};

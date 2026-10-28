const Show = require('../models/Show');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const mongoose = require('mongoose');

/**
 * Check if a proposed showtime overlaps with any existing show on the same screen
 */
async function checkScheduleConflict(theatreId, screenName, startTime, endTime, excludeShowId = null) {
  const query = {
    theatre: theatreId,
    screenName: screenName.trim(),
    status: { $in: ['scheduled', 'running'] },
    // Overlap condition: existing.start < new.end AND existing.end > new.start
    $and: [
      { startTime: { $lt: new Date(endTime) } },
      { endTime: { $gt: new Date(startTime) } },
    ],
  };

  if (excludeShowId && mongoose.Types.ObjectId.isValid(excludeShowId)) {
    query._id = { $ne: excludeShowId };
  }

  const conflictingShow = await Show.findOne(query)
    .populate('movie', 'title')
    .lean();

  return conflictingShow;
}

/**
 * Get show metadata by ID
 * GET /api/v1/shows/:id
 */
async function getShowById(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new ApiError(400, `Invalid show ID format: ${id}`));
    }

    const show = await Show.findById(id)
      .populate('movie', 'title posterUrl bannerUrl durationMinutes certification genre language rating')
      .populate('theatre', 'name city address amenities location screens')
      .lean();

    if (!show) {
      return next(new ApiError(404, `Show not found with ID: ${id}`));
    }

    // Exclude full seat matrix from basic show metadata
    const { seats, ...showMetadata } = show;

    res.status(200).json(
      new ApiResponse(
        200,
        {
          show: {
            ...showMetadata,
            totalSeats: seats?.length || 0,
            availableSeats: (seats || []).filter((s) => s.status === 'available').length,
          },
        },
        'Show details retrieved'
      )
    );
  } catch (err) {
    next(err);
  }
}

/**
 * Get live seat availability for a show
 * Automatically cleans up expired locks on read
 * GET /api/v1/shows/:id/seats
 */
async function getShowSeats(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new ApiError(400, `Invalid show ID format: ${id}`));
    }

    const show = await Show.findById(id);
    if (!show) {
      return next(new ApiError(404, `Show not found with ID: ${id}`));
    }

    // Lazy cleanup: Release expired locks back to 'available'
    const now = new Date();
    let hasExpiredLocks = false;

    for (const seat of show.seats) {
      if (seat.status === 'locked' && seat.lockExpiresAt && new Date(seat.lockExpiresAt) < now) {
        seat.status = 'available';
        seat.lockedBy = null;
        seat.lockExpiresAt = null;
        hasExpiredLocks = true;
      }
    }

    if (hasExpiredLocks) {
      await show.save();
    }

    // Map seats with current user context (if authenticated, check if lockedBy matches)
    const currentUserId = req.user ? req.user._id.toString() : null;

    const mappedSeats = show.seats.map((seat) => {
      const isLockedByMe = currentUserId && seat.lockedBy?.toString() === currentUserId;

      return {
        _id: seat._id,
        seatId: seat.seatId,
        row: seat.row,
        number: seat.number,
        tier: seat.tier,
        price: seat.price,
        status: seat.status, // available | locked | booked
        isLockedByMe: Boolean(isLockedByMe),
        lockExpiresAt: seat.lockExpiresAt,
      };
    });

    res.status(200).json(
      new ApiResponse(
        200,
        {
          showId: show._id,
          screenName: show.screenName,
          tierPricing: show.tierPricing,
          totalSeats: mappedSeats.length,
          availableCount: mappedSeats.filter((s) => s.status === 'available').length,
          seats: mappedSeats,
        },
        'Seat layout retrieved successfully'
      )
    );
  } catch (err) {
    next(err);
  }
}

module.exports = {
  checkScheduleConflict,
  getShowById,
  getShowSeats,
};

const crypto = require('crypto');
const mongoose = require('mongoose');
const Show = require('../models/Show');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Notification = require('../models/Notification');
const SeatLockService = require('../services/seatLockService');
const { generateTicketQRCode } = require('../services/qrService');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
let socketConfig;
try {
  socketConfig = require('../config/socket');
} catch (e) {
  socketConfig = null;
}

/**
 * Temporarily lock seats (soft hold for 10 minutes)
 * POST /api/v1/bookings/lock-seats
 */
async function lockSeats(req, res, next) {
  try {
    const { showId, seatIds } = req.body;
    if (!showId) {
      return next(new ApiError(400, 'Show ID is required'));
    }

    const lockData = await SeatLockService.lockSeats(showId, seatIds, req.user._id);
    res.status(200).json(new ApiResponse(200, lockData, 'Seats held successfully for 10 minutes'));
  } catch (err) {
    next(err);
  }
}

/**
 * Release temporarily held seats
 * POST /api/v1/bookings/release-seats
 */
async function releaseSeats(req, res, next) {
  try {
    const { showId, seatIds } = req.body;
    if (!showId) {
      return next(new ApiError(400, 'Show ID is required'));
    }

    const releaseData = await SeatLockService.releaseSeats(showId, seatIds, req.user._id);
    res.status(200).json(new ApiResponse(200, releaseData, 'Seats released successfully'));
  } catch (err) {
    next(err);
  }
}

/**
 * Confirm reservation, execute mock payment, generate ticket QR code
 * POST /api/v1/bookings/confirm
 */
async function confirmBooking(req, res, next) {
  try {
    const {
      showId,
      seatIds,
      paymentMethod = 'card_mock',
      cardLastFour = '4242',
    } = req.body;

    if (!showId || !seatIds || !Array.isArray(seatIds) || seatIds.length === 0) {
      return next(new ApiError(400, 'Show ID and a list of seat IDs are required to confirm booking'));
    }

    const normalizedSeatIds = seatIds.map((id) => id.toUpperCase().trim());
    const now = new Date();

    // 1. Fetch show and verify active user lock
    const show = await Show.findById(showId)
      .populate('movie', 'title posterUrl durationMinutes')
      .populate('theatre', 'name city address');

    if (!show) {
      return next(new ApiError(404, `Show not found with ID: ${showId}`));
    }

    // Verify all selected seats are currently locked by this user and not expired
    const selectedSeats = [];
    for (const seatId of normalizedSeatIds) {
      const seat = show.seats.find((s) => s.seatId === seatId);
      if (!seat) {
        return next(new ApiError(400, `Seat ${seatId} does not exist in this show.`));
      }

      const isLockedByMe =
        seat.status === 'locked' &&
        seat.lockedBy?.toString() === req.user._id.toString() &&
        seat.lockExpiresAt &&
        new Date(seat.lockExpiresAt) >= now;

      if (!isLockedByMe) {
        return next(
          new ApiError(
            409,
            `Seat hold expired or unavailable for seat ${seatId}. Please select your seats again.`
          )
        );
      }
      selectedSeats.push(seat);
    }

    // 2. Strict Server-Side Price Calculation (NEVER trust client prices)
    const subTotal = selectedSeats.reduce((acc, seat) => acc + seat.price, 0);
    const convenienceFee = +(selectedSeats.length * 1.5).toFixed(2);
    const tax = +(subTotal * 0.1).toFixed(2);
    const totalAmount = +(subTotal + convenienceFee + tax).toFixed(2);

    // 3. Generate unique alphanumeric booking reference (e.g. IMV-7X9K2P)
    const refCode = crypto.randomBytes(3).toString('hex').toUpperCase();
    const bookingReference = `IMV-${refCode}`;

    // 4. Generate QR-code ticket data URL
    const qrCodeData = await generateTicketQRCode({
      bookingReference,
      userId: req.user._id,
      showId: show._id,
      movieTitle: show.movie.title,
      seatIds: normalizedSeatIds,
    });

    // 5. Create Booking Document
    const booking = new Booking({
      bookingReference,
      user: req.user._id,
      show: show._id,
      movie: show.movie._id,
      theatre: show.theatre._id,
      seats: selectedSeats.map((s) => ({
        seatId: s.seatId,
        row: s.row,
        number: s.number,
        tier: s.tier,
        price: s.price,
      })),
      pricing: {
        subTotal,
        convenienceFee,
        tax,
        totalAmount,
      },
      status: 'confirmed',
      paymentStatus: 'paid',
      qrCodeData,
      bookedAt: now,
    });
    await booking.save();

    // 6. Record Mock Payment (Never collect or store raw card number or CVV)
    const transactionId = `TXN-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const payment = new Payment({
      booking: booking._id,
      user: req.user._id,
      transactionId,
      amount: totalAmount,
      currency: 'USD',
      method: paymentMethod,
      paymentGateway: 'mock_gateway',
      status: 'succeeded',
      safeDetails: {
        lastFourDigits: cardLastFour.slice(-4),
        cardBrand: 'Visa (Mock)',
        maskedIdentifier: `Visa ending in ${cardLastFour.slice(-4)}`,
      },
      paidAt: now,
    });
    await payment.save();

    booking.payment = payment._id;
    await booking.save();

    // 7. Atomic Seat Commitment in Show: Mark status as 'booked'
    for (const seat of selectedSeats) {
      seat.status = 'booked';
      seat.bookingId = booking._id;
      seat.lockedBy = null;
      seat.lockExpiresAt = null;
    }
    await show.save();

    // 8. Create User Transaction Notification
    const notification = new Notification({
      recipient: req.user._id,
      title: 'Booking Confirmed!',
      message: `Your booking (${bookingReference}) for "${show.movie.title}" at ${show.theatre.name} is confirmed. Enjoy the show!`,
      type: 'booking_confirmation',
      metadata: {
        bookingId: booking._id,
        showId: show._id,
        movieId: show.movie._id,
      },
    });
    await notification.save();

    // 9. Real-time broadcast: Broadcast booked seats via Socket.IO
    try {
      if (socketConfig && socketConfig.getIO) {
        const io = socketConfig.getIO();
        io.to(`show_${showId}`).emit('seats_booked', {
          showId,
          seatIds: normalizedSeatIds,
          bookingReference,
        });
      }
    } catch (sockErr) {}

    // Populate response
    const populatedBooking = await Booking.findById(booking._id)
      .populate('movie', 'title posterUrl durationMinutes certification')
      .populate('theatre', 'name city address')
      .populate('payment', 'transactionId method status safeDetails paidAt')
      .lean();

    res.status(201).json(
      new ApiResponse(
        201,
        {
          booking: populatedBooking,
        },
        'Booking confirmed and ticket generated successfully'
      )
    );
  } catch (err) {
    next(err);
  }
}

/**
 * Get authenticated user's bookings with pagination
 * GET /api/v1/bookings/my-bookings
 */
async function getMyBookings(req, res, next) {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(50, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const query = { user: req.user._id };

    const [bookings, totalCount] = await Promise.all([
      Booking.find(query)
        .populate('movie', 'title posterUrl durationMinutes certification')
        .populate('theatre', 'name city address')
        .populate('show', 'startTime endTime screenName')
        .sort('-bookedAt')
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Booking.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalCount / limitNum) || 1;

    res.status(200).json(
      new ApiResponse(
        200,
        {
          bookings,
          pagination: {
            page: pageNum,
            limit: limitNum,
            totalCount,
            totalPages,
          },
        },
        'User bookings retrieved'
      )
    );
  } catch (err) {
    next(err);
  }
}

/**
 * Get single booking details by ID
 * GET /api/v1/bookings/:id
 */
async function getBookingById(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new ApiError(400, `Invalid booking ID format: ${id}`));
    }

    const booking = await Booking.findById(id)
      .populate('movie', 'title posterUrl durationMinutes certification genre language')
      .populate('theatre', 'name city address amenities')
      .populate('show', 'startTime endTime screenName tierPricing')
      .populate('payment', 'transactionId method status safeDetails paidAt')
      .lean();

    if (!booking) {
      return next(new ApiError(404, `Booking not found with ID: ${id}`));
    }

    // Access check: only owner or admin can view
    const isOwner = booking.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return next(new ApiError(403, 'You do not have permission to view this booking.'));
    }

    res.status(200).json(new ApiResponse(200, { booking }, 'Booking details retrieved'));
  } catch (err) {
    next(err);
  }
}

/**
 * Cancel an active booking and release seats
 * POST /api/v1/bookings/:id/cancel
 */
async function cancelBooking(req, res, next) {
  try {
    const { id } = req.params;
    const { reason = 'Cancelled by customer' } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new ApiError(400, `Invalid booking ID format: ${id}`));
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return next(new ApiError(404, `Booking not found with ID: ${id}`));
    }

    // Ownership check
    const isOwner = booking.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return next(new ApiError(403, 'You do not have permission to cancel this booking.'));
    }

    if (booking.status === 'cancelled') {
      return next(new ApiError(400, 'This booking has already been cancelled.'));
    }

    // Check show start time: Cancellation allowed only >= 2 hours before showtime
    const show = await Show.findById(booking.show);
    if (show) {
      const now = new Date();
      const cutoffTime = new Date(show.startTime.getTime() - 2 * 60 * 60 * 1000);

      if (now > cutoffTime && !isAdmin) {
        return next(
          new ApiError(
            400,
            'Bookings can only be cancelled up to 2 hours prior to the scheduled showtime.'
          )
        );
      }

      // Release booked seats back to 'available'
      const seatIdsToRelease = booking.seats.map((s) => s.seatId);
      for (const seat of show.seats) {
        if (seatIdsToRelease.includes(seat.seatId)) {
          seat.status = 'available';
          seat.bookingId = null;
          seat.lockedBy = null;
          seat.lockExpiresAt = null;
        }
      }
      await show.save();

      // Emit Socket.IO release
      try {
        if (socketConfig && socketConfig.getIO) {
          const io = socketConfig.getIO();
          io.to(`show_${show._id}`).emit('seats_released', {
            showId: show._id,
            seatIds: seatIdsToRelease,
          });
        }
      } catch (sockErr) {}
    }

    // Update booking status
    booking.status = 'cancelled';
    booking.paymentStatus = 'refunded';
    booking.cancellation = {
      cancelledAt: new Date(),
      reason,
      refundAmount: booking.pricing.totalAmount,
    };
    await booking.save();

    // Update Payment record if present
    if (booking.payment) {
      await Payment.findByIdAndUpdate(booking.payment, {
        status: 'refunded',
        refundedAt: new Date(),
      });
    }

    // Create Notification
    const notification = new Notification({
      recipient: booking.user,
      title: 'Booking Cancelled',
      message: `Your booking (${booking.bookingReference}) has been cancelled. Refund of $${booking.pricing.totalAmount} has been initiated.`,
      type: 'booking_cancellation',
      metadata: {
        bookingId: booking._id,
        showId: booking.show,
        movieId: booking.movie,
      },
    });
    await notification.save();

    res.status(200).json(
      new ApiResponse(
        200,
        {
          bookingReference: booking.bookingReference,
          status: booking.status,
          refundAmount: booking.pricing.totalAmount,
        },
        'Booking cancelled and seats released successfully'
      )
    );
  } catch (err) {
    next(err);
  }
}

module.exports = {
  lockSeats,
  releaseSeats,
  confirmBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
};

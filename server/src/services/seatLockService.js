const Show = require('../models/Show');
const ApiError = require('../utils/apiError');
const env = require('../config/env');
let socketConfig;
try {
  socketConfig = require('../config/socket');
} catch (e) {
  socketConfig = null;
}

/**
 * Service managing atomic seat locking, lock renewal, and expiration sweeps
 */
class SeatLockService {
  /**
   * Atomically lock a set of seats for a show with a TTL
   * @param {string} showId
   * @param {string[]} seatIds
   * @param {string} userId
   * @returns {Promise<{ expiresAt: Date, seatIds: string[] }>}
   */
  static async lockSeats(showId, seatIds, userId) {
    if (!seatIds || !Array.isArray(seatIds) || seatIds.length === 0) {
      throw new ApiError(400, 'At least one seat must be selected to hold.');
    }

    if (seatIds.length > 8) {
      throw new ApiError(400, 'Maximum of 8 seats can be reserved in a single transaction.');
    }

    const normalizedSeatIds = seatIds.map((id) => id.toUpperCase().trim());
    const now = new Date();
    const holdDurationMs = env.SEAT_HOLD_DURATION_MINUTES * 60 * 1000;
    const expiresAt = new Date(now.getTime() + holdDurationMs);

    // 1. Fetch current show to verify existence and check seat state
    const show = await Show.findById(showId);
    if (!show) {
      throw new ApiError(404, `Show not found with ID: ${showId}`);
    }

    // Verify all requested seat IDs exist in the show
    const existingSeatMap = new Map();
    for (const s of show.seats) {
      existingSeatMap.set(s.seatId, s);
    }

    const missingSeatIds = normalizedSeatIds.filter((id) => !existingSeatMap.has(id));
    if (missingSeatIds.length > 0) {
      throw new ApiError(400, `Requested seat(s) do not exist in this show: ${missingSeatIds.join(', ')}`);
    }

    // 2. Atomic Conditional Update
    // Query condition: For every requested seatId, it must be either available,
    // or if locked, its lock must be expired, or locked by the same user.
    const updateResult = await Show.updateOne(
      {
        _id: showId,
        seats: {
          $all: normalizedSeatIds.map((id) => ({
            $elemMatch: {
              seatId: id,
              $or: [
                { status: 'available' },
                { status: 'locked', lockExpiresAt: { $lt: now } },
                { status: 'locked', lockedBy: userId },
              ],
            },
          })),
        },
      },
      {
        $set: {
          'seats.$[elem].status': 'locked',
          'seats.$[elem].lockedBy': userId,
          'seats.$[elem].lockExpiresAt': expiresAt,
        },
      },
      {
        arrayFilters: [{ 'elem.seatId': { $in: normalizedSeatIds } }],
      }
    );

    // If update failed, determine which exact seats conflicted
    if (updateResult.modifiedCount === 0) {
      // Re-read show to inspect conflicting seats
      const refreshedShow = await Show.findById(showId).lean();
      const conflicts = [];

      for (const id of normalizedSeatIds) {
        const seat = refreshedShow.seats.find((s) => s.seatId === id);
        if (!seat) continue;

        const isUnexpiredLock =
          seat.status === 'locked' &&
          seat.lockExpiresAt &&
          new Date(seat.lockExpiresAt) >= now &&
          seat.lockedBy?.toString() !== userId.toString();

        if (seat.status === 'booked' || isUnexpiredLock) {
          conflicts.push({
            seatId: id,
            status: seat.status,
            reason: seat.status === 'booked' ? 'Already booked' : 'Held by another customer',
          });
        }
      }

      throw new ApiError(
        409,
        `One or more selected seats (${conflicts.map((c) => c.seatId).join(', ')}) are no longer available.`,
        conflicts
      );
    }

    // 3. Emit real-time Socket.IO event to all clients viewing this show
    try {
      if (socketConfig && socketConfig.getIO) {
        const io = socketConfig.getIO();
        io.to(`show_${showId}`).emit('seats_locked', {
          showId,
          seatIds: normalizedSeatIds,
          expiresAt,
        });
      }
    } catch (sockErr) {
      // Non-fatal if socket is uninitialized in test runner
    }

    return {
      showId,
      seatIds: normalizedSeatIds,
      expiresAt,
      holdMinutes: env.SEAT_HOLD_DURATION_MINUTES,
    };
  }

  /**
   * Release locked seats manually or on back-out
   */
  static async releaseSeats(showId, seatIds, userId) {
    if (!seatIds || !Array.isArray(seatIds) || seatIds.length === 0) {
      return { releasedCount: 0 };
    }

    const normalizedSeatIds = seatIds.map((id) => id.toUpperCase().trim());

    const result = await Show.updateOne(
      { _id: showId },
      {
        $set: {
          'seats.$[elem].status': 'available',
          'seats.$[elem].lockedBy': null,
          'seats.$[elem].lockExpiresAt': null,
        },
      },
      {
        arrayFilters: [
          {
            'elem.seatId': { $in: normalizedSeatIds },
            'elem.status': 'locked',
            'elem.lockedBy': userId,
          },
        ],
      }
    );

    // Emit Socket.IO release event
    try {
      if (socketConfig && socketConfig.getIO) {
        const io = socketConfig.getIO();
        io.to(`show_${showId}`).emit('seats_released', {
          showId,
          seatIds: normalizedSeatIds,
        });
      }
    } catch (sockErr) {}

    return { releasedCount: result.modifiedCount };
  }

  /**
   * Clean up expired locks across all shows
   */
  static async cleanupExpiredLocks(showId = null) {
    const now = new Date();
    const query = {
      'seats.status': 'locked',
      'seats.lockExpiresAt': { $lt: now },
    };

    if (showId) {
      query._id = showId;
    }

    const shows = await Show.find(query);
    let totalCleaned = 0;

    for (const show of shows) {
      const releasedSeatIds = [];
      for (const seat of show.seats) {
        if (seat.status === 'locked' && seat.lockExpiresAt && new Date(seat.lockExpiresAt) < now) {
          seat.status = 'available';
          seat.lockedBy = null;
          seat.lockExpiresAt = null;
          releasedSeatIds.push(seat.seatId);
          totalCleaned++;
        }
      }

      if (releasedSeatIds.length > 0) {
        await show.save();
        try {
          if (socketConfig && socketConfig.getIO) {
            const io = socketConfig.getIO();
            io.to(`show_${show._id}`).emit('seats_released', {
              showId: show._id,
              seatIds: releasedSeatIds,
            });
          }
        } catch (sockErr) {}
      }
    }

    return totalCleaned;
  }
}

module.exports = SeatLockService;

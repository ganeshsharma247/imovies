const mongoose = require('mongoose');

const showSeatSchema = new mongoose.Schema(
  {
    seatId: {
      type: String,
      required: [true, 'Seat ID is required (e.g. A-1)'],
      trim: true,
      uppercase: true,
    },
    row: {
      type: String,
      required: [true, 'Row label is required'],
      trim: true,
      uppercase: true,
    },
    number: {
      type: Number,
      required: [true, 'Seat number is required'],
      min: [1, 'Seat number must be at least 1'],
    },
    tier: {
      type: String,
      enum: {
        values: ['silver', 'gold', 'platinum'],
        message: 'Tier must be silver, gold, or platinum',
      },
      default: 'silver',
    },
    price: {
      type: Number,
      required: [true, 'Seat price is required'],
      min: [0, 'Seat price cannot be negative'],
    },
    status: {
      type: String,
      enum: {
        values: ['available', 'locked', 'booked'],
        message: 'Seat status must be available, locked, or booked',
      },
      default: 'available',
      index: true,
    },
    lockedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    lockExpiresAt: {
      type: Date,
      default: null,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      default: null,
    },
  },
  { _id: true }
);

const showSchema = new mongoose.Schema(
  {
    movie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Movie',
      required: [true, 'Referenced Movie is required'],
      index: true,
    },
    theatre: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Theatre',
      required: [true, 'Referenced Theatre is required'],
      index: true,
    },
    screenName: {
      type: String,
      required: [true, 'Screen name is required'],
      trim: true,
    },
    startTime: {
      type: Date,
      required: [true, 'Show start time is required'],
      index: true,
    },
    endTime: {
      type: Date,
      required: [true, 'Show end time is required'],
    },
    tierPricing: {
      silver: { type: Number, required: true, min: [0, 'Price cannot be negative'] },
      gold: { type: Number, required: true, min: [0, 'Price cannot be negative'] },
      platinum: { type: Number, required: true, min: [0, 'Price cannot be negative'] },
    },
    seats: {
      type: [showSeatSchema],
      validate: {
        validator: (seats) => Array.isArray(seats) && seats.length > 0,
        message: 'A show must have seat inventory initialized',
      },
    },
    status: {
      type: String,
      enum: {
        values: ['scheduled', 'running', 'completed', 'cancelled'],
        message: 'Status must be scheduled, running, completed, or cancelled',
      },
      default: 'scheduled',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-validate hook: Ensure endTime is strictly after startTime & check seatId uniqueness
showSchema.pre('validate', function (next) {
  // 1. Time validation
  if (this.startTime && this.endTime) {
    if (new Date(this.endTime) <= new Date(this.startTime)) {
      this.invalidate('endTime', 'Show end time must be chronologically after the start time');
    }
  }

  // 2. Prevent duplicate seat IDs within this show's seat inventory
  if (this.seats && this.seats.length > 0) {
    const seenSeats = new Set();
    for (const seat of this.seats) {
      const normalizedSeatId = seat.seatId ? seat.seatId.toUpperCase().trim() : '';
      if (seenSeats.has(normalizedSeatId)) {
        this.invalidate('seats', `Duplicate seat identifier detected within show: ${normalizedSeatId}`);
        break;
      }
      seenSeats.add(normalizedSeatId);
    }
  }

  next();
});

// Compound indexes for schedule queries and screening overlap checks
showSchema.index({ theatre: 1, startTime: 1 });
showSchema.index({ movie: 1, startTime: 1 });
showSchema.index({ _id: 1, 'seats.seatId': 1, 'seats.status': 1 });

const Show = mongoose.model('Show', showSchema);

module.exports = Show;

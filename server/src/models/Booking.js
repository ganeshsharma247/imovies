const mongoose = require('mongoose');

const bookedSeatSchema = new mongoose.Schema(
  {
    seatId: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    row: {
      type: String,
      required: true,
    },
    number: {
      type: Number,
      required: true,
    },
    tier: {
      type: String,
      enum: ['silver', 'gold', 'platinum'],
      default: 'silver',
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const bookingSchema = new mongoose.Schema(
  {
    bookingReference: {
      type: String,
      required: [true, 'Unique booking reference is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Booking must be associated with a User'],
      index: true,
    },
    show: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Show',
      required: [true, 'Booking must be associated with a Show'],
      index: true,
    },
    movie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Movie',
      required: [true, 'Booking must be associated with a Movie'],
    },
    theatre: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Theatre',
      required: [true, 'Booking must be associated with a Theatre'],
    },
    seats: {
      type: [bookedSeatSchema],
      validate: {
        validator: (seats) => Array.isArray(seats) && seats.length > 0,
        message: 'A booking must contain at least one seat',
      },
    },
    pricing: {
      subTotal: {
        type: Number,
        required: true,
        min: [0, 'Subtotal cannot be negative'],
      },
      convenienceFee: {
        type: Number,
        default: 0,
        min: [0, 'Convenience fee cannot be negative'],
      },
      tax: {
        type: Number,
        default: 0,
        min: [0, 'Tax cannot be negative'],
      },
      totalAmount: {
        type: Number,
        required: true,
        min: [0, 'Total amount cannot be negative'],
      },
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'confirmed', 'cancelled'],
        message: 'Status must be pending, confirmed, or cancelled',
      },
      default: 'pending',
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: {
        values: ['unpaid', 'paid', 'refunded', 'failed'],
        message: 'Payment status must be unpaid, paid, refunded, or failed',
      },
      default: 'unpaid',
      index: true,
    },
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      default: null,
    },
    qrCodeData: {
      type: String,
      default: null,
    },
    cancellation: {
      cancelledAt: { type: Date, default: null },
      reason: { type: String, default: null },
      refundAmount: { type: Number, default: 0 },
    },
    bookedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
bookingSchema.index({ user: 1, bookedAt: -1 });
bookingSchema.index({ show: 1, status: 1 });

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;

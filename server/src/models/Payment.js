const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'Payment must be associated with a Booking'],
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Payment must be associated with a User'],
      index: true,
    },
    transactionId: {
      type: String,
      required: [true, 'Unique transaction identifier is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true,
      trim: true,
    },
    method: {
      type: String,
      required: [true, 'Payment method is required'],
      enum: {
        values: ['card_mock', 'upi_mock', 'netbanking_mock', 'wallet_mock'],
        message: 'Invalid payment method ({VALUE})',
      },
    },
    paymentGateway: {
      type: String,
      default: 'mock_gateway',
    },
    status: {
      type: String,
      enum: {
        values: ['initiated', 'pending', 'succeeded', 'failed', 'refunded'],
        message: 'Invalid payment status ({VALUE})',
      },
      default: 'initiated',
      index: true,
    },
    // STRICT SECURITY: Store only non-sensitive tokens/masked representations.
    // NEVER store raw credit/debit card numbers or CVV.
    safeDetails: {
      lastFourDigits: {
        type: String,
        match: [/^\d{4}$/, 'Last four digits must be exactly 4 numeric characters'],
        default: null,
      },
      cardBrand: {
        type: String,
        trim: true,
        default: null,
      },
      maskedIdentifier: {
        type: String,
        trim: true,
        default: null,
      },
    },
    // Explicit security guard fields: If any caller tries to set these, validation will immediately fail.
    cardNumber: {
      type: String,
      validate: {
        validator: (v) => v === undefined || v === null,
        message: "Security policy violation: Prohibited sensitive card data field 'cardNumber' detected!",
      },
      select: false,
    },
    cvv: {
      type: String,
      validate: {
        validator: (v) => v === undefined || v === null,
        message: "Security policy violation: Prohibited sensitive card data field 'cvv' detected!",
      },
      select: false,
    },
    gatewayResponse: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    paidAt: {
      type: Date,
      default: null,
    },
    refundedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;

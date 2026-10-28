const mongoose = require('mongoose');

const screenRowSchema = new mongoose.Schema(
  {
    rowLabel: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    tier: {
      type: String,
      enum: ['silver', 'gold', 'platinum'],
      default: 'silver',
    },
    seatsCount: {
      type: Number,
      required: true,
      min: [1, 'Row must have at least 1 seat'],
    },
  },
  { _id: false }
);

const screenSchema = new mongoose.Schema(
  {
    screenNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    name: {
      type: String,
      required: [true, 'Screen name is required'],
      trim: true,
    },
    format: {
      type: String,
      enum: ['2D', '3D', 'IMAX 2D', 'IMAX 3D', '4DX', 'Dolby Cinema'],
      default: '2D',
    },
    totalSeats: {
      type: Number,
      required: true,
      min: [1, 'Screen must have at least 1 seat'],
    },
    seatLayout: {
      rows: [screenRowSchema],
    },
  },
  { _id: true }
);

const theatreSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Theatre name is required'],
      trim: true,
      index: true,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      index: true,
    },
    state: {
      type: String,
      trim: true,
      default: null,
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0],
      },
    },
    amenities: {
      type: [String],
      default: ['Dolby Atmos', 'Recliners', 'Cafeteria'],
    },
    screens: {
      type: [screenSchema],
      validate: {
        validator: (screens) => Array.isArray(screens) && screens.length > 0,
        message: 'A theatre must have at least one screen',
      },
    },
    totalCapacity: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Calculate totalCapacity before saving
theatreSchema.pre('save', function (next) {
  if (this.screens && this.screens.length > 0) {
    this.totalCapacity = this.screens.reduce((acc, screen) => acc + (screen.totalSeats || 0), 0);
  }
  next();
});

const Theatre = mongoose.model('Theatre', theatreSchema);

module.exports = Theatre;

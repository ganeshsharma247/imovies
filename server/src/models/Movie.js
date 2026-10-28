const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Movie title is required'],
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Movie synopsis/description is required'],
      trim: true,
    },
    posterUrl: {
      type: String,
      required: [true, 'Movie poster image URL is required'],
      trim: true,
    },
    bannerUrl: {
      type: String,
      trim: true,
      default: null,
    },
    trailerUrl: {
      type: String,
      trim: true,
      default: null,
    },
    genre: {
      type: [String],
      required: [true, 'At least one genre is required'],
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: 'A movie must have at least one genre',
      },
      index: true,
    },
    language: {
      type: [String],
      required: [true, 'At least one language is required'],
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: 'A movie must specify at least one language',
      },
      index: true,
    },
    durationMinutes: {
      type: Number,
      required: [true, 'Duration in minutes is required'],
      min: [1, 'Duration must be at least 1 minute'],
    },
    releaseDate: {
      type: Date,
      required: [true, 'Release date is required'],
    },
    certification: {
      type: String,
      required: [true, 'Film certification rating is required'],
      enum: {
        values: ['U', 'UA', 'A', 'R', 'PG-13', 'PG', 'G'],
        message: 'Invalid certification rating ({VALUE})',
      },
    },
    status: {
      type: String,
      enum: {
        values: ['now_showing', 'coming_soon', 'ended'],
        message: 'Status must be now_showing, coming_soon, or ended',
      },
      default: 'now_showing',
      index: true,
    },
    rating: {
      type: Number,
      min: [0, 'Rating cannot be negative'],
      max: [10, 'Rating cannot exceed 10'],
      default: 0,
    },
    director: {
      type: String,
      trim: true,
      default: null,
    },
    cast: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Compound text index for title & description search (language_override: 'none' prevents collision with array-based language field)
movieSchema.index({ title: 'text', description: 'text' }, { language_override: 'none' });

const Movie = mongoose.model('Movie', movieSchema);

module.exports = Movie;

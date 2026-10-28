const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const env = {
  PORT: process.env.PORT || 5001,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/imovies',
  USE_MEMORY_DB_FALLBACK: process.env.USE_MEMORY_DB_FALLBACK !== 'false',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  JWT_SECRET: process.env.JWT_SECRET || 'dev_secret_fallback_key',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  SEAT_HOLD_DURATION_MINUTES: parseInt(process.env.SEAT_HOLD_DURATION_MINUTES || '10', 10),
};

module.exports = env;

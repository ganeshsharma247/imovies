const rateLimit = require('express-rate-limit');
const env = require('../config/env');
const ApiError = require('../utils/apiError');

/**
 * Rate limiter for authentication endpoints (login, register)
 * Prevents automated credential stuffing and brute force attacks.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 20, // Limit each IP to 20 auth attempts per window
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  skip: () => env.NODE_ENV === 'test', // Bypass in test runner to allow rapid test execution
  handler: (req, res, next) => {
    next(new ApiError(429, 'Too many authentication attempts from this IP. Please try again after 15 minutes.'));
  },
});

module.exports = {
  authLimiter,
};

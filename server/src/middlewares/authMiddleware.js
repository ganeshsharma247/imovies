const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');
const ApiError = require('../utils/apiError');

/**
 * Middleware to protect routes: Verifies JWT token and attaches current user to req.user
 */
async function protect(req, res, next) {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new ApiError(401, 'Authentication required. Please provide a valid Bearer token.'));
    }

    // Verify token
    let decoded;
    try {
      decoded = await verifyToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return next(new ApiError(401, 'Authentication token has expired. Please log in again.'));
      }
      return next(new ApiError(401, 'Invalid authentication token.'));
    }

    // Check if user still exists
    const user = await User.findById(decoded.id);
    if (!user) {
      return next(new ApiError(401, 'The account associated with this token no longer exists.'));
    }

    // Attach authenticated user to request
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Middleware for Role-Based Access Control (RBAC)
 * Restricts access to specific roles (e.g. 'admin')
 */
function restrictTo(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required before checking permissions.'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError(
          403,
          `Access forbidden: You do not have permission to perform this action. Required role: ${roles.join(' or ')}.`
        )
      );
    }

    next();
  };
}

module.exports = {
  protect,
  restrictTo,
};

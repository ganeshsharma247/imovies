const User = require('../models/User');
const { signToken } = require('../utils/jwt');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');

/**
 * Register a new user
 * POST /api/v1/auth/register
 */
async function register(req, res, next) {
  try {
    const { name, email, password, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new ApiError(409, 'An account with this email address already exists.'));
    }

    // Create user (password is automatically hashed via Mongoose pre-save hook)
    const user = new User({
      name,
      email,
      password,
      phone,
      role: 'user', // Defaults to regular user
    });
    await user.save();

    // Generate JWT token
    const token = signToken(user);

    res.status(201).json(
      new ApiResponse(
        201,
        {
          user: user.toJSON(),
          token,
        },
        'Registration successful. Welcome to IMovies!'
      )
    );
  } catch (err) {
    next(err);
  }
}

/**
 * Authenticate user & issue JWT
 * POST /api/v1/auth/login
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    // Retrieve user including the password hash for verification
    const user = await User.findOne({ email }).select('+password');

    // Generic error to avoid revealing whether email exists
    if (!user || !(await user.comparePassword(password))) {
      return next(new ApiError(401, 'Invalid email or password.'));
    }

    // Generate JWT token
    const token = signToken(user);

    res.status(200).json(
      new ApiResponse(
        200,
        {
          user: user.toJSON(),
          token,
        },
        'Login successful.'
      )
    );
  } catch (err) {
    next(err);
  }
}

/**
 * Get current authenticated user profile
 * GET /api/v1/auth/me
 */
async function getMe(req, res, next) {
  try {
    res.status(200).json(
      new ApiResponse(
        200,
        {
          user: req.user.toJSON(),
        },
        'Current user profile retrieved successfully.'
      )
    );
  } catch (err) {
    next(err);
  }
}

/**
 * Update authenticated user profile
 * PUT /api/v1/auth/profile
 */
async function updateProfile(req, res, next) {
  try {
    const { name, phone, currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
      return next(new ApiError(404, 'User account not found.'));
    }

    if (name !== undefined) user.name = name.trim();
    if (phone !== undefined) user.phone = phone ? String(phone).trim() : null;

    // Handle password update if requested
    if (newPassword) {
      const isCurrentValid = await user.comparePassword(currentPassword);
      if (!isCurrentValid) {
        return next(new ApiError(401, 'Current password verification failed.'));
      }
      user.password = newPassword; // Will be re-hashed by pre('save') hook
    }

    await user.save();

    res.status(200).json(
      new ApiResponse(
        200,
        {
          user: user.toJSON(),
        },
        'Profile updated successfully.'
      )
    );
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
};

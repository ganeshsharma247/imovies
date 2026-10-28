const ApiError = require('../utils/apiError');

/**
 * Validates registration payload
 */
function validateRegister(req, res, next) {
  const { name, email, password, phone, role } = req.body;
  const errors = [];

  // Name validation
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.push('Name is required and must be at least 2 characters long');
  } else if (name.trim().length > 50) {
    errors.push('Name cannot exceed 50 characters');
  }

  // Email validation
  const emailRegex = /^\S+@\S+\.\S+$/;
  if (!email || typeof email !== 'string' || !emailRegex.test(email.trim())) {
    errors.push('A valid email address is required');
  }

  // Password validation
  if (!password || typeof password !== 'string' || password.length < 6) {
    errors.push('Password is required and must be at least 6 characters long');
  }

  // Privilege escalation guard
  if (role && role === 'admin') {
    errors.push('Admin role cannot be self-assigned during registration');
  }

  if (errors.length > 0) {
    return next(new ApiError(400, 'Validation failed for registration input', errors));
  }

  req.body.name = name.trim();
  req.body.email = email.trim().toLowerCase();
  req.body.phone = phone ? String(phone).trim() : null;
  req.body.role = 'user'; // Explicitly force default user role

  next();
}

/**
 * Validates login payload
 */
function validateLogin(req, res, next) {
  const { email, password } = req.body;
  const errors = [];

  if (!email || typeof email !== 'string' || !email.trim()) {
    errors.push('Email is required');
  }

  if (!password || typeof password !== 'string') {
    errors.push('Password is required');
  }

  if (errors.length > 0) {
    return next(new ApiError(400, 'Validation failed for login input', errors));
  }

  req.body.email = email.trim().toLowerCase();
  next();
}

/**
 * Validates profile update payload
 */
function validateUpdateProfile(req, res, next) {
  const { name, phone, currentPassword, newPassword } = req.body;
  const errors = [];

  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length < 2) {
      errors.push('Name must be at least 2 characters long');
    } else if (name.trim().length > 50) {
      errors.push('Name cannot exceed 50 characters');
    }
  }

  if (newPassword !== undefined) {
    if (!currentPassword) {
      errors.push('Current password is required to change your password');
    }
    if (typeof newPassword !== 'string' || newPassword.length < 6) {
      errors.push('New password must be at least 6 characters long');
    }
  }

  if (errors.length > 0) {
    return next(new ApiError(400, 'Validation failed for profile update', errors));
  }

  next();
}

module.exports = {
  validateRegister,
  validateLogin,
  validateUpdateProfile,
};

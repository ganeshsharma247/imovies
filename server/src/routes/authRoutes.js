const express = require('express');
const { register, login, getMe, updateProfile } = require('../controllers/authController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');
const { authLimiter } = require('../middlewares/rateLimiter');
const {
  validateRegister,
  validateLogin,
  validateUpdateProfile,
} = require('../validations/authValidation');
const ApiResponse = require('../utils/apiResponse');

const router = express.Router();

// Public routes with rate limiting and input validation
router.post('/register', authLimiter, validateRegister, register);
router.post('/login', authLimiter, validateLogin, login);

// Protected routes (requires valid JWT token)
router.get('/me', protect, getMe);
router.put('/profile', protect, validateUpdateProfile, updateProfile);

// Role authorization verification route (Admin only)
router.get('/admin-check', protect, restrictTo('admin'), (req, res) => {
  res.status(200).json(
    new ApiResponse(
      200,
      {
        verified: true,
        adminUser: req.user.email,
        role: req.user.role,
      },
      'Admin role verification successful'
    )
  );
});

module.exports = router;

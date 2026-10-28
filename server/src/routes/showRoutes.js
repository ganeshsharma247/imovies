const express = require('express');
const { getShowById, getShowSeats } = require('../controllers/showController');
const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');

const router = express.Router();

// Optional authentication to identify if seats are locked by the current user
async function optionalAuth(req, res, next) {
  try {
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = await verifyToken(token);
      const user = await User.findById(decoded.id);
      if (user) req.user = user;
    }
  } catch (err) {
    // Ignore invalid/expired token on public seat map read
  }
  next();
}

router.get('/:id', getShowById);
router.get('/:id/seats', optionalAuth, getShowSeats);

module.exports = router;

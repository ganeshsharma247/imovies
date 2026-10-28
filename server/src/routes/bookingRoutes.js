const express = require('express');
const {
  lockSeats,
  releaseSeats,
  confirmBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
} = require('../controllers/bookingController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

// All booking operations require an authenticated user
router.use(protect);

router.post('/lock-seats', lockSeats);
router.post('/release-seats', releaseSeats);
router.post('/confirm', confirmBooking);
router.get('/my-bookings', getMyBookings);
router.get('/:id', getBookingById);
router.post('/:id/cancel', cancelBooking);

module.exports = router;

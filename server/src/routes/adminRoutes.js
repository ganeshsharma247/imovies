const express = require('express');
const {
  getAdminStats,
  createMovie,
  updateMovie,
  deleteMovie,
  createTheatre,
  updateTheatre,
  createShow,
  deleteShow,
  getAllBookings,
} = require('../controllers/adminController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

const router = express.Router();

// Strict RBAC: All admin routes require authenticated user with role 'admin'
router.use(protect);
router.use(restrictTo('admin'));

router.get('/stats', getAdminStats);
router.post('/movies', createMovie);
router.put('/movies/:id', updateMovie);
router.delete('/movies/:id', deleteMovie);
router.post('/theatres', createTheatre);
router.put('/theatres/:id', updateTheatre);
router.post('/shows', createShow);
router.delete('/shows/:id', deleteShow);
router.get('/bookings', getAllBookings);

module.exports = router;

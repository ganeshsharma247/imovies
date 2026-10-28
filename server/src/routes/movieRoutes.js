const express = require('express');
const { getMovies, getMovieById, getMovieShows } = require('../controllers/movieController');

const router = express.Router();

router.get('/', getMovies);
router.get('/:id', getMovieById);
router.get('/:id/shows', getMovieShows);

module.exports = router;

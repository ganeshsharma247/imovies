const express = require('express');
const { getTheatres, getTheatreById, getTheatreShows } = require('../controllers/theatreController');

const router = express.Router();

router.get('/', getTheatres);
router.get('/:id', getTheatreById);
router.get('/:id/shows', getTheatreShows);

module.exports = router;

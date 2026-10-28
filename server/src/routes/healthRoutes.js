const express = require('express');
const { getDBStatus } = require('../config/db');
const env = require('../config/env');
const ApiResponse = require('../utils/apiResponse');

const router = express.Router();

router.get('/health', (req, res) => {
  const dbStatus = getDBStatus();

  const healthData = {
    service: 'IMovies Backend API',
    status: dbStatus.state === 'connected' ? 'healthy' : 'degraded',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    database: dbStatus,
    config: {
      seatHoldDurationMinutes: env.SEAT_HOLD_DURATION_MINUTES,
      jwtExpiresIn: env.JWT_EXPIRES_IN,
    },
  };

  const statusCode = dbStatus.state === 'connected' ? 200 : 503;
  res.status(statusCode).json(new ApiResponse(statusCode, healthData, 'System health status'));
});

module.exports = router;

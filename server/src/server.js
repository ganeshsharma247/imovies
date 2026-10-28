const http = require('http');
const app = require('./app');
const env = require('./config/env');
const { connectDB, disconnectDB } = require('./config/db');
const { initSocket } = require('./config/socket');

const httpServer = http.createServer(app);

// Initialize Socket.IO
initSocket(httpServer);

async function startServer() {
  try {
    // Connect to database (with fallback)
    await connectDB();

    // Auto-seed initial catalog if database is empty
    try {
      const { Movie } = require('./models');
      const { seedDatabase } = require('../seed/seeder');
      const movieCount = await Movie.countDocuments();
      if (movieCount === 0) {
        console.log('🌱 Database is empty. Running initial database seed...');
        await seedDatabase({ log: true });
        console.log('✅ Initial database seed completed successfully.');
      } else {
        console.log(`🎬 Database contains ${movieCount} movies. Skipping initial seed.`);
      }
    } catch (seedErr) {
      console.warn('⚠️ Auto-seed notice:', seedErr.message);
    }

    httpServer.listen(env.PORT, () => {
      console.log(`===============================================`);
      console.log(`🎬 IMovies Server running in [${env.NODE_ENV}] mode`);
      console.log(`📡 Listening on http://localhost:${env.PORT}`);
      console.log(`🩺 Health check: http://localhost:${env.PORT}/api/v1/health`);
      console.log(`⏱️  Seat hold window: ${env.SEAT_HOLD_DURATION_MINUTES} minutes`);
      console.log(`===============================================`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

// Graceful shutdown handling
async function gracefulShutdown(signal) {
  console.log(`\nReceived ${signal}. Gracefully shutting down IMovies server...`);
  httpServer.close(async () => {
    console.log('HTTP server closed.');
    await disconnectDB();
    process.exit(0);
  });

  // Force close after 10s if graceful shutdown hangs
  setTimeout(() => {
    console.error('Forced shutdown due to timeout.');
    process.exit(1);
  }, 10000);
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

startServer();

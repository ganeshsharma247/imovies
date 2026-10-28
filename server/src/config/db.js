const mongoose = require('mongoose');
const env = require('./env');

let memoryServerInstance = null;

/**
 * Connect to MongoDB with automatic fallback to MongoMemoryServer
 * for zero-friction local development if a local mongod daemon is not running.
 */
async function connectDB() {
  const uri = env.MONGODB_URI;

  try {
    // Attempt connecting to the configured MongoDB URI with a short serverSelectionTimeout
    console.log(`[DB] Attempting connection to MongoDB at: ${uri}`);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2500,
    });
    console.log(`[DB] Successfully connected to MongoDB: ${mongoose.connection.host}`);
    return { type: 'external', uri };
  } catch (err) {
    console.warn(`[DB] Could not connect to external MongoDB: ${err.message}`);

    if (env.USE_MEMORY_DB_FALLBACK) {
      console.log('[DB] Initializing embedded in-memory MongoDB fallback...');
      try {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        memoryServerInstance = await MongoMemoryServer.create();
        const memUri = memoryServerInstance.getUri();
        await mongoose.connect(memUri);
        console.log(`[DB] Successfully connected to In-Memory MongoDB: ${memUri}`);
        return { type: 'in-memory', uri: memUri };
      } catch (memErr) {
        console.error('[DB] Failed to launch In-Memory MongoDB:', memErr.message);
        throw memErr;
      }
    } else {
      throw err;
    }
  }
}

async function disconnectDB() {
  try {
    await mongoose.disconnect();
    if (memoryServerInstance) {
      await memoryServerInstance.stop();
    }
    console.log('[DB] Disconnected from MongoDB.');
  } catch (err) {
    console.error('[DB] Error disconnecting from MongoDB:', err.message);
  }
}

function getDBStatus() {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const stateCode = mongoose.connection.readyState;
  return {
    state: states[stateCode] || 'unknown',
    isInMemory: !!memoryServerInstance,
    host: mongoose.connection.host || null,
    name: mongoose.connection.name || null,
  };
}

module.exports = {
  connectDB,
  disconnectDB,
  getDBStatus,
};

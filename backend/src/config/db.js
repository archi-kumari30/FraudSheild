const mongoose = require('mongoose');
const config = require('./index');

let isConnected = false;

// Attach persistent event listeners to Mongoose connection
mongoose.connection.on('connected', () => {
  isConnected = true;
  if (config.nodeEnv !== 'test') {
    console.log('[DATABASE] MongoDB connection established successfully.');
  }
});

mongoose.connection.on('error', (err) => {
  isConnected = false;
  console.error('[DATABASE ERROR] MongoDB connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  isConnected = false;
  if (config.nodeEnv !== 'test') {
    console.warn('[DATABASE WARNING] MongoDB connection disconnected.');
  }
});

/**
 * Connect to MongoDB instance
 * @param {string} [customUri] - Optional override connection string for tests
 * @returns {Promise<typeof mongoose>}
 */
const connectDB = async (customUri) => {
  const uri = customUri || config.mongodbUri;

  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  try {
    const conn = await mongoose.connect(uri);
    return conn;
  } catch (error) {
    console.error(`[DATABASE CRITICAL] Failed to connect to MongoDB at ${uri}:`, error.message);
    if (config.nodeEnv !== 'test') {
      process.exit(1);
    }
    throw error;
  }
};

/**
 * Disconnect cleanly from MongoDB instance
 * @returns {Promise<void>}
 */
const disconnectDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    isConnected = false;
  }
};

/**
 * Returns current database connection health state
 * @returns {'connected' | 'disconnected' | 'connecting'}
 */
const getDBStatus = () => {
  switch (mongoose.connection.readyState) {
    case 1:
      return 'connected';
    case 2:
      return 'connecting';
    default:
      return 'disconnected';
  }
};

module.exports = {
  connectDB,
  disconnectDB,
  getDBStatus
};

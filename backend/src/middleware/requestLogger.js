const morgan = require('morgan');
const config = require('../config');

/**
 * Request logging middleware
 */
const requestLogger = () => {
  if (config.nodeEnv === 'development') {
    return morgan('dev');
  }
  // In test environment or production, suppress or use combined format
  if (config.nodeEnv === 'production') {
    return morgan('combined');
  }
  // No-op for test environment to keep test output clean
  return (req, res, next) => next();
};

module.exports = requestLogger;

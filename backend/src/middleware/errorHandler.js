const config = require('../config');
const { errorResponse } = require('../utils/apiResponse');

/**
 * Middleware to catch 404 Not Found routes
 */
const notFoundHandler = (req, res, next) => {
  return errorResponse(res, 404, 'Route not found', 'NOT_FOUND');
};

/**
 * Centralized global error handling middleware
 */
const errorHandler = (err, req, res, next) => { // eslint-disable-line no-unused-vars
  const isProduction = config.nodeEnv === 'production';

  // Handle Payload Too Large (express.json limit exceeded)
  if (err.type === 'entity.too.large' || err.status === 413) {
    return errorResponse(res, 413, 'Request payload too large (max limit: 10kb)', 'PAYLOAD_TOO_LARGE');
  }

  // Handle JSON Syntax Errors in request body
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return errorResponse(res, 400, 'Invalid JSON payload format', 'INVALID_JSON');
  }

  // Determine status code
  const statusCode = err.statusCode || err.status || 500;

  // Mask internal server error details in production
  let message = err.message || 'Internal server error';
  if (statusCode === 500 && isProduction) {
    message = 'Internal server error';
  }

  const errorCode = err.code || (statusCode === 500 ? 'INTERNAL_ERROR' : 'ERROR');

  // Build details (only in non-production environments if available)
  let details = null;
  if (!isProduction && err.stack) {
    details = { stack: err.stack };
  }

  if (statusCode === 500 && config.nodeEnv !== 'test') {
    console.error('[SERVER ERROR]', err);
  }

  return errorResponse(res, statusCode, message, errorCode, details);
};

module.exports = {
  notFoundHandler,
  errorHandler
};

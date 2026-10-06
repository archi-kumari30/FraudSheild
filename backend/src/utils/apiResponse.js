/**
 * Formats standard success JSON response
 * @param {import('express').Response} res
 * @param {number} statusCode
 * @param {string} message
 * @param {any} [data=null]
 */
const successResponse = (res, statusCode, message, data = null) => {
  const payload = {
    success: true,
    message
  };

  if (data !== null && data !== undefined) {
    payload.data = data;
  }

  return res.status(statusCode).json(payload);
};

/**
 * Formats standard error JSON response
 * @param {import('express').Response} res
 * @param {number} statusCode
 * @param {string} message
 * @param {string} [code='ERROR']
 * @param {any} [details=null]
 */
const errorResponse = (res, statusCode, message, code = 'ERROR', details = null) => {
  const payload = {
    success: false,
    error: {
      message,
      code
    }
  };

  if (details !== null && details !== undefined) {
    payload.error.details = details;
    payload.data = details;
  }

  return res.status(statusCode).json(payload);
};

module.exports = {
  successResponse,
  errorResponse
};

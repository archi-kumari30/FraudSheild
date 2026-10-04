const { verifyToken } = require('../utils/token');
const { errorResponse } = require('../utils/apiResponse');
const User = require('../models/User');

/**
 * Authenticate incoming Bearer JWT token
 */
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return errorResponse(res, 401, 'Authentication token required', 'TOKEN_MISSING');
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return errorResponse(res, 401, 'Authentication token required', 'TOKEN_MISSING');
  }

  try {
    const decoded = verifyToken(token);

    // Verify user exists and is active
    const user = await User.findById(decoded.id);
    if (!user) {
      return errorResponse(res, 401, 'User no longer exists', 'USER_NOT_FOUND');
    }

    if (!user.isActive) {
      return errorResponse(res, 403, 'Account is inactive', 'ACCOUNT_INACTIVE');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return errorResponse(res, 401, 'Authentication token expired', 'TOKEN_EXPIRED');
    }
    return errorResponse(res, 401, 'Invalid authentication token', 'TOKEN_INVALID');
  }
};

/**
 * Authorize specified roles (RBAC guard)
 * @param {Array<string>} allowedRoles - e.g. ['admin']
 */
const authorizeRole = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 401, 'Authentication required', 'AUTHENTICATION_REQUIRED');
    }

    if (!allowedRoles.includes(req.user.role)) {
      return errorResponse(res, 403, 'Access denied: insufficient permissions', 'FORBIDDEN');
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  authorizeRole
};

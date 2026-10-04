const User = require('../models/User');
const walletService = require('../services/walletService');
const auditService = require('../services/auditService');
const { generateToken } = require('../utils/token');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * Register a new customer
 * POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return errorResponse(res, 409, 'Email already registered', 'EMAIL_EXISTS');
    }

    // Hash password
    const passwordHash = await User.hashPassword(password);

    // Strictly enforce role as 'customer' regardless of payload input
    const user = new User({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: 'customer'
    });

    await user.save();

    // Automatically provision simulated INR wallet for customer
    await walletService.createWallet(user._id);

    const token = generateToken(user);

    return successResponse(
      res,
      201,
      'User registered successfully',
      {
        token,
        user
      }
    );
  } catch (error) {
    if (error.code === 11000) {
      return errorResponse(res, 409, 'Email already registered', 'EMAIL_EXISTS');
    }
    next(error);
  }
};

/**
 * Authenticate existing user
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const ipAddress = req.ip || req.connection?.remoteAddress || 'unknown';

    const user = await User.findOne({ email: email ? email.toLowerCase() : '' });

    if (!user) {
      await auditService.logEvent({
        eventType: 'AUTH_LOGIN_FAILURE',
        actorId: null,
        actorRole: 'system',
        metadata: { email: email ? email.toLowerCase() : 'unknown', reason: 'USER_NOT_FOUND' },
        ipAddress
      });
      return errorResponse(res, 401, 'Invalid email or password', 'INVALID_CREDENTIALS');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await auditService.logEvent({
        eventType: 'AUTH_LOGIN_FAILURE',
        actorId: user._id,
        actorRole: user.role,
        targetEntity: { entityType: 'User', entityId: user._id },
        metadata: { email: user.email, reason: 'INVALID_PASSWORD' },
        ipAddress
      });
      return errorResponse(res, 401, 'Invalid email or password', 'INVALID_CREDENTIALS');
    }

    if (!user.isActive) {
      await auditService.logEvent({
        eventType: 'AUTH_LOGIN_FAILURE',
        actorId: user._id,
        actorRole: user.role,
        targetEntity: { entityType: 'User', entityId: user._id },
        metadata: { email: user.email, reason: 'ACCOUNT_INACTIVE' },
        ipAddress
      });
      return errorResponse(res, 403, 'Account is inactive', 'ACCOUNT_INACTIVE');
    }

    const token = generateToken(user);

    await auditService.logEvent({
      eventType: 'AUTH_LOGIN_SUCCESS',
      actorId: user._id,
      actorRole: user.role,
      targetEntity: { entityType: 'User', entityId: user._id },
      metadata: { email: user.email },
      ipAddress
    });

    return successResponse(
      res,
      200,
      'Authentication successful',
      {
        token,
        user
      }
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieve profile of authenticated user
 * GET /api/auth/me
 */
const getMe = async (req, res) => {
  return successResponse(res, 200, 'User profile retrieved', {
    user: req.user
  });
};

module.exports = {
  register,
  login,
  getMe
};

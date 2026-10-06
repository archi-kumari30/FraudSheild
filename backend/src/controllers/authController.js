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

const crypto = require('crypto');

/**
 * Request password reset token
 * POST /api/auth/forgot-password
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email ? email.toLowerCase() : '' });

    if (!user) {
      // Safe generic message to prevent email enumeration
      return successResponse(
        res,
        200,
        'If your email is registered, password reset instructions have been generated.',
        { resetToken: null }
      );
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Token expires in 15 minutes
    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = Date.now() + 15 * 60 * 1000;
    await user.save();

    await auditService.logEvent({
      eventType: 'AUTH_PASSWORD_RESET_REQUESTED',
      actorId: user._id,
      actorRole: user.role,
      targetEntity: { entityType: 'User', entityId: user._id },
      metadata: { email: user.email },
      ipAddress: req.ip || 'unknown'
    });

    return successResponse(
      res,
      200,
      'Password reset instructions generated.',
      {
        resetToken,
        notice: 'In development mode without an external mail provider, your reset token is provided directly above for verification.'
      }
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Reset password using valid token
 * POST /api/auth/reset-password
 */
const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return errorResponse(res, 400, 'Password reset token is invalid or has expired', 'INVALID_RESET_TOKEN');
    }

    user.passwordHash = await User.hashPassword(newPassword);
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();

    await auditService.logEvent({
      eventType: 'AUTH_PASSWORD_RESET_COMPLETED',
      actorId: user._id,
      actorRole: user.role,
      targetEntity: { entityType: 'User', entityId: user._id },
      metadata: { email: user.email },
      ipAddress: req.ip || 'unknown'
    });

    return successResponse(
      res,
      200,
      'Password reset successfully. You can now sign in with your new password.'
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  forgotPassword,
  resetPassword
};

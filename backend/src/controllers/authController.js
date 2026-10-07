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

/**
 * Configure or update customer's 6-digit transaction PIN
 * POST /api/auth/pin
 */
const setupPin = async (req, res, next) => {
  try {
    const { pin } = req.body;
    const currentPassword = req.body.currentPassword || req.body.password;

    if (!pin || !/^\d{6}$/.test(String(pin))) {
      return errorResponse(res, 400, 'Transaction PIN must be exactly 6 digits', 'INVALID_PIN_FORMAT');
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return errorResponse(res, 404, 'User not found', 'NOT_FOUND');
    }

    // Require current password for security verification if already set or updating
    if (user.transactionPinHash && !currentPassword) {
      return errorResponse(res, 400, 'Current account password is required to change transaction PIN', 'PASSWORD_REQUIRED');
    }

    if (currentPassword) {
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return errorResponse(res, 401, 'Current password verification failed', 'INVALID_PASSWORD');
      }
    }

    user.transactionPinHash = await User.hashPin(String(pin));
    user.pinFailedAttempts = 0;
    user.pinLockedUntil = null;
    await user.save();

    await auditService.logEvent({
      eventType: 'AUTH_PIN_CONFIGURED',
      actorId: user._id,
      actorRole: user.role,
      targetEntity: { entityType: 'User', entityId: user._id },
      metadata: { action: user.transactionPinHash ? 'PIN_UPDATED' : 'PIN_SET' },
      ipAddress: req.ip || 'unknown'
    });

    return successResponse(res, 200, '6-digit transaction PIN set successfully', {
      hasTransactionPin: true,
      hasPinSet: true
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reset forgotten transaction PIN using authenticated account password
 * POST /api/auth/pin/reset
 */
const resetPin = async (req, res, next) => {
  try {
    const { password, currentPassword, newPin, pin } = req.body;
    const targetPin = newPin || pin;
    const authPassword = password || currentPassword;

    if (!targetPin || !/^\d{6}$/.test(String(targetPin))) {
      return errorResponse(res, 400, 'New transaction PIN must be exactly 6 digits', 'INVALID_PIN_FORMAT');
    }

    if (!authPassword) {
      return errorResponse(res, 400, 'Account password is required for security verification', 'PASSWORD_REQUIRED');
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return errorResponse(res, 404, 'User not found', 'NOT_FOUND');
    }

    const isMatch = await user.comparePassword(authPassword);
    if (!isMatch) {
      await auditService.logEvent({
        eventType: 'AUTH_PIN_RESET_FAILED',
        actorId: user._id,
        actorRole: user.role,
        targetEntity: { entityType: 'User', entityId: user._id },
        metadata: { reason: 'INVALID_PASSWORD' },
        ipAddress: req.ip || 'unknown'
      });
      return errorResponse(res, 401, 'Account password verification failed', 'INVALID_PASSWORD');
    }

    user.transactionPinHash = await User.hashPin(String(targetPin));
    user.pinFailedAttempts = 0;
    user.pinLockedUntil = null;
    await user.save();

    await auditService.logEvent({
      eventType: 'AUTH_PIN_RESET_SUCCESS',
      actorId: user._id,
      actorRole: user.role,
      targetEntity: { entityType: 'User', entityId: user._id },
      metadata: { action: 'PIN_RESET' },
      ipAddress: req.ip || 'unknown'
    });

    return successResponse(res, 200, 'Transaction PIN reset successfully', {
      hasTransactionPin: true,
      hasPinSet: true
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify transaction PIN
 * POST /api/auth/pin/verify
 */
const verifyPin = async (req, res, next) => {
  try {
    const { pin } = req.body;

    if (!pin || !/^\d{6}$/.test(String(pin))) {
      return errorResponse(res, 400, 'Transaction PIN must be exactly 6 digits', 'INVALID_PIN_FORMAT');
    }

    const user = await User.findById(req.user._id);
    if (!user || !user.transactionPinHash) {
      return errorResponse(res, 400, 'No transaction PIN configured', 'PIN_NOT_SET');
    }

    if (user.pinLockedUntil && new Date(user.pinLockedUntil) > new Date()) {
      return errorResponse(res, 423, 'Transaction PIN is locked due to too many failed attempts', 'PIN_LOCKED');
    }

    const isMatch = await user.comparePin(String(pin));
    if (!isMatch) {
      user.pinFailedAttempts = (user.pinFailedAttempts || 0) + 1;
      if (user.pinFailedAttempts >= 3) {
        user.pinLockedUntil = new Date(Date.now() + 15 * 60 * 1000);
      }
      await user.save();
      return errorResponse(res, 401, 'Invalid transaction PIN', 'INVALID_PIN', {
        remainingAttempts: Math.max(0, 3 - user.pinFailedAttempts)
      });
    }

    user.pinFailedAttempts = 0;
    user.pinLockedUntil = null;
    await user.save();

    return successResponse(res, 200, 'PIN verified successfully', {
      verified: true
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Check if authenticated user has a transaction PIN configured
 * GET /api/auth/pin/status
 */
const getPinStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const hasPinSet = !!(user && user.transactionPinHash);
    const isLocked = !!(user && user.pinLockedUntil && new Date(user.pinLockedUntil) > new Date());

    return successResponse(res, 200, 'PIN status retrieved', {
      hasPinSet,
      hasTransactionPin: hasPinSet,
      isLocked
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  forgotPassword,
  resetPassword,
  setupPin,
  resetPin,
  verifyPin,
  getPinStatus
};

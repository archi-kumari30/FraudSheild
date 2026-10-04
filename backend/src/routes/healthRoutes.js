const express = require('express');
const config = require('../config');
const { getDBStatus } = require('../config/db');
const { successResponse } = require('../utils/apiResponse');

const router = express.Router();

/**
 * @route   GET /api/health
 * @desc    Public health check endpoint
 * @access  Public
 */
router.get('/health', (req, res) => {
  const dbStatus = getDBStatus();
  const isHealthy = dbStatus === 'connected';

  const healthData = {
    status: isHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    database: dbStatus
  };

  return successResponse(res, 200, 'FraudShield API is running', healthData);
});

module.exports = router;

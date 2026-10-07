const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const config = require('./config');
const requestLogger = require('./middleware/requestLogger');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');
const healthRoutes = require('./routes/healthRoutes');
const authRoutes = require('./routes/authRoutes');
const walletRoutes = require('./routes/walletRoutes');
const beneficiaryRoutes = require('./routes/beneficiaryRoutes');
const deviceRoutes = require('./routes/deviceRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const alertRoutes = require('./routes/alertRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const auditRoutes = require('./routes/auditRoutes');
const disputeRoutes = require('./routes/disputeRoutes');
const adminDisputeRoutes = require('./routes/adminDisputeRoutes');
const deviceContextMiddleware = require('./middleware/deviceContextMiddleware');
const { authenticateToken, authorizeRole } = require('./middleware/authMiddleware');

const createApp = () => {
  const app = express();

  // 1. Security Headers (Helmet)
  app.use(helmet());

  // 2. Cross-Origin Resource Sharing (CORS)
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, server-to-server) or matching origin
        if (!origin || origin === config.corsOrigin) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS policy'));
        }
      },
      credentials: true
    })
  );

  // 3. Request Body Parsing with strict 10kb limit
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));

  // 4. Request Logging & Device Context Tracking
  app.use(requestLogger());
  app.use(deviceContextMiddleware);

  // 5. Baseline IP Rate Limiting (Skipped in test environment)
  if (config.nodeEnv !== 'test') {
    const authLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: config.nodeEnv === 'production' ? 20 : 60,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        success: false,
        error: {
          message: 'Too many login attempts. Please wait before trying again.',
          code: 'RATE_LIMIT_EXCEEDED'
        }
      }
    });

    const apiLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: config.nodeEnv === 'production' ? 500 : 2000,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        success: false,
        error: {
          message: 'Too many requests. Please wait before trying again.',
          code: 'RATE_LIMIT_EXCEEDED'
        }
      }
    });

    app.use('/api/auth/login', authLimiter);
    app.use('/api/auth/register', authLimiter);
    app.use('/api/', apiLimiter);
  }

  // 6. Mount API Routes
  app.use('/api', healthRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/wallet', walletRoutes);
  app.use('/api/beneficiaries', beneficiaryRoutes);
  app.use('/api/devices', deviceRoutes);
  app.use('/api/transactions', transactionRoutes);
  app.use('/api/alerts', alertRoutes);
  app.use('/api/admin/reviews', reviewRoutes);
  app.use('/api/admin/audit-logs', auditRoutes);
  app.use('/api/disputes', disputeRoutes);
  app.use('/api/admin/disputes', adminDisputeRoutes);

  // Simulated test routes for testing middleware in test environment
  if (config.nodeEnv === 'test') {
    app.get('/api/test-error', (req, res, next) => {
      next(new Error('Simulated internal server error'));
    });
    app.post('/api/test-body', (req, res) => {
      res.status(200).json({ success: true, received: true });
    });
    app.get('/api/test-admin', authenticateToken, authorizeRole(['admin']), (req, res) => {
      res.status(200).json({ success: true, message: 'Admin access granted' });
    });
    app.get('/api/test-device-context', (req, res) => {
      res.status(200).json({ success: true, deviceContext: req.deviceContext });
    });
  }

  // 7. 404 Route Not Found Handler
  app.use(notFoundHandler);

  // 8. Centralized Global Error Handler
  app.use(errorHandler);

  return app;
};

const app = createApp();

module.exports = app;

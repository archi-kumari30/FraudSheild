const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const nodeEnv = process.env.NODE_ENV || 'development';

// In test environment, provide safe fallbacks if .env was not explicitly set
if (nodeEnv === 'test') {
  process.env.PORT = process.env.PORT || '5001';
  process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fraudshield_test';
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_key_at_least_32_characters_long';
  process.env.CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';
}

/**
 * Validate mandatory environment variables
 */
const requiredEnvVars = ['PORT', 'MONGODB_URI', 'JWT_SECRET'];

const missingEnvVars = requiredEnvVars.filter((key) => !process.env[key]);

if (missingEnvVars.length > 0 && nodeEnv !== 'test') {
  console.error(`[CONFIG ERROR] Missing mandatory environment variables: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv,
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/fraudshield',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET || 'test_jwt_secret_key_at_least_32_characters_long',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  adminSeed: {
    name: process.env.ADMIN_NAME || 'System Administrator',
    email: process.env.ADMIN_EMAIL || 'admin@fraudshield.internal',
    password: process.env.ADMIN_PASSWORD || 'AdminSecurePassword123!'
  },
  geminiApiKey: process.env.GEMINI_API_KEY || ''
};

module.exports = config;

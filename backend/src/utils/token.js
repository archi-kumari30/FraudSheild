const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * Generate a signed JWT for a user
 * @param {Object} user - User document or object with id, role, email
 * @returns {string} - Signed JWT token
 */
const generateToken = (user) => {
  const payload = {
    id: user._id ? user._id.toString() : user.id,
    email: user.email,
    role: user.role
  };

  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn || '24h'
  });
};

/**
 * Verify a JWT string
 * @param {string} token - JWT token string
 * @returns {Object} - Decoded token payload
 */
const verifyToken = (token) => {
  return jwt.verify(token, config.jwtSecret);
};

module.exports = {
  generateToken,
  verifyToken
};

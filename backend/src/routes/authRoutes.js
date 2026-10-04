const express = require('express');
const authController = require('../controllers/authController');
const { registerValidation, loginValidation } = require('../middleware/validator');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes
router.post('/register', registerValidation, authController.register);
router.post('/login', loginValidation, authController.login);

// Protected routes
router.get('/me', authenticateToken, authController.getMe);

module.exports = router;

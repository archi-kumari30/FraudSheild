const express = require('express');
const alertController = require('../controllers/alertController');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticateToken);

router.get('/', alertController.getAlerts);
router.patch('/:id/read', alertController.markAsRead);

module.exports = router;

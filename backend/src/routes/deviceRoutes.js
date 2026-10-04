const express = require('express');
const deviceController = require('../controllers/deviceController');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticateToken);

router.get('/', deviceController.getDevices);

module.exports = router;

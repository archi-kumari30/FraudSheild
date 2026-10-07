const express = require('express');
const deviceController = require('../controllers/deviceController');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticateToken);

router.get('/', deviceController.getDevices);
router.delete('/:deviceId', deviceController.revokeDevice);
router.post('/:deviceId/revoke', deviceController.revokeDevice);
router.patch('/:deviceId', deviceController.updateDeviceLabel);

module.exports = router;


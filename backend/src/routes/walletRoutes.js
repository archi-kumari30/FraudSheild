const express = require('express');
const walletController = require('../controllers/walletController');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticateToken);

router.get('/', walletController.getWallet);
router.post('/deposit', walletController.depositFunds);

module.exports = router;

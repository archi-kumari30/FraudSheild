const express = require('express');
const walletController = require('../controllers/walletController');
const { authenticateToken } = require('../middleware/authMiddleware');
const validate = require('../validators/validate');
const { depositSchema } = require('../validators/walletValidator');

const router = express.Router();

router.use(authenticateToken);

router.get('/', walletController.getWallet);
router.post('/deposit', validate(depositSchema), walletController.depositFunds);

module.exports = router;

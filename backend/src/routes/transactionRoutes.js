const express = require('express');
const transactionController = require('../controllers/transactionController');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticateToken);

router.post('/', transactionController.createTransaction);
router.get('/', transactionController.getTransactions);
router.get('/:id', transactionController.getTransactionById);
router.post('/:id/confirm', transactionController.confirmTransaction);
router.post('/:id/escalate', transactionController.escalateTransaction);

module.exports = router;

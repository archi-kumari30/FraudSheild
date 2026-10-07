const express = require('express');
const transactionController = require('../controllers/transactionController');
const { authenticateToken } = require('../middleware/authMiddleware');
const idempotencyMiddleware = require('../middleware/idempotencyMiddleware');
const validate = require('../validators/validate');
const {
  initiateTransferSchema,
  confirmTransactionSchema,
  escalateTransactionSchema,
  declineTransactionSchema
} = require('../validators/transactionValidator');

const router = express.Router();

router.use(authenticateToken);

router.post(
  '/',
  idempotencyMiddleware,
  validate(initiateTransferSchema),
  transactionController.createTransaction
);

router.get('/', transactionController.getTransactions);
router.get('/:id', transactionController.getTransactionById);

router.post(
  '/:id/confirm',
  validate(confirmTransactionSchema),
  transactionController.confirmTransaction
);

router.post(
  '/:id/escalate',
  validate(escalateTransactionSchema),
  transactionController.escalateTransaction
);

router.post(
  '/:id/decline',
  validate(declineTransactionSchema),
  transactionController.declineTransaction
);

module.exports = router;


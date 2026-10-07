const express = require('express');
const disputeController = require('../controllers/disputeController');
const { authenticateToken } = require('../middleware/authMiddleware');
const validate = require('../validators/validate');
const {
  createDisputeSchema,
  recipientResponseSchema
} = require('../validators/disputeValidator');

const router = express.Router();

router.use(authenticateToken);

router.post('/', validate(createDisputeSchema), disputeController.createDispute);
router.get('/', disputeController.getUserDisputes);
router.get('/:id', disputeController.getDisputeById);
router.post(
  '/:id/recipient-response',
  validate(recipientResponseSchema),
  disputeController.submitRecipientResponse
);

module.exports = router;

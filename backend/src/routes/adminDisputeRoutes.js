const express = require('express');
const disputeController = require('../controllers/disputeController');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');
const validate = require('../validators/validate');
const { resolveDisputeSchema } = require('../validators/disputeValidator');

const router = express.Router();

router.use(authenticateToken);
router.use(authorizeRole(['admin']));

router.get('/', disputeController.getAdminDisputes);
router.get('/:id', disputeController.getDisputeById);
router.post('/:id/resolve', validate(resolveDisputeSchema), disputeController.resolveDispute);

module.exports = router;

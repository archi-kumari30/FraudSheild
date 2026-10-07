const express = require('express');
const reviewController = require('../controllers/reviewController');
const aiController = require('../controllers/aiController');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');
const validate = require('../validators/validate');
const { resolveReviewSchema, addCaseNoteSchema } = require('../validators/reviewValidator');

const router = express.Router();

// Strict RBAC: All review endpoints require valid admin credentials
router.use(authenticateToken);
router.use(authorizeRole(['admin']));

router.get('/', reviewController.getPendingReviews);
router.get('/pending', reviewController.getPendingReviews);
router.get('/stats', reviewController.getAdminStats);
router.get('/:id', reviewController.getReviewDetails);
router.get('/:id/timeline', reviewController.getCaseTimeline);
router.post('/:id/claim', reviewController.claimCase);
router.post('/:id/release', reviewController.releaseCase);
router.post('/:id/notes', validate(addCaseNoteSchema), reviewController.addCaseNote);
router.post('/:id/resolve', validate(resolveReviewSchema), reviewController.resolveReview);
router.post('/:id/ai-analyze', aiController.analyzeTransaction);

module.exports = router;

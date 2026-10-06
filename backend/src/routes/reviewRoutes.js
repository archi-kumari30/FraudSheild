const express = require('express');
const reviewController = require('../controllers/reviewController');
const aiController = require('../controllers/aiController');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');

const router = express.Router();

// Strict RBAC: All review endpoints require valid admin credentials
router.use(authenticateToken);
router.use(authorizeRole(['admin']));

router.get('/', reviewController.getPendingReviews);
router.get('/pending', reviewController.getPendingReviews);
router.get('/stats', reviewController.getAdminStats);
router.get('/:id', reviewController.getReviewDetails);
router.post('/:id/resolve', reviewController.resolveReview);
router.post('/:id/ai-analyze', aiController.analyzeTransaction);

module.exports = router;

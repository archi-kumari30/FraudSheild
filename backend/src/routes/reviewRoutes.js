const express = require('express');
const reviewController = require('../controllers/reviewController');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');

const router = express.Router();

// Strict RBAC: All review endpoints require valid admin credentials
router.use(authenticateToken);
router.use(authorizeRole(['admin']));

router.get('/', reviewController.getPendingReviews);
router.get('/:id', reviewController.getReviewDetails);
router.post('/:id/resolve', reviewController.resolveReview);

module.exports = router;

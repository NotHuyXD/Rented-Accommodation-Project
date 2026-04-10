// ============================================================
// Review Routes
// ============================================================
const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review.controller');
const { authenticate, optionalAuth, authorize } = require('../middleware/auth');
const { createReviewValidation } = require('../middleware/validate');

router.get('/', optionalAuth, reviewController.listReviews);
router.post('/', authenticate, createReviewValidation, reviewController.createReview);
router.post('/:id/reply', authenticate, reviewController.replyToReview);
router.post('/:id/helpful', authenticate, reviewController.voteHelpful);
router.delete('/:id', authenticate, authorize('admin', 'super_admin'), reviewController.deleteReview);

module.exports = router;

const express = require('express');
const router = express.Router();
const { createReview, listReviews, deleteReview } = require('../controllers/review.controller');
const { authenticate } = require('../middleware/auth');

router.post('/', authenticate, createReview);
router.get('/', listReviews);
router.delete('/:id', authenticate, deleteReview);

module.exports = router;

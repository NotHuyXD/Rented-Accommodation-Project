const express = require('express');
const router = express.Router();
const { createRentalRequest, listRentalRequests, acceptRequest, rejectRequest, cancelRequest } = require('../controllers/rentalRequest.controller');
const { authenticate } = require('../middleware/auth');

router.post('/', authenticate, createRentalRequest);
router.get('/', authenticate, listRentalRequests);
router.patch('/:id/accept', authenticate, acceptRequest);
router.patch('/:id/reject', authenticate, rejectRequest);
router.patch('/:id/cancel', authenticate, cancelRequest);

module.exports = router;

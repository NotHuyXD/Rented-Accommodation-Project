// ============================================================
// Booking Routes
// ============================================================
const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/booking.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { createBookingValidation } = require('../middleware/validate');

router.get('/', authenticate, bookingController.listBookings);
router.get('/:id', authenticate, bookingController.getBookingById);
router.post('/', authenticate, authorize('tenant', 'admin', 'super_admin'), createBookingValidation, bookingController.createBooking);
router.patch('/:id/confirm', authenticate, authorize('landlord', 'admin', 'super_admin'), bookingController.confirmBooking);
router.patch('/:id/reject', authenticate, authorize('landlord', 'admin', 'super_admin'), bookingController.rejectBooking);
router.patch('/:id/cancel', authenticate, bookingController.cancelBooking);
router.patch('/:id/complete', authenticate, bookingController.completeBooking);

module.exports = router;

const express = require('express');
const router = express.Router();
const { createInvoice, listInvoices, getInvoiceById, createPayment, listPayments,
        createUtilityReading, listUtilityReadings } = require('../controllers/payment.controller');
const { authenticate } = require('../middleware/auth');

// Invoices
router.post('/invoices', authenticate, createInvoice);
router.get('/invoices', authenticate, listInvoices);
router.get('/invoices/:id', authenticate, getInvoiceById);

// Payments
router.post('/', authenticate, createPayment);
router.get('/', authenticate, listPayments);

// Utility readings
router.post('/utility-readings', authenticate, createUtilityReading);
router.get('/utility-readings', authenticate, listUtilityReadings);

module.exports = router;

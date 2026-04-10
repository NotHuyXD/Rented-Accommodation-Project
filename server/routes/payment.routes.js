// ============================================================
// Payment Routes
// ============================================================
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { authenticate, authorize } = require('../middleware/auth');

// Invoices
router.get('/invoices', authenticate, paymentController.listInvoices);
router.get('/invoices/:id', authenticate, paymentController.getInvoiceById);
router.post('/invoices', authenticate, authorize('landlord', 'admin', 'super_admin'), paymentController.createInvoice);

// Transactions
router.get('/transactions', authenticate, paymentController.listTransactions);
router.post('/transactions', authenticate, paymentController.createTransaction);

// Wallet
router.get('/wallet', authenticate, paymentController.getWallet);

// Payment Methods
router.get('/methods', authenticate, paymentController.getPaymentMethods);
router.post('/methods', authenticate, paymentController.addPaymentMethod);

module.exports = router;

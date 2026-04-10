// ============================================================
// User Routes
// ============================================================
const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticate, authorize } = require('../middleware/auth');

// Admin routes
router.get('/', authenticate, authorize('admin', 'super_admin'), userController.listUsers);

// Public (view user profile)
router.get('/:id', userController.getUserById);

// Admin actions
router.patch('/:id/status', authenticate, authorize('admin', 'super_admin'), userController.updateUserStatus);
router.patch('/:id/verify-identity/:verificationId', authenticate, authorize('admin', 'super_admin'), userController.processKYC);
router.delete('/:id', authenticate, authorize('admin', 'super_admin'), userController.deleteUser);

// User actions
router.post('/:id/verify-identity', authenticate, userController.submitKYC);
router.get('/:id/activity', authenticate, userController.getUserActivity);

module.exports = router;

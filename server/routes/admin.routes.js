const express = require('express');
const router = express.Router();
const {
  getStats,
  listAllRooms,
  listAllUsers,
  updateUserRole,
  getUserVerification,
  getReportTarget,
} = require('../controllers/admin.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/stats', authenticate, authorize('admin'), getStats);
router.get('/rooms', authenticate, authorize('admin'), listAllRooms);
router.get('/users', authenticate, authorize('admin'), listAllUsers);
router.patch('/users/:id/role', authenticate, authorize('admin'), updateUserRole);
router.get('/users/:id/kyc', authenticate, authorize('admin'), getUserVerification);
router.get('/reports/target/:type/:id', authenticate, authorize('admin'), getReportTarget);

module.exports = router;


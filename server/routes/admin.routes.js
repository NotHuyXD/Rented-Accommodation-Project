const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate, authorize('admin', 'super_admin'));

router.get('/dashboard', adminController.getDashboardStats);
router.get('/configs', adminController.listSystemConfigs);
router.put('/configs/:id', adminController.updateSystemConfig);
router.get('/audit', adminController.listAuditLogs);

module.exports = router;

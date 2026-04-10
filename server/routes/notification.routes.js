// ============================================================
// Notification Routes
// ============================================================
const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, notificationController.listNotifications);
router.get('/unread-count', authenticate, notificationController.getUnreadCount);
router.post('/mark-read', authenticate, notificationController.markAsRead);
router.post('/mark-all-read', authenticate, notificationController.markAllAsRead);
router.delete('/:id', authenticate, notificationController.deleteNotification);

// Admin: send notification
router.post('/send', authenticate, authorize('admin', 'super_admin'), notificationController.sendNotification);

module.exports = router;

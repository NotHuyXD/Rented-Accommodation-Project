// ============================================================
// Room Routes
// ============================================================
const express = require('express');
const router = express.Router();
const roomController = require('../controllers/room.controller');
const { authenticate, optionalAuth, authorize } = require('../middleware/auth');
const { createRoomValidation } = require('../middleware/validate');

// Public routes
router.get('/', optionalAuth, roomController.listRooms);
router.get('/detail/:id', optionalAuth, roomController.getRoomById);

// Landlord routes
router.get('/my-rooms', authenticate, authorize('landlord', 'admin', 'super_admin'), roomController.getMyRooms);
router.post('/', authenticate, authorize('landlord', 'admin', 'super_admin'), createRoomValidation, roomController.createRoom);
router.put('/:id', authenticate, authorize('landlord', 'admin', 'super_admin'), roomController.updateRoom);
router.delete('/:id', authenticate, authorize('landlord', 'admin', 'super_admin'), roomController.deleteRoom);

// Admin routes
router.patch('/:id/status', authenticate, authorize('admin', 'super_admin'), roomController.updateRoomStatus);

module.exports = router;

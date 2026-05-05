const express = require('express');
const router = express.Router();
const { listRooms, getRoomById, createRoom, updateRoom, deleteRoom, updateRoomStatus, getMyRooms } = require('../controllers/room.controller');
const { authenticate, optionalAuth, authorize } = require('../middleware/auth');

router.get('/', optionalAuth, listRooms);
router.get('/my-rooms', authenticate, authorize('landlord'), getMyRooms);
router.get('/:id', optionalAuth, getRoomById);
router.post('/', authenticate, authorize('landlord'), createRoom);
router.put('/:id', authenticate, updateRoom);
router.delete('/:id', authenticate, deleteRoom);
router.patch('/:id/status', authenticate, authorize('admin', 'landlord'), updateRoomStatus);

module.exports = router;

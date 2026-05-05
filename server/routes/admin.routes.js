const express = require('express');
const router = express.Router();
const { getStats, listAllRooms, listAllUsers } = require('../controllers/admin.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/stats', authenticate, authorize('admin'), getStats);
router.get('/rooms', authenticate, authorize('admin'), listAllRooms);
router.get('/users', authenticate, authorize('admin'), listAllUsers);

module.exports = router;

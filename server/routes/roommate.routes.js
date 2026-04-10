const express = require('express');
const router = express.Router();
const roommateController = require('../controllers/roommate.controller');
const { authenticate } = require('../middleware/auth');

router.get('/profile', authenticate, roommateController.getProfile);
router.put('/profile', authenticate, roommateController.updateProfile);
router.get('/match', authenticate, roommateController.matchRoommates);

module.exports = router;

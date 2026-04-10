const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');
const { authenticate } = require('../middleware/auth');

router.get('/conversations', authenticate, chatController.listConversations);
router.post('/conversations', authenticate, chatController.getOrCreateConversation);
router.get('/quick-replies', authenticate, chatController.listQuickReplies);

module.exports = router;

const express = require('express');
const router = express.Router();
const { getOrCreateConversation, listConversations, getMessages, sendMessage } = require('../controllers/chat.controller');
const { authenticate } = require('../middleware/auth');

router.post('/conversations', authenticate, getOrCreateConversation);
router.get('/conversations', authenticate, listConversations);
router.get('/conversations/:id/messages', authenticate, getMessages);
router.post('/conversations/:id/messages', authenticate, sendMessage);

module.exports = router;

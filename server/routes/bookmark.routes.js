const express = require('express');
const router = express.Router();
const { addBookmark, removeBookmark, listBookmarks, checkBookmark } = require('../controllers/bookmark.controller');
const { authenticate } = require('../middleware/auth');

router.post('/', authenticate, addBookmark);
router.get('/', authenticate, listBookmarks);
router.get('/check/:roomId', authenticate, checkBookmark);
router.delete('/:roomId', authenticate, removeBookmark);

module.exports = router;

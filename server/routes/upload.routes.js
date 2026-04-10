// ============================================================
// Upload Routes
// ============================================================
const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/upload.controller');
const { authenticate } = require('../middleware/auth');

router.post('/single', authenticate, uploadController.uploadFile);
router.post('/multiple', authenticate, uploadController.uploadFiles);
router.get('/media', authenticate, uploadController.listMedia);

module.exports = router;

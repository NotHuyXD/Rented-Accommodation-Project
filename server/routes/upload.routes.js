// ============================================================
// Upload Routes (v2.0 schema)
// ============================================================
const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/upload.controller');
const { authenticate } = require('../middleware/auth');

router.post('/single', authenticate, uploadController.uploadFile);
router.post('/multiple', authenticate, uploadController.uploadFiles);

module.exports = router;

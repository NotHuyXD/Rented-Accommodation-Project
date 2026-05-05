const express = require('express');
const router = express.Router();
const { createReport, listReports, updateReportStatus } = require('../controllers/report.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.post('/', authenticate, createReport);
router.get('/', authenticate, authorize('admin'), listReports);
router.patch('/:id', authenticate, authorize('admin'), updateReportStatus);

module.exports = router;

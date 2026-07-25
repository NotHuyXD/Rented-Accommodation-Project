const express = require('express');
const router = express.Router();
const { listUsers, getUserById, submitKYC, listPendingKYC, reviewKYC } = require('../controllers/user.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, authorize('admin'), listUsers);
router.get('/kyc/pending', authenticate, authorize('admin'), listPendingKYC);
router.post('/kyc', authenticate, submitKYC);
router.patch('/kyc/:id/review', authenticate, authorize('admin'), reviewKYC);
router.get('/:id', getUserById);

module.exports = router;

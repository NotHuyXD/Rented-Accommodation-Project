// ============================================================
// Contract Routes
// ============================================================
const express = require('express');
const router = express.Router();
const contractController = require('../controllers/contract.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { createContractValidation } = require('../middleware/validate');

router.get('/', authenticate, contractController.listContracts);
router.get('/:id', authenticate, contractController.getContractById);
router.post('/', authenticate, authorize('landlord', 'admin', 'super_admin'), createContractValidation, contractController.createContract);
router.post('/:id/sign', authenticate, contractController.signContract);
router.post('/:id/terminate', authenticate, contractController.terminateContract);

module.exports = router;

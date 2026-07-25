const express = require('express');
const router = express.Router();
const { listContracts, getContractById, signContract, terminateContract } = require('../controllers/contract.controller');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, listContracts);
router.get('/:id', authenticate, getContractById);
router.patch('/:id/sign', authenticate, signContract);
router.patch('/:id/terminate', authenticate, terminateContract);

module.exports = router;

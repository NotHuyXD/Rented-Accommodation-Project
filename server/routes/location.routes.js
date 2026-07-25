const express = require('express');
const router = express.Router();
const { getProvinces, getDistricts, getWards, seedLocations } = require('../controllers/location.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/provinces', getProvinces);
router.get('/districts', getDistricts);
router.get('/wards', getWards);
router.post('/seed', authenticate, authorize('admin'), seedLocations);

module.exports = router;

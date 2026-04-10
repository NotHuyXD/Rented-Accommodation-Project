// ============================================================
// Location Routes
// ============================================================
const express = require('express');
const router = express.Router();
const locationController = require('../controllers/location.controller');

// All public
router.get('/provinces', locationController.getProvinces);
router.get('/provinces/:provinceId/districts', locationController.getDistricts);
router.get('/districts/:districtId/wards', locationController.getWards);
router.get('/all', locationController.getAllLocations);

module.exports = router;

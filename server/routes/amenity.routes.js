// ============================================================
// Amenity Routes
// ============================================================
const express = require('express');
const router = express.Router();
const amenityController = require('../controllers/amenity.controller');

// All public
router.get('/', amenityController.listAmenities);
router.get('/:id', amenityController.getAmenityById);

module.exports = router;

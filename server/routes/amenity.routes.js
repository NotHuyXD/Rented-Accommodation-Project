const express = require('express');
const router = express.Router();
const { listAmenities, listRoomTypes, createAmenity } = require('../controllers/amenity.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', listAmenities);
router.get('/room-types', listRoomTypes);
router.post('/', authenticate, authorize('admin'), createAmenity);

module.exports = router;

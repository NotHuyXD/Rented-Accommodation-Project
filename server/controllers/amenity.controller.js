// ============================================================
// Amenity Controller (v2.0 schema)
// ============================================================
const { query } = require('../config/db');
const { generateUUID } = require('../utils/helpers');

/**
 * GET /amenities - List all amenities
 */
async function listAmenities(req, res, next) {
  try {
    const amenities = await query('SELECT id, name, icon FROM amenities ORDER BY name');
    res.json({ data: amenities });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /amenities/room-types - List all room types
 */
async function listRoomTypes(req, res, next) {
  try {
    const roomTypes = await query('SELECT id, name, slug, icon, description FROM room_types ORDER BY name');
    res.json({ data: roomTypes });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /amenities - Create amenity (admin)
 */
async function createAmenity(req, res, next) {
  try {
    const { name, icon } = req.body;
    if (!name) return res.status(400).json({ message: 'Thiếu tên tiện nghi' });

    await query('INSERT INTO amenities (id, name, icon) VALUES (?, ?, ?)',
      [generateUUID(), name, icon || null]);
    res.status(201).json({ message: 'Tạo tiện nghi thành công' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listAmenities,
  listRoomTypes,
  createAmenity,
};

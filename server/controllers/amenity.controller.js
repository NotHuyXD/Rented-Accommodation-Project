// ============================================================
// Amenity Controller - List amenities
// ============================================================
const { query } = require('../config/db');

async function listAmenities(req, res, next) {
  try {
    const { category } = req.query;

    let whereClause = 'WHERE is_active = 1';
    const params = [];

    if (category) { whereClause += ' AND category = ?'; params.push(category); }

    const amenities = await query(
      `SELECT id, name, name_vi, icon, category, sort_order
       FROM amenities ${whereClause} ORDER BY sort_order, category`, params
    );

    // Group by category
    const grouped = {};
    for (const amenity of amenities) {
      if (!grouped[amenity.category]) grouped[amenity.category] = [];
      grouped[amenity.category].push(amenity);
    }

    res.json({ data: amenities, grouped });
  } catch (error) { next(error); }
}

async function getAmenityById(req, res, next) {
  try {
    const amenities = await query(
      'SELECT * FROM amenities WHERE id = ?', [req.params.id]
    );
    if (amenities.length === 0) return res.status(404).json({ message: 'Không tìm thấy tiện ích' });
    res.json({ data: amenities[0] });
  } catch (error) { next(error); }
}

module.exports = { listAmenities, getAmenityById };

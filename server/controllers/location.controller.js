// ============================================================
// Location Controller - Provinces, Districts, Wards
// ============================================================
const { query } = require('../config/db');

async function getProvinces(req, res, next) {
  try {
    const provinces = await query(
      'SELECT id, name, name_en, code, region FROM provinces WHERE is_active = 1 ORDER BY name'
    );
    res.json({ data: provinces });
  } catch (error) { next(error); }
}

async function getDistricts(req, res, next) {
  try {
    const { provinceId } = req.params;
    const districts = await query(
      'SELECT id, name, name_en, code FROM districts WHERE province_id = ? AND is_active = 1 ORDER BY name',
      [provinceId]
    );
    res.json({ data: districts });
  } catch (error) { next(error); }
}

async function getWards(req, res, next) {
  try {
    const { districtId } = req.params;
    const wards = await query(
      'SELECT id, name, name_en, code FROM wards WHERE district_id = ? AND is_active = 1 ORDER BY name',
      [districtId]
    );
    res.json({ data: wards });
  } catch (error) { next(error); }
}

async function getAllLocations(req, res, next) {
  try {
    const provinces = await query(
      'SELECT id, name, name_en, code, region FROM provinces WHERE is_active = 1 ORDER BY name'
    );

    for (const province of provinces) {
      province.districts = await query(
        'SELECT id, name, name_en, code FROM districts WHERE province_id = ? AND is_active = 1 ORDER BY name',
        [province.id]
      );
    }

    res.json({ data: provinces });
  } catch (error) { next(error); }
}

module.exports = { getProvinces, getDistricts, getWards, getAllLocations };

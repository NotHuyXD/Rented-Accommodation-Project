// ============================================================
// Location Controller - Provinces, Districts, Wards (v2.0)
// ============================================================
const { query } = require('../config/db');

/**
 * GET /locations/provinces
 */
async function getProvinces(req, res, next) {
  try {
    const provinces = await query('SELECT id, name, code FROM provinces ORDER BY name');
    res.json({ data: provinces });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /locations/districts?provinceId=xxx
 */
async function getDistricts(req, res, next) {
  try {
    const { provinceId } = req.query;
    if (!provinceId) {
      return res.status(400).json({ message: 'Thiếu provinceId' });
    }
    const districts = await query(
      'SELECT id, name, code FROM districts WHERE province_id = ? ORDER BY name',
      [provinceId]
    );
    res.json({ data: districts });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /locations/wards?districtId=xxx
 */
async function getWards(req, res, next) {
  try {
    const { districtId } = req.query;
    if (!districtId) {
      return res.status(400).json({ message: 'Thiếu districtId' });
    }
    const wards = await query(
      'SELECT id, name, code FROM wards WHERE district_id = ? ORDER BY name',
      [districtId]
    );
    res.json({ data: wards });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /locations/seed - Seed from external API (admin, one-time)
 */
async function seedLocations(req, res, next) {
  try {
    // Fetch from Vietnam provinces API
    const fetch = (await import('node-fetch')).default;
    
    // Get provinces
    const provRes = await fetch('https://provinces.open-api.vn/api/p/');
    const provData = await provRes.json();
    
    for (const prov of provData) {
      const provId = require('uuid').v4();
      await query(
        'INSERT IGNORE INTO provinces (id, name, code) VALUES (?, ?, ?)',
        [provId, prov.name, String(prov.code)]
      );
    }

    // Get districts and wards for each province
    for (const prov of provData) {
      const provRows = await query('SELECT id FROM provinces WHERE code = ?', [String(prov.code)]);
      if (provRows.length === 0) continue;
      const provId = provRows[0].id;

      const distRes = await fetch(`https://provinces.open-api.vn/api/p/${prov.code}?depth=3`);
      const distData = await distRes.json();

      if (distData.districts) {
        for (const dist of distData.districts) {
          const distId = require('uuid').v4();
          await query(
            'INSERT IGNORE INTO districts (id, province_id, name, code) VALUES (?, ?, ?, ?)',
            [distId, provId, dist.name, String(dist.code)]
          );

          if (dist.wards) {
            for (const ward of dist.wards) {
              await query(
                'INSERT IGNORE INTO wards (id, district_id, name, code) VALUES (?, ?, ?, ?)',
                [require('uuid').v4(), distId, ward.name, String(ward.code)]
              );
            }
          }
        }
      }
    }

    res.json({ message: 'Seed dữ liệu địa giới hành chính thành công' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getProvinces,
  getDistricts,
  getWards,
  seedLocations,
};

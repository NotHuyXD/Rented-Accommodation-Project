// ============================================================
// Location Controller - Provinces, Districts, Wards (v2.0)
// ============================================================
const { query } = require('../config/db');

/**
 * GET /locations/provinces
 */
async function getProvinces(req, res, next) {
  try {
    const provinces = await query(`
      SELECT MIN(id) as id, name, code 
      FROM provinces 
      GROUP BY code, name 
      ORDER BY name
    `);
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
    
    // Find the code for this province to handle duplicates
    const provs = await query('SELECT code FROM provinces WHERE id = ?', [provinceId]);
    if (provs.length === 0) return res.json({ data: [] });
    const code = provs[0].code;
    
    const provIdsRows = await query('SELECT id FROM provinces WHERE code = ?', [code]);
    const provIds = provIdsRows.map(p => p.id);
    
    if (provIds.length === 0) return res.json({ data: [] });
    
    const districts = await query(
      `SELECT MIN(id) as id, name, code 
       FROM districts 
       WHERE province_id IN (${provIds.map(() => '?').join(',')}) 
       GROUP BY code, name 
       ORDER BY name`,
      [...provIds]
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
    
    // Find the code for this district to handle duplicates
    const dists = await query('SELECT code FROM districts WHERE id = ?', [districtId]);
    if (dists.length === 0) return res.json({ data: [] });
    const code = dists[0].code;
    
    const distIdsRows = await query('SELECT id FROM districts WHERE code = ?', [code]);
    const distIds = distIdsRows.map(d => d.id);
    
    if (distIds.length === 0) return res.json({ data: [] });
    
    const wards = await query(
      `SELECT MIN(id) as id, name, code 
       FROM wards 
       WHERE district_id IN (${distIds.map(() => '?').join(',')}) 
       GROUP BY code, name 
       ORDER BY name`,
      [...distIds]
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
    const fetch = (await import('node-fetch')).default;
    
    // Fetch all Vietnam provinces, districts, and wards in one go
    const response = await fetch('https://provinces.open-api.vn/api/?depth=3');
    const provData = await response.json();
    
    for (const prov of provData) {
      // Insert province
      const provId = require('uuid').v4();
      await query(
        'INSERT IGNORE INTO provinces (id, name, code) VALUES (?, ?, ?)',
        [provId, prov.name, String(prov.code)]
      );

      const provRows = await query('SELECT id FROM provinces WHERE code = ?', [String(prov.code)]);
      if (provRows.length === 0) continue;
      const dbProvId = provRows[0].id;

      if (prov.districts && prov.districts.length > 0) {
        // Bulk insert districts
        const distValues = [];
        const distParams = [];
        for (const dist of prov.districts) {
          distValues.push('(?, ?, ?, ?)');
          distParams.push(require('uuid').v4(), dbProvId, dist.name, String(dist.code));
        }
        await query(`INSERT IGNORE INTO districts (id, province_id, name, code) VALUES ${distValues.join(',')}`, distParams);

        // Fetch back inserted districts to map codes to UUIDs
        const dbDistricts = await query('SELECT id, code FROM districts WHERE province_id = ?', [dbProvId]);
        const distIdMap = {};
        for (const d of dbDistricts) {
          distIdMap[d.code] = d.id;
        }

        // Bulk insert wards
        const wardValues = [];
        const wardParams = [];
        for (const dist of prov.districts) {
          if (dist.wards) {
            const dbDistId = distIdMap[String(dist.code)];
            if (!dbDistId) continue;
            for (const ward of dist.wards) {
              wardValues.push('(?, ?, ?, ?)');
              wardParams.push(require('uuid').v4(), dbDistId, ward.name, String(ward.code));
            }
          }
        }

        if (wardValues.length > 0) {
          const chunkSize = 1000; // max 1000 wards per batch
          for (let i = 0; i < wardValues.length; i += chunkSize) {
            const chunkValues = wardValues.slice(i, i + chunkSize);
            const chunkParams = wardParams.slice(i * 4, (i + chunkSize) * 4);
            await query(`INSERT IGNORE INTO wards (id, district_id, name, code) VALUES ${chunkValues.join(',')}`, chunkParams);
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

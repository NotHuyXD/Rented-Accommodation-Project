// ============================================================
// Promotion Controller - Banners, VIP Packages, Coupons
// ============================================================
const { query } = require('../config/db');

async function listBanners(req, res, next) {
  try {
    const { position } = req.query;
    let sql = 'SELECT * FROM banners WHERE is_active = 1 AND start_date <= NOW() AND end_date >= NOW()';
    const params = [];
    if (position) { sql += ' AND position = ?'; params.push(position); }
    sql += ' ORDER BY sort_order ASC';

    const banners = await query(sql, params);
    
    // Log impressions async
    banners.forEach(b => {
      query('UPDATE banners SET impression_count = impression_count + 1 WHERE id = ?', [b.id]).catch(() => {});
    });

    res.json({ data: banners });
  } catch (error) { next(error); }
}

async function listVipPackages(req, res, next) {
  try {
    const packages = await query(
      'SELECT * FROM vip_packages WHERE is_active = 1 ORDER BY sort_order ASC'
    );
    res.json({ data: packages });
  } catch (error) { next(error); }
}

async function listCoupons(req, res, next) {
  try {
    // Return visible active coupons for the user
    const coupons = await query(
      `SELECT id, code, name, description, discount_type, discount_value, max_discount, min_order_amount, end_date
       FROM coupons 
       WHERE is_active = 1 AND start_date <= NOW() AND end_date >= NOW()
       ORDER BY end_date ASC LIMIT 20`
    );
    res.json({ data: coupons });
  } catch (error) { next(error); }
}

module.exports = { listBanners, listVipPackages, listCoupons };

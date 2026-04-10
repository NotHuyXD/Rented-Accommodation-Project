// ============================================================
// Admin Controller - Analytics, System Configs, Audits
// ============================================================
const { query } = require('../config/db');

async function getDashboardStats(req, res, next) {
  try {
    const userCount = await query('SELECT COUNT(*) as count FROM users');
    const roomCount = await query('SELECT COUNT(*) as count FROM rooms');
    const bookingCount = await query('SELECT COUNT(*) as count FROM bookings');
    const contractCount = await query('SELECT COUNT(*) as count FROM contracts');
    const invoiceSum = await query("SELECT SUM(total_amount) as total FROM invoices WHERE status = 'paid'");

    res.json({
      data: {
        totalUsers: userCount[0].count,
        totalRooms: roomCount[0].count,
        totalBookings: bookingCount[0].count,
        totalContracts: contractCount[0].count,
        totalRevenue: invoiceSum[0].total || 0,
      }
    });
  } catch (error) { next(error); }
}

async function listSystemConfigs(req, res, next) {
  try {
    const configs = await query('SELECT * FROM system_configs ORDER BY category, `key`');
    res.json({ data: configs });
  } catch (error) { next(error); }
}

async function updateSystemConfig(req, res, next) {
  try {
    const { id } = req.params;
    const { value } = req.body;
    await query('UPDATE system_configs SET value = ?, updated_by = ? WHERE id = ?', [value, req.user.id, id]);
    res.json({ message: 'Cập nhật cấu hình thành công' });
  } catch (error) { next(error); }
}

async function listAuditLogs(req, res, next) {
  try {
    const logs = await query(
      `SELECT l.*, u.full_name as admin_name 
       FROM audit_logs l JOIN users u ON l.admin_id = u.id
       ORDER BY l.created_at DESC LIMIT 50`
    );
    res.json({ data: logs });
  } catch (error) { next(error); }
}

module.exports = { getDashboardStats, listSystemConfigs, updateSystemConfig, listAuditLogs };

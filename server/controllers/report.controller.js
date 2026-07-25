// ============================================================
// Report Controller (v2.0 schema)
// ============================================================
const { query } = require('../config/db');
const { generateUUID } = require('../utils/helpers');

/**
 * POST /reports - Create report
 */
async function createReport(req, res, next) {
  try {
    const { targetType, targetId, reason, description } = req.body;
    if (!targetType || !targetId || !reason) {
      return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
    }

    await query(
      'INSERT INTO reports (id, reporter_id, target_type, target_id, reason, description) VALUES (?, ?, ?, ?, ?, ?)',
      [generateUUID(), req.user.id, targetType, targetId, reason, description || null]
    );

    res.status(201).json({ message: 'Gửi báo cáo thành công' });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /reports - List reports (admin)
 */
async function listReports(req, res, next) {
  try {
    const { status, targetType } = req.query;
    let conditions = [];
    const params = [];

    if (status) { conditions.push('rpt.status = ?'); params.push(status); }
    if (targetType) { conditions.push('rpt.target_type = ?'); params.push(targetType); }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const reports = await query(
      `SELECT rpt.*, u.full_name as reporter_name, u.email as reporter_email
       FROM reports rpt
       JOIN users u ON rpt.reporter_id = u.id
       ${whereClause}
       ORDER BY rpt.created_at DESC`, params
    );

    res.json({ data: reports });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /reports/:id - Update report status (admin)
 */
async function updateReportStatus(req, res, next) {
  try {
    const { status } = req.body;
    if (!['resolved', 'dismissed'].includes(status)) {
      return res.status(400).json({ message: 'Trạng thái không hợp lệ' });
    }

    await query('UPDATE reports SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ message: 'Cập nhật trạng thái báo cáo thành công' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createReport,
  listReports,
  updateReportStatus,
};

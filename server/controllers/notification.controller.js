// ============================================================
// Notification Controller (v2.0 schema)
// ============================================================
const { query } = require('../config/db');

/**
 * GET /notifications
 */
async function listNotifications(req, res, next) {
  try {
    const { page = 1, limit = 20, unreadOnly } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let whereClause = 'WHERE user_id = ?';
    const params = [req.user.id];

    if (unreadOnly === '1') { whereClause += ' AND is_read = 0'; }

    const countResult = await query(`SELECT COUNT(*) as total FROM notifications ${whereClause}`, [...params]);
    const total = countResult[0]?.total || 0;

    params.push(parseInt(limit), offset);
    const notifications = await query(
      `SELECT id, type, title, body, is_read, ref_id, created_at
       FROM notifications ${whereClause}
       ORDER BY created_at DESC LIMIT ? OFFSET ?`, params
    );

    const unreadCount = await query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
      [req.user.id]
    );

    res.json({
      data: notifications,
      unreadCount: unreadCount[0]?.count || 0,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /notifications/:id/read
 */
async function markAsRead(req, res, next) {
  try {
    await query('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ message: 'Đã đánh dấu đã đọc' });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /notifications/read-all
 */
async function markAllAsRead(req, res, next) {
  try {
    await query('UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0', [req.user.id]);
    res.json({ message: 'Đã đánh dấu tất cả đã đọc' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listNotifications,
  markAsRead,
  markAllAsRead,
};

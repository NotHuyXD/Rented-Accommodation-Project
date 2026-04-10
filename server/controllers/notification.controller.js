// ============================================================
// Notification Controller - List, Mark Read, Count Unread
// ============================================================
const { query } = require('../config/db');
const { generateUUID, paginate } = require('../utils/helpers');

async function listNotifications(req, res, next) {
  try {
    const { page = 1, limit = 20, type, isRead } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE n.user_id = ?';
    const params = [req.user.id];

    if (type) { whereClause += ' AND n.type = ?'; params.push(type); }
    if (isRead !== undefined) { whereClause += ' AND n.is_read = ?'; params.push(parseInt(isRead)); }

    const countResult = await query(
      `SELECT COUNT(*) as total FROM notifications n ${whereClause}`, [...params]
    );
    const total = countResult[0]?.total || 0;

    params.push(parseInt(limit), offset);
    const notifications = await query(
      `SELECT n.*, s.full_name as sender_name, s.avatar_url as sender_avatar
       FROM notifications n
       LEFT JOIN users s ON n.sender_id = s.id
       ${whereClause}
       ORDER BY n.created_at DESC LIMIT ? OFFSET ?`, params
    );

    // Unread count
    const unreadResult = await query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
      [req.user.id]
    );

    res.json({
      ...paginate(notifications, page, limit, total),
      unreadCount: unreadResult[0]?.count || 0,
    });
  } catch (error) { next(error); }
}

async function markAsRead(req, res, next) {
  try {
    const { notificationIds } = req.body;

    if (notificationIds && notificationIds.length > 0) {
      const placeholders = notificationIds.map(() => '?').join(',');
      await query(
        `UPDATE notifications SET is_read = 1, read_at = NOW()
         WHERE id IN (${placeholders}) AND user_id = ?`,
        [...notificationIds, req.user.id]
      );
    }

    res.json({ message: 'Đã đánh dấu đã đọc' });
  } catch (error) { next(error); }
}

async function markAllAsRead(req, res, next) {
  try {
    await query(
      'UPDATE notifications SET is_read = 1, read_at = NOW() WHERE user_id = ? AND is_read = 0',
      [req.user.id]
    );
    res.json({ message: 'Đã đánh dấu tất cả đã đọc' });
  } catch (error) { next(error); }
}

async function getUnreadCount(req, res, next) {
  try {
    const result = await query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
      [req.user.id]
    );
    res.json({ data: { unreadCount: result[0]?.count || 0 } });
  } catch (error) { next(error); }
}

async function deleteNotification(req, res, next) {
  try {
    await query(
      'DELETE FROM notifications WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    res.json({ message: 'Đã xóa thông báo' });
  } catch (error) { next(error); }
}

async function sendNotification(req, res, next) {
  try {
    const { userId, type, title, body, entityType, entityId, actionUrl, data } = req.body;

    await query(
      `INSERT INTO notifications (id, user_id, type, title, body, entity_type, entity_id, action_url, sender_id, data, is_sent, sent_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW())`,
      [generateUUID(), userId, type, title, body, entityType || null,
       entityId || null, actionUrl || null, req.user.id, data ? JSON.stringify(data) : null]
    );

    res.status(201).json({ message: 'Đã gửi thông báo' });
  } catch (error) { next(error); }
}

module.exports = {
  listNotifications, markAsRead, markAllAsRead,
  getUnreadCount, deleteNotification, sendNotification,
};

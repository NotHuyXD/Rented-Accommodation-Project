// ============================================================
// Chat Controller - Conversations and Quick Replies
// ============================================================
const { query } = require('../config/db');
const { generateUUID, paginate } = require('../utils/helpers');

async function listConversations(req, res, next) {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const countResult = await query(
      `SELECT COUNT(*) as total FROM conversations WHERE participant_1_id = ? OR participant_2_id = ?`,
      [req.user.id, req.user.id]
    );
    const total = countResult[0]?.total || 0;

    const conversations = await query(
      `SELECT c.*, 
              CASE WHEN c.participant_1_id = ? THEN u2.full_name ELSE u1.full_name END as other_user_name,
              CASE WHEN c.participant_1_id = ? THEN u2.avatar_url ELSE u1.avatar_url END as other_user_avatar,
              CASE WHEN c.participant_1_id = ? THEN c.unread_count_1 ELSE c.unread_count_2 END as unread_count
       FROM conversations c
       JOIN users u1 ON c.participant_1_id = u1.id
       JOIN users u2 ON c.participant_2_id = u2.id
       WHERE c.participant_1_id = ? OR c.participant_2_id = ?
       ORDER BY c.last_message_at DESC LIMIT ? OFFSET ?`,
      [req.user.id, req.user.id, req.user.id, req.user.id, req.user.id, parseInt(limit), offset]
    );

    res.json(paginate(conversations, page, limit, total));
  } catch (error) { next(error); }
}

async function getOrCreateConversation(req, res, next) {
  try {
    const { otherUserId, roomId } = req.body;
    
    // Sort to ensure p1 < p2
    const p1 = req.user.id < otherUserId ? req.user.id : otherUserId;
    const p2 = req.user.id < otherUserId ? otherUserId : req.user.id;

    let sql = 'SELECT * FROM conversations WHERE participant_1_id = ? AND participant_2_id = ?';
    const params = [p1, p2];

    if (roomId) {
      sql += ' AND room_id = ?';
      params.push(roomId);
    }

    let existing = await query(sql, params);

    if (existing.length === 0) {
      const id = generateUUID();
      await query(
        `INSERT INTO conversations (id, participant_1_id, participant_2_id, room_id) VALUES (?, ?, ?, ?)`,
        [id, p1, p2, roomId || null]
      );
      existing = await query(`SELECT * FROM conversations WHERE id = ?`, [id]);
    }

    res.json({ data: existing[0] });
  } catch (error) { next(error); }
}

async function listQuickReplies(req, res, next) {
  try {
    const replies = await query(
      'SELECT * FROM quick_replies WHERE user_id = ? ORDER BY sort_order ASC', [req.user.id]
    );
    res.json({ data: replies });
  } catch (error) { next(error); }
}

module.exports = { listConversations, getOrCreateConversation, listQuickReplies };

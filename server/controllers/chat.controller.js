// ============================================================
// Chat Controller - Conversations & Messages (v2.0 schema)
// ============================================================
const { query } = require('../config/db');
const { generateUUID } = require('../utils/helpers');

/**
 * POST /chat/conversations - Create or get conversation
 */
async function getOrCreateConversation(req, res, next) {
  try {
    const { landlordId, roomId } = req.body;
    if (!landlordId) {
      return res.status(400).json({ message: 'Thiếu landlordId' });
    }

    // Check existing
    const existing = await query(
      'SELECT id FROM conversations WHERE tenant_id = ? AND landlord_id = ? AND (room_id = ? OR (room_id IS NULL AND ? IS NULL))',
      [req.user.id, landlordId, roomId || null, roomId || null]
    );

    if (existing.length > 0) {
      return res.json({ data: { id: existing[0].id } });
    }

    const convId = generateUUID();
    await query(
      'INSERT INTO conversations (id, room_id, tenant_id, landlord_id) VALUES (?, ?, ?, ?)',
      [convId, roomId || null, req.user.id, landlordId]
    );

    res.status(201).json({ data: { id: convId } });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /chat/conversations - List conversations
 */
async function listConversations(req, res, next) {
  try {
    const conversations = await query(
      `SELECT c.id, c.room_id, c.created_at,
              t.id as tenant_id, t.full_name as tenant_name, t.avatar_url as tenant_avatar,
              l.id as landlord_id, l.full_name as landlord_name, l.avatar_url as landlord_avatar,
              r.title as room_title,
              (SELECT content FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message,
              (SELECT created_at FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message_at,
              (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id AND m.is_read = 0 AND m.sender_id != ?) as unread_count
       FROM conversations c
       JOIN users t ON c.tenant_id = t.id
       JOIN users l ON c.landlord_id = l.id
       LEFT JOIN rooms r ON c.room_id = r.id
       WHERE c.tenant_id = ? OR c.landlord_id = ?
       ORDER BY last_message_at DESC`,
      [req.user.id, req.user.id, req.user.id]
    );

    res.json({ data: conversations });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /chat/conversations/:id/messages - Get messages
 */
async function getMessages(req, res, next) {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const messages = await query(
      `SELECT m.id, m.sender_id, m.content, m.is_read, m.created_at,
              u.full_name as sender_name, u.avatar_url as sender_avatar
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.conversation_id = ?
       ORDER BY m.created_at DESC LIMIT ? OFFSET ?`,
      [req.params.id, parseInt(limit), offset]
    );

    // Mark as read
    await query(
      'UPDATE messages SET is_read = 1 WHERE conversation_id = ? AND sender_id != ?',
      [req.params.id, req.user.id]
    );

    res.json({ data: messages.reverse() });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /chat/conversations/:id/messages - Send message
 */
async function sendMessage(req, res, next) {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ message: 'Nội dung không được trống' });
    }

    // Verify user is part of conversation
    const convs = await query(
      'SELECT tenant_id, landlord_id FROM conversations WHERE id = ?',
      [req.params.id]
    );
    if (convs.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy cuộc hội thoại' });
    }
    if (convs[0].tenant_id !== req.user.id && convs[0].landlord_id !== req.user.id) {
      return res.status(403).json({ message: 'Bạn không thuộc cuộc hội thoại này' });
    }

    const messageId = generateUUID();
    await query(
      'INSERT INTO messages (id, conversation_id, sender_id, content) VALUES (?, ?, ?, ?)',
      [messageId, req.params.id, req.user.id, content]
    );

    // Notify the other party
    const recipientId = convs[0].tenant_id === req.user.id ? convs[0].landlord_id : convs[0].tenant_id;
    await query(
      `INSERT INTO notifications (id, user_id, type, title, body, ref_id)
       VALUES (?, ?, 'new_message', 'Tin nhắn mới', ?, ?)`,
      [generateUUID(), recipientId, content.substring(0, 100), req.params.id]
    );

    res.status(201).json({
      data: { id: messageId, senderId: req.user.id, content, createdAt: new Date().toISOString() }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getOrCreateConversation,
  listConversations,
  getMessages,
  sendMessage,
};

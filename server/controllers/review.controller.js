// ============================================================
// Review Controller (v2.0 schema)
// ============================================================
const { query } = require('../config/db');
const { generateUUID } = require('../utils/helpers');

/**
 * POST /reviews - Create review (tenant)
 */
async function createReview(req, res, next) {
  try {
    const { roomId, rating, comment } = req.body;

    if (!roomId || !rating) {
      return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating phải từ 1 đến 5' });
    }

    // Check if already reviewed
    const existing = await query(
      'SELECT id FROM reviews WHERE room_id = ? AND tenant_id = ?',
      [roomId, req.user.id]
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Bạn đã đánh giá phòng này' });
    }

    const reviewId = generateUUID();
    await query(
      'INSERT INTO reviews (id, room_id, tenant_id, rating, comment) VALUES (?, ?, ?, ?, ?)',
      [reviewId, roomId, req.user.id, rating, comment || null]
    );

    res.status(201).json({ message: 'Đánh giá thành công', data: { id: reviewId } });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /reviews?roomId=xxx
 */
async function listReviews(req, res, next) {
  try {
    const { roomId, page = 1, limit = 10 } = req.query;
    if (!roomId) {
      return res.status(400).json({ message: 'Thiếu roomId' });
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const countResult = await query('SELECT COUNT(*) as total FROM reviews WHERE room_id = ?', [roomId]);
    const total = countResult[0]?.total || 0;

    const reviews = await query(
      `SELECT r.id, r.rating, r.comment, r.created_at,
              u.full_name as tenant_name, u.avatar_url as tenant_avatar
       FROM reviews r JOIN users u ON r.tenant_id = u.id
       WHERE r.room_id = ?
       ORDER BY r.created_at DESC LIMIT ? OFFSET ?`,
      [roomId, parseInt(limit), offset]
    );

    // Avg rating
    const avgResult = await query(
      'SELECT AVG(rating) as avg_rating FROM reviews WHERE room_id = ?', [roomId]
    );

    res.json({
      data: reviews,
      avgRating: avgResult[0]?.avg_rating ? parseFloat(avgResult[0].avg_rating).toFixed(1) : 0,
      total,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /reviews/:id
 */
async function deleteReview(req, res, next) {
  try {
    const reviews = await query('SELECT tenant_id FROM reviews WHERE id = ?', [req.params.id]);
    if (reviews.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy đánh giá' });
    }
    if (reviews[0].tenant_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Bạn không có quyền xóa đánh giá này' });
    }

    await query('DELETE FROM reviews WHERE id = ?', [req.params.id]);
    res.json({ message: 'Xóa đánh giá thành công' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createReview,
  listReviews,
  deleteReview,
};

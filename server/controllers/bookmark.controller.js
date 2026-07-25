// ============================================================
// Bookmark (Favorite) Controller (v2.0 schema)
// ============================================================
const { query } = require('../config/db');
const { generateUUID } = require('../utils/helpers');

/**
 * POST /bookmarks - Add bookmark
 */
async function addBookmark(req, res, next) {
  try {
    const { roomId } = req.body;
    if (!roomId) {
      return res.status(400).json({ message: 'Thiếu roomId' });
    }

    const existing = await query(
      'SELECT id FROM bookmarks WHERE user_id = ? AND room_id = ?',
      [req.user.id, roomId]
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Phòng đã trong danh sách yêu thích' });
    }

    await query(
      'INSERT INTO bookmarks (id, user_id, room_id) VALUES (?, ?, ?)',
      [generateUUID(), req.user.id, roomId]
    );

    res.status(201).json({ message: 'Đã thêm vào yêu thích' });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /bookmarks/:roomId - Remove bookmark
 */
async function removeBookmark(req, res, next) {
  try {
    await query(
      'DELETE FROM bookmarks WHERE user_id = ? AND room_id = ?',
      [req.user.id, req.params.roomId]
    );
    res.json({ message: 'Đã xóa khỏi yêu thích' });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /bookmarks - List user bookmarks
 */
async function listBookmarks(req, res, next) {
  try {
    const bookmarks = await query(
      `SELECT b.id, b.created_at, r.id as room_id, r.title, r.price, r.area, r.address,
              r.status, rt.name as room_type_name,
              w.name as ward_name, d.name as district_name, p.name as province_name,
              (SELECT url FROM room_images ri WHERE ri.room_id = r.id AND ri.is_cover = 1 LIMIT 1) as cover_image
       FROM bookmarks b
       JOIN rooms r ON b.room_id = r.id
       JOIN room_types rt ON r.room_type_id = rt.id
       JOIN wards w ON r.ward_id = w.id
       JOIN districts d ON w.district_id = d.id
       JOIN provinces p ON d.province_id = p.id
       WHERE b.user_id = ?
       ORDER BY b.created_at DESC`,
      [req.user.id]
    );

    res.json({ data: bookmarks });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /bookmarks/check/:roomId - Check if bookmarked
 */
async function checkBookmark(req, res, next) {
  try {
    const result = await query(
      'SELECT id FROM bookmarks WHERE user_id = ? AND room_id = ?',
      [req.user.id, req.params.roomId]
    );
    res.json({ data: { isBookmarked: result.length > 0 } });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  addBookmark,
  removeBookmark,
  listBookmarks,
  checkBookmark,
};

// ============================================================
// Favorite Controller - Add/Remove Favorites, Wishlist Collections
// ============================================================
const { query, getConnection } = require('../config/db');
const { generateUUID, paginate } = require('../utils/helpers');

async function listFavorites(req, res, next) {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const countResult = await query(
      'SELECT COUNT(*) as total FROM favorites WHERE user_id = ?', [req.user.id]
    );
    const total = countResult[0]?.total || 0;

    const favorites = await query(
      `SELECT f.id, f.note, f.created_at,
              r.id as room_id, r.title, r.slug, r.price, r.area, r.address, r.full_address,
              r.room_type, r.status, r.avg_rating, r.total_reviews, r.is_vip, r.vip_level,
              r.latitude, r.longitude,
              u.full_name as landlord_name, u.avatar_url as landlord_avatar,
              p.name as province_name, d.name as district_name,
              (SELECT url FROM room_images ri WHERE ri.room_id = r.id AND ri.is_cover = 1 LIMIT 1) as cover_image
       FROM favorites f
       JOIN rooms r ON f.room_id = r.id
       JOIN users u ON r.landlord_id = u.id
       LEFT JOIN provinces p ON r.province_id = p.id
       LEFT JOIN districts d ON r.district_id = d.id
       WHERE f.user_id = ? AND r.is_deleted = 0
       ORDER BY f.created_at DESC LIMIT ? OFFSET ?`,
      [req.user.id, parseInt(limit), offset]
    );

    res.json(paginate(favorites, page, limit, total));
  } catch (error) { next(error); }
}

async function toggleFavorite(req, res, next) {
  try {
    const { roomId } = req.body;

    const existing = await query(
      'SELECT id FROM favorites WHERE user_id = ? AND room_id = ?',
      [req.user.id, roomId]
    );

    if (existing.length > 0) {
      await query('DELETE FROM favorites WHERE user_id = ? AND room_id = ?', [req.user.id, roomId]);
      await query('UPDATE rooms SET favorite_count = GREATEST(favorite_count - 1, 0) WHERE id = ?', [roomId]);
      return res.json({ message: 'Đã bỏ yêu thích', favorited: false });
    }

    await query(
      'INSERT INTO favorites (id, user_id, room_id) VALUES (?, ?, ?)',
      [generateUUID(), req.user.id, roomId]
    );
    await query('UPDATE rooms SET favorite_count = favorite_count + 1 WHERE id = ?', [roomId]);

    res.json({ message: 'Đã thêm vào yêu thích', favorited: true });
  } catch (error) { next(error); }
}

async function removeFavorite(req, res, next) {
  try {
    const result = await query(
      'DELETE FROM favorites WHERE user_id = ? AND room_id = ?',
      [req.user.id, req.params.roomId]
    );
    if (result.affectedRows > 0) {
      await query('UPDATE rooms SET favorite_count = GREATEST(favorite_count - 1, 0) WHERE id = ?', [req.params.roomId]);
    }
    res.json({ message: 'Đã bỏ yêu thích' });
  } catch (error) { next(error); }
}

async function checkFavorite(req, res, next) {
  try {
    const existing = await query(
      'SELECT id FROM favorites WHERE user_id = ? AND room_id = ?',
      [req.user.id, req.params.roomId]
    );
    res.json({ favorited: existing.length > 0 });
  } catch (error) { next(error); }
}

// ---- Wishlist Collections ----
async function listCollections(req, res, next) {
  try {
    const collections = await query(
      `SELECT wc.*, (SELECT COUNT(*) FROM wishlist_items wi WHERE wi.collection_id = wc.id) as item_count
       FROM wishlist_collections wc WHERE wc.user_id = ? ORDER BY wc.created_at DESC`,
      [req.user.id]
    );
    res.json({ data: collections });
  } catch (error) { next(error); }
}

async function createCollection(req, res, next) {
  try {
    const { name, description, isPublic } = req.body;
    const id = generateUUID();
    const shareToken = generateUUID().replace(/-/g, '').substring(0, 20);

    await query(
      `INSERT INTO wishlist_collections (id, user_id, name, description, is_public, share_token)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, req.user.id, name, description || null, isPublic ? 1 : 0, shareToken]
    );

    res.status(201).json({ message: 'Tạo bộ sưu tập thành công', data: { id, shareToken } });
  } catch (error) { next(error); }
}

async function addToCollection(req, res, next) {
  try {
    const { roomId, note } = req.body;
    await query(
      'INSERT INTO wishlist_items (id, collection_id, room_id, note) VALUES (?, ?, ?, ?)',
      [generateUUID(), req.params.collectionId, roomId, note || null]
    );
    await query(
      'UPDATE wishlist_collections SET item_count = item_count + 1 WHERE id = ?',
      [req.params.collectionId]
    );
    res.status(201).json({ message: 'Đã thêm vào bộ sưu tập' });
  } catch (error) { next(error); }
}

async function removeFromCollection(req, res, next) {
  try {
    await query(
      'DELETE FROM wishlist_items WHERE collection_id = ? AND room_id = ?',
      [req.params.collectionId, req.params.roomId]
    );
    await query(
      'UPDATE wishlist_collections SET item_count = GREATEST(item_count - 1, 0) WHERE id = ?',
      [req.params.collectionId]
    );
    res.json({ message: 'Đã xóa khỏi bộ sưu tập' });
  } catch (error) { next(error); }
}

module.exports = {
  listFavorites, toggleFavorite, removeFavorite, checkFavorite,
  listCollections, createCollection, addToCollection, removeFromCollection,
};

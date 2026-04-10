// ============================================================
// Review Controller - CRUD, Replies, Helpful Votes
// ============================================================
const { query, getConnection } = require('../config/db');
const { generateUUID, paginate } = require('../utils/helpers');

async function listReviews(req, res, next) {
  try {
    const { page = 1, limit = 20, roomId, targetUserId, targetType, status = 'approved', sortBy = 'newest' } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (roomId) { whereClause += ' AND rv.room_id = ?'; params.push(roomId); }
    if (targetUserId) { whereClause += ' AND rv.target_user_id = ?'; params.push(targetUserId); }
    if (targetType) { whereClause += ' AND rv.target_type = ?'; params.push(targetType); }
    if (status) { whereClause += ' AND rv.status = ?'; params.push(status); }

    const countResult = await query(`SELECT COUNT(*) as total FROM reviews rv ${whereClause}`, [...params]);
    const total = countResult[0]?.total || 0;

    let orderBy = 'ORDER BY rv.created_at DESC';
    if (sortBy === 'rating_high') orderBy = 'ORDER BY rv.overall_rating DESC';
    if (sortBy === 'rating_low') orderBy = 'ORDER BY rv.overall_rating ASC';
    if (sortBy === 'helpful') orderBy = 'ORDER BY rv.helpful_count DESC';

    params.push(parseInt(limit), offset);
    const reviews = await query(
      `SELECT rv.*, u.full_name as reviewer_name, u.avatar_url as reviewer_avatar
       FROM reviews rv
       JOIN users u ON rv.reviewer_id = u.id
       ${whereClause} ${orderBy} LIMIT ? OFFSET ?`, params
    );

    // Get images & replies for each review
    for (const review of reviews) {
      review.images = await query(
        'SELECT url, thumbnail_url, caption FROM review_images WHERE review_id = ? ORDER BY sort_order', [review.id]
      );
      review.replies = await query(
        `SELECT rr.*, u.full_name as user_name, u.avatar_url as user_avatar
         FROM review_replies rr JOIN users u ON rr.user_id = u.id
         WHERE rr.review_id = ? AND rr.status = 'approved' ORDER BY rr.created_at`, [review.id]
      );
    }

    // Get rating summary
    let summary = null;
    if (roomId || targetUserId) {
      const summaryQuery = roomId
        ? `SELECT COUNT(*) as total_reviews, AVG(overall_rating) as avg_rating,
           SUM(CASE WHEN overall_rating = 5 THEN 1 ELSE 0 END) as five_star,
           SUM(CASE WHEN overall_rating >= 4 AND overall_rating < 5 THEN 1 ELSE 0 END) as four_star,
           SUM(CASE WHEN overall_rating >= 3 AND overall_rating < 4 THEN 1 ELSE 0 END) as three_star,
           SUM(CASE WHEN overall_rating >= 2 AND overall_rating < 3 THEN 1 ELSE 0 END) as two_star,
           SUM(CASE WHEN overall_rating < 2 THEN 1 ELSE 0 END) as one_star
           FROM reviews WHERE room_id = ? AND status = 'approved'`
        : `SELECT COUNT(*) as total_reviews, AVG(overall_rating) as avg_rating
           FROM reviews WHERE target_user_id = ? AND status = 'approved'`;
      const summaryResult = await query(summaryQuery, [roomId || targetUserId]);
      summary = summaryResult[0];
    }

    res.json({ ...paginate(reviews, page, limit, total), summary });
  } catch (error) { next(error); }
}

async function createReview(req, res, next) {
  const conn = await getConnection();
  try {
    await conn.beginTransaction();

    const {
      targetType, targetUserId, roomId, contractId,
      overallRating, title, content, pros, cons,
      stayDurationMonths, criteriaRatings = [], images = []
    } = req.body;

    const reviewId = generateUUID();

    await conn.execute(
      `INSERT INTO reviews 
       (id, reviewer_id, target_type, target_user_id, room_id, contract_id,
        overall_rating, title, content, pros, cons, stay_duration_months, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved')`,
      [reviewId, req.user.id, targetType, targetUserId || null, roomId || null,
       contractId || null, overallRating, title || null, content || null,
       pros || null, cons || null, stayDurationMonths || null]
    );

    // Criteria ratings
    for (const cr of criteriaRatings) {
      await conn.execute(
        'INSERT INTO review_criteria_ratings (id, review_id, criteria_id, rating) VALUES (?, ?, ?, ?)',
        [generateUUID(), reviewId, cr.criteriaId, cr.rating]
      );
    }

    // Images
    for (let i = 0; i < images.length; i++) {
      await conn.execute(
        'INSERT INTO review_images (id, review_id, url, caption, sort_order) VALUES (?, ?, ?, ?, ?)',
        [generateUUID(), reviewId, images[i].url || images[i], images[i].caption || null, i]
      );
    }

    // Update target stats
    if (roomId) {
      const [stats] = await conn.execute(
        `SELECT COUNT(*) as cnt, AVG(overall_rating) as avg FROM reviews WHERE room_id = ? AND status = 'approved'`,
        [roomId]
      );
      await conn.execute(
        'UPDATE rooms SET total_reviews = ?, avg_rating = ? WHERE id = ?',
        [stats[0].cnt, stats[0].avg || 0, roomId]
      );
    }
    if (targetUserId) {
      const [stats] = await conn.execute(
        `SELECT COUNT(*) as cnt, AVG(overall_rating) as avg FROM reviews WHERE target_user_id = ? AND status = 'approved'`,
        [targetUserId]
      );
      await conn.execute(
        'UPDATE users SET total_reviews_received = ?, avg_rating = ? WHERE id = ?',
        [stats[0].cnt, stats[0].avg || 0, targetUserId]
      );
    }

    await conn.commit();
    res.status(201).json({ message: 'Đánh giá thành công', data: { id: reviewId } });
  } catch (error) { await conn.rollback(); next(error); } finally { conn.release(); }
}

async function replyToReview(req, res, next) {
  try {
    const { content } = req.body;
    const reviewId = req.params.id;

    // Check if review exists
    const reviews = await query('SELECT * FROM reviews WHERE id = ?', [reviewId]);
    if (reviews.length === 0) return res.status(404).json({ message: 'Đánh giá không tồn tại' });

    const isFromLandlord = reviews[0].target_user_id === req.user.id ||
      (reviews[0].room_id && (await query('SELECT landlord_id FROM rooms WHERE id = ?', [reviews[0].room_id]))[0]?.landlord_id === req.user.id);

    const replyId = generateUUID();
    await query(
      `INSERT INTO review_replies (id, review_id, user_id, content, is_from_landlord)
       VALUES (?, ?, ?, ?, ?)`,
      [replyId, reviewId, req.user.id, content, isFromLandlord ? 1 : 0]
    );

    await query('UPDATE reviews SET reply_count = reply_count + 1 WHERE id = ?', [reviewId]);

    res.status(201).json({ message: 'Phản hồi thành công', data: { id: replyId } });
  } catch (error) { next(error); }
}

async function voteHelpful(req, res, next) {
  try {
    const reviewId = req.params.id;

    // Check existing vote
    const existing = await query(
      'SELECT 1 FROM review_helpful_votes WHERE user_id = ? AND review_id = ?',
      [req.user.id, reviewId]
    );

    if (existing.length > 0) {
      await query('DELETE FROM review_helpful_votes WHERE user_id = ? AND review_id = ?', [req.user.id, reviewId]);
      await query('UPDATE reviews SET helpful_count = helpful_count - 1 WHERE id = ?', [reviewId]);
      return res.json({ message: 'Đã bỏ vote', voted: false });
    }

    await query(
      'INSERT INTO review_helpful_votes (user_id, review_id) VALUES (?, ?)',
      [req.user.id, reviewId]
    );
    await query('UPDATE reviews SET helpful_count = helpful_count + 1 WHERE id = ?', [reviewId]);

    res.json({ message: 'Đã vote hữu ích', voted: true });
  } catch (error) { next(error); }
}

async function deleteReview(req, res, next) {
  try {
    await query("UPDATE reviews SET status = 'hidden' WHERE id = ?", [req.params.id]);
    res.json({ message: 'Đã ẩn đánh giá' });
  } catch (error) { next(error); }
}

module.exports = { listReviews, createReview, replyToReview, voteHelpful, deleteReview };

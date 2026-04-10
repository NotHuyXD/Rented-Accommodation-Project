// ============================================================
// User Controller - CRUD, KYC, Badges
// ============================================================
const { query, getConnection } = require('../config/db');
const { generateUUID, paginate } = require('../utils/helpers');

/**
 * GET /users - List users (admin)
 */
async function listUsers(req, res, next) {
  try {
    const { page = 1, limit = 20, role, status, search } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE u.is_deleted = 0';
    const params = [];

    if (role) { whereClause += ' AND u.role = ?'; params.push(role); }
    if (status) { whereClause += ' AND u.status = ?'; params.push(status); }
    if (search) {
      whereClause += ' AND (u.full_name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    const countParams = [...params];
    const [countResult] = await query(
      `SELECT COUNT(*) as total FROM users u ${whereClause}`, countParams
    );
    const total = countResult?.total || 0;

    params.push(parseInt(limit), offset);
    const users = await query(
      `SELECT u.id, u.email, u.phone, u.full_name, u.avatar_url, u.role, u.status,
              u.email_verified, u.phone_verified, u.identity_verified,
              u.trust_score, u.avg_rating, u.total_reviews_received,
              u.login_count, u.last_login_at, u.created_at
       FROM users u ${whereClause}
       ORDER BY u.created_at DESC LIMIT ? OFFSET ?`, params
    );

    res.json(paginate(users, page, limit, total));
  } catch (error) {
    next(error);
  }
}

/**
 * GET /users/:id
 */
async function getUserById(req, res, next) {
  try {
    const users = await query(
      `SELECT u.id, u.email, u.phone, u.full_name, u.avatar_url, u.cover_photo_url,
              u.gender, u.date_of_birth, u.role, u.status,
              u.email_verified, u.phone_verified, u.identity_verified,
              u.trust_score, u.avg_rating, u.total_reviews_received, u.referral_code,
              u.created_at,
              up.bio, up.occupation, up.company, up.school,
              up.address, up.ward, up.district, up.city
       FROM users u
       LEFT JOIN user_profiles up ON u.id = up.user_id
       WHERE u.id = ? AND u.is_deleted = 0`, [req.params.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    // Get badges
    const badges = await query(
      `SELECT b.name, b.display_name, b.icon_url, b.color, ub.earned_at
       FROM user_badges ub JOIN badges b ON ub.badge_id = b.id
       WHERE ub.user_id = ?`, [req.params.id]
    );

    res.json({ data: { ...users[0], badges } });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /users/:id/status - Ban/Unban user (admin)
 */
async function updateUserStatus(req, res, next) {
  try {
    const { status, reason } = req.body;
    await query(
      'UPDATE users SET status = ? WHERE id = ?', [status, req.params.id]
    );

    // Audit log
    await query(
      `INSERT INTO audit_logs (id, admin_id, action, entity_type, entity_id, new_values, reason, ip_address)
       VALUES (?, ?, 'update_status', 'user', ?, ?, ?, ?)`,
      [generateUUID(), req.user.id, req.params.id, JSON.stringify({ status }), reason || null, req.ip]
    );

    res.json({ message: 'Cập nhật trạng thái thành công' });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /users/:id/verify-identity - Submit KYC
 */
async function submitKYC(req, res, next) {
  try {
    const { documentType, documentNumber, documentFrontUrl, documentBackUrl,
            selfieUrl, fullNameOnDoc, dateOfBirthOnDoc, addressOnDoc } = req.body;

    await query(
      `INSERT INTO identity_verifications 
       (id, user_id, document_type, document_number, document_front_url, document_back_url,
        selfie_url, full_name_on_doc, date_of_birth_on_doc, address_on_doc, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [generateUUID(), req.params.id, documentType, documentNumber,
       documentFrontUrl, documentBackUrl, selfieUrl, fullNameOnDoc,
       dateOfBirthOnDoc || null, addressOnDoc || null]
    );

    res.status(201).json({ message: 'Yêu cầu xác minh đã được gửi' });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /users/:id/verify-identity/:verificationId - Approve/Reject KYC (admin)
 */
async function processKYC(req, res, next) {
  const conn = await getConnection();
  try {
    await conn.beginTransaction();
    const { status, rejectionReason } = req.body;

    await conn.execute(
      `UPDATE identity_verifications SET status = ?, verified_by = ?, verified_at = NOW(),
       rejection_reason = ? WHERE id = ? AND user_id = ?`,
      [status, req.user.id, rejectionReason || null, req.params.verificationId, req.params.id]
    );

    if (status === 'approved') {
      await conn.execute(
        'UPDATE users SET identity_verified = 1 WHERE id = ?', [req.params.id]
      );
    }

    await conn.commit();
    res.json({ message: `Xác minh ${status === 'approved' ? 'đã duyệt' : 'đã từ chối'}` });
  } catch (error) {
    await conn.rollback();
    next(error);
  } finally {
    conn.release();
  }
}

/**
 * GET /users/:id/activity
 */
async function getUserActivity(req, res, next) {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const activities = await query(
      `SELECT action, entity_type, entity_id, metadata, ip_address, created_at
       FROM activity_logs WHERE user_id = ?
       ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [req.params.id, parseInt(limit), offset]
    );

    res.json({ data: activities });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /users/:id - Soft delete
 */
async function deleteUser(req, res, next) {
  try {
    await query(
      'UPDATE users SET is_deleted = 1, deleted_at = NOW(), status = ? WHERE id = ?',
      ['deactivated', req.params.id]
    );
    res.json({ message: 'Xóa tài khoản thành công' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listUsers,
  getUserById,
  updateUserStatus,
  submitKYC,
  processKYC,
  getUserActivity,
  deleteUser,
};

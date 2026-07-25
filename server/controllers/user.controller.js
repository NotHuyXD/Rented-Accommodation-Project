// ============================================================
// User Controller - User management, KYC (v2.0 schema)
// ============================================================
const { query } = require('../config/db');
const { generateUUID } = require('../utils/helpers');

/**
 * GET /users - List users (admin)
 */
async function listUsers(req, res, next) {
  try {
    const { page = 1, limit = 20, role, search } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let conditions = [];
    const params = [];

    if (role) { conditions.push('role = ?'); params.push(role); }
    if (search) {
      conditions.push('(full_name LIKE ? OR email LIKE ? OR phone LIKE ?)');
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
    const countResult = await query(`SELECT COUNT(*) as total FROM users ${whereClause}`, [...params]);
    const total = countResult[0]?.total || 0;

    params.push(parseInt(limit), offset);
    const users = await query(
      `SELECT id, full_name, email, phone, avatar_url, role, is_verified, kyc_status, created_at
       FROM users ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`, params
    );

    res.json({
      data: users.map(u => ({
        id: u.id, fullName: u.full_name, email: u.email, phone: u.phone,
        avatar: u.avatar_url, role: u.role, isVerified: !!u.is_verified,
        kycStatus: u.kyc_status, createdAt: u.created_at,
      })),
      pagination: {
        page: parseInt(page), limit: parseInt(limit), total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /users/:id - Get user by ID
 */
async function getUserById(req, res, next) {
  try {
    const users = await query(
      'SELECT id, full_name, email, phone, avatar_url, role, is_verified, kyc_status, created_at FROM users WHERE id = ?',
      [req.params.id]
    );
    if (users.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
    const u = users[0];
    res.json({
      data: {
        id: u.id, fullName: u.full_name, email: u.email, phone: u.phone,
        avatar: u.avatar_url, role: u.role, isVerified: !!u.is_verified,
        kycStatus: u.kyc_status, createdAt: u.created_at,
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /users/kyc - Submit KYC verification
 */
async function submitKYC(req, res, next) {
  try {
    const { idCardFront, idCardBack, selfieUrl } = req.body;
    if (!idCardFront || !idCardBack) {
      return res.status(400).json({ message: 'Vui lòng cung cấp ảnh CCCD mặt trước và mặt sau' });
    }

    // Check if already submitted
    const existing = await query('SELECT id FROM user_verifications WHERE user_id = ?', [req.user.id]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Bạn đã gửi yêu cầu xác thực trước đó' });
    }

    await query(
      `INSERT INTO user_verifications (id, user_id, id_card_front, id_card_back, selfie_url)
       VALUES (?, ?, ?, ?, ?)`,
      [generateUUID(), req.user.id, idCardFront, idCardBack, selfieUrl || null]
    );

    await query('UPDATE users SET kyc_status = ? WHERE id = ?', ['pending', req.user.id]);

    res.status(201).json({ message: 'Gửi yêu cầu xác thực thành công' });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /users/kyc/pending - List pending KYC (admin)
 */
async function listPendingKYC(req, res, next) {
  try {
    const verifications = await query(
      `SELECT uv.*, u.full_name, u.email, u.phone, u.role
       FROM user_verifications uv
       JOIN users u ON uv.user_id = u.id
       WHERE uv.status = 'pending'
       ORDER BY uv.created_at ASC`
    );
    res.json({ data: verifications });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /users/kyc/:id/review - Review KYC (admin)
 */
async function reviewKYC(req, res, next) {
  try {
    const { status } = req.body; // 'approved' or 'rejected'
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Trạng thái không hợp lệ' });
    }

    const verifications = await query('SELECT user_id FROM user_verifications WHERE id = ?', [req.params.id]);
    if (verifications.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy yêu cầu xác thực' });
    }

    await query(
      'UPDATE user_verifications SET status = ?, reviewed_by = ?, reviewed_at = NOW() WHERE id = ?',
      [status, req.user.id, req.params.id]
    );

    const userId = verifications[0].user_id;
    await query(
      'UPDATE users SET kyc_status = ?, is_verified = ? WHERE id = ?',
      [status, status === 'approved' ? 1 : 0, userId]
    );

    res.json({ message: `Xác thực đã được ${status === 'approved' ? 'phê duyệt' : 'từ chối'}` });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listUsers,
  getUserById,
  submitKYC,
  listPendingKYC,
  reviewKYC,
};

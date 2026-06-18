// ============================================================
// Admin Controller (v2.0 schema)
// ============================================================
const { query } = require('../config/db');

/**
 * GET /admin/stats - Dashboard statistics
 */
async function getStats(req, res, next) {
  try {
    const usersResult = await query('SELECT COUNT(*) as total FROM users');
    const roomsResult = await query('SELECT COUNT(*) as total FROM rooms');
    const contractsResult = await query("SELECT COUNT(*) as total FROM contracts WHERE status = 'active'");
    const pendingRequestsResult = await query("SELECT COUNT(*) as total FROM rental_requests WHERE status = 'pending'");
    const pendingKycResult = await query("SELECT COUNT(*) as total FROM user_verifications WHERE status = 'pending'");
    const pendingReportsResult = await query("SELECT COUNT(*) as total FROM reports WHERE status = 'pending'");
    const revenueResult = await query("SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'success'");

    // Recent activities
    const recentUsers = await query(
      'SELECT id, full_name, email, role, created_at FROM users ORDER BY created_at DESC LIMIT 5'
    );
    const recentRooms = await query(
      'SELECT id, title, price, status, created_at FROM rooms ORDER BY created_at DESC LIMIT 5'
    );

    res.json({
      data: {
        totalUsers: usersResult[0]?.total || 0,
        totalRooms: roomsResult[0]?.total || 0,
        activeContracts: contractsResult[0]?.total || 0,
        pendingRequests: pendingRequestsResult[0]?.total || 0,
        pendingKyc: pendingKycResult[0]?.total || 0,
        pendingReports: pendingReportsResult[0]?.total || 0,
        totalRevenue: revenueResult[0]?.total || 0,
        recentUsers: recentUsers.map(u => ({
          id: u.id, fullName: u.full_name, email: u.email, role: u.role, createdAt: u.created_at,
        })),
        recentRooms: recentRooms.map(r => ({
          id: r.id, title: r.title, price: parseFloat(r.price), status: r.status, createdAt: r.created_at,
        })),
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /admin/rooms - List all rooms (admin)
 */
async function listAllRooms(req, res, next) {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let conditions = [];
    const params = [];

    if (status) { conditions.push('r.status = ?'); params.push(status); }
    if (search) {
      conditions.push('(r.title LIKE ? OR r.address LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const countResult = await query(`SELECT COUNT(*) as total FROM rooms r ${whereClause}`, [...params]);
    const total = countResult[0]?.total || 0;

    params.push(parseInt(limit), offset);
    const rooms = await query(
      `SELECT r.id, r.title, r.price, r.area, r.address, r.status, r.created_at,
              u.full_name as landlord_name, rt.name as room_type_name
       FROM rooms r
       JOIN users u ON r.landlord_id = u.id
       JOIN room_types rt ON r.room_type_id = rt.id
       ${whereClause}
       ORDER BY r.created_at DESC LIMIT ? OFFSET ?`, params
    );

    res.json({
      data: rooms,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /admin/users - List all users (admin)
 */
async function listAllUsers(req, res, next) {
  try {
    const { page = 1, limit = 20, role, search, kycStatus } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    console.log('DEBUG [listAllUsers]:', { query: req.query, page, limit, offset });
    let conditions = [];
    const params = [];

    if (role) { conditions.push('role = ?'); params.push(role); }
    if (kycStatus && kycStatus !== 'all') {
      conditions.push('kyc_status = ?');
      params.push(kycStatus);
    }
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
 * PATCH /admin/users/:id/role - Update user role
 */
async function updateUserRole(req, res, next) {
  try {
    const { id } = req.params;
    const { role } = req.body;
    if (!['tenant', 'landlord', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Vai trò không hợp lệ' });
    }
    await query('UPDATE users SET role = ? WHERE id = ?', [role, id]);
    res.json({ message: 'Cập nhật vai trò người dùng thành công' });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /admin/users/:id/kyc - Get user verification (KYC) details
 */
async function getUserVerification(req, res, next) {
  try {
    const { id } = req.params; // user_id
    const verifications = await query(
      `SELECT uv.*, u.full_name, u.email, u.phone, u.role
       FROM user_verifications uv
       JOIN users u ON uv.user_id = u.id
       WHERE uv.user_id = ?`,
      [id]
    );
    if (verifications.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy hồ sơ xác thực của người dùng này' });
    }
    res.json({ data: verifications[0] });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /admin/reports/target/:type/:id - Get details of reported item
 */
async function getReportTarget(req, res, next) {
  try {
    const { type, id } = req.params;
    if (type === 'room') {
      const roomsResult = await query(
        `SELECT r.id, r.title, r.price, r.address, u.full_name as landlord_name
         FROM rooms r
         JOIN users u ON r.landlord_id = u.id
         WHERE r.id = ?`,
        [id]
      );
      return res.json({ data: roomsResult[0] || null });
    } else if (type === 'user') {
      const usersResult = await query(
        'SELECT id, full_name, email, role, phone, avatar_url, kyc_status FROM users WHERE id = ?',
        [id]
      );
      if (usersResult.length > 0) {
        const u = usersResult[0];
        return res.json({
          data: {
            id: u.id, fullName: u.full_name, email: u.email, role: u.role, phone: u.phone,
            avatar: u.avatar_url, kycStatus: u.kyc_status,
          }
        });
      }
      return res.json({ data: null });
    } else if (type === 'review') {
      const reviewsResult = await query(
        `SELECT rv.id, rv.rating, rv.comment, rv.created_at,
                u.full_name as tenant_name, r.title as room_title
         FROM reviews rv
         JOIN users u ON rv.tenant_id = u.id
         JOIN rooms r ON rv.room_id = r.id
         WHERE rv.id = ?`,
        [id]
      );
      return res.json({ data: reviewsResult[0] || null });
    }
    res.status(400).json({ message: 'Loại đối tượng không hợp lệ' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getStats,
  listAllRooms,
  listAllUsers,
  updateUserRole,
  getUserVerification,
  getReportTarget,
};


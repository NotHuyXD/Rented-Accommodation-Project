// ============================================================
// Contract Controller (v2.0 schema)
// ============================================================
const { query } = require('../config/db');

/**
 * GET /contracts - List contracts for user
 */
async function listContracts(req, res, next) {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let whereClause;
    if (req.user.role === 'landlord') {
      whereClause = 'WHERE c.landlord_id = ?';
    } else if (req.user.role === 'admin') {
      whereClause = 'WHERE 1=1';
    } else {
      whereClause = 'WHERE c.tenant_id = ?';
    }
    const params = req.user.role === 'admin' ? [] : [req.user.id];

    if (status) { whereClause += ' AND c.status = ?'; params.push(status); }

    const countResult = await query(`SELECT COUNT(*) as total FROM contracts c ${whereClause}`, [...params]);
    const total = countResult[0]?.total || 0;

    params.push(parseInt(limit), offset);
    const contracts = await query(
      `SELECT c.*,
              r.title as room_title, r.address as room_address, r.price as room_price,
              (SELECT url FROM room_images ri WHERE ri.room_id = r.id AND ri.is_cover = 1 LIMIT 1) as room_image,
              t.full_name as tenant_name, t.avatar_url as tenant_avatar, t.phone as tenant_phone,
              l.full_name as landlord_name, l.avatar_url as landlord_avatar, l.phone as landlord_phone
       FROM contracts c
       JOIN rooms r ON c.room_id = r.id
       JOIN users t ON c.tenant_id = t.id
       JOIN users l ON c.landlord_id = l.id
       ${whereClause}
       ORDER BY c.created_at DESC LIMIT ? OFFSET ?`, params
    );

    res.json({
      data: contracts,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /contracts/:id - Get contract detail
 */
async function getContractById(req, res, next) {
  try {
    const contracts = await query(
      `SELECT c.*,
              r.title as room_title, r.address as room_address, r.price as room_price, r.area as room_area,
              t.full_name as tenant_name, t.email as tenant_email, t.phone as tenant_phone,
              l.full_name as landlord_name, l.email as landlord_email, l.phone as landlord_phone
       FROM contracts c
       JOIN rooms r ON c.room_id = r.id
       JOIN users t ON c.tenant_id = t.id
       JOIN users l ON c.landlord_id = l.id
       WHERE c.id = ?`, [req.params.id]
    );
    if (contracts.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy hợp đồng' });
    }

    const contract = contracts[0];
    // Check access
    if (req.user.role !== 'admin' && contract.tenant_id !== req.user.id && contract.landlord_id !== req.user.id) {
      return res.status(403).json({ message: 'Bạn không có quyền xem hợp đồng này' });
    }

    res.json({ data: contract });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /contracts/:id/sign - Sign contract
 */
async function signContract(req, res, next) {
  try {
    const contracts = await query('SELECT * FROM contracts WHERE id = ?', [req.params.id]);
    if (contracts.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy hợp đồng' });
    }
    const contract = contracts[0];
    if (contract.tenant_id !== req.user.id && contract.landlord_id !== req.user.id) {
      return res.status(403).json({ message: 'Bạn không có quyền' });
    }

    await query("UPDATE contracts SET status = 'active', signed_at = NOW() WHERE id = ?", [req.params.id]);
    res.json({ message: 'Ký hợp đồng thành công' });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /contracts/:id/terminate - Terminate contract
 */
async function terminateContract(req, res, next) {
  try {
    const contracts = await query('SELECT * FROM contracts WHERE id = ?', [req.params.id]);
    if (contracts.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy hợp đồng' });
    }
    const contract = contracts[0];
    if (req.user.role !== 'admin' && contract.landlord_id !== req.user.id) {
      return res.status(403).json({ message: 'Bạn không có quyền' });
    }

    await query("UPDATE contracts SET status = 'terminated' WHERE id = ?", [req.params.id]);
    // Set room back to available
    await query("UPDATE rooms SET status = 'available' WHERE id = ?", [contract.room_id]);

    res.json({ message: 'Chấm dứt hợp đồng thành công' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listContracts,
  getContractById,
  signContract,
  terminateContract,
};

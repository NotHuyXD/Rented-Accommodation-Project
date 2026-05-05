// ============================================================
// Rental Request Controller (v2.0 - replaces booking)
// ============================================================
const { query, getConnection } = require('../config/db');
const { generateUUID } = require('../utils/helpers');

/**
 * POST /rental-requests - Create rental request (tenant)
 */
async function createRentalRequest(req, res, next) {
  try {
    const { roomId, message, moveInDate, numPeople = 1 } = req.body;

    if (!roomId || !moveInDate) {
      return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
    }

    // Check room exists and is available
    const rooms = await query('SELECT id, status, landlord_id FROM rooms WHERE id = ?', [roomId]);
    if (rooms.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy phòng' });
    }
    if (rooms[0].status !== 'available') {
      return res.status(400).json({ message: 'Phòng không còn trống' });
    }
    if (rooms[0].landlord_id === req.user.id) {
      return res.status(400).json({ message: 'Không thể thuê phòng của chính mình' });
    }

    // Check if already requested
    const existing = await query(
      "SELECT id FROM rental_requests WHERE room_id = ? AND tenant_id = ? AND status = 'pending'",
      [roomId, req.user.id]
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Bạn đã gửi yêu cầu thuê phòng này' });
    }

    const requestId = generateUUID();
    await query(
      `INSERT INTO rental_requests (id, room_id, tenant_id, message, move_in_date, num_people)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [requestId, roomId, req.user.id, message || null, moveInDate, numPeople]
    );

    // Create notification for landlord
    await query(
      `INSERT INTO notifications (id, user_id, type, title, body, ref_id)
       VALUES (?, ?, 'new_request', 'Yêu cầu thuê phòng mới', 'Có người gửi yêu cầu thuê phòng của bạn', ?)`,
      [generateUUID(), rooms[0].landlord_id, requestId]
    );

    res.status(201).json({ message: 'Gửi yêu cầu thuê phòng thành công', data: { id: requestId } });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /rental-requests - List requests (tenant sees own, landlord sees received)
 */
async function listRentalRequests(req, res, next) {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let whereClause;
    const params = [];

    if (req.user.role === 'landlord') {
      whereClause = 'WHERE r.landlord_id = ?';
      params.push(req.user.id);
    } else {
      whereClause = 'WHERE rr.tenant_id = ?';
      params.push(req.user.id);
    }

    if (status) { whereClause += ' AND rr.status = ?'; params.push(status); }

    const countResult = await query(
      `SELECT COUNT(*) as total FROM rental_requests rr JOIN rooms r ON rr.room_id = r.id ${whereClause}`,
      [...params]
    );
    const total = countResult[0]?.total || 0;

    params.push(parseInt(limit), offset);
    const requests = await query(
      `SELECT rr.id, rr.room_id, rr.tenant_id, rr.message, rr.move_in_date,
              rr.num_people, rr.status, rr.contract_id, rr.created_at,
              r.title as room_title, r.address as room_address, r.price as room_price,
              (SELECT url FROM room_images ri WHERE ri.room_id = r.id AND ri.is_cover = 1 LIMIT 1) as room_image,
              u.full_name as tenant_name, u.avatar_url as tenant_avatar, u.phone as tenant_phone,
              lu.full_name as landlord_name
       FROM rental_requests rr
       JOIN rooms r ON rr.room_id = r.id
       JOIN users u ON rr.tenant_id = u.id
       JOIN users lu ON r.landlord_id = lu.id
       ${whereClause}
       ORDER BY rr.created_at DESC LIMIT ? OFFSET ?`, params
    );

    res.json({
      data: requests,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /rental-requests/:id/accept - Accept request (landlord)
 */
async function acceptRequest(req, res, next) {
  const conn = await getConnection();
  try {
    await conn.beginTransaction();

    const [requests] = await conn.execute(
      `SELECT rr.*, r.landlord_id, r.price, r.deposit
       FROM rental_requests rr JOIN rooms r ON rr.room_id = r.id
       WHERE rr.id = ?`, [req.params.id]
    );

    if (requests.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy yêu cầu' });
    }
    const request = requests[0];
    if (request.landlord_id !== req.user.id) {
      return res.status(403).json({ message: 'Bạn không có quyền' });
    }
    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Yêu cầu đã được xử lý' });
    }

    const { startDate, endDate, terms } = req.body;
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Vui lòng cung cấp ngày bắt đầu và kết thúc hợp đồng' });
    }

    // Create contract
    const contractId = generateUUID();
    await conn.execute(
      `INSERT INTO contracts (id, room_id, tenant_id, landlord_id, request_id, start_date, end_date, monthly_rent, deposit_amount, terms)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [contractId, request.room_id, request.tenant_id, req.user.id, req.params.id,
       startDate, endDate, request.price, request.deposit, terms || null]
    );

    // Update request
    await conn.execute(
      "UPDATE rental_requests SET status = 'accepted', contract_id = ? WHERE id = ?",
      [contractId, req.params.id]
    );

    // Reject other pending requests for same room
    await conn.execute(
      "UPDATE rental_requests SET status = 'rejected' WHERE room_id = ? AND id != ? AND status = 'pending'",
      [request.room_id, req.params.id]
    );

    // Update room status
    await conn.execute("UPDATE rooms SET status = 'rented' WHERE id = ?", [request.room_id]);

    // Notify tenant
    await conn.execute(
      `INSERT INTO notifications (id, user_id, type, title, body, ref_id)
       VALUES (?, ?, 'request_accepted', 'Yêu cầu thuê được chấp nhận', 'Chủ nhà đã chấp nhận yêu cầu thuê phòng của bạn', ?)`,
      [generateUUID(), request.tenant_id, contractId]
    );

    await conn.commit();
    res.json({ message: 'Chấp nhận yêu cầu thuê thành công', data: { contractId } });
  } catch (error) {
    await conn.rollback();
    next(error);
  } finally {
    conn.release();
  }
}

/**
 * PATCH /rental-requests/:id/reject - Reject request (landlord)
 */
async function rejectRequest(req, res, next) {
  try {
    const requests = await query(
      `SELECT rr.*, r.landlord_id FROM rental_requests rr JOIN rooms r ON rr.room_id = r.id WHERE rr.id = ?`,
      [req.params.id]
    );
    if (requests.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy yêu cầu' });
    }
    if (requests[0].landlord_id !== req.user.id) {
      return res.status(403).json({ message: 'Bạn không có quyền' });
    }

    await query("UPDATE rental_requests SET status = 'rejected' WHERE id = ?", [req.params.id]);

    // Notify tenant
    await query(
      `INSERT INTO notifications (id, user_id, type, title, body, ref_id)
       VALUES (?, ?, 'request_rejected', 'Yêu cầu thuê bị từ chối', 'Chủ nhà đã từ chối yêu cầu thuê phòng của bạn', ?)`,
      [generateUUID(), requests[0].tenant_id, req.params.id]
    );

    res.json({ message: 'Từ chối yêu cầu thành công' });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /rental-requests/:id/cancel - Cancel request (tenant)
 */
async function cancelRequest(req, res, next) {
  try {
    const requests = await query(
      'SELECT * FROM rental_requests WHERE id = ? AND tenant_id = ?',
      [req.params.id, req.user.id]
    );
    if (requests.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy yêu cầu' });
    }
    if (requests[0].status !== 'pending') {
      return res.status(400).json({ message: 'Chỉ có thể hủy yêu cầu đang chờ' });
    }

    await query("UPDATE rental_requests SET status = 'cancelled' WHERE id = ?", [req.params.id]);
    res.json({ message: 'Hủy yêu cầu thành công' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createRentalRequest,
  listRentalRequests,
  acceptRequest,
  rejectRequest,
  cancelRequest,
};

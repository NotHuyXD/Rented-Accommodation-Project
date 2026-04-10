// ============================================================
// Booking Controller - Create, Confirm, Reject, Cancel
// ============================================================
const { query, getConnection } = require('../config/db');
const { generateUUID, generateCode, paginate } = require('../utils/helpers');

/**
 * GET /bookings - List bookings for current user
 */
async function listBookings(req, res, next) {
  try {
    const { page = 1, limit = 20, status, bookingType, role } = req.query;
    const offset = (page - 1) * limit;
    const userId = req.user.id;

    let whereClause = 'WHERE 1=1';
    const params = [];

    // Filter by role
    if (req.user.role === 'landlord' || role === 'landlord') {
      whereClause += ' AND b.landlord_id = ?';
      params.push(userId);
    } else {
      whereClause += ' AND b.tenant_id = ?';
      params.push(userId);
    }

    if (status) { whereClause += ' AND b.status = ?'; params.push(status); }
    if (bookingType) { whereClause += ' AND b.booking_type = ?'; params.push(bookingType); }

    const countResult = await query(
      `SELECT COUNT(*) as total FROM bookings b ${whereClause}`, [...params]
    );
    const total = countResult[0]?.total || 0;

    params.push(parseInt(limit), offset);
    const bookings = await query(
      `SELECT b.*, 
              r.title as room_title, r.address as room_address, r.price as room_price,
              (SELECT url FROM room_images ri WHERE ri.room_id = r.id AND ri.is_cover = 1 LIMIT 1) as room_image,
              t.full_name as tenant_name, t.avatar_url as tenant_avatar, t.phone as tenant_phone,
              l.full_name as landlord_name, l.avatar_url as landlord_avatar, l.phone as landlord_phone
       FROM bookings b
       JOIN rooms r ON b.room_id = r.id
       JOIN users t ON b.tenant_id = t.id
       JOIN users l ON b.landlord_id = l.id
       ${whereClause}
       ORDER BY b.created_at DESC LIMIT ? OFFSET ?`, params
    );

    res.json(paginate(bookings, page, limit, total));
  } catch (error) {
    next(error);
  }
}

/**
 * GET /bookings/:id
 */
async function getBookingById(req, res, next) {
  try {
    const bookings = await query(
      `SELECT b.*,
              r.title as room_title, r.address as room_address, r.price as room_price, r.slug as room_slug,
              (SELECT url FROM room_images ri WHERE ri.room_id = r.id AND ri.is_cover = 1 LIMIT 1) as room_image,
              t.full_name as tenant_name, t.avatar_url as tenant_avatar, t.phone as tenant_phone, t.email as tenant_email,
              l.full_name as landlord_name, l.avatar_url as landlord_avatar, l.phone as landlord_phone, l.email as landlord_email,
              cp.name as policy_name, cp.free_cancel_hours, cp.penalty_percentage
       FROM bookings b
       JOIN rooms r ON b.room_id = r.id
       JOIN users t ON b.tenant_id = t.id
       JOIN users l ON b.landlord_id = l.id
       LEFT JOIN cancellation_policies cp ON b.cancellation_policy_id = cp.id
       WHERE b.id = ?`, [req.params.id]
    );

    if (bookings.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy booking' });
    }

    // Check authorization
    const booking = bookings[0];
    if (booking.tenant_id !== req.user.id && booking.landlord_id !== req.user.id &&
        !['admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Không có quyền xem booking này' });
    }

    // Get status history
    const history = await query(
      `SELECT bsh.*, u.full_name as changed_by_name
       FROM booking_status_history bsh
       LEFT JOIN users u ON bsh.changed_by = u.id
       WHERE bsh.booking_id = ? ORDER BY bsh.created_at`, [req.params.id]
    );

    res.json({ data: { ...booking, history } });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /bookings - Create booking
 */
async function createBooking(req, res, next) {
  const conn = await getConnection();
  try {
    await conn.beginTransaction();

    const {
      roomId, bookingType, scheduledDate, scheduledTimeStart, scheduledTimeEnd,
      holdAmount, desiredMoveInDate, desiredLeaseMonths, tenantMessage
    } = req.body;

    // Get room info
    const [rooms] = await conn.execute(
      'SELECT landlord_id, status, price FROM rooms WHERE id = ? AND is_deleted = 0', [roomId]
    );
    if (rooms.length === 0) {
      return res.status(404).json({ message: 'Phòng không tồn tại' });
    }
    if (rooms[0].status !== 'active') {
      return res.status(400).json({ message: 'Phòng hiện không khả dụng' });
    }
    if (rooms[0].landlord_id === req.user.id) {
      return res.status(400).json({ message: 'Bạn không thể đặt phòng của chính mình' });
    }

    const bookingId = generateUUID();
    const bookingCode = generateCode('BK', 8);

    // Get default cancellation policy
    const [policies] = await conn.execute(
      'SELECT id FROM cancellation_policies WHERE is_default = 1 LIMIT 1'
    );

    await conn.execute(
      `INSERT INTO bookings 
       (id, booking_code, booking_type, tenant_id, landlord_id, room_id, status,
        scheduled_date, scheduled_time_start, scheduled_time_end,
        hold_amount, desired_move_in_date, desired_lease_months,
        tenant_message, cancellation_policy_id)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?)`,
      [bookingId, bookingCode, bookingType, req.user.id, rooms[0].landlord_id, roomId,
       scheduledDate || null, scheduledTimeStart || null, scheduledTimeEnd || null,
       holdAmount || null, desiredMoveInDate || null, desiredLeaseMonths || null,
       tenantMessage || null, policies[0]?.id || null]
    );

    // Status history
    await conn.execute(
      `INSERT INTO booking_status_history (id, booking_id, to_status, changed_by, note)
       VALUES (?, ?, 'pending', ?, 'Booking created')`,
      [generateUUID(), bookingId, req.user.id]
    );

    // Create notification for landlord
    await conn.execute(
      `INSERT INTO notifications (id, user_id, type, title, body, entity_type, entity_id, sender_id)
       VALUES (?, ?, 'booking_new', 'Yêu cầu đặt phòng mới', ?, 'booking', ?, ?)`,
      [generateUUID(), rooms[0].landlord_id,
       `${req.user.fullName || 'Người thuê'} muốn ${bookingType === 'viewing' ? 'xem phòng' : 'đặt cọc'}`,
       bookingId, req.user.id]
    );

    // Update room contact count
    await conn.execute(
      'UPDATE rooms SET contact_count = contact_count + 1 WHERE id = ?', [roomId]
    );

    await conn.commit();

    res.status(201).json({
      message: 'Đặt phòng thành công',
      data: { id: bookingId, bookingCode }
    });
  } catch (error) {
    await conn.rollback();
    next(error);
  } finally {
    conn.release();
  }
}

/**
 * PATCH /bookings/:id/confirm
 */
async function confirmBooking(req, res, next) {
  const conn = await getConnection();
  try {
    await conn.beginTransaction();

    const { landlordMessage } = req.body;

    const [bookings] = await conn.execute(
      'SELECT * FROM bookings WHERE id = ? AND status = ?', [req.params.id, 'pending']
    );
    if (bookings.length === 0) {
      return res.status(404).json({ message: 'Booking không tồn tại hoặc không ở trạng thái chờ' });
    }

    const booking = bookings[0];
    if (booking.landlord_id !== req.user.id) {
      return res.status(403).json({ message: 'Chỉ chủ trọ mới có thể xác nhận' });
    }

    await conn.execute(
      `UPDATE bookings SET status = 'confirmed', confirmed_at = NOW(), landlord_message = ?
       WHERE id = ?`, [landlordMessage || null, req.params.id]
    );

    // Status history
    await conn.execute(
      `INSERT INTO booking_status_history (id, booking_id, from_status, to_status, changed_by)
       VALUES (?, ?, 'pending', 'confirmed', ?)`,
      [generateUUID(), req.params.id, req.user.id]
    );

    // Notify tenant
    await conn.execute(
      `INSERT INTO notifications (id, user_id, type, title, body, entity_type, entity_id, sender_id)
       VALUES (?, ?, 'booking_confirmed', 'Đặt phòng đã xác nhận', 'Chủ trọ đã xác nhận lịch xem phòng', 'booking', ?, ?)`,
      [generateUUID(), booking.tenant_id, req.params.id, req.user.id]
    );

    await conn.commit();
    res.json({ message: 'Đã xác nhận booking' });
  } catch (error) {
    await conn.rollback();
    next(error);
  } finally {
    conn.release();
  }
}

/**
 * PATCH /bookings/:id/reject
 */
async function rejectBooking(req, res, next) {
  const conn = await getConnection();
  try {
    await conn.beginTransaction();
    const { rejectionReason } = req.body;

    const [bookings] = await conn.execute(
      'SELECT * FROM bookings WHERE id = ? AND status = ?', [req.params.id, 'pending']
    );
    if (bookings.length === 0) {
      return res.status(404).json({ message: 'Booking không tồn tại hoặc không ở trạng thái chờ' });
    }

    if (bookings[0].landlord_id !== req.user.id) {
      return res.status(403).json({ message: 'Chỉ chủ trọ mới có thể từ chối' });
    }

    await conn.execute(
      `UPDATE bookings SET status = 'rejected', rejection_reason = ? WHERE id = ?`,
      [rejectionReason || 'Không có lý do', req.params.id]
    );

    await conn.execute(
      `INSERT INTO booking_status_history (id, booking_id, from_status, to_status, changed_by, note)
       VALUES (?, ?, 'pending', 'rejected', ?, ?)`,
      [generateUUID(), req.params.id, req.user.id, rejectionReason || null]
    );

    // Notify tenant
    await conn.execute(
      `INSERT INTO notifications (id, user_id, type, title, body, entity_type, entity_id, sender_id)
       VALUES (?, ?, 'booking_rejected', 'Đặt phòng bị từ chối', ?, 'booking', ?, ?)`,
      [generateUUID(), bookings[0].tenant_id, rejectionReason || 'Chủ trọ đã từ chối',
       req.params.id, req.user.id]
    );

    await conn.commit();
    res.json({ message: 'Đã từ chối booking' });
  } catch (error) {
    await conn.rollback();
    next(error);
  } finally {
    conn.release();
  }
}

/**
 * PATCH /bookings/:id/cancel
 */
async function cancelBooking(req, res, next) {
  const conn = await getConnection();
  try {
    await conn.beginTransaction();
    const { cancellationReason } = req.body;

    const [bookings] = await conn.execute(
      'SELECT * FROM bookings WHERE id = ? AND status IN (?, ?)',
      [req.params.id, 'pending', 'confirmed']
    );
    if (bookings.length === 0) {
      return res.status(404).json({ message: 'Booking không tồn tại hoặc không thể hủy' });
    }

    const booking = bookings[0];
    if (booking.tenant_id !== req.user.id && booking.landlord_id !== req.user.id) {
      return res.status(403).json({ message: 'Không có quyền hủy booking này' });
    }

    await conn.execute(
      `UPDATE bookings SET status = 'cancelled', cancellation_reason = ?, cancelled_by = ?, cancelled_at = NOW()
       WHERE id = ?`, [cancellationReason || null, req.user.id, req.params.id]
    );

    await conn.execute(
      `INSERT INTO booking_status_history (id, booking_id, from_status, to_status, changed_by, note)
       VALUES (?, ?, ?, 'cancelled', ?, ?)`,
      [generateUUID(), req.params.id, booking.status, req.user.id, cancellationReason || null]
    );

    await conn.commit();
    res.json({ message: 'Đã hủy booking' });
  } catch (error) {
    await conn.rollback();
    next(error);
  } finally {
    conn.release();
  }
}

/**
 * PATCH /bookings/:id/complete
 */
async function completeBooking(req, res, next) {
  try {
    await query(
      `UPDATE bookings SET status = 'completed', completed_at = NOW() WHERE id = ? AND status = 'confirmed'`,
      [req.params.id]
    );

    await query(
      `INSERT INTO booking_status_history (id, booking_id, from_status, to_status, changed_by)
       VALUES (?, ?, 'confirmed', 'completed', ?)`,
      [generateUUID(), req.params.id, req.user.id]
    );

    res.json({ message: 'Booking đã hoàn thành' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listBookings,
  getBookingById,
  createBooking,
  confirmBooking,
  rejectBooking,
  cancelBooking,
  completeBooking,
};

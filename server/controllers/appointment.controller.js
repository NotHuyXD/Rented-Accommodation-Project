// ============================================================
// Appointment Controller – Lịch hẹn xem phòng
// ============================================================
const { query } = require('../config/db');
const { generateUUID } = require('../utils/helpers');
const { sendLandlordAppointmentEmail, sendTenantAppointmentEmail } = require('../utils/emailService');

/**
 * POST /appointments – Tạo lịch hẹn xem phòng (tenant)
 * Body: { roomId, appointmentDate, appointmentTime, message? }
 */
async function createAppointment(req, res, next) {
  try {
    const { roomId, appointmentDate, appointmentTime, message } = req.body;

    if (!roomId || !appointmentDate || !appointmentTime) {
      return res.status(400).json({ message: 'Thiếu thông tin bắt buộc (roomId, appointmentDate, appointmentTime)' });
    }

    // Kiểm tra ngày hẹn không phải quá khứ
    const now = new Date();
    const apptDateTime = new Date(`${appointmentDate}T${appointmentTime}`);
    if (apptDateTime <= now) {
      return res.status(400).json({ message: 'Thời gian hẹn phải ở tương lai' });
    }

    // Lấy thông tin phòng + chủ trọ
    const rooms = await query(
      `SELECT r.id, r.title, r.address, r.ward_id, r.landlord_id, r.status,
              w.name as ward_name, d.name as district_name, p.name as province_name,
              u.full_name as landlord_name, u.email as landlord_email, u.phone as landlord_phone
       FROM rooms r
       JOIN wards w ON r.ward_id = w.id
       JOIN districts d ON w.district_id = d.id
       JOIN provinces p ON d.province_id = p.id
       JOIN users u ON r.landlord_id = u.id
       WHERE r.id = ?`,
      [roomId]
    );

    if (rooms.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy phòng' });
    }

    const room = rooms[0];

    if (room.status !== 'available') {
      return res.status(400).json({ message: 'Phòng này hiện không còn trống' });
    }

    if (room.landlord_id === req.user.id) {
      return res.status(400).json({ message: 'Không thể tự hẹn lịch xem phòng của chính mình' });
    }

    // Kiểm tra đã có lịch hẹn pending trong ngày đó chưa
    const existing = await query(
      `SELECT id FROM viewing_appointments 
       WHERE room_id = ? AND tenant_id = ? AND appointment_date = ? AND status = 'pending'`,
      [roomId, req.user.id, appointmentDate]
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Bạn đã có lịch hẹn trong ngày này cho phòng này' });
    }

    // Tạo lịch hẹn
    const appointmentId = generateUUID();
    await query(
      `INSERT INTO viewing_appointments (id, room_id, tenant_id, appointment_date, appointment_time, message)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [appointmentId, roomId, req.user.id, appointmentDate, appointmentTime, message || null]
    );

    // Tạo thông báo in-app cho chủ trọ
    await query(
      `INSERT INTO notifications (id, user_id, type, title, body, ref_id)
       VALUES (?, ?, 'viewing_appointment', 'Có lịch hẹn xem phòng mới', ?, ?)`,
      [generateUUID(), room.landlord_id, `${req.user.fullName || req.user.full_name} muốn xem phòng "${room.title}"`, appointmentId]
    );

    // Địa chỉ đầy đủ
    const fullAddress = [room.address, room.ward_name, room.district_name, room.province_name]
      .filter(Boolean).join(', ');

    // Lấy thông tin tenant
    const tenants = await query(
      'SELECT full_name, email, phone FROM users WHERE id = ?',
      [req.user.id]
    );
    const tenant = tenants[0];

    // Gửi email bất đồng bộ (không block response)
    Promise.all([
      sendLandlordAppointmentEmail({
        landlordEmail: room.landlord_email,
        landlordName: room.landlord_name,
        tenantName: tenant.full_name,
        tenantPhone: tenant.phone,
        tenantEmail: tenant.email,
        roomTitle: room.title,
        roomAddress: fullAddress,
        appointmentDate,
        appointmentTime,
        message,
      }),
      sendTenantAppointmentEmail({
        tenantEmail: tenant.email,
        tenantName: tenant.full_name,
        landlordName: room.landlord_name,
        landlordPhone: room.landlord_phone,
        landlordEmail: room.landlord_email,
        roomTitle: room.title,
        roomAddress: fullAddress,
        appointmentDate,
        appointmentTime,
      }),
    ]).catch((err) => {
      console.error('❌ Lỗi gửi email thông báo lịch hẹn:', err.message);
    });

    res.status(201).json({
      message: 'Đặt lịch hẹn xem phòng thành công! Email xác nhận đã được gửi.',
      data: { id: appointmentId },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /appointments – Danh sách lịch hẹn
 * Tenant: xem lịch hẹn của mình
 * Landlord: xem lịch hẹn cho phòng của mình
 */
async function listAppointments(req, res, next) {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const params = [];
    let whereClause;

    if (req.user.role === 'landlord') {
      whereClause = 'WHERE r.landlord_id = ?';
      params.push(req.user.id);
    } else {
      whereClause = 'WHERE va.tenant_id = ?';
      params.push(req.user.id);
    }

    if (status) {
      whereClause += ' AND va.status = ?';
      params.push(status);
    }

    const countResult = await query(
      `SELECT COUNT(*) as total FROM viewing_appointments va
       JOIN rooms r ON va.room_id = r.id
       ${whereClause}`,
      [...params]
    );
    const total = countResult[0]?.total || 0;

    params.push(parseInt(limit), offset);
    const appointments = await query(
      `SELECT va.id, va.room_id, va.tenant_id, va.appointment_date, va.appointment_time,
              va.message, va.status, va.created_at,
              r.title as room_title, r.address as room_address,
              (SELECT url FROM room_images ri WHERE ri.room_id = r.id AND ri.is_cover = 1 LIMIT 1) as room_image,
              u.full_name as tenant_name, u.phone as tenant_phone, u.email as tenant_email, u.avatar_url as tenant_avatar,
              lu.full_name as landlord_name, lu.phone as landlord_phone
       FROM viewing_appointments va
       JOIN rooms r ON va.room_id = r.id
       JOIN users u ON va.tenant_id = u.id
       JOIN users lu ON r.landlord_id = lu.id
       ${whereClause}
       ORDER BY va.appointment_date ASC, va.appointment_time ASC
       LIMIT ? OFFSET ?`,
      params
    );

    res.json({
      data: appointments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /appointments/:id/cancel – Hủy lịch hẹn
 */
async function cancelAppointment(req, res, next) {
  try {
    const appts = await query(
      `SELECT va.*, r.landlord_id, r.title as room_title
       FROM viewing_appointments va
       JOIN rooms r ON va.room_id = r.id
       WHERE va.id = ?`,
      [req.params.id]
    );

    if (appts.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy lịch hẹn' });
    }

    const appt = appts[0];

    // Chỉ tenant hoặc landlord liên quan mới được hủy
    if (appt.tenant_id !== req.user.id && appt.landlord_id !== req.user.id) {
      return res.status(403).json({ message: 'Bạn không có quyền hủy lịch hẹn này' });
    }

    if (appt.status !== 'pending') {
      return res.status(400).json({ message: 'Chỉ có thể hủy lịch hẹn đang chờ' });
    }

    await query(
      "UPDATE viewing_appointments SET status = 'cancelled' WHERE id = ?",
      [req.params.id]
    );

    res.json({ message: 'Hủy lịch hẹn thành công' });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /appointments/:id/confirm – Xác nhận lịch hẹn (landlord)
 */
async function confirmAppointment(req, res, next) {
  try {
    const appts = await query(
      `SELECT va.*, r.landlord_id FROM viewing_appointments va
       JOIN rooms r ON va.room_id = r.id
       WHERE va.id = ?`,
      [req.params.id]
    );

    if (appts.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy lịch hẹn' });
    }

    const appt = appts[0];

    if (appt.landlord_id !== req.user.id) {
      return res.status(403).json({ message: 'Bạn không có quyền xác nhận lịch hẹn này' });
    }

    await query(
      "UPDATE viewing_appointments SET status = 'confirmed' WHERE id = ?",
      [req.params.id]
    );

    // Thông báo cho tenant
    await query(
      `INSERT INTO notifications (id, user_id, type, title, body, ref_id)
       VALUES (?, ?, 'appointment_confirmed', 'Lịch hẹn được xác nhận', 'Chủ trọ đã xác nhận lịch hẹn xem phòng của bạn', ?)`,
      [generateUUID(), appt.tenant_id, req.params.id]
    );

    res.json({ message: 'Xác nhận lịch hẹn thành công' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createAppointment,
  listAppointments,
  cancelAppointment,
  confirmAppointment,
};

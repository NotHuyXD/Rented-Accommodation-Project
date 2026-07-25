const express = require('express');
const router = express.Router();
const {
  createAppointment,
  listAppointments,
  cancelAppointment,
  confirmAppointment,
} = require('../controllers/appointment.controller');
const { authenticate } = require('../middleware/auth');

// Tạo lịch hẹn xem phòng (tenant)
router.post('/', authenticate, createAppointment);

// Danh sách lịch hẹn
router.get('/', authenticate, listAppointments);

// Hủy lịch hẹn
router.patch('/:id/cancel', authenticate, cancelAppointment);

// Xác nhận lịch hẹn (landlord)
router.patch('/:id/confirm', authenticate, confirmAppointment);

module.exports = router;

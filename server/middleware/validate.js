// ============================================================
// Validation Middleware using express-validator
// ============================================================
const { body, param, query, validationResult } = require('express-validator');

/**
 * Middleware to check validation results
 */
function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Dữ liệu không hợp lệ',
      errors: errors.array().map(e => ({
        field: e.path,
        message: e.msg,
      })),
    });
  }
  next();
}

// ========================
// AUTH Validators
// ========================
const registerValidation = [
  body('email')
    .optional()
    .isEmail().withMessage('Email không hợp lệ')
    .normalizeEmail(),
  body('phone')
    .optional()
    .matches(/^(0|\+84)[0-9]{9,10}$/).withMessage('Số điện thoại không hợp lệ'),
  body('password')
    .isLength({ min: 6 }).withMessage('Mật khẩu tối thiểu 6 ký tự'),
  body('fullName')
    .trim()
    .isLength({ min: 2, max: 150 }).withMessage('Họ tên phải từ 2-150 ký tự'),
  body('role')
    .optional()
    .isIn(['tenant', 'landlord']).withMessage('Role không hợp lệ'),
  handleValidation,
];

const loginValidation = [
  body('email')
    .optional()
    .isEmail().withMessage('Email không hợp lệ'),
  body('phone')
    .optional()
    .isString(),
  body('password')
    .notEmpty().withMessage('Mật khẩu không được để trống'),
  handleValidation,
];

// ========================
// ROOM Validators
// ========================
const createRoomValidation = [
  body('title')
    .trim()
    .isLength({ min: 10, max: 300 }).withMessage('Tiêu đề phải từ 10-300 ký tự'),
  body('description')
    .trim()
    .isLength({ min: 30 }).withMessage('Mô tả tối thiểu 30 ký tự'),
  body('price')
    .isFloat({ min: 0 }).withMessage('Giá phải là số dương'),
  body('area')
    .optional()
    .isFloat({ min: 1 }).withMessage('Diện tích phải lớn hơn 0'),
  body('address')
    .trim()
    .notEmpty().withMessage('Địa chỉ không được để trống'),
  body('roomType')
    .optional()
    .isIn(['phong_tro', 'chung_cu_mini', 'nha_nguyen_can', 'ky_tuc_xa', 'homestay', 'can_ho', 'phong_ghep']),
  handleValidation,
];

// ========================
// BOOKING Validators
// ========================
const createBookingValidation = [
  body('roomId')
    .notEmpty().withMessage('Room ID không được để trống'),
  body('bookingType')
    .isIn(['viewing', 'hold_deposit', 'rent_request']).withMessage('Loại booking không hợp lệ'),
  body('scheduledDate')
    .optional()
    .isISO8601().withMessage('Ngày không hợp lệ'),
  handleValidation,
];

// ========================
// REVIEW Validators
// ========================
const createReviewValidation = [
  body('targetType')
    .isIn(['room', 'landlord', 'tenant']).withMessage('Loại đánh giá không hợp lệ'),
  body('overallRating')
    .isFloat({ min: 1, max: 5 }).withMessage('Đánh giá phải từ 1-5 sao'),
  body('content')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('Nội dung tối đa 2000 ký tự'),
  handleValidation,
];

// ========================
// CONTRACT Validators
// ========================
const createContractValidation = [
  body('roomId')
    .notEmpty().withMessage('Room ID không được để trống'),
  body('tenantId')
    .notEmpty().withMessage('Tenant ID không được để trống'),
  body('startDate')
    .isISO8601().withMessage('Ngày bắt đầu không hợp lệ'),
  body('endDate')
    .isISO8601().withMessage('Ngày kết thúc không hợp lệ'),
  body('monthlyRent')
    .isFloat({ min: 0 }).withMessage('Tiền thuê phải là số dương'),
  body('depositAmount')
    .isFloat({ min: 0 }).withMessage('Tiền cọc phải là số dương'),
  handleValidation,
];

module.exports = {
  handleValidation,
  registerValidation,
  loginValidation,
  createRoomValidation,
  createBookingValidation,
  createReviewValidation,
  createContractValidation,
};

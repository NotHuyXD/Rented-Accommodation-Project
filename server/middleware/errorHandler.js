// ============================================================
// Global Error Handler Middleware
// ============================================================

function errorHandler(err, req, res, next) {
  console.error('❌ Error:', err.stack || err.message);

  // MySQL duplicate entry error
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      message: 'Dữ liệu đã tồn tại',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }

  // MySQL foreign key constraint error
  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({
      message: 'Dữ liệu tham chiếu không tồn tại',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }

  // Validation errors (express-validator)
  if (err.type === 'validation') {
    return res.status(400).json({
      message: 'Dữ liệu không hợp lệ',
      errors: err.errors,
    });
  }

  // Multer file upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      message: 'File quá lớn, tối đa 10MB',
    });
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      message: 'Loại file không được hỗ trợ',
    });
  }

  // Default server error
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    message: err.message || 'Lỗi máy chủ nội bộ',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
}

module.exports = errorHandler;

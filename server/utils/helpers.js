// ============================================================
// Utility Helper Functions (v2.0)
// ============================================================
const { v4: uuidv4 } = require('uuid');

/**
 * Generate a UUID v4
 */
function generateUUID() {
  return uuidv4();
}

/**
 * Generate a URL-friendly slug from a string
 */
function generateSlug(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    + '-' + Date.now().toString(36);
}

/**
 * Build pagination response
 */
function paginate(data, page, limit, total) {
  return {
    data,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  };
}

module.exports = {
  generateUUID,
  generateSlug,
  paginate,
};

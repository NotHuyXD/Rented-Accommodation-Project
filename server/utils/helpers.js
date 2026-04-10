// ============================================================
// Utility Helper Functions
// ============================================================
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

/**
 * Generate a UUID v4
 */
function generateUUID() {
  return uuidv4();
}

/**
 * Generate a short unique code (e.g., booking codes, invoice numbers)
 * @param {string} prefix - Code prefix (e.g., 'BK', 'INV', 'CT')
 * @param {number} length - Number of random characters
 */
function generateCode(prefix = '', length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = prefix;
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
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
 * Generate a referral code
 */
function generateReferralCode() {
  return 'PT' + crypto.randomBytes(4).toString('hex').toUpperCase();
}

/**
 * Build pagination response
 * @param {Array} data - Query results
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @param {number} total - Total items count
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

/**
 * Build SQL WHERE clause from filters
 * @param {Object} filters - Key-value filter pairs
 * @returns {{ whereClause: string, params: Array }}
 */
function buildWhereClause(filters) {
  const conditions = [];
  const params = [];

  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;

    if (key.endsWith('_min')) {
      const col = key.replace('_min', '');
      conditions.push(`${col} >= ?`);
      params.push(value);
    } else if (key.endsWith('_max')) {
      const col = key.replace('_max', '');
      conditions.push(`${col} <= ?`);
      params.push(value);
    } else if (key === 'search') {
      conditions.push(`(title LIKE ? OR description LIKE ? OR full_address LIKE ?)`);
      const searchTerm = `%${value}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    } else {
      conditions.push(`${key} = ?`);
      params.push(value);
    }
  });

  const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
  return { whereClause, params };
}

/**
 * Convert snake_case DB columns to camelCase for frontend
 */
function toCamelCase(obj) {
  if (Array.isArray(obj)) {
    return obj.map(toCamelCase);
  }
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((result, key) => {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      result[camelKey] = toCamelCase(obj[key]);
      return result;
    }, {});
  }
  return obj;
}

module.exports = {
  generateUUID,
  generateCode,
  generateSlug,
  generateReferralCode,
  paginate,
  buildWhereClause,
  toCamelCase,
};

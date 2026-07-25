// ============================================================
// Auth Controller - Register, Login, Profile (v2.0 schema)
// ============================================================
const bcrypt = require('bcryptjs');
const { query, getConnection } = require('../config/db');
const { generateAccessToken, generateRefreshToken } = require('../middleware/auth');
const { generateUUID } = require('../utils/helpers');
const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * POST /auth/register
 */
async function register(req, res, next) {
  try {
    const { email, phone, password, fullName, role = 'tenant' } = req.body;

    if (!email || !phone || !password || !fullName) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin' });
    }

    // Check email exists
    const existing = await query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Email đã được sử dụng' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const userId = generateUUID();

    await query(
      `INSERT INTO users (id, full_name, email, phone, password_hash, role)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, fullName, email, phone, passwordHash, role]
    );

    const users = await query(
      `SELECT id, full_name, email, phone, avatar_url, role, is_verified, kyc_status, created_at
       FROM users WHERE id = ?`, [userId]
    );

    const user = users[0];
    const token = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.status(201).json({
      message: 'Đăng ký thành công',
      data: {
        user: formatUser(user),
        token,
        refreshToken,
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /auth/login
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Vui lòng cung cấp email và mật khẩu' });
    }

    const users = await query(
      `SELECT id, full_name, email, phone, password_hash, avatar_url, role, is_verified, kyc_status, created_at
       FROM users WHERE email = ?`, [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
    }

    const token = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.json({
      message: 'Đăng nhập thành công',
      data: {
        user: formatUser(user),
        token,
        refreshToken,
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /auth/google-login
 */
async function googleLogin(req, res, next) {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: 'Thiếu Google Token' });
    }

    // The token from frontend useGoogleLogin is an access_token, not an id_token
    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) {
      throw new Error('Invalid Google Access Token');
    }

    const payload = await response.json();
    const { email, name, picture, sub } = payload;
    
    if (!email) {
      return res.status(400).json({ message: 'Không lấy được email từ Google' });
    }

    const users = await query(
      `SELECT id, full_name, email, phone, password_hash, avatar_url, role, is_verified, kyc_status, created_at
       FROM users WHERE email = ?`, [email]
    );

    let user;

    if (users.length === 0) {
      // User doesn't exist, create a new one
      const userId = generateUUID();
      // Generate a random password for google users or we can leave it empty
      const randomPassword = await bcrypt.hash(Math.random().toString(36).slice(-8), 12);
      
      await query(
        `INSERT INTO users (id, full_name, email, phone, password_hash, avatar_url, role, is_verified)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, name || 'Google User', email, '', randomPassword, picture || null, 'tenant', 1]
      );
      
      const newUsers = await query(
        `SELECT id, full_name, email, phone, avatar_url, role, is_verified, kyc_status, created_at
         FROM users WHERE id = ?`, [userId]
      );
      user = newUsers[0];
    } else {
      user = users[0];
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.json({
      message: 'Đăng nhập Google thành công',
      data: {
        user: formatUser(user),
        token: accessToken,
        refreshToken,
      }
    });
  } catch (error) {
    console.error("Google Login Error:", error);
    res.status(401).json({ message: 'Xác thực Google thất bại' });
  }
}

/**
 * GET /auth/profile
 */
async function getProfile(req, res, next) {
  try {
    const users = await query(
      `SELECT id, full_name, email, phone, avatar_url, role, is_verified, kyc_status, created_at, updated_at
       FROM users WHERE id = ?`, [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    res.json({ data: formatUser(users[0]) });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /auth/profile
 */
async function updateProfile(req, res, next) {
  try {
    const { fullName, phone, avatarUrl } = req.body;
    const fields = [];
    const params = [];

    if (fullName !== undefined) { fields.push('full_name = ?'); params.push(fullName); }
    if (phone !== undefined) { fields.push('phone = ?'); params.push(phone); }
    if (avatarUrl !== undefined) { fields.push('avatar_url = ?'); params.push(avatarUrl); }

    if (fields.length === 0) {
      return res.status(400).json({ message: 'Không có thông tin cần cập nhật' });
    }

    params.push(req.user.id);
    await query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, params);

    res.json({ message: 'Cập nhật thông tin thành công' });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /auth/change-password
 */
async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;

    const users = await query('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    const isMatch = await bcrypt.compare(currentPassword, users[0].password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Mật khẩu hiện tại không đúng' });
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await query('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, req.user.id]);

    res.json({ message: 'Đổi mật khẩu thành công' });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /auth/logout
 */
async function logout(req, res) {
  res.json({ message: 'Đăng xuất thành công' });
}

// ========================
// In-memory OTP store (for development; use Redis in production)
// ========================
const otpStore = new Map(); // email -> { otp, expiresAt }

/**
 * POST /auth/forgot-password
 */
async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Vui lòng cung cấp email' });
    }

    // Check if email exists
    const users = await query('SELECT id FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      // Don't reveal whether email exists (security best practice)
      return res.json({ message: 'Nếu email tồn tại, mã OTP đã được gửi' });
    }

    // Generate 6-digit OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    otpStore.set(email, { otp, expiresAt });

    // In production, send OTP via email service
    console.log(`[DEV] OTP for ${email}: ${otp}`);

    res.json({ message: 'Mã OTP đã được gửi đến email của bạn' });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /auth/verify-reset-otp
 */
async function verifyResetOTP(req, res, next) {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: 'Thiếu thông tin' });
    }

    const stored = otpStore.get(email);
    if (!stored) {
      return res.status(400).json({ message: 'Mã OTP không hợp lệ hoặc đã hết hạn' });
    }

    if (stored.otp !== otp) {
      return res.status(400).json({ message: 'Mã OTP không đúng' });
    }

    if (Date.now() > stored.expiresAt) {
      otpStore.delete(email);
      return res.status(400).json({ message: 'Mã OTP đã hết hạn' });
    }

    res.json({ message: 'Xác minh OTP thành công' });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /auth/reset-password
 */
async function resetPassword(req, res, next) {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'Thiếu thông tin' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 6 ký tự' });
    }

    const stored = otpStore.get(email);
    if (!stored || stored.otp !== otp || Date.now() > stored.expiresAt) {
      return res.status(400).json({ message: 'Mã OTP không hợp lệ hoặc đã hết hạn' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await query('UPDATE users SET password_hash = ? WHERE email = ?', [passwordHash, email]);

    otpStore.delete(email);

    res.json({ message: 'Đặt lại mật khẩu thành công' });
  } catch (error) {
    next(error);
  }
}

// ========================
// Helper: format user for response
// ========================
function formatUser(user) {
  return {
    id: user.id,
    email: user.email,
    phone: user.phone,
    fullName: user.full_name,
    avatar: user.avatar_url,
    role: user.role,
    isVerified: !!user.is_verified,
    kycStatus: user.kyc_status,
    createdAt: user.created_at,
  };
}

module.exports = {
  register,
  login,
  googleLogin,
  getProfile,
  updateProfile,
  changePassword,
  logout,
  forgotPassword,
  verifyResetOTP,
  resetPassword,
};

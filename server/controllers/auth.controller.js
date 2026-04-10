// ============================================================
// Auth Controller - Register, Login, Profile, Token Refresh
// ============================================================
const bcrypt = require('bcryptjs');
const { query, getConnection } = require('../config/db');
const { generateAccessToken, generateRefreshToken } = require('../middleware/auth');
const { generateUUID, generateReferralCode } = require('../utils/helpers');

/**
 * POST /auth/register
 */
async function register(req, res, next) {
  const conn = await getConnection();
  try {
    await conn.beginTransaction();

    const { email, phone, password, fullName, role = 'tenant' } = req.body;

    // Check if email/phone already exists
    if (email) {
      const [existing] = await conn.execute(
        'SELECT id FROM users WHERE email = ? AND is_deleted = 0', [email]
      );
      if (existing.length > 0) {
        return res.status(409).json({ message: 'Email đã được sử dụng' });
      }
    }
    if (phone) {
      const [existing] = await conn.execute(
        'SELECT id FROM users WHERE phone = ? AND is_deleted = 0', [phone]
      );
      if (existing.length > 0) {
        return res.status(409).json({ message: 'Số điện thoại đã được sử dụng' });
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);
    const userId = generateUUID();
    const referralCode = generateReferralCode();

    // Insert user
    await conn.execute(
      `INSERT INTO users (id, email, phone, password_hash, full_name, role, status, referral_code, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'active', ?, NOW())`,
      [userId, email || null, phone || null, passwordHash, fullName, role, referralCode]
    );

    // Create user profile
    await conn.execute(
      'INSERT INTO user_profiles (id, user_id) VALUES (?, ?)',
      [generateUUID(), userId]
    );

    // Create user preferences
    await conn.execute(
      'INSERT INTO user_preferences (id, user_id) VALUES (?, ?)',
      [generateUUID(), userId]
    );

    // Create wallet
    await conn.execute(
      'INSERT INTO wallets (id, user_id) VALUES (?, ?)',
      [generateUUID(), userId]
    );

    // Create trust score
    await conn.execute(
      'INSERT INTO trust_scores (id, user_id) VALUES (?, ?)',
      [generateUUID(), userId]
    );

    // Assign RBAC role
    const [roles] = await conn.execute('SELECT id FROM roles WHERE name = ?', [role]);
    if (roles.length > 0) {
      await conn.execute(
        'INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)',
        [userId, roles[0].id]
      );
    }

    await conn.commit();

    // Fetch created user
    const [users] = await conn.execute(
      `SELECT id, email, phone, full_name, avatar_url, role, status, 
              email_verified, phone_verified, identity_verified, referral_code, created_at
       FROM users WHERE id = ?`, [userId]
    );

    const user = users[0];
    const token = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Store refresh token
    const tokenHash = await bcrypt.hash(refreshToken, 10);
    await conn.execute(
      `INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at)
       VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 30 DAY))`,
      [generateUUID(), userId, tokenHash]
    );

    res.status(201).json({
      message: 'Đăng ký thành công',
      data: {
        user: formatUser(user),
        token,
        refreshToken,
      }
    });
  } catch (error) {
    await conn.rollback();
    next(error);
  } finally {
    conn.release();
  }
}

/**
 * POST /auth/login
 */
async function login(req, res, next) {
  try {
    const { email, phone, password } = req.body;
    const identifier = email || phone;

    if (!identifier) {
      return res.status(400).json({ message: 'Vui lòng cung cấp email hoặc số điện thoại' });
    }

    // Find user
    const field = email ? 'email' : 'phone';
    const users = await query(
      `SELECT id, email, phone, password_hash, full_name, avatar_url, role, status,
              email_verified, phone_verified, identity_verified, referral_code,
              failed_login_attempts, locked_until, created_at
       FROM users WHERE ${field} = ? AND is_deleted = 0`, [identifier]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: 'Email/SĐT hoặc mật khẩu không đúng' });
    }

    const user = users[0];

    // Check if account is locked
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      return res.status(423).json({ message: 'Tài khoản tạm khóa. Vui lòng thử lại sau.' });
    }

    // Check account status
    if (user.status === 'banned') {
      return res.status(403).json({ message: 'Tài khoản đã bị khóa' });
    }
    if (user.status === 'deactivated') {
      return res.status(403).json({ message: 'Tài khoản đã bị vô hiệu hóa' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      // Increment failed attempts
      const attempts = (user.failed_login_attempts || 0) + 1;
      const lockUntil = attempts >= 5 ? 'DATE_ADD(NOW(), INTERVAL 30 MINUTE)' : 'NULL';
      await query(
        `UPDATE users SET failed_login_attempts = ?, locked_until = ${lockUntil} WHERE id = ?`,
        [attempts, user.id]
      );

      // Log failed attempt
      await query(
        `INSERT INTO login_history (id, user_id, ip_address, user_agent, login_method, status, failure_reason)
         VALUES (?, ?, ?, ?, 'email_password', 'failed', 'wrong_password')`,
        [generateUUID(), user.id, req.ip, req.headers['user-agent']]
      );

      return res.status(401).json({ message: 'Email/SĐT hoặc mật khẩu không đúng' });
    }

    // Reset failed attempts & update login info
    await query(
      `UPDATE users SET failed_login_attempts = 0, locked_until = NULL, 
       login_count = login_count + 1, last_login_at = NOW(), last_active_at = NOW(),
       status = IF(status = 'pending_verification', 'active', status)
       WHERE id = ?`, [user.id]
    );

    // Log successful login
    await query(
      `INSERT INTO login_history (id, user_id, ip_address, user_agent, login_method, status)
       VALUES (?, ?, ?, ?, 'email_password', 'success')`,
      [generateUUID(), user.id, req.ip, req.headers['user-agent']]
    );

    const token = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Store refresh token
    const tokenHash = await bcrypt.hash(refreshToken, 10);
    await query(
      `INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at)
       VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 30 DAY))`,
      [generateUUID(), user.id, tokenHash]
    );

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
 * GET /auth/profile
 */
async function getProfile(req, res, next) {
  try {
    const users = await query(
      `SELECT u.*, up.bio, up.occupation, up.company, up.school, up.address,
              up.ward, up.district, up.city, up.business_name, up.tax_code,
              up.bank_name, up.bank_account_number, up.bank_account_holder
       FROM users u
       LEFT JOIN user_profiles up ON u.id = up.user_id
       WHERE u.id = ? AND u.is_deleted = 0`, [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    // Get badges
    const badges = await query(
      `SELECT b.name, b.display_name, b.icon_url, b.color, ub.earned_at
       FROM user_badges ub JOIN badges b ON ub.badge_id = b.id
       WHERE ub.user_id = ?`, [req.user.id]
    );

    const user = users[0];
    res.json({
      data: {
        ...formatUser(user),
        bio: user.bio,
        occupation: user.occupation,
        company: user.company,
        school: user.school,
        address: user.address,
        ward: user.ward,
        district: user.district,
        city: user.city,
        businessName: user.business_name,
        taxCode: user.tax_code,
        bankName: user.bank_name,
        bankAccountNumber: user.bank_account_number,
        bankAccountHolder: user.bank_account_holder,
        badges,
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /auth/profile
 */
async function updateProfile(req, res, next) {
  const conn = await getConnection();
  try {
    await conn.beginTransaction();

    const { fullName, phone, gender, dateOfBirth, avatarUrl, coverPhotoUrl,
            bio, occupation, company, school, address, ward, district, city,
            businessName, taxCode, bankName, bankAccountNumber, bankAccountHolder } = req.body;

    // Update users table
    const userFields = [];
    const userParams = [];
    if (fullName !== undefined) { userFields.push('full_name = ?'); userParams.push(fullName); }
    if (phone !== undefined) { userFields.push('phone = ?'); userParams.push(phone); }
    if (gender !== undefined) { userFields.push('gender = ?'); userParams.push(gender); }
    if (dateOfBirth !== undefined) { userFields.push('date_of_birth = ?'); userParams.push(dateOfBirth); }
    if (avatarUrl !== undefined) { userFields.push('avatar_url = ?'); userParams.push(avatarUrl); }
    if (coverPhotoUrl !== undefined) { userFields.push('cover_photo_url = ?'); userParams.push(coverPhotoUrl); }

    if (userFields.length > 0) {
      userParams.push(req.user.id);
      await conn.execute(
        `UPDATE users SET ${userFields.join(', ')} WHERE id = ?`, userParams
      );
    }

    // Update user_profiles table
    const profileFields = [];
    const profileParams = [];
    if (bio !== undefined) { profileFields.push('bio = ?'); profileParams.push(bio); }
    if (occupation !== undefined) { profileFields.push('occupation = ?'); profileParams.push(occupation); }
    if (company !== undefined) { profileFields.push('company = ?'); profileParams.push(company); }
    if (school !== undefined) { profileFields.push('school = ?'); profileParams.push(school); }
    if (address !== undefined) { profileFields.push('address = ?'); profileParams.push(address); }
    if (ward !== undefined) { profileFields.push('ward = ?'); profileParams.push(ward); }
    if (district !== undefined) { profileFields.push('district = ?'); profileParams.push(district); }
    if (city !== undefined) { profileFields.push('city = ?'); profileParams.push(city); }
    if (businessName !== undefined) { profileFields.push('business_name = ?'); profileParams.push(businessName); }
    if (taxCode !== undefined) { profileFields.push('tax_code = ?'); profileParams.push(taxCode); }
    if (bankName !== undefined) { profileFields.push('bank_name = ?'); profileParams.push(bankName); }
    if (bankAccountNumber !== undefined) { profileFields.push('bank_account_number = ?'); profileParams.push(bankAccountNumber); }
    if (bankAccountHolder !== undefined) { profileFields.push('bank_account_holder = ?'); profileParams.push(bankAccountHolder); }

    if (profileFields.length > 0) {
      profileParams.push(req.user.id);
      await conn.execute(
        `UPDATE user_profiles SET ${profileFields.join(', ')} WHERE user_id = ?`, profileParams
      );
    }

    await conn.commit();

    res.json({ message: 'Cập nhật thông tin thành công' });
  } catch (error) {
    await conn.rollback();
    next(error);
  } finally {
    conn.release();
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
async function logout(req, res, next) {
  try {
    // Revoke all refresh tokens for this user
    await query(
      'UPDATE refresh_tokens SET is_revoked = 1, revoked_at = NOW() WHERE user_id = ? AND is_revoked = 0',
      [req.user.id]
    );

    res.json({ message: 'Đăng xuất thành công' });
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
    coverPhoto: user.cover_photo_url,
    gender: user.gender,
    dateOfBirth: user.date_of_birth,
    role: user.role,
    status: user.status,
    isVerified: !!user.identity_verified,
    isEKYC: !!user.identity_verified,
    emailVerified: !!user.email_verified,
    phoneVerified: !!user.phone_verified,
    trustScore: user.trust_score,
    avgRating: user.avg_rating,
    totalReviews: user.total_reviews_received,
    referralCode: user.referral_code,
    createdAt: user.created_at,
  };
}

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  logout,
};

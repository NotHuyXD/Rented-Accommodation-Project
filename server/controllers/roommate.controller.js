// ============================================================
// Roommate Controller - Matchmaking and Profiles
// ============================================================
const { query } = require('../config/db');
const { generateUUID, paginate } = require('../utils/helpers');

async function getProfile(req, res, next) {
  try {
    const profiles = await query('SELECT * FROM roommate_profiles WHERE user_id = ?', [req.user.id]);
    if (profiles.length === 0) return res.status(404).json({ message: 'Chưa có hồ sơ tìm bạn ở ghép' });
    res.json({ data: profiles[0] });
  } catch (error) { next(error); }
}

async function updateProfile(req, res, next) {
  try {
    const {
      introduction, occupation, budgetMin, budgetMax, preferredDistricts, moveInDate,
      cleanlinessLevel, noiseTolerance, hasPets, isSmoker, preferredGender
    } = req.body;

    const existing = await query('SELECT id FROM roommate_profiles WHERE user_id = ?', [req.user.id]);

    if (existing.length === 0) {
      await query(
        `INSERT INTO roommate_profiles (id, user_id, introduction, occupation, budget_min, budget_max, preferred_districts, move_in_date, cleanliness_level, noise_tolerance, has_pets, is_smoker, preferred_gender)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [generateUUID(), req.user.id, introduction, occupation, budgetMin, budgetMax, preferredDistricts ? JSON.stringify(preferredDistricts) : null, moveInDate, cleanlinessLevel, noiseTolerance, hasPets ? 1 : 0, isSmoker ? 1 : 0, preferredGender || 'any']
      );
    } else {
      await query(
        `UPDATE roommate_profiles SET introduction=?, occupation=?, budget_min=?, budget_max=?, preferred_districts=?, move_in_date=?, cleanliness_level=?, noise_tolerance=?, has_pets=?, is_smoker=?, preferred_gender=? WHERE user_id = ?`,
        [introduction, occupation, budgetMin, budgetMax, preferredDistricts ? JSON.stringify(preferredDistricts) : null, moveInDate, cleanlinessLevel, noiseTolerance, hasPets ? 1 : 0, isSmoker ? 1 : 0, preferredGender, req.user.id]
      );
    }

    res.json({ message: 'Cập nhật hồ sơ thành công' });
  } catch (error) { next(error); }
}

async function matchRoommates(req, res, next) {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    // Simple matching query excluding self and inactive, just fetching list for now
    const profilesResult = await query(
      `SELECT p.*, u.full_name, u.avatar_url, u.gender, u.date_of_birth
       FROM roommate_profiles p
       JOIN users u ON p.user_id = u.id
       WHERE p.user_id != ? AND p.is_active = 1 AND p.is_visible = 1
       ORDER BY p.created_at DESC LIMIT ? OFFSET ?`,
      [req.user.id, parseInt(limit), offset]
    );

    const countResult = await query(
      'SELECT COUNT(*) as total FROM roommate_profiles WHERE user_id != ? AND is_active = 1 AND is_visible = 1',
      [req.user.id]
    );

    res.json(paginate(profilesResult, page, limit, countResult[0].total));
  } catch (error) { next(error); }
}

module.exports = { getProfile, updateProfile, matchRoommates };

require('dotenv').config();
const { query } = require('./config/db');
const bcrypt = require('bcryptjs');

async function check() {
  try {
    const hash = await bcrypt.hash('123456', 10);
    await query('UPDATE users SET password_hash = ?', [hash]);
    console.log('All users passwords reset to 123456');
  } catch (e) {
    console.error(e);
  }
  process.exit();
}
check();

require('dotenv').config();
const { query } = require('./config/db');

async function check() {
  try {
    const users = await query('SELECT email, role, password_hash FROM users WHERE role = "admin"');
    console.log(users);
  } catch (e) {
    console.error(e);
  }
  process.exit();
}
check();

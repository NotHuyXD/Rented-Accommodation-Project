require('dotenv').config();
const { query } = require('./config/db');

async function getAllUsers() {
  try {
    const users = await query('SELECT full_name, email, phone, role FROM users');
    console.log(JSON.stringify(users, null, 2));
    process.exit(0);
  } catch (error) {
    console.error('Error fetching users:', error.message);
    process.exit(1);
  }
}

getAllUsers();

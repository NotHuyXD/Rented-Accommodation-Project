require('dotenv').config();
const { query } = require('./config/db');

async function checkDB() {
  try {
    const locations = await query('SELECT COUNT(*) as c FROM wards');
    const roomTypes = await query('SELECT COUNT(*) as c FROM room_types');
    const amenities = await query('SELECT COUNT(*) as c FROM amenities');
    console.log(`Wards: ${locations[0].c}, RoomTypes: ${roomTypes[0].c}, Amenities: ${amenities[0].c}`);
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}
checkDB();

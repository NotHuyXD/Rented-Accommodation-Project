require('dotenv').config();
const { query } = require('./config/db');
const { v4: uuidv4 } = require('uuid');

const generateSlug = (text) => {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Math.floor(Math.random() * 10000);
};

const roomImages = [
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1502672260266-1c1cd2cb4441?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1522771731478-44bf10cb73d6?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1493809842364-78817add7ffb?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1554995207-c18c203602cb?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1598928506311-c55dd100e470?q=80&w=600&auto=format&fit=crop',
];

const titles = [
  'Phòng trọ cao cấp full nội thất', 'Căn hộ mini ban công thoáng mát', 'Phòng trọ giá rẻ cho sinh viên',
  'Studio sang trọng trung tâm thành phố', 'Phòng trọ khép kín mới xây', 'Căn hộ dịch vụ an ninh 24/7',
  'Phòng trọ gần đại học', 'Sleepbox tiện nghi giá mềm', 'Phòng có gác xép rộng rãi', 'Phòng trọ giờ giấc tự do'
];

async function seedData() {
  try {
    console.log('Bắt đầu tạo dữ liệu mẫu (Seeding)...');

    // 1. Lấy dữ liệu cơ sở
    const landlords = await query('SELECT id FROM users WHERE role = "landlord" LIMIT 10');
    const tenants = await query('SELECT id FROM users WHERE role = "tenant" LIMIT 10');
    const wards = await query('SELECT id FROM wards LIMIT 7');
    const roomTypes = await query('SELECT id FROM room_types LIMIT 4');
    const amenities = await query('SELECT id FROM amenities LIMIT 10');

    if (landlords.length === 0 || tenants.length === 0 || wards.length === 0 || roomTypes.length === 0) {
      console.log('Lỗi: Thiếu dữ liệu cơ sở (users, wards, room_types).');
      process.exit(1);
    }

    const createdRooms = [];

    // 2. Tạo 25-30 phòng trọ
    console.log('Đang tạo Phòng trọ...');
    const roomCount = 25 + Math.floor(Math.random() * 6); // 25-30
    for (let i = 0; i < roomCount; i++) {
      const roomId = uuidv4();
      const landlord = landlords[Math.floor(Math.random() * landlords.length)];
      const ward = wards[Math.floor(Math.random() * wards.length)];
      const roomType = roomTypes[Math.floor(Math.random() * roomTypes.length)];
      
      const title = titles[Math.floor(Math.random() * titles.length)] + ' ' + (Math.floor(Math.random() * 100) + 1);
      const slug = generateSlug(title);
      const price = 2000000 + Math.floor(Math.random() * 40) * 100000; // 2tr - 6tr
      const area = 15 + Math.floor(Math.random() * 25);
      
      await query(
        `INSERT INTO rooms (id, landlord_id, ward_id, room_type_id, title, slug, description, address, area, price, deposit, max_occupants, allow_pet, allow_cooking, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'available')`,
        [roomId, landlord.id, ward.id, roomType.id, title, slug, 'Phòng sạch đẹp, khu vực an ninh, gần nhiều tiện ích.', 'Số ' + (Math.floor(Math.random() * 100) + 1) + ' Đường ABC', area, price, price, Math.floor(Math.random() * 3) + 1, Math.random() > 0.7 ? 1 : 0, Math.random() > 0.2 ? 1 : 0]
      );
      
      createdRooms.push({ id: roomId, landlordId: landlord.id, price });

      // Add images
      const numImages = 2 + Math.floor(Math.random() * 3);
      for (let j = 0; j < numImages; j++) {
        await query(
          'INSERT INTO room_images (id, room_id, url, is_cover, sort_order) VALUES (?, ?, ?, ?, ?)',
          [uuidv4(), roomId, roomImages[Math.floor(Math.random() * roomImages.length)], j === 0 ? 1 : 0, j]
        );
      }

      // Add amenities
      const numAmenities = 3 + Math.floor(Math.random() * 5);
      const selectedAmenities = [...amenities].sort(() => 0.5 - Math.random()).slice(0, numAmenities);
      for (const am of selectedAmenities) {
        await query('INSERT INTO room_amenities (room_id, amenity_id) VALUES (?, ?)', [roomId, am.id]);
      }
    }
    console.log(`Đã tạo thành công ${createdRooms.length} phòng trọ.`);

    // 3. Tạo Hợp đồng & Hóa đơn (5 hợp đồng ngẫu nhiên)
    console.log('Đang tạo Hợp đồng & Hóa đơn...');
    const activeRooms = createdRooms.slice(0, 5); // Pick 5 rooms
    for (const room of activeRooms) {
      const tenant = tenants[Math.floor(Math.random() * tenants.length)];
      const contractId = uuidv4();
      
      await query(
        `INSERT INTO contracts (id, room_id, landlord_id, tenant_id, start_date, end_date, monthly_rent, deposit_amount, status) 
         VALUES (?, ?, ?, ?, DATE_SUB(CURDATE(), INTERVAL 1 MONTH), DATE_ADD(CURDATE(), INTERVAL 5 MONTH), ?, ?, 'active')`,
        [contractId, room.id, room.landlordId, tenant.id, room.price, room.price]
      );

      // Cập nhật trạng thái phòng thành rented
      await query('UPDATE rooms SET status = "rented" WHERE id = ?', [room.id]);

      // Tạo hóa đơn cho hợp đồng này
      const invoiceId = uuidv4();
      await query(
        `INSERT INTO invoices (id, contract_id, period_month, base_rent, electric_fee, water_fee, other_fees, total, due_date, status)
         VALUES (?, ?, '2026-08-01', ?, ?, ?, ?, ?, DATE_ADD(CURDATE(), INTERVAL 7 DAY), 'unpaid')`,
        [invoiceId, contractId, room.price, 200000, 100000, 50000, room.price + 350000]
      );
    }
    console.log('Đã tạo 5 hợp đồng đang hoạt động kèm hóa đơn.');

    // 4. Tạo Lịch hẹn xem phòng (Appointments)
    console.log('Đang tạo Lịch hẹn xem phòng...');
    for (let i = 0; i < 5; i++) {
      const room = createdRooms[i + 5];
      const tenant = tenants[Math.floor(Math.random() * tenants.length)];
      await query(
        `INSERT INTO viewing_appointments (id, room_id, tenant_id, appointment_date, appointment_time, message, status)
         VALUES (?, ?, ?, DATE_ADD(CURDATE(), INTERVAL ? DAY), '14:30:00', 'Tôi muốn qua xem phòng, bạn có nhà không?', 'pending')`,
        [uuidv4(), room.id, tenant.id, Math.floor(Math.random() * 5) + 1]
      );
    }
    
    // 5. Tạo tin nhắn (Chat)
    console.log('Đang tạo Tin nhắn...');
    // Lấy 1 phòng và tạo hội thoại
    const chatRoom = createdRooms[10];
    const chatTenant = tenants[0];
    const conversationId = uuidv4();
    await query(
      `INSERT INTO conversations (id, room_id, tenant_id, landlord_id) VALUES (?, ?, ?, ?)`,
      [conversationId, chatRoom.id, chatTenant.id, chatRoom.landlordId]
    );

    await query(`INSERT INTO messages (id, conversation_id, sender_id, content) VALUES (?, ?, ?, ?)`, [uuidv4(), conversationId, chatTenant.id, "Chào bạn, phòng này còn không ạ?"]);
    await query(`INSERT INTO messages (id, conversation_id, sender_id, content) VALUES (?, ?, ?, ?)`, [uuidv4(), conversationId, chatRoom.landlordId, "Chào bạn, phòng vẫn còn trống nhé. Bạn qua xem lúc nào được?"]);

    console.log('🎉 Hoàn tất quá trình tạo dữ liệu trình bày!');
    process.exit(0);
  } catch (err) {
    console.error('Lỗi khi seed data:', err);
    process.exit(1);
  }
}

seedData();

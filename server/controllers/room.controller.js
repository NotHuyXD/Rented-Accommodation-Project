// ============================================================
// Room Controller - CRUD, Search (v2.0 schema)
// ============================================================
const { query, getConnection } = require('../config/db');
const { generateUUID, generateSlug, paginate } = require('../utils/helpers');

/**
 * GET /rooms - Search/List rooms with filters
 */
async function listRooms(req, res, next) {
  try {
    const {
      page = 1, limit = 20, search,
      roomTypeId, priceMin, priceMax, areaMin, areaMax,
      wardId, districtId, provinceId,
      maxOccupants, allowPet, allowCooking,
      amenities, // comma-separated amenity IDs
      sortBy = 'newest', // newest, price_asc, price_desc
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    let conditions = ["r.status = 'available'"];
    const params = [];

    // Search by title/address (LIKE-based for better Vietnamese text support)
    if (search) {
      conditions.push('(r.title LIKE ? OR r.address LIKE ? OR w.name LIKE ? OR d.name LIKE ? OR p.name LIKE ?)');
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
    }

    // Filters
    if (roomTypeId) { conditions.push('r.room_type_id = ?'); params.push(roomTypeId); }
    if (priceMin) { conditions.push('r.price >= ?'); params.push(parseFloat(priceMin)); }
    if (priceMax) { conditions.push('r.price <= ?'); params.push(parseFloat(priceMax)); }
    if (areaMin) { conditions.push('r.area >= ?'); params.push(parseFloat(areaMin)); }
    if (areaMax) { conditions.push('r.area <= ?'); params.push(parseFloat(areaMax)); }
    if (maxOccupants) { conditions.push('r.max_occupants >= ?'); params.push(parseInt(maxOccupants)); }
    if (allowPet === '1') { conditions.push('r.allow_pet = 1'); }
    if (allowCooking === '1') { conditions.push('r.allow_cooking = 1'); }

    // Location filter via ward chain
    if (wardId) {
      conditions.push('r.ward_id = ?');
      params.push(wardId);
    } else if (districtId) {
      conditions.push('r.ward_id IN (SELECT id FROM wards WHERE district_id = ?)');
      params.push(districtId);
    } else if (provinceId) {
      conditions.push('r.ward_id IN (SELECT w.id FROM wards w JOIN districts d ON w.district_id = d.id WHERE d.province_id = ?)');
      params.push(provinceId);
    }

    // Amenity filter
    if (amenities) {
      const amenityList = amenities.split(',').map(a => a.trim());
      conditions.push(`
        r.id IN (
          SELECT ra.room_id FROM room_amenities ra
          WHERE ra.amenity_id IN (${amenityList.map(() => '?').join(',')})
          GROUP BY ra.room_id HAVING COUNT(DISTINCT ra.amenity_id) = ?
        )
      `);
      params.push(...amenityList, amenityList.length);
    }

    const whereClause = 'WHERE ' + conditions.join(' AND ');

    // Sorting
    let orderClause;
    switch (sortBy) {
      case 'price_asc': orderClause = 'ORDER BY r.price ASC'; break;
      case 'price_desc': orderClause = 'ORDER BY r.price DESC'; break;
      default: orderClause = 'ORDER BY r.created_at DESC';
    }

    // Count total
    const countResult = await query(
      `SELECT COUNT(*) as total FROM rooms r
       JOIN wards w ON r.ward_id = w.id
       JOIN districts d ON w.district_id = d.id
       JOIN provinces p ON d.province_id = p.id
       ${whereClause}`, [...params]
    );
    const total = countResult[0]?.total || 0;

    // Main query
    params.push(parseInt(limit), offset);
    const rooms = await query(
      `SELECT r.id, r.title, r.slug, r.price, r.deposit, r.area, r.max_occupants,
              r.address, r.latitude, r.longitude,
              r.allow_pet, r.allow_cooking, r.live_with_owner,
              r.available_from, r.status, r.created_at,
              rt.name as room_type_name, rt.slug as room_type_slug,
              u.id as landlord_id, u.full_name as landlord_name, u.avatar_url as landlord_avatar,
              u.phone as landlord_phone, u.is_verified as landlord_verified,
              w.name as ward_name, d.name as district_name, p.name as province_name,
              (SELECT url FROM room_images ri WHERE ri.room_id = r.id AND ri.is_cover = 1 LIMIT 1) as cover_image
       FROM rooms r
       JOIN users u ON r.landlord_id = u.id
       JOIN room_types rt ON r.room_type_id = rt.id
       JOIN wards w ON r.ward_id = w.id
       JOIN districts d ON w.district_id = d.id
       JOIN provinces p ON d.province_id = p.id
       ${whereClause}
       ${orderClause}
       LIMIT ? OFFSET ?`, params
    );

    // Get images for each room
    for (const room of rooms) {
      const images = await query(
        'SELECT url, is_cover FROM room_images WHERE room_id = ? ORDER BY sort_order LIMIT 5',
        [room.id]
      );
      room.images = images.map(img => img.url);
      if (!room.cover_image && images.length > 0) {
        room.cover_image = images[0].url;
      }

      // Get amenities
      const roomAmenities = await query(
        `SELECT a.id, a.name, a.icon FROM room_amenities ra JOIN amenities a ON ra.amenity_id = a.id WHERE ra.room_id = ?`,
        [room.id]
      );
      room.amenities = roomAmenities;

      // Get avg rating
      const ratingResult = await query(
        'SELECT AVG(rating) as avg_rating, COUNT(*) as review_count FROM reviews WHERE room_id = ?',
        [room.id]
      );
      room.avgRating = ratingResult[0]?.avg_rating ? parseFloat(ratingResult[0].avg_rating).toFixed(1) : 0;
      room.reviewCount = ratingResult[0]?.review_count || 0;
    }

    res.json(paginate(rooms, page, limit, total));
  } catch (error) {
    next(error);
  }
}

/**
 * GET /rooms/:id - Room detail
 */
async function getRoomById(req, res, next) {
  try {
    const rooms = await query(
      `SELECT r.*,
              rt.name as room_type_name, rt.slug as room_type_slug,
              u.id as landlord_id_u, u.full_name as landlord_name, u.avatar_url as landlord_avatar,
              u.phone as landlord_phone, u.email as landlord_email, u.is_verified as landlord_verified,
              w.name as ward_name, d.name as district_name, p.name as province_name
       FROM rooms r
       JOIN users u ON r.landlord_id = u.id
       JOIN room_types rt ON r.room_type_id = rt.id
       JOIN wards w ON r.ward_id = w.id
       JOIN districts d ON w.district_id = d.id
       JOIN provinces p ON d.province_id = p.id
       WHERE r.id = ?`, [req.params.id]
    );

    if (rooms.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy phòng' });
    }

    const room = rooms[0];

    // Get images
    const images = await query(
      'SELECT id, url, is_cover, sort_order FROM room_images WHERE room_id = ? ORDER BY sort_order',
      [room.id]
    );

    // Get amenities
    const amenities = await query(
      `SELECT a.id, a.name, a.icon FROM room_amenities ra JOIN amenities a ON ra.amenity_id = a.id WHERE ra.room_id = ?`,
      [room.id]
    );

    // Get prices/services
    const prices = await query(
      'SELECT id, label, price, unit, is_metered, meter_type FROM room_prices WHERE room_id = ?',
      [room.id]
    );

    // Get reviews
    const reviews = await query(
      `SELECT rv.id, rv.rating, rv.comment, rv.created_at,
              u.full_name as tenant_name, u.avatar_url as tenant_avatar
       FROM reviews rv JOIN users u ON rv.tenant_id = u.id
       WHERE rv.room_id = ? ORDER BY rv.created_at DESC LIMIT 10`,
      [room.id]
    );

    // Get avg rating
    const ratingResult = await query(
      'SELECT AVG(rating) as avg_rating, COUNT(*) as review_count FROM reviews WHERE room_id = ?',
      [room.id]
    );

    res.json({
      data: {
        id: room.id,
        title: room.title,
        slug: room.slug,
        description: room.description,
        address: room.address,
        latitude: room.latitude,
        longitude: room.longitude,
        area: parseFloat(room.area),
        price: parseFloat(room.price),
        deposit: parseFloat(room.deposit),
        maxOccupants: room.max_occupants,
        availableFrom: room.available_from,
        allowPet: !!room.allow_pet,
        allowCooking: !!room.allow_cooking,
        liveWithOwner: !!room.live_with_owner,
        curfewTime: room.curfew_time,
        extraRules: room.extra_rules,
        status: room.status,
        createdAt: room.created_at,
        updatedAt: room.updated_at,
        roomType: { name: room.room_type_name, slug: room.room_type_slug },
        ward: room.ward_name,
        district: room.district_name,
        province: room.province_name,
        landlord: {
          id: room.landlord_id,
          fullName: room.landlord_name,
          avatar: room.landlord_avatar,
          phone: room.landlord_phone,
          email: room.landlord_email,
          isVerified: !!room.landlord_verified,
        },
        images,
        amenities,
        prices,
        reviews,
        avgRating: ratingResult[0]?.avg_rating ? parseFloat(ratingResult[0].avg_rating).toFixed(1) : 0,
        reviewCount: ratingResult[0]?.review_count || 0,
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /rooms - Create room (landlord)
 */
async function createRoom(req, res, next) {
  const conn = await getConnection();
  try {
    await conn.beginTransaction();

    const {
      title, description, roomTypeId, wardId,
      address, latitude, longitude,
      area, price, deposit = 0, maxOccupants = 1,
      availableFrom, allowPet = false, allowCooking = false,
      liveWithOwner = false, curfewTime, extraRules,
      amenityIds = [], images = [], prices = [],
    } = req.body;

    if (!title || !roomTypeId || !wardId || !address || !area || !price) {
      return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
    }

    const roomId = generateUUID();
    const slug = generateSlug(title);

    await conn.execute(
      `INSERT INTO rooms
       (id, landlord_id, ward_id, room_type_id, title, slug, description, address,
        latitude, longitude, area, price, deposit, max_occupants,
        available_from, allow_pet, allow_cooking, live_with_owner, curfew_time, extra_rules)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [roomId, req.user.id, wardId, roomTypeId, title, slug, description || null, address,
       latitude || null, longitude || null, area, price, deposit, maxOccupants,
       availableFrom || null, allowPet ? 1 : 0, allowCooking ? 1 : 0,
       liveWithOwner ? 1 : 0, curfewTime || null, extraRules || null]
    );

    // Insert amenities
    for (const amenityId of amenityIds) {
      await conn.execute(
        'INSERT INTO room_amenities (room_id, amenity_id) VALUES (?, ?)',
        [roomId, amenityId]
      );
    }

    // Insert images
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      await conn.execute(
        'INSERT INTO room_images (id, room_id, url, is_cover, sort_order) VALUES (?, ?, ?, ?, ?)',
        [generateUUID(), roomId, typeof img === 'string' ? img : img.url, i === 0 ? 1 : 0, i]
      );
    }

    // Insert prices (services)
    for (const p of prices) {
      await conn.execute(
        `INSERT INTO room_prices (id, room_id, label, price, unit, is_metered, meter_type)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [generateUUID(), roomId, p.label, p.price, p.unit, p.isMetered ? 1 : 0, p.meterType || null]
      );
    }

    await conn.commit();

    res.status(201).json({
      message: 'Đăng phòng thành công',
      data: { id: roomId, slug }
    });
  } catch (error) {
    await conn.rollback();
    next(error);
  } finally {
    conn.release();
  }
}

/**
 * PUT /rooms/:id - Update room
 */
async function updateRoom(req, res, next) {
  const conn = await getConnection();
  try {
    await conn.beginTransaction();

    // Verify ownership
    const [existing] = await conn.execute(
      'SELECT landlord_id FROM rooms WHERE id = ?', [req.params.id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy phòng' });
    }
    if (existing[0].landlord_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Bạn không có quyền sửa phòng này' });
    }

    const {
      title, description, roomTypeId, wardId,
      address, latitude, longitude,
      area, price, deposit, maxOccupants,
      availableFrom, allowPet, allowCooking,
      liveWithOwner, curfewTime, extraRules, status,
      amenityIds, images, prices,
    } = req.body;

    const fields = [];
    const params = [];

    if (title !== undefined) { fields.push('title = ?', 'slug = ?'); params.push(title, generateSlug(title)); }
    if (description !== undefined) { fields.push('description = ?'); params.push(description); }
    if (roomTypeId !== undefined) { fields.push('room_type_id = ?'); params.push(roomTypeId); }
    if (wardId !== undefined) { fields.push('ward_id = ?'); params.push(wardId); }
    if (address !== undefined) { fields.push('address = ?'); params.push(address); }
    if (latitude !== undefined) { fields.push('latitude = ?'); params.push(latitude); }
    if (longitude !== undefined) { fields.push('longitude = ?'); params.push(longitude); }
    if (area !== undefined) { fields.push('area = ?'); params.push(area); }
    if (price !== undefined) { fields.push('price = ?'); params.push(price); }
    if (deposit !== undefined) { fields.push('deposit = ?'); params.push(deposit); }
    if (maxOccupants !== undefined) { fields.push('max_occupants = ?'); params.push(maxOccupants); }
    if (availableFrom !== undefined) { fields.push('available_from = ?'); params.push(availableFrom); }
    if (allowPet !== undefined) { fields.push('allow_pet = ?'); params.push(allowPet ? 1 : 0); }
    if (allowCooking !== undefined) { fields.push('allow_cooking = ?'); params.push(allowCooking ? 1 : 0); }
    if (liveWithOwner !== undefined) { fields.push('live_with_owner = ?'); params.push(liveWithOwner ? 1 : 0); }
    if (curfewTime !== undefined) { fields.push('curfew_time = ?'); params.push(curfewTime); }
    if (extraRules !== undefined) { fields.push('extra_rules = ?'); params.push(extraRules); }
    if (status !== undefined) { fields.push('status = ?'); params.push(status); }

    if (fields.length > 0) {
      params.push(req.params.id);
      await conn.execute(`UPDATE rooms SET ${fields.join(', ')} WHERE id = ?`, params);
    }

    // Update amenities
    if (amenityIds !== undefined) {
      await conn.execute('DELETE FROM room_amenities WHERE room_id = ?', [req.params.id]);
      for (const amenityId of amenityIds) {
        await conn.execute(
          'INSERT INTO room_amenities (room_id, amenity_id) VALUES (?, ?)',
          [req.params.id, amenityId]
        );
      }
    }

    // Update images
    if (images !== undefined) {
      await conn.execute('DELETE FROM room_images WHERE room_id = ?', [req.params.id]);
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        await conn.execute(
          'INSERT INTO room_images (id, room_id, url, is_cover, sort_order) VALUES (?, ?, ?, ?, ?)',
          [generateUUID(), req.params.id, typeof img === 'string' ? img : img.url, i === 0 ? 1 : 0, i]
        );
      }
    }

    // Update prices
    if (prices !== undefined) {
      await conn.execute('DELETE FROM room_prices WHERE room_id = ?', [req.params.id]);
      for (const p of prices) {
        await conn.execute(
          `INSERT INTO room_prices (id, room_id, label, price, unit, is_metered, meter_type) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [generateUUID(), req.params.id, p.label, p.price, p.unit, p.isMetered ? 1 : 0, p.meterType || null]
        );
      }
    }

    await conn.commit();
    res.json({ message: 'Cập nhật phòng thành công' });
  } catch (error) {
    await conn.rollback();
    next(error);
  } finally {
    conn.release();
  }
}

/**
 * DELETE /rooms/:id
 */
async function deleteRoom(req, res, next) {
  try {
    const rooms = await query('SELECT landlord_id FROM rooms WHERE id = ?', [req.params.id]);
    if (rooms.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy phòng' });
    }
    if (rooms[0].landlord_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Bạn không có quyền xóa phòng này' });
    }

    await query('UPDATE rooms SET status = ? WHERE id = ?', ['hidden', req.params.id]);
    res.json({ message: 'Xóa phòng thành công' });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /rooms/:id/status - Change room status (admin/landlord)
 */
async function updateRoomStatus(req, res, next) {
  try {
    const { status } = req.body;
    await query('UPDATE rooms SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ message: 'Cập nhật trạng thái phòng thành công' });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /rooms/landlord/my-rooms - Get rooms by landlord
 */
async function getMyRooms(req, res, next) {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let whereClause = 'WHERE r.landlord_id = ?';
    const params = [req.user.id];

    if (status) { whereClause += ' AND r.status = ?'; params.push(status); }

    const countResult = await query(
      `SELECT COUNT(*) as total FROM rooms r ${whereClause}`, [...params]
    );
    const total = countResult[0]?.total || 0;

    params.push(parseInt(limit), offset);
    const rooms = await query(
      `SELECT r.id, r.title, r.slug, r.price, r.area, r.address, r.status, r.created_at,
              rt.name as room_type_name,
              (SELECT url FROM room_images ri WHERE ri.room_id = r.id AND ri.is_cover = 1 LIMIT 1) as cover_image
       FROM rooms r
       JOIN room_types rt ON r.room_type_id = rt.id
       ${whereClause}
       ORDER BY r.created_at DESC LIMIT ? OFFSET ?`, params
    );

    res.json(paginate(rooms, page, limit, total));
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
  updateRoomStatus,
  getMyRooms,
};

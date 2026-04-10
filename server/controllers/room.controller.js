// ============================================================
// Room Controller - CRUD, Search, Images, Amenities
// ============================================================
const { query, getConnection } = require('../config/db');
const { generateUUID, generateSlug, paginate, buildWhereClause, toCamelCase } = require('../utils/helpers');

/**
 * GET /rooms - Search/List rooms with filters
 */
async function listRooms(req, res, next) {
  try {
    const {
      page = 1, limit = 20, search, roomType, listingType,
      priceMin, priceMax, areaMin, areaMax,
      provinceId, districtId, wardId,
      numBedrooms, numBathrooms, maxOccupants,
      furnitureLevel, genderPreference,
      amenities, // comma-separated amenity names
      sortBy = 'newest', // newest, price_asc, price_desc, rating, popular
      lat, lng, radius, // for geo search (meters)
    } = req.query;

    const offset = (page - 1) * limit;
    let conditions = ['r.is_deleted = 0', "r.status = 'active'"];
    const params = [];

    // Text search
    if (search) {
      conditions.push('MATCH(r.title, r.description, r.full_address) AGAINST(? IN BOOLEAN MODE)');
      params.push(search);
    }

    // Filters
    if (roomType) { conditions.push('r.room_type = ?'); params.push(roomType); }
    if (listingType) { conditions.push('r.listing_type = ?'); params.push(listingType); }
    if (priceMin) { conditions.push('r.price >= ?'); params.push(parseFloat(priceMin)); }
    if (priceMax) { conditions.push('r.price <= ?'); params.push(parseFloat(priceMax)); }
    if (areaMin) { conditions.push('r.area >= ?'); params.push(parseFloat(areaMin)); }
    if (areaMax) { conditions.push('r.area <= ?'); params.push(parseFloat(areaMax)); }
    if (provinceId) { conditions.push('r.province_id = ?'); params.push(parseInt(provinceId)); }
    if (districtId) { conditions.push('r.district_id = ?'); params.push(parseInt(districtId)); }
    if (wardId) { conditions.push('r.ward_id = ?'); params.push(parseInt(wardId)); }
    if (numBedrooms) { conditions.push('r.num_bedrooms >= ?'); params.push(parseInt(numBedrooms)); }
    if (numBathrooms) { conditions.push('r.num_bathrooms >= ?'); params.push(parseInt(numBathrooms)); }
    if (maxOccupants) { conditions.push('r.max_occupants >= ?'); params.push(parseInt(maxOccupants)); }
    if (furnitureLevel) { conditions.push('r.furniture_level = ?'); params.push(furnitureLevel); }
    if (genderPreference) { conditions.push('r.gender_preference = ?'); params.push(genderPreference); }

    // Amenity filter
    if (amenities) {
      const amenityList = amenities.split(',').map(a => a.trim());
      conditions.push(`
        r.id IN (
          SELECT ra.room_id FROM room_amenities ra
          JOIN amenities a ON ra.amenity_id = a.id
          WHERE a.name IN (${amenityList.map(() => '?').join(',')})
          GROUP BY ra.room_id HAVING COUNT(DISTINCT a.name) = ?
        )
      `);
      params.push(...amenityList, amenityList.length);
    }

    const whereClause = 'WHERE ' + conditions.join(' AND ');

    // Sorting
    let orderClause = 'ORDER BY r.is_vip DESC, r.vip_level DESC, ';
    switch (sortBy) {
      case 'price_asc': orderClause += 'r.price ASC'; break;
      case 'price_desc': orderClause += 'r.price DESC'; break;
      case 'rating': orderClause += 'r.avg_rating DESC'; break;
      case 'popular': orderClause += 'r.view_count DESC'; break;
      default: orderClause += 'r.published_at DESC, r.created_at DESC';
    }

    // Count total
    const countParams = [...params];
    const countResult = await query(
      `SELECT COUNT(*) as total FROM rooms r ${whereClause}`, countParams
    );
    const total = countResult[0]?.total || 0;

    // Main query
    params.push(parseInt(limit), offset);
    const rooms = await query(
      `SELECT r.id, r.title, r.slug, r.room_type, r.listing_type,
              r.price, r.deposit, r.area, r.floor,
              r.num_bedrooms, r.num_bathrooms, r.max_occupants,
              r.furniture_level, r.gender_preference,
              r.address, r.full_address,
              r.latitude, r.longitude,
              r.status, r.view_count, r.favorite_count, r.avg_rating, r.total_reviews,
              r.is_vip, r.vip_level,
              r.published_at, r.created_at,
              r.electricity_price, r.water_price, r.internet_price, r.parking_price,
              u.id as landlord_id, u.full_name as landlord_name, u.avatar_url as landlord_avatar,
              u.phone as landlord_phone, u.identity_verified as landlord_verified,
              p.name as province_name, d.name as district_name, w.name as ward_name,
              (SELECT url FROM room_images ri WHERE ri.room_id = r.id AND ri.is_cover = 1 LIMIT 1) as cover_image
       FROM rooms r
       JOIN users u ON r.landlord_id = u.id
       LEFT JOIN provinces p ON r.province_id = p.id
       LEFT JOIN districts d ON r.district_id = d.id
       LEFT JOIN wards w ON r.ward_id = w.id
       ${whereClause}
       ${orderClause}
       LIMIT ? OFFSET ?`, params
    );

    // Get images for each room (first 5)
    for (const room of rooms) {
      const images = await query(
        'SELECT url, thumbnail_url, is_cover FROM room_images WHERE room_id = ? ORDER BY sort_order LIMIT 5',
        [room.id]
      );
      room.images = images.map(img => img.url);
      room.coverImage = room.cover_image || (images[0] && images[0].url) || null;
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
              u.full_name as landlord_name, u.avatar_url as landlord_avatar,
              u.phone as landlord_phone, u.email as landlord_email,
              u.identity_verified as landlord_verified, u.avg_rating as landlord_rating,
              u.total_reviews_received as landlord_reviews,
              p.name as province_name, d.name as district_name, w.name as ward_name
       FROM rooms r
       JOIN users u ON r.landlord_id = u.id
       LEFT JOIN provinces p ON r.province_id = p.id
       LEFT JOIN districts d ON r.district_id = d.id
       LEFT JOIN wards w ON r.ward_id = w.id
       WHERE r.id = ? AND r.is_deleted = 0`, [req.params.id]
    );

    if (rooms.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy phòng' });
    }

    const room = rooms[0];

    // Get images
    const images = await query(
      'SELECT id, url, thumbnail_url, medium_url, is_cover, caption, sort_order FROM room_images WHERE room_id = ? ORDER BY sort_order',
      [room.id]
    );

    // Get videos
    const videos = await query(
      'SELECT id, url, thumbnail_url, duration, is_360 FROM room_videos WHERE room_id = ? ORDER BY sort_order',
      [room.id]
    );

    // Get amenities
    const amenities = await query(
      `SELECT a.id, a.name, a.name_vi, a.icon, a.category, ra.note
       FROM room_amenities ra JOIN amenities a ON ra.amenity_id = a.id
       WHERE ra.room_id = ? ORDER BY a.sort_order`, [room.id]
    );

    // Get nearby places
    const nearbyPlaces = await query(
      'SELECT name, category, distance_meters, latitude, longitude FROM nearby_places WHERE room_id = ? ORDER BY distance_meters',
      [room.id]
    );

    // Increment view count
    await query('UPDATE rooms SET view_count = view_count + 1 WHERE id = ?', [room.id]);

    // Track view if user is logged in
    if (req.user) {
      await query(
        `INSERT INTO room_views (id, room_id, user_id, ip_address, user_agent, source)
         VALUES (?, ?, ?, ?, ?, 'detail')`,
        [generateUUID(), room.id, req.user.id, req.ip, req.headers['user-agent']]
      );
    }

    res.json({
      data: {
        ...toCamelCase(room),
        images,
        videos,
        amenities,
        nearbyPlaces: toCamelCase(nearbyPlaces),
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
      title, description, roomType = 'phong_tro', listingType = 'cho_thue',
      price, deposit = 0, electricityPrice, waterPrice, internetPrice, parkingPrice, serviceFee,
      area, floor, numBedrooms = 1, numBathrooms = 1, maxOccupants = 2,
      furnitureLevel = 'empty', genderPreference = 'any',
      address, wardId, districtId, provinceId, fullAddress,
      latitude, longitude,
      availableFrom, minStayMonths = 1,
      buildingId, amenityIds = [], images = [],
    } = req.body;

    const roomId = generateUUID();
    const slug = generateSlug(title);

    // Build full address
    let computedFullAddress = fullAddress || address;
    if (!computedFullAddress && wardId && districtId && provinceId) {
      const [loc] = await conn.execute(
        `SELECT CONCAT(w.name, ', ', d.name, ', ', p.name) as addr
         FROM wards w JOIN districts d ON w.district_id = d.id JOIN provinces p ON d.province_id = p.id
         WHERE w.id = ?`, [wardId]
      );
      if (loc.length > 0) computedFullAddress = `${address}, ${loc[0].addr}`;
    }

    await conn.execute(
      `INSERT INTO rooms 
       (id, landlord_id, building_id, title, slug, description, room_type, listing_type,
        price, deposit, electricity_price, water_price, internet_price, parking_price, service_fee,
        area, floor, num_bedrooms, num_bathrooms, max_occupants,
        furniture_level, gender_preference,
        address, ward_id, district_id, province_id, full_address,
        latitude, longitude,
        available_from, min_stay_months,
        status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_approval')`,
      [roomId, req.user.id, buildingId || null, title, slug, description, roomType, listingType,
       price, deposit, electricityPrice || null, waterPrice || null, internetPrice || null,
       parkingPrice || null, serviceFee || 0,
       area || null, floor || null, numBedrooms, numBathrooms, maxOccupants,
       furnitureLevel, genderPreference,
       address, wardId || null, districtId || null, provinceId || null, computedFullAddress,
       latitude || null, longitude || null,
       availableFrom || null, minStayMonths]
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
        `INSERT INTO room_images (id, room_id, url, thumbnail_url, sort_order, is_cover, caption)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [generateUUID(), roomId, img.url || img, img.thumbnailUrl || null, i, i === 0 ? 1 : 0, img.caption || null]
      );
    }

    await conn.commit();

    res.status(201).json({
      message: 'Đăng phòng thành công, đang chờ duyệt',
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
      'SELECT landlord_id, status FROM rooms WHERE id = ? AND is_deleted = 0', [req.params.id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy phòng' });
    }
    if (existing[0].landlord_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Bạn không có quyền sửa phòng này' });
    }

    const {
      title, description, roomType, listingType,
      price, deposit, electricityPrice, waterPrice, internetPrice, parkingPrice, serviceFee,
      area, floor, numBedrooms, numBathrooms, maxOccupants,
      furnitureLevel, genderPreference,
      address, wardId, districtId, provinceId, fullAddress,
      latitude, longitude,
      availableFrom, minStayMonths,
      amenityIds, images,
    } = req.body;

    const fields = [];
    const params = [];

    if (title !== undefined) { fields.push('title = ?'); params.push(title); fields.push('slug = ?'); params.push(generateSlug(title)); }
    if (description !== undefined) { fields.push('description = ?'); params.push(description); }
    if (roomType !== undefined) { fields.push('room_type = ?'); params.push(roomType); }
    if (listingType !== undefined) { fields.push('listing_type = ?'); params.push(listingType); }
    if (price !== undefined) { fields.push('price = ?'); params.push(price); }
    if (deposit !== undefined) { fields.push('deposit = ?'); params.push(deposit); }
    if (electricityPrice !== undefined) { fields.push('electricity_price = ?'); params.push(electricityPrice); }
    if (waterPrice !== undefined) { fields.push('water_price = ?'); params.push(waterPrice); }
    if (internetPrice !== undefined) { fields.push('internet_price = ?'); params.push(internetPrice); }
    if (parkingPrice !== undefined) { fields.push('parking_price = ?'); params.push(parkingPrice); }
    if (serviceFee !== undefined) { fields.push('service_fee = ?'); params.push(serviceFee); }
    if (area !== undefined) { fields.push('area = ?'); params.push(area); }
    if (floor !== undefined) { fields.push('floor = ?'); params.push(floor); }
    if (numBedrooms !== undefined) { fields.push('num_bedrooms = ?'); params.push(numBedrooms); }
    if (numBathrooms !== undefined) { fields.push('num_bathrooms = ?'); params.push(numBathrooms); }
    if (maxOccupants !== undefined) { fields.push('max_occupants = ?'); params.push(maxOccupants); }
    if (furnitureLevel !== undefined) { fields.push('furniture_level = ?'); params.push(furnitureLevel); }
    if (genderPreference !== undefined) { fields.push('gender_preference = ?'); params.push(genderPreference); }
    if (address !== undefined) { fields.push('address = ?'); params.push(address); }
    if (wardId !== undefined) { fields.push('ward_id = ?'); params.push(wardId); }
    if (districtId !== undefined) { fields.push('district_id = ?'); params.push(districtId); }
    if (provinceId !== undefined) { fields.push('province_id = ?'); params.push(provinceId); }
    if (fullAddress !== undefined) { fields.push('full_address = ?'); params.push(fullAddress); }
    if (latitude !== undefined) { fields.push('latitude = ?'); params.push(latitude); }
    if (longitude !== undefined) { fields.push('longitude = ?'); params.push(longitude); }
    if (availableFrom !== undefined) { fields.push('available_from = ?'); params.push(availableFrom); }
    if (minStayMonths !== undefined) { fields.push('min_stay_months = ?'); params.push(minStayMonths); }

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
          `INSERT INTO room_images (id, room_id, url, thumbnail_url, sort_order, is_cover, caption)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [generateUUID(), req.params.id, img.url || img, img.thumbnailUrl || null, i, i === 0 ? 1 : 0, img.caption || null]
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
    const rooms = await query(
      'SELECT landlord_id FROM rooms WHERE id = ? AND is_deleted = 0', [req.params.id]
    );
    if (rooms.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy phòng' });
    }
    if (rooms[0].landlord_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Bạn không có quyền xóa phòng này' });
    }

    await query(
      'UPDATE rooms SET is_deleted = 1, deleted_at = NOW(), status = ? WHERE id = ?',
      ['hidden', req.params.id]
    );

    res.json({ message: 'Xóa phòng thành công' });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /rooms/:id/status - Approve/Reject room (admin)
 */
async function updateRoomStatus(req, res, next) {
  try {
    const { status, rejectionReason } = req.body;

    const updates = ['status = ?'];
    const params = [status];

    if (status === 'active') {
      updates.push('approved_by = ?', 'approved_at = NOW()', 'published_at = NOW()');
      params.push(req.user.id);
    }
    if (status === 'rejected' && rejectionReason) {
      updates.push('rejection_reason = ?');
      params.push(rejectionReason);
    }

    params.push(req.params.id);
    await query(`UPDATE rooms SET ${updates.join(', ')} WHERE id = ?`, params);

    res.json({ message: `Phòng đã được ${status === 'active' ? 'duyệt' : 'cập nhật'}` });
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
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE r.landlord_id = ? AND r.is_deleted = 0';
    const params = [req.user.id];

    if (status) { whereClause += ' AND r.status = ?'; params.push(status); }

    const countResult = await query(
      `SELECT COUNT(*) as total FROM rooms r ${whereClause}`, [...params]
    );
    const total = countResult[0]?.total || 0;

    params.push(parseInt(limit), offset);
    const rooms = await query(
      `SELECT r.id, r.title, r.slug, r.room_type, r.price, r.area, r.address,
              r.status, r.view_count, r.favorite_count, r.avg_rating, r.total_reviews,
              r.is_vip, r.vip_level, r.published_at, r.created_at,
              (SELECT url FROM room_images ri WHERE ri.room_id = r.id AND ri.is_cover = 1 LIMIT 1) as cover_image
       FROM rooms r ${whereClause}
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

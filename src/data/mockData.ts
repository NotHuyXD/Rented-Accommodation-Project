import type { Room, User, Review, Message, ChatRoom, Booking, Contract, Invoice, Notification, Ticket, RoommatePost, ViewingSchedule } from '../types';

// ==================== USERS ====================
export const mockUsers: User[] = [
  {
    id: 'user-1',
    email: 'nguyenvana@gmail.com',
    phone: '0901234567',
    fullName: 'Nguyễn Văn A',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user1',
    role: 'tenant',
    bio: 'Sinh viên năm 3, Đại học Bách Khoa',
    isVerified: true,
    isEKYC: false,
    createdAt: '2025-01-15',
    privacySettings: { showPhone: true, showEmail: false }
  },
  {
    id: 'user-2',
    email: 'tranthib@gmail.com',
    phone: '0912345678',
    fullName: 'Trần Thị B',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user2',
    role: 'landlord',
    bio: 'Chủ trọ 10 năm kinh nghiệm tại Quận 1',
    isVerified: true,
    isEKYC: true,
    createdAt: '2024-06-10',
    privacySettings: { showPhone: true, showEmail: true }
  },
  {
    id: 'user-3',
    email: 'admin@phongtro.vn',
    phone: '0900000001',
    fullName: 'Admin Hệ Thống',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
    role: 'admin',
    isVerified: true,
    isEKYC: true,
    createdAt: '2024-01-01',
    privacySettings: { showPhone: false, showEmail: false }
  },
  {
    id: 'user-4',
    email: 'levanc@gmail.com',
    phone: '0923456789',
    fullName: 'Lê Văn C',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user4',
    role: 'landlord',
    bio: 'Chủ dãy trọ tại Quận Bình Thạnh',
    isVerified: true,
    isEKYC: true,
    createdAt: '2024-08-20',
    privacySettings: { showPhone: true, showEmail: true }
  },
  {
    id: 'user-5',
    email: 'phamthid@gmail.com',
    phone: '0934567890',
    fullName: 'Phạm Thị D',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user5',
    role: 'tenant',
    bio: 'Nhân viên văn phòng tại Quận 3',
    isVerified: true,
    isEKYC: false,
    createdAt: '2025-02-01',
    privacySettings: { showPhone: false, showEmail: true }
  }
];

// ==================== ROOMS ====================
export const mockRooms: Room[] = [
  {
    id: 'room-1',
    title: 'Phòng trọ cao cấp Quận 1 - Full nội thất',
    price: 5500000,
    area: 30,
    maxOccupants: 2,
    address: '123 Nguyễn Trãi, Phường Bến Thành',
    district: 'Quận 1',
    city: 'Hồ Chí Minh',
    ward: 'Phường Bến Thành',
    lat: 10.7711,
    lng: 106.6984,
    images: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800'
    ],
    description: 'Phòng trọ cao cấp, đầy đủ nội thất, gần trung tâm Quận 1. Phòng sạch sẽ, thoáng mát, an ninh tốt. Giờ ra vào tự do. Gần chợ Bến Thành, giao thông thuận tiện.',
    amenities: ['wifi', 'ac', 'parking', 'furniture', 'washing_machine', 'fridge'],
    status: 'available',
    landlordId: 'user-2',
    landlordName: 'Trần Thị B',
    landlordAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user2',
    landlordPhone: '0912345678',
    isPinned: true,
    isBoosted: true,
    rating: 4.8,
    reviewCount: 24,
    views: 1250,
    createdAt: '2025-03-01',
    updatedAt: '2025-03-20',
    hasWifi: true,
    hasAC: true,
    hasParking: true,
    hasFurniture: true,
    allowPets: false
  },
  {
    id: 'room-2',
    title: 'Phòng trọ giá rẻ Bình Thạnh - Gần ĐH',
    price: 2800000,
    area: 18,
    maxOccupants: 1,
    address: '45 Điện Biên Phủ, Phường 15',
    district: 'Quận Bình Thạnh',
    city: 'Hồ Chí Minh',
    ward: 'Phường 15',
    lat: 10.8023,
    lng: 106.7106,
    images: [
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800',
      'https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=800',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800'
    ],
    description: 'Phòng trọ sinh viên giá rẻ, gần các trường đại học. Khu vực an ninh, giờ ra vào tự do. Có wifi miễn phí. Phù hợp sinh viên và người đi làm.',
    amenities: ['wifi', 'parking'],
    status: 'available',
    landlordId: 'user-4',
    landlordName: 'Lê Văn C',
    landlordAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user4',
    landlordPhone: '0923456789',
    isPinned: false,
    isBoosted: false,
    rating: 4.2,
    reviewCount: 15,
    views: 890,
    createdAt: '2025-03-10',
    updatedAt: '2025-03-18',
    hasWifi: true,
    hasAC: false,
    hasParking: true,
    hasFurniture: false,
    allowPets: false
  },
  {
    id: 'room-3',
    title: 'Căn hộ mini Quận 3 - View đẹp',
    price: 7000000,
    area: 35,
    maxOccupants: 2,
    address: '78 Võ Văn Tần, Phường 6',
    district: 'Quận 3',
    city: 'Hồ Chí Minh',
    ward: 'Phường 6',
    lat: 10.7756,
    lng: 106.6889,
    images: [
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800'
    ],
    description: 'Căn hộ mini cao cấp tại Quận 3. View thành phố tuyệt đẹp, đầy đủ tiện nghi. Ban công rộng, ánh sáng tự nhiên. Gần công viên Tao Đàn.',
    amenities: ['wifi', 'ac', 'parking', 'furniture', 'washing_machine', 'fridge', 'balcony'],
    status: 'available',
    landlordId: 'user-2',
    landlordName: 'Trần Thị B',
    landlordAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user2',
    landlordPhone: '0912345678',
    isPinned: true,
    isBoosted: false,
    rating: 4.9,
    reviewCount: 31,
    views: 2100,
    createdAt: '2025-02-20',
    updatedAt: '2025-03-15',
    hasWifi: true,
    hasAC: true,
    hasParking: true,
    hasFurniture: true,
    allowPets: true
  },
  {
    id: 'room-4',
    title: 'Phòng trọ Thủ Đức - Gần KCN',
    price: 2200000,
    area: 15,
    maxOccupants: 1,
    address: '200 Võ Văn Ngân, Phường Bình Thọ',
    district: 'TP. Thủ Đức',
    city: 'Hồ Chí Minh',
    ward: 'Phường Bình Thọ',
    lat: 10.8498,
    lng: 106.7720,
    images: [
      'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800',
      'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=800'
    ],
    description: 'Phòng trọ sạch sẽ gần khu công nghiệp. Giá rẻ, phù hợp công nhân và sinh viên. Khu vực yên tĩnh, an ninh tốt.',
    amenities: ['wifi', 'parking'],
    status: 'available',
    landlordId: 'user-4',
    landlordName: 'Lê Văn C',
    landlordAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user4',
    landlordPhone: '0923456789',
    isPinned: false,
    isBoosted: false,
    rating: 4.0,
    reviewCount: 8,
    views: 450,
    createdAt: '2025-03-12',
    updatedAt: '2025-03-19',
    hasWifi: true,
    hasAC: false,
    hasParking: true,
    hasFurniture: false,
    allowPets: false
  },
  {
    id: 'room-5',
    title: 'Studio Quận 7 - PMH - Full tiện nghi',
    price: 8500000,
    area: 40,
    maxOccupants: 2,
    address: '100 Nguyễn Lương Bằng, Phường Tân Phú',
    district: 'Quận 7',
    city: 'Hồ Chí Minh',
    ward: 'Phường Tân Phú',
    lat: 10.7295,
    lng: 106.7218,
    images: [
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
      'https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=800',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800'
    ],
    description: 'Studio cao cấp tại khu Phú Mỹ Hưng. Full nội thất nhập khẩu, máy giặt, tủ lạnh, bếp. Hồ bơi, gym miễn phí. An ninh 24/7, thang máy.',
    amenities: ['wifi', 'ac', 'parking', 'furniture', 'washing_machine', 'fridge', 'pool', 'gym', 'elevator', 'security'],
    status: 'available',
    landlordId: 'user-2',
    landlordName: 'Trần Thị B',
    landlordAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user2',
    landlordPhone: '0912345678',
    isPinned: true,
    isBoosted: true,
    rating: 4.95,
    reviewCount: 48,
    views: 3200,
    createdAt: '2025-02-10',
    updatedAt: '2025-03-20',
    hasWifi: true,
    hasAC: true,
    hasParking: true,
    hasFurniture: true,
    allowPets: true
  },
  {
    id: 'room-6',
    title: 'Phòng trọ Gò Vấp - Mới xây',
    price: 3200000,
    area: 20,
    maxOccupants: 2,
    address: '55 Quang Trung, Phường 10',
    district: 'Quận Gò Vấp',
    city: 'Hồ Chí Minh',
    ward: 'Phường 10',
    lat: 10.8385,
    lng: 106.6620,
    images: [
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800',
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800'
    ],
    description: 'Phòng trọ mới xây, sạch sẽ thoáng mát. Có ban công, ánh sáng tự nhiên. Gần siêu thị, chợ. Giờ ra vào tự do.',
    amenities: ['wifi', 'ac', 'parking', 'balcony'],
    status: 'available',
    landlordId: 'user-4',
    landlordName: 'Lê Văn C',
    landlordAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user4',
    landlordPhone: '0923456789',
    isPinned: false,
    isBoosted: true,
    rating: 4.5,
    reviewCount: 12,
    views: 670,
    createdAt: '2025-03-05',
    updatedAt: '2025-03-18',
    hasWifi: true,
    hasAC: true,
    hasParking: true,
    hasFurniture: false,
    allowPets: false
  },
  {
    id: 'room-7',
    title: 'Phòng trọ Tân Bình - Gần sân bay',
    price: 4000000,
    area: 25,
    maxOccupants: 2,
    address: '30 Cộng Hòa, Phường 4',
    district: 'Quận Tân Bình',
    city: 'Hồ Chí Minh',
    ward: 'Phường 4',
    lat: 10.8018,
    lng: 106.6525,
    images: [
      'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
      'https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=800'
    ],
    description: 'Phòng trọ gần sân bay Tân Sơn Nhất. Có nội thất cơ bản, máy lạnh, wifi. Khu vực sầm uất, giao thông thuận tiện.',
    amenities: ['wifi', 'ac', 'furniture'],
    status: 'deposited',
    landlordId: 'user-2',
    landlordName: 'Trần Thị B',
    landlordAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user2',
    landlordPhone: '0912345678',
    isPinned: false,
    isBoosted: false,
    rating: 4.3,
    reviewCount: 18,
    views: 980,
    createdAt: '2025-02-28',
    updatedAt: '2025-03-15',
    hasWifi: true,
    hasAC: true,
    hasParking: false,
    hasFurniture: true,
    allowPets: false
  },
  {
    id: 'room-8',
    title: 'Nhà nguyên căn Quận 2 - Khu An Phú',
    price: 12000000,
    area: 60,
    maxOccupants: 4,
    address: '15 Thảo Điền, Phường Thảo Điền',
    district: 'TP. Thủ Đức',
    city: 'Hồ Chí Minh',
    ward: 'Phường Thảo Điền',
    lat: 10.8086,
    lng: 106.7395,
    images: [
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800'
    ],
    description: 'Nhà nguyên căn khu An Phú, Quận 2. Full nội thất cao cấp, sân vườn rộng rãi, garage ô tô. Phù hợp gia đình hoặc nhóm bạn.',
    amenities: ['wifi', 'ac', 'parking', 'furniture', 'washing_machine', 'fridge', 'garden', 'garage'],
    status: 'available',
    landlordId: 'user-4',
    landlordName: 'Lê Văn C',
    landlordAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user4',
    landlordPhone: '0923456789',
    isPinned: true,
    isBoosted: true,
    rating: 4.7,
    reviewCount: 9,
    views: 1800,
    createdAt: '2025-03-08',
    updatedAt: '2025-03-20',
    hasWifi: true,
    hasAC: true,
    hasParking: true,
    hasFurniture: true,
    allowPets: true
  }
];

// ==================== REVIEWS ====================
export const mockReviews: Review[] = [
  {
    id: 'review-1',
    roomId: 'room-1',
    userId: 'user-1',
    userName: 'Nguyễn Văn A',
    userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user1',
    rating: 5,
    comment: 'Phòng rất đẹp, sạch sẽ. Chủ trọ thân thiện, nhiệt tình hỗ trợ. Giá cả hợp lý cho khu vực trung tâm.',
    createdAt: '2025-03-15',
    type: 'room'
  },
  {
    id: 'review-2',
    roomId: 'room-1',
    userId: 'user-5',
    userName: 'Phạm Thị D',
    userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user5',
    rating: 4,
    comment: 'Phòng ổn, tiện nghi đầy đủ. Chỉ hơi ồn vào giờ cao điểm do gần đường lớn.',
    createdAt: '2025-03-10',
    type: 'room'
  },
  {
    id: 'review-3',
    roomId: 'room-3',
    userId: 'user-1',
    userName: 'Nguyễn Văn A',
    userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user1',
    rating: 5,
    comment: 'Căn hộ đẹp xuất sắc! View thành phố tuyệt vời, nội thất sang trọng. Rất hài lòng!',
    createdAt: '2025-03-12',
    type: 'room'
  },
  {
    id: 'review-4',
    roomId: 'room-5',
    userId: 'user-5',
    userName: 'Phạm Thị D',
    userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user5',
    rating: 5,
    comment: 'Studio tuyệt vời! Có hồ bơi và gym miễn phí. An ninh rất tốt. Đáng giá từng đồng!',
    createdAt: '2025-03-18',
    type: 'room'
  }
];

// ==================== CHAT ====================
export const mockChatRooms: ChatRoom[] = [
  {
    id: 'chat-1',
    participants: ['user-1', 'user-2'],
    lastMessage: {
      id: 'msg-3',
      senderId: 'user-2',
      receiverId: 'user-1',
      content: 'Bạn có thể đến xem phòng vào chiều mai nhé!',
      type: 'text',
      createdAt: '2025-03-20T14:30:00',
      read: false
    },
    unreadCount: 1
  },
  {
    id: 'chat-2',
    participants: ['user-1', 'user-4'],
    lastMessage: {
      id: 'msg-5',
      senderId: 'user-1',
      receiverId: 'user-4',
      content: 'Cho em hỏi phòng còn trống không ạ?',
      type: 'text',
      createdAt: '2025-03-19T09:15:00',
      read: true
    },
    unreadCount: 0
  }
];

export const mockMessages: Message[] = [
  {
    id: 'msg-1',
    senderId: 'user-1',
    receiverId: 'user-2',
    content: 'Chào chị, em muốn hỏi về phòng trọ ở Quận 1',
    type: 'text',
    createdAt: '2025-03-20T14:00:00',
    read: true
  },
  {
    id: 'msg-2',
    senderId: 'user-2',
    receiverId: 'user-1',
    content: 'Chào em, phòng vẫn còn trống nhé. Em muốn đến xem không?',
    type: 'text',
    createdAt: '2025-03-20T14:15:00',
    read: true
  },
  {
    id: 'msg-3',
    senderId: 'user-2',
    receiverId: 'user-1',
    content: 'Bạn có thể đến xem phòng vào chiều mai nhé!',
    type: 'text',
    createdAt: '2025-03-20T14:30:00',
    read: false
  }
];

// ==================== BOOKINGS ====================
export const mockBookings: Booking[] = [
  {
    id: 'booking-1',
    roomId: 'room-1',
    tenantId: 'user-1',
    landlordId: 'user-2',
    startDate: '2025-04-01',
    status: 'confirmed',
    depositAmount: 5500000,
    monthlyRent: 5500000,
    createdAt: '2025-03-20'
  }
];

// ==================== CONTRACTS ====================
export const mockContracts: Contract[] = [
  {
    id: 'contract-1',
    bookingId: 'booking-1',
    roomId: 'room-1',
    tenantId: 'user-1',
    landlordId: 'user-2',
    startDate: '2025-04-01',
    endDate: '2026-04-01',
    monthlyRent: 5500000,
    deposit: 5500000,
    terms: 'Hợp đồng thuê phòng trọ tại 123 Nguyễn Trãi, Quận 1. Thời hạn 12 tháng. Tiền cọc 1 tháng. Thanh toán trước ngày 5 hàng tháng.',
    status: 'active',
    signedByTenant: true,
    signedByLandlord: true,
    createdAt: '2025-03-25'
  }
];

// ==================== INVOICES ====================
export const mockInvoices: Invoice[] = [
  {
    id: 'invoice-1',
    bookingId: 'booking-1',
    tenantId: 'user-1',
    month: '2025-04',
    rent: 5500000,
    electricity: 350000,
    water: 120000,
    service: 100000,
    total: 6070000,
    status: 'completed',
    createdAt: '2025-04-01'
  },
  {
    id: 'invoice-2',
    bookingId: 'booking-1',
    tenantId: 'user-1',
    month: '2025-05',
    rent: 5500000,
    electricity: 420000,
    water: 130000,
    service: 100000,
    total: 6150000,
    status: 'pending',
    createdAt: '2025-05-01'
  }
];

// ==================== NOTIFICATIONS ====================
export const mockNotifications: Notification[] = [
  {
    id: 'notif-1',
    userId: 'user-1',
    title: 'Lịch xem phòng được xác nhận',
    message: 'Chủ trọ Trần Thị B đã xác nhận lịch xem phòng vào 14:00 ngày 25/03/2025',
    type: 'schedule',
    read: false,
    createdAt: '2025-03-24T10:00:00',
    link: '/schedule'
  },
  {
    id: 'notif-2',
    userId: 'user-1',
    title: 'Hóa đơn tháng 5 đã sẵn sàng',
    message: 'Hóa đơn tiền phòng tháng 5/2025 đã được tạo. Tổng cộng: 6,150,000đ',
    type: 'payment',
    read: false,
    createdAt: '2025-05-01T08:00:00',
    link: '/payments'
  },
  {
    id: 'notif-3',
    userId: 'user-1',
    title: 'Tin nhắn mới',
    message: 'Bạn có tin nhắn mới từ Trần Thị B',
    type: 'chat',
    read: true,
    createdAt: '2025-03-20T14:30:00',
    link: '/chat'
  }
];

// ==================== TICKETS ====================
export const mockTickets: Ticket[] = [
  {
    id: 'ticket-1',
    roomId: 'room-1',
    tenantId: 'user-1',
    category: 'plumbing',
    title: 'Vòi nước bị rỉ',
    description: 'Vòi nước nhà tắm bị rỉ nước liên tục, cần sửa gấp.',
    status: 'in_progress',
    createdAt: '2025-03-22T09:00:00'
  },
  {
    id: 'ticket-2',
    roomId: 'room-1',
    tenantId: 'user-1',
    category: 'electrical',
    title: 'Đèn phòng khách hỏng',
    description: 'Đèn LED phòng khách không sáng.',
    status: 'resolved',
    createdAt: '2025-03-15T16:00:00',
    resolvedAt: '2025-03-16T10:00:00'
  }
];

// ==================== VIEWING SCHEDULES ====================
export const mockSchedules: ViewingSchedule[] = [
  {
    id: 'schedule-1',
    roomId: 'room-3',
    tenantId: 'user-1',
    landlordId: 'user-2',
    dateTime: '2025-03-25T14:00:00',
    status: 'confirmed',
    notes: 'Xem phòng căn hộ mini Quận 3'
  }
];

// ==================== ROOMMATE POSTS ====================
export const mockRoommatePosts: RoommatePost[] = [
  {
    id: 'roommate-1',
    userId: 'user-1',
    userName: 'Nguyễn Văn A',
    userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user1',
    title: 'Tìm bạn ở ghép Quận 1 - Sinh viên',
    description: 'Mình đang tìm 1 bạn nam ở ghép phòng 30m2 tại Quận 1. Giá chia đôi 2,750,000đ/tháng. Yêu cầu: sạch sẽ, không hút thuốc, không rượu bia.',
    budget: 2750000,
    preferredArea: 'Quận 1',
    habits: ['Không hút thuốc', 'Ngăn nắp', 'Dậy sớm'],
    createdAt: '2025-03-20'
  },
  {
    id: 'roommate-2',
    userId: 'user-5',
    userName: 'Phạm Thị D',
    userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user5',
    title: 'Tìm bạn nữ ở ghép Quận 3',
    description: 'Mình cần tìm 1 bạn nữ ở ghép căn hộ mini. Phòng đẹp, full nội thất. Ưu tiên người đi làm, sống gọn gàng.',
    budget: 3500000,
    preferredArea: 'Quận 3',
    habits: ['Không thú cưng', 'Yên tĩnh buổi tối', 'Ngăn nắp'],
    createdAt: '2025-03-18'
  }
];

// ==================== AMENITY LABELS ====================
export const amenityLabels: Record<string, { label: string; icon: string }> = {
  wifi: { label: 'WiFi', icon: 'Wifi' },
  ac: { label: 'Máy lạnh', icon: 'Snowflake' },
  parking: { label: 'Chỗ để xe', icon: 'Car' },
  furniture: { label: 'Nội thất', icon: 'Sofa' },
  washing_machine: { label: 'Máy giặt', icon: 'WashingMachine' },
  fridge: { label: 'Tủ lạnh', icon: 'Refrigerator' },
  balcony: { label: 'Ban công', icon: 'Sun' },
  pool: { label: 'Hồ bơi', icon: 'Waves' },
  gym: { label: 'Phòng gym', icon: 'Dumbbell' },
  elevator: { label: 'Thang máy', icon: 'ArrowUpDown' },
  security: { label: 'An ninh 24/7', icon: 'Shield' },
  garden: { label: 'Sân vườn', icon: 'Trees' },
  garage: { label: 'Garage ô tô', icon: 'Warehouse' }
};

// ==================== CITIES & DISTRICTS ====================
export const locationData = {
  'Hồ Chí Minh': [
    'Quận 1', 'Quận 3', 'Quận 4', 'Quận 5', 'Quận 6', 'Quận 7', 'Quận 8',
    'Quận 10', 'Quận 11', 'Quận 12', 'Quận Bình Thạnh', 'Quận Gò Vấp',
    'Quận Phú Nhuận', 'Quận Tân Bình', 'Quận Tân Phú', 'Quận Bình Tân',
    'TP. Thủ Đức', 'Huyện Bình Chánh', 'Huyện Hóc Môn', 'Huyện Củ Chi',
    'Huyện Nhà Bè', 'Huyện Cần Giờ'
  ],
  'Hà Nội': [
    'Quận Ba Đình', 'Quận Hoàn Kiếm', 'Quận Đống Đa', 'Quận Hai Bà Trưng',
    'Quận Thanh Xuân', 'Quận Cầu Giấy', 'Quận Hoàng Mai', 'Quận Long Biên',
    'Quận Nam Từ Liêm', 'Quận Bắc Từ Liêm', 'Quận Tây Hồ', 'Quận Hà Đông'
  ],
  'Đà Nẵng': [
    'Quận Hải Châu', 'Quận Thanh Khê', 'Quận Sơn Trà', 'Quận Ngũ Hành Sơn',
    'Quận Liên Chiểu', 'Quận Cẩm Lệ', 'Huyện Hòa Vang'
  ]
};

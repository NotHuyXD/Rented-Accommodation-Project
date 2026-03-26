// ==================== USER & AUTH ====================
export type UserRole = 'tenant' | 'landlord' | 'admin';

export interface User {
  id: string;
  email: string;
  phone: string;
  fullName: string;
  avatar: string;
  role: UserRole;
  cccd?: string;
  bio?: string;
  isVerified: boolean;
  isEKYC: boolean;
  createdAt: string;
  privacySettings?: {
    showPhone: boolean;
    showEmail: boolean;
  };
}

// ==================== ROOM & PROPERTY ====================
export type RoomStatus = 'available' | 'deposited' | 'rented' | 'maintenance';

export interface RoomAmenity {
  id: string;
  name: string;
  icon: string;
}

export interface Room {
  id: string;
  title: string;
  price: number;
  area: number;
  maxOccupants: number;
  address: string;
  district: string;
  city: string;
  ward: string;
  lat: number;
  lng: number;
  images: string[];
  video?: string;
  description: string;
  amenities: string[];
  status: RoomStatus;
  landlordId: string;
  landlordName: string;
  landlordAvatar: string;
  landlordPhone: string;
  buildingId?: string;
  isPinned: boolean;
  isBoosted: boolean;
  rating: number;
  reviewCount: number;
  views: number;
  createdAt: string;
  updatedAt: string;
  hasWifi: boolean;
  hasAC: boolean;
  hasParking: boolean;
  hasFurniture: boolean;
  allowPets: boolean;
}

export interface Building {
  id: string;
  name: string;
  address: string;
  landlordId: string;
  roomIds: string[];
}

// ==================== BOOKING ====================
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface Booking {
  id: string;
  roomId: string;
  tenantId: string;
  landlordId: string;
  startDate: string;
  endDate?: string;
  status: BookingStatus;
  depositAmount: number;
  monthlyRent: number;
  createdAt: string;
}

// ==================== CONTRACT ====================
export type ContractStatus = 'draft' | 'active' | 'expired' | 'cancelled';

export interface Contract {
  id: string;
  bookingId: string;
  roomId: string;
  tenantId: string;
  landlordId: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  deposit: number;
  terms: string;
  status: ContractStatus;
  signedByTenant: boolean;
  signedByLandlord: boolean;
  createdAt: string;
}

// ==================== PAYMENT ====================
export type PaymentMethod = 'vnpay' | 'momo' | 'zalopay' | 'vietqr' | 'bank_transfer';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type PaymentType = 'rent' | 'electricity' | 'water' | 'service' | 'deposit';

export interface Payment {
  id: string;
  bookingId: string;
  tenantId: string;
  landlordId: string;
  amount: number;
  type: PaymentType;
  method: PaymentMethod;
  status: PaymentStatus;
  month: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  bookingId: string;
  tenantId: string;
  month: string;
  rent: number;
  electricity: number;
  water: number;
  service: number;
  total: number;
  status: PaymentStatus;
  createdAt: string;
}

export interface UtilityReading {
  id: string;
  roomId: string;
  month: string;
  electricityOld: number;
  electricityNew: number;
  waterOld: number;
  waterNew: number;
  electricityPrice: number;
  waterPrice: number;
}

// ==================== REVIEW ====================
export interface Review {
  id: string;
  roomId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  rating: number;
  comment: string;
  createdAt: string;
  type: 'room' | 'landlord' | 'tenant';
}

// ==================== CHAT ====================
export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  type: 'text' | 'image' | 'location';
  createdAt: string;
  read: boolean;
}

export interface ChatRoom {
  id: string;
  participants: string[];
  lastMessage?: Message;
  unreadCount: number;
}

// ==================== VIEWING SCHEDULE ====================
export type ScheduleStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface ViewingSchedule {
  id: string;
  roomId: string;
  tenantId: string;
  landlordId: string;
  dateTime: string;
  status: ScheduleStatus;
  notes?: string;
}

// ==================== TICKET ====================
export type TicketStatus = 'open' | 'in_progress' | 'fixing' | 'resolved';
export type TicketCategory = 'electrical' | 'plumbing' | 'equipment' | 'other';

export interface Ticket {
  id: string;
  roomId: string;
  tenantId: string;
  category: TicketCategory;
  title: string;
  description: string;
  images?: string[];
  status: TicketStatus;
  createdAt: string;
  resolvedAt?: string;
}

// ==================== REPORT ====================
export type ReportType = 'scam' | 'user' | 'content';

export interface Report {
  id: string;
  reporterId: string;
  targetId: string;
  type: ReportType;
  reason: string;
  description: string;
  status: 'pending' | 'reviewed' | 'resolved';
  createdAt: string;
}

// ==================== ROOMMATE ====================
export interface RoommatePost {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  title: string;
  description: string;
  budget: number;
  preferredArea: string;
  habits: string[];
  createdAt: string;
}

// ==================== NOTIFICATION ====================
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'booking' | 'payment' | 'contract' | 'chat' | 'system' | 'schedule';
  read: boolean;
  createdAt: string;
  link?: string;
}

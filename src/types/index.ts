// ============================================================
// TypeScript Types - v2.0 Schema
// ============================================================

// ==================== USER & AUTH ====================
export type UserRole = 'tenant' | 'landlord' | 'admin';
export type KycStatus = 'none' | 'pending' | 'approved' | 'rejected';

export interface User {
  id: string;
  email: string;
  phone: string;
  fullName: string;
  avatar: string | null;
  role: UserRole;
  isVerified: boolean;
  kycStatus: KycStatus;
  createdAt: string;
}

// ==================== LOCATION ====================
export interface Province {
  id: string;
  name: string;
  code: string;
}

export interface District {
  id: string;
  name: string;
  code: string | null;
}

export interface Ward {
  id: string;
  name: string;
  code: string | null;
}

// ==================== ROOM TYPE ====================
export interface RoomType {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  description: string | null;
}

// ==================== AMENITY ====================
export interface Amenity {
  id: string;
  name: string;
  icon: string | null;
}

// ==================== ROOM ====================
export type RoomStatus = 'available' | 'rented' | 'maintenance' | 'hidden';

export interface RoomPrice {
  id: string;
  label: string;
  price: number;
  unit: string;
  isMetered: boolean;
  meterType: 'electric' | 'water' | 'gas' | null;
}

export interface Room {
  id: string;
  title: string;
  slug: string;
  description: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  area: number;
  price: number;
  deposit: number;
  maxOccupants: number;
  availableFrom: string | null;
  allowPet: boolean;
  allowCooking: boolean;
  liveWithOwner: boolean;
  curfewTime: string | null;
  extraRules: string | null;
  status: RoomStatus;
  createdAt: string;
  updatedAt: string;
  // Relations
  roomType: { name: string; slug: string };
  ward: string;
  district: string;
  province: string;
  landlord: {
    id: string;
    fullName: string;
    avatar: string | null;
    phone: string;
    email: string;
    isVerified: boolean;
  };
  images: Array<{ id: string; url: string; is_cover: number; sort_order: number }>;
  amenities: Amenity[];
  prices: RoomPrice[];
  reviews: Review[];
  avgRating: number;
  reviewCount: number;
}

// Room list item (lighter)
export interface RoomListItem {
  id: string;
  title: string;
  slug: string;
  price: number;
  deposit: number;
  area: number;
  max_occupants: number;
  address: string;
  latitude: number | null;
  longitude: number | null;
  allow_pet: boolean;
  allow_cooking: boolean;
  live_with_owner: boolean;
  available_from: string | null;
  status: RoomStatus;
  created_at: string;
  room_type_name: string;
  room_type_slug: string;
  landlord_id: string;
  landlord_name: string;
  landlord_avatar: string | null;
  landlord_phone: string;
  landlord_verified: boolean;
  ward_name: string;
  district_name: string;
  province_name: string;
  cover_image: string | null;
  images: string[];
  amenities: Amenity[];
  avgRating: number;
  reviewCount: number;
}

// ==================== RENTAL REQUEST ====================
export type RentalRequestStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled';

export interface RentalRequest {
  id: string;
  room_id: string;
  tenant_id: string;
  message: string | null;
  move_in_date: string;
  num_people: number;
  status: RentalRequestStatus;
  contract_id: string | null;
  created_at: string;
  room_title: string;
  room_address: string;
  room_price: number;
  room_image: string | null;
  tenant_name: string;
  tenant_avatar: string | null;
  tenant_phone: string;
  landlord_name: string;
}

// ==================== CONTRACT ====================
export type ContractStatus = 'pending_sign' | 'active' | 'expired' | 'terminated';

export interface Contract {
  id: string;
  room_id: string;
  tenant_id: string;
  landlord_id: string;
  request_id: string | null;
  start_date: string;
  end_date: string;
  monthly_rent: number;
  deposit_amount: number;
  terms: string | null;
  status: ContractStatus;
  signed_at: string | null;
  created_at: string;
  room_title: string;
  room_address: string;
  room_image: string | null;
  tenant_name: string;
  tenant_phone: string;
  landlord_name: string;
  landlord_phone: string;
}

// ==================== INVOICE ====================
export type InvoiceStatus = 'unpaid' | 'paid' | 'overdue' | 'disputed';

export interface Invoice {
  id: string;
  contract_id: string;
  period_month: string;
  base_rent: number;
  electric_usage: number;
  water_usage: number;
  electric_fee: number;
  water_fee: number;
  other_fees: number;
  total: number;
  due_date: string;
  status: InvoiceStatus;
  paid_at: string | null;
  created_at: string;
  room_title: string;
  room_address: string;
  tenant_name: string;
  landlord_name: string;
}

// ==================== PAYMENT ====================
export type PaymentMethod = 'cash' | 'bank_transfer' | 'momo' | 'vnpay' | 'zalopay';
export type PaymentStatus = 'pending' | 'success' | 'failed';

export interface Payment {
  id: string;
  invoice_id: string;
  tenant_id: string;
  amount: number;
  method: PaymentMethod;
  transaction_id: string | null;
  status: PaymentStatus;
  paid_at: string;
  period_month: string;
  room_title: string;
}

// ==================== REVIEW ====================
export interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  tenant_name: string;
  tenant_avatar: string | null;
}

// ==================== BOOKMARK ====================
export interface Bookmark {
  id: string;
  room_id: string;
  title: string;
  price: number;
  area: number;
  address: string;
  status: RoomStatus;
  room_type_name: string;
  ward_name: string;
  district_name: string;
  province_name: string;
  cover_image: string | null;
  created_at: string;
}

// ==================== CHAT ====================
export interface Conversation {
  id: string;
  room_id: string | null;
  tenant_id: string;
  tenant_name: string;
  tenant_avatar: string | null;
  landlord_id: string;
  landlord_name: string;
  landlord_avatar: string | null;
  room_title: string | null;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
}

export interface Message {
  id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender_name: string;
  sender_avatar: string | null;
}

// ==================== NOTIFICATION ====================
export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  is_read: boolean;
  ref_id: string | null;
  created_at: string;
}

// ==================== REPORT ====================
export type ReportTargetType = 'room' | 'user' | 'review';

export interface Report {
  id: string;
  reporter_id: string;
  target_type: ReportTargetType;
  target_id: string;
  reason: string;
  description: string | null;
  status: 'pending' | 'resolved' | 'dismissed';
  created_at: string;
  reporter_name: string;
}

// ==================== UTILITY READING ====================
export interface UtilityReading {
  id: string;
  contract_id: string;
  period_month: string;
  electric_prev: number;
  electric_curr: number;
  water_prev: number;
  water_curr: number;
  reading_images: string[] | null;
  recorded_by_name: string;
  recorded_at: string;
}

// ==================== PAGINATION ====================
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext?: boolean;
  hasPrev?: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}

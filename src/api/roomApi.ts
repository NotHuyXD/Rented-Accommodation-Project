import axiosClient from './axiosClient';
import type { Room } from '../types';

export interface RoomSearchParams {
  page?: number;
  limit?: number;
  search?: string;
  roomType?: string;
  listingType?: string;
  priceMin?: number;
  priceMax?: number;
  areaMin?: number;
  areaMax?: number;
  provinceId?: number;
  districtId?: number;
  wardId?: number;
  numBedrooms?: number;
  numBathrooms?: number;
  maxOccupants?: number;
  furnitureLevel?: string;
  genderPreference?: string;
  amenities?: string;
  sortBy?: 'newest' | 'price_asc' | 'price_desc' | 'rating' | 'popular';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface CreateRoomData {
  title: string;
  description: string;
  roomType?: string;
  listingType?: string;
  price: number;
  deposit?: number;
  electricityPrice?: number;
  waterPrice?: number;
  internetPrice?: number;
  parkingPrice?: number;
  serviceFee?: number;
  area?: number;
  floor?: number;
  numBedrooms?: number;
  numBathrooms?: number;
  maxOccupants?: number;
  furnitureLevel?: string;
  genderPreference?: string;
  address: string;
  wardId?: number;
  districtId?: number;
  provinceId?: number;
  fullAddress?: string;
  latitude?: number;
  longitude?: number;
  availableFrom?: string;
  minStayMonths?: number;
  buildingId?: string;
  amenityIds?: string[];
  images?: Array<{ url: string; caption?: string }>;
}

export const roomApi = {
  // Search/list rooms with filters
  getAll(params: RoomSearchParams): Promise<PaginatedResponse<any>> {
    return axiosClient.get('/rooms', { params });
  },

  // Get room details by ID
  getById(id: string): Promise<{ data: any }> {
    return axiosClient.get(`/rooms/detail/${id}`);
  },

  // Get my rooms (landlord)
  getMyRooms(params?: { page?: number; limit?: number; status?: string }): Promise<PaginatedResponse<any>> {
    return axiosClient.get('/rooms/my-rooms', { params });
  },

  // Create a new room (landlord)
  create(data: CreateRoomData): Promise<{ message: string; data: { id: string; slug: string } }> {
    return axiosClient.post('/rooms', data);
  },

  // Update a room
  update(id: string, data: Partial<CreateRoomData>): Promise<{ message: string }> {
    return axiosClient.put(`/rooms/${id}`, data);
  },

  // Delete a room
  remove(id: string): Promise<{ message: string }> {
    return axiosClient.delete(`/rooms/${id}`);
  },

  // Admin: update room status
  updateStatus(id: string, status: string, rejectionReason?: string): Promise<{ message: string }> {
    return axiosClient.patch(`/rooms/${id}/status`, { status, rejectionReason });
  },
};

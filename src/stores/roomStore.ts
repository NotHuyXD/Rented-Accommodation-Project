// ============================================================
// Room Store - v2.0
// ============================================================
import { create } from 'zustand';
import type { RoomListItem, Room, RoomType, Amenity, Pagination, Province, District, Ward } from '../types';
import { roomApi, amenityApi, locationApi } from '../api/services';

interface RoomFilters {
  search?: string;
  roomTypeId?: string;
  priceMin?: number;
  priceMax?: number;
  areaMin?: number;
  areaMax?: number;
  provinceId?: string;
  districtId?: string;
  wardId?: string;
  maxOccupants?: number;
  allowPet?: string;
  allowCooking?: string;
  amenities?: string;
  sortBy?: string;
}

interface RoomState {
  rooms: RoomListItem[];
  currentRoom: Room | null;
  myRooms: RoomListItem[];
  pagination: Pagination | null;
  filters: RoomFilters;
  isLoading: boolean;
  error: string | null;

  // Lookup data
  roomTypes: RoomType[];
  amenities: Amenity[];
  provinces: Province[];
  districts: District[];
  wards: Ward[];

  // Actions
  fetchRooms: (params?: Record<string, unknown>) => Promise<void>;
  fetchRoomById: (id: string) => Promise<void>;
  fetchMyRooms: (params?: Record<string, unknown>) => Promise<void>;
  setFilters: (filters: Partial<RoomFilters>) => void;
  clearFilters: () => void;

  // Lookup data actions
  fetchRoomTypes: () => Promise<void>;
  fetchAmenities: () => Promise<void>;
  fetchProvinces: () => Promise<void>;
  fetchDistricts: (provinceId: string) => Promise<void>;
  fetchWards: (districtId: string) => Promise<void>;
}

export const useRoomStore = create<RoomState>((set, get) => ({
  rooms: [],
  currentRoom: null,
  myRooms: [],
  pagination: null,
  filters: {},
  isLoading: false,
  error: null,
  roomTypes: [],
  amenities: [],
  provinces: [],
  districts: [],
  wards: [],

  fetchRooms: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const allParams = { ...get().filters, ...params };
      const res: any = await roomApi.list(allParams);
      set({ rooms: res.data, pagination: res.pagination, isLoading: false });
    } catch (err: any) {
      set({ isLoading: false, error: err.response?.data?.message || 'Lỗi tải danh sách phòng' });
    }
  },

  fetchRoomById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const res: any = await roomApi.getById(id);
      set({ currentRoom: res.data, isLoading: false });
    } catch (err: any) {
      set({ isLoading: false, error: err.response?.data?.message || 'Lỗi tải thông tin phòng' });
    }
  },

  fetchMyRooms: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const res: any = await roomApi.getMyRooms(params);
      set({ myRooms: res.data, pagination: res.pagination, isLoading: false });
    } catch (err: any) {
      set({ isLoading: false, error: err.response?.data?.message || 'Lỗi tải danh sách phòng' });
    }
  },

  setFilters: (filters) => {
    set({ filters: { ...get().filters, ...filters } });
  },

  clearFilters: () => set({ filters: {} }),

  fetchRoomTypes: async () => {
    try {
      const res: any = await amenityApi.listRoomTypes();
      set({ roomTypes: res.data });
    } catch { /* ignore */ }
  },

  fetchAmenities: async () => {
    try {
      const res: any = await amenityApi.list();
      set({ amenities: res.data });
    } catch { /* ignore */ }
  },

  fetchProvinces: async () => {
    try {
      const res: any = await locationApi.getProvinces();
      set({ provinces: res.data });
    } catch { /* ignore */ }
  },

  fetchDistricts: async (provinceId) => {
    try {
      const res: any = await locationApi.getDistricts(provinceId);
      set({ districts: res.data, wards: [] });
    } catch { /* ignore */ }
  },

  fetchWards: async (districtId) => {
    try {
      const res: any = await locationApi.getWards(districtId);
      set({ wards: res.data });
    } catch { /* ignore */ }
  },
}));

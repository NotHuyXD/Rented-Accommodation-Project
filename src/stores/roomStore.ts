import { create } from 'zustand';
import type { Room } from '../types';
import { roomApi } from '../api/roomApi';
import { favoriteApi } from '../api/services';

interface RoomFilters {
  city: string;
  district: string;
  minPrice: number;
  maxPrice: number;
  minArea: number;
  maxArea: number;
  maxOccupants: number;
  hasWifi: boolean;
  hasAC: boolean;
  hasParking: boolean;
  hasFurniture: boolean;
  allowPets: boolean;
  searchQuery: string;
}

type SortOption = 'price_asc' | 'price_desc' | 'newest' | 'rating';

interface RoomState {
  rooms: Room[];
  filteredRooms: Room[];
  currentRoom: any | null;
  favorites: string[];
  compareList: string[];
  filters: RoomFilters;
  sortBy: SortOption;
  viewMode: 'grid' | 'list' | 'map';
  isLoading: boolean;
  pagination: { page: number; total: number; totalPages: number };
  setFilters: (filters: Partial<RoomFilters>) => void;
  resetFilters: () => void;
  setSortBy: (sort: SortOption) => void;
  setViewMode: (mode: 'grid' | 'list' | 'map') => void;
  toggleFavorite: (roomId: string) => void;
  addToCompare: (roomId: string) => void;
  removeFromCompare: (roomId: string) => void;
  clearCompare: () => void;
  applyFilters: () => void;
  fetchRooms: (params?: any) => Promise<void>;
  fetchRoomById: (id: string) => Promise<any>;
  addRoom: (room: any) => Promise<void>;
  updateRoom: (id: string, data: any) => Promise<void>;
  deleteRoom: (id: string) => Promise<void>;
  fetchFavorites: () => Promise<void>;
}

const defaultFilters: RoomFilters = {
  city: '',
  district: '',
  minPrice: 0,
  maxPrice: 50000000,
  minArea: 0,
  maxArea: 200,
  maxOccupants: 0,
  hasWifi: false,
  hasAC: false,
  hasParking: false,
  hasFurniture: false,
  allowPets: false,
  searchQuery: ''
};

export const useRoomStore = create<RoomState>((set, get) => ({
  rooms: [],
  filteredRooms: [],
  currentRoom: null,
  favorites: JSON.parse(localStorage.getItem('favorites') || '[]'),
  compareList: [],
  filters: { ...defaultFilters },
  sortBy: 'newest',
  viewMode: 'grid',
  isLoading: false,
  pagination: { page: 1, total: 0, totalPages: 0 },

  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters }
    }));
    get().applyFilters();
  },

  resetFilters: () => {
    set({ filters: { ...defaultFilters } });
    get().applyFilters();
  },

  setSortBy: (sort) => {
    set({ sortBy: sort });
    get().applyFilters();
  },

  setViewMode: (mode) => set({ viewMode: mode }),

  toggleFavorite: async (roomId) => {
    try {
      const res: any = await favoriteApi.toggle(roomId);
      set((state) => {
        const newFavorites = res?.favorited
          ? [...state.favorites, roomId]
          : state.favorites.filter(id => id !== roomId);
        localStorage.setItem('favorites', JSON.stringify(newFavorites));
        return { favorites: newFavorites };
      });
    } catch (error) {
      // Fallback to local-only toggle if not authenticated
      set((state) => {
        const newFavorites = state.favorites.includes(roomId)
          ? state.favorites.filter(id => id !== roomId)
          : [...state.favorites, roomId];
        localStorage.setItem('favorites', JSON.stringify(newFavorites));
        return { favorites: newFavorites };
      });
    }
  },

  addToCompare: (roomId) => {
    set((state) => {
      if (state.compareList.length >= 3) return state;
      if (state.compareList.includes(roomId)) return state;
      return { compareList: [...state.compareList, roomId] };
    });
  },

  removeFromCompare: (roomId) => {
    set((state) => ({
      compareList: state.compareList.filter(id => id !== roomId)
    }));
  },

  clearCompare: () => set({ compareList: [] }),

  applyFilters: () => {
    const { rooms, filters, sortBy } = get();
    let result = [...rooms];

    // Apply text search
    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      result = result.filter(r =>
        (r.title || '').toLowerCase().includes(q) ||
        (r.address || '').toLowerCase().includes(q) ||
        ((r as any).district || (r as any).full_address || '').toLowerCase().includes(q) ||
        (r.description || '').toLowerCase().includes(q)
      );
    }

    // Apply location filters
    if (filters.city) result = result.filter(r => ((r as any).city || (r as any).province_name || '') === filters.city);
    if (filters.district) result = result.filter(r => ((r as any).district || (r as any).district_name || '') === filters.district);

    // Apply price filter
    result = result.filter(r => r.price >= filters.minPrice && r.price <= filters.maxPrice);

    // Apply area filter
    if (filters.minArea > 0 || filters.maxArea < 200) {
      result = result.filter(r => (r.area || 0) >= filters.minArea && (r.area || 0) <= filters.maxArea);
    }

    // Apply occupants filter
    if (filters.maxOccupants > 0) {
      result = result.filter(r => ((r as any).maxOccupants || (r as any).max_occupants || 0) >= filters.maxOccupants);
    }

    // Apply sorting - pinned/VIP items always first
    result.sort((a, b) => {
      const aVip = a.isPinned || (a as any).is_vip;
      const bVip = b.isPinned || (b as any).is_vip;
      if (aVip && !bVip) return -1;
      if (!aVip && bVip) return 1;

      switch (sortBy) {
        case 'price_asc': return a.price - b.price;
        case 'price_desc': return b.price - a.price;
        case 'newest': return new Date(b.createdAt || (b as any).created_at || 0).getTime() - new Date(a.createdAt || (a as any).created_at || 0).getTime();
        case 'rating': return ((b as any).rating || (b as any).avg_rating || 0) - ((a as any).rating || (a as any).avg_rating || 0);
        default: return 0;
      }
    });

    set({ filteredRooms: result });
  },

  fetchRooms: async (params?: any) => {
    set({ isLoading: true });
    try {
      const response: any = await roomApi.getAll({ sortBy: get().sortBy, ...params });
      if (response && response.data) {
        // Normalize snake_case to camelCase
        const normalizedRooms = response.data.map((r: any) => ({
          ...r,
          maxOccupants: r.max_occupants || r.maxOccupants || 0,
          createdAt: r.created_at || r.published_at || r.createdAt || new Date().toISOString(),
          updatedAt: r.updated_at || r.updatedAt,
          isPinned: r.is_vip || r.isPinned || false,
          hasWifi: r.has_wifi !== undefined ? r.has_wifi : (r.hasWifi || false),
          hasAC: r.has_ac !== undefined ? r.has_ac : (r.hasAC || false),
          hasParking: r.has_parking !== undefined ? r.has_parking : (r.hasParking || false),
          allowPets: r.allow_pets !== undefined ? r.allow_pets : (r.allowPets || false),
          rating: r.avg_rating || r.rating || 0,
          reviewCount: r.total_reviews || r.reviewCount || 0,
          views: r.view_count || r.views || 0,
          district: r.district_name || r.district || '',
          city: r.province_name || r.city || '',
          ward: r.ward_name || r.ward || '',
          images: Array.isArray(r.images) && r.images.length > 0 ? r.images : ['https://via.placeholder.com/600x400?text=No+Image']
        }));
        
        set({
          rooms: normalizedRooms,
          pagination: response.pagination || { page: 1, total: normalizedRooms.length, totalPages: 1 },
          isLoading: false
        });
        get().applyFilters();
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Lỗi khi tải danh sách phòng', error);
      set({ isLoading: false });
    }
  },

  fetchRoomById: async (id: string) => {
    set({ isLoading: true });
    try {
      const response: any = await roomApi.getById(id);
      if (response && response.data) {
        set({ currentRoom: response.data, isLoading: false });
        return response.data;
      }
      set({ isLoading: false });
      return null;
    } catch (error) {
      console.error('Lỗi khi tải chi tiết phòng', error);
      set({ isLoading: false });
      return null;
    }
  },

  addRoom: async (room) => {
    try {
      const response: any = await roomApi.create(room);
      if (response) {
        // Refetch rooms from server
        get().fetchRooms();
      }
    } catch (error) {
      console.error('Lỗi đăng phòng mới', error);
    }
  },

  updateRoom: async (id, data) => {
    try {
      await roomApi.update(id, data);
      // Refetch rooms from server
      get().fetchRooms();
    } catch (error) {
      console.error('Lỗi cập nhật phòng', error);
    }
  },

  deleteRoom: async (id) => {
    try {
      await roomApi.remove(id);
      set((state) => ({
        rooms: state.rooms.filter(r => r.id !== id)
      }));
      get().applyFilters();
    } catch (error) {
      console.error('Lỗi xóa phòng', error);
    }
  },

  fetchFavorites: async () => {
    try {
      const res: any = await favoriteApi.getAll({});
      if (res && res.data) {
        const favIds = res.data.map((f: any) => f.room_id || f.roomId);
        set({ favorites: favIds });
        localStorage.setItem('favorites', JSON.stringify(favIds));
      }
    } catch {
      // Keep local favorites
    }
  },
}));

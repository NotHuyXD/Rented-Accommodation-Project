import { create } from 'zustand';
import type { Room } from '../types';
import { mockRooms } from '../data/mockData';
import { roomApi } from '../api/roomApi';

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
  favorites: string[];
  compareList: string[];
  filters: RoomFilters;
  sortBy: SortOption;
  viewMode: 'grid' | 'list' | 'map';
  isLoading: boolean;
  setFilters: (filters: Partial<RoomFilters>) => void;
  resetFilters: () => void;
  setSortBy: (sort: SortOption) => void;
  setViewMode: (mode: 'grid' | 'list' | 'map') => void;
  toggleFavorite: (roomId: string) => void;
  addToCompare: (roomId: string) => void;
  removeFromCompare: (roomId: string) => void;
  clearCompare: () => void;
  applyFilters: () => void;
  fetchRooms: () => Promise<void>;
  addRoom: (room: Room) => Promise<void>;
  updateRoom: (id: string, data: Partial<Room>) => Promise<void>;
  deleteRoom: (id: string) => Promise<void>;
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
  rooms: mockRooms, // Giữ mock mặc định để UI không lỗi khi chưa gọi API
  filteredRooms: mockRooms,
  favorites: JSON.parse(localStorage.getItem('favorites') || '[]'),
  compareList: [],
  filters: { ...defaultFilters },
  sortBy: 'newest',
  viewMode: 'grid',
  isLoading: false,

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

  toggleFavorite: (roomId) => {
    set((state) => {
      const newFavorites = state.favorites.includes(roomId)
        ? state.favorites.filter(id => id !== roomId)
        : [...state.favorites, roomId];
      localStorage.setItem('favorites', JSON.stringify(newFavorites));
      return { favorites: newFavorites };
    });
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
        r.title.toLowerCase().includes(q) ||
        r.address.toLowerCase().includes(q) ||
        r.district.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q)
      );
    }

    // Apply location filters
    if (filters.city) result = result.filter(r => r.city === filters.city);
    if (filters.district) result = result.filter(r => r.district === filters.district);

    // Apply price filter
    result = result.filter(r => r.price >= filters.minPrice && r.price <= filters.maxPrice);

    // Apply area filter
    if (filters.minArea > 0 || filters.maxArea < 200) {
      result = result.filter(r => r.area >= filters.minArea && r.area <= filters.maxArea);
    }

    // Apply occupants filter
    if (filters.maxOccupants > 0) {
      result = result.filter(r => r.maxOccupants >= filters.maxOccupants);
    }

    // Apply amenity filters
    if (filters.hasWifi) result = result.filter(r => r.hasWifi);
    if (filters.hasAC) result = result.filter(r => r.hasAC);
    if (filters.hasParking) result = result.filter(r => r.hasParking);
    if (filters.hasFurniture) result = result.filter(r => r.hasFurniture);
    if (filters.allowPets) result = result.filter(r => r.allowPets);

    // Apply sorting - pinned items always first
    result.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;

      switch (sortBy) {
        case 'price_asc': return a.price - b.price;
        case 'price_desc': return b.price - a.price;
        case 'newest': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'rating': return b.rating - a.rating;
        default: return 0;
      }
    });

    set({ filteredRooms: result });
  },

  fetchRooms: async () => {
    set({ isLoading: true });
    try {
      const response: any = await roomApi.getAll({});
      if (response && response.data) {
        set({ rooms: response.data, isLoading: false });
        get().applyFilters();
      }
    } catch (error) {
      console.error('Lỗi khi tải danh sách phòng', error);
      set({ isLoading: false });
    }
  },

  addRoom: async (room) => {
    try {
      const response: any = await roomApi.create(room);
      if (response) {
        set((state) => ({ rooms: [...state.rooms, room] }));
        get().applyFilters();
      }
    } catch (error) {
      console.error('Lỗi đăng phòng mới', error);
    }
  },

  updateRoom: async (id, data) => {
    try {
      await roomApi.update(id, data);
      set((state) => ({
        rooms: state.rooms.map(r => r.id === id ? { ...r, ...data } : r)
      }));
      get().applyFilters();
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
  }
}));

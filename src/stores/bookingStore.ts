import { create } from 'zustand';
import { bookingApi } from '../api/bookingApi';
import { contractApi } from '../api/contractApi';
import { paymentApi } from '../api/paymentApi';
import { mockBookings, mockContracts, mockInvoices } from '../data/mockData';

interface BookingState {
  bookings: any[];
  contracts: any[];
  invoices: any[];
  isLoading: boolean;
  error: string | null;

  fetchMyBookings: () => Promise<void>;
  fetchMyContracts: () => Promise<void>;
  fetchMyInvoices: () => Promise<void>;
  
  createBooking: (data: any) => Promise<boolean>;
  cancelBooking: (id: string, reason: string) => Promise<boolean>;
}

export const useBookingStore = create<BookingState>((set, get) => ({
  bookings: mockBookings,
  contracts: mockContracts,
  invoices: mockInvoices,
  isLoading: false,
  error: null,

  fetchMyBookings: async () => {
    set({ isLoading: true, error: null });
    try {
      const res: any = await bookingApi.getAll({ role: 'tenant' });
      if (res && res.data) {
        set({ bookings: res.data, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (error: any) {
      console.error('Fetch bookings error:', error);
      // Keep mock data if API fails to show demo UI
      set({ isLoading: false });
    }
  },

  fetchMyContracts: async () => {
    set({ isLoading: true, error: null });
    try {
      const res: any = await contractApi.getAll({ role: 'tenant' });
      if (res && res.data) {
        set({ contracts: res.data, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (error: any) {
      console.error('Fetch contracts error:', error);
      set({ isLoading: false });
    }
  },

  fetchMyInvoices: async () => {
    set({ isLoading: true, error: null });
    try {
      const res: any = await paymentApi.getInvoices({ role: 'tenant' });
      if (res && res.data) {
        set({ invoices: res.data, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (error: any) {
      console.error('Fetch invoices error:', error);
      set({ isLoading: false });
    }
  },

  createBooking: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const res: any = await bookingApi.create(data);
      if (res && res.data) {
        set((state) => ({ bookings: [res.data, ...state.bookings], isLoading: false }));
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Create booking error:', error);
      set({ isLoading: false, error: 'Cannot create booking' });
      return false;
    }
  },

  cancelBooking: async (id, reason) => {
    set({ isLoading: true, error: null });
    try {
      await bookingApi.cancel(id, reason);
      set((state) => ({
        bookings: state.bookings.map(b => b.id === id ? { ...b, status: 'cancelled' } : b),
        isLoading: false
      }));
      return true;
    } catch (error: any) {
      console.error('Cancel booking error:', error);
      set({ isLoading: false, error: 'Cannot cancel booking' });
      return false;
    }
  }
}));

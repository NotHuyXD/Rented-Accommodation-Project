import { create } from 'zustand';
import { bookingApi } from '../api/bookingApi';
import { contractApi } from '../api/contractApi';
import { paymentApi } from '../api/paymentApi';

interface BookingState {
  bookings: any[];
  contracts: any[];
  invoices: any[];
  isLoading: boolean;
  error: string | null;

  fetchMyBookings: (role?: string) => Promise<void>;
  fetchMyContracts: (role?: string) => Promise<void>;
  fetchMyInvoices: () => Promise<void>;
  
  createBooking: (data: any) => Promise<boolean>;
  confirmBooking: (id: string, message?: string) => Promise<boolean>;
  rejectBooking: (id: string, reason: string) => Promise<boolean>;
  cancelBooking: (id: string, reason: string) => Promise<boolean>;
  completeBooking: (id: string) => Promise<boolean>;
}

export const useBookingStore = create<BookingState>((set, get) => ({
  bookings: [],
  contracts: [],
  invoices: [],
  isLoading: false,
  error: null,

  fetchMyBookings: async (role?: string) => {
    set({ isLoading: true, error: null });
    try {
      const res: any = await bookingApi.getAll({ role });
      if (res && res.data) {
        set({ bookings: res.data, isLoading: false });
      } else {
        set({ bookings: [], isLoading: false });
      }
    } catch (error: any) {
      console.error('Fetch bookings error:', error);
      set({ bookings: [], isLoading: false });
    }
  },

  fetchMyContracts: async (role?: string) => {
    set({ isLoading: true, error: null });
    try {
      const res: any = await contractApi.getAll({ role });
      if (res && res.data) {
        set({ contracts: res.data, isLoading: false });
      } else {
        set({ contracts: [], isLoading: false });
      }
    } catch (error: any) {
      console.error('Fetch contracts error:', error);
      set({ contracts: [], isLoading: false });
    }
  },

  fetchMyInvoices: async () => {
    set({ isLoading: true, error: null });
    try {
      const res: any = await paymentApi.getInvoices({});
      if (res && res.data) {
        set({ invoices: res.data, isLoading: false });
      } else {
        set({ invoices: [], isLoading: false });
      }
    } catch (error: any) {
      console.error('Fetch invoices error:', error);
      set({ invoices: [], isLoading: false });
    }
  },

  createBooking: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const res: any = await bookingApi.create(data);
      if (res && res.data) {
        // Refetch bookings
        get().fetchMyBookings();
        return true;
      }
      set({ isLoading: false });
      return false;
    } catch (error: any) {
      console.error('Create booking error:', error);
      set({ isLoading: false, error: 'Cannot create booking' });
      return false;
    }
  },

  confirmBooking: async (id, message) => {
    try {
      await bookingApi.confirm(id, message);
      set((state) => ({
        bookings: state.bookings.map(b => b.id === id ? { ...b, status: 'confirmed' } : b)
      }));
      return true;
    } catch (error) {
      console.error('Confirm booking error:', error);
      return false;
    }
  },

  rejectBooking: async (id, reason) => {
    try {
      await bookingApi.reject(id, reason);
      set((state) => ({
        bookings: state.bookings.map(b => b.id === id ? { ...b, status: 'rejected' } : b)
      }));
      return true;
    } catch (error) {
      console.error('Reject booking error:', error);
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
  },

  completeBooking: async (id) => {
    try {
      await bookingApi.complete(id);
      set((state) => ({
        bookings: state.bookings.map(b => b.id === id ? { ...b, status: 'completed' } : b)
      }));
      return true;
    } catch (error) {
      console.error('Complete booking error:', error);
      return false;
    }
  },
}));

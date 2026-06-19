// ============================================================
// App Store - General app state (bookmarks, notifications, etc)
// ============================================================
import { create } from 'zustand';
import type { Bookmark, Notification, Conversation, RentalRequest, Contract, Invoice } from '../types';
import { bookmarkApi, notificationApi, chatApi, rentalRequestApi, contractApi, invoiceApi } from '../api/services';

interface AppState {
  // Bookmarks
  bookmarks: Bookmark[];
  bookmarkedRoomIds: Set<string>;
  fetchBookmarks: () => Promise<void>;
  toggleBookmark: (roomId: string) => Promise<void>;
  isBookmarked: (roomId: string) => boolean;

  // Notifications
  notifications: Notification[];
  unreadCount: number;
  fetchNotifications: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;

  // Chat
  conversations: Conversation[];
  fetchConversations: () => Promise<void>;

  // Rental Requests
  rentalRequests: RentalRequest[];
  fetchRentalRequests: (params?: Record<string, unknown>) => Promise<void>;

  // Contracts
  contracts: Contract[];
  fetchContracts: (params?: Record<string, unknown>) => Promise<void>;

  // Invoices
  invoices: Invoice[];
  fetchInvoices: (params?: Record<string, unknown>) => Promise<void>;

  isLoading: boolean;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Bookmarks
  bookmarks: [],
  bookmarkedRoomIds: new Set(),
  fetchBookmarks: async () => {
    try {
      const res: any = await bookmarkApi.list();
      const bookmarks = res.data || [];
      const ids = new Set<string>(bookmarks.map((b: Bookmark) => b.room_id));
      set({ bookmarks, bookmarkedRoomIds: ids });
    } catch { /* ignore */ }
  },
  toggleBookmark: async (roomId) => {
    const { bookmarkedRoomIds, bookmarks } = get();
    const updatedIds = new Set(bookmarkedRoomIds);
    const isAdding = !updatedIds.has(roomId);

    // Optimistic update
    if (isAdding) {
      updatedIds.add(roomId);
      set({ bookmarkedRoomIds: updatedIds });
    } else {
      updatedIds.delete(roomId);
      const updatedBookmarks = bookmarks.filter((b) => b.room_id !== roomId);
      set({ bookmarkedRoomIds: updatedIds, bookmarks: updatedBookmarks });
    }

    try {
      if (isAdding) {
        await bookmarkApi.add(roomId);
      } else {
        await bookmarkApi.remove(roomId);
      }
      // Re-sync with server to get authentic data and IDs
      await get().fetchBookmarks();
    } catch (error) {
      // Revert optimistic update on failure
      const revertedIds = new Set(bookmarkedRoomIds);
      if (isAdding) {
        revertedIds.delete(roomId);
        set({ bookmarkedRoomIds: revertedIds });
      } else {
        revertedIds.add(roomId);
        set({ bookmarkedRoomIds: revertedIds, bookmarks });
      }
      console.error('Failed to toggle bookmark:', error);
    }
  },
  isBookmarked: (roomId) => get().bookmarkedRoomIds.has(roomId),

  // Notifications
  notifications: [],
  unreadCount: 0,
  fetchNotifications: async () => {
    try {
      const res: any = await notificationApi.list();
      set({ notifications: res.data || [], unreadCount: res.unreadCount || 0 });
    } catch { /* ignore */ }
  },
  markNotificationRead: async (id) => {
    try {
      await notificationApi.markAsRead(id);
      get().fetchNotifications();
    } catch { /* ignore */ }
  },
  markAllNotificationsRead: async () => {
    try {
      await notificationApi.markAllAsRead();
      set({ unreadCount: 0, notifications: get().notifications.map(n => ({ ...n, is_read: true })) });
    } catch { /* ignore */ }
  },

  // Chat
  conversations: [],
  fetchConversations: async () => {
    try {
      const res: any = await chatApi.listConversations();
      set({ conversations: res.data || [] });
    } catch { /* ignore */ }
  },

  // Rental Requests
  rentalRequests: [],
  fetchRentalRequests: async (params) => {
    set({ isLoading: true });
    try {
      const res: any = await rentalRequestApi.list(params);
      set({ rentalRequests: res.data || [], isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  // Contracts
  contracts: [],
  fetchContracts: async (params) => {
    set({ isLoading: true });
    try {
      const res: any = await contractApi.list(params);
      set({ contracts: res.data || [], isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  // Invoices
  invoices: [],
  fetchInvoices: async (params) => {
    set({ isLoading: true });
    try {
      const res: any = await invoiceApi.list(params);
      set({ invoices: res.data || [], isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  isLoading: false,
}));
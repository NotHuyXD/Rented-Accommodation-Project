import { create } from 'zustand';
import type { User, UserRole } from '../types';
import { authApi } from '../api/authApi';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  loginAsRole: (role: UserRole) => Promise<boolean>;
  register: (data: any) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const response: any = await authApi.login({ email, password });
      if (response && response.data) {
        const { user, token, refreshToken } = response.data;
        set({ user, isAuthenticated: true, isLoading: false });
        localStorage.setItem('currentUser', JSON.stringify(user));
        localStorage.setItem('access_token', token);
        if (refreshToken) localStorage.setItem('refresh_token', refreshToken);
        return true;
      }
      set({ isLoading: false });
      return false;
    } catch (error) {
      console.error('Login failed', error);
      set({ isLoading: false });
      return false;
    }
  },

  // Demo: quick-login with predefined test accounts
  loginAsRole: async (role: UserRole) => {
    const demoAccounts: Record<string, { email: string; password: string }> = {
      tenant: { email: 'nguyenvana@gmail.com', password: 'password123' },
      landlord: { email: 'tranthib@gmail.com', password: 'password123' },
      admin: { email: 'admin@phongtro.vn', password: 'admin123' },
    };
    const account = demoAccounts[role];
    if (!account) return false;

    set({ isLoading: true });
    try {
      const response: any = await authApi.login(account);
      if (response && response.data) {
        const { user, token, refreshToken } = response.data;
        set({ user, isAuthenticated: true, isLoading: false });
        localStorage.setItem('currentUser', JSON.stringify(user));
        localStorage.setItem('access_token', token);
        if (refreshToken) localStorage.setItem('refresh_token', refreshToken);
        return true;
      }
      set({ isLoading: false });
      return false;
    } catch (error) {
      console.error('Demo login failed', error);
      set({ isLoading: false });
      return false;
    }
  },

  register: async (data: any) => {
    set({ isLoading: true });
    try {
      const response: any = await authApi.register(data);
      if (response && response.data) {
        const { user, token, refreshToken } = response.data;
        set({ user, isAuthenticated: true, isLoading: false });
        localStorage.setItem('currentUser', JSON.stringify(user));
        localStorage.setItem('access_token', token);
        if (refreshToken) localStorage.setItem('refresh_token', refreshToken);
        return true;
      }
      set({ isLoading: false });
      return false;
    } catch (error) {
      console.error('Register failed', error);
      set({ isLoading: false });
      return false;
    }
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore server errors on logout
    }
    set({ user: null, isAuthenticated: false });
    localStorage.removeItem('currentUser');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },

  updateProfile: async (data: Partial<User>) => {
    try {
      await authApi.updateProfile(data);
      // Refetch profile from server after update
      const res: any = await authApi.getProfile();
      if (res && res.data) {
        set({ user: res.data });
        localStorage.setItem('currentUser', JSON.stringify(res.data));
      }
    } catch (error) {
      console.error('Update profile failed', error);
    }
  },

  // Restore user session from token on app start
  loadUser: async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    set({ isLoading: true });
    try {
      const res: any = await authApi.getProfile();
      if (res && res.data) {
        set({ user: res.data, isAuthenticated: true, isLoading: false });
        localStorage.setItem('currentUser', JSON.stringify(res.data));
      } else {
        set({ isLoading: false });
      }
    } catch {
      // Token invalid or expired
      localStorage.removeItem('access_token');
      localStorage.removeItem('currentUser');
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));

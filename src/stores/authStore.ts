// ============================================================
// Auth Store - v2.0
// ============================================================
import { create } from 'zustand';
import type { User } from '../types';
import { authApi } from '../api/services';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<boolean>;
  googleLogin: (token: string) => Promise<boolean>;
  register: (data: { email: string; phone: string; password: string; fullName: string; role?: string }) => Promise<boolean>;
  logout: () => void;
  loadProfile: () => Promise<void>;
  updateProfile: (data: Record<string, unknown>) => Promise<boolean>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: (() => {
    try {
      const stored = localStorage.getItem('auth-user');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  })(),
  token: localStorage.getItem('access_token'),
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res: any = await authApi.login({ email, password });
      const { user, token, refreshToken } = res.data;
      localStorage.setItem('access_token', token);
      localStorage.setItem('refresh_token', refreshToken);
      localStorage.setItem('auth-user', JSON.stringify(user));
      set({ user, token, isLoading: false });
      return true;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Đăng nhập thất bại';
      set({ isLoading: false, error: message });
      return false;
    }
  },

  googleLogin: async (googleToken: string) => {
    set({ isLoading: true, error: null });
    try {
      const res: any = await authApi.googleLogin({ token: googleToken });
      const { user, token, refreshToken } = res.data;
      localStorage.setItem('access_token', token);
      localStorage.setItem('refresh_token', refreshToken);
      localStorage.setItem('auth-user', JSON.stringify(user));
      set({ user, token, isLoading: false });
      return true;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Đăng nhập Google thất bại';
      set({ isLoading: false, error: message });
      return false;
    }
  },

  register: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const res: any = await authApi.register(data);
      const { user, token, refreshToken } = res.data;
      localStorage.setItem('access_token', token);
      localStorage.setItem('refresh_token', refreshToken);
      localStorage.setItem('auth-user', JSON.stringify(user));
      set({ user, token, isLoading: false });
      return true;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Đăng ký thất bại';
      set({ isLoading: false, error: message });
      return false;
    }
  },

  logout: () => {
    authApi.logout().catch(() => {});
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('auth-user');
    set({ user: null, token: null });
  },

  loadProfile: async () => {
    try {
      const res: any = await authApi.getProfile();
      const user = res.data;
      localStorage.setItem('auth-user', JSON.stringify(user));
      set({ user });
    } catch {
      // Token might be invalid
    }
  },

  updateProfile: async (data) => {
    set({ isLoading: true, error: null });
    try {
      await authApi.updateProfile(data);
      // Reload profile
      const res: any = await authApi.getProfile();
      const user = res.data;
      localStorage.setItem('auth-user', JSON.stringify(user));
      set({ user, isLoading: false });
      return true;
    } catch (err: any) {
      set({ isLoading: false, error: err.response?.data?.message || 'Cập nhật thất bại' });
      return false;
    }
  },

  clearError: () => set({ error: null }),
}));

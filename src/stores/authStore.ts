import { create } from 'zustand';
import type { User, UserRole } from '../types';
import { authApi } from '../api/authApi';
import { mockUsers } from '../data/mockData';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  loginAsRole: (role: UserRole) => void;
  register: (data: any) => Promise<boolean>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => void;
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
        const { user, token } = response.data;
        set({ user, isAuthenticated: true, isLoading: false });
        localStorage.setItem('currentUser', JSON.stringify(user));
        localStorage.setItem('access_token', token);
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

  loginAsRole: (role: UserRole) => {
    const user = mockUsers.find(u => u.role === role);
    if (user) {
      set({ user, isAuthenticated: true });
      localStorage.setItem('currentUser', JSON.stringify(user));
      localStorage.setItem('access_token', `fake-token-${user.id}`);
    }
  },

  register: async (data: any) => {
    set({ isLoading: true });
    try {
      const response: any = await authApi.register(data);
      if (response && response.data) {
        const { user, token } = response.data;
        set({ user, isAuthenticated: true, isLoading: false });
        localStorage.setItem('currentUser', JSON.stringify(user));
        localStorage.setItem('access_token', token);
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

  logout: () => {
    set({ user: null, isAuthenticated: false });
    localStorage.removeItem('currentUser');
    localStorage.removeItem('access_token');
  },

  updateProfile: (data: Partial<User>) => {
    set((state) => {
      if (!state.user) return state;
      const updatedUser = { ...state.user, ...data };
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      return { user: updatedUser };
    });
  }
}));

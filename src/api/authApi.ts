import axiosClient from './axiosClient';
import type { User } from '../types';

export interface LoginData {
  email?: string;
  phone?: string;
  password: string;
}

export interface RegisterData {
  email?: string;
  phone?: string;
  password: string;
  fullName: string;
  role?: 'tenant' | 'landlord';
}

export interface AuthResponse {
  message: string;
  data: {
    user: User;
    token: string;
    refreshToken: string;
  };
}

export const authApi = {
  login(data: LoginData): Promise<AuthResponse> {
    return axiosClient.post('/auth/login', data);
  },

  register(data: RegisterData): Promise<AuthResponse> {
    return axiosClient.post('/auth/register', data);
  },

  getProfile(): Promise<{ data: User }> {
    return axiosClient.get('/auth/profile');
  },

  updateProfile(data: Partial<User>): Promise<{ message: string }> {
    return axiosClient.put('/auth/profile', data);
  },

  changePassword(data: { currentPassword: string; newPassword: string }): Promise<{ message: string }> {
    return axiosClient.post('/auth/change-password', data);
  },

  logout(): Promise<{ message: string }> {
    return axiosClient.post('/auth/logout');
  },
};

import axiosClient from './axiosClient';
import type { User } from '../types';

export const authApi = {
  // Login Endpoint
  login(data: any) {
    const url = '/auth/login';
    return axiosClient.post(url, data);
  },

  // Register Endpoint
  register(data: any) {
    const url = '/auth/register';
    return axiosClient.post(url, data);
  },

  // Get current user profile
  getProfile() {
    const url = '/auth/profile';
    return axiosClient.get(url);
  },

  // Update profile
  updateProfile(data: Partial<User>) {
    const url = '/auth/profile';
    return axiosClient.put(url, data);
  }
};

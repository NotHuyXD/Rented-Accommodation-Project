import axiosClient from './axiosClient';
import type { Room } from '../types';

export const roomApi = {
  // Get all rooms (with filters)
  getAll(params: any) {
    const url = '/rooms';
    return axiosClient.get(url, { params });
  },

  // Get room details by ID
  getById(id: string) {
    const url = `/rooms/${id}`;
    return axiosClient.get(url);
  },

  // Post a new room (Landlord)
  create(data: any) {
    const url = '/rooms';
    return axiosClient.post(url, data);
  },

  // Update a room
  update(id: string, data: Partial<Room>) {
    const url = `/rooms/${id}`;
    return axiosClient.put(url, data);
  },

  // Delete a room
  remove(id: string) {
    const url = `/rooms/${id}`;
    return axiosClient.delete(url);
  }
};

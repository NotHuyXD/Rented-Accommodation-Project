import axiosClient from './axiosClient';

export const bookingApi = {
  getAll(params?: { page?: number; limit?: number; status?: string; bookingType?: string; role?: string }) {
    return axiosClient.get('/bookings', { params });
  },

  getById(id: string) {
    return axiosClient.get(`/bookings/${id}`);
  },

  create(data: {
    roomId: string;
    bookingType: 'viewing' | 'hold_deposit' | 'rent_request';
    scheduledDate?: string;
    scheduledTimeStart?: string;
    scheduledTimeEnd?: string;
    holdAmount?: number;
    desiredMoveInDate?: string;
    desiredLeaseMonths?: number;
    tenantMessage?: string;
  }) {
    return axiosClient.post('/bookings', data);
  },

  confirm(id: string, landlordMessage?: string) {
    return axiosClient.patch(`/bookings/${id}/confirm`, { landlordMessage });
  },

  reject(id: string, rejectionReason: string) {
    return axiosClient.patch(`/bookings/${id}/reject`, { rejectionReason });
  },

  cancel(id: string, cancellationReason?: string) {
    return axiosClient.patch(`/bookings/${id}/cancel`, { cancellationReason });
  },

  complete(id: string) {
    return axiosClient.patch(`/bookings/${id}/complete`);
  },
};

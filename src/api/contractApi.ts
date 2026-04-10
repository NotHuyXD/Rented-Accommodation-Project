import axiosClient from './axiosClient';

export const contractApi = {
  getAll(params?: { page?: number; limit?: number; status?: string; role?: string }) {
    return axiosClient.get('/contracts', { params });
  },

  getById(id: string) {
    return axiosClient.get(`/contracts/${id}`);
  },

  create(data: {
    roomId: string;
    tenantId: string;
    bookingId?: string;
    templateId?: string;
    startDate: string;
    endDate: string;
    monthlyRent: number;
    depositAmount: number;
    paymentDueDay?: number;
    electricityPrice?: number;
    waterPrice?: number;
    internetPrice?: number;
    parkingPrice?: number;
    serviceFee?: number;
    content?: string;
    rules?: string;
    additionalTerms?: string;
    clauses?: Array<{ title: string; content: string; isRequired?: boolean }>;
  }) {
    return axiosClient.post('/contracts', data);
  },

  sign(id: string, signatureData?: string) {
    return axiosClient.post(`/contracts/${id}/sign`, { signatureData });
  },

  terminate(id: string, data: {
    terminationType: string;
    terminationDate: string;
    reason: string;
    penaltyAmount?: number;
    depositRefundAmount?: number;
  }) {
    return axiosClient.post(`/contracts/${id}/terminate`, data);
  },
};

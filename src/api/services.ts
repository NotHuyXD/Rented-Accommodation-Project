// ============================================================
// API Services - v2.0 Schema
// ============================================================
import axiosClient from './axiosClient';

// ==================== AUTH ====================
export const authApi = {
  register: (data: { email: string; phone: string; password: string; fullName: string; role?: string }) =>
    axiosClient.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    axiosClient.post('/auth/login', data),
  getProfile: () => axiosClient.get('/auth/profile'),
  updateProfile: (data: Record<string, unknown>) => axiosClient.put('/auth/profile', data),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    axiosClient.post('/auth/change-password', data),
  logout: () => axiosClient.post('/auth/logout'),
};

// ==================== ROOMS ====================
export const roomApi = {
  list: (params?: Record<string, unknown>) => axiosClient.get('/rooms', { params }),
  getById: (id: string) => axiosClient.get(`/rooms/${id}`),
  create: (data: Record<string, unknown>) => axiosClient.post('/rooms', data),
  update: (id: string, data: Record<string, unknown>) => axiosClient.put(`/rooms/${id}`, data),
  delete: (id: string) => axiosClient.delete(`/rooms/${id}`),
  updateStatus: (id: string, status: string) => axiosClient.patch(`/rooms/${id}/status`, { status }),
  getMyRooms: (params?: Record<string, unknown>) => axiosClient.get('/rooms/my-rooms', { params }),
};

// ==================== LOCATIONS ====================
export const locationApi = {
  getProvinces: () => axiosClient.get('/locations/provinces'),
  getDistricts: (provinceId: string) => axiosClient.get('/locations/districts', { params: { provinceId } }),
  getWards: (districtId: string) => axiosClient.get('/locations/wards', { params: { districtId } }),
  seed: () => axiosClient.post('/locations/seed'),
};

// ==================== AMENITIES & ROOM TYPES ====================
export const amenityApi = {
  list: () => axiosClient.get('/amenities'),
  listRoomTypes: () => axiosClient.get('/amenities/room-types'),
  create: (data: { name: string; icon?: string }) => axiosClient.post('/amenities', data),
};

// ==================== RENTAL REQUESTS ====================
export const rentalRequestApi = {
  create: (data: { roomId: string; message?: string; moveInDate: string; numPeople?: number }) =>
    axiosClient.post('/rental-requests', data),
  list: (params?: Record<string, unknown>) => axiosClient.get('/rental-requests', { params }),
  accept: (id: string, data: { startDate: string; endDate: string; terms?: string }) =>
    axiosClient.patch(`/rental-requests/${id}/accept`, data),
  reject: (id: string) => axiosClient.patch(`/rental-requests/${id}/reject`),
  cancel: (id: string) => axiosClient.patch(`/rental-requests/${id}/cancel`),
};

// ==================== CONTRACTS ====================
export const contractApi = {
  list: (params?: Record<string, unknown>) => axiosClient.get('/contracts', { params }),
  getById: (id: string) => axiosClient.get(`/contracts/${id}`),
  sign: (id: string) => axiosClient.patch(`/contracts/${id}/sign`),
  terminate: (id: string) => axiosClient.patch(`/contracts/${id}/terminate`),
};

// ==================== INVOICES & PAYMENTS ====================
export const invoiceApi = {
  create: (data: Record<string, unknown>) => axiosClient.post('/payments/invoices', data),
  list: (params?: Record<string, unknown>) => axiosClient.get('/payments/invoices', { params }),
  getById: (id: string) => axiosClient.get(`/payments/invoices/${id}`),
};

export const paymentApi = {
  create: (data: { invoiceId: string; amount: number; method: string }) => axiosClient.post('/payments', data),
  list: (params?: Record<string, unknown>) => axiosClient.get('/payments', { params }),
};

export const utilityReadingApi = {
  create: (data: Record<string, unknown>) => axiosClient.post('/payments/utility-readings', data),
  list: (contractId: string) => axiosClient.get('/payments/utility-readings', { params: { contractId } }),
};

// ==================== BOOKMARKS ====================
export const bookmarkApi = {
  add: (roomId: string) => axiosClient.post('/bookmarks', { roomId }),
  remove: (roomId: string) => axiosClient.delete(`/bookmarks/${roomId}`),
  list: () => axiosClient.get('/bookmarks'),
  check: (roomId: string) => axiosClient.get(`/bookmarks/check/${roomId}`),
};

// ==================== REVIEWS ====================
export const reviewApi = {
  create: (data: { roomId: string; rating: number; comment?: string }) => axiosClient.post('/reviews', data),
  list: (roomId: string, params?: Record<string, unknown>) =>
    axiosClient.get('/reviews', { params: { roomId, ...params } }),
  delete: (id: string) => axiosClient.delete(`/reviews/${id}`),
};

// ==================== CHAT ====================
export const chatApi = {
  getOrCreateConversation: (data: { landlordId: string; roomId?: string }) =>
    axiosClient.post('/chat/conversations', data),
  listConversations: () => axiosClient.get('/chat/conversations'),
  getMessages: (conversationId: string, params?: Record<string, unknown>) =>
    axiosClient.get(`/chat/conversations/${conversationId}/messages`, { params }),
  sendMessage: (conversationId: string, content: string) =>
    axiosClient.post(`/chat/conversations/${conversationId}/messages`, { content }),
};

// ==================== NOTIFICATIONS ====================
export const notificationApi = {
  list: (params?: Record<string, unknown>) => axiosClient.get('/notifications', { params }),
  markAsRead: (id: string) => axiosClient.patch(`/notifications/${id}/read`),
  markAllAsRead: () => axiosClient.patch('/notifications/read-all'),
};

// ==================== USERS (Admin) ====================
export const userApi = {
  list: (params?: Record<string, unknown>) => axiosClient.get('/users', { params }),
  getById: (id: string) => axiosClient.get(`/users/${id}`),
  submitKYC: (data: { idCardFront: string; idCardBack: string; selfieUrl?: string }) =>
    axiosClient.post('/users/kyc', data),
  listPendingKYC: () => axiosClient.get('/users/kyc/pending'),
  reviewKYC: (id: string, status: string) => axiosClient.patch(`/users/kyc/${id}/review`, { status }),
};

// ==================== REPORTS ====================
export const reportApi = {
  create: (data: { targetType: string; targetId: string; reason: string; description?: string }) =>
    axiosClient.post('/reports', data),
  list: (params?: Record<string, unknown>) => axiosClient.get('/reports', { params }),
  updateStatus: (id: string, status: string) => axiosClient.patch(`/reports/${id}`, { status }),
};

// ==================== ADMIN ====================
export const adminApi = {
  getStats: () => axiosClient.get('/admin/stats'),
  listAllRooms: (params?: Record<string, unknown>) => axiosClient.get('/admin/rooms', { params }),
};

// ==================== UPLOAD ====================
export const uploadApi = {
  uploadFile: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return axiosClient.post('/upload/single', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  uploadMultiple: (files: File[]) => {
    const formData = new FormData();
    files.forEach(f => formData.append('files', f));
    return axiosClient.post('/upload/multiple', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

import axiosClient from './axiosClient';

export const reviewApi = {
  getAll(params?: {
    page?: number; limit?: number;
    roomId?: string; targetUserId?: string; targetType?: string;
    status?: string; sortBy?: string;
  }) {
    return axiosClient.get('/reviews', { params });
  },

  create(data: {
    targetType: 'room' | 'landlord' | 'tenant';
    targetUserId?: string;
    roomId?: string;
    contractId?: string;
    overallRating: number;
    title?: string;
    content?: string;
    pros?: string;
    cons?: string;
    stayDurationMonths?: number;
    criteriaRatings?: Array<{ criteriaId: string; rating: number }>;
    images?: Array<{ url: string; caption?: string }>;
  }) {
    return axiosClient.post('/reviews', data);
  },

  reply(reviewId: string, content: string) {
    return axiosClient.post(`/reviews/${reviewId}/reply`, { content });
  },

  voteHelpful(reviewId: string) {
    return axiosClient.post(`/reviews/${reviewId}/helpful`);
  },

  delete(reviewId: string) {
    return axiosClient.delete(`/reviews/${reviewId}`);
  },
};

export const favoriteApi = {
  getAll(params?: { page?: number; limit?: number }) {
    return axiosClient.get('/favorites', { params });
  },

  toggle(roomId: string) {
    return axiosClient.post('/favorites/toggle', { roomId });
  },

  check(roomId: string) {
    return axiosClient.get(`/favorites/check/${roomId}`);
  },

  remove(roomId: string) {
    return axiosClient.delete(`/favorites/${roomId}`);
  },

  // Wishlist Collections
  getCollections() {
    return axiosClient.get('/favorites/collections');
  },

  createCollection(data: { name: string; description?: string; isPublic?: boolean }) {
    return axiosClient.post('/favorites/collections', data);
  },

  addToCollection(collectionId: string, roomId: string, note?: string) {
    return axiosClient.post(`/favorites/collections/${collectionId}/items`, { roomId, note });
  },

  removeFromCollection(collectionId: string, roomId: string) {
    return axiosClient.delete(`/favorites/collections/${collectionId}/items/${roomId}`);
  },
};

export const notificationApi = {
  getAll(params?: { page?: number; limit?: number; type?: string; isRead?: number }) {
    return axiosClient.get('/notifications', { params });
  },

  getUnreadCount() {
    return axiosClient.get('/notifications/unread-count');
  },

  markAsRead(notificationIds: string[]) {
    return axiosClient.post('/notifications/mark-read', { notificationIds });
  },

  markAllAsRead() {
    return axiosClient.post('/notifications/mark-all-read');
  },

  delete(id: string) {
    return axiosClient.delete(`/notifications/${id}`);
  },
};

export const locationApi = {
  getProvinces() {
    return axiosClient.get('/locations/provinces');
  },

  getDistricts(provinceId: number) {
    return axiosClient.get(`/locations/provinces/${provinceId}/districts`);
  },

  getWards(districtId: number) {
    return axiosClient.get(`/locations/districts/${districtId}/wards`);
  },

  getAll() {
    return axiosClient.get('/locations/all');
  },
};

export const amenityApi = {
  getAll(category?: string) {
    return axiosClient.get('/amenities', { params: { category } });
  },
};

export const uploadApi = {
  uploadSingle(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return axiosClient.post('/upload/single', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  uploadMultiple(files: File[]) {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    return axiosClient.post('/upload/multiple', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  getMedia(params?: { page?: number; limit?: number; fileType?: string }) {
    return axiosClient.get('/upload/media', { params });
  },
};

export const cmsApi = {
  getArticles(params?: { page?: number; limit?: number; categoryId?: string; search?: string }) {
    return axiosClient.get('/cms/articles', { params });
  },

  getArticle(slug: string) {
    return axiosClient.get(`/cms/articles/${slug}`);
  },

  getFaqs(category?: string) {
    return axiosClient.get('/cms/faqs', { params: { category } });
  },
};

export const promotionApi = {
  getBanners(position?: string) {
    return axiosClient.get('/promotions/banners', { params: { position } });
  },

  getVipPackages() {
    return axiosClient.get('/promotions/vip-packages');
  },

  getCoupons() {
    return axiosClient.get('/promotions/coupons');
  },
};

export const chatApi = {
  getConversations(params?: { page?: number; limit?: number }) {
    return axiosClient.get('/chat/conversations', { params });
  },

  getOrCreateConversation(otherUserId: string, roomId?: string) {
    return axiosClient.post('/chat/conversations', { otherUserId, roomId });
  },

  getQuickReplies() {
    return axiosClient.get('/chat/quick-replies');
  },
};

export const roommateApi = {
  getProfile() {
    return axiosClient.get('/roommates/profile');
  },

  updateProfile(data: any) {
    return axiosClient.put('/roommates/profile', data);
  },

  getMatches(params?: { page?: number; limit?: number }) {
    return axiosClient.get('/roommates/match', { params });
  },
};

export const adminApi = {
  getDashboardStats() {
    return axiosClient.get('/admin/dashboard');
  },

  getConfigs() {
    return axiosClient.get('/admin/configs');
  },

  updateConfig(id: string, value: string) {
    return axiosClient.put(`/admin/configs/${id}`, { value });
  },

  getAuditLogs() {
    return axiosClient.get('/admin/audit');
  },
};

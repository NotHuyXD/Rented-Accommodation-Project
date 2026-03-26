import axios from 'axios';

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Interceptor cho Request
axiosClient.interceptors.request.use(
  (config) => {
    // Lấy token từ localStorage (hoặc Zustand store) và đưa vào Header
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor cho Response
axiosClient.interceptors.response.use(
  (response) => {
    // Tự động bóc tách phần data trả về từ server
    if (response && response.data) {
      return response.data;
    }
    return response;
  },
  (error) => {
    // Xử lý lỗi tập trung ở đây (vd: Hiện toast báo lỗi, Redirect khi hết hạn token, v.v...)
    if (error.response?.status === 401) {
      // Token hết hạn hoặc không hợp lệ -> Đăng xuất
      localStorage.removeItem('access_token');
      localStorage.removeItem('auth-storage'); // Reset Zustand persist cache nếu có
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosClient;

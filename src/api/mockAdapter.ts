import MockAdapter from 'axios-mock-adapter';
import axiosClient from './axiosClient';
import { mockUsers, mockRooms } from '../data/mockData';

// Khởi tạo mock adapter trên instance axiosClient
// delayResponse mô phỏng thời gian mạng (1 giây)
const mock = new MockAdapter(axiosClient, { delayResponse: 1000 });

// ------------- AUTH API MOCK -------------
// POST /auth/login
mock.onPost('/auth/login').reply((config: any) => {
  const { email } = JSON.parse(config.data);
  const user = mockUsers.find((u) => u.email === email);
  
  if (user) {
    // Trả về token giả và thông tin user
    return [
      200,
      {
        message: 'Đăng nhập thành công',
        data: {
          token: `fake-jwt-token-${user.id}`,
          user: user
        }
      }
    ];
  }
  
  return [401, { message: 'Email hoặc mật khẩu không chính xác' }];
});

// POST /auth/register
mock.onPost('/auth/register').reply((config: any) => {
  const data = JSON.parse(config.data);
  const newUser = {
    id: `user-${Date.now()}`,
    email: data.email,
    phone: data.phone || '',
    fullName: data.fullName,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Date.now()}`,
    role: data.role || 'tenant',
    isVerified: false,
    isEKYC: false,
    createdAt: new Date().toISOString().split('T')[0],
    privacySettings: { showPhone: true, showEmail: true }
  };
  
  return [
    200,
    {
      message: 'Đăng ký thành công',
      data: {
        token: `fake-jwt-token-${newUser.id}`,
        user: newUser
      }
    }
  ];
});

// ------------- ROOM API MOCK -------------
// GET /rooms
mock.onGet('/rooms').reply(() => {
  // Thực tế ở đây sẽ xử lý params để filter (config.params)
  return [200, { data: mockRooms, message: 'Success' }];
});

// GET /rooms/:id
mock.onGet(/\/rooms\/.+/).reply((config: any) => {
  const id = config.url?.split('/').pop();
  const room = mockRooms.find((r) => r.id === id);
  if (room) {
    return [200, { data: room, message: 'Success' }];
  }
  return [404, { message: 'Không tìm thấy phòng' }];
});

// Bạn có thể bật tắt mock API này khi Backend thật đã sẵn sàng
export default mock;

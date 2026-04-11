import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useRoomStore } from '../../stores/roomStore';
import { adminApi } from '../../api/services';
import { formatCurrency, formatDate } from '../../utils/helpers';
import axiosClient from '../../api/axiosClient';
import {
  Users, Building2, DollarSign, AlertTriangle, Shield,
  UserCheck, UserX, Eye, Ban, CheckCircle2, Search,
  BarChart3, Settings, Bell, FileText, Flag, Image,
  Megaphone, TrendingUp
} from 'lucide-react';
import '../landlord/DashboardPages.css';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { rooms, fetchRooms } = useRoomStore();
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user && user.role === 'admin') {
      loadDashboard();
    }
  }, [user]);

  const loadDashboard = async () => {
    setIsLoading(true);
    try {
      const [statsRes, usersRes] = await Promise.all([
        adminApi.getDashboardStats(),
        axiosClient.get('/users', { params: { limit: 20 } }),
      ]);
      if ((statsRes as any)?.data) setDashboardStats((statsRes as any).data);
      if ((usersRes as any)?.data) setUsers((usersRes as any).data);
      fetchRooms();
    } catch (error) {
      console.error('Failed to load admin dashboard', error);
    }
    setIsLoading(false);
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="dashboard-page">
        <div className="dashboard-empty">
          <h2>Bạn cần đăng nhập với tài khoản Admin</h2>
          <button className="btn btn-primary" onClick={() => navigate('/login')}>Đăng nhập</button>
        </div>
      </div>
    );
  }

  const stats = [
    { icon: Users, label: 'Người dùng', value: dashboardStats?.totalUsers || 0, color: '#06b6d4', trend: '+12%' },
    { icon: Building2, label: 'Phòng trọ', value: dashboardStats?.totalRooms || rooms.length, color: '#10b981', trend: '+8%' },
    { icon: DollarSign, label: 'Doanh thu', value: formatCurrency(dashboardStats?.totalRevenue || 0), color: '#f97316', trend: '+15%' },
    { icon: AlertTriangle, label: 'Bookings', value: dashboardStats?.totalBookings || 0, color: '#8b5cf6', trend: '+5%' }
  ];

  const tabs = [
    { id: 'overview', label: 'Tổng quan', icon: BarChart3 },
    { id: 'users', label: 'Người dùng', icon: Users },
    { id: 'rooms', label: 'Phòng trọ', icon: Building2 },
    { id: 'reports', label: 'Báo cáo', icon: Flag },
    { id: 'content', label: 'Nội dung', icon: Image },
    { id: 'settings', label: 'Cấu hình', icon: Settings }
  ];

  const handleBanUser = async (userId: string) => {
    try {
      await axiosClient.patch(`/users/${userId}/status`, { status: 'banned', reason: 'Vi phạm quy định' });
      loadDashboard();
    } catch (error) {
      console.error('Ban user failed', error);
    }
  };

  const handleApproveRoom = async (roomId: string) => {
    try {
      await axiosClient.patch(`/rooms/${roomId}/status`, { status: 'active' });
      fetchRooms();
    } catch (error) {
      console.error('Approve room failed', error);
    }
  };

  const handleRejectRoom = async (roomId: string) => {
    try {
      await axiosClient.patch(`/rooms/${roomId}/status`, { status: 'rejected', rejectionReason: 'Không đủ điều kiện' });
      fetchRooms();
    } catch (error) {
      console.error('Reject room failed', error);
    }
  };

  return (
    <div className="dashboard-page">
      <div className="container">
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">Quản trị hệ thống</h1>
            <p className="dashboard-subtitle">Xin chào, {user.fullName}! Bảng điều khiển quản trị.</p>
          </div>
        </div>

        {/* Stats */}
        <div className="dashboard-stats">
          {stats.map((stat, i) => (
            <div key={i} className="dashboard-stat-card">
              <div className="dashboard-stat-icon" style={{ background: `${stat.color}15`, color: stat.color }}>
                <stat.icon size={24} />
              </div>
              <div className="dashboard-stat-info">
                <span className="dashboard-stat-value">{stat.value}</span>
                <span className="dashboard-stat-label">{stat.label}</span>
              </div>
              <span className="dashboard-stat-trend" style={{ color: stat.trend.startsWith('+') ? 'var(--success-600)' : 'var(--error-500)' }}>
                {stat.trend}
              </span>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="tabs" style={{ marginBottom: 'var(--space-6)' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon size={16} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="dashboard-grid">
            {/* Chart */}
            <div className="dashboard-card dashboard-card-full">
              <div className="dashboard-card-header">
                <h2>Tổng quan hoạt động</h2>
              </div>
              <div className="dashboard-chart-placeholder">
                <div className="chart-bars">
                  {[45, 72, 55, 88, 62, 95, 78, 85, 70, 92, 68, 80].map((h, i) => (
                    <div key={i} className="chart-bar-group">
                      <div className="chart-bar" style={{ height: `${h}%` }}></div>
                      <span className="chart-bar-label">T{i + 1}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Users */}
            <div className="dashboard-card">
              <div className="dashboard-card-header">
                <h2>Người dùng mới</h2>
              </div>
              <div className="admin-user-list">
                {users.slice(0, 5).map(u => (
                  <div key={u.id} className="admin-user-item">
                    <img src={u.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.id}`} alt={u.full_name} className="admin-user-avatar" />
                    <div className="admin-user-info">
                      <h4>{u.full_name}</h4>
                      <p>{u.role === 'tenant' ? 'Khách thuê' : u.role === 'landlord' ? 'Chủ trọ' : 'Admin'}</p>
                    </div>
                    <div className="admin-user-actions">
                      {u.identity_verified ? (
                        <span className="badge badge-success">Đã xác thực</span>
                      ) : (
                        <span className="badge badge-warning">Chưa xác thực</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Rooms */}
            <div className="dashboard-card">
              <div className="dashboard-card-header">
                <h2>Phòng chờ duyệt</h2>
              </div>
              <div className="dashboard-room-list">
                {rooms.slice(0, 4).map(room => (
                  <div key={room.id} className="dashboard-room-item">
                    <img src={(room as any).cover_image || (room as any).coverImage || (room.images && room.images[0]) || 'https://via.placeholder.com/60x45'} alt={room.title} className="dashboard-room-thumb" />
                    <div className="dashboard-room-info">
                      <h4>{room.title}</h4>
                      <p>{(room as any).landlord_name || (room as any).landlordName}</p>
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                      <button className="btn btn-sm" style={{ background: 'var(--success-500)', color: 'white' }} onClick={() => handleApproveRoom(room.id)}>
                        <CheckCircle2 size={14} />
                      </button>
                      <button className="btn btn-sm" style={{ background: 'var(--error-500)', color: 'white' }} onClick={() => handleRejectRoom(room.id)}>
                        <Ban size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="dashboard-card">
            <div className="dashboard-card-header">
              <h2>Quản lý người dùng</h2>
              <div className="dashboard-search-bar">
                <Search size={16} />
                <input type="text" placeholder="Tìm kiếm người dùng..." className="input-field" />
              </div>
            </div>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Người dùng</th>
                    <th>Email</th>
                    <th>Vai trò</th>
                    <th>Trạng thái</th>
                    <th>Ngày tạo</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                          <img src={u.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.id}`} alt="" style={{ width: 32, height: 32, borderRadius: '50%' }} />
                          <span style={{ fontWeight: 600 }}>{u.full_name}</span>
                        </div>
                      </td>
                      <td>{u.email}</td>
                      <td>
                        <span className={`badge ${u.role === 'admin' ? 'badge-primary' : u.role === 'landlord' ? 'badge-warning' : 'badge-neutral'}`}>
                          {u.role === 'admin' ? 'Admin' : u.role === 'landlord' ? 'Chủ trọ' : 'Khách thuê'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${u.status === 'active' ? 'badge-success' : u.status === 'banned' ? 'badge-error' : 'badge-warning'}`}>
                          {u.status === 'active' ? 'Hoạt động' : u.status === 'banned' ? 'Đã khóa' : 'Chờ xác thực'}
                        </span>
                      </td>
                      <td>{formatDate(u.created_at)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                          <button className="btn btn-ghost btn-icon-sm" title="Xem" onClick={() => navigate(`/profile?userId=${u.id}`)}>
                            <Eye size={16} />
                          </button>
                          <button className="btn btn-ghost btn-icon-sm" title="Khóa" style={{ color: 'var(--error-500)' }} onClick={() => handleBanUser(u.id)}>
                            <Ban size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'rooms' && (
          <div className="dashboard-card">
            <div className="dashboard-card-header">
              <h2>Quản lý phòng trọ</h2>
            </div>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Phòng</th>
                    <th>Chủ trọ</th>
                    <th>Giá</th>
                    <th>Trạng thái</th>
                    <th>Lượt xem</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {rooms.map(room => (
                    <tr key={room.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                          <img src={(room as any).cover_image || (room as any).coverImage || (room.images && room.images[0]) || 'https://via.placeholder.com/48x36'} alt="" style={{ width: 48, height: 36, borderRadius: 6, objectFit: 'cover' }} />
                          <span style={{ fontWeight: 600, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{room.title}</span>
                        </div>
                      </td>
                      <td>{(room as any).landlord_name || (room as any).landlordName}</td>
                      <td>{formatCurrency(room.price)}</td>
                      <td>
                        <span className={`badge ${room.status === 'active' ? 'badge-success' : room.status === 'pending_approval' ? 'badge-warning' : 'badge-neutral'}`}>
                          {room.status === 'active' ? 'Hoạt động' : room.status === 'pending_approval' ? 'Chờ duyệt' : room.status === 'rented' ? 'Đang thuê' : room.status}
                        </span>
                      </td>
                      <td>{(room as any).view_count || (room as any).views || 0}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                          <button className="btn btn-ghost btn-icon-sm" onClick={() => navigate(`/rooms/${room.id}`)}>
                            <Eye size={16} />
                          </button>
                          <button className="btn btn-ghost btn-icon-sm" style={{ color: 'var(--error-500)' }} onClick={() => handleRejectRoom(room.id)}>
                            <Ban size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {(activeTab === 'reports' || activeTab === 'content' || activeTab === 'settings') && (
          <div className="dashboard-card">
            <div style={{ padding: 'var(--space-10)', textAlign: 'center' }}>
              <Settings size={48} style={{ color: 'var(--text-tertiary)', marginBottom: 'var(--space-4)' }} />
              <h3>Module {tabs.find(t => t.id === activeTab)?.label}</h3>
              <p style={{ color: 'var(--text-tertiary)', marginTop: 'var(--space-2)' }}>
                Tính năng đang được phát triển
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

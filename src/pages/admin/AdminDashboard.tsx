import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useRoomStore } from '../../stores/roomStore';
import { mockUsers } from '../../data/mockData';
import { formatCurrency, formatDate } from '../../utils/helpers';
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
  const { rooms } = useRoomStore();
  const [activeTab, setActiveTab] = useState('overview');

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
    { icon: Users, label: 'Người dùng', value: mockUsers.length, color: '#06b6d4', trend: '+12%' },
    { icon: Building2, label: 'Phòng trọ', value: rooms.length, color: '#10b981', trend: '+8%' },
    { icon: DollarSign, label: 'Giao dịch tháng', value: '₫24.5M', color: '#f97316', trend: '+15%' },
    { icon: AlertTriangle, label: 'Báo cáo', value: 3, color: '#ef4444', trend: '-20%' }
  ];

  const tabs = [
    { id: 'overview', label: 'Tổng quan', icon: BarChart3 },
    { id: 'users', label: 'Người dùng', icon: Users },
    { id: 'rooms', label: 'Phòng trọ', icon: Building2 },
    { id: 'reports', label: 'Báo cáo', icon: Flag },
    { id: 'content', label: 'Nội dung', icon: Image },
    { id: 'settings', label: 'Cấu hình', icon: Settings }
  ];

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
                {mockUsers.map(u => (
                  <div key={u.id} className="admin-user-item">
                    <img src={u.avatar} alt={u.fullName} className="admin-user-avatar" />
                    <div className="admin-user-info">
                      <h4>{u.fullName}</h4>
                      <p>{u.role === 'tenant' ? 'Khách thuê' : u.role === 'landlord' ? 'Chủ trọ' : 'Admin'}</p>
                    </div>
                    <div className="admin-user-actions">
                      {u.isVerified ? (
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
                    <img src={room.images[0]} alt={room.title} className="dashboard-room-thumb" />
                    <div className="dashboard-room-info">
                      <h4>{room.title}</h4>
                      <p>{room.landlordName}</p>
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                      <button className="btn btn-sm" style={{ background: 'var(--success-500)', color: 'white' }}>
                        <CheckCircle2 size={14} />
                      </button>
                      <button className="btn btn-sm" style={{ background: 'var(--error-500)', color: 'white' }}>
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
                  {mockUsers.map(u => (
                    <tr key={u.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                          <img src={u.avatar} alt="" style={{ width: 32, height: 32, borderRadius: '50%' }} />
                          <span style={{ fontWeight: 600 }}>{u.fullName}</span>
                        </div>
                      </td>
                      <td>{u.email}</td>
                      <td>
                        <span className={`badge ${u.role === 'admin' ? 'badge-primary' : u.role === 'landlord' ? 'badge-warning' : 'badge-neutral'}`}>
                          {u.role === 'admin' ? 'Admin' : u.role === 'landlord' ? 'Chủ trọ' : 'Khách thuê'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${u.isVerified ? 'badge-success' : 'badge-error'}`}>
                          {u.isVerified ? 'Đã xác thực' : 'Chưa xác thực'}
                        </span>
                      </td>
                      <td>{formatDate(u.createdAt)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                          <button className="btn btn-ghost btn-icon-sm" title="Xem">
                            <Eye size={16} />
                          </button>
                          <button className="btn btn-ghost btn-icon-sm" title="Khóa" style={{ color: 'var(--error-500)' }}>
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
                          <img src={room.images[0]} alt="" style={{ width: 48, height: 36, borderRadius: 6, objectFit: 'cover' }} />
                          <span style={{ fontWeight: 600, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{room.title}</span>
                        </div>
                      </td>
                      <td>{room.landlordName}</td>
                      <td>{formatCurrency(room.price)}</td>
                      <td>
                        <span className={`badge ${room.status === 'available' ? 'badge-success' : 'badge-warning'}`}>
                          {room.status === 'available' ? 'Trống' : 'Đang thuê'}
                        </span>
                      </td>
                      <td>{room.views}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                          <button className="btn btn-ghost btn-icon-sm" onClick={() => navigate(`/rooms/${room.id}`)}>
                            <Eye size={16} />
                          </button>
                          <button className="btn btn-ghost btn-icon-sm" style={{ color: 'var(--error-500)' }}>
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

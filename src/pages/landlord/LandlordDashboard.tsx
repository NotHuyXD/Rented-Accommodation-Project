import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useRoomStore } from '../../stores/roomStore';
import { formatCurrency } from '../../utils/helpers';
import { mockBookings, mockContracts, mockInvoices, mockTickets } from '../../data/mockData';
import {
  Building2, Plus, Eye, Star, TrendingUp, Users, DollarSign,
  FileText, Settings, Bell, Home, Wrench, CheckCircle2,
  Clock, AlertTriangle, Edit, Trash2, EyeOff, MoreVertical
} from 'lucide-react';
import './DashboardPages.css';

export default function LandlordDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { rooms } = useRoomStore();

  if (!user || user.role !== 'landlord') {
    return (
      <div className="dashboard-page">
        <div className="dashboard-empty">
          <h2>Bạn cần đăng nhập với tài khoản Chủ trọ</h2>
          <button className="btn btn-primary" onClick={() => navigate('/login')}>Đăng nhập</button>
        </div>
      </div>
    );
  }

  const myRooms = rooms.filter(r => r.landlordId === user.id);
  const totalRevenue = myRooms.reduce((sum, r) => sum + (r.status === 'rented' ? r.price : 0), 0);
  const availableRooms = myRooms.filter(r => r.status === 'available').length;
  const totalViews = myRooms.reduce((sum, r) => sum + r.views, 0);

  const stats = [
    { icon: Building2, label: 'Tổng phòng', value: myRooms.length, color: '#06b6d4' },
    { icon: CheckCircle2, label: 'Phòng trống', value: availableRooms, color: '#10b981' },
    { icon: Eye, label: 'Lượt xem', value: totalViews.toLocaleString(), color: '#8b5cf6' },
    { icon: DollarSign, label: 'Doanh thu/tháng', value: formatCurrency(totalRevenue), color: '#f97316' }
  ];

  return (
    <div className="dashboard-page">
      <div className="container">
        {/* Dashboard Header */}
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">Dashboard Chủ trọ</h1>
            <p className="dashboard-subtitle">Xin chào, {user.fullName}! 👋</p>
          </div>
          <div className="dashboard-header-actions">
            <Link to="/landlord/rooms/new" className="btn btn-accent">
              <Plus size={18} />
              Đăng phòng mới
            </Link>
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
            </div>
          ))}
        </div>

        {/* Content Grid */}
        <div className="dashboard-grid">
          {/* Room List */}
          <div className="dashboard-card">
            <div className="dashboard-card-header">
              <h2>Phòng của tôi</h2>
              <Link to="/landlord/rooms" className="btn btn-ghost btn-sm">Xem tất cả</Link>
            </div>
            <div className="dashboard-room-list">
              {myRooms.slice(0, 5).map(room => (
                <div key={room.id} className="dashboard-room-item" onClick={() => navigate(`/rooms/${room.id}`)}>
                  <img src={room.images[0]} alt={room.title} className="dashboard-room-thumb" />
                  <div className="dashboard-room-info">
                    <h4>{room.title}</h4>
                    <p>{formatCurrency(room.price)}/tháng</p>
                  </div>
                  <span
                    className="badge"
                    style={{
                      background: room.status === 'available' ? 'var(--success-100)' : 'var(--warning-100)',
                      color: room.status === 'available' ? 'var(--success-700)' : 'var(--warning-600)'
                    }}
                  >
                    {room.status === 'available' ? 'Trống' : room.status === 'rented' ? 'Đang thuê' : 'Đã cọc'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="dashboard-card">
            <div className="dashboard-card-header">
              <h2>Thao tác nhanh</h2>
            </div>
            <div className="dashboard-quick-actions">
              <button className="dashboard-action-btn" onClick={() => navigate('/landlord/rooms/new')}>
                <Plus size={20} />
                <span>Đăng phòng</span>
              </button>
              <button className="dashboard-action-btn" onClick={() => navigate('/contracts')}>
                <FileText size={20} />
                <span>Hợp đồng</span>
              </button>
              <button className="dashboard-action-btn" onClick={() => navigate('/payments')}>
                <DollarSign size={20} />
                <span>Thanh toán</span>
              </button>
              <button className="dashboard-action-btn" onClick={() => navigate('/chat')}>
                <Users size={20} />
                <span>Tin nhắn</span>
              </button>
              <button className="dashboard-action-btn" onClick={() => navigate('/tickets')}>
                <Wrench size={20} />
                <span>Sự cố</span>
              </button>
              <button className="dashboard-action-btn" onClick={() => navigate('/profile')}>
                <Settings size={20} />
                <span>Cài đặt</span>
              </button>
            </div>
          </div>

          {/* Revenue Chart Placeholder */}
          <div className="dashboard-card dashboard-card-full">
            <div className="dashboard-card-header">
              <h2>Biểu đồ doanh thu</h2>
              <select className="select-field" style={{ width: 'auto' }}>
                <option>6 tháng gần nhất</option>
                <option>12 tháng</option>
                <option>Năm nay</option>
              </select>
            </div>
            <div className="dashboard-chart-placeholder">
              <div className="chart-bars">
                {[65, 45, 80, 55, 90, 70].map((h, i) => (
                  <div key={i} className="chart-bar-group">
                    <div className="chart-bar" style={{ height: `${h}%` }}></div>
                    <span className="chart-bar-label">T{i + 1}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Tickets */}
          <div className="dashboard-card">
            <div className="dashboard-card-header">
              <h2>Sự cố gần đây</h2>
            </div>
            <div className="dashboard-tickets">
              {mockTickets.map(ticket => (
                <div key={ticket.id} className="dashboard-ticket-item">
                  <div className="dashboard-ticket-icon" style={{
                    background: ticket.status === 'resolved' ? 'var(--success-100)' : 'var(--warning-100)',
                    color: ticket.status === 'resolved' ? 'var(--success-600)' : 'var(--warning-600)'
                  }}>
                    {ticket.status === 'resolved' ? <CheckCircle2 size={18} /> : <Wrench size={18} />}
                  </div>
                  <div className="dashboard-ticket-info">
                    <h4>{ticket.title}</h4>
                    <p>{ticket.category === 'plumbing' ? 'Nước' : 'Điện'}</p>
                  </div>
                  <span className={`badge ${ticket.status === 'resolved' ? 'badge-success' : 'badge-warning'}`}>
                    {ticket.status === 'resolved' ? 'Đã xử lý' : 'Đang xử lý'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useRoomStore } from '../../stores/roomStore';
import { useAppStore } from '../../stores/appStore';
import { formatCurrency, getStatusLabel } from '../../utils/helpers';
import {
  Building2, Plus, CheckCircle2, DollarSign,
  FileText, Settings, Users, Clock,
  Wrench, MessageCircle
} from 'lucide-react';
import './DashboardPages.css';

export default function LandlordDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { myRooms, fetchMyRooms, isLoading: roomsLoading } = useRoomStore();
  const { rentalRequests, fetchRentalRequests } = useAppStore();

  useEffect(() => {
    if (user && user.role === 'landlord') {
      fetchMyRooms();
      fetchRentalRequests();
    }
  }, [user]);

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

  const availableRooms = myRooms.filter(r => r.status === 'available').length;
  const rentedRooms = myRooms.filter(r => r.status === 'rented').length;
  const totalRevenue = myRooms.filter(r => r.status === 'rented').reduce((sum, r) => sum + (r.price || 0), 0);
  const pendingRequests = rentalRequests.filter(r => r.status === 'pending');

  const stats = [
    { icon: Building2, label: 'Tổng phòng', value: myRooms.length, color: '#06b6d4' },
    { icon: CheckCircle2, label: 'Phòng trống', value: availableRooms, color: '#10b981' },
    { icon: Users, label: 'Đang thuê', value: rentedRooms, color: '#8b5cf6' },
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
            </div>
            {roomsLoading ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                Đang tải...
              </div>
            ) : (
              <div className="dashboard-room-list">
                {myRooms.slice(0, 5).map(room => {
                  const status = getStatusLabel(room.status);
                  return (
                    <div key={room.id} className="dashboard-room-item" onClick={() => navigate(`/rooms/${room.id}`)}>
                      <img
                        src={room.cover_image || 'https://placehold.co/60x45/e2e8f0/64748b?text=Room'}
                        alt={room.title}
                        className="dashboard-room-thumb"
                      />
                      <div className="dashboard-room-info">
                        <h4>{room.title}</h4>
                        <p>{formatCurrency(room.price)}/tháng</p>
                      </div>
                      <span className="badge" style={{ background: `${status.color}20`, color: status.color }}>
                        {status.label}
                      </span>
                    </div>
                  );
                })}
                {myRooms.length === 0 && (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    Chưa có phòng nào. Hãy đăng phòng mới!
                  </div>
                )}
              </div>
            )}
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
                <span>Hóa đơn</span>
              </button>
              <button className="dashboard-action-btn" onClick={() => navigate('/chat')}>
                <MessageCircle size={20} />
                <span>Tin nhắn</span>
              </button>
              <button className="dashboard-action-btn" onClick={() => navigate('/profile')}>
                <Settings size={20} />
                <span>Cài đặt</span>
              </button>
            </div>
          </div>

          {/* Pending Rental Requests */}
          <div className="dashboard-card dashboard-card-full">
            <div className="dashboard-card-header">
              <h2>Yêu cầu thuê phòng ({pendingRequests.length} chờ duyệt)</h2>
            </div>
            <div className="dashboard-tickets">
              {pendingRequests.length > 0 ? (
                pendingRequests.slice(0, 5).map(req => (
                  <div key={req.id} className="dashboard-ticket-item">
                    <div className="dashboard-ticket-icon" style={{ background: 'var(--warning-100)', color: 'var(--warning-600)' }}>
                      <Clock size={18} />
                    </div>
                    <div className="dashboard-ticket-info">
                      <h4>{req.room_title || 'Phòng trọ'}</h4>
                      <p>{req.tenant_name} - Dọn vào {req.move_in_date} ({req.num_people} người)</p>
                    </div>
                    <span className="badge" style={{ background: 'var(--warning-100)', color: 'var(--warning-600)' }}>
                      Chờ duyệt
                    </span>
                  </div>
                ))
              ) : (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  Không có yêu cầu nào đang chờ
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { mockBookings, mockContracts, mockInvoices, mockSchedules, mockTickets } from '../../data/mockData';
import { useRoomStore } from '../../stores/roomStore';
import {
  Home, FileText, DollarSign, CalendarDays, Wrench, Bell,
  CheckCircle2, Clock, AlertCircle, Settings, Heart, MessageCircle,
  Star, Eye, CreditCard, Receipt
} from 'lucide-react';
import '../landlord/DashboardPages.css';

export default function TenantDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { rooms, favorites } = useRoomStore();

  if (!user || user.role !== 'tenant') {
    return (
      <div className="dashboard-page">
        <div className="dashboard-empty">
          <h2>Bạn cần đăng nhập với tài khoản Người thuê</h2>
          <button className="btn btn-primary" onClick={() => navigate('/login')}>Đăng nhập</button>
        </div>
      </div>
    );
  }

  const myBookings = mockBookings.filter(b => b.tenantId === user.id);
  const myContracts = mockContracts.filter(c => c.tenantId === user.id);
  const myInvoices = mockInvoices.filter(i => i.tenantId === user.id);
  const pendingInvoice = myInvoices.find(i => i.status === 'pending');
  const favoriteRooms = rooms.filter(r => favorites.includes(r.id));

  const stats = [
    { icon: Home, label: 'Phòng đang thuê', value: myBookings.filter(b => b.status === 'confirmed').length, color: '#06b6d4' },
    { icon: FileText, label: 'Hợp đồng', value: myContracts.length, color: '#10b981' },
    { icon: DollarSign, label: 'Chưa thanh toán', value: pendingInvoice ? formatCurrency(pendingInvoice.total) : '0đ', color: '#f59e0b' },
    { icon: Heart, label: 'Yêu thích', value: favorites.length, color: '#ef4444' }
  ];

  return (
    <div className="dashboard-page">
      <div className="container">
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">Dashboard Người thuê</h1>
            <p className="dashboard-subtitle">Xin chào, {user.fullName}! 👋</p>
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

        <div className="dashboard-grid">
          {/* Pending Payment */}
          {pendingInvoice && (
            <div className="dashboard-card dashboard-card-full">
              <div className="dashboard-payment-alert">
                <div className="dashboard-payment-info">
                  <AlertCircle size={24} />
                  <div>
                    <h3>Hóa đơn tháng {pendingInvoice.month} cần thanh toán</h3>
                    <p>Tiền phòng {formatCurrency(pendingInvoice.rent)} + Điện {formatCurrency(pendingInvoice.electricity)} + Nước {formatCurrency(pendingInvoice.water)} + DV {formatCurrency(pendingInvoice.service)}</p>
                  </div>
                </div>
                <div className="dashboard-payment-total">
                  <span className="dashboard-payment-amount">{formatCurrency(pendingInvoice.total)}</span>
                  <button className="btn btn-accent" onClick={() => navigate('/payments')}>
                    <CreditCard size={16} />
                    Thanh toán
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="dashboard-card">
            <div className="dashboard-card-header">
              <h2>Thao tác nhanh</h2>
            </div>
            <div className="dashboard-quick-actions">
              <button className="dashboard-action-btn" onClick={() => navigate('/rooms')}>
                <Home size={20} />
                <span>Tìm phòng</span>
              </button>
              <button className="dashboard-action-btn" onClick={() => navigate('/payments')}>
                <Receipt size={20} />
                <span>Thanh toán</span>
              </button>
              <button className="dashboard-action-btn" onClick={() => navigate('/contracts')}>
                <FileText size={20} />
                <span>Hợp đồng</span>
              </button>
              <button className="dashboard-action-btn" onClick={() => navigate('/chat')}>
                <MessageCircle size={20} />
                <span>Tin nhắn</span>
              </button>
              <button className="dashboard-action-btn" onClick={() => navigate('/tickets')}>
                <Wrench size={20} />
                <span>Báo sự cố</span>
              </button>
              <button className="dashboard-action-btn" onClick={() => navigate('/favorites')}>
                <Heart size={20} />
                <span>Yêu thích</span>
              </button>
            </div>
          </div>

          {/* Contracts */}
          <div className="dashboard-card">
            <div className="dashboard-card-header">
              <h2>Hợp đồng</h2>
            </div>
            {myContracts.length > 0 ? (
              <div className="dashboard-contracts">
                {myContracts.map(contract => {
                  const contractRoom = rooms.find(r => r.id === contract.roomId);
                  return (
                    <div key={contract.id} className="dashboard-contract-item">
                      <div className="dashboard-contract-info">
                        <h4>{contractRoom?.title || 'Phòng trọ'}</h4>
                        <p>{formatDate(contract.startDate)} — {formatDate(contract.endDate)}</p>
                        <p>{formatCurrency(contract.monthlyRent)}/tháng</p>
                      </div>
                      <span className="badge badge-success">Đang hiệu lực</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p style={{ color: 'var(--text-tertiary)', padding: 'var(--space-4)' }}>Chưa có hợp đồng</p>
            )}
          </div>

          {/* Payment History */}
          <div className="dashboard-card">
            <div className="dashboard-card-header">
              <h2>Lịch sử thanh toán</h2>
            </div>
            <div className="dashboard-invoices">
              {myInvoices.map(invoice => (
                <div key={invoice.id} className="dashboard-invoice-item">
                  <div className="dashboard-invoice-info">
                    <h4>Tháng {invoice.month}</h4>
                    <p>{formatCurrency(invoice.total)}</p>
                  </div>
                  <span className={`badge ${invoice.status === 'completed' ? 'badge-success' : 'badge-warning'}`}>
                    {invoice.status === 'completed' ? 'Đã thanh toán' : 'Chờ thanh toán'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Favorites */}
          {favoriteRooms.length > 0 && (
            <div className="dashboard-card dashboard-card-full">
              <div className="dashboard-card-header">
                <h2>Phòng yêu thích</h2>
                <button className="btn btn-ghost btn-sm" onClick={() => navigate('/favorites')}>Xem tất cả</button>
              </div>
              <div className="dashboard-favorites-grid">
                {favoriteRooms.slice(0, 4).map(room => (
                  <div key={room.id} className="dashboard-fav-card" onClick={() => navigate(`/rooms/${room.id}`)}>
                    <img src={room.images[0]} alt={room.title} />
                    <div className="dashboard-fav-info">
                      <h4>{room.title}</h4>
                      <p>{formatCurrency(room.price)}/tháng</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

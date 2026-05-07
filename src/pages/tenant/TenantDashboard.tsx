import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useAppStore } from '../../stores/appStore';
import { rentalRequestApi } from '../../api/services';
import { formatCurrency, formatDate, getStatusLabel } from '../../utils/helpers';
import {
  Home, FileText, DollarSign, Heart, MessageCircle,
  CheckCircle2, Clock, AlertCircle, Settings,
  CreditCard, Receipt, Search, XCircle, Trash2
} from 'lucide-react';
import '../landlord/DashboardPages.css';

export default function TenantDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    contracts, invoices, rentalRequests, bookmarks,
    fetchContracts, fetchInvoices, fetchRentalRequests, fetchBookmarks
  } = useAppStore();
  const [cancelling, setCancelling] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role === 'tenant') {
      fetchContracts();
      fetchInvoices();
      fetchRentalRequests();
      fetchBookmarks();
    }
  }, [user]);

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

  const activeContracts = contracts.filter(c => c.status === 'active');
  const unpaidInvoices = invoices.filter(i => i.status === 'unpaid' || i.status === 'overdue');
  const pendingRequests = rentalRequests.filter(r => r.status === 'pending');

  const stats = [
    { icon: Home, label: 'Hợp đồng hiện tại', value: activeContracts.length, color: '#06b6d4' },
    { icon: FileText, label: 'Yêu cầu chờ', value: pendingRequests.length, color: '#f59e0b' },
    { icon: DollarSign, label: 'Chưa thanh toán', value: unpaidInvoices.length, color: '#ef4444' },
    { icon: Heart, label: 'Yêu thích', value: bookmarks.length, color: '#ec4899' },
  ];

  const handleCancelRequest = async (requestId: string) => {
    if (!confirm('Bạn có chắc muốn hủy yêu cầu thuê phòng này?')) return;
    setCancelling(requestId);
    try {
      await rentalRequestApi.cancel(requestId);
      alert('Đã hủy yêu cầu thuê phòng thành công');
      fetchRentalRequests();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi hủy yêu cầu');
    } finally {
      setCancelling(null);
    }
  };

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
          {/* Unpaid Invoices Alert */}
          {unpaidInvoices.length > 0 && (
            <div className="dashboard-card dashboard-card-full">
              <div className="dashboard-payment-alert">
                <div className="dashboard-payment-info">
                  <AlertCircle size={24} />
                  <div>
                    <h3>Bạn có {unpaidInvoices.length} hóa đơn chưa thanh toán</h3>
                    <p>
                      Tổng: {formatCurrency(unpaidInvoices.reduce((s, i) => s + parseFloat(String(i.total)), 0))}
                    </p>
                  </div>
                </div>
                <div className="dashboard-payment-total">
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
                <Search size={20} />
                <span>Tìm phòng</span>
              </button>
              <button className="dashboard-action-btn" onClick={() => navigate('/payments')}>
                <Receipt size={20} />
                <span>Hóa đơn</span>
              </button>
              <button className="dashboard-action-btn" onClick={() => navigate('/contracts')}>
                <FileText size={20} />
                <span>Hợp đồng</span>
              </button>
              <button className="dashboard-action-btn" onClick={() => navigate('/chat')}>
                <MessageCircle size={20} />
                <span>Tin nhắn</span>
              </button>
              <button className="dashboard-action-btn" onClick={() => navigate('/favorites')}>
                <Heart size={20} />
                <span>Yêu thích</span>
              </button>
              <button className="dashboard-action-btn" onClick={() => navigate('/profile')}>
                <Settings size={20} />
                <span>Hồ sơ</span>
              </button>
            </div>
          </div>

          {/* Active Contracts */}
          <div className="dashboard-card">
            <div className="dashboard-card-header">
              <h2>Hợp đồng đang hiệu lực</h2>
            </div>
            {activeContracts.length > 0 ? (
              <div className="dashboard-contracts">
                {activeContracts.map(contract => {
                  const status = getStatusLabel(contract.status);
                  return (
                    <div key={contract.id} className="dashboard-contract-item" onClick={() => navigate('/contracts')}>
                      <div className="dashboard-contract-info">
                        <h4>{contract.room_title || 'Phòng trọ'}</h4>
                        <p>{formatDate(contract.start_date)} — {formatDate(contract.end_date)}</p>
                        <p>{formatCurrency(contract.monthly_rent)}/tháng</p>
                      </div>
                      <span className="badge" style={{ background: `${status.color}20`, color: status.color }}>
                        {status.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p style={{ color: 'var(--text-tertiary)', padding: '24px' }}>Chưa có hợp đồng đang hiệu lực</p>
            )}
          </div>

          {/* Rental Requests */}
          <div className="dashboard-card dashboard-card-full">
            <div className="dashboard-card-header">
              <h2>Yêu cầu thuê phòng</h2>
            </div>
            {rentalRequests.length > 0 ? (
              <div className="dashboard-tickets">
                {rentalRequests.map(req => {
                  const status = getStatusLabel(req.status);
                  const isPending = req.status === 'pending';
                  return (
                    <div key={req.id} className="dashboard-ticket-item">
                      <div className="dashboard-ticket-icon" style={{ background: `${status.color}20`, color: status.color }}>
                        {isPending ? <Clock size={18} /> : <CheckCircle2 size={18} />}
                      </div>
                      <div className="dashboard-ticket-info">
                        <h4>{req.room_title || 'Phòng trọ'}</h4>
                        <p>
                          Dọn vào: {formatDate(req.move_in_date)}
                          {req.room_price ? ` · ${formatCurrency(req.room_price)}/tháng` : ''}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                        <span className="badge" style={{ background: `${status.color}20`, color: status.color }}>
                          {status.label}
                        </span>
                        {isPending && (
                          <button
                            className="btn btn-sm"
                            style={{ 
                              background: '#ef444415', color: '#ef4444', border: 'none',
                              fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px'
                            }}
                            onClick={() => handleCancelRequest(req.id)}
                            disabled={cancelling === req.id}
                          >
                            <XCircle size={14} />
                            {cancelling === req.id ? 'Đang hủy...' : 'Hủy yêu cầu'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p style={{ color: 'var(--text-tertiary)', padding: '24px' }}>Chưa gửi yêu cầu thuê nào</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useRoomStore } from '../../stores/roomStore';
import { useAppStore } from '../../stores/appStore';
import { rentalRequestApi } from '../../api/services';
import { formatCurrency, formatDate, getStatusLabel, getImageUrl } from '../../utils/helpers';
import {
  Building2, Plus, CheckCircle2, DollarSign,
  FileText, Settings, Users, Clock,
  Wrench, MessageCircle, X, Check, XCircle
} from 'lucide-react';
import './DashboardPages.css';

export default function LandlordDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { myRooms, fetchMyRooms, isLoading: roomsLoading } = useRoomStore();
  const { rentalRequests, fetchRentalRequests } = useAppStore();
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [contractForm, setContractForm] = useState({ startDate: '', endDate: '', terms: '' });
  const [processing, setProcessing] = useState(false);

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

  const handleAcceptClick = (req: any) => {
    setSelectedRequest(req);
    // Default contract dates: move-in date to +12 months
    const startDate = req.move_in_date ? req.move_in_date.split('T')[0] : new Date().toISOString().split('T')[0];
    const endDateObj = new Date(startDate);
    endDateObj.setFullYear(endDateObj.getFullYear() + 1);
    const endDate = endDateObj.toISOString().split('T')[0];
    setContractForm({ startDate, endDate, terms: '' });
    setShowAcceptModal(true);
  };

  const handleAcceptSubmit = async () => {
    if (!contractForm.startDate || !contractForm.endDate) {
      alert('Vui lòng chọn ngày bắt đầu và kết thúc hợp đồng');
      return;
    }
    setProcessing(true);
    try {
      await rentalRequestApi.accept(selectedRequest.id, {
        startDate: contractForm.startDate,
        endDate: contractForm.endDate,
        terms: contractForm.terms || undefined,
      });
      alert('Đã chấp nhận yêu cầu thuê phòng và tạo hợp đồng thành công!');
      setShowAcceptModal(false);
      setSelectedRequest(null);
      fetchRentalRequests();
      fetchMyRooms();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi xử lý yêu cầu');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (requestId: string) => {
    if (!confirm('Bạn có chắc muốn từ chối yêu cầu thuê phòng này?')) return;
    setProcessing(true);
    try {
      await rentalRequestApi.reject(requestId);
      alert('Đã từ chối yêu cầu thuê phòng');
      fetchRentalRequests();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi xử lý yêu cầu');
    } finally {
      setProcessing(false);
    }
  };

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
                        src={getImageUrl(room.cover_image) || 'https://placehold.co/60x45/e2e8f0/64748b?text=Room'}
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
              {rentalRequests.length > 0 ? (
                rentalRequests.slice(0, 10).map(req => {
                  const status = getStatusLabel(req.status);
                  const isPending = req.status === 'pending';
                  return (
                    <div key={req.id} className="dashboard-ticket-item">
                      <div className="dashboard-ticket-icon" style={{ background: `${status.color}15`, color: status.color }}>
                        {isPending ? <Clock size={18} /> : <CheckCircle2 size={18} />}
                      </div>
                      <div className="dashboard-ticket-info">
                        <h4>{req.room_title || 'Phòng trọ'}</h4>
                        <p>
                          <strong>{req.tenant_name}</strong> - Dọn vào {formatDate(req.move_in_date)} ({req.num_people} người)
                          {req.tenant_phone && <span> · SĐT: {req.tenant_phone}</span>}
                        </p>
                        {req.message && (
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: '4px', fontStyle: 'italic' }}>
                            "{req.message}"
                          </p>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                        <span className="badge" style={{ background: `${status.color}15`, color: status.color }}>
                          {status.label}
                        </span>
                        {isPending && (
                          <>
                            <button
                              className="btn btn-sm"
                              style={{ background: '#10b98120', color: '#10b981', border: 'none', fontWeight: 600 }}
                              onClick={() => handleAcceptClick(req)}
                              disabled={processing}
                            >
                              <Check size={14} />
                              Chấp nhận
                            </button>
                            <button
                              className="btn btn-sm"
                              style={{ background: '#ef444420', color: '#ef4444', border: 'none', fontWeight: 600 }}
                              onClick={() => handleReject(req.id)}
                              disabled={processing}
                            >
                              <XCircle size={14} />
                              Từ chối
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  Không có yêu cầu nào
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Accept Request Modal */}
      {showAcceptModal && selectedRequest && (
        <div className="modal-overlay" onClick={() => setShowAcceptModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Chấp nhận yêu cầu thuê phòng</h3>
              <button onClick={() => setShowAcceptModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ background: 'var(--primary-50)', padding: '16px', borderRadius: '12px', marginBottom: '20px' }}>
                <p style={{ fontWeight: 600, marginBottom: '4px' }}>{selectedRequest.room_title}</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Khách thuê: <strong>{selectedRequest.tenant_name}</strong> · {selectedRequest.num_people} người
                </p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Giá phòng: <strong>{formatCurrency(selectedRequest.room_price || 0)}/tháng</strong>
                </p>
              </div>
              <div className="input-group">
                <label className="input-label">Ngày bắt đầu hợp đồng *</label>
                <input
                  type="date"
                  className="input-field"
                  value={contractForm.startDate}
                  onChange={(e) => setContractForm({ ...contractForm, startDate: e.target.value })}
                />
              </div>
              <div className="input-group" style={{ marginTop: '16px' }}>
                <label className="input-label">Ngày kết thúc hợp đồng *</label>
                <input
                  type="date"
                  className="input-field"
                  value={contractForm.endDate}
                  onChange={(e) => setContractForm({ ...contractForm, endDate: e.target.value })}
                />
              </div>
              <div className="input-group" style={{ marginTop: '16px' }}>
                <label className="input-label">Điều khoản hợp đồng (tùy chọn)</label>
                <textarea
                  className="input-field"
                  rows={4}
                  placeholder="Nhập các điều khoản hợp đồng..."
                  value={contractForm.terms}
                  onChange={(e) => setContractForm({ ...contractForm, terms: e.target.value })}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAcceptModal(false)}>Hủy</button>
              <button className="btn btn-primary" onClick={handleAcceptSubmit} disabled={processing}>
                {processing ? 'Đang xử lý...' : 'Tạo hợp đồng & Chấp nhận'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

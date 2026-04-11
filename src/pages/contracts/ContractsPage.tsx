import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useBookingStore } from '../../stores/bookingStore';
import { formatCurrency, formatDate, getStatusLabel } from '../../utils/helpers';
import { FileText, Download, Eye, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import './ContractsPage.css';

export default function ContractsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { contracts, fetchMyContracts, isLoading } = useBookingStore();
  const [activeTab, setActiveTab] = useState('active');

  useEffect(() => {
    if (user) {
      fetchMyContracts(user.role === 'landlord' ? 'landlord' : 'tenant');
    }
  }, [user]);

  if (!user) {
    return (
      <div style={{ paddingTop: '120px', textAlign: 'center', minHeight: '60vh' }}>
        <h2>Vui lòng đăng nhập để xem hợp đồng</h2>
        <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={() => navigate('/login')}>Đăng nhập</button>
      </div>
    );
  }

  const filteredContracts = contracts.filter(c => {
    if (activeTab === 'active') return c.status === 'active';
    if (activeTab === 'pending') return c.status === 'pending' || c.status === 'draft' || c.status === 'pending_signature';
    if (activeTab === 'expired') return c.status === 'expired' || c.status === 'terminated';
    return true;
  });

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'active': return <CheckCircle2 size={16} color="var(--success-500)" />;
      case 'pending': case 'draft': case 'pending_signature': return <Clock size={16} color="var(--warning-500)" />;
      default: return <AlertCircle size={16} color="var(--error-500)" />;
    }
  };

  return (
    <div style={{ paddingTop: '68px', minHeight: '100vh', background: 'var(--bg-secondary)' }}>
      <div className="container" style={{ paddingTop: 'var(--space-8)', paddingBottom: 'var(--space-16)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
          <div>
            <h1 style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 800 }}>Quản lý hợp đồng</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: 'var(--space-1)' }}>
              Xem và quản lý các hợp đồng thuê phòng của bạn
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs" style={{ marginBottom: 'var(--space-6)' }}>
          <button 
            className={`tab ${activeTab === 'active' ? 'active' : ''}`}
            onClick={() => setActiveTab('active')}
          >
            Đang hiệu lực
          </button>
          <button 
            className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            Chờ xác nhận
          </button>
          <button 
            className={`tab ${activeTab === 'expired' ? 'active' : ''}`}
            onClick={() => setActiveTab('expired')}
          >
            Đã hết hạn/Hủy
          </button>
        </div>

        {/* Loading */}
        {isLoading && (
          <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
            <p>Đang tải dữ liệu...</p>
          </div>
        )}

        {/* Contracts List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {!isLoading && filteredContracts.length > 0 ? (
            filteredContracts.map(contract => {
              const statusInfo = getStatusLabel(contract.status);

              return (
                <div key={contract.id} className="contract-card">
                  <div className="contract-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                      <FileText size={24} color="var(--primary-500)" />
                      <div>
                        <h3 className="contract-title">Hợp đồng thuê phòng: {contract.room_title || 'Phòng trọ'}</h3>
                        <p className="contract-id">Mã HĐ: {(contract.contract_number || contract.id).toUpperCase()}</p>
                      </div>
                    </div>
                    <span className="badge" style={{ background: `${statusInfo.color}15`, color: statusInfo.color }}>
                      {getStatusIcon(contract.status)}
                      <span style={{ marginLeft: '4px' }}>{statusInfo.label}</span>
                    </span>
                  </div>

                  <div className="contract-body">
                    <div className="contract-info-grid">
                      <div className="contract-info-item">
                        <span className="contract-info-label">Bên Mướn (Tenant)</span>
                        <span className="contract-info-value">{contract.tenant_name || 'N/A'}</span>
                      </div>
                      <div className="contract-info-item">
                        <span className="contract-info-label">Bên Cho Thuê (Landlord)</span>
                        <span className="contract-info-value">{contract.landlord_name || 'N/A'}</span>
                      </div>
                      <div className="contract-info-item">
                        <span className="contract-info-label">Thời gian</span>
                        <span className="contract-info-value">{formatDate(contract.start_date)} - {formatDate(contract.end_date)}</span>
                      </div>
                      <div className="contract-info-item">
                        <span className="contract-info-label">Giá thuê/tháng</span>
                        <span className="contract-info-value" style={{ color: 'var(--primary-700)', fontWeight: 700 }}>
                          {formatCurrency(contract.monthly_rent)}
                        </span>
                      </div>
                      <div className="contract-info-item">
                        <span className="contract-info-label">Tiền cọc</span>
                        <span className="contract-info-value">{formatCurrency(contract.deposit_amount)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="contract-footer">
                    <button className="btn btn-ghost btn-sm" onClick={() => alert('Đang tải file...')}>
                      <Download size={16} /> Tải PDF
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={() => alert('Xem chi tiết hợp đồng')}>
                      <Eye size={16} /> Xem chi tiết
                    </button>
                  </div>
                </div>
              );
            })
          ) : !isLoading ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-12)', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)' }}>
              <FileText size={48} color="var(--text-tertiary)" style={{ margin: '0 auto var(--space-4)' }} />
              <h3>Không có hợp đồng nào</h3>
              <p style={{ color: 'var(--text-secondary)' }}>Bạn chưa có hợp đồng nào trong mục này.</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

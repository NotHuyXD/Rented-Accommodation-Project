import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useAppStore } from '../../stores/appStore';
import { contractApi } from '../../api/services';
import { formatCurrency, formatDate, getStatusLabel } from '../../utils/helpers';
import { FileText, Download, Eye, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import './ContractsPage.css';

export default function ContractsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { contracts, fetchContracts, isLoading } = useAppStore();
  const [activeTab, setActiveTab] = useState('active');

  useEffect(() => {
    if (user) fetchContracts();
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
    if (activeTab === 'pending') return c.status === 'pending_sign';
    if (activeTab === 'expired') return c.status === 'expired' || c.status === 'terminated';
    return true;
  });

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'active': return <CheckCircle2 size={16} color="var(--success-500)" />;
      case 'pending_sign': return <Clock size={16} color="var(--warning-500)" />;
      default: return <AlertCircle size={16} color="var(--error-500)" />;
    }
  };

  const handleSign = async (contractId: string) => {
    try {
      await contractApi.sign(contractId);
      fetchContracts();
      alert('Ký hợp đồng thành công!');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi ký hợp đồng');
    }
  };

  return (
    <div style={{ paddingTop: '68px', minHeight: '100vh', background: 'var(--bg-secondary)' }}>
      <div className="container" style={{ paddingTop: '32px', paddingBottom: '64px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 800 }}>Quản lý hợp đồng</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
              Xem và quản lý các hợp đồng thuê phòng
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs" style={{ marginBottom: '24px' }}>
          <button className={`tab ${activeTab === 'active' ? 'active' : ''}`} onClick={() => setActiveTab('active')}>
            Đang hiệu lực
          </button>
          <button className={`tab ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => setActiveTab('pending')}>
            Chờ ký
          </button>
          <button className={`tab ${activeTab === 'expired' ? 'active' : ''}`} onClick={() => setActiveTab('expired')}>
            Đã hết hạn/Hủy
          </button>
        </div>

        {isLoading && (
          <div style={{ textAlign: 'center', padding: '32px' }}>
            <p>Đang tải dữ liệu...</p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {!isLoading && filteredContracts.length > 0 ? (
            filteredContracts.map(contract => {
              const statusInfo = getStatusLabel(contract.status);
              return (
                <div key={contract.id} className="contract-card">
                  <div className="contract-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <FileText size={24} color="var(--primary-500)" />
                      <div>
                        <h3 className="contract-title">HĐ: {contract.room_title || 'Phòng trọ'}</h3>
                        <p className="contract-id">Mã: {contract.id.substring(0, 8).toUpperCase()}</p>
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
                        <span className="contract-info-label">Người thuê</span>
                        <span className="contract-info-value">{contract.tenant_name}</span>
                      </div>
                      <div className="contract-info-item">
                        <span className="contract-info-label">Chủ trọ</span>
                        <span className="contract-info-value">{contract.landlord_name}</span>
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
                    {contract.status === 'pending_sign' && (
                      <button className="btn btn-primary btn-sm" onClick={() => handleSign(contract.id)}>
                        <CheckCircle2 size={16} /> Ký hợp đồng
                      </button>
                    )}
                
                  </div>
                </div>
              );
            })
          ) : !isLoading ? (
            <div style={{ textAlign: 'center', padding: '48px', background: 'var(--bg-card)', borderRadius: '16px' }}>
              <FileText size={48} color="var(--text-tertiary)" style={{ margin: '0 auto 16px' }} />
              <h3>Không có hợp đồng nào</h3>
              <p style={{ color: 'var(--text-secondary)' }}>Bạn chưa có hợp đồng nào trong mục này.</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

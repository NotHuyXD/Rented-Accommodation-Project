import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useAppStore } from '../../stores/appStore';
import { contractApi } from '../../api/services';
import { formatCurrency, formatDate, getStatusLabel } from '../../utils/helpers';
import { FileText, Clock, CheckCircle2, AlertCircle, Printer, X } from 'lucide-react';
import type { Contract } from '../../types';
import './ContractsPage.css';

export default function ContractsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { contracts, fetchContracts, isLoading } = useAppStore();
  const [activeTab, setActiveTab] = useState('active');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);

  useEffect(() => {
    if (user) fetchContracts();
  }, [user, fetchContracts]);

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
      setShowSuccessModal(true);
      setTimeout(() => {
        setShowSuccessModal(false);
        fetchContracts();
      }, 2000);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || 'Lỗi ký hợp đồng');
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
                    <button className="btn btn-secondary btn-sm" onClick={() => setSelectedContract(contract as Contract)}>
                      <FileText size={16} /> Xem PDF
                    </button>
                    {contract.status === 'pending_sign' && contract.tenant_id === user?.id && (
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

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="contract-modal-overlay">
          <div className="contract-modal-content">
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--success-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <CheckCircle2 color="var(--success-500)" size={48} />
            </div>
            <h3 className="contract-modal-title">Ký hợp đồng thành công!</h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              Hợp đồng của bạn đã được ký xác nhận.
            </p>
          </div>
        </div>
      )}

      {/* PDF Modal */}
      {selectedContract && (
        <div className="contract-modal-overlay">
          <div className="pdf-modal-content">
            <div className="pdf-header">
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Chi tiết hợp đồng</h2>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-primary btn-sm" onClick={() => window.print()}>
                  <Printer size={16} /> Tải xuống / In PDF
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => setSelectedContract(null)}>
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <div className="pdf-document">
              <h1>HỢP ĐỒNG THUÊ PHÒNG TRỌ</h1>
              <p style={{ textAlign: 'center', marginBottom: '32px' }}>Mã hợp đồng: {selectedContract.id.toUpperCase()}</p>
              
              <div className="pdf-section">
                <h3>BÊN CHO THUÊ (BÊN A)</h3>
                <div className="pdf-row"><div className="pdf-label">Họ và tên:</div><div className="pdf-value">{selectedContract.landlord_name}</div></div>
                <div className="pdf-row"><div className="pdf-label">Số điện thoại:</div><div className="pdf-value">{selectedContract.landlord_phone || 'Chưa cập nhật'}</div></div>
              </div>

              <div className="pdf-section">
                <h3>BÊN THUÊ (BÊN B)</h3>
                <div className="pdf-row"><div className="pdf-label">Họ và tên:</div><div className="pdf-value">{selectedContract.tenant_name}</div></div>
                <div className="pdf-row"><div className="pdf-label">Số điện thoại:</div><div className="pdf-value">{selectedContract.tenant_phone || 'Chưa cập nhật'}</div></div>
              </div>

              <div className="pdf-section">
                <h3>THÔNG TIN PHÒNG THUÊ</h3>
                <div className="pdf-row"><div className="pdf-label">Phòng:</div><div className="pdf-value">{selectedContract.room_title || 'Phòng trọ'}</div></div>
                <div className="pdf-row"><div className="pdf-label">Địa chỉ:</div><div className="pdf-value">{selectedContract.room_address || 'Chưa cập nhật'}</div></div>
                <div className="pdf-row"><div className="pdf-label">Thời hạn thuê:</div><div className="pdf-value">Từ {formatDate(selectedContract.start_date)} đến {formatDate(selectedContract.end_date)}</div></div>
                <div className="pdf-row"><div className="pdf-label">Giá thuê/tháng:</div><div className="pdf-value">{formatCurrency(selectedContract.monthly_rent)}</div></div>
                <div className="pdf-row"><div className="pdf-label">Tiền cọc:</div><div className="pdf-value">{formatCurrency(selectedContract.deposit_amount)}</div></div>
              </div>

              <div className="pdf-section">
                <h3>ĐIỀU KHOẢN KHÁC</h3>
                <p>{selectedContract.terms || 'Theo quy định chung của nhà trọ.'}</p>
              </div>

              <div className="pdf-signatures">
                <div className="pdf-signature-box">
                  <p><strong>ĐẠI DIỆN BÊN A</strong></p>
                  <p style={{ marginTop: '80px' }}>{selectedContract.landlord_name}</p>
                </div>
                <div className="pdf-signature-box">
                  <p><strong>ĐẠI DIỆN BÊN B</strong></p>
                  {selectedContract.status === 'active' || selectedContract.status === 'expired' || selectedContract.status === 'terminated' ? (
                    <p style={{ marginTop: '80px' }}>{selectedContract.tenant_name}</p>
                  ) : (
                    <p style={{ marginTop: '80px', color: '#999', fontStyle: 'italic' }}>(Chưa ký)</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
 

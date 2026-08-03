import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useAppStore } from '../../stores/appStore';
import { contractApi, invoiceApi } from '../../api/services';
import { formatCurrency, formatDate, getStatusLabel } from '../../utils/helpers';
import { FileText, Clock, CheckCircle2, AlertCircle, Printer, X, Receipt, XCircle } from 'lucide-react';
import type { Contract } from '../../types';
import './ContractsPage.css';
import { alertQuick, confirmAsync } from '../../stores/modalStore';

export default function ContractsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { contracts, fetchContracts, isLoading } = useAppStore();
  const [activeTab, setActiveTab] = useState('active');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceContract, setInvoiceContract] = useState<Contract | null>(null);
  const [invoiceForm, setInvoiceForm] = useState({
    periodMonth: new Date().toISOString().slice(0, 7),
    electricUsage: 100,
    waterUsage: 15,
    electricFee: 350000,
    waterFee: 150000,
    otherFees: 100000,
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
  });
  const [submittingInvoice, setSubmittingInvoice] = useState(false);

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
      alertQuick('error', error.response?.data?.message || 'Lỗi ký hợp đồng');
    }
  };

  const handleOpenInvoiceModal = (contract: Contract) => {
    setInvoiceContract(contract);
    setInvoiceForm({
      periodMonth: new Date().toISOString().slice(0, 7),
      electricUsage: 100,
      waterUsage: 15,
      electricFee: 350000,
      waterFee: 150000,
      otherFees: 100000,
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    });
    setShowInvoiceModal(true);
  };

  const handleCreateInvoice = async () => {
    if (!invoiceContract) return;
    setSubmittingInvoice(true);
    try {
      await invoiceApi.create({
        contractId: invoiceContract.id,
        periodMonth: `${invoiceForm.periodMonth}-01`,
        baseRent: Number(invoiceContract.monthly_rent),
        electricUsage: Number(invoiceForm.electricUsage),
        waterUsage: Number(invoiceForm.waterUsage),
        electricFee: Number(invoiceForm.electricFee),
        waterFee: Number(invoiceForm.waterFee),
        otherFees: Number(invoiceForm.otherFees),
        dueDate: invoiceForm.dueDate,
      });
      alertQuick('success', 'Đã lập hóa đơn tháng thành công!');
      setShowInvoiceModal(false);
      setInvoiceContract(null);
    } catch (err: any) {
      alertQuick('error', err.response?.data?.message || 'Lỗi lập hóa đơn');
    } finally {
      setSubmittingInvoice(false);
    }
  };

  const handleTerminateContract = async (id: string) => {
    if (!(await confirmAsync('Xác nhận trả phòng', 'Bạn có chắc muốn chấm dứt hợp đồng này và thanh lý phòng?'))) return;
    try {
      await contractApi.terminate(id);
      alertQuick('success', 'Đã chấm dứt hợp đồng thành công!');
      fetchContracts();
    } catch (err: any) {
      alertQuick('error', err.response?.data?.message || 'Lỗi chấm dứt hợp đồng');
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
                    {contract.status === 'active' && user?.role === 'landlord' && (
                      <button className="btn btn-accent btn-sm" onClick={() => handleOpenInvoiceModal(contract as Contract)}>
                        <Receipt size={16} /> Lập hóa đơn
                      </button>
                    )}
                    {contract.status === 'active' && (
                      <button
                        className="btn btn-sm"
                        style={{ background: '#ef444415', color: '#ef4444', border: 'none', fontWeight: 600 }}
                        onClick={() => handleTerminateContract(contract.id)}
                      >
                        <XCircle size={16} /> Trả phòng / Thanh lý
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

      {/* Create Invoice Modal */}
      {showInvoiceModal && invoiceContract && (
        <div className="modal-overlay" onClick={() => setShowInvoiceModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>Lập hóa đơn tháng</h3>
              <button onClick={() => setShowInvoiceModal(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ padding: '20px' }}>
              <p style={{ marginBottom: '16px', color: 'var(--text-secondary)' }}>
                Phòng: <strong>{invoiceContract.room_title}</strong> - Khách: <strong>{invoiceContract.tenant_name}</strong>
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: 600, fontSize: '0.9rem' }}>Tháng hóa đơn (YYYY-MM):</label>
                  <input
                    type="month"
                    className="form-control"
                    value={invoiceForm.periodMonth}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, periodMonth: e.target.value })}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: 600, fontSize: '0.9rem' }}>Tiền điện (VNĐ):</label>
                    <input
                      type="number"
                      className="form-control"
                      value={invoiceForm.electricFee}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, electricFee: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: 600, fontSize: '0.9rem' }}>Tiền nước (VNĐ):</label>
                    <input
                      type="number"
                      className="form-control"
                      value={invoiceForm.waterFee}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, waterFee: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: 600, fontSize: '0.9rem' }}>Phí dịch vụ khác (rác, wifi, gửi xe...):</label>
                  <input
                    type="number"
                    className="form-control"
                    value={invoiceForm.otherFees}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, otherFees: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: 600, fontSize: '0.9rem' }}>Hạn thanh toán:</label>
                  <input
                    type="date"
                    className="form-control"
                    value={invoiceForm.dueDate}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
                  />
                </div>
                <div style={{ marginTop: '8px', padding: '12px', background: 'var(--bg-card)', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>Tiền thuê phòng:</span>
                    <strong>{formatCurrency(invoiceContract.monthly_rent)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', color: 'var(--primary-600)', borderTop: '1px solid var(--border-color)', paddingTop: '8px' }}>
                    <strong>Tổng cộng:</strong>
                    <strong>{formatCurrency(Number(invoiceContract.monthly_rent) + Number(invoiceForm.electricFee) + Number(invoiceForm.waterFee) + Number(invoiceForm.otherFees))}</strong>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button className="btn btn-secondary" onClick={() => setShowInvoiceModal(false)}>Hủy</button>
              <button className="btn btn-primary" onClick={handleCreateInvoice} disabled={submittingInvoice}>
                {submittingInvoice ? 'Đang tạo...' : 'Tạo hóa đơn'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

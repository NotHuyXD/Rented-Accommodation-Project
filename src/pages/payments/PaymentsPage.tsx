import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useBookingStore } from '../../stores/bookingStore';
import { formatCurrency, formatDate, getStatusLabel } from '../../utils/helpers';
import { Receipt, DollarSign, Download, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import './PaymentsPage.css';

export default function PaymentsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { invoices, fetchMyInvoices, isLoading } = useBookingStore();
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (user) {
      fetchMyInvoices();
    }
  }, [user]);

  if (!user) {
    return (
      <div style={{ paddingTop: '120px', textAlign: 'center', minHeight: '60vh' }}>
        <h2>Vui lòng đăng nhập để quản lý thanh toán</h2>
        <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={() => navigate('/login')}>Đăng nhập</button>
      </div>
    );
  }

  const filteredInvoices = invoices.filter(inv => {
    if (activeTab === 'unpaid') return inv.status === 'sent' || inv.status === 'unpaid';
    if (activeTab === 'paid') return inv.status === 'paid';
    if (activeTab === 'overdue') return inv.status === 'overdue';
    return true;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle2 size={16} color="var(--success-500)" />;
      case 'sent': case 'unpaid': return <Clock size={16} color="var(--warning-500)" />;
      default: return <AlertCircle size={16} color="var(--error-500)" />;
    }
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'paid': return { label: 'Đã thanh toán', color: '#10b981' };
      case 'sent': return { label: 'Chờ thanh toán', color: '#f59e0b' };
      case 'overdue': return { label: 'Quá hạn', color: '#ef4444' };
      default: return getStatusLabel(status);
    }
  };

  return (
    <div style={{ paddingTop: '68px', minHeight: '100vh', background: 'var(--bg-secondary)' }}>
      <div className="container" style={{ paddingTop: 'var(--space-8)', paddingBottom: 'var(--space-16)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
          <div>
            <h1 style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 800 }}>Quản lý thanh toán</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: 'var(--space-1)' }}>
              Theo dõi và nhận thanh toán hóa đơn
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs" style={{ marginBottom: 'var(--space-6)' }}>
          <button
            className={`tab ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            Tất cả
          </button>
          <button
            className={`tab ${activeTab === 'unpaid' ? 'active' : ''}`}
            onClick={() => setActiveTab('unpaid')}
          >
            Chưa thanh toán
          </button>
          <button
            className={`tab ${activeTab === 'paid' ? 'active' : ''}`}
            onClick={() => setActiveTab('paid')}
          >
            Đã thanh toán
          </button>
          <button
            className={`tab ${activeTab === 'overdue' ? 'active' : ''}`}
            onClick={() => setActiveTab('overdue')}
          >
            Quá hạn
          </button>
        </div>

        {/* Loading */}
        {isLoading && (
          <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
            <p>Đang tải dữ liệu...</p>
          </div>
        )}

        {/* Invoices List */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 'var(--space-6)' }}>
          {!isLoading && filteredInvoices.length > 0 ? (
            filteredInvoices.map(invoice => {
              const statusInfo = getStatusDisplay(invoice.status);

              return (
                <div key={invoice.id} className="invoice-card">
                  <div className="invoice-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                      <Receipt size={24} color="var(--primary-500)" />
                      <div>
                        <h3 className="invoice-title">
                          Hóa đơn T{invoice.billing_month}/{invoice.billing_year}
                        </h3>
                        <p className="invoice-id">Mã: {invoice.invoice_number || invoice.id}</p>
                      </div>
                    </div>
                  </div>

                  <div className="invoice-amount-box">
                    <span className="invoice-amount-label">Tổng cộng</span>
                    <span className="invoice-amount-value">{formatCurrency(invoice.total_amount)}</span>
                  </div>

                  <div className="invoice-details">
                    <div className="invoice-detail-row">
                      <span>Phòng:</span>
                      <span style={{ fontWeight: 600 }}>{invoice.room_title || 'N/A'}</span>
                    </div>
                    <div className="invoice-detail-row">
                      <span>Kỳ hạn thanh toán:</span>
                      <span style={{ fontWeight: 600 }}>{invoice.due_date ? formatDate(invoice.due_date) : 'N/A'}</span>
                    </div>
                    <div className="invoice-detail-row">
                      <span>Trạng thái:</span>
                      <span className="badge" style={{ background: `${statusInfo.color}15`, color: statusInfo.color }}>
                        {getStatusIcon(invoice.status)}
                        <span style={{ marginLeft: '4px' }}>{statusInfo.label}</span>
                      </span>
                    </div>
                  </div>

                  <div className="invoice-items">
                    {invoice.rent_amount > 0 && (
                      <div className="invoice-item-row">
                        <span>Tiền phòng</span>
                        <span>{formatCurrency(invoice.rent_amount)}</span>
                      </div>
                    )}
                    {invoice.utility_amount > 0 && (
                      <div className="invoice-item-row">
                        <span>Điện/Nước</span>
                        <span>{formatCurrency(invoice.utility_amount)}</span>
                      </div>
                    )}
                    {invoice.service_amount > 0 && (
                      <div className="invoice-item-row">
                        <span>Dịch vụ</span>
                        <span>{formatCurrency(invoice.service_amount)}</span>
                      </div>
                    )}
                    {invoice.other_amount > 0 && (
                      <div className="invoice-item-row">
                        <span>Khác</span>
                        <span>{formatCurrency(invoice.other_amount)}</span>
                      </div>
                    )}
                    {invoice.discount_amount > 0 && (
                      <div className="invoice-item-row">
                        <span>Giảm giá</span>
                        <span>-{formatCurrency(invoice.discount_amount)}</span>
                      </div>
                    )}
                  </div>

                  <div className="invoice-footer">
                    <button className="btn btn-ghost btn-sm">
                      <Download size={16} /> Tải về
                    </button>
                    {user.role === 'tenant' && invoice.status !== 'paid' && (
                      <button className="btn btn-primary btn-sm">
                        <DollarSign size={16} /> Thanh toán
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : !isLoading ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 'var(--space-12)', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)' }}>
              <Receipt size={48} color="var(--text-tertiary)" style={{ margin: '0 auto var(--space-4)' }} />
              <h3>Không có hóa đơn nào</h3>
              <p style={{ color: 'var(--text-secondary)' }}>Mục này không có dữ liệu để hiển thị.</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

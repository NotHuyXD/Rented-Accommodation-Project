import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useAppStore } from '../../stores/appStore';
import { paymentApi } from '../../api/services';
import { formatCurrency, formatDate, getStatusLabel, getPaymentMethodLabel } from '../../utils/helpers';
import type { Invoice } from '../../types';
import { Receipt, DollarSign, CheckCircle2, Clock, AlertCircle, CreditCard } from 'lucide-react';
import './PaymentsPage.css';

export default function PaymentsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { invoices, fetchInvoices, isLoading } = useAppStore();
  const [activeTab, setActiveTab] = useState('all');
  const [payingId, setPayingId] = useState<string | null>(null);

  useEffect(() => {
    if (user) fetchInvoices();
  }, [user]);

  if (!user) {
    return (
      <div style={{ paddingTop: '120px', textAlign: 'center', minHeight: '60vh' }}>
        <h2>Vui lòng đăng nhập để quản lý thanh toán</h2>
        <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={() => navigate('/login')}>Đăng nhập</button>
      </div>
    );
  }

  const filteredInvoices = invoices.filter((inv: Invoice) => {
    if (activeTab === 'unpaid') return inv.status === 'unpaid';
    if (activeTab === 'paid') return inv.status === 'paid';
    if (activeTab === 'overdue') return inv.status === 'overdue';
    return true;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle2 size={16} color="var(--success-500)" />;
      case 'unpaid': return <Clock size={16} color="var(--warning-500)" />;
      default: return <AlertCircle size={16} color="var(--error-500)" />;
    }
  };

  const handlePay = async (invoiceId: string, total: number) => {
    setPayingId(invoiceId);
    try {
      await paymentApi.create({
        invoiceId,
        amount: total,
        method: 'bank_transfer',
      });
      alert('Thanh toán thành công!');
      fetchInvoices();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi thanh toán');
    } finally {
      setPayingId(null);
    }
  };

  return (
    <div style={{ paddingTop: '68px', minHeight: '100vh', background: 'var(--bg-secondary)' }}>
      <div className="container" style={{ paddingTop: '32px', paddingBottom: '64px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 800 }}>Quản lý hóa đơn</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
              Theo dõi và thanh toán hóa đơn hàng tháng
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs" style={{ marginBottom: '24px' }}>
          <button className={`tab ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>
            Tất cả
          </button>
          <button className={`tab ${activeTab === 'unpaid' ? 'active' : ''}`} onClick={() => setActiveTab('unpaid')}>
            Chưa thanh toán
          </button>
          <button className={`tab ${activeTab === 'paid' ? 'active' : ''}`} onClick={() => setActiveTab('paid')}>
            Đã thanh toán
          </button>
          <button className={`tab ${activeTab === 'overdue' ? 'active' : ''}`} onClick={() => setActiveTab('overdue')}>
            Quá hạn
          </button>
        </div>

        {isLoading && (
          <div style={{ textAlign: 'center', padding: '32px' }}><p>Đang tải dữ liệu...</p></div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
          {!isLoading && filteredInvoices.length > 0 ? (
            filteredInvoices.map((invoice: Invoice) => {
              const statusInfo = getStatusLabel(invoice.status);
              return (
                <div key={invoice.id} className="invoice-card">
                  <div className="invoice-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Receipt size={24} color="var(--primary-500)" />
                      <div>
                        <h3 className="invoice-title">
                          Hóa đơn {invoice.period_month}
                        </h3>
                        <p className="invoice-id">{invoice.room_title}</p>
                      </div>
                    </div>
                  </div>

                  <div className="invoice-amount-box">
                    <span className="invoice-amount-label">Tổng cộng</span>
                    <span className="invoice-amount-value">{formatCurrency(parseFloat(String(invoice.total)))}</span>
                  </div>

                  <div className="invoice-details">
                    <div className="invoice-detail-row">
                      <span>Tiền phòng:</span>
                      <span>{formatCurrency(parseFloat(String(invoice.base_rent)))}</span>
                    </div>
                    {parseFloat(String(invoice.electric_fee)) > 0 && (
                      <div className="invoice-detail-row">
                        <span>Điện ({invoice.electric_usage} kWh):</span>
                        <span>{formatCurrency(parseFloat(String(invoice.electric_fee)))}</span>
                      </div>
                    )}
                    {parseFloat(String(invoice.water_fee)) > 0 && (
                      <div className="invoice-detail-row">
                        <span>Nước ({invoice.water_usage} m³):</span>
                        <span>{formatCurrency(parseFloat(String(invoice.water_fee)))}</span>
                      </div>
                    )}
                    {parseFloat(String(invoice.other_fees)) > 0 && (
                      <div className="invoice-detail-row">
                        <span>Phí khác:</span>
                        <span>{formatCurrency(parseFloat(String(invoice.other_fees)))}</span>
                      </div>
                    )}
                    <div className="invoice-detail-row">
                      <span>Hạn thanh toán:</span>
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

                  <div className="invoice-footer">
                    {user.role === 'tenant' && (invoice.status === 'unpaid' || invoice.status === 'overdue') && (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handlePay(invoice.id, parseFloat(String(invoice.total)))}
                        disabled={payingId === invoice.id}
                      >
                        <CreditCard size={16} />
                        {payingId === invoice.id ? 'Đang xử lý...' : 'Thanh toán'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : !isLoading ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '48px', background: 'var(--bg-card)', borderRadius: '16px' }}>
              <Receipt size={48} color="var(--text-tertiary)" style={{ margin: '0 auto 16px' }} />
              <h3>Không có hóa đơn nào</h3>
              <p style={{ color: 'var(--text-secondary)' }}>Mục này không có dữ liệu.</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

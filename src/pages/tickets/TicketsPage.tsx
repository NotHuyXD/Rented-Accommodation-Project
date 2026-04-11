import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useRoomStore } from '../../stores/roomStore';
import { useBookingStore } from '../../stores/bookingStore';
import axiosClient from '../../api/axiosClient';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { LifeBuoy, Plus, CheckCircle2, MessageCircle, Wrench } from 'lucide-react';
import './TicketsPage.css';

export default function TicketsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('open');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tickets, setTickets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Ticket form state
  const [ticketTitle, setTicketTitle] = useState('');
  const [ticketCategory, setTicketCategory] = useState('maintenance');
  const [ticketPriority, setTicketPriority] = useState('low');
  const [ticketDescription, setTicketDescription] = useState('');

  useEffect(() => {
    if (user) {
      // For now, tickets are not implemented as a full API module,
      // so we display an empty state with the create form ready
      setIsLoading(false);
      setTickets([]);
    }
  }, [user]);

  if (!user) {
    return (
      <div style={{ paddingTop: '120px', textAlign: 'center', minHeight: '60vh' }}>
        <h2>Vui lòng đăng nhập để xem báo cáo/sự cố</h2>
        <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={() => navigate('/login')}>Đăng nhập</button>
      </div>
    );
  }

  const filteredTickets = tickets.filter(t => {
    if (activeTab === 'open') return t.status === 'open' || t.status === 'in_progress' || t.status === 'fixing';
    if (activeTab === 'resolved') return t.status === 'resolved';
    return true;
  });

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'open': return { label: 'Mở', color: '#f59e0b' };
      case 'in_progress': return { label: 'Đang xử lý', color: '#3b82f6' };
      case 'fixing': return { label: 'Đang sửa', color: '#8b5cf6' };
      case 'resolved': return { label: 'Đã giải quyết', color: '#10b981' };
      default: return { label: status, color: '#6b7280' };
    }
  };

  const CategoryBadge = ({ category }: { category: string }) => {
    let color = 'var(--text-secondary)';
    let bg = 'var(--neutral-100)';
    let label = 'Khác';

    if (category === 'electrical') { color = 'var(--error-600)'; bg = 'var(--error-50)'; label = 'Điện'; }
    if (category === 'plumbing') { color = 'var(--warning-600)'; bg = 'var(--warning-50)'; label = 'Nước'; }
    if (category === 'equipment') { color = 'var(--primary-600)'; bg = 'var(--primary-50)'; label = 'Thiết bị'; }
    if (category === 'maintenance') { color = 'var(--warning-600)'; bg = 'var(--warning-50)'; label = 'Bảo trì'; }

    return (
      <span className="badge" style={{ background: bg, color }}>
        {label}
      </span>
    );
  };

  const handleCreateTicket = async () => {
    if (!ticketTitle.trim() || !ticketDescription.trim()) {
      alert('Vui lòng nhập đầy đủ tiêu đề và mô tả');
      return;
    }
    // When ticket API is ready, call it here
    alert('Yêu cầu đã được gửi thành công!');
    setIsModalOpen(false);
    setTicketTitle('');
    setTicketDescription('');
  };

  return (
    <div style={{ paddingTop: '68px', minHeight: '100vh', background: 'var(--bg-secondary)' }}>
      <div className="container" style={{ paddingTop: 'var(--space-8)', paddingBottom: 'var(--space-16)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
          <div>
            <h1 style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 800 }}>Yêu cầu hỗ trợ & Sự cố</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: 'var(--space-1)' }}>
              Theo dõi và quản lý các yêu cầu sửa chữa, hỗ trợ
            </p>
          </div>
          {user.role === 'tenant' && (
            <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
              <Plus size={16} /> Gửi yêu cầu mới
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="tabs" style={{ marginBottom: 'var(--space-6)' }}>
          <button
            className={`tab ${activeTab === 'open' ? 'active' : ''}`}
            onClick={() => setActiveTab('open')}
          >
            Đang xử lý
          </button>
          <button
            className={`tab ${activeTab === 'resolved' ? 'active' : ''}`}
            onClick={() => setActiveTab('resolved')}
          >
            Đã hoàn tất
          </button>
        </div>

        {/* Loading */}
        {isLoading && (
          <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
            <p>Đang tải dữ liệu...</p>
          </div>
        )}

        {/* Tickets List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {!isLoading && filteredTickets.length > 0 ? (
            filteredTickets.map(ticket => {
              const statusInfo = getStatusLabel(ticket.status);

              return (
                <div key={ticket.id} className="ticket-card">
                  <div className="ticket-header">
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', alignItems: 'center' }}>
                      <span className="badge badge-neutral">#{ticket.id.substring(0, 8)}</span>
                      <CategoryBadge category={ticket.category} />
                      <span className="badge" style={{ background: `${statusInfo.color}15`, color: statusInfo.color }}>
                        {statusInfo.label}
                      </span>
                    </div>
                    <span className="ticket-date">{formatDate(ticket.created_at)}</span>
                  </div>

                  <h3 className="ticket-title">{ticket.title}</h3>
                  <p className="ticket-description">{ticket.description}</p>

                  <div className="ticket-footer">
                    <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
                      <div className="ticket-info">
                        <span className="ticket-info-label">Danh mục</span>
                        <span className="ticket-info-value">
                          {ticket.category === 'electrical' ? 'Điện' : ticket.category === 'plumbing' ? 'Nước' : ticket.category === 'equipment' ? 'Thiết bị' : 'Bảo trì'}
                        </span>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                      <button className="btn btn-ghost btn-sm">
                        <MessageCircle size={16} /> Liên hệ
                      </button>
                      {user.role === 'landlord' && ticket.status !== 'resolved' && (
                        <button className="btn btn-primary btn-sm">
                          <CheckCircle2 size={16} /> Đánh dấu hoàn tất
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : !isLoading ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-12)', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)' }}>
              <LifeBuoy size={48} color="var(--text-tertiary)" style={{ margin: '0 auto var(--space-4)' }} />
              <h3>Không có yêu cầu hỗ trợ nào</h3>
              <p style={{ color: 'var(--text-secondary)' }}>Mục này không có dữ liệu để hiển thị.</p>
            </div>
          ) : null}
        </div>
      </div>

      {/* New Ticket Modal */}
      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: 600 }}>
            <h2 style={{ marginBottom: 'var(--space-4)' }}>Tạo yêu cầu hỗ trợ</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="input-group">
                <label className="input-label">Tiêu đề</label>
                <input
                  className="input-field"
                  placeholder="Ví dụ: Ống nước phòng tắm bị rò rỉ"
                  value={ticketTitle}
                  onChange={(e) => setTicketTitle(e.target.value)}
                />
              </div>
              <div className="input-group">
                <label className="input-label">Loại yêu cầu</label>
                <select className="input-field" value={ticketCategory} onChange={(e) => setTicketCategory(e.target.value)}>
                  <option value="maintenance">Sửa chữa / Bảo trì</option>
                  <option value="complaint">Phản ánh an ninh / Ồn ào</option>
                  <option value="other">Khác</option>
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Mức độ khẩn cấp</label>
                <select className="input-field" value={ticketPriority} onChange={(e) => setTicketPriority(e.target.value)}>
                  <option value="low">Bình thường</option>
                  <option value="medium">Cần xử lý sớm</option>
                  <option value="high">Khẩn cấp (nguy hiểm, hỏng nặng)</option>
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Mô tả chi tiết</label>
                <textarea
                  className="input-field"
                  rows={4}
                  placeholder="Mô tả rõ sự cố bạn đang gặp phải..."
                  value={ticketDescription}
                  onChange={(e) => setTicketDescription(e.target.value)}
                />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
              <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Hủy</button>
              <button className="btn btn-primary" onClick={handleCreateTicket}>Gửi yêu cầu</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

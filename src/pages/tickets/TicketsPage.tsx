import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useRoomStore } from '../../stores/roomStore';
import { mockTickets } from '../../data/mockData';
import { formatDate, getStatusLabel } from '../../utils/helpers';
import { LifeBuoy, Plus, CheckCircle2, MessageCircle } from 'lucide-react';
import './TicketsPage.css';

export default function TicketsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { rooms } = useRoomStore();
  const [activeTab, setActiveTab] = useState('open');
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!user) {
    return (
      <div style={{ paddingTop: '120px', textAlign: 'center', minHeight: '60vh' }}>
        <h2>Vui lòng đăng nhập để xem báo cáo/sự cố</h2>
        <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={() => navigate('/login')}>Đăng nhập</button>
      </div>
    );
  }

  const landlordRoomIds = rooms.filter(r => r.landlordId === user.id).map(r => r.id);
  const myTickets = mockTickets.filter(t =>
    user.role === 'tenant' ? t.tenantId === user.id : landlordRoomIds.includes(t.roomId)
  );

  const filteredTickets = myTickets.filter(t => {
    if (activeTab === 'open') return t.status === 'open' || t.status === 'in_progress' || t.status === 'fixing';
    if (activeTab === 'resolved') return t.status === 'resolved';
    return true;
  });

  const CategoryBadge = ({ category }: { category: string }) => {
    let color = 'var(--text-secondary)';
    let bg = 'var(--neutral-100)';
    let label = 'Khác';

    if (category === 'electrical') { color = 'var(--error-600)'; bg = 'var(--error-50)'; label = 'Điện'; }
    if (category === 'plumbing') { color = 'var(--warning-600)'; bg = 'var(--warning-50)'; label = 'Nước'; }
    if (category === 'equipment') { color = 'var(--primary-600)'; bg = 'var(--primary-50)'; label = 'Thiết bị'; }

    return (
      <span className="badge" style={{ background: bg, color }}>
        {label}
      </span>
    );
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

        {/* Tickets List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {filteredTickets.length > 0 ? (
            filteredTickets.map(ticket => {
              const statusInfo = getStatusLabel(ticket.status);

              return (
                <div key={ticket.id} className="ticket-card">
                  <div className="ticket-header">
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', alignItems: 'center' }}>
                      <span className="badge badge-neutral">#{ticket.id.split('-')[0]}</span>
                      <CategoryBadge category={ticket.category} />
                      <span className="badge" style={{ background: `${statusInfo.color}15`, color: statusInfo.color }}>
                        {statusInfo.label}
                      </span>
                    </div>
                    <span className="ticket-date">{formatDate(ticket.createdAt)}</span>
                  </div>

                  <h3 className="ticket-title">{ticket.title}</h3>
                  <p className="ticket-description">{ticket.description}</p>

                  {ticket.images && ticket.images.length > 0 && (
                    <div className="ticket-images">
                      {ticket.images.map((img, idx) => (
                        <div key={idx} className="ticket-image-thumbnail">
                          <img src={img} alt="Bằng chứng sự cố" />
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="ticket-footer">
                    <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
                      <div className="ticket-info">
                        <span className="ticket-info-label">Danh mục</span>
                        <span className="ticket-info-value">{ticket.category === 'electrical' ? 'Điện' : ticket.category === 'plumbing' ? 'Nước' : ticket.category === 'equipment' ? 'Thiết bị' : 'Khác'}</span>
                      </div>
                      <div className="ticket-info">
                        <span className="ticket-info-label">Cập nhật lúc</span>
                        <span className="ticket-info-value">{formatDate(ticket.resolvedAt || ticket.createdAt)}</span>
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
          ) : (
            <div style={{ textAlign: 'center', padding: 'var(--space-12)', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)' }}>
              <LifeBuoy size={48} color="var(--text-tertiary)" style={{ margin: '0 auto var(--space-4)' }} />
              <h3>Không có yêu cầu hỗ trợ nào</h3>
              <p style={{ color: 'var(--text-secondary)' }}>Mục này không có dữ liệu để hiển thị.</p>
            </div>
          )}
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
                <input className="input-field" placeholder="Ví dụ: Ống nước phòng tắm bị rò rỉ" />
              </div>
              <div className="input-group">
                <label className="input-label">Loại yêu cầu</label>
                <select className="input-field">
                  <option value="maintenance">Sửa chữa / Bảo trì</option>
                  <option value="complaint">Phản ánh an ninh / Ồn ào</option>
                  <option value="other">Khác</option>
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Mức độ khẩn cấp</label>
                <select className="input-field">
                  <option value="low">Bình thường</option>
                  <option value="medium">Cần xử lý sớm</option>
                  <option value="high">Khẩn cấp (nguy hiểm, hỏng nặng)</option>
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Mô tả chi tiết</label>
                <textarea className="input-field" rows={4} placeholder="Mô tả rõ sự cố bạn đang gặp phải..." />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
              <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Hủy</button>
              <button className="btn btn-primary" onClick={() => {
                alert('Yêu cầu đã được gửi!');
                setIsModalOpen(false);
              }}>Gửi yêu cầu</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

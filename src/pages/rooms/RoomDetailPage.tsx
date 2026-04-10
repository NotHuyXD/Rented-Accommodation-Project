import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useRoomStore } from '../../stores/roomStore';
import { useAuthStore } from '../../stores/authStore';
import { useBookingStore } from '../../stores/bookingStore';
import { formatCurrency, formatDate, getStatusLabel } from '../../utils/helpers';
import { mockReviews } from '../../data/mockData';
import { amenityLabels } from '../../data/mockData';
import {
  MapPin, Star, Heart, Share2, Eye, Phone, MessageCircle,
  CalendarDays, ChevronLeft, ChevronRight, User, Shield,
  Wifi, Snowflake, Car, Sofa, Waves, Dumbbell, ArrowUpDown,
  Sun, Trees, Warehouse, PawPrint, Flag, Clock, CheckCircle2,
  ArrowLeft, ExternalLink, Copy
} from 'lucide-react';
import './RoomDetailPage.css';

const iconMap: Record<string, any> = {
  Wifi, Snowflake, Car, Sofa, Waves, Dumbbell, ArrowUpDown,
  Sun, Trees, Warehouse, Shield, WashingMachine: Sofa, Refrigerator: Sofa,
  PawPrint
};

export default function RoomDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { rooms, toggleFavorite, favorites } = useRoomStore();
  const { user, isAuthenticated } = useAuthStore();
  const { createBooking } = useBookingStore();
  const [currentImage, setCurrentImage] = useState(0);
  const [showPhone, setShowPhone] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  const room = rooms.find(r => r.id === id);
  const reviews = mockReviews.filter(r => r.roomId === id);
  const similarRooms = rooms.filter(r => r.id !== id && r.district === room?.district).slice(0, 3);

  if (!room) {
    return (
      <div className="room-detail-page" style={{ paddingTop: '120px', textAlign: 'center' }}>
        <h2>Không tìm thấy phòng</h2>
        <button className="btn btn-primary" onClick={() => navigate('/rooms')}>Quay lại</button>
      </div>
    );
  }

  const isFavorited = favorites.includes(room.id);
  const statusInfo = getStatusLabel(room.status);

  const nextImage = () => setCurrentImage((prev) => (prev + 1) % room.images.length);
  const prevImage = () => setCurrentImage((prev) => (prev - 1 + room.images.length) % room.images.length);

  return (
    <div className="room-detail-page">
      {/* Breadcrumb */}
      <div className="room-detail-breadcrumb">
        <div className="container">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} />
            Quay lại
          </button>
          <nav className="breadcrumb">
            <Link to="/">Trang chủ</Link>
            <span>/</span>
            <Link to="/rooms">Tìm phòng</Link>
            <span>/</span>
            <span className="breadcrumb-current">{room.title}</span>
          </nav>
        </div>
      </div>

      <div className="container">
        {/* Image Gallery */}
        <div className="room-gallery">
          <div className="room-gallery-main">
            <img
              src={room.images[currentImage]}
              alt={`${room.title} - Ảnh ${currentImage + 1}`}
              className="room-gallery-img"
            />
            <button className="room-gallery-nav room-gallery-prev" onClick={prevImage}>
              <ChevronLeft size={24} />
            </button>
            <button className="room-gallery-nav room-gallery-next" onClick={nextImage}>
              <ChevronRight size={24} />
            </button>
            <div className="room-gallery-counter">
              {currentImage + 1} / {room.images.length}
            </div>

            {/* Status Badge */}
            <div className="room-gallery-badges">
              <span
                className="badge"
                style={{ background: `${statusInfo.color}20`, color: statusInfo.color }}
              >
                {statusInfo.label}
              </span>
              {room.isPinned && (
                <span className="badge badge-primary">⭐ Nổi bật</span>
              )}
            </div>
          </div>

          <div className="room-gallery-thumbs">
            {room.images.map((img, index) => (
              <button
                key={index}
                className={`room-gallery-thumb ${index === currentImage ? 'active' : ''}`}
                onClick={() => setCurrentImage(index)}
              >
                <img src={img} alt={`Thumb ${index + 1}`} />
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="room-detail-content">
          <div className="room-detail-main">
            {/* Title & Actions */}
            <div className="room-detail-header">
              <div>
                <h1 className="room-detail-title">{room.title}</h1>
                <div className="room-detail-location">
                  <MapPin size={16} />
                  <span>{room.address}, {room.ward}, {room.district}, {room.city}</span>
                </div>
              </div>
              <div className="room-detail-actions">
                <button
                  className={`btn btn-secondary btn-icon ${isFavorited ? 'btn-favorited' : ''}`}
                  onClick={() => toggleFavorite(room.id)}
                  title={isFavorited ? 'Bỏ yêu thích' : 'Yêu thích'}
                >
                  <Heart size={20} fill={isFavorited ? '#ef4444' : 'none'} color={isFavorited ? '#ef4444' : undefined} />
                </button>
                <button className="btn btn-secondary btn-icon" title="Chia sẻ">
                  <Share2 size={20} />
                </button>
                <button
                  className="btn btn-secondary btn-icon"
                  onClick={() => setShowReportModal(true)}
                  title="Báo cáo"
                >
                  <Flag size={20} />
                </button>
              </div>
            </div>

            {/* Price & Stats */}
            <div className="room-detail-price-bar">
              <div className="room-detail-price">
                <span className="room-detail-price-value">{formatCurrency(room.price)}</span>
                <span className="room-detail-price-unit">/tháng</span>
              </div>
              <div className="room-detail-stats">
                <div className="room-detail-stat">
                  <Star size={16} fill="#f59e0b" color="#f59e0b" />
                  <span>{room.rating}</span>
                  <span className="text-muted">({room.reviewCount} đánh giá)</span>
                </div>
                <div className="room-detail-stat">
                  <Eye size={16} />
                  <span>{room.views} lượt xem</span>
                </div>
                <div className="room-detail-stat">
                  <Clock size={16} />
                  <span>Đăng {formatDate(room.createdAt)}</span>
                </div>
              </div>
            </div>

            {/* Key Info */}
            <div className="room-detail-key-info">
              <div className="room-info-item">
                <span className="room-info-label">Diện tích</span>
                <span className="room-info-value">{room.area} m²</span>
              </div>
              <div className="room-info-item">
                <span className="room-info-label">Số người tối đa</span>
                <span className="room-info-value">{room.maxOccupants} người</span>
              </div>
              <div className="room-info-item">
                <span className="room-info-label">Trạng thái</span>
                <span className="room-info-value" style={{ color: statusInfo.color }}>{statusInfo.label}</span>
              </div>
            </div>

            {/* Amenities */}
            <div className="room-detail-section">
              <h2 className="room-detail-section-title">Tiện ích</h2>
              <div className="room-detail-amenities">
                {room.amenities.map(amenity => {
                  const info = amenityLabels[amenity];
                  if (!info) return null;
                  return (
                    <div key={amenity} className="room-amenity-tag">
                      <CheckCircle2 size={16} />
                      <span>{info.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Description */}
            <div className="room-detail-section">
              <h2 className="room-detail-section-title">Mô tả</h2>
              <p className="room-detail-desc">{room.description}</p>
            </div>

            {/* Reviews */}
            <div className="room-detail-section">
              <h2 className="room-detail-section-title">
                Đánh giá ({reviews.length})
              </h2>
              {reviews.length > 0 ? (
                <div className="room-reviews">
                  {reviews.map(review => (
                    <div key={review.id} className="review-card">
                      <div className="review-header">
                        <img src={review.userAvatar} alt={review.userName} className="review-avatar" />
                        <div>
                          <div className="review-name">{review.userName}</div>
                          <div className="review-date">{formatDate(review.createdAt)}</div>
                        </div>
                        <div className="review-rating">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              size={14}
                              fill={i < review.rating ? '#f59e0b' : 'none'}
                              color={i < review.rating ? '#f59e0b' : '#cbd5e1'}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="review-comment">{review.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted">Chưa có đánh giá nào.</p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="room-detail-sidebar">
            {/* Landlord Card */}
            <div className="landlord-card card-elevated">
              <div className="landlord-card-header">
                <img src={room.landlordAvatar} alt={room.landlordName} className="landlord-avatar" />
                <div>
                  <h3 className="landlord-name">{room.landlordName}</h3>
                  <div className="landlord-verified">
                    <Shield size={14} />
                    <span>Đã xác thực</span>
                  </div>
                </div>
              </div>

              <div className="landlord-actions">
                <button
                  className="btn btn-primary btn-lg landlord-action-btn"
                  onClick={() => setShowPhone(!showPhone)}
                >
                  <Phone size={18} />
                  {showPhone ? room.landlordPhone : 'Xem số điện thoại'}
                </button>
                <button
                  className="btn btn-secondary btn-lg landlord-action-btn"
                  onClick={() => navigate('/chat')}
                >
                  <MessageCircle size={18} />
                  Nhắn tin
                </button>
                <button
                  className="btn btn-accent btn-lg landlord-action-btn"
                  onClick={() => {
                    if (!isAuthenticated) {
                      navigate('/login');
                    } else {
                      setShowBookingModal(true);
                    }
                  }}
                >
                  <CalendarDays size={18} />
                  Đặt lịch xem phòng
                </button>
              </div>
            </div>

            {/* Booking CTA */}
            {room.status === 'available' && (
              <div className="booking-cta card-elevated">
                <h3 className="booking-cta-title">Đặt phòng ngay</h3>
                <div className="booking-cta-price">
                  <span>{formatCurrency(room.price)}</span>
                  <span className="text-muted">/tháng</span>
                </div>
                <div className="booking-cta-deposit">
                  Tiền cọc: {formatCurrency(room.price)}
                </div>
                <button
                  className="btn btn-primary btn-xl booking-cta-btn"
                  onClick={() => {
                    if (!isAuthenticated) navigate('/login');
                    else setShowBookingModal(true);
                  }}
                >
                  Gửi yêu cầu thuê
                </button>
                <p className="booking-cta-note">Miễn phí đặt chỗ • Hủy dễ dàng</p>
              </div>
            )}
          </div>
        </div>

        {/* Similar Rooms */}
        {similarRooms.length > 0 && (
          <div className="room-detail-section" style={{ paddingBottom: 'var(--space-16)' }}>
            <h2 className="room-detail-section-title">Phòng tương tự</h2>
            <div className="room-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              {similarRooms.map(r => (
                <div key={r.id} className="room-card" onClick={() => navigate(`/rooms/${r.id}`)}>
                  <div className="room-card-image">
                    <img src={r.images[0]} alt={r.title} />
                    <div className="room-card-price-tag">
                      {formatCurrency(r.price)}<span>/tháng</span>
                    </div>
                  </div>
                  <div className="room-card-body">
                    <h3 className="room-card-title">{r.title}</h3>
                    <div className="room-card-location">
                      <MapPin size={14} />
                      <span>{r.district}</span>
                    </div>
                    <div className="room-card-amenities">
                      <span className="room-card-area">{r.area}m²</span>
                      <span className="room-card-dot">•</span>
                      <span>{formatCurrency(r.price)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="modal-overlay" onClick={() => setShowBookingModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Đặt lịch xem phòng</h3>
              <button onClick={() => setShowBookingModal(false)}><ChevronLeft size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="input-group">
                <label className="input-label">Ngày xem</label>
                <input type="date" className="input-field" />
              </div>
              <div className="input-group" style={{ marginTop: 'var(--space-4)' }}>
                <label className="input-label">Giờ xem</label>
                <select className="select-field">
                  <option>08:00</option>
                  <option>09:00</option>
                  <option>10:00</option>
                  <option>14:00</option>
                  <option>15:00</option>
                  <option>16:00</option>
                  <option>17:00</option>
                </select>
              </div>
              <div className="input-group" style={{ marginTop: 'var(--space-4)' }}>
                <label className="input-label">Ghi chú</label>
                <textarea className="input-field" rows={3} placeholder="Nhập ghi chú (tùy chọn)"></textarea>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowBookingModal(false)}>Hủy</button>
              <button className="btn btn-primary" onClick={async () => {
                const success = await createBooking({
                  roomId: room.id,
                  bookingType: 'viewing',
                  scheduledDate: document.querySelector<HTMLInputElement>('input[type="date"]')?.value || '',
                  scheduledTimeStart: document.querySelector<HTMLSelectElement>('select.select-field')?.value || '',
                  tenantMessage: document.querySelector<HTMLTextAreaElement>('textarea.input-field')?.value || ''
                });
                if (success) {
                  setShowBookingModal(false);
                  alert('Đã gửi yêu cầu xem phòng thành công!');
                } else {
                  alert('Lỗi: Không thể gửi yêu cầu lúc này.');
                }
              }}>
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="modal-overlay" onClick={() => setShowReportModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Báo cáo vi phạm</h3>
              <button onClick={() => setShowReportModal(false)}><ChevronLeft size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="input-group">
                <label className="input-label">Lý do báo cáo</label>
                <select className="select-field">
                  <option>Thông tin sai sự thật</option>
                  <option>Lừa đảo</option>
                  <option>Nội dung không phù hợp</option>
                  <option>Phòng đã cho thuê</option>
                  <option>Khác</option>
                </select>
              </div>
              <div className="input-group" style={{ marginTop: 'var(--space-4)' }}>
                <label className="input-label">Mô tả chi tiết</label>
                <textarea className="input-field" rows={4} placeholder="Mô tả chi tiết vi phạm"></textarea>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowReportModal(false)}>Hủy</button>
              <button className="btn btn-danger" onClick={() => { setShowReportModal(false); alert('Đã gửi báo cáo!'); }}>
                Gửi báo cáo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

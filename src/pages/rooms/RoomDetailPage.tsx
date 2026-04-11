import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useRoomStore } from '../../stores/roomStore';
import { useAuthStore } from '../../stores/authStore';
import { useBookingStore } from '../../stores/bookingStore';
import { formatCurrency, formatDate, getStatusLabel } from '../../utils/helpers';
import { reviewApi } from '../../api/services';
import {
  MapPin, Star, Heart, Share2, Eye, Phone, MessageCircle,
  CalendarDays, ChevronLeft, ChevronRight, User, Shield,
  Wifi, Snowflake, Car, Sofa, Waves, Dumbbell, ArrowUpDown,
  Sun, Trees, Warehouse, PawPrint, Flag, Clock, CheckCircle2,
  ArrowLeft, ExternalLink, Copy
} from 'lucide-react';
import './RoomDetailPage.css';

// Static amenity labels for client-side display
const amenityLabels: Record<string, { label: string; icon: string }> = {
  wifi: { label: 'WiFi', icon: 'Wifi' },
  ac: { label: 'Máy lạnh', icon: 'Snowflake' },
  parking: { label: 'Chỗ để xe', icon: 'Car' },
  furniture: { label: 'Nội thất', icon: 'Sofa' },
  washing_machine: { label: 'Máy giặt', icon: 'Sofa' },
  fridge: { label: 'Tủ lạnh', icon: 'Sofa' },
  balcony: { label: 'Ban công', icon: 'Sun' },
  pool: { label: 'Hồ bơi', icon: 'Waves' },
  gym: { label: 'Phòng gym', icon: 'Dumbbell' },
  elevator: { label: 'Thang máy', icon: 'ArrowUpDown' },
  security: { label: 'An ninh 24/7', icon: 'Shield' },
  garden: { label: 'Sân vườn', icon: 'Trees' },
  garage: { label: 'Garage ô tô', icon: 'Warehouse' }
};

export default function RoomDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { fetchRoomById, currentRoom, toggleFavorite, favorites, rooms, isLoading } = useRoomStore();
  const { user, isAuthenticated } = useAuthStore();
  const { createBooking } = useBookingStore();
  const [currentImage, setCurrentImage] = useState(0);
  const [showPhone, setShowPhone] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewSummary, setReviewSummary] = useState<any>(null);

  useEffect(() => {
    if (id) {
      fetchRoomById(id);
      loadReviews(id);
    }
  }, [id]);

  const loadReviews = async (roomId: string) => {
    try {
      const res: any = await reviewApi.getAll({ roomId, status: 'approved' });
      if (res && res.data) {
        setReviews(res.data);
        if (res.summary) setReviewSummary(res.summary);
      }
    } catch (error) {
      console.error('Failed to load reviews', error);
    }
  };

  const room = currentRoom;

  if (isLoading) {
    return (
      <div className="room-detail-page" style={{ paddingTop: '120px', textAlign: 'center' }}>
        <p>Đang tải thông tin phòng...</p>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="room-detail-page" style={{ paddingTop: '120px', textAlign: 'center' }}>
        <h2>Không tìm thấy phòng</h2>
        <button className="btn btn-primary" onClick={() => navigate('/rooms')}>Quay lại</button>
      </div>
    );
  }

  // Normalize room data (handles both camelCase and snake_case from API)
  const roomImages = room.images || [];
  const imageUrls = roomImages.map((img: any) => typeof img === 'string' ? img : img.url);
  const roomAmenities = room.amenities || [];
  const roomTitle = room.title || '';
  const roomAddress = room.address || room.full_address || room.fullAddress || '';
  const roomWard = room.ward_name || room.ward || '';
  const roomDistrict = room.district_name || room.district || '';
  const roomCity = room.province_name || room.city || '';
  const roomPrice = room.price || 0;
  const roomArea = room.area || 0;
  const roomMaxOccupants = room.max_occupants || room.maxOccupants || 0;
  const roomStatus = room.status || 'active';
  const roomRating = room.avg_rating || room.rating || 0;
  const roomReviewCount = room.total_reviews || room.reviewCount || 0;
  const roomViews = room.view_count || room.views || 0;
  const roomCreatedAt = room.created_at || room.createdAt || '';
  const roomDescription = room.description || '';
  const roomIsVip = room.is_vip || room.isPinned || false;
  const landlordName = room.landlord_name || room.landlordName || '';
  const landlordAvatar = room.landlord_avatar || room.landlordAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${room.landlord_id}`;
  const landlordPhone = room.landlord_phone || room.landlordPhone || '';
  const landlordVerified = room.landlord_verified || false;
  const electricityPrice = room.electricity_price || room.electricityPrice || null;
  const waterPrice = room.water_price || room.waterPrice || null;
  const internetPrice = room.internet_price || room.internetPrice || null;
  const parkingPrice = room.parking_price || room.parkingPrice || null;

  const isFavorited = favorites.includes(room.id);
  const statusInfo = getStatusLabel(roomStatus);

  const nextImage = () => setCurrentImage((prev) => (prev + 1) % (imageUrls.length || 1));
  const prevImage = () => setCurrentImage((prev) => (prev - 1 + (imageUrls.length || 1)) % (imageUrls.length || 1));

  // Find similar rooms from store
  const similarRooms = rooms.filter(r => r.id !== id && (r as any).district_name === roomDistrict).slice(0, 3);

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
            <span className="breadcrumb-current">{roomTitle}</span>
          </nav>
        </div>
      </div>

      <div className="container">
        {/* Image Gallery */}
        <div className="room-gallery">
          <div className="room-gallery-main">
            {imageUrls.length > 0 ? (
              <img
                src={imageUrls[currentImage]}
                alt={`${roomTitle} - Ảnh ${currentImage + 1}`}
                className="room-gallery-img"
              />
            ) : (
              <div className="room-gallery-img" style={{ background: 'var(--neutral-200)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                Không có ảnh
              </div>
            )}
            {imageUrls.length > 1 && (
              <>
                <button className="room-gallery-nav room-gallery-prev" onClick={prevImage}>
                  <ChevronLeft size={24} />
                </button>
                <button className="room-gallery-nav room-gallery-next" onClick={nextImage}>
                  <ChevronRight size={24} />
                </button>
              </>
            )}
            <div className="room-gallery-counter">
              {imageUrls.length > 0 ? `${currentImage + 1} / ${imageUrls.length}` : '0 / 0'}
            </div>

            {/* Status Badge */}
            <div className="room-gallery-badges">
              <span
                className="badge"
                style={{ background: `${statusInfo.color}20`, color: statusInfo.color }}
              >
                {statusInfo.label}
              </span>
              {roomIsVip && (
                <span className="badge badge-primary">⭐ Nổi bật</span>
              )}
            </div>
          </div>

          {imageUrls.length > 1 && (
            <div className="room-gallery-thumbs">
              {imageUrls.map((img: string, index: number) => (
                <button
                  key={index}
                  className={`room-gallery-thumb ${index === currentImage ? 'active' : ''}`}
                  onClick={() => setCurrentImage(index)}
                >
                  <img src={img} alt={`Thumb ${index + 1}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="room-detail-content">
          <div className="room-detail-main">
            {/* Title & Actions */}
            <div className="room-detail-header">
              <div>
                <h1 className="room-detail-title">{roomTitle}</h1>
                <div className="room-detail-location">
                  <MapPin size={16} />
                  <span>{[roomAddress, roomWard, roomDistrict, roomCity].filter(Boolean).join(', ')}</span>
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
                <span className="room-detail-price-value">{formatCurrency(roomPrice)}</span>
                <span className="room-detail-price-unit">/tháng</span>
              </div>
              <div className="room-detail-stats">
                <div className="room-detail-stat">
                  <Star size={16} fill="#f59e0b" color="#f59e0b" />
                  <span>{roomRating}</span>
                  <span className="text-muted">({roomReviewCount} đánh giá)</span>
                </div>
                <div className="room-detail-stat">
                  <Eye size={16} />
                  <span>{roomViews} lượt xem</span>
                </div>
                <div className="room-detail-stat">
                  <Clock size={16} />
                  <span>Đăng {formatDate(roomCreatedAt)}</span>
                </div>
              </div>
            </div>

            {/* Key Info */}
            <div className="room-detail-key-info">
              <div className="room-info-item">
                <span className="room-info-label">Diện tích</span>
                <span className="room-info-value">{roomArea} m²</span>
              </div>
              <div className="room-info-item">
                <span className="room-info-label">Số người tối đa</span>
                <span className="room-info-value">{roomMaxOccupants} người</span>
              </div>
              <div className="room-info-item">
                <span className="room-info-label">Trạng thái</span>
                <span className="room-info-value" style={{ color: statusInfo.color }}>{statusInfo.label}</span>
              </div>
            </div>

            {/* Utility Prices */}
            {(electricityPrice || waterPrice || internetPrice || parkingPrice) && (
              <div className="room-detail-section">
                <h2 className="room-detail-section-title">Chi phí dịch vụ</h2>
                <div className="room-detail-key-info">
                  {electricityPrice && (
                    <div className="room-info-item">
                      <span className="room-info-label">Điện</span>
                      <span className="room-info-value">{formatCurrency(electricityPrice)}/kWh</span>
                    </div>
                  )}
                  {waterPrice && (
                    <div className="room-info-item">
                      <span className="room-info-label">Nước</span>
                      <span className="room-info-value">{formatCurrency(waterPrice)}/m³</span>
                    </div>
                  )}
                  {internetPrice && (
                    <div className="room-info-item">
                      <span className="room-info-label">Internet</span>
                      <span className="room-info-value">{formatCurrency(internetPrice)}/tháng</span>
                    </div>
                  )}
                  {parkingPrice && (
                    <div className="room-info-item">
                      <span className="room-info-label">Gửi xe</span>
                      <span className="room-info-value">{formatCurrency(parkingPrice)}/tháng</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Amenities */}
            <div className="room-detail-section">
              <h2 className="room-detail-section-title">Tiện ích</h2>
              <div className="room-detail-amenities">
                {roomAmenities.map((amenity: any) => {
                  const key = typeof amenity === 'string' ? amenity : amenity.name;
                  const label = typeof amenity === 'string'
                    ? (amenityLabels[amenity]?.label || amenity)
                    : (amenity.name_vi || amenity.name || key);
                  return (
                    <div key={key} className="room-amenity-tag">
                      <CheckCircle2 size={16} />
                      <span>{label}</span>
                    </div>
                  );
                })}
                {roomAmenities.length === 0 && (
                  <p className="text-muted">Không có thông tin tiện ích.</p>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="room-detail-section">
              <h2 className="room-detail-section-title">Mô tả</h2>
              <p className="room-detail-desc">{roomDescription || 'Không có mô tả.'}</p>
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
                        <img
                          src={review.reviewer_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${review.reviewer_id}`}
                          alt={review.reviewer_name}
                          className="review-avatar"
                        />
                        <div>
                          <div className="review-name">{review.reviewer_name}</div>
                          <div className="review-date">{formatDate(review.created_at)}</div>
                        </div>
                        <div className="review-rating">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              size={14}
                              fill={i < (review.overall_rating || review.rating || 0) ? '#f59e0b' : 'none'}
                              color={i < (review.overall_rating || review.rating || 0) ? '#f59e0b' : '#cbd5e1'}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="review-comment">{review.content || review.comment}</p>
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
                <img src={landlordAvatar} alt={landlordName} className="landlord-avatar" />
                <div>
                  <h3 className="landlord-name">{landlordName}</h3>
                  {landlordVerified && (
                    <div className="landlord-verified">
                      <Shield size={14} />
                      <span>Đã xác thực</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="landlord-actions">
                <button
                  className="btn btn-primary btn-lg landlord-action-btn"
                  onClick={() => setShowPhone(!showPhone)}
                >
                  <Phone size={18} />
                  {showPhone ? landlordPhone : 'Xem số điện thoại'}
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
            {roomStatus === 'active' && (
              <div className="booking-cta card-elevated">
                <h3 className="booking-cta-title">Đặt phòng ngay</h3>
                <div className="booking-cta-price">
                  <span>{formatCurrency(roomPrice)}</span>
                  <span className="text-muted">/tháng</span>
                </div>
                <div className="booking-cta-deposit">
                  Tiền cọc: {formatCurrency(roomPrice)}
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
                    <img src={(r as any).cover_image || (r as any).coverImage || (r.images && r.images[0]) || 'https://via.placeholder.com/300x200'} alt={r.title} />
                    <div className="room-card-price-tag">
                      {formatCurrency(r.price)}<span>/tháng</span>
                    </div>
                  </div>
                  <div className="room-card-body">
                    <h3 className="room-card-title">{r.title}</h3>
                    <div className="room-card-location">
                      <MapPin size={14} />
                      <span>{(r as any).district_name || (r as any).district}</span>
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
                <input type="date" className="input-field" id="booking-date" />
              </div>
              <div className="input-group" style={{ marginTop: 'var(--space-4)' }}>
                <label className="input-label">Giờ xem</label>
                <select className="select-field" id="booking-time">
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
                <textarea className="input-field" rows={3} placeholder="Nhập ghi chú (tùy chọn)" id="booking-note"></textarea>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowBookingModal(false)}>Hủy</button>
              <button className="btn btn-primary" onClick={async () => {
                const dateEl = document.getElementById('booking-date') as HTMLInputElement;
                const timeEl = document.getElementById('booking-time') as HTMLSelectElement;
                const noteEl = document.getElementById('booking-note') as HTMLTextAreaElement;
                const success = await createBooking({
                  roomId: room.id,
                  bookingType: 'viewing',
                  scheduledDate: dateEl?.value || '',
                  scheduledTimeStart: timeEl?.value || '',
                  tenantMessage: noteEl?.value || ''
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

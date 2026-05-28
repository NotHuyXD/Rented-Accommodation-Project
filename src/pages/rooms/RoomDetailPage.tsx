import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useRoomStore } from '../../stores/roomStore';
import { useAuthStore } from '../../stores/authStore';
import { useAppStore } from '../../stores/appStore';
import { formatCurrency, formatDate, getStatusLabel, timeAgo, getImageUrl } from '../../utils/helpers';
import { rentalRequestApi, chatApi, reportApi, reviewApi, appointmentApi } from '../../api/services';
import type { Room } from '../../types';
import {
  MapPin, Star, Heart, Share2, Phone, MessageCircle,
  CalendarDays, ChevronLeft, ChevronRight, Shield,
  PawPrint, Flag, Clock, CheckCircle2,
  ArrowLeft, Utensils, Home, Zap, Droplets, CalendarClock
} from 'lucide-react';
import './RoomDetailPage.css';

export default function RoomDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { fetchRoomById, currentRoom, isLoading } = useRoomStore();
  const { user } = useAuthStore();
  const { toggleBookmark, isBookmarked, fetchBookmarks } = useAppStore();
  const [currentImage, setCurrentImage] = useState(0);
  const [showPhone, setShowPhone] = useState(false);
  const [showRentalModal, setShowRentalModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [rentalForm, setRentalForm] = useState({ moveInDate: '', numPeople: 1, message: '' });
  const [reportForm, setReportForm] = useState({ reason: 'Thông tin sai sự thật', description: '' });
  const [submitting, setSubmitting] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewHover, setReviewHover] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [appointmentForm, setAppointmentForm] = useState({
    appointmentDate: '',
    appointmentTime: '09:00',
    message: '',
  });
  const [appointmentSubmitting, setAppointmentSubmitting] = useState(false);
  const [appointmentSuccess, setAppointmentSuccess] = useState(false);

  useEffect(() => {
    if (id) {
      fetchRoomById(id);
      if (user) fetchBookmarks();
    }
  }, [id]);

  const room = currentRoom as Room | null;

  if (isLoading) {
    return (
      <div className="room-detail-page" style={{ paddingTop: '120px', textAlign: 'center', minHeight: '60vh' }}>
        <div style={{ fontSize: '2rem', color: 'var(--primary-500)' }}>⟳</div>
        <p>Đang tải thông tin phòng...</p>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="room-detail-page" style={{ paddingTop: '120px', textAlign: 'center', minHeight: '60vh' }}>
        <h2>Không tìm thấy phòng</h2>
        <button className="btn btn-primary" onClick={() => navigate('/rooms')}>Quay lại danh sách</button>
      </div>
    );
  }

  const imageUrls = (room.images || []).map((img: any) => {
    const url = typeof img === 'string' ? img : img.url;
    return getImageUrl(url);
  });
  const statusInfo = getStatusLabel(room.status);

  const nextImage = () => setCurrentImage((prev) => (prev + 1) % (imageUrls.length || 1));
  const prevImage = () => setCurrentImage((prev) => (prev - 1 + (imageUrls.length || 1)) % (imageUrls.length || 1));

  const handleRentalRequest = async () => {
    if (!rentalForm.moveInDate) return alert('Vui lòng chọn ngày dọn vào');
    setSubmitting(true);
    try {
      await rentalRequestApi.create({
        roomId: room.id,
        moveInDate: rentalForm.moveInDate,
        numPeople: rentalForm.numPeople,
        message: rentalForm.message || undefined,
      });
      setShowRentalModal(false);
      alert('Gửi yêu cầu thuê phòng thành công! Chủ trọ sẽ phản hồi sớm.');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi gửi yêu cầu');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReport = async () => {
    setSubmitting(true);
    try {
      await reportApi.create({
        targetType: 'room',
        targetId: room.id,
        reason: reportForm.reason,
        description: reportForm.description || undefined,
      });
      setShowReportModal(false);
      alert('Đã gửi báo cáo thành công!');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi gửi báo cáo');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChat = async () => {
    if (!user) return navigate('/login');
    try {
      await chatApi.getOrCreateConversation({
        landlordId: room.landlord.id,
        roomId: room.id,
      });
      navigate('/chat');
    } catch {
      navigate('/chat');
    }
  };

  const handleReviewSubmit = async () => {
    if (reviewRating === 0) {
      alert('Vui lòng chọn số sao đánh giá');
      return;
    }
    setReviewSubmitting(true);
    try {
      await reviewApi.create({
        roomId: room.id,
        rating: reviewRating,
        comment: reviewComment || undefined,
      });
      alert('Đánh giá của bạn đã được gửi thành công!');
      setReviewRating(0);
      setReviewComment('');
      // Reload room to update reviews
      if (id) fetchRoomById(id);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi gửi đánh giá');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleAppointment = async () => {
    if (!appointmentForm.appointmentDate) return alert('Vui lòng chọn ngày hẹn');
    if (!appointmentForm.appointmentTime) return alert('Vui lòng chọn giờ hẹn');
    setAppointmentSubmitting(true);
    try {
      await appointmentApi.create({
        roomId: room.id,
        appointmentDate: appointmentForm.appointmentDate,
        appointmentTime: appointmentForm.appointmentTime,
        message: appointmentForm.message || undefined,
      });
      setAppointmentSuccess(true);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi đặt lịch hẹn');
    } finally {
      setAppointmentSubmitting(false);
    }
  };

  const handleCloseAppointmentModal = () => {
    setShowAppointmentModal(false);
    setAppointmentSuccess(false);
    setAppointmentForm({ appointmentDate: '', appointmentTime: '09:00', message: '' });
  };

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
            {imageUrls.length > 0 ? (
              <img
                src={imageUrls[currentImage]}
                alt={`${room.title} - Ảnh ${currentImage + 1}`}
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
            <div className="room-gallery-badges">
              <span className="badge" style={{ background: `${statusInfo.color}20`, color: statusInfo.color }}>
                {statusInfo.label}
              </span>
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
                <h1 className="room-detail-title">{room.title}</h1>
                <div className="room-detail-location">
                  <MapPin size={16} />
                  <span>{[room.address, room.ward, room.district, room.province].filter(Boolean).join(', ')}</span>
                </div>
                <div style={{ marginTop: '8px', fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>
                  {room.roomType?.name && <span className="badge badge-secondary" style={{ marginRight: '8px' }}>{room.roomType.name}</span>}
                  <Clock size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                  Đăng {timeAgo(room.createdAt)}
                </div>
              </div>
              <div className="room-detail-actions">
                {user && (
                  <button
                    className={`btn btn-secondary btn-icon ${isBookmarked(room.id) ? 'btn-favorited' : ''}`}
                    onClick={() => toggleBookmark(room.id)}
                    title={isBookmarked(room.id) ? 'Bỏ yêu thích' : 'Yêu thích'}
                  >
                    <Heart size={20} fill={isBookmarked(room.id) ? '#ef4444' : 'none'} color={isBookmarked(room.id) ? '#ef4444' : undefined} />
                  </button>
                )}
                <button className="btn btn-secondary btn-icon" title="Chia sẻ" onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  alert('Đã copy link!');
                }}>
                  <Share2 size={20} />
                </button>
                <button
                  className="btn btn-secondary btn-icon"
                  onClick={() => { if (!user) navigate('/login'); else setShowReportModal(true); }}
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
                  <span>{room.avgRating || '—'}</span>
                  <span className="text-muted">({room.reviewCount || 0} đánh giá)</span>
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
                <span className="room-info-label">Đặt cọc</span>
                <span className="room-info-value">{formatCurrency(room.deposit)}</span>
              </div>
              {room.availableFrom && (
                <div className="room-info-item">
                  <span className="room-info-label">Ngày trống</span>
                  <span className="room-info-value">{formatDate(room.availableFrom)}</span>
                </div>
              )}
            </div>

            {/* Rules */}
            <div className="room-detail-section">
              <h2 className="room-detail-section-title">Nội quy phòng</h2>
              <div className="room-detail-amenities">
                <div className={`room-amenity-tag ${room.allowPet ? 'room-amenity-yes' : 'room-amenity-no'}`}>
                  <PawPrint size={16} />
                  <span>{room.allowPet ? 'Cho phép thú cưng' : 'Không nuôi thú cưng'}</span>
                </div>
                <div className={`room-amenity-tag ${room.allowCooking ? 'room-amenity-yes' : 'room-amenity-no'}`}>
                  <Utensils size={16} />
                  <span>{room.allowCooking ? 'Cho phép nấu ăn' : 'Không nấu ăn'}</span>
                </div>
                <div className={`room-amenity-tag ${room.liveWithOwner ? 'room-amenity-yes' : ''}`}>
                  <Home size={16} />
                  <span>{room.liveWithOwner ? 'Ở chung chủ nhà' : 'Ở riêng'}</span>
                </div>
                {room.curfewTime && (
                  <div className="room-amenity-tag">
                    <Clock size={16} />
                    <span>Giờ giới nghiêm: {room.curfewTime}</span>
                  </div>
                )}
              </div>
              {room.extraRules && (
                <p className="text-muted" style={{ marginTop: '12px', fontSize: '0.9rem' }}>{room.extraRules}</p>
              )}
            </div>

            {/* Service Prices */}
            {room.prices && room.prices.length > 0 && (
              <div className="room-detail-section">
                <h2 className="room-detail-section-title">Chi phí dịch vụ</h2>
                <div className="room-detail-key-info">
                  {room.prices.map((p: any) => (
                    <div key={p.id || p.label} className="room-info-item">
                      <span className="room-info-label">
                        {p.is_metered || p.isMetered ? (
                          p.meter_type === 'electric' || p.meterType === 'electric' ? <><Zap size={14} /> </> :
                          p.meter_type === 'water' || p.meterType === 'water' ? <><Droplets size={14} /> </> : null
                        ) : null}
                        {p.label}
                      </span>
                      <span className="room-info-value">{formatCurrency(parseFloat(p.price))}/{p.unit}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Amenities */}
            <div className="room-detail-section">
              <h2 className="room-detail-section-title">Tiện nghi</h2>
              <div className="room-detail-amenities">
                {room.amenities && room.amenities.length > 0 ? room.amenities.map((amenity: any) => (
                  <div key={amenity.id || amenity.name} className="room-amenity-tag">
                    <CheckCircle2 size={16} />
                    <span>{amenity.icon} {amenity.name}</span>
                  </div>
                )) : (
                  <p className="text-muted">Không có thông tin tiện nghi.</p>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="room-detail-section">
              <h2 className="room-detail-section-title">Mô tả chi tiết</h2>
              <p className="room-detail-desc" style={{ whiteSpace: 'pre-wrap' }}>
                {room.description || 'Không có mô tả.'}
              </p>
            </div>

            {/* Reviews */}
            <div className="room-detail-section">
              <h2 className="room-detail-section-title">
                Đánh giá ({room.reviewCount || 0})
              </h2>

              {/* Review Form */}
              {user && user.role === 'tenant' && user.id !== room.landlord.id && (
                <div className="review-form" style={{ 
                  background: 'var(--bg-tertiary)', padding: '20px', borderRadius: 'var(--radius-lg)', 
                  marginBottom: '24px', border: '1px solid var(--border-color)'
                }}>
                  <h4 style={{ fontWeight: 600, marginBottom: '12px' }}>Viết đánh giá của bạn</h4>
                  <div style={{ display: 'flex', gap: '4px', marginBottom: '12px' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        onMouseEnter={() => setReviewHover(star)}
                        onMouseLeave={() => setReviewHover(0)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', transition: 'transform 0.15s' }}
                      >
                        <Star
                          size={28}
                          fill={star <= (reviewHover || reviewRating) ? '#f59e0b' : 'none'}
                          color={star <= (reviewHover || reviewRating) ? '#f59e0b' : '#cbd5e1'}
                          style={{ transition: 'all 0.15s' }}
                        />
                      </button>
                    ))}
                    {reviewRating > 0 && (
                      <span style={{ marginLeft: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem', alignSelf: 'center' }}>
                        {reviewRating === 1 ? 'Rất tệ' : reviewRating === 2 ? 'Tệ' : reviewRating === 3 ? 'Bình thường' : reviewRating === 4 ? 'Tốt' : 'Xuất sắc'}
                      </span>
                    )}
                  </div>
                  <textarea
                    className="input-field"
                    rows={3}
                    placeholder="Chia sẻ trải nghiệm của bạn về phòng trọ này..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    style={{ width: '100%', marginBottom: '12px', resize: 'vertical' }}
                  />
                  <button
                    className="btn btn-primary"
                    onClick={handleReviewSubmit}
                    disabled={reviewSubmitting || reviewRating === 0}
                  >
                    {reviewSubmitting ? 'Đang gửi...' : 'Gửi đánh giá'}
                  </button>
                </div>
              )}

              {room.reviews && room.reviews.length > 0 ? (
                <div className="room-reviews">
                  {room.reviews.map((review: any) => (
                    <div key={review.id} className="review-card">
                      <div className="review-header">
                        <img
                          src={review.tenant_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${review.tenant_name}`}
                          alt={review.tenant_name}
                          className="review-avatar"
                        />
                        <div>
                          <div className="review-name">{review.tenant_name}</div>
                          <div className="review-date">{timeAgo(review.created_at)}</div>
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
                      {review.comment && <p className="review-comment">{review.comment}</p>}
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
                <img
                  src={getImageUrl(room.landlord.avatar) || `https://api.dicebear.com/7.x/avataaars/svg?seed=${room.landlord.id}`}
                  alt={room.landlord.fullName}
                  className="landlord-avatar"
                />
                <div>
                  <h3 className="landlord-name">{room.landlord.fullName}</h3>
                  {room.landlord.isVerified && (
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
                  {showPhone ? room.landlord.phone : 'Xem số điện thoại'}
                </button>
                <button
                  className="btn btn-secondary btn-lg landlord-action-btn"
                  onClick={handleChat}
                >
                  <MessageCircle size={18} />
                  Nhắn tin
                </button>
              </div>
            </div>

            {/* Rental Request CTA */}
            {room.status === 'available' && (
              <div className="booking-cta card-elevated">
                <h3 className="booking-cta-title">Gửi yêu cầu thuê</h3>
                <div className="booking-cta-price">
                  <span>{formatCurrency(room.price)}</span>
                  <span className="text-muted">/tháng</span>
                </div>
                <div className="booking-cta-deposit">
                  Đặt cọc: {formatCurrency(room.deposit)}
                </div>
                <button
                  className="btn btn-primary btn-xl booking-cta-btn"
                  onClick={() => {
                    if (!user) navigate('/login');
                    else setShowRentalModal(true);
                  }}
                >
                  <CalendarDays size={18} />
                  Gửi yêu cầu thuê phòng
                </button>
                <button
                  className="btn btn-secondary btn-xl booking-cta-btn"
                  style={{ marginTop: '10px' }}
                  onClick={() => {
                    if (!user) navigate('/login');
                    else { setShowAppointmentModal(true); setAppointmentSuccess(false); }
                  }}
                >
                  <CalendarClock size={18} />
                  Hẹn lịch xem phòng
                </button>
                <p className="booking-cta-note">Miễn phí • Email xác nhận tự động</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rental Request Modal */}
      {showRentalModal && (
        <div className="modal-overlay" onClick={() => setShowRentalModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Gửi yêu cầu thuê phòng</h3>
              <button onClick={() => setShowRentalModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="input-group">
                <label className="input-label">Ngày dọn vào dự kiến *</label>
                <input
                  type="date"
                  className="input-field"
                  value={rentalForm.moveInDate}
                  onChange={(e) => setRentalForm({ ...rentalForm, moveInDate: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="input-group" style={{ marginTop: '16px' }}>
                <label className="input-label">Số người ở</label>
                <select
                  className="select-field"
                  value={rentalForm.numPeople}
                  onChange={(e) => setRentalForm({ ...rentalForm, numPeople: parseInt(e.target.value) })}
                >
                  {[1, 2, 3, 4, 5].map(n => (
                    <option key={n} value={n}>{n} người</option>
                  ))}
                </select>
              </div>
              <div className="input-group" style={{ marginTop: '16px' }}>
                <label className="input-label">Lời nhắn cho chủ trọ</label>
                <textarea
                  className="input-field"
                  rows={3}
                  placeholder="Giới thiệu bản thân, lý do thuê..."
                  value={rentalForm.message}
                  onChange={(e) => setRentalForm({ ...rentalForm, message: e.target.value })}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowRentalModal(false)}>Hủy</button>
              <button className="btn btn-primary" onClick={handleRentalRequest} disabled={submitting}>
                {submitting ? 'Đang gửi...' : 'Gửi yêu cầu'}
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
              <button onClick={() => setShowReportModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="input-group">
                <label className="input-label">Lý do báo cáo</label>
                <select className="select-field" value={reportForm.reason} onChange={(e) => setReportForm({ ...reportForm, reason: e.target.value })}>
                  <option>Thông tin sai sự thật</option>
                  <option>Lừa đảo</option>
                  <option>Nội dung không phù hợp</option>
                  <option>Phòng đã cho thuê</option>
                  <option>Khác</option>
                </select>
              </div>
              <div className="input-group" style={{ marginTop: '16px' }}>
                <label className="input-label">Mô tả chi tiết</label>
                <textarea
                  className="input-field"
                  rows={4}
                  placeholder="Mô tả chi tiết vi phạm"
                  value={reportForm.description}
                  onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowReportModal(false)}>Hủy</button>
              <button className="btn btn-danger" onClick={handleReport} disabled={submitting}>
                {submitting ? 'Đang gửi...' : 'Gửi báo cáo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Appointment Modal – Hẹn lịch xem phòng */}
      {showAppointmentModal && (
        <div className="modal-overlay" onClick={handleCloseAppointmentModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            {!appointmentSuccess ? (
              <>
                <div className="modal-header">
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CalendarClock size={20} color="var(--primary-500)" />
                    Hẹn lịch xem phòng
                  </h3>
                  <button onClick={handleCloseAppointmentModal}>✕</button>
                </div>
                <div className="modal-body">
                  <div style={{
                    background: 'var(--primary-50, #ede9fe)',
                    borderRadius: '10px',
                    padding: '12px 16px',
                    marginBottom: '20px',
                    fontSize: '13.5px',
                    color: 'var(--primary-700, #4f46e5)',
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'flex-start',
                  }}>
                    <span style={{ fontSize: '18px' }}>📧</span>
                    <span>Email xác nhận sẽ được gửi tự động đến bạn và chủ trọ sau khi đặt lịch.</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="input-group">
                      <label className="input-label">Ngày hẹn *</label>
                      <input
                        type="date"
                        className="input-field"
                        value={appointmentForm.appointmentDate}
                        onChange={(e) => setAppointmentForm({ ...appointmentForm, appointmentDate: e.target.value })}
                        min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                      />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Giờ hẹn *</label>
                      <select
                        className="select-field"
                        value={appointmentForm.appointmentTime}
                        onChange={(e) => setAppointmentForm({ ...appointmentForm, appointmentTime: e.target.value })}
                      >
                        {['07:00','07:30','08:00','08:30','09:00','09:30','10:00','10:30',
                          '11:00','11:30','13:00','13:30','14:00','14:30','15:00','15:30',
                          '16:00','16:30','17:00','17:30','18:00','18:30','19:00','19:30','20:00'].map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="input-group" style={{ marginTop: '16px' }}>
                    <label className="input-label">Lời nhắn cho chủ trọ (tuỳ chọn)</label>
                    <textarea
                      className="input-field"
                      rows={3}
                      placeholder="Giới thiệu bản thân, câu hỏi về phòng..."
                      value={appointmentForm.message}
                      onChange={(e) => setAppointmentForm({ ...appointmentForm, message: e.target.value })}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={handleCloseAppointmentModal}>Hủy</button>
                  <button
                    className="btn btn-primary"
                    onClick={handleAppointment}
                    disabled={appointmentSubmitting}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    <CalendarClock size={16} />
                    {appointmentSubmitting ? 'Đang gửi...' : 'Xác nhận đặt lịch'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="modal-header" style={{ border: 'none' }}>
                  <span></span>
                  <button onClick={handleCloseAppointmentModal}>✕</button>
                </div>
                <div className="modal-body" style={{ textAlign: 'center', padding: '20px 32px 32px' }}>
                  <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎉</div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '12px', color: 'var(--success-600, #059669)' }}>
                    Đặt lịch thành công!
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '8px' }}>
                    Email xác nhận đã được gửi đến hộp thư của bạn và chủ trọ.
                  </p>
                  <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginBottom: '24px' }}>
                    Vui lòng kiểm tra hộp thư (kể cả thư mục spam)
                  </p>
                  <div style={{
                    background: 'var(--success-50, #d1fae5)',
                    borderRadius: '10px',
                    padding: '14px 20px',
                    marginBottom: '24px',
                    fontSize: '13.5px',
                    color: 'var(--success-700, #065f46)',
                    textAlign: 'left',
                  }}>
                    <strong>Ngày hẹn:</strong> {appointmentForm.appointmentDate && new Date(appointmentForm.appointmentDate + 'T00:00:00').toLocaleDateString('vi-VN', { weekday:'long', day:'2-digit', month:'2-digit', year:'numeric' })}<br/>
                    <strong>Giờ hẹn:</strong> {appointmentForm.appointmentTime}<br/>
                    <strong>Địa chỉ:</strong> {[room.address, room.ward, room.district, room.province].filter(Boolean).join(', ')}
                  </div>
                  <button className="btn btn-primary" onClick={handleCloseAppointmentModal} style={{ width: '100%' }}>
                    Đã hiểu
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

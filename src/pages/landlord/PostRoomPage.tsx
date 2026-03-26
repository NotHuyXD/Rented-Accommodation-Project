import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useRoomStore } from '../../stores/roomStore';
import { amenityLabels } from '../../data/mockData';
import { MapPin, DollarSign, Users, Square, Check, Upload, Trash2, ArrowLeft } from 'lucide-react';
import './PostRoomPage.css';

export default function PostRoomPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { addRoom } = useRoomStore();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    address: '',
    district: '',
    lat: 10.762622,
    lng: 106.660172,
    price: 3000000,
    deposit: 3000000,
    area: 20,
    maxOccupants: 2,
    type: 'room',
    amenities: [] as string[],
    images: [] as string[]
  });

  if (!user || user.role !== 'landlord') {
    return (
      <div style={{ paddingTop: '120px', textAlign: 'center', minHeight: '60vh' }}>
        <h2>Bạn cần đăng nhập với tài khoản Chủ trọ</h2>
        <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={() => navigate('/login')}>Đăng nhập</button>
      </div>
    );
  }

  const handleNext = () => setStep(prev => prev + 1);
  const handlePrev = () => setStep(prev => prev - 1);

  const toggleAmenity = (key: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(key)
        ? prev.amenities.filter(a => a !== key)
        : [...prev.amenities, key]
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Mock image upload
    const files = e.target.files;
    if (files && files.length > 0) {
      const newImages = Array.from(files).map(() => `https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=600&h=400&random=${Math.random()}`);
      setFormData(prev => ({ ...prev, images: [...prev.images, ...newImages] }));
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = () => {
    const newRoom: any = {
      ...formData,
      id: `room-${Date.now()}`,
      landlordId: user.id,
      landlordName: user.fullName,
      landlordPhone: user.phone || '0901234567',
      landlordAvatar: user.avatar,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'available',
      rating: 0,
      reviewCount: 0,
      views: 0,
      featured: false
    };

    addRoom(newRoom);
    alert('Đăng tin thành công!');
    navigate('/landlord/rooms');
  };

  return (
    <div style={{ paddingTop: '68px', minHeight: '100vh', background: 'var(--bg-secondary)' }}>
      <div className="container" style={{ paddingTop: 'var(--space-8)', paddingBottom: 'var(--space-16)', maxWidth: '800px' }}>
        <button className="btn btn-ghost" style={{ marginBottom: 'var(--space-4)' }} onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Quay lại
        </button>
        
        <h1 style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 800, marginBottom: 'var(--space-6)' }}>Đăng tin cho thuê</h1>

        {/* Progress Bar */}
        <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-8)' }}>
          {[1, 2, 3].map(i => (
            <div
              key={i}
              style={{
                flex: 1,
                height: 6,
                borderRadius: 3,
                background: step >= i ? 'var(--primary-500)' : 'var(--neutral-200)',
                transition: 'background 300ms ease'
              }}
            />
          ))}
        </div>

        <div className="post-room-form">
          {step === 1 && (
            <div className="form-step slide-in">
              <h2>Thông tin cơ bản</h2>
              
              <div className="input-group">
                <label className="input-label">Tiêu đề bản tin <span style={{ color: 'var(--error-500)' }}>*</span></label>
                <input
                  className="input-field"
                  placeholder="Ví dụ: Phòng trọ cao cấp full nội thất quận 1..."
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Loại bất động sản</label>
                <select className="input-field" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                  <option value="room">Phòng trọ</option>
                  <option value="apartment">Căn hộ / Chung cư mini</option>
                  <option value="house">Nhà nguyên căn</option>
                  <option value="dorm">Ký túc xá / Sleepbox</option>
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">Địa chỉ chi tiết <span style={{ color: 'var(--error-500)' }}>*</span></label>
                <div style={{ position: 'relative' }}>
                  <MapPin size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                  <input
                    className="input-field"
                    style={{ paddingLeft: 40 }}
                    placeholder="Số nhà, tên đường, phường..."
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Khu vực (Quận/Huyện)</label>
                <select className="input-field" value={formData.district} onChange={e => setFormData({ ...formData, district: e.target.value })}>
                  <option value="">Chọn khu vực</option>
                  <option value="Quận 1">Quận 1</option>
                  <option value="Quận 3">Quận 3</option>
                  <option value="Quận 7">Quận 7</option>
                  <option value="Quận 10">Quận 10</option>
                  <option value="Bình Thạnh">Bình Thạnh</option>
                  <option value="Tân Bình">Tân Bình</option>
                  <option value="Gò Vấp">Gò Vấp</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div className="input-group">
                  <label className="input-label">Giá thuê (VNĐ/tháng) <span style={{ color: 'var(--error-500)' }}>*</span></label>
                  <div style={{ position: 'relative' }}>
                    <DollarSign size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                    <input
                      className="input-field"
                      type="number"
                      style={{ paddingLeft: 40 }}
                      value={formData.price}
                      onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">Tiền cọc (VNĐ)</label>
                  <input
                    className="input-field"
                    type="number"
                    value={formData.deposit}
                    onChange={e => setFormData({ ...formData, deposit: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div className="input-group">
                  <label className="input-label">Diện tích (m²) <span style={{ color: 'var(--error-500)' }}>*</span></label>
                  <div style={{ position: 'relative' }}>
                    <Square size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                    <input
                      className="input-field"
                      type="number"
                      style={{ paddingLeft: 40 }}
                      value={formData.area}
                      onChange={e => setFormData({ ...formData, area: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">Số người ở tối đa</label>
                  <div style={{ position: 'relative' }}>
                    <Users size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                    <input
                      className="input-field"
                      type="number"
                      style={{ paddingLeft: 40 }}
                      value={formData.maxOccupants}
                      onChange={e => setFormData({ ...formData, maxOccupants: Number(e.target.value) })}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="form-step slide-in">
              <h2>Mô tả & Tiện ích</h2>

              <div className="input-group">
                <label className="input-label">Mô tả chi tiết <span style={{ color: 'var(--error-500)' }}>*</span></label>
                <textarea
                  className="input-field"
                  rows={8}
                  placeholder="Gợi ý: Mô tả vị trí, nội thất trang bị, giờ giấc, an ninh khu vực..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <h3 style={{ marginTop: 'var(--space-6)', marginBottom: 'var(--space-4)' }}>Tiện ích có sẵn</h3>
              <div className="amenities-grid-select">
                {Object.entries(amenityLabels).map(([key, info]) => (
                  <button
                    key={key}
                    type="button"
                    className={`amenity-toggle-btn ${formData.amenities.includes(key) ? 'active' : ''}`}
                    onClick={() => toggleAmenity(key)}
                  >
                    <span className="amenity-checkbox">
                      {formData.amenities.includes(key) && <Check size={14} />}
                    </span>
                    {info.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="form-step slide-in">
              <h2>Hình ảnh</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>Đăng ít nhất 3 hình ảnh rõ nét để thu hút người xem hơn</p>

              <div className="image-upload-area">
                <Upload size={48} color="var(--primary-400)" style={{ marginBottom: 'var(--space-4)' }} />
                <h3>Kéo thả ảnh hoặc click để chọn</h3>
                <p>Hỗ trợ JPG, PNG (Tối đa 5MB/ảnh)</p>
                <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="file-input" />
              </div>

              {formData.images.length > 0 && (
                <div className="uploaded-images-preview">
                  {formData.images.map((img, idx) => (
                    <div key={idx} className="preview-image-item">
                      <img src={img} alt="" />
                      <button className="remove-image-btn" onClick={() => removeImage(idx)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Form Actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--space-8)', paddingTop: 'var(--space-6)', borderTop: '1px solid var(--border-color)' }}>
            <button
              className="btn btn-secondary"
              onClick={handlePrev}
              style={{ visibility: step === 1 ? 'hidden' : 'visible' }}
            >
              Quay lại
            </button>
            
            {step < 3 ? (
              <button
                className="btn btn-primary"
                onClick={handleNext}
                disabled={step === 1 && (!formData.title || !formData.address || !formData.price)}
              >
                Tiếp tục
              </button>
            ) : (
              <button
                className="btn btn-primary"
                onClick={handleSubmit}
                disabled={formData.images.length === 0}
              >
                Hoàn tất đăng tin
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useRoomStore } from '../../stores/roomStore';
import { roomApi, uploadApi } from '../../api/services';
import { MapPin, DollarSign, Users, Square, Check, Upload, Trash2, ArrowLeft, PawPrint, Utensils, Home, Clock, CheckCircle } from 'lucide-react';
import './PostRoomPage.css';

export default function PostRoomPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { roomTypes, amenities, provinces, districts, wards, fetchRoomTypes, fetchAmenities, fetchProvinces, fetchDistricts, fetchWards } = useRoomStore();

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [requireDeposit, setRequireDeposit] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    address: '',
    roomTypeId: '',
    wardId: '',
    provinceId: '',
    districtId: '',
    price: 3000000,
    deposit: 3000000,
    area: 20,
    maxOccupants: 2,
    availableFrom: '',
    allowPet: false,
    allowCooking: false,
    liveWithOwner: false,
    curfewTime: '',
    extraRules: '',
    selectedAmenities: [] as string[],
    images: [] as { file: File; preview: string }[],
    prices: [
      { label: 'Điện', price: 3500, unit: 'kWh', isMetered: true, meterType: 'electric' as const },
      { label: 'Nước', price: 30000, unit: 'm³', isMetered: true, meterType: 'water' as const },
    ] as Array<{ label: string; price: number; unit: string; isMetered: boolean; meterType: 'electric' | 'water' | 'gas' | null }>,
  });

  useEffect(() => {
    fetchRoomTypes();
    fetchAmenities();
    fetchProvinces();
  }, []);

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

  const toggleAmenity = (id: string) => {
    setFormData(prev => ({
      ...prev,
      selectedAmenities: prev.selectedAmenities.includes(id)
        ? prev.selectedAmenities.filter(a => a !== id)
        : [...prev.selectedAmenities, id]
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newImages = Array.from(files).map(file => ({
        file,
        preview: URL.createObjectURL(file),
      }));
      setFormData(prev => ({ ...prev, images: [...prev.images, ...newImages] }));
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleProvinceChange = (provinceId: string) => {
    setFormData(prev => ({ ...prev, provinceId, districtId: '', wardId: '' }));
    if (provinceId) fetchDistricts(provinceId);
  };

  const handleDistrictChange = (districtId: string) => {
    setFormData(prev => ({ ...prev, districtId, wardId: '' }));
    if (districtId) fetchWards(districtId);
  };

  const addServicePrice = () => {
    setFormData(prev => ({
      ...prev,
      prices: [...prev.prices, { label: '', price: 0, unit: 'tháng', isMetered: false, meterType: null }],
    }));
  };

  const removeServicePrice = (index: number) => {
    setFormData(prev => ({ ...prev, prices: prev.prices.filter((_, i) => i !== index) }));
  };

  const updateServicePrice = (index: number, field: string, value: any) => {
    setFormData(prev => {
      const prices = [...prev.prices];
      (prices[index] as any)[field] = value;
      return { ...prev, prices };
    });
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // 1. Upload images
      let imageUrls: string[] = [];
      if (formData.images.length > 0) {
        const res: any = await uploadApi.uploadMultiple(formData.images.map(i => i.file));
        imageUrls = (res.data || []).map((f: any) => f.url);
      }

      // 2. Create room
      const roomData = {
        title: formData.title,
        description: formData.description,
        address: formData.address,
        wardId: formData.wardId,
        roomTypeId: formData.roomTypeId,
        price: formData.price,
        deposit: formData.deposit,
        area: formData.area,
        maxOccupants: formData.maxOccupants,
        availableFrom: formData.availableFrom || null,
        allowPet: formData.allowPet,
        allowCooking: formData.allowCooking,
        liveWithOwner: formData.liveWithOwner,
        curfewTime: formData.curfewTime || null,
        extraRules: formData.extraRules || null,
        amenities: formData.selectedAmenities,
        images: imageUrls.map((url, i) => ({ url, isCover: i === 0 ? 1 : 0, sortOrder: i })),
        prices: formData.prices.filter(p => p.label && p.price > 0),
      };

      await roomApi.create(roomData);
      setShowSuccessModal(true);
      setTimeout(() => {
        navigate('/landlord');
      }, 2000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi đăng tin');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ paddingTop: '68px', minHeight: '100vh', background: 'var(--bg-secondary)' }}>
      <div className="container" style={{ paddingTop: '32px', paddingBottom: '64px', maxWidth: '800px' }}>
        <button className="btn btn-ghost" style={{ marginBottom: '16px' }} onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Quay lại
        </button>

        <h1 style={{ fontSize: '1.875rem', fontWeight: 800, marginBottom: '24px' }}>Đăng tin cho thuê phòng</h1>

        {/* Progress Bar */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '32px' }}>
          {[1, 2, 3, 4].map(i => (
            <div
              key={i}
              style={{
                flex: 1, height: 6, borderRadius: 3,
                background: step >= i ? 'var(--primary-500)' : 'var(--neutral-200)',
                transition: 'background 300ms ease'
              }}
            />
          ))}
        </div>

        <div className="post-room-form">
          {/* STEP 1: Basic Info */}
          {step === 1 && (
            <div className="form-step slide-in">
              <h2>Thông tin cơ bản</h2>

              <div className="input-group">
                <label className="input-label">Tiêu đề <span style={{ color: 'var(--error-500)' }}>*</span></label>
                <input className="input-field" placeholder="Ví dụ: Phòng trọ cao cấp full nội thất..."
                  value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
              </div>

              <div className="input-group">
                <label className="input-label">Loại phòng <span style={{ color: 'var(--error-500)' }}>*</span></label>
                <select className="input-field" value={formData.roomTypeId} onChange={e => setFormData({ ...formData, roomTypeId: e.target.value })}>
                  <option value="">Chọn loại phòng</option>
                  {roomTypes.map(rt => <option key={rt.id} value={rt.id}>{rt.name}</option>)}
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">Tỉnh / Thành phố <span style={{ color: 'var(--error-500)' }}>*</span></label>
                <select className="input-field" value={formData.provinceId} onChange={e => handleProvinceChange(e.target.value)}>
                  <option value="">Chọn tỉnh/thành</option>
                  {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              {districts.length > 0 && (
                <div className="input-group">
                  <label className="input-label">Quận / Huyện <span style={{ color: 'var(--error-500)' }}>*</span></label>
                  <select className="input-field" value={formData.districtId} onChange={e => handleDistrictChange(e.target.value)}>
                    <option value="">Chọn quận/huyện</option>
                    {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              )}

              {wards.length > 0 && (
                <div className="input-group">
                  <label className="input-label">Phường / Xã <span style={{ color: 'var(--error-500)' }}>*</span></label>
                  <select className="input-field" value={formData.wardId} onChange={e => setFormData({ ...formData, wardId: e.target.value })}>
                    <option value="">Chọn phường/xã</option>
                    {wards.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
              )}

              <div className="input-group">
                <label className="input-label">Địa chỉ chi tiết (số nhà, tên đường) <span style={{ color: 'var(--error-500)' }}>*</span></label>
                <div style={{ position: 'relative' }}>
                  <MapPin size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                  <input className="input-field" style={{ paddingLeft: 40 }} placeholder="Số nhà, tên đường..."
                    value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="input-group">
                  <label className="input-label">Giá thuê (VNĐ/tháng) <span style={{ color: 'var(--error-500)' }}>*</span></label>
                  <input className="input-field" type="number" value={formData.price}
                    onChange={e => setFormData({ ...formData, price: Number(e.target.value) })} />
                </div>
                <div className="input-group">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <label className="input-label" style={{ marginBottom: 0 }}>Tiền cọc (VNĐ)</label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 500, color: 'var(--text-secondary)' }}>
                      <input type="checkbox" checked={requireDeposit} onChange={e => {
                        const checked = e.target.checked;
                        setRequireDeposit(checked);
                        setFormData(prev => ({ ...prev, deposit: checked ? (prev.deposit || 3000000) : 0 }));
                      }} />
                      Yêu cầu cọc
                    </label>
                  </div>
                  <input className="input-field" type="number" value={formData.deposit} disabled={!requireDeposit}
                    onChange={e => setFormData({ ...formData, deposit: Number(e.target.value) })}
                    placeholder={requireDeposit ? "Nhập số tiền cọc" : "Không yêu cầu cọc"} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="input-group">
                  <label className="input-label">Diện tích (m²) <span style={{ color: 'var(--error-500)' }}>*</span></label>
                  <input className="input-field" type="number" value={formData.area}
                    onChange={e => setFormData({ ...formData, area: Number(e.target.value) })} />
                </div>
                <div className="input-group">
                  <label className="input-label">Số người tối đa</label>
                  <input className="input-field" type="number" value={formData.maxOccupants}
                    onChange={e => setFormData({ ...formData, maxOccupants: Number(e.target.value) })} />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Ngày trống (để trống nếu sẵn sàng ngay)</label>
                <input className="input-field" type="date" value={formData.availableFrom}
                  onChange={e => setFormData({ ...formData, availableFrom: e.target.value })} />
              </div>
            </div>
          )}

          {/* STEP 2: Rules & Amenities */}
          {step === 2 && (
            <div className="form-step slide-in">
              <h2>Nội quy & Tiện nghi</h2>

              <h3 style={{ marginBottom: '16px' }}>Nội quy phòng</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
                <label className="checkbox-custom" style={{ padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-color)', cursor: 'pointer' }}>
                  <input type="checkbox" checked={formData.allowPet}
                    onChange={e => setFormData({ ...formData, allowPet: e.target.checked })} />
                  <PawPrint size={16} /> Cho phép thú cưng
                </label>
                <label className="checkbox-custom" style={{ padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-color)', cursor: 'pointer' }}>
                  <input type="checkbox" checked={formData.allowCooking}
                    onChange={e => setFormData({ ...formData, allowCooking: e.target.checked })} />
                  <Utensils size={16} /> Cho phép nấu ăn
                </label>
                <label className="checkbox-custom" style={{ padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-color)', cursor: 'pointer' }}>
                  <input type="checkbox" checked={formData.liveWithOwner}
                    onChange={e => setFormData({ ...formData, liveWithOwner: e.target.checked })} />
                  <Home size={16} /> Ở chung chủ nhà
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div className="input-group">
                  <label className="input-label">Giờ giới nghiêm (để trống nếu không)</label>
                  <input className="input-field" type="time" value={formData.curfewTime}
                    onChange={e => setFormData({ ...formData, curfewTime: e.target.value })} />
                </div>
              </div>

              <div className="input-group" style={{ marginBottom: '24px' }}>
                <label className="input-label">Nội quy khác</label>
                <textarea className="input-field" rows={3} placeholder="Quy định riêng khác..."
                  value={formData.extraRules} onChange={e => setFormData({ ...formData, extraRules: e.target.value })} />
              </div>

              <h3 style={{ marginBottom: '16px' }}>Tiện nghi có sẵn</h3>
              <div className="amenities-grid-select">
                {amenities.map(amenity => (
                  <button
                    key={amenity.id}
                    type="button"
                    className={`amenity-toggle-btn ${formData.selectedAmenities.includes(amenity.id) ? 'active' : ''}`}
                    onClick={() => toggleAmenity(amenity.id)}
                  >
                    <span className="amenity-checkbox">
                      {formData.selectedAmenities.includes(amenity.id) && <Check size={14} />}
                    </span>
                    {amenity.icon} {amenity.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: Service Prices */}
          {step === 3 && (
            <div className="form-step slide-in">
              <h2>Chi phí dịch vụ</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                Thêm các chi phí dịch vụ (điện, nước, internet...) cho phòng
              </p>

              {formData.prices.map((sp, index) => (
                <div key={index} style={{ padding: '16px', border: '1px solid var(--border-color)', borderRadius: '12px', marginBottom: '12px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '12px', alignItems: 'end' }}>
                    <div className="input-group">
                      <label className="input-label">Tên dịch vụ</label>
                      <input className="input-field" value={sp.label} placeholder="Ví dụ: Điện"
                        onChange={e => updateServicePrice(index, 'label', e.target.value)} />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Đơn giá (VNĐ)</label>
                      <input className="input-field" type="number" value={sp.price}
                        onChange={e => updateServicePrice(index, 'price', Number(e.target.value))} />
                    </div>
                    <button className="btn btn-ghost btn-icon" onClick={() => removeServicePrice(index)} title="Xóa">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
                    <div className="input-group">
                      <label className="input-label">Đơn vị</label>
                      <input className="input-field" value={sp.unit} placeholder="kWh, m³, tháng..."
                        onChange={e => updateServicePrice(index, 'unit', e.target.value)} />
                    </div>
                    <div className="input-group">
                      <label className="checkbox-custom" style={{ marginTop: '28px' }}>
                        <input type="checkbox" checked={sp.isMetered}
                          onChange={e => updateServicePrice(index, 'isMetered', e.target.checked)} />
                        Tính theo đồng hồ (metered)
                      </label>
                    </div>
                  </div>
                </div>
              ))}

              <button className="btn btn-secondary" onClick={addServicePrice} style={{ marginTop: '8px' }}>
                + Thêm dịch vụ
              </button>

              <div className="input-group" style={{ marginTop: '24px' }}>
                <label className="input-label">Mô tả chi tiết</label>
                <textarea className="input-field" rows={6} placeholder="Mô tả chi tiết về phòng..."
                  value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
              </div>
            </div>
          )}

          {/* STEP 4: Images */}
          {step === 4 && (
            <div className="form-step slide-in">
              <h2>Hình ảnh</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
                Đăng ít nhất 3 hình ảnh rõ nét để thu hút người xem
              </p>

              <div className="image-upload-area">
                <Upload size={48} color="var(--primary-400)" style={{ marginBottom: '16px' }} />
                <h3>Kéo thả ảnh hoặc click để chọn</h3>
                <p>Hỗ trợ JPG, PNG (Tối đa 10MB/ảnh)</p>
                <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="file-input" />
              </div>

              {formData.images.length > 0 && (
                <div className="uploaded-images-preview">
                  {formData.images.map((img, idx) => (
                    <div key={idx} className="preview-image-item">
                      <img src={img.preview} alt="" />
                      {idx === 0 && <span className="badge badge-primary" style={{ position: 'absolute', top: 8, left: 8, fontSize: '0.7rem' }}>Ảnh bìa</span>}
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
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px', paddingTop: '24px', borderTop: '1px solid var(--border-color)' }}>
            <button className="btn btn-secondary" onClick={handlePrev}
              style={{ visibility: step === 1 ? 'hidden' : 'visible' }}>
              Quay lại
            </button>

            {step < 4 ? (
              <button className="btn btn-primary" onClick={handleNext}
                disabled={step === 1 && (!formData.title || !formData.address || !formData.wardId || !formData.roomTypeId)}>
                Tiếp tục
              </button>
            ) : (
              <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Đang đăng...' : 'Hoàn tất đăng tin'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="success-modal-overlay">
          <div className="success-modal-content">
            <div className="success-icon-container">
              <CheckCircle className="success-icon" />
            </div>
            <h3 className="success-modal-title">Đăng phòng thành công!</h3>
            <p className="success-modal-message">
              Phòng của bạn đã được đăng thành công. Đang chuyển hướng về trang quản lý...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

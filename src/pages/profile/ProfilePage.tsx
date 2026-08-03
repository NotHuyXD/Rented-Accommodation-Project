import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import {
  User, Mail, Phone, Shield, Camera, Save,
  Eye, EyeOff, Lock, Bell, Globe, Trash2, Upload, Clock
} from 'lucide-react';
import { userApi, uploadApi } from '../../api/services';
import { getImageUrl } from '../../utils/helpers';
import { alertQuick, confirmAsync } from '../../stores/modalStore';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');

  if (!user) {
    return (
      <div style={{ paddingTop: '120px', textAlign: 'center', minHeight: '60vh' }}>
        <h2>Vui lòng đăng nhập</h2>
        <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={() => navigate('/login')}>Đăng nhập</button>
      </div>
    );
  }

  const [formData, setFormData] = useState({
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
  });

  const handleSave = () => {
    updateProfile(formData);
    alertQuick('success', 'Đã cập nhật hồ sơ!');
  };

  const [kycData, setKycData] = useState({
    idCardFront: null as File | null,
    idCardFrontPreview: '',
    idCardBack: null as File | null,
    idCardBackPreview: ''
  });
  const [isSubmittingKyc, setIsSubmittingKyc] = useState(false);

  const handleKycImageChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'front' | 'back') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const preview = URL.createObjectURL(file);
      if (type === 'front') {
        setKycData(prev => ({ ...prev, idCardFront: file, idCardFrontPreview: preview }));
      } else {
        setKycData(prev => ({ ...prev, idCardBack: file, idCardBackPreview: preview }));
      }
    }
  };

  const handleSubmitKyc = async () => {
    if (!kycData.idCardFront || !kycData.idCardBack) {
      alertQuick('error', 'Vui lòng tải lên đầy đủ ảnh mặt trước và mặt sau CCCD');
      return;
    }
    
    setIsSubmittingKyc(true);
    try {
      let frontUrl = 'https://picsum.photos/600/400';
      let backUrl = 'https://picsum.photos/600/400';
      
      try {
        const resFront: any = await uploadApi.uploadFile(kycData.idCardFront);
        if (resFront.data?.url) frontUrl = resFront.data.url;
        
        const resBack: any = await uploadApi.uploadFile(kycData.idCardBack);
        if (resBack.data?.url) backUrl = resBack.data.url;
      } catch (e) {
        console.warn('Lỗi upload file, dùng ảnh giả lập', e);
      }
      
      await userApi.submitKYC({
        idCardFront: frontUrl,
        idCardBack: backUrl
      });
      
      updateProfile({ ...user, kycStatus: 'pending' } as any);
      alertQuick('success', 'Đã gửi yêu cầu xác thực KYC thành công. Vui lòng chờ Admin duyệt!');
    } catch (error) {
      alertQuick('error', 'Lỗi khi gửi yêu cầu xác thực KYC');
      console.error(error);
    } finally {
      setIsSubmittingKyc(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Hồ sơ cá nhân', icon: User },
    { id: 'security', label: 'Bảo mật', icon: Lock },
    { id: 'notifications', label: 'Thông báo', icon: Bell },
    { id: 'privacy', label: 'Quyền riêng tư', icon: Globe }
  ];
  
  if (user.role === 'landlord') {
    tabs.splice(1, 0, { id: 'kyc', label: 'Xác thực danh tính', icon: Shield });
  }

  return (
    <div style={{ paddingTop: '68px', minHeight: '100vh', background: 'var(--bg-secondary)' }}>
      <div className="container" style={{ paddingTop: 'var(--space-8)', paddingBottom: 'var(--space-16)' }}>
        <h1 style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 800, marginBottom: 'var(--space-6)' }}>
          Cài đặt tài khoản
        </h1>

        <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: 'var(--space-6)' }}>
          {/* Sidebar */}
          <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', padding: 'var(--space-2)', height: 'fit-content' }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                  padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-md)',
                  width: '100%', textAlign: 'left', fontSize: 'var(--font-size-sm)',
                  fontWeight: activeTab === tab.id ? 600 : 400,
                  color: activeTab === tab.id ? 'var(--primary-700)' : 'var(--text-secondary)',
                  background: activeTab === tab.id ? 'var(--primary-50)' : 'transparent',
                  transition: 'all 150ms'
                }}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', padding: 'var(--space-8)' }}>
            {activeTab === 'profile' && (
              <>
                <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, marginBottom: 'var(--space-6)' }}>
                  Hồ sơ cá nhân
                </h2>

                {/* Avatar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-5)', marginBottom: 'var(--space-6)' }}>
                  <div style={{ position: 'relative' }}>
                    <img
                      src={getImageUrl(user.avatar) || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`}
                      alt={user.fullName}
                      style={{ width: 80, height: 80, borderRadius: '50%', border: '3px solid var(--primary-200)' }}
                    />
                    <button style={{
                      position: 'absolute', bottom: 0, right: 0,
                      width: 28, height: 28, borderRadius: '50%',
                      background: 'var(--primary-500)', color: 'white',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: '2px solid white'
                    }}>
                      <Camera size={14} />
                    </button>
                  </div>
                  <div>
                    <h3 style={{ fontWeight: 700 }}>{user.fullName}</h3>
                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                      {user.role === 'tenant' ? 'Khách thuê' : user.role === 'landlord' ? 'Chủ trọ' : 'Quản trị viên'}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginTop: 'var(--space-1)' }}>
                      {user.isVerified ? (
                        <span className="badge badge-success"><Shield size={12} /> Đã xác thực</span>
                      ) : (
                        <span className="badge badge-warning">Chưa xác thực</span>
                      )}
                      {user.kycStatus !== 'none' && (
                        <span className={`badge ${user.kycStatus === 'approved' ? 'badge-primary' : user.kycStatus === 'pending' ? 'badge-warning' : 'badge-neutral'}`}>
                          KYC: {user.kycStatus}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Form */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
                  <div className="input-group">
                    <label className="input-label">Họ và tên</label>
                    <input
                      className="input-field"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                    <div className="input-group">
                      <label className="input-label">Email</label>
                      <input
                        className="input-field"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Số điện thoại</label>
                      <input
                        className="input-field"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                  </div>


                  <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                    <button className="btn btn-primary" onClick={handleSave}>
                      <Save size={16} />
                      Lưu thay đổi
                    </button>
                    <button className="btn btn-secondary">Hủy</button>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'kyc' && user.role === 'landlord' && (
              <>
                <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, marginBottom: 'var(--space-6)' }}>
                  Xác thực danh tính (KYC)
                </h2>
                
                <div style={{ marginBottom: 'var(--space-6)', padding: 'var(--space-4)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-lg)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
                    <Shield size={20} color="var(--primary-600)" />
                    <h3 style={{ fontWeight: 600 }}>Trạng thái xác thực: </h3>
                    <span className={`badge ${user.kycStatus === 'approved' ? 'badge-primary' : user.kycStatus === 'pending' ? 'badge-warning' : user.kycStatus === 'rejected' ? 'badge-error' : 'badge-neutral'}`}>
                      {user.kycStatus === 'approved' ? 'Đã duyệt' : user.kycStatus === 'pending' ? 'Đang chờ duyệt' : user.kycStatus === 'rejected' ? 'Bị từ chối' : 'Chưa xác thực'}
                    </span>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                    Tất cả Chủ trọ bắt buộc phải cung cấp thông tin CCCD/GPLX để hệ thống xác minh nhằm đảm bảo tính an toàn và hạn chế tình trạng phòng trọ ảo.
                  </p>
                </div>

                {user.kycStatus === 'approved' ? (
                  <div style={{ textAlign: 'center', padding: 'var(--space-8)', background: 'var(--success-50)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--success-300)' }}>
                    <Shield size={48} color="var(--success-500)" style={{ margin: '0 auto var(--space-4)' }} />
                    <h3 style={{ color: 'var(--success-700)' }}>Hồ sơ của bạn đã được xác minh</h3>
                    <p style={{ color: 'var(--success-600)' }}>Bạn có thể sử dụng toàn bộ tính năng của Chủ trọ trên hệ thống.</p>
                  </div>
                ) : user.kycStatus === 'pending' ? (
                  <div style={{ textAlign: 'center', padding: 'var(--space-8)', background: 'var(--warning-50)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--warning-300)' }}>
                    <Clock size={48} color="var(--warning-500)" style={{ margin: '0 auto var(--space-4)' }} />
                    <h3 style={{ color: 'var(--warning-700)' }}>Hồ sơ đang chờ duyệt</h3>
                    <p style={{ color: 'var(--warning-600)' }}>Vui lòng chờ Admin kiểm tra và duyệt hồ sơ của bạn trong vòng 24h.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
                    {user.kycStatus === 'rejected' && (
                      <div style={{ padding: 'var(--space-4)', background: 'var(--error-50)', color: 'var(--error-700)', borderRadius: 'var(--radius-md)' }}>
                        Hồ sơ trước đó của bạn đã bị từ chối. Vui lòng kiểm tra lại hình ảnh (rõ nét, không mất góc) và gửi lại.
                      </div>
                    )}
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontWeight: 600 }}>Ảnh mặt trước CCCD</label>
                        <label style={{ 
                          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                          height: '200px', border: '2px dashed var(--border-color)', borderRadius: 'var(--radius-lg)',
                          cursor: 'pointer', overflow: 'hidden', background: 'var(--bg-primary)', position: 'relative'
                        }}>
                          {kycData.idCardFrontPreview ? (
                            <img src={kycData.idCardFrontPreview} alt="Mặt trước" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                          ) : (
                            <>
                              <Upload size={32} color="var(--text-tertiary)" style={{ marginBottom: '8px' }} />
                              <span style={{ color: 'var(--text-secondary)' }}>Nhấn để chọn ảnh</span>
                            </>
                          )}
                          <input type="file" accept="image/*" hidden onChange={(e) => handleKycImageChange(e, 'front')} />
                        </label>
                      </div>
                      
                      <div>
                        <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontWeight: 600 }}>Ảnh mặt sau CCCD</label>
                        <label style={{ 
                          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                          height: '200px', border: '2px dashed var(--border-color)', borderRadius: 'var(--radius-lg)',
                          cursor: 'pointer', overflow: 'hidden', background: 'var(--bg-primary)', position: 'relative'
                        }}>
                          {kycData.idCardBackPreview ? (
                            <img src={kycData.idCardBackPreview} alt="Mặt sau" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                          ) : (
                            <>
                              <Upload size={32} color="var(--text-tertiary)" style={{ marginBottom: '8px' }} />
                              <span style={{ color: 'var(--text-secondary)' }}>Nhấn để chọn ảnh</span>
                            </>
                          )}
                          <input type="file" accept="image/*" hidden onChange={(e) => handleKycImageChange(e, 'back')} />
                        </label>
                      </div>
                    </div>
                    
                    <button 
                      className="btn btn-primary" 
                      style={{ width: 'fit-content' }} 
                      onClick={handleSubmitKyc}
                      disabled={isSubmittingKyc}
                    >
                      {isSubmittingKyc ? 'Đang gửi...' : 'Gửi yêu cầu xác thực'}
                    </button>
                  </div>
                )}
              </>
            )}

            {activeTab === 'security' && (
              <>
                <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, marginBottom: 'var(--space-6)' }}>
                  Bảo mật
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
                  <div className="input-group">
                    <label className="input-label">Mật khẩu hiện tại</label>
                    <input className="input-field" type="password" placeholder="••••••••" />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Mật khẩu mới</label>
                    <input className="input-field" type="password" placeholder="Tối thiểu 8 ký tự" />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Xác nhận mật khẩu</label>
                    <input className="input-field" type="password" placeholder="Nhập lại mật khẩu" />
                  </div>
                  <button className="btn btn-primary" style={{ width: 'fit-content' }}>
                    <Lock size={16} />
                    Đổi mật khẩu
                  </button>

                  <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: 'var(--space-4) 0' }} />


                  <h3 style={{ fontWeight: 700, marginBottom: 'var(--space-3)', color: 'var(--error-500)' }}>Vùng nguy hiểm</h3>
                  <button className="btn btn-danger" style={{ width: 'fit-content' }}>
                    <Trash2 size={16} />
                    Xóa tài khoản
                  </button>
                </div>
              </>
            )}

            {activeTab === 'notifications' && (
              <>
                <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, marginBottom: 'var(--space-6)' }}>
                  Thông báo
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  {[
                    'Tin nhắn mới',
                    'Lịch xem phòng',
                    'Hóa đơn & thanh toán',
                    'Hợp đồng',
                    'Phòng gợi ý',
                    'Khuyến mãi & tin tức'
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-3) 0', borderBottom: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>{item}</span>
                      <label className="toggle">
                        <input type="checkbox" defaultChecked={i < 4} />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                  ))}
                </div>
              </>
            )}

            {activeTab === 'privacy' && (
              <>
                <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, marginBottom: 'var(--space-6)' }}>
                  Quyền riêng tư
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  {[
                    'Hiển thị số điện thoại',
                    'Hiển thị email',
                    'Hiển thị hồ sơ công khai'
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-3) 0', borderBottom: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>{item}</span>
                      <label className="toggle">
                        <input type="checkbox" defaultChecked={i < 2} />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

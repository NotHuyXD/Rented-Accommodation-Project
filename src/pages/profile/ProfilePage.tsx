import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import {
  User, Mail, Phone, Shield, Camera, Save,
  Eye, EyeOff, Lock, Bell, Globe, Trash2
} from 'lucide-react';
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

  const tabs = [
    { id: 'profile', label: 'Hồ sơ cá nhân', icon: User },
    { id: 'security', label: 'Bảo mật', icon: Lock },
    { id: 'notifications', label: 'Thông báo', icon: Bell },
    { id: 'privacy', label: 'Quyền riêng tư', icon: Globe }
  ];

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

                  <h3 style={{ fontWeight: 700, marginBottom: 'var(--space-3)' }}>Xác thực hai yếu tố</h3>
                  <label className="checkbox-custom">
                    <input type="checkbox" />
                    Bật xác thực OTP qua SMS
                  </label>
                  <label className="checkbox-custom">
                    <input type="checkbox" />
                    Bật xác thực OTP qua Email
                  </label>

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
                    'Hiển thị hồ sơ công khai',
                    'Cho phép người lạ nhắn tin'
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

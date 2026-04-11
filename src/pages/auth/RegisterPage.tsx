import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { Building2, Mail, Lock, User, Phone, Eye, EyeOff, UserPlus, ArrowRight } from 'lucide-react';
import './AuthPages.css';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register } = useAuthStore();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: (searchParams.get('role') as 'tenant' | 'landlord') || 'tenant',
    agreeTerms: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = e.target as HTMLInputElement;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    setFormData(prev => ({ ...prev, [target.name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    if (!formData.agreeTerms) {
      setError('Bạn cần đồng ý với điều khoản sử dụng');
      return;
    }

    setLoading(true);
    const success = await register({
      fullName: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      password: formData.password,
      role: formData.role
    });

    if (success) {
      navigate('/');
    } else {
      setError('Đăng ký thất bại. Vui lòng thử lại.');
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-bg-gradient"></div>
      </div>

      <div className="auth-container">
        <div className="auth-card animate-scaleIn">
          <div className="auth-brand">
            <Link to="/" className="auth-logo">
              <Building2 size={28} />
              <span>PhòngTrọ<span className="auth-logo-dot">.vn</span></span>
            </Link>
          </div>

          <h1 className="auth-title">Đăng ký tài khoản</h1>
          <p className="auth-subtitle">Tạo tài khoản để bắt đầu</p>

          {error && (
            <div className="auth-error animate-slideDown">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            {/* Role Selection */}
            <div className="auth-role-selector">
              <button
                type="button"
                className={`auth-role-btn ${formData.role === 'tenant' ? 'active' : ''}`}
                onClick={() => setFormData(prev => ({ ...prev, role: 'tenant' }))}
              >
                <User size={20} />
                <span>Người thuê</span>
              </button>
              <button
                type="button"
                className={`auth-role-btn ${formData.role === 'landlord' ? 'active' : ''}`}
                onClick={() => setFormData(prev => ({ ...prev, role: 'landlord' }))}
              >
                <Building2 size={20} />
                <span>Chủ trọ</span>
              </button>
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="fullName">Họ và tên</label>
              <div className="input-with-icon">
                <User size={18} className="input-icon" />
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  className="input-field"
                  placeholder="Nguyễn Văn A"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="registerEmail">Email</label>
              <div className="input-with-icon">
                <Mail size={18} className="input-icon" />
                <input
                  id="registerEmail"
                  name="email"
                  type="email"
                  className="input-field"
                  placeholder="example@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="phone">Số điện thoại</label>
              <div className="input-with-icon">
                <Phone size={18} className="input-icon" />
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  className="input-field"
                  placeholder="0901234567"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="registerPassword">Mật khẩu</label>
              <div className="input-with-icon">
                <Lock size={18} className="input-icon" />
                <input
                  id="registerPassword"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  className="input-field"
                  placeholder="Tối thiểu 8 ký tự"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={8}
                  style={{ paddingRight: '40px' }}
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="confirmPassword">Xác nhận mật khẩu</label>
              <div className="input-with-icon">
                <Lock size={18} className="input-icon" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  className="input-field"
                  placeholder="Nhập lại mật khẩu"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <label className="checkbox-custom" style={{ marginTop: 'var(--space-2)' }}>
              <input
                type="checkbox"
                name="agreeTerms"
                checked={formData.agreeTerms}
                onChange={handleChange}
              />
              Tôi đồng ý với <a href="#" style={{ color: 'var(--primary-600)', fontWeight: 600 }}>Điều khoản sử dụng</a>
            </label>

            <button
              type="submit"
              className="btn btn-primary btn-xl auth-submit"
              disabled={loading}
            >
              {loading ? (
                <span className="auth-loading">
                  <span className="animate-spin">⟳</span> Đang xử lý...
                </span>
              ) : (
                <>
                  <UserPlus size={20} />
                  Đăng ký
                </>
              )}
            </button>
          </form>

          <p className="auth-switch">
            Đã có tài khoản?{' '}
            <Link to="/login">
              Đăng nhập <ArrowRight size={14} />
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

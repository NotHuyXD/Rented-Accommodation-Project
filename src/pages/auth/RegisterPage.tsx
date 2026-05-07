import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { Building2, Mail, Lock, User, Phone, Eye, EyeOff, UserPlus, ArrowRight } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import './AuthPages.css';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register, googleLogin } = useAuthStore();
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

  const registerWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      setError('');
      const success = await googleLogin(tokenResponse.access_token);
      if (success) {
        navigate('/');
      } else {
        setError('Đăng ký Google thất bại. Vui lòng thử lại.');
      }
      setLoading(false);
    },
    onError: () => {
      setError('Đăng ký Google thất bại. Vui lòng thử lại.');
    }
  });

  const handleSocialRegister = (provider: string) => {
    if (provider === 'Google') {
      registerWithGoogle();
    } else {
      alert(`Đăng ký bằng ${provider} sẽ sớm được hỗ trợ!\n\nTính năng đang được phát triển.`);
    }
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

          {/* Social Login */}
          <div className="auth-divider">
            <span>hoặc đăng ký với</span>
          </div>

          <div className="auth-social-btns">
            <button type="button" className="btn btn-secondary auth-social-btn" onClick={() => handleSocialRegister('Google')} disabled={loading}>
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google
            </button>
            <button type="button" className="btn btn-secondary auth-social-btn" style={{ background: '#1877F2', color: 'white', border: 'none' }} onClick={() => handleSocialRegister('Facebook')} disabled={loading}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Facebook
            </button>
          </div>

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

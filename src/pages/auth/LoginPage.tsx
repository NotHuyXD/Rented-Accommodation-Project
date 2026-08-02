import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { Building2, Mail, Lock, Eye, EyeOff, LogIn, ArrowRight } from 'lucide-react';
import { alertQuick } from '../../stores/modalStore';
import './AuthPages.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const success = await login(email, password);
    if (success) {
      navigate('/');
    } else {
      setError('Email hoặc mật khẩu không đúng.');
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
          {/* Brand */}
          <div className="auth-brand">
            <Link to="/" className="auth-logo">
              <Building2 size={28} />
              <span>PhòngTrọ<span className="auth-logo-dot">.vn</span></span>
            </Link>
          </div>

          <h1 className="auth-title">Đăng nhập</h1>
          <p className="auth-subtitle">Chào mừng bạn quay lại</p>

          {error && (
            <div className="auth-error animate-slideDown">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="input-group">
              <label className="input-label" htmlFor="email">Email</label>
              <div className="input-with-icon">
                <Mail size={18} className="input-icon" />
                <input
                  id="email"
                  type="email"
                  className="input-field"
                  placeholder="example@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="password">Mật khẩu</label>
              <div className="input-with-icon">
                <Lock size={18} className="input-icon" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="input-field"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
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

            <div className="auth-options">
              <label className="checkbox-custom">
                <input type="checkbox" />
                Ghi nhớ đăng nhập
              </label>
              <Link to="/forgot-password" className="auth-forgot">Quên mật khẩu?</Link>
            </div>

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
                  <LogIn size={20} />
                  Đăng nhập
                </>
              )}
            </button>
          </form>



          <p className="auth-switch">
            Chưa có tài khoản?{' '}
            <Link to="/register">
              Đăng ký ngay <ArrowRight size={14} />
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

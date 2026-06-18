import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { Shield, Mail, Lock, Eye, EyeOff, LogIn, ArrowLeft } from 'lucide-react';
import '../auth/AuthPages.css';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { login, logout } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const success = await login(email, password);
      if (success) {
        // Access the updated user role directly from authStore
        const currentUser = useAuthStore.getState().user;
        if (currentUser && currentUser.role === 'admin') {
          navigate('/admin');
        } else {
          // If logged-in user is not admin, logout and show error
          await logout();
          setError('Tài khoản của bạn không có quyền truy cập trang quản trị.');
        }
      } else {
        setError('Email hoặc mật khẩu không đúng.');
      }
    } catch (err) {
      console.error(err);
      setError('Có lỗi xảy ra khi đăng nhập.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page admin-login-page" style={{ background: '#0f172a' }}>
      <div className="auth-bg">
        <div className="auth-bg-gradient" style={{ background: 'radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.15) 0%, rgba(15, 23, 42, 0.9) 100%)' }}></div>
      </div>

      <div className="auth-container">
        <div className="auth-card animate-scaleIn" style={{ background: 'rgba(30, 41, 59, 0.7)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
          {/* Brand/System Logo */}
          <div className="auth-brand" style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.15)', color: '#6366f1', marginBottom: 'var(--space-3)' }}>
              <Shield size={32} />
            </div>
            <h1 className="auth-title" style={{ color: '#ffffff', fontSize: '1.75rem', fontWeight: 800, marginTop: 'var(--space-2)' }}>
              Quản trị Hệ thống
            </h1>
            <p className="auth-subtitle" style={{ color: '#94a3b8', fontSize: '0.925rem' }}>
              Đăng nhập dành cho Quản trị viên
            </p>
          </div>

          {error && (
            <div className="auth-error animate-slideDown" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#f87171', borderRadius: '12px', padding: '12px', marginBottom: '16px', fontSize: '0.875rem' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="input-group" style={{ marginBottom: '20px' }}>
              <label className="input-label" htmlFor="email" style={{ color: '#cbd5e1', fontWeight: 500 }}>Email quản trị</label>
              <div className="input-with-icon">
                <Mail size={18} className="input-icon" style={{ color: '#64748b' }} />
                <input
                  id="email"
                  type="email"
                  className="input-field"
                  placeholder="admin@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{ background: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#ffffff' }}
                />
              </div>
            </div>

            <div className="input-group" style={{ marginBottom: '24px' }}>
              <label className="input-label" htmlFor="password" style={{ color: '#cbd5e1', fontWeight: 500 }}>Mật khẩu</label>
              <div className="input-with-icon">
                <Lock size={18} className="input-icon" style={{ color: '#64748b' }} />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="input-field"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ background: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#ffffff', paddingRight: '40px' }}
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ color: '#64748b' }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-xl auth-submit"
              disabled={loading}
              style={{ background: '#6366f1', color: '#ffffff', width: '100%', border: 'none', borderRadius: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', transition: 'all 0.2s' }}
            >
              {loading ? (
                <span className="auth-loading">
                  <span className="animate-spin">⟳</span> Đang xác thực...
                </span>
              ) : (
                <>
                  <LogIn size={20} />
                  Đăng nhập hệ thống
                </>
              )}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 'var(--space-6)' }}>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => navigate('/')}
              style={{ color: '#94a3b8', fontSize: '0.875rem', display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'transparent', border: 'none', cursor: 'pointer' }}
            >
              <ArrowLeft size={16} />
              Quay lại Trang chủ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../api/services';
import { Building2, Mail, ArrowLeft, KeyRound, CheckCircle2 } from 'lucide-react';
import './AuthPages.css';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'email' | 'otp' | 'newPassword' | 'success'>('email');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email) {
      setError('Vui lòng nhập email');
      return;
    }

    setLoading(true);
    try {
      await authApi.forgotPassword({ email });
      setStep('otp');
    } catch (err: any) {
      // Even if email doesn't exist, we show success for security
      setStep('otp');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!otp || otp.length < 6) {
      setError('Vui lòng nhập mã OTP 6 chữ số');
      return;
    }

    setLoading(true);
    try {
      await authApi.verifyResetOTP({ email, otp });
      setStep('newPassword');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Mã OTP không hợp lệ hoặc đã hết hạn');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!newPassword || newPassword.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Xác nhận mật khẩu không khớp');
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword({ email, otp, newPassword });
      setStep('success');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đặt lại mật khẩu thất bại');
    } finally {
      setLoading(false);
    }
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

          {step === 'success' ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ 
                width: 80, height: 80, borderRadius: '50%', 
                background: 'linear-gradient(135deg, #10b981, #059669)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px', color: 'white'
              }}>
                <CheckCircle2 size={40} />
              </div>
              <h1 className="auth-title">Đặt lại mật khẩu thành công!</h1>
              <p className="auth-subtitle" style={{ marginBottom: '24px' }}>
                Mật khẩu của bạn đã được cập nhật. Bạn có thể đăng nhập với mật khẩu mới.
              </p>
              <button
                className="btn btn-primary btn-xl auth-submit"
                onClick={() => navigate('/login')}
              >
                Đăng nhập ngay
              </button>
            </div>
          ) : (
            <>
              <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                <div style={{ 
                  width: 64, height: 64, borderRadius: '50%', 
                  background: 'var(--primary-100)', color: 'var(--primary-600)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px'
                }}>
                  <KeyRound size={28} />
                </div>
              </div>

              <h1 className="auth-title">
                {step === 'email' && 'Quên mật khẩu'}
                {step === 'otp' && 'Xác minh OTP'}
                {step === 'newPassword' && 'Đặt mật khẩu mới'}
              </h1>
              <p className="auth-subtitle">
                {step === 'email' && 'Nhập email đăng ký để nhận mã xác thực'}
                {step === 'otp' && `Nhập mã OTP đã gửi đến ${email}`}
                {step === 'newPassword' && 'Nhập mật khẩu mới cho tài khoản của bạn'}
              </p>

              {error && (
                <div className="auth-error animate-slideDown">
                  {error}
                </div>
              )}

              {step === 'email' && (
                <form onSubmit={handleSendOTP} className="auth-form">
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

                  <button
                    type="submit"
                    className="btn btn-primary btn-xl auth-submit"
                    disabled={loading}
                    style={{ marginTop: '16px' }}
                  >
                    {loading ? (
                      <span className="auth-loading">
                        <span className="animate-spin">⟳</span> Đang gửi...
                      </span>
                    ) : (
                      'Gửi mã xác thực'
                    )}
                  </button>
                </form>
              )}

              {step === 'otp' && (
                <form onSubmit={handleVerifyOTP} className="auth-form">
                  <div className="input-group">
                    <label className="input-label" htmlFor="otp">Mã OTP</label>
                    <input
                      id="otp"
                      type="text"
                      className="input-field"
                      placeholder="Nhập mã 6 chữ số"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      maxLength={6}
                      style={{ textAlign: 'center', letterSpacing: '8px', fontSize: '1.5rem', fontWeight: 700 }}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary btn-xl auth-submit"
                    disabled={loading}
                    style={{ marginTop: '16px' }}
                  >
                    {loading ? 'Đang xác minh...' : 'Xác minh OTP'}
                  </button>

                  <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Chưa nhận được mã?{' '}
                    <button
                      type="button"
                      style={{ color: 'var(--primary-600)', fontWeight: 600, textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
                      onClick={() => { setError(''); handleSendOTP(new Event('submit') as any); }}
                    >
                      Gửi lại
                    </button>
                  </p>
                </form>
              )}

              {step === 'newPassword' && (
                <form onSubmit={handleResetPassword} className="auth-form">
                  <div className="input-group">
                    <label className="input-label" htmlFor="newPassword">Mật khẩu mới</label>
                    <input
                      id="newPassword"
                      type="password"
                      className="input-field"
                      placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      minLength={6}
                      required
                    />
                  </div>
                  <div className="input-group" style={{ marginTop: '16px' }}>
                    <label className="input-label" htmlFor="confirmPassword">Xác nhận mật khẩu</label>
                    <input
                      id="confirmPassword"
                      type="password"
                      className="input-field"
                      placeholder="Nhập lại mật khẩu mới"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary btn-xl auth-submit"
                    disabled={loading}
                    style={{ marginTop: '16px' }}
                  >
                    {loading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
                  </button>
                </form>
              )}

              <p className="auth-switch" style={{ marginTop: '24px' }}>
                <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <ArrowLeft size={14} />
                  Quay lại đăng nhập
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useAppStore } from '../../stores/appStore';
import {
  Home, Search, Heart, MessageCircle, User, Menu, X, Bell,
  LogIn, UserPlus, ChevronDown, Building2, LayoutDashboard,
  Settings, LogOut, Shield, Plus, BarChart3, FileText
} from 'lucide-react';
import { getImageUrl } from '../../utils/helpers';
import './Header.css';

export default function Header() {
  const { user, logout } = useAuthStore();
  const { unreadCount } = useAppStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const isAuthenticated = !!user;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

  const isActive = (path: string) => location.pathname === path;
  const isHomePage = location.pathname === '/';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getRoleDashboard = () => {
    if (!user) return '/';
    switch (user.role) {
      case 'admin': return '/admin';
      case 'landlord': return '/landlord';
      case 'tenant': return '/tenant';
      default: return '/';
    }
  };

  const getRoleLabel = () => {
    if (!user) return '';
    switch (user.role) {
      case 'admin': return 'Quản trị viên';
      case 'landlord': return 'Chủ trọ';
      case 'tenant': return 'Khách thuê';
      default: return '';
    }
  };

  const defaultAvatar = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user?.fullName || 'U') + '&background=06b6d4&color=fff';

  return (
    <header className={`header ${scrolled ? 'header-scrolled' : ''} ${isHomePage && !scrolled ? 'header-transparent' : ''}`}>
      <div className="header-container container-lg">
        {/* Logo */}
        <Link to="/" className="header-logo">
          <div className="header-logo-icon">
            <Building2 size={24} />
          </div>
          <div className="header-logo-text">
            <span className="header-logo-name">PhòngTrọ</span>
            <span className="header-logo-dot">.vn</span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="header-nav hide-mobile">
          <Link to="/" className={`header-nav-link ${isActive('/') ? 'active' : ''}`}>
            <Home size={18} />
            <span>Trang chủ</span>
          </Link>
          <Link to="/rooms" className={`header-nav-link ${isActive('/rooms') ? 'active' : ''}`}>
            <Search size={18} />
            <span>Tìm phòng</span>
          </Link>
          {isAuthenticated && (
            <>
              <Link to="/favorites" className={`header-nav-link ${isActive('/favorites') ? 'active' : ''}`}>
                <Heart size={18} />
                <span>Yêu thích</span>
              </Link>
              <Link to="/chat" className={`header-nav-link ${isActive('/chat') ? 'active' : ''}`}>
                <MessageCircle size={18} />
                <span>Tin nhắn</span>
              </Link>
            </>
          )}
        </nav>

        {/* Right Actions */}
        <div className="header-actions">
          {isAuthenticated && user ? (
            <>
              {user.role === 'landlord' && (
                <Link to="/landlord/rooms/new" className="btn btn-accent btn-sm hide-mobile">
                  <Plus size={16} />
                  Đăng phòng
                </Link>
              )}

              {/* Notification Bell */}
              <button className="header-icon-btn" onClick={() => navigate('/tenant')}>
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="header-notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
              </button>

              {/* User Menu */}
              <div className="header-user-menu" ref={userMenuRef}>
                <button
                  className="header-user-trigger"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                >
                  <img
                    src={getImageUrl(user.avatar) || defaultAvatar}
                    alt={user.fullName}
                    className="header-user-avatar"
                    onError={(e) => { (e.target as HTMLImageElement).src = defaultAvatar; }}
                  />
                  <div className="header-user-info hide-mobile">
                    <span className="header-user-name">{user.fullName}</span>
                    <span className="header-user-role">{getRoleLabel()}</span>
                  </div>
                  <ChevronDown size={16} className={`header-chevron ${userMenuOpen ? 'open' : ''}`} />
                </button>

                {userMenuOpen && (
                  <div className="header-dropdown animate-slideDown">
                    <div className="header-dropdown-header">
                      <img src={getImageUrl(user.avatar) || defaultAvatar} alt={user.fullName} className="header-dropdown-avatar"
                        onError={(e) => { (e.target as HTMLImageElement).src = defaultAvatar; }} />
                      <div>
                        <div className="header-dropdown-name">{user.fullName}</div>
                        <div className="header-dropdown-email">{user.email}</div>
                      </div>
                    </div>
                    <div className="header-dropdown-divider"></div>
                    <Link to={getRoleDashboard()} className="header-dropdown-item">
                      <LayoutDashboard size={18} />
                      Dashboard
                    </Link>
                    <Link to="/profile" className="header-dropdown-item">
                      <User size={18} />
                      Hồ sơ cá nhân
                    </Link>
                    {user.role === 'landlord' && (
                      <>
                        <Link to="/contracts" className="header-dropdown-item">
                          <FileText size={18} />
                          Hợp đồng
                        </Link>
                        <Link to="/payments" className="header-dropdown-item">
                          <BarChart3 size={18} />
                          Thanh toán
                        </Link>
                      </>
                    )}
                    {user.role === 'admin' && (
                      <Link to="/admin" className="header-dropdown-item">
                        <Shield size={18} />
                        Quản trị
                      </Link>
                    )}
                    <Link to="/profile" className="header-dropdown-item">
                      <Settings size={18} />
                      Cài đặt
                    </Link>
                    <div className="header-dropdown-divider"></div>
                    <button className="header-dropdown-item header-dropdown-logout" onClick={handleLogout}>
                      <LogOut size={18} />
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="header-auth-btns">
              <Link to="/login" className="btn btn-ghost btn-sm">
                <LogIn size={16} />
                <span className="hide-mobile">Đăng nhập</span>
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                <UserPlus size={16} />
                <span className="hide-mobile">Đăng ký</span>
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button
            className="header-mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="header-mobile-menu animate-slideDown">
          <nav className="header-mobile-nav">
            <Link to="/" className={`header-mobile-link ${isActive('/') ? 'active' : ''}`}>
              <Home size={20} />
              Trang chủ
            </Link>
            <Link to="/rooms" className={`header-mobile-link ${isActive('/rooms') ? 'active' : ''}`}>
              <Search size={20} />
              Tìm phòng
            </Link>
            {isAuthenticated && (
              <>
                <Link to="/favorites" className={`header-mobile-link ${isActive('/favorites') ? 'active' : ''}`}>
                  <Heart size={20} />
                  Yêu thích
                </Link>
                <Link to="/chat" className={`header-mobile-link ${isActive('/chat') ? 'active' : ''}`}>
                  <MessageCircle size={20} />
                  Tin nhắn
                </Link>
                <Link to={getRoleDashboard()} className="header-mobile-link">
                  <LayoutDashboard size={20} />
                  Dashboard
                </Link>
                <Link to="/profile" className="header-mobile-link">
                  <User size={20} />
                  Hồ sơ cá nhân
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

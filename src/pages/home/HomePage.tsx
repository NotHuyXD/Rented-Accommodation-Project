import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useRoomStore } from '../../stores/roomStore';
import { useAuthStore } from '../../stores/authStore';
import { formatCurrency } from '../../utils/helpers';
import {
  Search, MapPin, Shield, Zap, Users, Star, ArrowRight,
  Building2, Heart, Eye, ChevronRight, Wifi, Snowflake,
  Car, Sofa, PawPrint, CheckCircle2, TrendingUp, Clock,
  Phone, MessageCircle
} from 'lucide-react';
import './HomePage.css';

export default function HomePage() {
  const navigate = useNavigate();
  const { rooms, fetchRooms, isLoading } = useRoomStore();
  const { loginAsRole } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('');

  useEffect(() => {
    // Nếu chưa có data thật thì gọi API (mock data có id bắt đầu bằng 'r1')
    if (rooms.length === 0 || rooms.some(r => r.id === 'r1')) {
      fetchRooms();
    }
  }, [fetchRooms, rooms]);

  const featuredRooms = rooms.filter(r => r.isPinned || r.isBoosted).slice(0, 4);
  const latestRooms = [...rooms].sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ).slice(0, 4);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (selectedCity) params.set('city', selectedCity);
    navigate(`/rooms?${params.toString()}`);
  };

  const handleQuickLogin = (role: 'tenant' | 'landlord' | 'admin') => {
    loginAsRole(role);
    if (role === 'admin') navigate('/admin');
    else if (role === 'landlord') navigate('/landlord');
    else navigate('/');
  };

  const stats = [
    { icon: Building2, label: 'Phòng trọ', value: '10,000+' },
    { icon: Users, label: 'Người dùng', value: '50,000+' },
    { icon: MapPin, label: 'Tỉnh thành', value: '63' },
    { icon: Star, label: 'Đánh giá 5 sao', value: '8,500+' }
  ];

  const features = [
    {
      icon: Search,
      title: 'Tìm kiếm thông minh',
      description: 'Bộ lọc chi tiết, tìm kiếm bản đồ, gợi ý AI phù hợp nhu cầu của bạn.',
      color: '#06b6d4'
    },
    {
      icon: Shield,
      title: 'An toàn & Tin cậy',
      description: 'Xác thực eKYC, đánh giá hai chiều, hợp đồng điện tử bảo vệ quyền lợi.',
      color: '#10b981'
    },
    {
      icon: Zap,
      title: 'Thanh toán tiện lợi',
      description: 'Hỗ trợ VNPay, MoMo, ZaloPay. Hóa đơn tự động, quản lý điện nước.',
      color: '#f97316'
    },
    {
      icon: MessageCircle,
      title: 'Kết nối trực tiếp',
      description: 'Chat realtime, gọi điện, đặt lịch xem phòng nhanh chóng.',
      color: '#8b5cf6'
    }
  ];

  const cities = [
    { name: 'TP. Hồ Chí Minh', count: 5200, image: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=400' },
    { name: 'Hà Nội', count: 3800, image: 'https://images.unsplash.com/photo-1509030450996-dd1a26613e2c?w=400' },
    { name: 'Đà Nẵng', count: 1500, image: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=400' }
  ];

  return (
    <div className="home-page">
      {/* ==================== HERO SECTION ==================== */}
      <section className="hero">
        <div className="hero-bg">
          <div className="hero-gradient"></div>
          <div className="hero-pattern"></div>
        </div>

        <div className="hero-content container">
          <div className="hero-text animate-slideUp">
            <span className="hero-badge">
              <Zap size={14} />
              Nền tảng #1 Việt Nam
            </span>
            <h1 className="hero-title">
              Tìm phòng trọ
              <span className="hero-title-accent"> hoàn hảo </span>
              cho bạn
            </h1>
            <p className="hero-subtitle">
              Hàng ngàn phòng trọ chất lượng, giá tốt nhất. Kết nối trực tiếp với chủ trọ, 
              hợp đồng minh bạch, thanh toán an toàn.
            </p>
          </div>

          {/* Search Bar */}
          <div className="hero-search animate-slideUp" style={{ animationDelay: '0.1s' }}>
            <div className="hero-search-inner">
              <div className="hero-search-field">
                <MapPin size={20} className="hero-search-icon" />
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="hero-search-select"
                >
                  <option value="">Tất cả thành phố</option>
                  <option value="Hồ Chí Minh">TP. Hồ Chí Minh</option>
                  <option value="Hà Nội">Hà Nội</option>
                  <option value="Đà Nẵng">Đà Nẵng</option>
                </select>
              </div>
              <div className="hero-search-divider"></div>
              <div className="hero-search-field hero-search-field-main">
                <Search size={20} className="hero-search-icon" />
                <input
                  type="text"
                  placeholder="Tìm theo quận, đường, địa điểm..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="hero-search-input"
                />
              </div>
              <button className="hero-search-btn" onClick={handleSearch}>
                <Search size={20} />
                <span>Tìm kiếm</span>
              </button>
            </div>

            {/* Quick filters */}
            <div className="hero-quick-filters">
              <span className="hero-quick-label">Phổ biến:</span>
              <button className="hero-quick-tag" onClick={() => { setSearchQuery('Quận 1'); handleSearch(); }}>
                Quận 1
              </button>
              <button className="hero-quick-tag" onClick={() => { setSearchQuery('Bình Thạnh'); handleSearch(); }}>
                Bình Thạnh
              </button>
              <button className="hero-quick-tag" onClick={() => { setSearchQuery('Thủ Đức'); handleSearch(); }}>
                Thủ Đức
              </button>
              <button className="hero-quick-tag" onClick={() => navigate('/rooms?maxPrice=3000000')}>
                Dưới 3 triệu
              </button>
              <button className="hero-quick-tag" onClick={() => navigate('/rooms?furniture=true')}>
                <Sofa size={14} />
                Full nội thất
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="hero-stats animate-slideUp" style={{ animationDelay: '0.2s' }}>
            {stats.map((stat, i) => (
              <div key={i} className="hero-stat">
                <stat.icon size={24} className="hero-stat-icon" />
                <div>
                  <div className="hero-stat-value">{stat.value}</div>
                  <div className="hero-stat-label">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== QUICK LOGIN (Demo) ==================== */}
      <section className="quick-login-section">
        <div className="container">
          <div className="quick-login-bar">
            <span className="quick-login-label">🚀 Demo nhanh:</span>
            <button className="btn btn-secondary btn-sm" onClick={() => handleQuickLogin('tenant')}>
              <Users size={16} />
              Đăng nhập Khách thuê
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => handleQuickLogin('landlord')}>
              <Building2 size={16} />
              Đăng nhập Chủ trọ
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => handleQuickLogin('admin')}>
              <Shield size={16} />
              Đăng nhập Admin
            </button>
          </div>
        </div>
      </section>

      {/* ==================== FEATURED ROOMS ==================== */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <div>
              <h2 className="section-title">Phòng nổi bật</h2>
              <p className="section-subtitle">Những phòng trọ được đánh giá cao nhất</p>
            </div>
            <Link to="/rooms" className="btn btn-secondary">
              Xem tất cả
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="room-grid">
            {featuredRooms.map((room, index) => (
              <div
                key={room.id}
                className="room-card animate-slideUp"
                style={{ animationDelay: `${index * 0.1}s` }}
                onClick={() => navigate(`/rooms/${room.id}`)}
              >
                <div className="room-card-image">
                  <img src={room.images[0]} alt={room.title} loading="lazy" />
                  <div className="room-card-overlay">
                    {room.isPinned && (
                      <span className="room-card-badge room-card-badge-pin">
                        <TrendingUp size={12} />
                        Nổi bật
                      </span>
                    )}
                    <button
                      className="room-card-fav"
                      onClick={(e) => { e.stopPropagation(); }}
                    >
                      <Heart size={18} />
                    </button>
                  </div>
                  <div className="room-card-price-tag">
                    {formatCurrency(room.price)}<span>/tháng</span>
                  </div>
                </div>

                <div className="room-card-body">
                  <h3 className="room-card-title">{room.title}</h3>
                  <div className="room-card-location">
                    <MapPin size={14} />
                    <span>{room.address}, {room.district}</span>
                  </div>

                  <div className="room-card-amenities">
                    <span className="room-card-area">{room.area}m²</span>
                    <span className="room-card-dot">•</span>
                    <span>{room.maxOccupants} người</span>
                    {room.hasWifi && <Wifi size={14} className="room-card-amenity-icon" />}
                    {room.hasAC && <Snowflake size={14} className="room-card-amenity-icon" />}
                    {room.hasParking && <Car size={14} className="room-card-amenity-icon" />}
                    {room.allowPets && <PawPrint size={14} className="room-card-amenity-icon" />}
                  </div>

                  <div className="room-card-footer">
                    <div className="room-card-rating">
                      <Star size={14} fill="#f59e0b" color="#f59e0b" />
                      <span>{room.rating}</span>
                      <span className="room-card-reviews">({room.reviewCount})</span>
                    </div>
                    <div className="room-card-views">
                      <Eye size={14} />
                      <span>{room.views}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== FEATURES ==================== */}
      <section className="section section-alt">
        <div className="container">
          <div className="section-header section-header-center">
            <h2 className="section-title">Tại sao chọn PhòngTrọ.vn?</h2>
            <p className="section-subtitle">Nền tảng toàn diện cho cả người thuê và chủ trọ</p>
          </div>

          <div className="features-grid">
            {features.map((feature, index) => (
              <div
                key={index}
                className="feature-card animate-slideUp"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="feature-icon" style={{ background: `${feature.color}15`, color: feature.color }}>
                  <feature.icon size={28} />
                </div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-desc">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== CITIES ==================== */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <div>
              <h2 className="section-title">Khám phá theo thành phố</h2>
              <p className="section-subtitle">Tìm phòng trọ tại các thành phố lớn</p>
            </div>
          </div>

          <div className="cities-grid">
            {cities.map((city, index) => (
              <Link
                key={index}
                to={`/rooms?city=${encodeURIComponent(city.name === 'TP. Hồ Chí Minh' ? 'Hồ Chí Minh' : city.name)}`}
                className="city-card animate-slideUp"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <img src={city.image} alt={city.name} className="city-card-image" />
                <div className="city-card-overlay">
                  <h3 className="city-card-name">{city.name}</h3>
                  <span className="city-card-count">{city.count.toLocaleString()} phòng trọ</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== LATEST ROOMS ==================== */}
      <section className="section section-alt">
        <div className="container">
          <div className="section-header">
            <div>
              <h2 className="section-title">Mới đăng gần đây</h2>
              <p className="section-subtitle">Phòng trọ mới nhất, cập nhật liên tục</p>
            </div>
            <Link to="/rooms?sort=newest" className="btn btn-secondary">
              Xem tất cả
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="room-grid">
            {latestRooms.map((room, index) => (
              <div
                key={room.id}
                className="room-card animate-slideUp"
                style={{ animationDelay: `${index * 0.1}s` }}
                onClick={() => navigate(`/rooms/${room.id}`)}
              >
                <div className="room-card-image">
                  <img src={room.images[0]} alt={room.title} loading="lazy" />
                  <div className="room-card-overlay">
                    <span className="room-card-badge room-card-badge-new">
                      <Clock size={12} />
                      Mới
                    </span>
                    <button
                      className="room-card-fav"
                      onClick={(e) => { e.stopPropagation(); }}
                    >
                      <Heart size={18} />
                    </button>
                  </div>
                  <div className="room-card-price-tag">
                    {formatCurrency(room.price)}<span>/tháng</span>
                  </div>
                </div>

                <div className="room-card-body">
                  <h3 className="room-card-title">{room.title}</h3>
                  <div className="room-card-location">
                    <MapPin size={14} />
                    <span>{room.address}, {room.district}</span>
                  </div>

                  <div className="room-card-amenities">
                    <span className="room-card-area">{room.area}m²</span>
                    <span className="room-card-dot">•</span>
                    <span>{room.maxOccupants} người</span>
                    {room.hasWifi && <Wifi size={14} className="room-card-amenity-icon" />}
                    {room.hasAC && <Snowflake size={14} className="room-card-amenity-icon" />}
                    {room.hasParking && <Car size={14} className="room-card-amenity-icon" />}
                  </div>

                  <div className="room-card-footer">
                    <div className="room-card-rating">
                      <Star size={14} fill="#f59e0b" color="#f59e0b" />
                      <span>{room.rating}</span>
                      <span className="room-card-reviews">({room.reviewCount})</span>
                    </div>
                    <div className="room-card-views">
                      <Eye size={14} />
                      <span>{room.views}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== HOW IT WORKS ==================== */}
      <section className="section">
        <div className="container">
          <div className="section-header section-header-center">
            <h2 className="section-title">Cách thức hoạt động</h2>
            <p className="section-subtitle">3 bước đơn giản để tìm phòng trọ phù hợp</p>
          </div>

          <div className="steps-grid">
            <div className="step-card animate-slideUp">
              <div className="step-number">1</div>
              <div className="step-icon">
                <Search size={32} />
              </div>
              <h3 className="step-title">Tìm kiếm</h3>
              <p className="step-desc">Sử dụng bộ lọc thông minh để tìm phòng phù hợp với nhu cầu và ngân sách</p>
            </div>

            <div className="step-connector">
              <ChevronRight size={24} />
            </div>

            <div className="step-card animate-slideUp" style={{ animationDelay: '0.15s' }}>
              <div className="step-number">2</div>
              <div className="step-icon">
                <Phone size={32} />
              </div>
              <h3 className="step-title">Liên hệ</h3>
              <p className="step-desc">Chat trực tiếp với chủ trọ, đặt lịch xem phòng và thỏa thuận</p>
            </div>

            <div className="step-connector">
              <ChevronRight size={24} />
            </div>

            <div className="step-card animate-slideUp" style={{ animationDelay: '0.3s' }}>
              <div className="step-number">3</div>
              <div className="step-icon">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="step-title">Ký hợp đồng</h3>
              <p className="step-desc">Ký hợp đồng điện tử, đặt cọc online và chuyển vào ở ngay</p>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== CTA ==================== */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <div className="cta-text">
              <h2 className="cta-title">Bạn là chủ trọ?</h2>
              <p className="cta-desc">
                Đăng tin miễn phí, tiếp cận hàng ngàn người thuê tiềm năng. 
                Quản lý phòng, hợp đồng, thanh toán trên một nền tảng.
              </p>
              <div className="cta-features">
                <div className="cta-feature">
                  <CheckCircle2 size={18} />
                  <span>Đăng tin miễn phí</span>
                </div>
                <div className="cta-feature">
                  <CheckCircle2 size={18} />
                  <span>Quản lý hợp đồng</span>
                </div>
                <div className="cta-feature">
                  <CheckCircle2 size={18} />
                  <span>Báo cáo thống kê</span>
                </div>
                <div className="cta-feature">
                  <CheckCircle2 size={18} />
                  <span>Thu tiền online</span>
                </div>
              </div>
            </div>
            <div className="cta-actions">
              <Link to="/register?role=landlord" className="btn btn-accent btn-xl">
                Bắt đầu ngay
                <ArrowRight size={20} />
              </Link>
              <p className="cta-note">Miễn phí • Không cần thẻ tín dụng</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

import { Link } from 'react-router-dom';
import { Building2, Phone, Mail, MapPin, Globe, MessageCircle } from 'lucide-react';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-top container-lg">
        <div className="footer-brand">
          <Link to="/" className="footer-logo">
            <div className="footer-logo-icon">
              <Building2 size={24} />
            </div>
            <div>
              <span className="footer-logo-name">PhòngTrọ</span>
              <span className="footer-logo-dot">.vn</span>
            </div>
          </Link>
          <p className="footer-desc">
            Nền tảng tìm kiếm và cho thuê phòng trọ hàng đầu Việt Nam. 
            Kết nối chủ trọ và người thuê một cách nhanh chóng, an toàn.
          </p>
          <div className="footer-socials">
            <a href="#" className="footer-social-link" aria-label="Facebook">
              <Globe size={20} />
            </a>
            <a href="#" className="footer-social-link" aria-label="Zalo">
              <MessageCircle size={20} />
            </a>
          </div>
        </div>

        <div className="footer-links-group">
          <h4 className="footer-links-title">Khám phá</h4>
          <nav className="footer-links">
            <Link to="/rooms">Tìm phòng trọ</Link>
            <Link to="/rooms?city=ho-chi-minh">Phòng trọ TP.HCM</Link>
            <Link to="/rooms?city=ha-noi">Phòng trọ Hà Nội</Link>
            <Link to="/rooms?city=da-nang">Phòng trọ Đà Nẵng</Link>
            <Link to="/roommates">Tìm bạn ở ghép</Link>
          </nav>
        </div>

        <div className="footer-links-group">
          <h4 className="footer-links-title">Dịch vụ</h4>
          <nav className="footer-links">
            <Link to="/register?role=landlord">Đăng tin cho thuê</Link>
            <Link to="#">Quảng cáo & Ghim tin</Link>
            <Link to="#">Gói dịch vụ</Link>
            <Link to="#">Hướng dẫn sử dụng</Link>
            <Link to="#">Blog</Link>
          </nav>
        </div>

        <div className="footer-links-group">
          <h4 className="footer-links-title">Liên hệ</h4>
          <div className="footer-contact">
            <div className="footer-contact-item">
              <MapPin size={16} />
              <span>123 Nguyễn Huệ, Q.1, TP.HCM</span>
            </div>
            <div className="footer-contact-item">
              <Phone size={16} />
              <span>1900 1234</span>
            </div>
            <div className="footer-contact-item">
              <Mail size={16} />
              <span>contact@phongtro.vn</span>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container-lg footer-bottom-inner">
          <p>© 2025 PhòngTrọ.vn. Tất cả quyền được bảo lưu.</p>
          <div className="footer-bottom-links">
            <a href="#">Điều khoản sử dụng</a>
            <span>•</span>
            <a href="#">Chính sách bảo mật</a>
            <span>•</span>
            <a href="#">Quy chế hoạt động</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

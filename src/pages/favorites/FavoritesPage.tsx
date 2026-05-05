import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useAppStore } from '../../stores/appStore';
import { formatCurrency } from '../../utils/helpers';
import { MapPin, Star, Heart, Trash2 } from 'lucide-react';
import type { Bookmark } from '../../types';

export default function FavoritesPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { bookmarks, fetchBookmarks, toggleBookmark } = useAppStore();

  useEffect(() => {
    if (user) fetchBookmarks();
  }, [user]);

  if (!user) {
    return (
      <div style={{ paddingTop: '120px', textAlign: 'center', minHeight: '60vh' }}>
        <h2>Vui lòng đăng nhập để xem phòng yêu thích</h2>
        <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={() => navigate('/login')}>Đăng nhập</button>
      </div>
    );
  }

  return (
    <div style={{ paddingTop: '68px', minHeight: '100vh', background: 'var(--bg-secondary)' }}>
      <div className="container" style={{ paddingTop: '32px', paddingBottom: '64px' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 800, marginBottom: '24px' }}>
          Phòng yêu thích ({bookmarks.length})
        </h1>

        {bookmarks.length > 0 ? (
          <div className="room-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {bookmarks.map((bm: Bookmark) => (
              <div key={bm.id} className="room-card" onClick={() => navigate(`/rooms/${bm.room_id}`)}>
                <div className="room-card-image">
                  <img src={bm.cover_image || 'https://placehold.co/400x300/e2e8f0/64748b?text=No+Image'} alt={bm.title} />
                  <div className="room-card-overlay">
                    <span></span>
                    <button
                      className="room-card-fav active"
                      onClick={(e) => { e.stopPropagation(); toggleBookmark(bm.room_id); }}
                    >
                      <Heart size={18} fill="#ef4444" color="#ef4444" />
                    </button>
                  </div>
                  <div className="room-card-price-tag">
                    {formatCurrency(bm.price)}<span>/tháng</span>
                  </div>
                </div>
                <div className="room-card-body">
                  <h3 className="room-card-title">{bm.title}</h3>
                  <div className="room-card-location">
                    <MapPin size={14} />
                    <span>{bm.ward_name}, {bm.district_name}</span>
                  </div>
                  <div className="room-card-amenities">
                    <span className="room-card-area">{bm.area}m²</span>
                    <span className="room-card-dot">•</span>
                    <span>{bm.room_type_name}</span>
                  </div>
                  <div className="room-card-footer">
                    <span className="badge badge-secondary">{bm.province_name}</span>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={(e) => { e.stopPropagation(); toggleBookmark(bm.room_id); }}
                      style={{ color: 'var(--error-500)' }}
                    >
                      <Trash2 size={14} /> Bỏ
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '64px', color: 'var(--text-tertiary)' }}>
            <Heart size={48} style={{ marginBottom: '16px' }} />
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>Chưa có phòng yêu thích</h3>
            <p>Nhấn vào biểu tượng ♥ để lưu phòng yêu thích</p>
            <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={() => navigate('/rooms')}>
              Tìm phòng ngay
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

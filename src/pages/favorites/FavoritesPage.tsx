import { useNavigate } from 'react-router-dom';
import { useRoomStore } from '../../stores/roomStore';
import { useAuthStore } from '../../stores/authStore';
import { formatCurrency } from '../../utils/helpers';
import { MapPin, Star, Heart, Eye, Wifi, Snowflake, Car, Trash2 } from 'lucide-react';

export default function FavoritesPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { rooms, favorites, toggleFavorite } = useRoomStore();

  if (!user) {
    return (
      <div style={{ paddingTop: '120px', textAlign: 'center', minHeight: '60vh' }}>
        <h2>Vui lòng đăng nhập để xem phòng yêu thích</h2>
        <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={() => navigate('/login')}>Đăng nhập</button>
      </div>
    );
  }

  const favoriteRooms = rooms.filter(r => favorites.includes(r.id));

  return (
    <div style={{ paddingTop: '68px', minHeight: '100vh', background: 'var(--bg-secondary)' }}>
      <div className="container" style={{ paddingTop: 'var(--space-8)', paddingBottom: 'var(--space-16)' }}>
        <h1 style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 800, marginBottom: 'var(--space-6)' }}>
          Phòng yêu thích ({favoriteRooms.length})
        </h1>

        {favoriteRooms.length > 0 ? (
          <div className="room-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {favoriteRooms.map(room => (
              <div key={room.id} className="room-card" onClick={() => navigate(`/rooms/${room.id}`)}>
                <div className="room-card-image">
                  <img src={room.images[0]} alt={room.title} />
                  <div className="room-card-overlay">
                    <span></span>
                    <button
                      className="room-card-fav active"
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(room.id); }}
                    >
                      <Heart size={18} fill="#ef4444" color="#ef4444" />
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
                  </div>
                  <div className="room-card-footer">
                    <div className="room-card-rating">
                      <Star size={14} fill="#f59e0b" color="#f59e0b" />
                      <span>{room.rating}</span>
                    </div>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(room.id); }}
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
          <div style={{ textAlign: 'center', padding: 'var(--space-16)', color: 'var(--text-tertiary)' }}>
            <Heart size={48} style={{ marginBottom: 'var(--space-4)' }} />
            <h3 style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>Chưa có phòng yêu thích</h3>
            <p>Nhấn vào biểu tượng ♥ để lưu phòng yêu thích</p>
            <button className="btn btn-primary" style={{ marginTop: 'var(--space-4)' }} onClick={() => navigate('/rooms')}>
              Tìm phòng ngay
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

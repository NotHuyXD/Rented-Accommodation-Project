import { useNavigate } from 'react-router-dom';
import { useRoomStore } from '../../stores/roomStore';
import { formatCurrency } from '../../utils/helpers';
import { amenityLabels } from '../../data/mockData';
import { MapPin, Star, X, CheckCircle2, XCircle } from 'lucide-react';

export default function ComparePage() {
  const navigate = useNavigate();
  const { rooms, compareList, removeFromCompare, clearCompare } = useRoomStore();

  const compareRooms = rooms.filter(r => compareList.includes(r.id));

  if (compareRooms.length === 0) {
    return (
      <div style={{ paddingTop: '120px', textAlign: 'center', minHeight: '60vh' }}>
        <h2>Chưa có phòng để so sánh</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>Chọn tối đa 3 phòng từ trang tìm kiếm</p>
        <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={() => navigate('/rooms')}>
          Tìm phòng
        </button>
      </div>
    );
  }

  const allAmenities = [...new Set(compareRooms.flatMap(r => r.amenities))];

  return (
    <div style={{ paddingTop: '68px', minHeight: '100vh', background: 'var(--bg-secondary)' }}>
      <div className="container" style={{ paddingTop: 'var(--space-8)', paddingBottom: 'var(--space-16)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
          <h1 style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 800 }}>
            So sánh phòng ({compareRooms.length}/3)
          </h1>
          <button className="btn btn-secondary" onClick={() => { clearCompare(); navigate('/rooms'); }}>
            Xóa tất cả
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="table" style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)' }}>
            <thead>
              <tr>
                <th style={{ minWidth: 150 }}>Tiêu chí</th>
                {compareRooms.map(room => (
                  <th key={room.id} style={{ minWidth: 250, position: 'relative' }}>
                    <button
                      onClick={() => removeFromCompare(room.id)}
                      style={{ position: 'absolute', top: 8, right: 8, color: 'var(--text-tertiary)' }}
                    >
                      <X size={16} />
                    </button>
                    <img
                      src={room.images[0]}
                      alt={room.title}
                      style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 8, marginBottom: 8, cursor: 'pointer' }}
                      onClick={() => navigate(`/rooms/${room.id}`)}
                    />
                    <div style={{ fontWeight: 700, fontSize: 'var(--font-size-sm)' }}>{room.title}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontWeight: 600 }}>Giá thuê</td>
                {compareRooms.map(r => (
                  <td key={r.id} style={{ color: 'var(--primary-700)', fontWeight: 700, fontSize: 'var(--font-size-lg)' }}>
                    {formatCurrency(r.price)}/tháng
                  </td>
                ))}
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Diện tích</td>
                {compareRooms.map(r => <td key={r.id}>{r.area} m²</td>)}
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Số người tối đa</td>
                {compareRooms.map(r => <td key={r.id}>{r.maxOccupants} người</td>)}
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Đánh giá</td>
                {compareRooms.map(r => (
                  <td key={r.id}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Star size={14} fill="#f59e0b" color="#f59e0b" />
                      {r.rating} ({r.reviewCount})
                    </div>
                  </td>
                ))}
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Quận/Huyện</td>
                {compareRooms.map(r => <td key={r.id}>{r.district}</td>)}
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Địa chỉ</td>
                {compareRooms.map(r => (
                  <td key={r.id}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <MapPin size={14} />
                      {r.address}
                    </div>
                  </td>
                ))}
              </tr>
              {allAmenities.map(amenity => {
                const info = amenityLabels[amenity];
                if (!info) return null;
                return (
                  <tr key={amenity}>
                    <td style={{ fontWeight: 600 }}>{info.label}</td>
                    {compareRooms.map(r => (
                      <td key={r.id}>
                        {r.amenities.includes(amenity) ? (
                          <CheckCircle2 size={18} color="var(--success-500)" />
                        ) : (
                          <XCircle size={18} color="var(--neutral-300)" />
                        )}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

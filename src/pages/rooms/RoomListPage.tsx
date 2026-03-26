import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useRoomStore } from '../../stores/roomStore';
import { formatCurrency } from '../../utils/helpers';
import {
  Search, MapPin, SlidersHorizontal, Grid3X3, List, X,
  Star, Eye, Heart, Wifi, Snowflake, Car, PawPrint, TrendingUp,
  ArrowUpDown
} from 'lucide-react';
import './RoomListPage.css';

export default function RoomListPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    filteredRooms, filters, sortBy, viewMode, isLoading,
    setFilters, resetFilters, setSortBy, setViewMode,
    toggleFavorite, favorites, addToCompare, compareList, fetchRooms
  } = useRoomStore();

  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 20000000]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  // Apply URL params on mount
  useEffect(() => {
    const q = searchParams.get('q');
    const city = searchParams.get('city');
    const maxPrice = searchParams.get('maxPrice');

    if (q) setFilters({ searchQuery: q });
    if (city) setFilters({ city });
    if (maxPrice) setFilters({ maxPrice: parseInt(maxPrice) });
  }, [searchParams, setFilters]);

  const handlePriceChange = (index: number, value: string) => {
    const newRange = [...priceRange];
    newRange[index] = parseInt(value) || 0;
    setPriceRange(newRange);
    setFilters({ minPrice: newRange[0], maxPrice: newRange[1] });
  };

  return (
    <div className="room-list-page">
      {/* Top Bar */}
      <div className="room-list-topbar">
        <div className="container">
          <div className="room-list-topbar-inner">
            {/* Search */}
            <div className="room-list-search">
              <Search size={18} />
              <input
                type="text"
                placeholder="Tìm kiếm phòng trọ..."
                value={filters.searchQuery}
                onChange={(e) => setFilters({ searchQuery: e.target.value })}
                className="room-list-search-input"
              />
              {filters.searchQuery && (
                <button onClick={() => setFilters({ searchQuery: '' })}>
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Controls */}
            <div className="room-list-controls">
              <button
                className={`btn btn-secondary btn-sm ${showFilters ? 'active' : ''}`}
                onClick={() => setShowFilters(!showFilters)}
              >
                <SlidersHorizontal size={16} />
                Bộ lọc
              </button>

              <div className="room-list-sort">
                <ArrowUpDown size={16} />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="room-list-sort-select"
                >
                  <option value="newest">Mới nhất</option>
                  <option value="price_asc">Giá thấp → cao</option>
                  <option value="price_desc">Giá cao → thấp</option>
                  <option value="rating">Đánh giá cao</option>
                </select>
              </div>

              <div className="room-list-view-toggle hide-mobile">
                <button
                  className={`room-list-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 size={18} />
                </button>
                <button
                  className={`room-list-view-btn ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => setViewMode('list')}
                >
                  <List size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="room-list-layout">
          {/* Sidebar Filters */}
          <aside className={`room-list-sidebar ${showFilters ? 'open' : ''}`}>
            <div className="filter-section">
              <div className="filter-header">
                <h3>Bộ lọc tìm kiếm</h3>
                <button className="btn btn-ghost btn-sm" onClick={resetFilters}>Xóa tất cả</button>
              </div>

              {/* Location */}
              <div className="filter-group">
                <label className="filter-label">
                  <MapPin size={16} />
                  Thành phố
                </label>
                <select
                  className="select-field"
                  value={filters.city}
                  onChange={(e) => setFilters({ city: e.target.value, district: '' })}
                >
                  <option value="">Tất cả</option>
                  <option value="Hồ Chí Minh">TP. Hồ Chí Minh</option>
                  <option value="Hà Nội">Hà Nội</option>
                  <option value="Đà Nẵng">Đà Nẵng</option>
                </select>
              </div>

              {/* Price Range */}
              <div className="filter-group">
                <label className="filter-label">Khoảng giá</label>
                <div className="filter-price-inputs">
                  <input
                    type="number"
                    placeholder="Từ"
                    className="input-field"
                    value={priceRange[0] || ''}
                    onChange={(e) => handlePriceChange(0, e.target.value)}
                  />
                  <span>—</span>
                  <input
                    type="number"
                    placeholder="Đến"
                    className="input-field"
                    value={priceRange[1] || ''}
                    onChange={(e) => handlePriceChange(1, e.target.value)}
                  />
                </div>
                <div className="filter-price-presets">
                  <button className="filter-preset-btn" onClick={() => { setPriceRange([0, 3000000]); setFilters({ minPrice: 0, maxPrice: 3000000 }); }}>
                    Dưới 3tr
                  </button>
                  <button className="filter-preset-btn" onClick={() => { setPriceRange([3000000, 5000000]); setFilters({ minPrice: 3000000, maxPrice: 5000000 }); }}>
                    3-5tr
                  </button>
                  <button className="filter-preset-btn" onClick={() => { setPriceRange([5000000, 10000000]); setFilters({ minPrice: 5000000, maxPrice: 10000000 }); }}>
                    5-10tr
                  </button>
                  <button className="filter-preset-btn" onClick={() => { setPriceRange([10000000, 50000000]); setFilters({ minPrice: 10000000, maxPrice: 50000000 }); }}>
                    Trên 10tr
                  </button>
                </div>
              </div>

              {/* Area */}
              <div className="filter-group">
                <label className="filter-label">Diện tích (m²)</label>
                <div className="filter-price-inputs">
                  <input
                    type="number"
                    placeholder="Từ"
                    className="input-field"
                    value={filters.minArea || ''}
                    onChange={(e) => setFilters({ minArea: parseInt(e.target.value) || 0 })}
                  />
                  <span>—</span>
                  <input
                    type="number"
                    placeholder="Đến"
                    className="input-field"
                    value={filters.maxArea < 200 ? filters.maxArea : ''}
                    onChange={(e) => setFilters({ maxArea: parseInt(e.target.value) || 200 })}
                  />
                </div>
              </div>

              {/* Amenities */}
              <div className="filter-group">
                <label className="filter-label">Tiện ích</label>
                <div className="filter-amenities">
                  <label className="checkbox-custom">
                    <input type="checkbox" checked={filters.hasWifi}
                      onChange={(e) => setFilters({ hasWifi: e.target.checked })} />
                    <Wifi size={16} /> WiFi
                  </label>
                  <label className="checkbox-custom">
                    <input type="checkbox" checked={filters.hasAC}
                      onChange={(e) => setFilters({ hasAC: e.target.checked })} />
                    <Snowflake size={16} /> Máy lạnh
                  </label>
                  <label className="checkbox-custom">
                    <input type="checkbox" checked={filters.hasParking}
                      onChange={(e) => setFilters({ hasParking: e.target.checked })} />
                    <Car size={16} /> Chỗ để xe
                  </label>
                  <label className="checkbox-custom">
                    <input type="checkbox" checked={filters.hasFurniture}
                      onChange={(e) => setFilters({ hasFurniture: e.target.checked })} />
                    Nội thất
                  </label>
                  <label className="checkbox-custom">
                    <input type="checkbox" checked={filters.allowPets}
                      onChange={(e) => setFilters({ allowPets: e.target.checked })} />
                    <PawPrint size={16} /> Thú cưng
                  </label>
                </div>
              </div>

              {/* Occupants */}
              <div className="filter-group">
                <label className="filter-label">Số người ở</label>
                <select
                  className="select-field"
                  value={filters.maxOccupants}
                  onChange={(e) => setFilters({ maxOccupants: parseInt(e.target.value) })}
                >
                  <option value={0}>Tất cả</option>
                  <option value={1}>1 người</option>
                  <option value={2}>2 người</option>
                  <option value={3}>3 người</option>
                  <option value={4}>4+ người</option>
                </select>
              </div>
            </div>

            {/* Mobile close */}
            <button className="filter-close-mobile" onClick={() => setShowFilters(false)}>
              Áp dụng bộ lọc ({filteredRooms.length} kết quả)
            </button>
          </aside>

          {/* Results */}
          <main className="room-list-main">
            <div className="room-list-info">
              <p className="room-list-count">
                Tìm thấy <strong>{filteredRooms.length}</strong> phòng trọ
              </p>
              {compareList.length > 0 && (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => navigate('/compare')}
                >
                  So sánh ({compareList.length}/3)
                </button>
              )}
            </div>

            {isLoading ? (
              <div className="room-list-loading" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
                <div className="animate-spin" style={{ display: 'inline-block', fontSize: '2rem', marginBottom: 'var(--space-4)', color: 'var(--primary-500)' }}>⟳</div>
                <p>Đang tải danh sách phòng...</p>
              </div>
            ) : (
              <div className={viewMode === 'grid' ? 'room-grid room-grid-3' : 'room-list-view'}>
                {filteredRooms.map((room, index) => (
                  <div
                    key={room.id}
                    className={`room-card ${viewMode === 'list' ? 'room-card-horizontal' : ''} animate-slideUp`}
                    style={{ animationDelay: `${index * 0.05}s` }}
                    onClick={() => navigate(`/rooms/${room.id}`)}
                  >
                  <div className="room-card-image">
                    <img src={room.images[0]} alt={room.title} loading="lazy" />
                    <div className="room-card-overlay">
                      {room.isPinned && (
                        <span className="room-card-badge room-card-badge-pin">
                          <TrendingUp size={12} /> Nổi bật
                        </span>
                      )}
                      <div className="room-card-actions-top">
                        <button
                          className={`room-card-fav ${favorites.includes(room.id) ? 'active' : ''}`}
                          onClick={(e) => { e.stopPropagation(); toggleFavorite(room.id); }}
                          title="Yêu thích"
                        >
                          <Heart size={18} fill={favorites.includes(room.id) ? '#ef4444' : 'none'} />
                        </button>
                      </div>
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
                    {viewMode === 'list' && (
                      <p className="room-card-desc">{room.description}</p>
                    )}
                    <button
                      className="btn btn-ghost btn-sm room-card-compare-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCompare(room.id);
                      }}
                      disabled={compareList.length >= 3 && !compareList.includes(room.id)}
                    >
                      {compareList.includes(room.id) ? '✓ Đã thêm' : '+ So sánh'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isLoading && filteredRooms.length === 0 && (
              <div className="room-list-empty">
                <Search size={48} />
                <h3>Không tìm thấy phòng trọ</h3>
                <p>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                <button className="btn btn-primary" onClick={resetFilters}>Xóa bộ lọc</button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useRoomStore } from '../../stores/roomStore';
import { useAuthStore } from '../../stores/authStore';
import { useAppStore } from '../../stores/appStore';
import { formatCurrency, timeAgo } from '../../utils/helpers';
import type { RoomListItem } from '../../types';
import {
  Search, MapPin, SlidersHorizontal, X,
  Star, Heart, PawPrint, ChevronLeft, ChevronRight,
  ArrowUpDown, Building2
} from 'lucide-react';
import './RoomListPage.css';

export default function RoomListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    rooms, pagination, filters, isLoading,
    fetchRooms, setFilters, clearFilters,
    roomTypes, amenities, provinces, districts, wards,
    fetchRoomTypes, fetchAmenities, fetchProvinces, fetchDistricts, fetchWards,
  } = useRoomStore();
  const { user } = useAuthStore();
  const { toggleBookmark, isBookmarked, fetchBookmarks } = useAppStore();

  const [showFilters, setShowFilters] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [localPriceMin, setLocalPriceMin] = useState('');
  const [localPriceMax, setLocalPriceMax] = useState('');

  // Load lookup data on mount
  useEffect(() => {
    fetchRoomTypes();
    fetchAmenities();
    fetchProvinces();
    if (user) fetchBookmarks();
  }, []);

  // Apply URL params on mount
  useEffect(() => {
    const params: Record<string, unknown> = {};
    const search = searchParams.get('search');
    const provinceId = searchParams.get('provinceId');
    const priceMax = searchParams.get('priceMax');
    const allowPet = searchParams.get('allowPet');
    const page = searchParams.get('page');

    if (search) { params.search = search; setSearchInput(search); }
    if (provinceId) params.provinceId = provinceId;
    if (priceMax) { params.priceMax = parseInt(priceMax); setLocalPriceMax(priceMax); }
    if (allowPet) params.allowPet = allowPet;
    if (page) params.page = parseInt(page);

    setFilters(params as any);
    fetchRooms(params);
  }, []);

  const handleSearch = () => {
    const newFilters = { ...filters, search: searchInput, page: 1 };
    setFilters({ search: searchInput });
    fetchRooms({ ...newFilters, page: 1 });
  };

  const handleFilterApply = () => {
    const newFilters: Record<string, unknown> = { ...filters, page: 1 };
    if (localPriceMin) newFilters.priceMin = parseInt(localPriceMin);
    if (localPriceMax) newFilters.priceMax = parseInt(localPriceMax);
    setFilters(newFilters as any);
    fetchRooms({ ...newFilters, page: 1 });
    setShowFilters(false);
  };

  const handleProvinceChange = (provinceId: string) => {
    setFilters({ provinceId, districtId: undefined, wardId: undefined } as any);
    if (provinceId) fetchDistricts(provinceId);
  };

  const handleDistrictChange = (districtId: string) => {
    setFilters({ districtId, wardId: undefined } as any);
    if (districtId) fetchWards(districtId);
  };

  const handleSortChange = (sortBy: string) => {
    setFilters({ sortBy } as any);
    fetchRooms({ ...filters, sortBy, page: 1 });
  };

  const handlePageChange = (page: number) => {
    fetchRooms({ ...filters, page });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReset = () => {
    clearFilters();
    setSearchInput('');
    setLocalPriceMin('');
    setLocalPriceMax('');
    fetchRooms({ page: 1, limit: 20 });
  };

  const handlePricePreset = (min: number, max: number) => {
    setLocalPriceMin(min.toString());
    setLocalPriceMax(max.toString());
    setFilters({ priceMin: min, priceMax: max } as any);
    fetchRooms({ ...filters, priceMin: min, priceMax: max, page: 1 });
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
                placeholder="Tìm theo quận, đường, địa điểm..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="room-list-search-input"
              />
              {searchInput && (
                <button onClick={() => { setSearchInput(''); setFilters({ search: undefined } as any); fetchRooms({ ...filters, search: undefined, page: 1 }); }}>
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
                  value={filters.sortBy || 'newest'}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="room-list-sort-select"
                >
                  <option value="newest">Mới nhất</option>
                  <option value="price_asc">Giá thấp → cao</option>
                  <option value="price_desc">Giá cao → thấp</option>
                </select>
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
                <button className="btn btn-ghost btn-sm" onClick={handleReset}>Xóa tất cả</button>
              </div>

              {/* Location */}
              <div className="filter-group">
                <label className="filter-label">
                  <MapPin size={16} />
                  Tỉnh / Thành phố
                </label>
                <select
                  className="select-field"
                  value={filters.provinceId || ''}
                  onChange={(e) => handleProvinceChange(e.target.value)}
                >
                  <option value="">Tất cả</option>
                  {provinces.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {districts.length > 0 && (
                <div className="filter-group">
                  <label className="filter-label">Quận / Huyện</label>
                  <select
                    className="select-field"
                    value={filters.districtId || ''}
                    onChange={(e) => handleDistrictChange(e.target.value)}
                  >
                    <option value="">Tất cả</option>
                    {districts.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {wards.length > 0 && (
                <div className="filter-group">
                  <label className="filter-label">Phường / Xã</label>
                  <select
                    className="select-field"
                    value={filters.wardId || ''}
                    onChange={(e) => setFilters({ wardId: e.target.value || undefined } as any)}
                  >
                    <option value="">Tất cả</option>
                    {wards.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Room Type */}
              <div className="filter-group">
                <label className="filter-label">Loại phòng</label>
                <select
                  className="select-field"
                  value={filters.roomTypeId || ''}
                  onChange={(e) => setFilters({ roomTypeId: e.target.value || undefined } as any)}
                >
                  <option value="">Tất cả</option>
                  {roomTypes.map(rt => (
                    <option key={rt.id} value={rt.id}>{rt.name}</option>
                  ))}
                </select>
              </div>

              {/* Price Range */}
              <div className="filter-group">
                <label className="filter-label">Khoảng giá (VNĐ)</label>
                <div className="filter-price-inputs">
                  <input
                    type="number"
                    placeholder="Từ"
                    className="input-field"
                    value={localPriceMin}
                    onChange={(e) => setLocalPriceMin(e.target.value)}
                  />
                  <span>—</span>
                  <input
                    type="number"
                    placeholder="Đến"
                    className="input-field"
                    value={localPriceMax}
                    onChange={(e) => setLocalPriceMax(e.target.value)}
                  />
                </div>
                <div className="filter-price-presets">
                  <button className="filter-preset-btn" onClick={() => handlePricePreset(0, 3000000)}>Dưới 3tr</button>
                  <button className="filter-preset-btn" onClick={() => handlePricePreset(3000000, 5000000)}>3-5tr</button>
                  <button className="filter-preset-btn" onClick={() => handlePricePreset(5000000, 10000000)}>5-10tr</button>
                  <button className="filter-preset-btn" onClick={() => handlePricePreset(10000000, 50000000)}>Trên 10tr</button>
                </div>
              </div>

              {/* Occupants */}
              <div className="filter-group">
                <label className="filter-label">Số người ở</label>
                <select
                  className="select-field"
                  value={filters.maxOccupants || ''}
                  onChange={(e) => setFilters({ maxOccupants: parseInt(e.target.value) || undefined } as any)}
                >
                  <option value="">Tất cả</option>
                  <option value="1">1 người</option>
                  <option value="2">2 người</option>
                  <option value="3">3 người</option>
                  <option value="4">4+ người</option>
                </select>
              </div>

              {/* Rules */}
              <div className="filter-group">
                <label className="filter-label">Nội quy</label>
                <div className="filter-amenities">
                  <label className="checkbox-custom">
                    <input type="checkbox"
                      checked={filters.allowPet === '1'}
                      onChange={(e) => setFilters({ allowPet: e.target.checked ? '1' : undefined } as any)} />
                    <PawPrint size={16} /> Cho phép thú cưng
                  </label>
                  <label className="checkbox-custom">
                    <input type="checkbox"
                      checked={filters.allowCooking === '1'}
                      onChange={(e) => setFilters({ allowCooking: e.target.checked ? '1' : undefined } as any)} />
                    🍳 Cho phép nấu ăn
                  </label>
                </div>
              </div>

              <button className="btn btn-primary" style={{ width: '100%', marginTop: '16px' }} onClick={handleFilterApply}>
                Áp dụng bộ lọc
              </button>
            </div>

            {/* Mobile close */}
            <button className="filter-close-mobile" onClick={handleFilterApply}>
              Áp dụng bộ lọc ({rooms.length} kết quả)
            </button>
          </aside>

          {/* Results */}
          <main className="room-list-main">
            <div className="room-list-info">
              <p className="room-list-count">
                Tìm thấy <strong>{pagination?.total || rooms.length}</strong> phòng trọ
              </p>
            </div>

            {isLoading ? (
              <div className="room-list-loading" style={{ textAlign: 'center', padding: '80px 0' }}>
                <div style={{ fontSize: '2rem', marginBottom: '16px', color: 'var(--primary-500)' }}>⟳</div>
                <p>Đang tải danh sách phòng...</p>
              </div>
            ) : (
              <div className="room-grid room-grid-3">
                {rooms.map((room: RoomListItem, index: number) => (
                  <div
                    key={room.id}
                    className="room-card animate-slideUp"
                    style={{ animationDelay: `${index * 0.05}s` }}
                    onClick={() => navigate(`/rooms/${room.id}`)}
                  >
                    <div className="room-card-image">
                      <img
                        src={room.cover_image || room.images?.[0] || 'https://placehold.co/400x300/e2e8f0/64748b?text=No+Image'}
                        alt={room.title}
                        loading="lazy"
                      />
                      <div className="room-card-overlay">
                        <span className="room-card-badge room-card-badge-new">
                          {room.room_type_name}
                        </span>
                        {user && (
                          <button
                            className={`room-card-fav ${isBookmarked(room.id) ? 'active' : ''}`}
                            onClick={(e) => { e.stopPropagation(); toggleBookmark(room.id); }}
                          >
                            <Heart size={18} fill={isBookmarked(room.id) ? '#ef4444' : 'none'} />
                          </button>
                        )}
                      </div>
                      <div className="room-card-price-tag">
                        {formatCurrency(room.price)}<span>/tháng</span>
                      </div>
                    </div>

                    <div className="room-card-body">
                      <h3 className="room-card-title">{room.title}</h3>
                      <div className="room-card-location">
                        <MapPin size={14} />
                        <span>{room.ward_name}, {room.district_name}</span>
                      </div>

                      <div className="room-card-amenities">
                        <span className="room-card-area">{room.area}m²</span>
                        <span className="room-card-dot">•</span>
                        <span>{room.max_occupants} người</span>
                        {room.allow_pet && <PawPrint size={14} className="room-card-amenity-icon" />}
                      </div>

                      <div className="room-card-footer">
                        <div className="room-card-rating">
                          <Star size={14} fill="#f59e0b" color="#f59e0b" />
                          <span>{room.avgRating || '—'}</span>
                          <span className="room-card-reviews">({room.reviewCount || 0})</span>
                        </div>
                        <div className="room-card-landlord">
                          <span>{room.landlord_name}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!isLoading && rooms.length === 0 && (
              <div className="room-list-empty">
                <Building2 size={48} />
                <h3>Không tìm thấy phòng trọ</h3>
                <p>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                <button className="btn btn-primary" onClick={handleReset}>Xóa bộ lọc</button>
              </div>
            )}

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="room-list-pagination">
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={pagination.page <= 1}
                  onClick={() => handlePageChange(pagination.page - 1)}
                >
                  <ChevronLeft size={16} />
                  Trước
                </button>
                <span className="pagination-info">
                  Trang {pagination.page} / {pagination.totalPages}
                </span>
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => handlePageChange(pagination.page + 1)}
                >
                  Sau
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

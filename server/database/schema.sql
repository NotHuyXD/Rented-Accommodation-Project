-- ============================================================
--  HỆ THỐNG THUÊ PHÒNG TRỌ ONLINE
--  Database : MySQL 8.0+
--  Encoding : utf8mb4
--  Version  : 2.0 (refactored locations, added rules/available_from,
--              is_metered, slug, full-text index)
-- ============================================================

CREATE DATABASE IF NOT EXISTS room_rental
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE room_rental;

-- ============================================================
-- 1. LOCATIONS – Địa giới hành chính (tách thành 3 bảng)
-- ============================================================

CREATE TABLE IF NOT EXISTS provinces (
    id    CHAR(36)     NOT NULL DEFAULT (UUID()),
    name  VARCHAR(100) NOT NULL COMMENT 'Tên tỉnh / thành phố',
    code  VARCHAR(10)  NOT NULL COMMENT 'Mã tỉnh (DVHCVN)',
    PRIMARY KEY (id),
    UNIQUE KEY uq_province_code (code)
) COMMENT 'Danh mục tỉnh / thành phố';

CREATE TABLE IF NOT EXISTS districts (
    id          CHAR(36)     NOT NULL DEFAULT (UUID()),
    province_id CHAR(36)     NOT NULL,
    name        VARCHAR(100) NOT NULL COMMENT 'Tên quận / huyện',
    code        VARCHAR(10)      NULL COMMENT 'Mã huyện (DVHCVN)',
    PRIMARY KEY (id),
    INDEX idx_dist_province (province_id),
    CONSTRAINT fk_dist_province FOREIGN KEY (province_id) REFERENCES provinces (id) ON DELETE RESTRICT
) COMMENT 'Danh mục quận / huyện';

CREATE TABLE IF NOT EXISTS wards (
    id          CHAR(36)     NOT NULL DEFAULT (UUID()),
    district_id CHAR(36)     NOT NULL,
    name        VARCHAR(100) NOT NULL COMMENT 'Tên phường / xã',
    code        VARCHAR(10)      NULL COMMENT 'Mã xã (DVHCVN)',
    PRIMARY KEY (id),
    INDEX idx_ward_district (district_id),
    CONSTRAINT fk_ward_district FOREIGN KEY (district_id) REFERENCES districts (id) ON DELETE RESTRICT
) COMMENT 'Danh mục phường / xã';

-- ============================================================
-- 2. USERS – Người dùng
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id            CHAR(36)        NOT NULL DEFAULT (UUID()),
    full_name     VARCHAR(150)    NOT NULL,
    email         VARCHAR(255)    NOT NULL,
    phone         VARCHAR(20)     NOT NULL,
    password_hash VARCHAR(255)    NOT NULL,
    avatar_url    VARCHAR(500)        NULL,
    role          ENUM('tenant','landlord','admin') NOT NULL DEFAULT 'tenant',
    is_verified   TINYINT(1)      NOT NULL DEFAULT 0,
    kyc_status    ENUM('none','pending','approved','rejected') NOT NULL DEFAULT 'none',
    created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_users_email (email)
) COMMENT 'Tài khoản người dùng (tenant / landlord / admin)';

-- ============================================================
-- 3. USER_VERIFICATIONS – Xác thực KYC
-- ============================================================
CREATE TABLE IF NOT EXISTS user_verifications (
    id              CHAR(36)    NOT NULL DEFAULT (UUID()),
    user_id         CHAR(36)    NOT NULL,
    id_card_front   VARCHAR(500) NOT NULL COMMENT 'URL ảnh mặt trước CCCD',
    id_card_back    VARCHAR(500) NOT NULL COMMENT 'URL ảnh mặt sau CCCD',
    selfie_url      VARCHAR(500)     NULL,
    status          ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
    reviewed_by     CHAR(36)         NULL COMMENT 'Admin duyệt',
    reviewed_at     DATETIME         NULL,
    created_at      DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_uv_user (user_id),
    CONSTRAINT fk_uv_user        FOREIGN KEY (user_id)     REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_uv_reviewer    FOREIGN KEY (reviewed_by) REFERENCES users (id) ON DELETE SET NULL
) COMMENT 'Hồ sơ xác thực danh tính (KYC)';

-- ============================================================
-- 4. ROOM_TYPES – Phân loại phòng
-- ============================================================
CREATE TABLE IF NOT EXISTS room_types (
    id          CHAR(36)     NOT NULL DEFAULT (UUID()),
    name        VARCHAR(100) NOT NULL COMMENT 'Phòng trọ đơn, Căn hộ mini …',
    slug        VARCHAR(100) NOT NULL COMMENT 'phong-tro-don',
    icon        VARCHAR(100)     NULL,
    description TEXT             NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_rt_slug (slug)
) COMMENT 'Danh mục loại phòng (dùng cho bộ lọc tìm kiếm)';

-- ============================================================
-- 5. AMENITIES – Danh mục tiện nghi
-- ============================================================
CREATE TABLE IF NOT EXISTS amenities (
    id    CHAR(36)     NOT NULL DEFAULT (UUID()),
    name  VARCHAR(100) NOT NULL COMMENT 'wifi, điều hòa, máy giặt …',
    icon  VARCHAR(100)     NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_amenity_name (name)
) COMMENT 'Danh mục tiện nghi';

-- ============================================================
-- 6. ROOMS – Phòng trọ
-- ============================================================
CREATE TABLE IF NOT EXISTS rooms (
    id              CHAR(36)        NOT NULL DEFAULT (UUID()),
    landlord_id     CHAR(36)        NOT NULL,
    ward_id         CHAR(36)        NOT NULL COMMENT 'FK → wards; district/province suy ra qua chain',
    room_type_id    CHAR(36)        NOT NULL,
    title           VARCHAR(255)    NOT NULL,
    slug            VARCHAR(300)    NOT NULL COMMENT 'URL-friendly, duy nhất',
    description     TEXT                NULL,
    address         VARCHAR(300)    NOT NULL COMMENT 'Số nhà, tên đường',
    latitude        DECIMAL(10,7)       NULL,
    longitude       DECIMAL(10,7)       NULL,
    area            DECIMAL(6,2)    NOT NULL COMMENT 'm²',
    price           DECIMAL(12,0)   NOT NULL COMMENT 'VNĐ / tháng',
    deposit         DECIMAL(12,0)   NOT NULL DEFAULT 0,
    max_occupants   TINYINT         NOT NULL DEFAULT 1,
    available_from  DATE                NULL COMMENT 'Ngày phòng trống dự kiến; NULL = sẵn sàng ngay',
    -- Nội quy phòng
    allow_pet       TINYINT(1)      NOT NULL DEFAULT 0 COMMENT 'Cho phép nuôi thú cưng',
    allow_cooking   TINYINT(1)      NOT NULL DEFAULT 0 COMMENT 'Cho phép nấu ăn',
    live_with_owner TINYINT(1)      NOT NULL DEFAULT 0 COMMENT 'Ở chung chủ nhà',
    curfew_time     TIME                NULL COMMENT 'Giờ đóng cửa; NULL = không giới hạn',
    extra_rules     TEXT                NULL COMMENT 'Nội quy tự do',
    status          ENUM('available','rented','maintenance','hidden') NOT NULL DEFAULT 'available',
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_room_slug     (slug),
    INDEX idx_room_ward         (ward_id),
    INDEX idx_room_type         (room_type_id),
    INDEX idx_room_landlord     (landlord_id),
    INDEX idx_room_status       (status),
    INDEX idx_room_price        (price),
    INDEX idx_room_available    (available_from),
    INDEX idx_room_rules        (allow_pet, allow_cooking, live_with_owner),
    FULLTEXT KEY ft_room_search (title, address),
    CONSTRAINT fk_room_landlord FOREIGN KEY (landlord_id)  REFERENCES users      (id) ON DELETE RESTRICT,
    CONSTRAINT fk_room_ward     FOREIGN KEY (ward_id)      REFERENCES wards      (id) ON DELETE RESTRICT,
    CONSTRAINT fk_room_type     FOREIGN KEY (room_type_id) REFERENCES room_types (id) ON DELETE RESTRICT
) COMMENT 'Thông tin phòng trọ';

-- ============================================================
-- 7. ROOM_IMAGES – Ảnh phòng
-- ============================================================
CREATE TABLE IF NOT EXISTS room_images (
    id         CHAR(36)     NOT NULL DEFAULT (UUID()),
    room_id    CHAR(36)     NOT NULL,
    url        VARCHAR(500) NOT NULL,
    is_cover   TINYINT(1)   NOT NULL DEFAULT 0 COMMENT 'Ảnh đại diện',
    sort_order TINYINT      NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    INDEX idx_ri_room (room_id),
    CONSTRAINT fk_ri_room FOREIGN KEY (room_id) REFERENCES rooms (id) ON DELETE CASCADE
) COMMENT 'Ảnh phòng trọ';

-- ============================================================
-- 8. ROOM_AMENITIES – Tiện nghi của phòng (N:M)
-- ============================================================
CREATE TABLE IF NOT EXISTS room_amenities (
    room_id    CHAR(36) NOT NULL,
    amenity_id CHAR(36) NOT NULL,
    PRIMARY KEY (room_id, amenity_id),
    CONSTRAINT fk_ra_room    FOREIGN KEY (room_id)    REFERENCES rooms     (id) ON DELETE CASCADE,
    CONSTRAINT fk_ra_amenity FOREIGN KEY (amenity_id) REFERENCES amenities (id) ON DELETE CASCADE
) COMMENT 'Quan hệ phòng – tiện nghi';

-- ============================================================
-- 9. ROOM_PRICES – Đơn giá dịch vụ của phòng
-- ============================================================
CREATE TABLE IF NOT EXISTS room_prices (
    id          CHAR(36)        NOT NULL DEFAULT (UUID()),
    room_id     CHAR(36)        NOT NULL,
    label       VARCHAR(100)    NOT NULL COMMENT 'Điện, Nước, Internet, Rác …',
    price       DECIMAL(12,0)   NOT NULL COMMENT 'Đơn giá (VNĐ / unit)',
    unit        VARCHAR(50)     NOT NULL COMMENT 'kWh, m³, người/tháng, tháng',
    is_metered  TINYINT(1)      NOT NULL DEFAULT 0
                    COMMENT '1 = tính theo chỉ số đồng hồ; 0 = phí cố định hàng tháng',
    meter_type  ENUM('electric','water','gas') NULL
                    COMMENT 'Loại đồng hồ khi is_metered = 1; NULL nếu cố định',
    PRIMARY KEY (id),
    INDEX idx_rp_room (room_id),
    CONSTRAINT fk_rp_room FOREIGN KEY (room_id) REFERENCES rooms (id) ON DELETE CASCADE
) COMMENT 'Đơn giá dịch vụ điện / nước / internet …';

-- ============================================================
-- 10. RENTAL_REQUESTS – Yêu cầu thuê phòng
-- ============================================================
CREATE TABLE IF NOT EXISTS rental_requests (
    id           CHAR(36)    NOT NULL DEFAULT (UUID()),
    room_id      CHAR(36)    NOT NULL,
    tenant_id    CHAR(36)    NOT NULL,
    message      TEXT            NULL,
    move_in_date DATE        NOT NULL,
    num_people   TINYINT     NOT NULL DEFAULT 1,
    status       ENUM('pending','accepted','rejected','cancelled') NOT NULL DEFAULT 'pending',
    contract_id  CHAR(36)        NULL COMMENT 'Gán sau khi accepted',
    created_at   DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_rr_room   (room_id),
    INDEX idx_rr_tenant (tenant_id),
    INDEX idx_rr_status (status),
    CONSTRAINT fk_rr_room   FOREIGN KEY (room_id)   REFERENCES rooms (id) ON DELETE RESTRICT,
    CONSTRAINT fk_rr_tenant FOREIGN KEY (tenant_id) REFERENCES users (id) ON DELETE RESTRICT
) COMMENT 'Yêu cầu thuê phòng từ tenant';

-- ============================================================
-- 11. CONTRACTS – Hợp đồng thuê
-- ============================================================
CREATE TABLE IF NOT EXISTS contracts (
    id             CHAR(36)        NOT NULL DEFAULT (UUID()),
    room_id        CHAR(36)        NOT NULL,
    tenant_id      CHAR(36)        NOT NULL,
    landlord_id    CHAR(36)        NOT NULL,
    request_id     CHAR(36)            NULL COMMENT 'RentalRequest nguồn gốc',
    start_date     DATE            NOT NULL,
    end_date       DATE            NOT NULL,
    monthly_rent   DECIMAL(12,0)   NOT NULL,
    deposit_amount DECIMAL(12,0)   NOT NULL DEFAULT 0,
    terms          TEXT                NULL COMMENT 'Điều khoản hợp đồng',
    status         ENUM('pending_sign','active','expired','terminated') NOT NULL DEFAULT 'pending_sign',
    signed_at      DATETIME            NULL,
    created_at     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_ct_room     (room_id),
    INDEX idx_ct_tenant   (tenant_id),
    INDEX idx_ct_landlord (landlord_id),
    INDEX idx_ct_status   (status),
    CONSTRAINT fk_ct_room     FOREIGN KEY (room_id)    REFERENCES rooms           (id) ON DELETE RESTRICT,
    CONSTRAINT fk_ct_tenant   FOREIGN KEY (tenant_id)  REFERENCES users           (id) ON DELETE RESTRICT,
    CONSTRAINT fk_ct_landlord FOREIGN KEY (landlord_id)REFERENCES users           (id) ON DELETE RESTRICT,
    CONSTRAINT fk_ct_request  FOREIGN KEY (request_id) REFERENCES rental_requests (id) ON DELETE SET NULL
) COMMENT 'Hợp đồng thuê phòng';

-- Back-fill FK rental_requests → contracts (skip if exists)
SET @fk_exists = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS 
                  WHERE CONSTRAINT_NAME = 'fk_rr_contract' AND TABLE_NAME = 'rental_requests' AND TABLE_SCHEMA = DATABASE());
SET @sql = IF(@fk_exists = 0, 
    'ALTER TABLE rental_requests ADD CONSTRAINT fk_rr_contract FOREIGN KEY (contract_id) REFERENCES contracts (id) ON DELETE SET NULL',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================================
-- 12. UTILITY_READINGS – Chỉ số đồng hồ hàng tháng
-- ============================================================
CREATE TABLE IF NOT EXISTS utility_readings (
    id             CHAR(36)        NOT NULL DEFAULT (UUID()),
    contract_id    CHAR(36)        NOT NULL,
    period_month   DATE            NOT NULL COMMENT 'Tháng ghi chỉ số (ngày 1 của tháng)',
    electric_prev  DECIMAL(10,2)   NOT NULL DEFAULT 0 COMMENT 'Số điện đầu kỳ (kWh)',
    electric_curr  DECIMAL(10,2)   NOT NULL DEFAULT 0 COMMENT 'Số điện cuối kỳ (kWh)',
    water_prev     DECIMAL(10,2)   NOT NULL DEFAULT 0 COMMENT 'Số nước đầu kỳ (m³)',
    water_curr     DECIMAL(10,2)   NOT NULL DEFAULT 0 COMMENT 'Số nước cuối kỳ (m³)',
    reading_images JSON                NULL COMMENT 'Mảng URL ảnh chụp đồng hồ',
    recorded_by    CHAR(36)        NOT NULL COMMENT 'Người ghi (thường là landlord)',
    recorded_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_ur_contract_month (contract_id, period_month),
    INDEX idx_ur_contract (contract_id),
    CONSTRAINT fk_ur_contract    FOREIGN KEY (contract_id) REFERENCES contracts (id) ON DELETE CASCADE,
    CONSTRAINT fk_ur_recorded_by FOREIGN KEY (recorded_by) REFERENCES users     (id) ON DELETE RESTRICT
) COMMENT 'Chỉ số điện / nước đầu kỳ – cuối kỳ hàng tháng';

-- ============================================================
-- 13. INVOICES – Hóa đơn hàng tháng
-- ============================================================
CREATE TABLE IF NOT EXISTS invoices (
    id                 CHAR(36)        NOT NULL DEFAULT (UUID()),
    contract_id        CHAR(36)        NOT NULL,
    utility_reading_id CHAR(36)            NULL,
    period_month       DATE            NOT NULL COMMENT 'Tháng của hóa đơn',
    base_rent          DECIMAL(12,0)   NOT NULL,
    electric_usage     DECIMAL(10,2)   NOT NULL DEFAULT 0 COMMENT 'Số điện tiêu thụ (kWh)',
    water_usage        DECIMAL(10,2)   NOT NULL DEFAULT 0 COMMENT 'Số nước tiêu thụ (m³)',
    electric_fee       DECIMAL(12,0)   NOT NULL DEFAULT 0,
    water_fee          DECIMAL(12,0)   NOT NULL DEFAULT 0,
    other_fees         DECIMAL(12,0)   NOT NULL DEFAULT 0,
    total              DECIMAL(12,0)   NOT NULL,
    due_date           DATE            NOT NULL,
    status             ENUM('unpaid','paid','overdue','disputed') NOT NULL DEFAULT 'unpaid',
    paid_at            DATETIME            NULL,
    created_at         DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_inv_contract_month (contract_id, period_month),
    INDEX idx_inv_status (status),
    CONSTRAINT fk_inv_contract FOREIGN KEY (contract_id)        REFERENCES contracts        (id) ON DELETE RESTRICT,
    CONSTRAINT fk_inv_reading  FOREIGN KEY (utility_reading_id) REFERENCES utility_readings (id) ON DELETE SET NULL
) COMMENT 'Hóa đơn tiền phòng hàng tháng';

-- ============================================================
-- 14. PAYMENTS – Thanh toán
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
    id             CHAR(36)        NOT NULL DEFAULT (UUID()),
    invoice_id     CHAR(36)        NOT NULL,
    tenant_id      CHAR(36)        NOT NULL,
    amount         DECIMAL(12,0)   NOT NULL,
    method         ENUM('cash','bank_transfer','momo','vnpay','zalopay') NOT NULL,
    transaction_id VARCHAR(255)        NULL COMMENT 'Mã giao dịch cổng thanh toán',
    status         ENUM('pending','success','failed') NOT NULL DEFAULT 'pending',
    paid_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_pay_invoice (invoice_id),
    INDEX idx_pay_tenant  (tenant_id),
    CONSTRAINT fk_pay_invoice FOREIGN KEY (invoice_id) REFERENCES invoices (id) ON DELETE RESTRICT,
    CONSTRAINT fk_pay_tenant  FOREIGN KEY (tenant_id)  REFERENCES users    (id) ON DELETE RESTRICT
) COMMENT 'Lịch sử thanh toán';

-- ============================================================
-- 15. REVIEWS – Đánh giá phòng
-- ============================================================
CREATE TABLE IF NOT EXISTS reviews (
    id         CHAR(36)    NOT NULL DEFAULT (UUID()),
    room_id    CHAR(36)    NOT NULL,
    tenant_id  CHAR(36)    NOT NULL,
    rating     TINYINT     NOT NULL COMMENT '1–5 sao',
    comment    TEXT            NULL,
    created_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_review_room_tenant (room_id, tenant_id),
    INDEX idx_rv_room (room_id),
    CONSTRAINT fk_rv_room   FOREIGN KEY (room_id)   REFERENCES rooms (id) ON DELETE CASCADE,
    CONSTRAINT fk_rv_tenant FOREIGN KEY (tenant_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT chk_rating CHECK (rating BETWEEN 1 AND 5)
) COMMENT 'Đánh giá phòng trọ';

-- ============================================================
-- 16. BOOKMARKS – Phòng yêu thích
-- ============================================================
CREATE TABLE IF NOT EXISTS bookmarks (
    id         CHAR(36)    NOT NULL DEFAULT (UUID()),
    user_id    CHAR(36)    NOT NULL,
    room_id    CHAR(36)    NOT NULL,
    created_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_bm_user_room (user_id, room_id),
    CONSTRAINT fk_bm_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_bm_room FOREIGN KEY (room_id) REFERENCES rooms (id) ON DELETE CASCADE
) COMMENT 'Phòng trọ yêu thích của người dùng';

-- ============================================================
-- 17. CONVERSATIONS & MESSAGES – Nhắn tin
-- ============================================================
CREATE TABLE IF NOT EXISTS conversations (
    id          CHAR(36)    NOT NULL DEFAULT (UUID()),
    room_id     CHAR(36)        NULL,
    tenant_id   CHAR(36)    NOT NULL,
    landlord_id CHAR(36)    NOT NULL,
    created_at  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_conv (tenant_id, landlord_id, room_id),
    CONSTRAINT fk_conv_room     FOREIGN KEY (room_id)     REFERENCES rooms (id) ON DELETE SET NULL,
    CONSTRAINT fk_conv_tenant   FOREIGN KEY (tenant_id)   REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_conv_landlord FOREIGN KEY (landlord_id) REFERENCES users (id) ON DELETE CASCADE
) COMMENT 'Cuộc hội thoại giữa tenant và landlord';

CREATE TABLE IF NOT EXISTS messages (
    id              CHAR(36)    NOT NULL DEFAULT (UUID()),
    conversation_id CHAR(36)    NOT NULL,
    sender_id       CHAR(36)    NOT NULL,
    content         TEXT        NOT NULL,
    is_read         TINYINT(1)  NOT NULL DEFAULT 0,
    created_at      DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_msg_conv   (conversation_id),
    INDEX idx_msg_sender (sender_id),
    CONSTRAINT fk_msg_conv   FOREIGN KEY (conversation_id) REFERENCES conversations (id) ON DELETE CASCADE,
    CONSTRAINT fk_msg_sender FOREIGN KEY (sender_id)       REFERENCES users         (id) ON DELETE CASCADE
) COMMENT 'Tin nhắn trong cuộc hội thoại';

-- ============================================================
-- 18. NOTIFICATIONS – Thông báo
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
    id         CHAR(36)        NOT NULL DEFAULT (UUID()),
    user_id    CHAR(36)        NOT NULL,
    type       VARCHAR(50)     NOT NULL COMMENT 'new_request | request_accepted | invoice_due | new_message …',
    title      VARCHAR(255)    NOT NULL,
    body       TEXT            NOT NULL,
    is_read    TINYINT(1)      NOT NULL DEFAULT 0,
    ref_id     CHAR(36)            NULL COMMENT 'ID đối tượng liên quan (room, contract …)',
    created_at DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_notif_user (user_id),
    INDEX idx_notif_read (user_id, is_read),
    CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) COMMENT 'Thông báo hệ thống';

-- ============================================================
-- 19. REPORTS – Báo cáo vi phạm
-- ============================================================
CREATE TABLE IF NOT EXISTS reports (
    id          CHAR(36)     NOT NULL DEFAULT (UUID()),
    reporter_id CHAR(36)     NOT NULL,
    target_type ENUM('room','user','review') NOT NULL,
    target_id   CHAR(36)     NOT NULL,
    reason      VARCHAR(255) NOT NULL,
    description TEXT             NULL,
    status      ENUM('pending','resolved','dismissed') NOT NULL DEFAULT 'pending',
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_rpt_reporter (reporter_id),
    INDEX idx_rpt_target   (target_type, target_id),
    CONSTRAINT fk_rpt_reporter FOREIGN KEY (reporter_id) REFERENCES users (id) ON DELETE CASCADE
) COMMENT 'Báo cáo vi phạm (phòng / người dùng / đánh giá)';

-- ============================================================
-- 20. SEED DATA - Dữ liệu mẫu cơ bản
-- ============================================================

-- Room Types
INSERT IGNORE INTO room_types (id, name, slug, icon, description) VALUES
(UUID(), 'Phòng trọ đơn', 'phong-tro-don', '🏠', 'Phòng trọ đơn lẻ, phù hợp cho sinh viên và người đi làm'),
(UUID(), 'Căn hộ mini', 'can-ho-mini', '🏢', 'Căn hộ nhỏ gọn, đầy đủ tiện nghi'),
(UUID(), 'Nhà nguyên căn', 'nha-nguyen-can', '🏡', 'Nhà cho thuê nguyên căn'),
(UUID(), 'Ký túc xá', 'ky-tuc-xa', '🏫', 'Ký túc xá dành cho sinh viên'),
(UUID(), 'Homestay', 'homestay', '🏨', 'Phòng cho thuê dạng homestay'),
(UUID(), 'Căn hộ', 'can-ho', '🏬', 'Căn hộ chung cư cho thuê'),
(UUID(), 'Phòng ghép', 'phong-ghep', '👥', 'Phòng ở ghép, chia sẻ chi phí');

-- Amenities
INSERT IGNORE INTO amenities (id, name, icon) VALUES
(UUID(), 'WiFi', '📶'),
(UUID(), 'Điều hòa', '❄️'),
(UUID(), 'Máy giặt', '🧺'),
(UUID(), 'Tủ lạnh', '🧊'),
(UUID(), 'Nóng lạnh', '🚿'),
(UUID(), 'Bãi xe', '🅿️'),
(UUID(), 'Ban công', '🌿'),
(UUID(), 'Bảo vệ', '🔒'),
(UUID(), 'Camera', '📷'),
(UUID(), 'Thang máy', '🛗'),
(UUID(), 'Bếp', '🍳'),
(UUID(), 'Giường', '🛏️'),
(UUID(), 'Tủ quần áo', '👔'),
(UUID(), 'TV', '📺'),
(UUID(), 'Bàn làm việc', '🪑');

-- ============================================================
-- 21. VIEWING_APPOINTMENTS – Lịch hẹn xem phòng
-- ============================================================
CREATE TABLE IF NOT EXISTS viewing_appointments (
    id               CHAR(36)      NOT NULL DEFAULT (UUID()),
    room_id          CHAR(36)      NOT NULL,
    tenant_id        CHAR(36)      NOT NULL,
    appointment_date DATE          NOT NULL COMMENT 'Ngày hẹn xem phòng',
    appointment_time TIME          NOT NULL COMMENT 'Giờ hẹn xem phòng',
    message          TEXT              NULL COMMENT 'Lời nhắn của người hẹn',
    status           ENUM('pending','confirmed','cancelled') NOT NULL DEFAULT 'pending',
    created_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_va_room   (room_id),
    INDEX idx_va_tenant (tenant_id),
    INDEX idx_va_status (status),
    CONSTRAINT fk_va_room   FOREIGN KEY (room_id)   REFERENCES rooms (id) ON DELETE CASCADE,
    CONSTRAINT fk_va_tenant FOREIGN KEY (tenant_id) REFERENCES users (id) ON DELETE CASCADE
) COMMENT 'Lịch hẹn xem phòng trước khi quyết định thuê';


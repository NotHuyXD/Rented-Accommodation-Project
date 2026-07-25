CREATE TABLE IF NOT EXISTS viewing_appointments (
  id              CHAR(36)      NOT NULL DEFAULT (UUID()),
  room_id         CHAR(36)      NOT NULL,
  tenant_id       CHAR(36)      NOT NULL,
  appointment_date DATE         NOT NULL,
  appointment_time TIME         NOT NULL,
  message         TEXT              NULL,
  status          ENUM('pending','confirmed','cancelled') NOT NULL DEFAULT 'pending',
  created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_va_room    (room_id),
  INDEX idx_va_tenant  (tenant_id),
  INDEX idx_va_status  (status),
  CONSTRAINT fk_va_room   FOREIGN KEY (room_id)   REFERENCES rooms (id) ON DELETE CASCADE,
  CONSTRAINT fk_va_tenant FOREIGN KEY (tenant_id) REFERENCES users (id) ON DELETE CASCADE
) COMMENT 'Lich hen xem phong';

// ============================================================
// Email Service – Nodemailer + Gmail SMTP
// ============================================================
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Kiểm tra kết nối (gọi khi server start)
async function verifyEmailConnection() {
  try {
    await transporter.verify();
    console.log('✅ Email service (Gmail SMTP) connected');
  } catch (err) {
    console.warn('⚠️  Email service not available:', err.message);
  }
}

/**
 * Format ngày giờ hẹn tiếng Việt
 */
function formatAppointmentDateTime(dateStr, timeStr) {
  const date = new Date(`${dateStr}T${timeStr}`);
  const dayOfWeek = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'][date.getDay()];
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return {
    date: `${dayOfWeek}, ngày ${day}/${month}/${year}`,
    time: `${hour}:${minute}`,
    full: `${dayOfWeek}, ngày ${day}/${month}/${year} lúc ${hour}:${minute}`,
  };
}

// ============================================================
// 1. Gửi email cho CHỦ TRỌ khi có người hẹn lịch xem phòng
// ============================================================
async function sendLandlordAppointmentEmail({ landlordEmail, landlordName, tenantName, tenantPhone, tenantEmail, roomTitle, roomAddress, appointmentDate, appointmentTime, message }) {
  const dt = formatAppointmentDateTime(appointmentDate, appointmentTime);

  const html = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Có người hẹn xem phòng</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f0f4f8; color: #1a202c; }
    .wrapper { max-width: 600px; margin: 32px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.10); }
    .header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 40px 32px; text-align: center; }
    .header-icon { font-size: 48px; margin-bottom: 12px; }
    .header h1 { color: #fff; font-size: 24px; font-weight: 700; }
    .header p { color: rgba(255,255,255,0.85); font-size: 14px; margin-top: 6px; }
    .body { padding: 32px; }
    .greeting { font-size: 16px; color: #374151; margin-bottom: 20px; line-height: 1.6; }
    .highlight-box { background: linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%); border-left: 4px solid #7c3aed; border-radius: 8px; padding: 20px 24px; margin: 24px 0; }
    .highlight-box .datetime { font-size: 22px; font-weight: 800; color: #4f46e5; }
    .highlight-box .datetime-sub { font-size: 14px; color: #6d28d9; margin-top: 4px; }
    .section-title { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #6b7280; margin: 28px 0 12px; }
    .info-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden; }
    .info-row { display: flex; padding: 14px 18px; border-bottom: 1px solid #e5e7eb; align-items: flex-start; }
    .info-row:last-child { border-bottom: none; }
    .info-icon { font-size: 18px; margin-right: 12px; min-width: 24px; text-align: center; margin-top: 2px; }
    .info-label { font-size: 12px; color: #9ca3af; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
    .info-value { font-size: 15px; color: #111827; font-weight: 600; margin-top: 2px; }
    .message-box { background: #fffbeb; border: 1px solid #fcd34d; border-radius: 10px; padding: 16px 18px; margin-top: 20px; }
    .message-box .msg-label { font-size: 12px; color: #92400e; font-weight: 700; margin-bottom: 8px; }
    .message-box .msg-text { font-size: 14px; color: #78350f; line-height: 1.6; font-style: italic; }
    .cta { text-align: center; margin: 32px 0 16px; }
    .cta a { display: inline-block; background: linear-gradient(135deg, #4f46e5, #7c3aed); color: #fff; text-decoration: none; font-size: 15px; font-weight: 700; padding: 14px 36px; border-radius: 50px; }
    .footer { background: #f9fafb; padding: 20px 32px; text-align: center; border-top: 1px solid #e5e7eb; }
    .footer p { font-size: 12px; color: #9ca3af; line-height: 1.6; }
    .brand { font-weight: 800; color: #4f46e5; }
  </style>
</head>
<body>
<div class="wrapper">
  <div class="header">
    <div class="header-icon">🏠</div>
    <h1>Có người muốn xem phòng của bạn!</h1>
    <p>Phòng: ${roomTitle}</p>
  </div>
  <div class="body">
    <p class="greeting">Xin chào <strong>${landlordName}</strong>,<br>Có người đã đặt lịch hẹn xem phòng của bạn. Vui lòng xem thông tin chi tiết bên dưới:</p>
    
    <div class="section-title">⏰ Thời gian hẹn</div>
    <div class="highlight-box">
      <div class="datetime">📅 ${dt.date}</div>
      <div class="datetime-sub">🕐 ${dt.time}</div>
    </div>

    <div class="section-title">🏢 Thông tin phòng</div>
    <div class="info-card">
      <div class="info-row">
        <span class="info-icon">🏠</span>
        <div><div class="info-label">Tên phòng</div><div class="info-value">${roomTitle}</div></div>
      </div>
      <div class="info-row">
        <span class="info-icon">📍</span>
        <div><div class="info-label">Địa chỉ</div><div class="info-value">${roomAddress}</div></div>
      </div>
    </div>

    <div class="section-title">👤 Thông tin người hẹn</div>
    <div class="info-card">
      <div class="info-row">
        <span class="info-icon">👤</span>
        <div><div class="info-label">Họ và tên</div><div class="info-value">${tenantName}</div></div>
      </div>
      <div class="info-row">
        <span class="info-icon">📞</span>
        <div><div class="info-label">Số điện thoại</div><div class="info-value">${tenantPhone || 'Chưa cung cấp'}</div></div>
      </div>
      <div class="info-row">
        <span class="info-icon">✉️</span>
        <div><div class="info-label">Email</div><div class="info-value">${tenantEmail}</div></div>
      </div>
    </div>

    ${message ? `
    <div class="message-box">
      <div class="msg-label">💬 Lời nhắn từ người hẹn:</div>
      <div class="msg-text">"${message}"</div>
    </div>` : ''}

    <div class="cta">
      <a href="http://localhost:5173/chat">Liên hệ ngay qua Tin nhắn →</a>
    </div>
  </div>
  <div class="footer">
    <p>Email này được gửi tự động bởi <span class="brand">PhongTro Online</span>.<br>Vui lòng không trả lời email này.</p>
  </div>
</div>
</body>
</html>
  `;

  await transporter.sendMail({
    from: `"PhongTro Online 🏠" <${process.env.EMAIL_USER}>`,
    to: landlordEmail,
    subject: `[PhongTro] ${tenantName} muốn hẹn xem phòng "${roomTitle}" – ${dt.full}`,
    html,
  });
}

// ============================================================
// 2. Gửi email cho NGƯỜI HẸN (tenant) – xác nhận lịch hẹn
// ============================================================
async function sendTenantAppointmentEmail({ tenantEmail, tenantName, landlordName, landlordPhone, landlordEmail: landlordEmailAddr, roomTitle, roomAddress, appointmentDate, appointmentTime }) {
  const dt = formatAppointmentDateTime(appointmentDate, appointmentTime);

  const html = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Xác nhận lịch hẹn xem phòng</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f0f4f8; color: #1a202c; }
    .wrapper { max-width: 600px; margin: 32px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.10); }
    .header { background: linear-gradient(135deg, #059669 0%, #0d9488 100%); padding: 40px 32px; text-align: center; }
    .header-icon { font-size: 48px; margin-bottom: 12px; }
    .header h1 { color: #fff; font-size: 24px; font-weight: 700; }
    .header p { color: rgba(255,255,255,0.85); font-size: 14px; margin-top: 6px; }
    .body { padding: 32px; }
    .greeting { font-size: 16px; color: #374151; margin-bottom: 20px; line-height: 1.6; }
    .success-badge { display: inline-flex; align-items: center; gap: 8px; background: #d1fae5; color: #065f46; font-size: 13px; font-weight: 700; padding: 8px 16px; border-radius: 50px; margin-bottom: 24px; }
    .highlight-box { background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); border-left: 4px solid #059669; border-radius: 8px; padding: 20px 24px; margin: 24px 0; }
    .highlight-box .datetime { font-size: 22px; font-weight: 800; color: #065f46; }
    .highlight-box .datetime-sub { font-size: 14px; color: #047857; margin-top: 4px; }
    .section-title { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #6b7280; margin: 28px 0 12px; }
    .info-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden; }
    .info-row { display: flex; padding: 14px 18px; border-bottom: 1px solid #e5e7eb; align-items: flex-start; }
    .info-row:last-child { border-bottom: none; }
    .info-icon { font-size: 18px; margin-right: 12px; min-width: 24px; text-align: center; margin-top: 2px; }
    .info-label { font-size: 12px; color: #9ca3af; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
    .info-value { font-size: 15px; color: #111827; font-weight: 600; margin-top: 2px; }
    .tips-box { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 18px; margin-top: 20px; }
    .tips-box .tips-title { font-size: 13px; font-weight: 700; color: #1d4ed8; margin-bottom: 10px; }
    .tips-box ul { list-style: none; padding: 0; }
    .tips-box ul li { font-size: 13px; color: #1e40af; padding: 4px 0; padding-left: 20px; position: relative; }
    .tips-box ul li::before { content: "✓"; position: absolute; left: 0; font-weight: 700; }
    .cta { text-align: center; margin: 32px 0 16px; }
    .cta a { display: inline-block; background: linear-gradient(135deg, #059669, #0d9488); color: #fff; text-decoration: none; font-size: 15px; font-weight: 700; padding: 14px 36px; border-radius: 50px; }
    .footer { background: #f9fafb; padding: 20px 32px; text-align: center; border-top: 1px solid #e5e7eb; }
    .footer p { font-size: 12px; color: #9ca3af; line-height: 1.6; }
    .brand { font-weight: 800; color: #059669; }
  </style>
</head>
<body>
<div class="wrapper">
  <div class="header">
    <div class="header-icon">✅</div>
    <h1>Lịch hẹn đã được đặt thành công!</h1>
    <p>Vui lòng lưu lại thông tin bên dưới</p>
  </div>
  <div class="body">
    <p class="greeting">Xin chào <strong>${tenantName}</strong>,<br>Bạn đã đặt lịch hẹn xem phòng thành công. Dưới đây là thông tin chi tiết:</p>
    
    <div class="section-title">⏰ Thời gian hẹn xem phòng</div>
    <div class="highlight-box">
      <div class="datetime">📅 ${dt.date}</div>
      <div class="datetime-sub">🕐 ${dt.time}</div>
    </div>

    <div class="section-title">🏠 Thông tin phòng</div>
    <div class="info-card">
      <div class="info-row">
        <span class="info-icon">🏠</span>
        <div><div class="info-label">Tên phòng</div><div class="info-value">${roomTitle}</div></div>
      </div>
      <div class="info-row">
        <span class="info-icon">📍</span>
        <div><div class="info-label">Địa chỉ đầy đủ</div><div class="info-value">${roomAddress}</div></div>
      </div>
    </div>

    <div class="section-title">👨‍💼 Thông tin chủ trọ</div>
    <div class="info-card">
      <div class="info-row">
        <span class="info-icon">👤</span>
        <div><div class="info-label">Tên chủ trọ</div><div class="info-value">${landlordName}</div></div>
      </div>
      <div class="info-row">
        <span class="info-icon">📞</span>
        <div><div class="info-label">Số điện thoại</div><div class="info-value">${landlordPhone || 'Chưa cung cấp'}</div></div>
      </div>
      <div class="info-row">
        <span class="info-icon">✉️</span>
        <div><div class="info-label">Email</div><div class="info-value">${landlordEmailAddr}</div></div>
      </div>
    </div>

    <div class="tips-box">
      <div class="tips-title">💡 Lưu ý khi đi xem phòng:</div>
      <ul>
        <li>Đến đúng giờ hẹn hoặc liên hệ trước nếu cần thay đổi</li>
        <li>Kiểm tra các tiện ích điện, nước, wifi</li>
        <li>Hỏi rõ về các khoản phí phát sinh</li>
        <li>Xem hợp đồng cẩn thận trước khi ký</li>
      </ul>
    </div>

    <div class="cta">
      <a href="http://localhost:5173/chat">Nhắn tin với chủ trọ →</a>
    </div>
  </div>
  <div class="footer">
    <p>Email này được gửi tự động bởi <span class="brand">PhongTro Online</span>.<br>Vui lòng không trả lời email này.</p>
  </div>
</div>
</body>
</html>
  `;

  await transporter.sendMail({
    from: `"PhongTro Online 🏠" <${process.env.EMAIL_USER}>`,
    to: tenantEmail,
    subject: `[PhongTro] Xác nhận lịch hẹn xem phòng "${roomTitle}" – ${dt.full}`,
    html,
  });
}

module.exports = {
  verifyEmailConnection,
  sendLandlordAppointmentEmail,
  sendTenantAppointmentEmail,
};

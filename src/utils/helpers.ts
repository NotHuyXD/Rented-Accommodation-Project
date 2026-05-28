// ============================================================
// Utility Helper Functions - v2.0
// ============================================================

/**
 * Convert a relative upload path (e.g. /uploads/foo.jpg) to an absolute URL
 * pointing at the Express backend server.
 * If the value is already an absolute URL (http/https), it is returned as-is.
 */
export function getImageUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  // Derive server base from VITE_API_URL by stripping "/api/v1"
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
  const serverBase = apiBase.replace(/\/api\/v1\/?$/, '');
  return `${serverBase}${url.startsWith('/') ? '' : '/'}${url}`;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
}

export function formatDateTime(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

export function timeAgo(dateStr: string): string {
  if (!dateStr) return '';
  const now = new Date();
  const date = new Date(dateStr);
  const diff = now.getTime() - date.getTime();

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Vừa xong';
  if (minutes < 60) return `${minutes} phút trước`;
  if (hours < 24) return `${hours} giờ trước`;
  if (days < 30) return `${days} ngày trước`;
  return formatDate(dateStr);
}

export function getStatusLabel(status: string): { label: string; color: string } {
  const statusMap: Record<string, { label: string; color: string }> = {
    // Room statuses
    available: { label: 'Đang trống', color: '#10b981' },
    rented: { label: 'Đang thuê', color: '#3b82f6' },
    maintenance: { label: 'Đang sửa chữa', color: '#f59e0b' },
    hidden: { label: 'Đã ẩn', color: '#6b7280' },
    // Rental request statuses
    pending: { label: 'Chờ xử lý', color: '#f59e0b' },
    accepted: { label: 'Đã chấp nhận', color: '#10b981' },
    rejected: { label: 'Đã từ chối', color: '#ef4444' },
    cancelled: { label: 'Đã hủy', color: '#6b7280' },
    // Contract statuses
    pending_sign: { label: 'Chờ ký', color: '#f59e0b' },
    active: { label: 'Đang hiệu lực', color: '#10b981' },
    expired: { label: 'Đã hết hạn', color: '#ef4444' },
    terminated: { label: 'Đã chấm dứt', color: '#ef4444' },
    // Invoice statuses
    unpaid: { label: 'Chưa thanh toán', color: '#ef4444' },
    paid: { label: 'Đã thanh toán', color: '#10b981' },
    overdue: { label: 'Quá hạn', color: '#dc2626' },
    disputed: { label: 'Đang tranh chấp', color: '#f59e0b' },
    // Payment statuses
    success: { label: 'Thành công', color: '#10b981' },
    failed: { label: 'Thất bại', color: '#ef4444' },
    // KYC statuses
    none: { label: 'Chưa xác thực', color: '#6b7280' },
    approved: { label: 'Đã duyệt', color: '#10b981' },
    // Report statuses
    resolved: { label: 'Đã giải quyết', color: '#10b981' },
    dismissed: { label: 'Đã bác', color: '#6b7280' },
  };
  return statusMap[status] || { label: status, color: '#6b7280' };
}

export function truncateText(text: string, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

export function getPaymentMethodLabel(method: string): string {
  const map: Record<string, string> = {
    cash: 'Tiền mặt',
    bank_transfer: 'Chuyển khoản',
    momo: 'MoMo',
    vnpay: 'VNPay',
    zalopay: 'ZaloPay',
  };
  return map[method] || method;
}

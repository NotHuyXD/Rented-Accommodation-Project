export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
}

export function formatDateTime(dateStr: string): string {
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
    available: { label: 'Đang trống', color: '#10b981' },
    deposited: { label: 'Đã đặt cọc', color: '#f59e0b' },
    rented: { label: 'Đang thuê', color: '#3b82f6' },
    maintenance: { label: 'Đang sửa chữa', color: '#ef4444' },
    pending: { label: 'Chờ xử lý', color: '#f59e0b' },
    confirmed: { label: 'Đã xác nhận', color: '#10b981' },
    cancelled: { label: 'Đã hủy', color: '#ef4444' },
    completed: { label: 'Hoàn thành', color: '#6366f1' },
    draft: { label: 'Nháp', color: '#6b7280' },
    active: { label: 'Đang hiệu lực', color: '#10b981' },
    expired: { label: 'Đã hết hạn', color: '#ef4444' },
    open: { label: 'Mở', color: '#f59e0b' },
    in_progress: { label: 'Đang xử lý', color: '#3b82f6' },
    fixing: { label: 'Đang sửa', color: '#8b5cf6' },
    resolved: { label: 'Đã giải quyết', color: '#10b981' },
    failed: { label: 'Thất bại', color: '#ef4444' },
    refunded: { label: 'Đã hoàn tiền', color: '#6366f1' }
  };
  return statusMap[status] || { label: status, color: '#6b7280' };
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

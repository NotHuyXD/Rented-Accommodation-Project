import { useModalStore } from '../../stores/modalStore';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import './GlobalModal.css';

export default function GlobalModal() {
  const { isOpen, type, title, message, onConfirm, onCancel, closeModal } = useModalStore();

  if (!isOpen) return null;

  const handleCancel = () => {
    if (onCancel) onCancel();
    else closeModal();
  };

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    else closeModal();
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="global-modal-icon success" />;
      case 'error':
        return <XCircle className="global-modal-icon error" />;
      case 'warning':
      case 'confirm':
        return <AlertTriangle className="global-modal-icon warning" />;
      case 'info':
      default:
        return <Info className="global-modal-icon info" />;
    }
  };

  return (
    <div className="global-modal-overlay">
      <div className="global-modal-content">
        <button className="global-modal-close" onClick={handleCancel}>
          <X size={20} />
        </button>

        <div className="global-modal-icon-container">
          {getIcon()}
        </div>

        <h3 className="global-modal-title">{title}</h3>
        
        {/* Support rendering HTML messages if needed, or simple text */}
        <p className="global-modal-message">
          {message.split('\n').map((line, idx) => (
            <span key={idx}>
              {line}
              {idx !== message.split('\n').length - 1 && <br />}
            </span>
          ))}
        </p>

        <div className="global-modal-actions">
          {type === 'confirm' ? (
            <>
              <button className="btn btn-secondary" onClick={handleCancel}>
                Hủy
              </button>
              <button className="btn btn-primary" onClick={handleConfirm}>
                Xác nhận
              </button>
            </>
          ) : (
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleConfirm}>
              Đóng
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

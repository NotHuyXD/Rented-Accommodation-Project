import { create } from 'zustand';

export type ModalType = 'success' | 'error' | 'warning' | 'info' | 'confirm';

interface ModalState {
  isOpen: boolean;
  type: ModalType;
  title: string;
  message: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  
  showAlert: (type: ModalType, title: string, message: string) => void;
  showConfirm: (title: string, message: string, onConfirm: () => void, onCancel?: () => void) => void;
  closeModal: () => void;
}

export const useModalStore = create<ModalState>((set) => ({
  isOpen: false,
  type: 'info',
  title: '',
  message: '',
  
  showAlert: (type, title, message) => set({
    isOpen: true,
    type,
    title,
    message,
    onConfirm: undefined,
    onCancel: undefined,
  }),
  
  showConfirm: (title, message, onConfirm, onCancel) => set({
    isOpen: true,
    type: 'confirm',
    title,
    message,
    onConfirm,
    onCancel,
  }),
  
  closeModal: () => set({ isOpen: false }),
}));

// Promise-based helpers for easy refactoring
export const confirmAsync = (title: string, message: string): Promise<boolean> => {
  return new Promise((resolve) => {
    useModalStore.getState().showConfirm(
      title,
      message,
      () => {
        useModalStore.getState().closeModal();
        resolve(true);
      },
      () => {
        useModalStore.getState().closeModal();
        resolve(false);
      }
    );
  });
};

export const alertAsync = (type: ModalType, title: string, message: string): Promise<void> => {
  return new Promise((resolve) => {
    // For alerts, we can just resolve when the user clicks OK or closes the modal
    // To implement this, we can hijack the onConfirm of the modal, or just resolve immediately if we don't care about waiting.
    // Wait for user to dismiss is better UX if they need to read it.
    useModalStore.getState().showAlert(type, title, message);
    
    // We override the state slightly to attach the resolve to onConfirm/onCancel
    useModalStore.setState({
      onConfirm: () => {
        useModalStore.getState().closeModal();
        resolve();
      },
      onCancel: () => {
        useModalStore.getState().closeModal();
        resolve();
      }
    });
  });
};

export const alertQuick = (type: ModalType, message: string) => {
  const titles = {
    success: 'Thành công',
    error: 'Lỗi',
    warning: 'Cảnh báo',
    info: 'Thông báo',
    confirm: 'Xác nhận'
  };
  useModalStore.getState().showAlert(type, titles[type] || 'Thông báo', message);
};

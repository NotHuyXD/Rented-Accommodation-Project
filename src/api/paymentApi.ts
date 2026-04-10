import axiosClient from './axiosClient';

export const paymentApi = {
  // Invoices
  getInvoices(params?: { page?: number; limit?: number; status?: string; billingYear?: number; billingMonth?: number }) {
    return axiosClient.get('/payments/invoices', { params });
  },

  getInvoiceById(id: string) {
    return axiosClient.get(`/payments/invoices/${id}`);
  },

  createInvoice(data: {
    tenantId: string;
    roomId: string;
    contractId?: string;
    billingMonth: number;
    billingYear: number;
    dueDate: string;
    rentAmount: number;
    utilityAmount?: number;
    serviceAmount?: number;
    otherAmount?: number;
    discountAmount?: number;
    note?: string;
    items?: Array<{
      itemType: string;
      description: string;
      previousReading?: number;
      currentReading?: number;
      usageAmount?: number;
      unitPrice?: number;
      unit?: string;
      amount: number;
    }>;
  }) {
    return axiosClient.post('/payments/invoices', data);
  },

  // Transactions
  getTransactions(params?: { page?: number; limit?: number; status?: string; paymentType?: string }) {
    return axiosClient.get('/payments/transactions', { params });
  },

  createTransaction(data: {
    payeeId: string;
    amount: number;
    paymentType: string;
    paymentMethodType?: string;
    roomId?: string;
    contractId?: string;
    bookingId?: string;
    invoiceId?: string;
    description?: string;
  }) {
    return axiosClient.post('/payments/transactions', data);
  },

  // Wallet
  getWallet() {
    return axiosClient.get('/payments/wallet');
  },

  // Payment Methods
  getPaymentMethods() {
    return axiosClient.get('/payments/methods');
  },

  addPaymentMethod(data: {
    methodType: string;
    bankName?: string;
    bankAccountNumber?: string;
    bankAccountHolder?: string;
    bankBranch?: string;
    walletPhone?: string;
    isDefault?: boolean;
  }) {
    return axiosClient.post('/payments/methods', data);
  },
};

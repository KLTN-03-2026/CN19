import api from './api';

export const revenueService = {
  getSummary: async () => {
    const response = await api.get('/revenue/summary');
    return response.data;
  },
  getTransactions: async () => {
    const response = await api.get('/revenue/transactions');
    return response.data;
  },
  withdraw: async (amount) => {
    const response = await api.post('/revenue/withdraw', { amount });
    return response.data;
  },
  updateBankInfo: async (bankInfo) => {
    const response = await api.put('/revenue/bank-info', bankInfo);
    return response.data;
  },
  getResaleOrders: async () => {
    const response = await api.get('/revenue/resale-orders');
    return response.data;
  }
};

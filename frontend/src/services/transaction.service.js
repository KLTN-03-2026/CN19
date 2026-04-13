import api from './api';

export const transactionService = {
  getMyTransactions: async () => {
    const response = await api.get('/transactions');
    return response.data;
  }
};

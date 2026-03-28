import api from './api';

export const userService = {
  getProfile: async () => {
    const response = await api.get('/users/profile');
    return response.data;
  },
  updateProfile: async (data) => {
    const response = await api.put('/users/profile', data);
    return response.data;
  },
  changePassword: async (data) => {
    const response = await api.put('/users/change-password', data);
    return response.data;
  },
  getWalletBalance: async () => {
    const response = await api.get('/users/wallet-balance');
    return response.data;
  },
  linkExternalWallet: async (address) => {
    const response = await api.post('/users/link-external-wallet', { address });
    return response.data;
  }
};

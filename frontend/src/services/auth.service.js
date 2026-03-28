import api from './api';

export const authService = {
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },
  sendRegisterOtp: async (userData) => {
    const response = await api.post('/auth/send-register-otp', userData);
    return response.data;
  },
  verifyRegisterOtp: async (data) => {
    const response = await api.post('/auth/verify-register-otp', data);
    return response.data;
  },
  sendOrganizerOtp: async (data) => {
    const response = await api.post('/auth/send-organizer-otp', data);
    return response.data;
  },
  verifyOrganizerOtp: async (data) => {
    const response = await api.post('/auth/verify-organizer-otp', data);
    return response.data;
  },
  googleLogin: async (data) => {
    const response = await api.post('/auth/google', data);
    return response.data;
  },
  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },
  resetPassword: async (data) => {
    const response = await api.post('/auth/reset-password', data);
    return response.data;
  }
};

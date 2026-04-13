import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Sử dụng địa chỉ IP của máy dev để test với điện thoại thực tế (Ví dụ: 192.168.1.x)
// Hoặc 10.0.2.2 nếu test trên Android Emulator
export const BASE_URL = 'http://192.168.20.145:5000/api'; 

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('staffToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const loginStaff = (email, password) => {
  return api.post('/auth/login', { email, password });
};

export const scanTicket = (qrHash) => {
  return api.post('/staff/scan', { qr_hash: qrHash });
};

export const getScanHistory = (eventId = null) => {
  const url = eventId ? `/staff/scan-history?event_id=${eventId}` : '/staff/scan-history';
  return api.get(url);
};

export const getMyEvents = () => {
  return api.get('/staff/my-events');
};

export const forgotPassword = (email) => {
  return api.post('/auth/forgot-password', { email });
};

export const resetPassword = (data) => {
  return api.post('/auth/reset-password', data);
};

export const getProfile = () => {
  return api.get('/users/profile');
};

export default api;

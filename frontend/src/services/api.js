import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

// Lấy URL từ biến môi trường, fallback về localhost
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor nạp Token vào mọi Request
api.interceptors.request.use(
  (config) => {
    // Đọc token từ Zustand store (mà Zustand đang lưu ở localStorage)
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;

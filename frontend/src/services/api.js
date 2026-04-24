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
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor xử lý phản hồi từ Server
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Nếu lỗi 401 (Unauthorized) -> Token hết hạn hoặc không hợp lệ
    if (error.response && error.response.status === 401) {
      // Tự động Logout để dọn dẹp trạng thái Frontend
      useAuthStore.getState().logout();
      
      // Có thể chuyển hướng về trang login nếu cần
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

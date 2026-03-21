import axios from 'axios';

// Đọc địa chỉ Backend từ môi trường cục bộ (tạm thời Hardcode nếu chưa cấu hình env)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request Interceptor: Tự động đính kèm Token
api.interceptors.request.use(
  (config) => {
    // Để tích hợp với authStore (Zustand), ta lấy token từ localStorage
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
      try {
        const { state } = JSON.parse(authStorage);
        if (state && state.token) {
          config.headers.Authorization = `Bearer ${state.token}`;
        }
      } catch (err) {
        console.error('Error parsing auth logic in interceptor:', err);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Gõ lỗi Global (VD: Token hết hạn)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Refresh token logic hoặc Clear token để buôc User đăng nhập lại
      console.warn('Unauthorized or Forbidden access');
    }
    return Promise.reject(error);
  }
);

export default api;

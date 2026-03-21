import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,         // Thông tin cá nhân cơ bản
      token: null,        // JWT Token
      role: null,         // User Role: 'customer' | 'organizer' | 'admin' | 'staff'
      isAuthenticated: false,

      // Hàm đăng nhập thành công
      login: (userData, token) => {
        set({
          user: userData,
          role: userData.role,
          token: token,
          isAuthenticated: true
        });
      },

      // Hàm đăng xuất
      logout: () => {
        set({
          user: null,
          role: null,
          token: null,
          isAuthenticated: false
        });
      },

      // Cập nhật thông tin profile
      updateUser: (updatedData) => {
        set((state) => ({
          user: { ...state.user, ...updatedData }
        }));
      }
    }),
    {
      name: 'auth-storage', // Key lưu trên Local Storage
      // Các fields muốn exclude (chỉ lưu token & info, không lưu state tạm thời nếu có)
    }
  )
);

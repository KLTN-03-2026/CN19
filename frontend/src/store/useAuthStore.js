import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,         
      token: null,        
      isAuthenticated: false, 
      
      // Hàm gọi khi user Đăng nhập thành công
      login: (user, token) => set({ user, token, isAuthenticated: true }),
      
      // Hàm gọi khi user Đăng xuất
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage', 
    }
  )
);

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,         
      token: null,        
      isAuthenticated: false, 
      
      // Hàm gọi khi user Đăng nhập thành công
      login: (userData, token) => set({ user: userData, token, isAuthenticated: true }),
      
      // Cập nhật thông tin User mới (sau khi Edit Profile thành công)
      updateUser: (newData) => {
        const currentUser = get().user;
        set({ user: { ...currentUser, ...newData } });
      },
      
      // Hàm gọi khi user Đăng xuất
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage', 
    }
  )
);

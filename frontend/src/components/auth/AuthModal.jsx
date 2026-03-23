import React from 'react';
import { X } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import Login from '../../pages/Auth/Login';
import Register from '../../pages/Auth/Register';

const AuthModal = () => {
  const { authModal, closeAuthModal } = useAuthStore();

  if (!authModal) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Nền mờ (Blur Backdrop) */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-md transition-opacity"
        onClick={closeAuthModal}
      />
      
      {/* Khung chứa Modal */}
      <div className="relative z-10 w-full max-w-[440px] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Nút Đóng (Dấu X) */}
        <button 
          onClick={closeAuthModal}
          className="absolute right-4 top-4 z-20 p-2 bg-gray-100 dark:bg-dark-bg/80 text-gray-500 hover:text-gray-900 dark:hover:text-white rounded-full transition-colors border border-gray-200 dark:border-dark-border"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Nội dung form */}
        {authModal === 'login' ? <Login /> : <Register />}
        
      </div>
    </div>
  );
};

export default AuthModal;

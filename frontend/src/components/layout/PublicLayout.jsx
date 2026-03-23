import React, { useState, useEffect } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Shield, Moon, Sun, Globe } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useTranslation } from 'react-i18next';

const PublicLayout = () => {
  const { isAuthenticated } = useAuthStore();
  const { t, i18n } = useTranslation();
  
  // Trạng thái Theme (Lưu trong LocalStorage)
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('theme') !== 'light';
  });

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      // Dùng requestAnimationFrame để tracking mượt hơn
      requestAnimationFrame(() => {
        setMousePos({ x: e.clientX, y: e.clientY });
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  // Hook đổi ngôn ngữ
  const toggleLang = () => {
    const newLang = i18n.language.startsWith('vi') ? 'en' : 'vi';
    i18n.changeLanguage(newLang);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg bg-grid-pattern transition-colors duration-500 flex flex-col font-sans relative overflow-hidden">
      
      {/* --- HIỆU ỨNG AURORA KHÓI TỎA TOÀN TRANG BIẾN TẤU LƯỢN SÓNG (WAVY/SOFT AURA) --- */}
      {/* Cục mây (Aura) số 1: To và bồng bềnh, đi chậm theo chuột (Delay dài 1000ms), kết hợp nhịp thở (animate-pulse) */}
      <div 
        className="pointer-events-none fixed top-0 left-0 z-0 w-[300px] h-[300px] md:w-[450px] md:h-[450px] rounded-full bg-[#52c42d]/15 dark:bg-[#52c42d]/[0.07] blur-[70px] md:blur-[100px] transition-transform duration-1000 ease-out animate-pulse"
        style={{
          transform: `translate(calc(${mousePos.x}px - 50%), calc(${mousePos.y}px - 50%))`
        }}
      />
      {/* Cục mây (Aura) số 2: Nhỏ hơn, đi nhanh hơn 1 chút (Delay 700ms), tạo hiệu ứng sóng (wave) khi di chuyển trượt trên khối số 1 */}
      <div 
        className="pointer-events-none fixed top-0 left-0 z-0 w-[150px] h-[150px] md:w-[250px] md:h-[250px] rounded-full bg-[#45a825]/20 dark:bg-[#45a825]/[0.09] blur-[50px] md:blur-[70px] transition-transform duration-700 ease-out"
        style={{
          transform: `translate(calc(${mousePos.x}px - 50%), calc(${mousePos.y}px - 50%))`
        }}
      />

      <header className="border-b border-gray-200 dark:border-dark-border sticky top-0 z-50 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-xl transition-colors">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex justify-between h-20 items-center">
            
            {/* Logo */}
            <Link to="/" className="flex-shrink-0 flex items-center space-x-2">
              <Shield className="w-8 h-8 text-neon-green" />
              <span className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                BASTICKET
              </span>
            </Link>

            {/* Danh mục Navigation (Bên Trái/Giữa) */}
            <nav className="hidden md:flex space-x-8">
              <Link to="/" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white font-medium transition-colors">{t('nav.home')}</Link>
              <Link to="/events" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white font-medium transition-colors">{t('nav.events')}</Link>
              <Link to="/marketplace" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white font-medium transition-colors">{t('nav.marketplace')}</Link>
            </nav>

            {/* Các Nút Điều hướng Hệ thống & Auth (Bên Phải) */}
            <div className="flex items-center space-x-6">
              
              {/* Nút Đăng ký Ban Tổ Chức (Nổi bật nhẹ) */}
              <Link to="/organizer-register" className="hidden lg:flex items-center bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-900 dark:text-white px-4 py-2 rounded-lg font-semibold transition-colors text-sm border border-gray-200 dark:border-gray-700">
                {t('nav.organizer')}
              </Link>

              {/* Vùng Setting Theme & Lang nằm giữa Danh mục và Auth */}
              <div className="flex items-center space-x-3 border-l md:border-l-0 md:border-r border-gray-300 dark:border-gray-700 pl-4 md:pl-0 md:pr-6 md:mr-2">
                
                {/* Nút Đổi Ngôn Ngữ */}
                <button 
                  onClick={toggleLang}
                  className="flex items-center text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                  title="Change Language"
                >
                  <Globe className="w-5 h-5 mr-1" />
                  <span className="text-sm font-bold uppercase">{i18n.language.startsWith('vi') ? 'VI' : 'EN'}</span>
                </button>

                {/* Nút Đổi Theme Sáng/Tối */}
                <button 
                  onClick={() => setIsDark(!isDark)}
                  className="p-1.5 rounded-full text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-white/10 transition-colors"
                  title="Toggle Light/Dark Mode"
                >
                  {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
              </div>

              {/* Nút Đăng nhập / Đăng ký */}
              {!isAuthenticated ? (
                <>
                  <Link to="/login" className="text-gray-700 dark:text-gray-300 hover:text-neon-green font-semibold transition-colors">
                    {t('auth.login')}
                  </Link>
                  <Link to="/register" className="bg-neon-green hover:bg-neon-hover text-black px-6 py-2.5 rounded-full font-bold transition-all shadow-[0_0_15px_rgba(82,196,45,0.4)]">
                    {t('auth.signup')}
                  </Link>
                </>
              ) : (
                <Link to="/profile" className="bg-white dark:bg-dark-card border border-gray-300 dark:border-dark-border hover:border-gray-400 dark:hover:border-gray-600 text-gray-900 dark:text-white px-5 py-2.5 rounded-full font-medium transition-all shadow-sm">
                  {i18n.language.startsWith('vi') ? 'Hồ sơ Web3' : 'Web3 Profile'}
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        <Outlet />
      </main>

      <footer className="border-t border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg py-12 mt-20 transition-colors">
        <div className="max-w-[1400px] mx-auto px-4 text-center">
          <Shield className="w-8 h-8 text-gray-300 dark:text-dark-border mx-auto mb-4" />
          <p className="text-gray-400 sm:text-gray-500">© 2026 BlockTix. The Next Generation Ticketing Platform.</p>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;

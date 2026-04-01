import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Shield, Moon, Sun, Globe, User, Ticket, LogOut, ChevronDown, LayoutDashboard } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import Footer from './Footer';

const PublicLayout = () => {
  const { isAuthenticated, user, logout } = useAuthStore();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    toast.success(i18n.language.startsWith('vi') ? 'Đã đăng xuất!' : 'Logged out!');
    navigate('/login');
  };
  
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

  const handleOrganizerBtnClick = () => {
    // Đã là organizer được duyệt -> thẳng Dashboard
    if (isAuthenticated && user?.role === 'organizer') {
      navigate('/organizer/dashboard');
    } else {
      // Chưa đăng nhập hoặc đang là customer -> Form đăng ký
      navigate('/organizer-register');
    }
  };
  const toggleLang = () => {
    const newLang = i18n.language.startsWith('vi') ? 'en' : 'vi';
    i18n.changeLanguage(newLang);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg bg-grid-pattern transition-colors duration-500 flex flex-col font-sans relative">
      
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

      <header className="fixed top-0 left-0 w-full z-50 border-b border-gray-200 dark:border-dark-border bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-xl transition-colors">
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
              <Link to="/blog" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white font-medium transition-colors">{t('nav.blog')}</Link>
            </nav>

            {/* Các Nút Điều hướng Hệ thống & Auth (Bên Phải) */}
            <div className="flex items-center space-x-6">
              
              {/* Nút Truy cập Admin (Nếu là Admin/Staff) */}
              {isAuthenticated && user?.role === 'admin' && (
                <Link 
                  to="/admin/dashboard"
                  className="hidden lg:flex items-center bg-red-500/10 hover:bg-red-500/20 text-red-500 px-4 py-2 rounded-lg font-bold transition-colors text-sm border border-red-500/20 mr-4"
                >
                  ⚙️ Quản trị
                </Link>
              )}

              {/* Nút Dành cho Ban Tổ Chức - Smart Routing theo Role */}
              {isAuthenticated && user?.role === 'organizer' ? (
                <Link 
                  to="/organizer/dashboard"
                  className="hidden lg:flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold transition-all text-sm shadow-[0_0_15px_rgba(37,99,235,0.3)] mr-2"
                >
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Dashboard BTC
                </Link>
              ) : (
                <button 
                  onClick={handleOrganizerBtnClick}
                  className="hidden lg:flex items-center bg-gray-100 hover:bg-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-900 dark:text-white px-4 py-2 rounded-lg font-semibold transition-colors text-sm border border-gray-200 dark:border-gray-700"
                >
                  {t('nav.organizer')}
                </button>
              )}

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

              {/* Nút Đăng nhập / Đăng ký hoặc Avatar User */}
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
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(prev => !prev)}
                    className="flex items-center space-x-2 bg-neon-green/10 hover:bg-neon-green/20 border border-neon-green/40 text-gray-900 dark:text-white px-3 py-2 rounded-full font-medium transition-all"
                  >
                    <div className="w-7 h-7 rounded-full bg-neon-green flex items-center justify-center text-black font-bold text-xs overflow-hidden">
                      {user?.avatar_url ? (
                        <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        user?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'
                      )}
                    </div>
                    <span className="text-sm font-semibold max-w-[100px] truncate">
                      {user?.full_name || user?.fullName || user?.email?.split('@')[0] || 'User'}
                    </span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-xl shadow-xl py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="px-4 py-2 border-b border-gray-100 dark:border-dark-border">
                        <p className="text-xs text-gray-400 dark:text-gray-500 uppercase font-semibold">Đã đăng nhập</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user?.email}</p>
                        <span className="inline-block text-[10px] bg-neon-green/10 text-neon-green font-bold px-2 py-0.5 rounded-full mt-0.5 uppercase">{user?.role}</span>
                      </div>
                      <Link
                        to="/profile"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center space-x-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                      >
                        <User className="w-4 h-4" />
                        <span>{i18n.language.startsWith('vi') ? 'Hồ sơ của tôi' : 'My Profile'}</span>
                      </Link>
                      <Link
                        to="/my-tickets"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center space-x-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                      >
                        <Ticket className="w-4 h-4" />
                        <span>{i18n.language.startsWith('vi') ? 'Vé của tôi' : 'My Tickets'}</span>
                      </Link>
                      <div className="border-t border-gray-100 dark:border-dark-border mt-1">
                        <button
                          onClick={handleLogout}
                          className="flex items-center space-x-2 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors text-left"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>{i18n.language.startsWith('vi') ? 'Đăng xuất' : 'Sign Out'}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow pt-8">
        <Outlet />
      </main>

      {/* Ẩn Footer ở các trang Auth để tập trung vào Form (UX Minimalist) */}
      {!['/login', '/register', '/forgot-password', '/reset-password', '/organizer-register'].includes(location.pathname) && (
        <Footer />
      )}
    </div>
  );
};

export default PublicLayout;

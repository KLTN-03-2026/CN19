import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Shield, Moon, Sun, Globe, User, Ticket, LogOut, ChevronDown, LayoutDashboard, Settings, History, Menu, X, Home, Calendar, ShoppingBag, Users, FileText, ChevronRight, Wallet } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useTranslation } from 'react-i18next';
import { userService } from '../../services/user.service';
import toast from 'react-hot-toast';
import Footer from './Footer';
import ScrollToTop from './ScrollToTop';
import Logo from '../common/Logo';

const PublicLayout = () => {
  const { isAuthenticated, user, logout, updateUser } = useAuthStore();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileDropdownOpen, setMobileDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const mobileDropdownRef = useRef(null);
  const location = useLocation();

  // Refresh profile data if authenticated to ensure we have latest info (like created_at)
  useEffect(() => {
    if (isAuthenticated) {
      userService.getProfile()
        .then(res => {
          if (res.data) {
            updateUser(res.data);
          }
        })
        .catch(err => console.error('Failed to refresh profile:', err));
    }
  }, [isAuthenticated]);

  // Close mobile dropdown on route change
  useEffect(() => {
    setMobileDropdownOpen(false);
  }, [location.pathname]);


  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
      if (mobileDropdownRef.current && !mobileDropdownRef.current.contains(e.target)) {
        setMobileDropdownOpen(false);
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
    if (isAuthenticated && (user?.role === 'organizer' || user?.role === 'admin')) {
      navigate('/organizer/dashboard');
    } else {
      navigate('/organizer-register');
    }
  };

  const toggleLang = () => {
    const newLang = i18n.language.startsWith('vi') ? 'en' : 'vi';
    i18n.changeLanguage(newLang);
  };

  return (
    <div className="min-h-screen mt-8 bg-gray-50 dark:bg-dark-bg transition-colors duration-500 flex flex-col font-sans relative">
      <ScrollToTop />
      
      {/* Aurora Effects */}
      <div 
        className="pointer-events-none fixed top-0 left-0 z-0 w-[300px] h-[300px] md:w-[450px] md:h-[450px] rounded-full bg-[#52c42d]/15 dark:bg-[#52c42d]/[0.07] blur-[70px] md:blur-[100px] transition-transform duration-1000 ease-out animate-pulse"
        style={{
          transform: `translate(calc(${mousePos.x}px - 50%), calc(${mousePos.y}px - 50%))`
        }}
      />
      <div 
        className="pointer-events-none fixed top-0 left-0 z-0 w-[150px] h-[150px] md:w-[250px] md:h-[250px] rounded-full bg-[#45a825]/20 dark:bg-[#45a825]/[0.09] blur-[50px] md:blur-[70px] transition-transform duration-700 ease-out"
        style={{
          transform: `translate(calc(${mousePos.x}px - 50%), calc(${mousePos.y}px - 50%))`
        }}
      />

      <header className="fixed top-0 left-0 w-full z-[1000] border-b border-gray-200 dark:border-dark-border bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-xl transition-colors">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex justify-between h-20 items-center">
            
            {/* Logo */}
            <Logo variant="full" size="lg" className="flex-shrink-0" />

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8">
              <Link to="/" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white font-medium transition-colors">{t('nav.home')}</Link>
              <Link to="/events" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white font-medium transition-colors">{t('nav.events')}</Link>
              <Link to="/marketplace" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white font-medium transition-colors">{t('nav.marketplace')}</Link>
              <Link to="/blog" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white font-medium transition-colors">{t('nav.blog')}</Link>
            </nav>

            {/* Actions Wrapper */}
            <div className="flex items-center space-x-4 md:space-x-6">
              
              {/* Admin Link (Desktop Only) */}
              {isAuthenticated && user?.role === 'admin' && (
                <Link 
                  to="/admin/dashboard"
                  className="hidden lg:flex items-center bg-red-500/10 hover:bg-red-500/20 text-red-500 px-4 py-2 rounded-lg font-bold transition-colors text-sm border border-red-500/20 mr-2"
                >
                  ⚙️ Quản trị
                </Link>
              )}

              {/* BTC Button (Desktop Only) */}
              {isAuthenticated && user?.role === 'organizer' ? (
                <Link 
                  to="/organizer/dashboard"
                  className="hidden md:flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold transition-all text-sm shadow-[0_0_15px_rgba(37,99,235,0.3)] mr-2"
                >
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Dashboard BTC
                </Link>
              ) : (
                <button 
                  onClick={handleOrganizerBtnClick}
                  className="hidden md:flex items-center bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-900 dark:text-white px-4 py-2 rounded-lg font-semibold transition-colors text-sm border border-gray-200 dark:border-gray-700 mr-2"
                >
                  {t('nav.organizer')}
                </button>
              )}

              {/* Theme & Lang Toggles (Desktop Only) */}
              <div className="hidden md:flex items-center space-x-3 border-r border-gray-300 dark:border-gray-700 pr-6 mr-2">
                <button onClick={toggleLang} className="flex items-center text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">
                  <Globe className="w-5 h-5 mr-1" />
                  <span className="text-sm font-bold uppercase">{i18n.language.startsWith('vi') ? 'VI' : 'EN'}</span>
                </button>
                <button onClick={() => setIsDark(!isDark)} className="p-1.5 rounded-full text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:text-white/10 transition-colors">
                  {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
              </div>

              {/* Mobile Dropdown (Visible on mobile only) */}
              <div className="md:hidden flex items-center space-x-3">
                <div className="relative" ref={mobileDropdownRef}>
                  {isAuthenticated ? (
                    <button
                      onClick={() => setMobileDropdownOpen(!mobileDropdownOpen)}
                      className="flex items-center space-x-2 bg-neon-green/10 border border-neon-green/40 px-2 py-1.5 rounded-full transition-all active:scale-95"
                    >
                      <div className="w-7 h-7 rounded-full bg-neon-green flex items-center justify-center text-black font-bold text-[10px] overflow-hidden">
                        {user?.avatar_url ? (
                          <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          user?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'
                        )}
                      </div>
                      <span className="text-xs font-bold text-gray-900 dark:text-white max-w-[70px] truncate uppercase">
                        {user?.full_name?.split(' ').pop() || user?.fullName?.split(' ').pop() || 'USER'}
                      </span>
                      <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-300 ${mobileDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                  ) : (
                    <button 
                      onClick={() => setMobileDropdownOpen(!mobileDropdownOpen)}
                      className="p-2 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 transition-all active:scale-95 flex items-center space-x-2"
                    >
                      <Menu className="w-5 h-5" />
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${mobileDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                  )}

                  <AnimatePresence>
                    {mobileDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-3 w-[260px] bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-white/10 rounded-[2rem] shadow-2xl py-3 z-[1001] overflow-hidden"
                      >
                        {/* Quick Toggles */}
                        <div className="px-4 pb-2.5 mb-2.5 border-b border-gray-100 dark:border-white/5 flex items-center justify-between gap-2">
                           <button onClick={toggleLang} className="flex-1 flex items-center justify-center space-x-2 py-1.5 rounded-xl bg-gray-50 dark:bg-white/5 active:scale-95 transition-all">
                             <span className="text-xs">{i18n.language.startsWith('vi') ? '🇻🇳' : '🇺🇸'}</span>
                             <span className="text-[11px] font-medium text-gray-500">{i18n.language.startsWith('vi') ? 'Tiếng Việt' : 'English'}</span>
                           </button>
                           <button onClick={() => setIsDark(!isDark)} className="flex-1 flex items-center justify-center space-x-2 py-1.5 rounded-xl bg-gray-50 dark:bg-white/5 active:scale-95 transition-all">
                             {isDark ? <Sun className="w-3.5 h-3.5 text-gray-400" /> : <Moon className="w-3.5 h-3.5 text-gray-400" />}
                             <span className="text-[11px] font-medium text-gray-500 uppercase">{isDark ? 'Sáng' : 'Tối'}</span>
                           </button>
                        </div>

                        {/* Navigation Links */}
                        <div className="px-3 pb-2.5 mb-2.5 border-b border-gray-100 dark:border-white/5 grid grid-cols-2 gap-2">
                           <Link to="/" onClick={() => setMobileDropdownOpen(false)} className="flex items-center justify-center p-2 rounded-xl bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase transition-all">{t('nav.home')}</Link>
                           <Link to="/events" onClick={() => setMobileDropdownOpen(false)} className="flex items-center justify-center p-2 rounded-xl bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase transition-all">{t('nav.events')}</Link>
                           <Link to="/marketplace" onClick={() => setMobileDropdownOpen(false)} className="flex items-center justify-center p-2 rounded-xl bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase transition-all">{t('nav.marketplace')}</Link>
                           <Link to="/blog" onClick={() => setMobileDropdownOpen(false)} className="flex items-center justify-center p-2 rounded-xl bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase transition-all">{t('nav.blog')}</Link>
                        </div>

                        {/* Become Organizer */}
                        {(!isAuthenticated || user?.role === 'customer') ? (
                          <div className="px-2 mb-2">
                             <Link to="/organizer-register" onClick={() => setMobileDropdownOpen(false)} className="flex items-center space-x-3 px-4 py-2.5 rounded-2xl text-[13px] font-medium text-blue-600 bg-blue-50/50 dark:bg-blue-600/5 hover:bg-blue-50 dark:hover:bg-blue-600/10 transition-all">
                                <Users className="w-4.5 h-4.5" />
                                <span>{i18n.language.startsWith('vi') ? 'Dành cho Ban tổ chức' : 'For Organizers'}</span>
                             </Link>
                          </div>
                        ) : (user?.role === 'organizer' || user?.role === 'admin') && (
                          <div className="px-2 mb-2">
                             <Link to="/organizer/dashboard" onClick={() => setMobileDropdownOpen(false)} className="flex items-center space-x-3 px-4 py-2.5 rounded-2xl text-[13px] font-medium text-blue-600 bg-blue-50/50 dark:bg-blue-600/5 hover:bg-blue-50 dark:hover:bg-blue-600/10 transition-all">
                                <LayoutDashboard className="w-4.5 h-4.5" />
                                <span>Dashboard BTC</span>
                             </Link>
                          </div>
                        )}

                        {/* Auth / Profile Content */}
                        {!isAuthenticated ? (
                          <div className="px-2 space-y-1 mt-1 pt-1 border-t border-gray-100 dark:border-white/5">
                            <Link to="/login" onClick={() => setMobileDropdownOpen(false)} className="flex items-center justify-center w-full p-3 rounded-2xl bg-gray-100 dark:bg-white/5 text-[11px] font-bold text-gray-900 dark:text-white uppercase transition-all">
                              {t('auth.login')}
                            </Link>
                            <Link to="/register" onClick={() => setMobileDropdownOpen(false)} className="flex items-center justify-center w-full p-3 rounded-2xl bg-neon-green text-black text-[11px] font-bold uppercase shadow-lg shadow-neon-green/20 transition-all">
                              {t('auth.signup')}
                            </Link>
                          </div>
                        ) : (
                          <div className="px-2 space-y-0.5">
                            {isAuthenticated && (user?.role === 'organizer' || user?.role === 'admin') && (
                              <div className="mb-1">
                                {user?.role === 'organizer' && (
                                  <Link to="/organizer/dashboard" onClick={() => setMobileDropdownOpen(false)} className="flex items-center space-x-3 px-4 py-2.5 rounded-2xl text-[13px] font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-600/10 transition-all">
                                    <LayoutDashboard className="w-4.5 h-4.5" />
                                    <span>Dashboard BTC</span>
                                  </Link>
                                )}
                                {user?.role === 'admin' && (
                                  <Link to="/admin/dashboard" onClick={() => setMobileDropdownOpen(false)} className="flex items-center space-x-3 px-4 py-2.5 rounded-2xl text-[13px] font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-600/10 transition-all">
                                    <Shield className="w-4.5 h-4.5" />
                                    <span>Admin Hệ thống</span>
                                  </Link>
                                )}
                              </div>
                            )}
                            <div className="pt-1 mt-1 border-t border-gray-100 dark:border-white/5">
                              <Link to="/profile" onClick={() => setMobileDropdownOpen(false)} className="flex items-center space-x-3 px-4 py-2.5 rounded-2xl text-[13px] font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-all">
                                <User className="w-4.5 h-4.5 text-gray-400" />
                                <span>{i18n.language.startsWith('vi') ? 'Hồ sơ của tôi' : 'My Profile'}</span>
                              </Link>
                              <Link to="/my-merchandise" onClick={() => setMobileDropdownOpen(false)} className="flex items-center space-x-3 px-4 py-2.5 rounded-2xl text-[13px] font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-all">
                                <ShoppingBag className="w-4.5 h-4.5 text-gray-400" />
                                <span>{i18n.language.startsWith('vi') ? 'Sản phẩm của tôi' : 'My Products'}</span>
                              </Link>
                              <Link to="/my-tickets" onClick={() => setMobileDropdownOpen(false)} className="flex items-center space-x-3 px-4 py-2.5 rounded-2xl text-[13px] font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-all">
                                <Ticket className="w-4.5 h-4.5 text-gray-400" />
                                <span>{i18n.language.startsWith('vi') ? 'Vé của tôi' : 'My Tickets'}</span>
                              </Link>
                              <Link to="/my-transactions" onClick={() => setMobileDropdownOpen(false)} className="flex items-center space-x-3 px-4 py-2.5 rounded-2xl text-[13px] font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-all">
                                <History className="w-4.5 h-4.5 text-gray-400" />
                                <span>{i18n.language.startsWith('vi') ? 'Lịch sử giao dịch' : 'Transaction History'}</span>
                              </Link>
                              <Link to="/my-revenue" onClick={() => setMobileDropdownOpen(false)} className="flex items-center space-x-3 px-4 py-2.5 rounded-2xl text-[13px] font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-all">
                                <Wallet className="w-4.5 h-4.5 text-gray-400" />
                                <span>{i18n.language.startsWith('vi') ? 'Quản lý nguồn thu' : 'Revenue Management'}</span>
                              </Link>
                              <Link to="/blog" state={{ activeTab: 'profile' }} onClick={() => setMobileDropdownOpen(false)} className="flex items-center space-x-3 px-4 py-2.5 rounded-2xl text-[13px] font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-all">
                                <FileText className="w-4.5 h-4.5 text-gray-400" />
                                <span>{i18n.language.startsWith('vi') ? 'Bài viết của tôi' : 'My Posts'}</span>
                              </Link>
                              <button onClick={handleLogout} className="flex items-center space-x-3 w-full px-4 py-2.5 rounded-2xl text-[13px] font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all mt-1">
                                <LogOut className="w-4.5 h-4.5" />
                                <span>{i18n.language.startsWith('vi') ? 'Đăng xuất' : 'Sign Out'}</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Desktop Auth / Profile */}
              <div className="hidden md:flex items-center">
                {!isAuthenticated ? (
                  <div className="flex items-center space-x-4">
                    <Link to="/login" className="text-gray-700 dark:text-gray-300 hover:text-neon-green text-sm font-semibold transition-colors">
                      {t('auth.login')}
                    </Link>
                    <Link to="/register" className="bg-neon-green hover:bg-neon-hover text-black px-6 py-2.5 rounded-full text-sm font-bold transition-all shadow-[0_0_15px_rgba(82,196,45,0.4)]">
                      {t('auth.signup')}
                    </Link>
                  </div>
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

                    <AnimatePresence>
                      {dropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute right-0 mt-2 w-52 bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-xl shadow-xl py-1 z-[1001]"
                        >
                          <div className="px-4 py-2 border-b border-gray-100 dark:border-dark-border">
                            <p className="text-xs text-gray-400 dark:text-gray-500 uppercase font-semibold">Đã đăng nhập</p>
                            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user?.email}</p>
                            <span className="inline-block text-[10px] bg-neon-green/10 text-neon-green font-bold px-2 py-0.5 rounded-full mt-0.5 uppercase">{user?.role}</span>
                          </div>
                          <Link to="/profile" onClick={() => setDropdownOpen(false)} className="flex items-center space-x-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                            <User className="w-4 h-4" />
                            <span>{i18n.language.startsWith('vi') ? 'Hồ sơ của tôi' : 'My Profile'}</span>
                          </Link>
                          <Link to="/my-merchandise" onClick={() => setDropdownOpen(false)} className="flex items-center space-x-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                            <ShoppingBag className="w-4 h-4" />
                            <span>{i18n.language.startsWith('vi') ? 'Sản phẩm của tôi' : 'My Products'}</span>
                          </Link>
                          <Link to="/my-tickets" onClick={() => setDropdownOpen(false)} className="flex items-center space-x-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                            <Ticket className="w-4 h-4" />
                            <span>{i18n.language.startsWith('vi') ? 'Vé của tôi' : 'My Tickets'}</span>
                          </Link>
                          <Link to="/my-transactions" onClick={() => setDropdownOpen(false)} className="flex items-center space-x-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                            <History className="w-4 h-4" />
                            <span>{i18n.language.startsWith('vi') ? 'Lịch sử giao dịch' : 'Transaction History'}</span>
                          </Link>
                          <Link to="/my-revenue" onClick={() => setDropdownOpen(false)} className="flex items-center space-x-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                            <Wallet className="w-4 h-4" />
                            <span>{i18n.language.startsWith('vi') ? 'Quản lý nguồn thu' : 'Revenue Management'}</span>
                          </Link>
                          <Link to="/blog" state={{ activeTab: 'profile' }} onClick={() => setDropdownOpen(false)} className="flex items-center space-x-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                            <FileText className="w-4 h-4" />
                            <span>{i18n.language.startsWith('vi') ? 'Bài viết của tôi' : 'My Posts'}</span>
                          </Link>
                          <div className="border-t border-gray-100 dark:border-dark-border mt-1">
                            <button onClick={handleLogout} className="flex items-center space-x-2 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors text-left">
                              <LogOut className="w-4 h-4" />
                              <span>{i18n.language.startsWith('vi') ? 'Đăng xuất' : 'Sign Out'}</span>
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow pt-8">
        <Outlet />
      </main>

      {!['/login', '/register', '/forgot-password', '/reset-password', '/organizer-register'].includes(location.pathname) && (
        <Footer />
      )}
    </div>
  );
};

export default PublicLayout;

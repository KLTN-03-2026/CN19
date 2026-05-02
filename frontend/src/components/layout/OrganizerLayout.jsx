import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Calendar, 
  PlusCircle, 
  Ticket, 
  Wallet, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  Bell, 
  Search,
  ChevronRight,
  Sun,
  Moon,
  UserCircle,
  Home,
  Users,
  Package,
  FileText,
  ClipboardList,
  Tag,
  BarChart3
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import toast from 'react-hot-toast';
import ScrollToTop from './ScrollToTop';

const OrganizerLayout = () => {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const [isDark, setIsDark] = React.useState(localStorage.getItem('theme') !== 'light');

  React.useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  // Tự động đóng sidebar trên mobile khi resize hoặc mount
  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    handleResize(); // Chạy khi mount
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Đóng sidebar khi chuyển route trên mobile
  React.useEffect(() => {
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    toast.success('Đã đăng xuất khỏi tài khoản Ban Tổ Chức');
    navigate('/login');
  };

  const menuItems = [
    { path: '/organizer/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/organizer/my-events', icon: Calendar, label: 'Sự kiện của tôi' },
    { path: '/organizer/create-event', icon: PlusCircle, label: 'Tạo sự kiện' },
    { path: '/organizer/tickets', icon: Ticket, label: 'Quản lý vé' },
    { path: '/organizer/orders', icon: ClipboardList, label: 'Quản lý đơn hàng' },
    { path: '/organizer/marketplace', icon: Tag, label: 'Quản lý Marketplace' },
    { path: '/organizer/revenue', icon: Wallet, label: 'Doanh thu & Rút tiền' },
    { path: '/organizer/settlements', icon: ClipboardList, label: 'Quyết toán sự kiện' },

    { path: '/organizer/staff', icon: Users, label: 'Quản lý nhân viên' },
    { path: '/organizer/participants', icon: Users, label: 'Danh sách tham gia' },
    { path: '/organizer/products', icon: Package, label: 'Quản lý sản phẩm' },
    { path: '/organizer/blog', icon: FileText, label: 'Blog' },
    { path: '/organizer/reports', icon: BarChart3, label: 'Thống kê & Báo cáo' },
  ];

  return (
    <div className="h-screen bg-white dark:bg-[#0a0a0c] text-gray-900 dark:text-white flex overflow-hidden transition-colors duration-300">
      <ScrollToTop />
      
      {/* Backdrop for mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[48] lg:hidden transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`${
          isSidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0 w-64 lg:w-20'
        } bg-gray-50 dark:bg-[#111114] border-r border-gray-200 dark:border-white/5 transition-all duration-300 flex flex-col z-[50] fixed h-full lg:sticky lg:top-0 lg:h-screen`}
      >
        <div className="px-6 py-3 flex items-center justify-between">
          <div className={`flex items-center space-x-3 ${!isSidebarOpen && 'hidden'}`}>
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <UserCircle className="w-5 h-5 text-white" />
            </div>
            <span className="font-black text-xl tracking-tight text-gray-900 dark:text-white uppercase">Organizer</span>
          </div>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        <nav className="flex-1 mt-4 px-3 space-y-1 overflow-y-auto no-scrollbar">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-2.5 rounded-xl transition-all group ${
                  isActive 
                    ? 'bg-blue-600 text-white font-bold shadow-[0_0_15px_rgba(37,99,235,0.3)]' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-white' : 'group-hover:text-blue-600 text-gray-600 dark:text-gray-400'}`} />
                {isSidebarOpen && <span className="text-[13px] font-medium tracking-tight">{item.label}</span>}
                {isSidebarOpen && isActive && <ChevronRight className="ml-auto w-3.5 h-3.5" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-gray-200 dark:border-white/5">
          <button 
            onClick={handleLogout}
            className="flex items-center space-x-3 px-4 py-2.5 w-full rounded-xl text-red-500 hover:bg-red-500/10 transition-all font-bold"
          >
            <LogOut className="w-4.5 h-4.5" />
            {isSidebarOpen && <span className="text-[13px] font-medium">Đăng xuất</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white/80 dark:bg-[#111114]/50 backdrop-blur-md border-b border-gray-200 dark:border-white/5 px-4 md:px-8 flex items-center justify-between sticky top-0 z-[45]">
          <div className="flex items-center gap-3 md:gap-4 flex-1">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className={`p-2 bg-gray-100 dark:bg-white/5 rounded-xl text-gray-500 hover:text-blue-600 transition-all border border-gray-200 dark:border-white/5 lg:hidden ${isSidebarOpen ? 'hidden' : 'block'}`}
            >
              <Menu className="w-5 h-5" />
            </button>
            
            {/* Removed Search Bar */}
          </div>

          <div className="flex items-center space-x-3">
            {/* Back to Home Button */}
            <Link 
              to="/" 
              className="flex items-center space-x-2 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 px-4 py-2 rounded-xl text-sm font-bold transition-all border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
              title="Quay về trang chủ khách hàng"
            >
              <Home className="w-4 h-4" />
              <span className="hidden md:inline">Trang chủ</span>
            </Link>

            <div className="h-6 w-px bg-gray-200 dark:bg-white/10 mx-1"></div>
            {/* Theme Toggle */}
            <button 
              onClick={() => setIsDark(!isDark)}
              className="p-2 bg-gray-100 dark:bg-white/5 rounded-full text-gray-500 dark:text-gray-400 hover:text-blue-600 transition-all border border-gray-200 dark:border-white/5"
            >
              {isDark ? <Moon className="w-5 h-5 text-gray-400" /> : <Sun className="w-5 h-5 text-yellow-500" />}
            </button>

            <button className="relative text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-[#111114]"></span>
            </button>
            <div className="flex items-center space-x-3 pl-4 border-l border-gray-200 dark:border-white/5">
              <div className="text-right flex flex-col hidden sm:flex">
                <span className="text-sm font-bold text-gray-900 dark:text-white">{user?.full_name || 'Organizer'}</span>
                <span className="text-[10px] text-blue-600 uppercase font-black tracking-tighter">Ban Tổ Chức</span>
              </div>
              <div className="w-10 h-10 bg-gray-200 dark:bg-white/10 rounded-full border border-gray-300 dark:border-white/10 flex items-center justify-center text-blue-600 font-bold overflow-hidden">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  user?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'O'
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="px-4 sm:px-6 md:px-8 lg:px-10 pt-4 sm:pt-6 md:pt-6 lg:pt-6 pb-6 md:pb-8 flex-1 overflow-y-auto text-[14px] leading-relaxed text-gray-700 dark:text-zinc-300">
          <div className="max-w-screen-2xl mx-auto w-full">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};

export default OrganizerLayout;

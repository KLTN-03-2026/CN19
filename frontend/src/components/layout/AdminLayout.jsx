import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  Bell, 
  Search,
  ChevronRight,
  ShieldCheck,
  CreditCard,
  Tags,
  RotateCcw,
  ShieldAlert,
  BarChart3,
  History,
  Sun,
  Moon,
  Home
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import toast from 'react-hot-toast';

const AdminLayout = () => {
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

  const handleLogout = () => {
    logout();
    toast.success('Đã đăng xuất khỏi trang quản trị');
    navigate('/login');
  };

  const menuItems = [
    { path: '/admin/dashboard', icon: BarChart3, label: 'Dashboard' },
    { path: '/admin/users', icon: Users, label: 'Người dùng' },
    { path: '/admin/events', icon: Calendar, label: 'Sự kiện' },
    { path: '/admin/categories', icon: Tags, label: 'Danh mục sự kiện' },
    { path: '/admin/refunds', icon: RotateCcw, label: 'Yêu cầu hoàn tiền' },
    { path: '/admin/fraud', icon: ShieldAlert, label: 'Cảnh báo gian lận' },
    { path: '/admin/transactions', icon: History, label: 'Quản lý giao dịch' },
    { path: '/admin/settings', icon: Settings, label: 'Cấu hình hệ thống' },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0c] text-gray-900 dark:text-white flex transition-colors duration-300">
      {/* Sidebar */}
      <aside 
        className={`${
          isSidebarOpen ? 'w-64' : 'w-20'
        } bg-gray-50 dark:bg-[#111114] border-r border-gray-200 dark:border-white/5 transition-all duration-300 flex flex-col z-50 fixed h-full lg:sticky lg:top-0 lg:h-screen`}
      >
        <div className="p-6 flex items-center justify-between">
          <div className={`flex items-center space-x-3 ${!isSidebarOpen && 'hidden'}`}>
            <div className="w-8 h-8 bg-neon-green rounded-lg flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-black" />
            </div>
            <span className="font-black text-xl tracking-tight text-gray-900 dark:text-white uppercase">Admin</span>
          </div>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        <nav className="flex-1 mt-4 px-3 space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all group ${
                  isActive 
                    ? 'bg-neon-green text-black font-bold shadow-[0_0_15px_rgba(82,196,45,0.3)]' 
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-black' : 'group-hover:text-neon-green'}`} />
                {isSidebarOpen && <span>{item.label}</span>}
                {isSidebarOpen && isActive && <ChevronRight className="ml-auto w-4 h-4" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-white/5">
          <button 
            onClick={handleLogout}
            className="flex items-center space-x-3 px-4 py-3 w-full rounded-xl text-red-500 hover:bg-red-500/10 transition-all"
          >
            <LogOut className="w-5 h-5" />
            {isSidebarOpen && <span>Đăng xuất</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white/80 dark:bg-[#111114]/50 backdrop-blur-md border-b border-gray-200 dark:border-white/5 px-8 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center flex-1 max-w-md relative">
            <Search className="absolute left-3 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Tìm kiếm nhanh..." 
              className="w-full bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-neon-green transition-all dark:text-white text-gray-900"
            />
          </div>

          <div className="flex items-center space-x-3">
            {/* Back to Home Button */}
            <Link 
              to="/" 
              className="flex items-center space-x-2 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 px-4 py-2 rounded-xl text-sm font-bold transition-all border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:text-neon-green dark:hover:text-neon-green"
              title="Quay về trang chủ khách hàng"
            >
              <Home className="w-4 h-4" />
              <span className="hidden md:inline">Trang chủ</span>
            </Link>

            <div className="h-6 w-px bg-gray-200 dark:bg-white/10 mx-1"></div>
            {/* Theme Toggle */}
            <button 
              onClick={() => setIsDark(!isDark)}
              className="p-2 bg-gray-100 dark:bg-white/5 rounded-full text-gray-500 dark:text-gray-400 hover:text-neon-green transition-all border border-gray-200 dark:border-white/5"
            >
              {isDark ? <Moon className="w-5 h-5 text-gray-400" /> : <Sun className="w-5 h-5 text-yellow-500" />}
            </button>

            <button className="relative text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-[#111114]"></span>
            </button>
            <div className="flex items-center space-x-3 pl-4 border-l border-gray-200 dark:border-white/5">
              <div className="text-right flex flex-col hidden sm:flex">
                <span className="text-sm font-bold text-gray-900 dark:text-white">{user?.full_name || 'Admin'}</span>
                <span className="text-[10px] text-neon-green uppercase font-black tracking-tighter">Super Admin</span>
              </div>
              <div className="w-10 h-10 bg-gray-200 dark:bg-white/10 rounded-full border border-gray-300 dark:border-white/10 flex items-center justify-center text-neon-green font-bold overflow-hidden">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  user?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'A'
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-8 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;

import { Outlet, Navigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const CustomerLayout = () => {
  const { isAuthenticated, user, logout } = useAuthStore();

  // Protect route
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="text-xl font-bold text-indigo-600">BAS-Ticket</Link>
            <nav className="hidden sm:flex space-x-8">
              <Link to="/" className="text-gray-700 hover:text-indigo-600 font-medium">Home</Link>
              <Link to="/marketplace" className="text-gray-700 hover:text-indigo-600 font-medium">Marketplace</Link>
              <Link to="/my-tickets" className="text-gray-700 hover:text-indigo-600 font-medium">Vé của tôi</Link>
            </nav>
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-600">Xin chào, {user?.full_name || 'Khách'}</span>
              <button 
                onClick={logout} 
                className="text-sm text-red-600 hover:text-red-800 font-medium"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default CustomerLayout;

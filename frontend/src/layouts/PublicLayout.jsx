import { Outlet } from 'react-router-dom';

const PublicLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <header className="bg-white shadow relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex-shrink-0 flex items-center cursor-pointer">
              <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                BAS-Ticket
              </span>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="/" className="text-gray-700 hover:text-indigo-600 px-3 py-2 font-medium">Trang chủ</a>
              <a href="/events" className="text-gray-700 hover:text-indigo-600 px-3 py-2 font-medium">Khám phá</a>
            </nav>
            <div className="flex items-center space-x-4">
              <a href="/login" className="text-indigo-600 hover:text-indigo-900 font-medium">Đăng nhập</a>
              <a href="/register" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium shadow-md transition-all">Đăng ký</a>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        {/* Vị trí render các trang con */}
        <Outlet />
      </main>

      <footer className="bg-gray-900 text-white mt-auto">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-400">© 2026 BAS-Ticket. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;

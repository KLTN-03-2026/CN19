import { createBrowserRouter, RouterProvider, Outlet, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Pages
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';

// Layout tạm (sẽ hoàn thiện sau ở bước tạo Layout chính)
const RootLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between">
          <h1 className="text-2xl font-bold text-indigo-600">BAS-Ticket</h1>
          <div className="flex gap-4">
            <a href="/login" className="text-indigo-600 font-medium">Đăng nhập</a>
            <a href="/register" className="text-gray-600 font-medium">Đăng ký</a>
          </div>
        </div>
      </header>
      <main className="flex-grow relative">
        <Outlet />
      </main>
    </div>
  );
};

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { path: '', element: <h2 className="p-8 text-center text-xl">🏠 Trang chủ (Chưa có nội dung)</h2> },
      { path: 'login', element: <Login /> },
      { path: 'register', element: <Register /> },
      { path: '*', element: <Navigate to="/" replace /> }
    ]
  }
]);

function App() {
  return (
    <>
      <Toaster position="top-right" />
      <RouterProvider router={router} />
    </>
  );
}

export default App;

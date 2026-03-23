import { createBrowserRouter, RouterProvider, Outlet, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Layouts và Pages
import PublicLayout from './components/layout/PublicLayout';
import Home from './pages/Home/Home';

// Auth Pages
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';

// Organizer Pages
import RegisterOrganizer from './pages/Organizer/RegisterOrganizer';

// Admin Pages
import AdminLayout from './components/layout/AdminLayout';
import UserManagement from './pages/Admin/UserManagement';
import CategoryManagement from './pages/Admin/CategoryManagement';
import EventManagement from './pages/Admin/EventManagement';

// Component Bảo vệ Route theo Role
// @ts-ignore
import { useAuthStore } from './store/useAuthStore';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user?.role)) return <Navigate to="/" replace />;
  return children;
};

const router = createBrowserRouter([
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { path: '', element: <Home /> },
      { path: 'login', element: <Login /> },
      { path: 'register', element: <Register /> },
      { path: 'organizer-register', element: <RegisterOrganizer /> },
      { path: '*', element: <Navigate to="/" replace /> }
    ]
  },
  {
    path: '/admin',
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: 'dashboard', element: <div className="text-2xl font-black">Thống kê & Báo cáo (Coming Soon)</div> },
      { path: 'users', element: <UserManagement /> },
      { path: 'events', element: <EventManagement /> },
      { path: 'categories', element: <CategoryManagement /> },
      { path: 'refunds', element: <div className="text-2xl font-black">Yêu cầu Hoàn tiền (Coming Soon)</div> },
      { path: 'fraud', element: <div className="text-2xl font-black">Cảnh báo Gian lận (Coming Soon)</div> },
      { path: 'transactions', element: <div className="text-2xl font-black">Quản lý Giao dịch (Coming Soon)</div> },
      { path: 'settings', element: <div className="text-2xl font-black">Cấu hình Hệ thống (Coming Soon)</div> },
      { path: '', element: <Navigate to="dashboard" replace /> }
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

import { createBrowserRouter, RouterProvider, Outlet, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Layouts và Pages
import PublicLayout from './components/layout/PublicLayout';
import Home from './pages/Home/Home';
import Events from './pages/Home/Events';
import PublicEventDetail from './pages/Home/PublicEventDetail';
import OrganizerPublicProfile from './pages/Home/OrganizerPublicProfile';
import Profile from './pages/Profile/Profile';
import MyTickets from './pages/Customer/MyTickets';
import ResaleTicket from './pages/Customer/ResaleTicket';

// Support Pages
import CustomerTerms from './pages/Support/CustomerTerms';
import OrganizerTerms from './pages/Support/OrganizerTerms';
import PrivacyPolicy from './pages/Support/PrivacyPolicy';
import RefundPolicy from './pages/Support/RefundPolicy';
import FAQ from './pages/Support/FAQ';
import Blog from './pages/Support/Blog';

// Auth Pages
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import ForgotPassword from './pages/Auth/ForgotPassword';
import ResetPassword from './pages/Auth/ResetPassword';

// Organizer Pages
import OrganizerLayout from './components/layout/OrganizerLayout';
import OrganizerDashboard from './pages/Organizer/OrganizerDashboard';
import CreateEvent from './pages/Organizer/CreateEvent';
import RegisterOrganizer from './pages/Organizer/RegisterOrganizer';
import MyEvents from './pages/Organizer/MyEvents';
import EventDetail from './pages/Organizer/EventDetail';
import EditEvent from './pages/Organizer/EditEvent';
import StaffManagement from './pages/Organizer/StaffManagement';
import TicketManagement from './pages/Organizer/TicketManagement';
import MerchandiseManagement from './pages/Organizer/MerchandiseManagement';
import MerchandiseDetail from './pages/Organizer/MerchandiseDetail';

// Admin Pages
import AdminLayout from './components/layout/AdminLayout';
import Dashboard from './pages/Admin/Dashboard';
import UserManagement from './pages/Admin/UserManagement';
import CategoryManagement from './pages/Admin/CategoryManagement';
import CategoryDetail from './pages/Admin/CategoryDetail';
import EventManagement from './pages/Admin/EventManagement';
import AdminEventDetail from './pages/Admin/EventDetail';
import UserDetail from './pages/Admin/UserDetail';

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
      { path: 'events', element: <Events /> },
      { path: 'events/:id', element: <PublicEventDetail /> },
      { path: 'organizers/:id', element: <OrganizerPublicProfile /> },
      { path: 'login', element: <Login /> },
      { path: 'register', element: <Register /> },
      { path: 'forgot-password', element: <ForgotPassword /> },
      { path: 'reset-password', element: <ResetPassword /> },
      { 
        path: 'profile', 
        element: (
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        ) 
      },
      { 
        path: 'my-tickets', 
        element: (
          <ProtectedRoute>
            <MyTickets />
          </ProtectedRoute>
        ) 
      },
      { 
        path: 'my-tickets/:id/resale', 
        element: (
          <ProtectedRoute>
            <ResaleTicket />
          </ProtectedRoute>
        ) 
      },
      { path: 'organizer-register', element: <RegisterOrganizer /> },
      
      // Support Routes
      { path: 'customer-terms', element: <CustomerTerms /> },
      { path: 'organizer-terms', element: <OrganizerTerms /> },
      { path: 'privacy-policy', element: <PrivacyPolicy /> },
      { path: 'refund-policy', element: <RefundPolicy /> },
      { path: 'faq', element: <FAQ /> },
      { path: 'blog', element: <Blog /> },

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
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'users', element: <UserManagement /> },
      { path: 'users/:id', element: <UserDetail /> },
      { path: 'events', element: <EventManagement /> },
      { path: 'events/:id', element: <AdminEventDetail /> },
      { path: 'categories', element: <CategoryManagement /> },
      { path: 'categories/:id', element: <CategoryDetail /> },
      { path: 'refunds', element: <div className="text-2xl font-black">Yêu cầu Hoàn tiền (Coming Soon)</div> },
      { path: 'fraud', element: <div className="text-2xl font-black">Cảnh báo Gian lận (Coming Soon)</div> },
      { path: 'transactions', element: <div className="text-2xl font-black">Quản lý Giao dịch (Coming Soon)</div> },
      { path: 'settings', element: <div className="text-2xl font-black">Cấu hình Hệ thống (Coming Soon)</div> },
      { path: '', element: <Navigate to="dashboard" replace /> }
    ]
  },
  {
    path: '/organizer',
    element: (
      <ProtectedRoute allowedRoles={['organizer']}>
        <OrganizerLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: 'dashboard', element: <OrganizerDashboard /> },
      { path: 'my-events', element: <MyEvents /> },
      { path: 'events/:id', element: <EventDetail /> },
      { path: 'events/:id/edit', element: <EditEvent /> },
      { path: 'create-event', element: <CreateEvent /> },
      { path: 'tickets', element: <TicketManagement /> },
      { path: 'revenue', element: <div className="p-8 text-2xl font-bold">Doanh thu & Rút tiền (Coming Soon)</div> },
      { path: 'staff', element: <StaffManagement /> },
      { path: 'products', element: <MerchandiseManagement /> },
      { path: 'products/:id', element: <MerchandiseDetail /> },
      { path: 'participants', element: <div className="p-8 text-2xl font-bold">Danh sách người tham gia (Coming Soon)</div> },
      { path: 'settings', element: <div className="p-8 text-2xl font-bold">Cài đặt (Coming Soon)</div> },
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

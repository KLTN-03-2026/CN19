import { createBrowserRouter, RouterProvider, Outlet, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Layouts và Pages
import PublicLayout from './components/layout/PublicLayout';
import Home from './pages/Public/Home/Home';
import Events from './pages/Public/Events/Events';
import PublicEventDetail from './pages/Public/Events/PublicEventDetail';
import Blog from './pages/Public/Blog/Blog';
import BlogDetail from './pages/Public/Blog/BlogDetail';
import OrganizerPublicProfile from './pages/Public/Organizer/OrganizerPublicProfile';
import Profile from './pages/Customer/Profile/Profile';
import MyTickets from './pages/Customer/MyTickets';
import MyProducts from './pages/Customer/MyProducts';
import MyTransactions from './pages/Customer/MyTransactions';
import CustomerOrderDetail from './pages/Customer/CustomerOrderDetail';
import ResaleTicket from './pages/Customer/ResaleTicket';
import TicketTransfer from './pages/Customer/TicketTransfer';
import Checkout from './pages/Checkout/Checkout';
import PaymentResult from './pages/Checkout/PaymentResult';
import Marketplace from './pages/Public/Marketplace';
import MyRevenue from './pages/Customer/MyRevenue';

// Support Pages
import CustomerTerms from './pages/Support/CustomerTerms';
import OrganizerTerms from './pages/Support/OrganizerTerms';
import PrivacyPolicy from './pages/Support/PrivacyPolicy';
import RefundPolicy from './pages/Support/RefundPolicy';
import FAQ from './pages/Support/FAQ';

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
import BlogManagement from './pages/Organizer/BlogManagement';
import CreateBlog from './pages/Organizer/CreateBlog';
import ParticipantManagement from './pages/Organizer/ParticipantManagement';
import Revenue from './pages/Organizer/Revenue';
import OrderManagement from './pages/Organizer/OrderManagement';
import OrderDetail from './pages/Organizer/OrderDetail';
import OrganizerSettlement from './pages/Organizer/OrganizerSettlement';

// Admin Pages
import AdminLayout from './components/layout/AdminLayout';
import Dashboard from './pages/Admin/Dashboard';
import UserManagement from './pages/Admin/UserManagement';
import CategoryManagement from './pages/Admin/CategoryManagement';
import CategoryDetail from './pages/Admin/CategoryDetail';
import EventManagement from './pages/Admin/EventManagement';
import AdminEventDetail from './pages/Admin/EventDetail';
import UserDetail from './pages/Admin/UserDetail';
import ProductManagement from './pages/Admin/ProductManagement';
import ProductDetail from './pages/Admin/ProductDetail';
import AdminBlogManagement from './pages/Admin/BlogManagement';
import AdminCreateBlog from './pages/Admin/AdminCreateBlog';
import CouponManagement from './pages/Admin/CouponManagement';
import CreateCoupon from './pages/Admin/CreateCoupon';
import CouponDetail from './pages/Admin/CouponDetail';
import TransactionManagement from './pages/Admin/TransactionManagement';
import TransactionDetail from './pages/Admin/TransactionDetail';
import AdminSettlementManagement from './pages/Admin/AdminSettlementManagement';
import FraudAlerts from './pages/Admin/FraudAlerts';


// Component Bảo vệ Route theo Role
// @ts-ignore
import { useAuthStore } from './store/useAuthStore';

const ProtectedRoute = ({ children, allowedRoles, requiredPermission }) => {
  const { isAuthenticated, user } = useAuthStore();
  
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  
  // 1. Kiểm tra Role
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  // 2. Kiểm tra Quyền hạn (dành riêng cho Admin)
  // Nếu có permission quy định, và user có danh sách permissions (không phải super admin trống), 
  // thì phải có permission đó trong mảng mới cho qua.
  if (requiredPermission && user?.role === 'admin' && user?.permissions?.length > 0) {
    if (!user.permissions.includes(requiredPermission)) {
      return <Navigate to="/admin/dashboard" replace />;
    }
  }

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
      { path: 'marketplace', element: <Marketplace /> },
      { path: 'blog', element: <Blog /> },
      { path: 'blog/:slug', element: <BlogDetail /> },
      { path: 'organizer/:id', element: <OrganizerPublicProfile /> },
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
        path: 'my-merchandise', 
        element: (
          <ProtectedRoute>
            <MyProducts />
          </ProtectedRoute>
        ) 
      },
      { 
        path: 'my-transactions', 
        element: (
          <ProtectedRoute>
            <MyTransactions />
          </ProtectedRoute>
        ) 
      },
      { 
        path: 'my-revenue', 
        element: (
          <ProtectedRoute>
            <MyRevenue />
          </ProtectedRoute>
        ) 
      },
      { 
        path: 'my-transactions/:id', 
        element: (
          <ProtectedRoute>
            <CustomerOrderDetail />
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
      { 
        path: 'my-tickets/:id/transfer', 
        element: (
          <ProtectedRoute>
            <TicketTransfer />
          </ProtectedRoute>
        ) 
      },
      { 
        path: 'checkout/:orderId', 
        element: (
          <ProtectedRoute>
            <Checkout />
          </ProtectedRoute>
        ) 
      },
      { path: 'payment-result', element: <PaymentResult /> },
      { path: 'organizer-register', element: <RegisterOrganizer /> },
      
      // Support Routes
      { path: 'customer-terms', element: <CustomerTerms /> },
      { path: 'organizer-terms', element: <OrganizerTerms /> },
      { path: 'privacy-policy', element: <PrivacyPolicy /> },
      { path: 'refund-policy', element: <RefundPolicy /> },
      { path: 'faq', element: <FAQ /> },

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
      { path: 'dashboard', element: <ProtectedRoute requiredPermission="dashboard"><Dashboard /></ProtectedRoute> },
      { path: 'users', element: <ProtectedRoute requiredPermission="users"><UserManagement /></ProtectedRoute> },
      { path: 'admins', element: <ProtectedRoute requiredPermission="admins"><UserManagement /></ProtectedRoute> }, 
      { path: 'users/:id', element: <ProtectedRoute requiredPermission="users"><UserDetail /></ProtectedRoute> },
      { path: 'events', element: <ProtectedRoute requiredPermission="events"><EventManagement /></ProtectedRoute> },
      { path: 'events/:id', element: <ProtectedRoute requiredPermission="events"><AdminEventDetail /></ProtectedRoute> },
      { path: 'categories', element: <ProtectedRoute requiredPermission="categories"><CategoryManagement /></ProtectedRoute> },
      { path: 'categories/:id', element: <ProtectedRoute requiredPermission="categories"><CategoryDetail /></ProtectedRoute> },
      { path: 'products', element: <ProtectedRoute requiredPermission="merchandise"><ProductManagement /></ProtectedRoute> },
      { path: 'products/:id', element: <ProtectedRoute requiredPermission="merchandise"><ProductDetail /></ProtectedRoute> },
      { path: 'blog', element: <ProtectedRoute requiredPermission="blogs"><AdminBlogManagement /></ProtectedRoute> },
      { path: 'blog/create', element: <ProtectedRoute requiredPermission="blogs"><AdminCreateBlog /></ProtectedRoute> },
      { path: 'coupons', element: <ProtectedRoute requiredPermission="coupons"><CouponManagement /></ProtectedRoute> },
      { path: 'coupons/create', element: <ProtectedRoute requiredPermission="coupons"><CreateCoupon /></ProtectedRoute> },
      { path: 'coupons/edit/:id', element: <ProtectedRoute requiredPermission="coupons"><CreateCoupon /></ProtectedRoute> },
      { path: 'coupons/:id', element: <ProtectedRoute requiredPermission="coupons"><CouponDetail /></ProtectedRoute> },
      { path: 'refunds', element: <ProtectedRoute requiredPermission="refunds"><div className="text-2xl font-black">Yêu cầu Hoàn tiền (Coming Soon)</div></ProtectedRoute> },
      { path: 'fraud', element: <ProtectedRoute requiredPermission="fraud"><FraudAlerts /></ProtectedRoute> },
      { path: 'transactions', element: <ProtectedRoute requiredPermission="transactions"><TransactionManagement /></ProtectedRoute> },
      { path: 'transactions/:type/:id', element: <ProtectedRoute requiredPermission="transactions"><TransactionDetail /></ProtectedRoute> },
      { path: 'settlements', element: <ProtectedRoute requiredPermission="settlements"><AdminSettlementManagement /></ProtectedRoute> },
      { path: 'settings', element: <ProtectedRoute requiredPermission="system"><div className="text-2xl font-black">Cấu hình Hệ thống (Coming Soon)</div></ProtectedRoute> },
      { path: 'support', element: <ProtectedRoute requiredPermission="support"><div className="text-2xl font-black">Hỗ trợ & Khiếu nại (Coming Soon)</div></ProtectedRoute> },
      { path: 'reports', element: <ProtectedRoute requiredPermission="dashboard"><div className="text-2xl font-black">Thống kê & Báo cáo (Coming Soon)</div></ProtectedRoute> },
      { path: '', element: <Navigate to="dashboard" replace /> }
    ]
  },
  {
    path: '/organizer',
    element: (
      <ProtectedRoute allowedRoles={['organizer', 'admin']}>
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
      { path: 'settlements', element: <OrganizerSettlement /> },
      { path: 'revenue', element: <Revenue /> },
      { path: 'orders', element: <OrderManagement /> },
      { path: 'orders/:id', element: <OrderDetail /> },
      { path: 'staff', element: <StaffManagement /> },
      { path: 'products', element: <MerchandiseManagement /> },
      { path: 'products/:id', element: <MerchandiseDetail /> },
      { path: 'participants', element: <ParticipantManagement /> },
      { path: 'events/:id/participants', element: <ParticipantManagement /> },
      { path: 'blog', element: <BlogManagement /> },
      { path: 'blog/create', element: <CreateBlog /> },
      { path: 'blog/:id/edit', element: <CreateBlog /> },
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

import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Layouts
import PublicLayout from './layouts/PublicLayout';
import CustomerLayout from './layouts/CustomerLayout';
import Login from './features/auth/pages/Login';
import Register from './features/auth/pages/Register';
import Home from './features/public/pages/Home';
import EventDetail from './features/public/pages/EventDetail';
import Checkout from './features/customer/pages/Checkout';
import MyTickets from './features/customer/pages/MyTickets';
import Marketplace from './features/customer/pages/Marketplace';

const router = createBrowserRouter([
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { path: '', element: <Home /> },
      { path: 'login', element: <Login /> },
      { path: 'register', element: <Register /> },
      { path: 'events', element: <Home /> },
      { path: 'events/:id', element: <EventDetail /> },
    ]
  },
  {
    path: '/',
    element: <CustomerLayout />,
    children: [
      { path: 'my-tickets', element: <MyTickets /> },
      { path: 'marketplace', element: <Marketplace /> },
      { path: 'checkout', element: <div className="p-8 text-center text-2xl font-bold mt-10">💳 Trang Thanh toán Web3</div> }
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

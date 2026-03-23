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

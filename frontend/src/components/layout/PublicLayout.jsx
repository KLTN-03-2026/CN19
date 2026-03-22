import { Outlet, Link } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { useAuthStore } from '../../../store/useAuthStore';

const PublicLayout = () => {
  const { isAuthenticated } = useAuthStore();

  return (
    <div className="min-h-screen bg-dark-bg bg-grid-pattern flex flex-col font-sans">
      <header className="border-b border-dark-border sticky top-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-md">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            
            {/* Logo */}
            <Link to="/" className="flex-shrink-0 flex items-center space-x-2">
              <Shield className="w-8 h-8 text-neon-green" />
              <span className="text-2xl font-extrabold text-white tracking-tight">
                BlockTix
              </span>
            </Link>

            {/* Navigation (Desktop) */}
            <nav className="hidden md:flex space-x-10">
              <Link to="/events" className="text-gray-300 hover:text-white transition-colors font-medium">Events</Link>
              <Link to="/my-tickets" className="text-gray-300 hover:text-white transition-colors font-medium">My Tickets</Link>
              <Link to="/marketplace" className="text-gray-300 hover:text-white transition-colors font-medium">Marketplace</Link>
              <Link to="/organizer" className="text-gray-300 hover:text-white transition-colors font-medium">For Organizers</Link>
              <Link to="/verify" className="text-gray-300 hover:text-white transition-colors font-medium">Verify Ticket</Link>
            </nav>

            {/* Auth Buttons */}
            <div className="flex items-center space-x-6">
              {!isAuthenticated ? (
                <>
                  <Link to="/login" className="text-gray-300 hover:text-white font-medium transition-colors">
                    Login
                  </Link>
                  <Link to="/register" className="bg-neon-green hover:bg-neon-hover text-black px-6 py-2.5 rounded-full font-bold transition-all shadow-[0_0_15px_rgba(82,196,45,0.4)]">
                    Sign Up
                  </Link>
                </>
              ) : (
                <Link to="/profile" className="bg-dark-card border border-dark-border hover:border-gray-600 text-white px-5 py-2.5 rounded-full font-medium transition-all">
                  Hồ sơ Web3
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        <Outlet />
      </main>

      <footer className="border-t border-dark-border bg-dark-bg py-12 mt-20">
        <div className="max-w-[1400px] mx-auto px-4 text-center">
          <Shield className="w-8 h-8 text-dark-border mx-auto mb-4" />
          <p className="text-gray-500">© 2026 BlockTix. The Next Generation Ticketing Platform.</p>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;

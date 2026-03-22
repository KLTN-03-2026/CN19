import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Zap, Users, CodeCode, CheckCircle2 } from 'lucide-react';

const Home = () => {
  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
      
      {/* Hero Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        
        {/* Left: Text Content */}
        <div>
          <div className="inline-flex items-center space-x-2 bg-[#142910] border border-[#2d5f22] rounded-full px-4 py-1.5 mb-8">
            <Shield className="w-4 h-4 text-neon-green" />
            <span className="text-sm text-neon-green font-medium tracking-wide">Powered by Blockchain</span>
          </div>
          
          <h1 className="text-6xl md:text-7xl font-extrabold text-white leading-[1.1] mb-6">
            The complete <br />
            platform to <span className="text-neon-green">secure</span> <br />
            <span className="text-neon-green">event tickets</span>
          </h1>
          
          <p className="text-xl text-gray-400 mb-10 leading-relaxed max-w-lg">
            Stop fraud and counterfeiting with blockchain-powered NFT tickets. Secure, transparent, and verifiable ticketing for the modern world.
          </p>
          
          <div className="flex flex-wrap gap-4">
            <Link to="/events" className="bg-neon-green hover:bg-neon-hover text-black px-8 py-3.5 rounded-xl font-bold text-lg transition-all shadow-[0_0_20px_rgba(82,196,45,0.4)]">
              Explore Events
            </Link>
            <Link to="/create-event" className="bg-transparent border border-gray-600 hover:border-gray-400 hover:bg-white/5 text-white px-8 py-3.5 rounded-xl font-bold text-lg transition-all">
              Create Event
            </Link>
          </div>
        </div>

        {/* Right: Feature Cards Pattern from Image */}
        <div className="relative">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
            
            {/* Card 1 (Glowing) */}
            <div className="bg-dark-card rounded-2xl p-8 glow-card-green relative overflow-hidden transform translate-y-4">
              <div className="w-12 h-12 bg-[#142910] rounded-xl flex items-center justify-center mb-6">
                <Shield className="w-6 h-6 text-neon-green" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Anti-Fraud Protection</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Every ticket is a unique NFT on the blockchain, making counterfeiting impossible.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-dark-card border border-dark-border rounded-2xl p-8 hover:border-gray-700 transition-colors transform -translate-y-4">
              <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center mb-6">
                <Zap className="w-6 h-6 text-neon-green" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Instant Verification</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Verify ticket authenticity instantly at event entrances with QR codes.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-dark-card border border-dark-border rounded-2xl p-8 hover:border-gray-700 transition-colors transform translate-y-4">
              <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center mb-6">
                <Users className="w-6 h-6 text-neon-green" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Secure Marketplace</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Buy and sell tickets safely with transparent pricing and ownership history.
              </p>
            </div>

             {/* Card 4 */}
             <div className="bg-dark-card border border-dark-border rounded-2xl p-8 hover:border-gray-700 transition-colors transform -translate-y-4">
              <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center mb-6">
                <CheckCircle2 className="w-6 h-6 text-neon-green" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Smart Contracts</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Automated ticket management with programmable rules and royalties.
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;

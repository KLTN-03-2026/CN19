import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Zap, Users, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const GlowCard = ({ children, className = "" }) => {
  const divRef = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setOpacity(1)}
      onMouseLeave={() => setOpacity(0)}
      className={`relative overflow-hidden rounded-2xl bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border hover:border-neon-green/50 dark:hover:border-neon-green/70 hover:shadow-[0_0_30px_rgba(82,196,45,0.15)] transition-all duration-300 ${className}`}
    >
      {/* Vùng phát sáng tâm chuột mềm mại hơn (Soft Glow) - Tăng độ sáng để Light mode thấy rõ */}
      <div
        className="pointer-events-none absolute -inset-px transition-opacity duration-700 ease-out opacity-80 dark:opacity-100"
        style={{
          opacity,
          background: `radial-gradient(800px circle at ${position.x}px ${position.y}px, rgba(82, 196, 45, 0.12), transparent 60%)`,
        }}
      />
      {/* Nội dung bên trong Card đính lên trên lớp sáng */}
      <div className="relative z-10 p-8 h-full">
        {children}
      </div>
    </div>
  );
};

const Home = () => {
  const { t } = useTranslation();

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
      
      {/* Hero Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        
        {/* Left: Text Content */}
        <div>
          <div className="inline-flex items-center space-x-2 bg-green-50 dark:bg-[#142910] border border-green-200 dark:border-[#2d5f22] rounded-full px-4 py-1.5 mb-8 transition-colors">
            <Shield className="w-4 h-4 text-neon-green" />
            <span className="text-sm text-green-700 dark:text-neon-green font-medium tracking-wide">{t('home.badge')}</span>
          </div>
          
          <h1 className="text-6xl md:text-7xl font-extrabold text-gray-900 dark:text-white leading-[1.1] mb-6 transition-colors">
            {t('home.title1')} <br />
            {t('home.title2')} <span className="text-neon-green">{t('home.title_green1')}</span> <br />
            <span className="text-neon-green">{t('home.title_green2')}</span>
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-10 leading-relaxed max-w-lg transition-colors">
            {t('home.desc')}
          </p>
          
          <div className="flex flex-wrap gap-4">
            <Link to="/events" className="bg-neon-green hover:bg-neon-hover text-black px-8 py-3.5 rounded-xl font-bold text-lg transition-all shadow-[0_0_20px_rgba(82,196,45,0.4)]">
              {t('home.btn_explore')}
            </Link>
            <Link to="/create-event" className="bg-transparent border border-gray-300 dark:border-gray-600 hover:border-gray-900 dark:hover:border-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 text-gray-800 dark:text-white px-8 py-3.5 rounded-xl font-bold text-lg transition-all">
              {t('home.btn_create')}
            </Link>
          </div>
        </div>

        {/* Right: Feature Cards Pattern from Image with Hover Tracking */}
        <div className="relative">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10 w-full max-w-lg lg:max-w-none mx-auto">
            
            {/* Card 1 */}
            <GlowCard className="transform lg:translate-y-4">
              <div className="w-12 h-12 bg-green-50 dark:bg-[#142910] rounded-xl flex items-center justify-center mb-6">
                <Shield className="w-6 h-6 text-neon-green" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{t('home.f1_title')}</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                {t('home.f1_desc')}
              </p>
            </GlowCard>

            {/* Card 2 */}
            <GlowCard className="transform lg:-translate-y-4">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800/50 rounded-xl flex items-center justify-center mb-6">
                <Zap className="w-6 h-6 text-neon-green" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{t('home.f2_title')}</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                 {t('home.f2_desc')}
              </p>
            </GlowCard>

            {/* Card 3 */}
            <GlowCard className="transform lg:translate-y-4">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800/50 rounded-xl flex items-center justify-center mb-6">
                <Users className="w-6 h-6 text-neon-green" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{t('home.f3_title')}</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                 {t('home.f3_desc')}
              </p>
            </GlowCard>

             {/* Card 4 */}
             <GlowCard className="transform lg:-translate-y-4">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800/50 rounded-xl flex items-center justify-center mb-6">
                <CheckCircle2 className="w-6 h-6 text-neon-green" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{t('home.f4_title')}</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                 {t('home.f4_desc')}
              </p>
            </GlowCard>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;

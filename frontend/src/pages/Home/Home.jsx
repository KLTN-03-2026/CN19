import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Shield, Zap, Users, CheckCircle2, ArrowRight, TrendingUp, Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import eventService from '../../services/event.service';
import EventCard from '../../components/Home/EventCard';
import CategoryBar from '../../components/Home/CategoryBar';

const GlowCard = ({ children, className = "" }) => {
  const [position, setPosition] = React.useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = React.useState(0);
  const divRef = React.useRef(null);

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
      className={`relative overflow-hidden rounded-[2.5rem] bg-white dark:bg-[#111114] border border-gray-100 dark:border-white/5 hover:border-neon-green/50 transition-all duration-300 ${className}`}
    >
      <div
        className="pointer-events-none absolute -inset-px transition-opacity duration-700 ease-out"
        style={{
          opacity,
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(82, 196, 45, 0.1), transparent 40%)`,
        }}
      />
      <div className="relative z-10 p-8">
        {children}
      </div>
    </div>
  );
};

const Home = () => {
  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchKeyword, setSearchKeyword] = useState('');

  // Fetch Events
  const { data: eventsData, isLoading } = useQuery({
    queryKey: ['events', activeCategory],
    queryFn: () => eventService.getEvents({ 
        category_id: activeCategory === 'all' ? undefined : activeCategory 
    })
  });

  const events = eventsData?.data || [];

  return (
    <div className="bg-white dark:bg-dark-bg transition-colors duration-500 font-sans selection:bg-neon-green/30">
      
      {/* 🚀 Hero Section - High Impact */}
      <section className="relative h-[85vh] min-h-[600px] flex items-center justify-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
            <img 
                src="/hero-banner.png" 
                alt="Hero Banner" 
                className="w-full h-full object-cover scale-105 animate-slow-zoom"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-white dark:to-dark-bg"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-neon-green/10 backdrop-blur-md rounded-full border border-neon-green/30 mb-8 animate-in fade-in slide-in-from-bottom-4">
                <TrendingUp className="w-4 h-4 text-neon-green" />
                <span className="text-[10px] font-black uppercase tracking-widest text-neon-green/80">
                  {t('home.hero.badge')}
                </span>
            </div>
            
            <h1 className="text-5xl md:text-8xl font-black text-white leading-[1] mb-8 uppercase italic tracking-tighter animate-in fade-in slide-in-from-bottom-6 duration-700">
                {t('home.hero.title_part1')} <span className="text-neon-green">{t('home.hero.title_highlight1')}</span> <br />
                {t('home.hero.title_part2')} <span className="underline decoration-neon-green decoration-8 underline-offset-8">{t('home.hero.title_highlight2')}</span>
            </h1>

            {/* Glassmorphism Search Bar */}
            <div className="max-w-3xl mx-auto p-2 bg-white/10 backdrop-blur-2xl rounded-[2.5rem] border border-white/20 shadow-2xl animate-in fade-in slide-in-from-bottom-10 duration-1000">
                <div className="relative flex items-center bg-white dark:bg-[#111114] rounded-[2rem] overflow-hidden p-1 border border-gray-100 dark:border-white/5">
                    <div className="pl-6 text-gray-400">
                        <Search className="w-5 h-5 text-neon-green" />
                    </div>
                    <input 
                        type="text" 
                        placeholder={t('home.hero.search_placeholder')}
                        className="w-full px-4 py-4 bg-transparent outline-none text-sm font-bold placeholder:text-gray-400 dark:text-white"
                        value={searchKeyword}
                        onChange={(e) => setSearchKeyword(e.target.value)}
                    />
                    <button className="bg-neon-green hover:bg-neon-hover text-black px-8 py-4 rounded-[1.5rem] font-black uppercase text-xs tracking-widest transition-all shadow-lg shadow-neon-green/30 flex items-center gap-2">
                        {t('home.hero.search_button')} <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
      </section>

      {/* 🎸 Category Explorer */}
      <section className="max-w-[1400px] mx-auto px-6 -mt-10 relative z-20">
        <CategoryBar 
            activeCategory={activeCategory} 
            onCategoryChange={setActiveCategory} 
        />
      </section>

      {/* 📱 Upcoming Events Grid */}
      <section className="max-w-[1400px] mx-auto px-6 py-20 min-h-[400px]">
        <div className="flex items-end justify-between mb-12">
            <div>
                <h2 className="text-4xl font-black text-gray-900 dark:text-white uppercase italic tracking-tighter">
                    {t('home.events.title')} <span className="text-neon-green">{t('home.events.title_highlight')}</span>
                </h2>
                <p className="text-sm font-bold text-gray-400 mt-2">
                  {t('home.events.subtitle')}
                </p>
            </div>
            <Link to="/events" className="hidden md:flex items-center gap-2 text-xs font-black uppercase tracking-widest text-neon-green hover:gap-4 transition-all group">
                {t('home.events.view_all')} <ArrowRight className="w-4 h-4 group-hover:translate-x-1" />
            </Link>
        </div>

        {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="aspect-[4/5] bg-gray-100 dark:bg-white/5 rounded-[2.5rem] animate-pulse"></div>
                ))}
            </div>
        ) : events.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {events.map(event => (
                    <EventCard key={event.id} event={event} />
                ))}
            </div>
        ) : (
            <div className="py-20 text-center bg-gray-50/50 dark:bg-white/5 rounded-[3rem] border border-dashed border-gray-200 dark:border-white/10">
                <div className="w-20 h-20 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Shield className="w-10 h-10 text-gray-300 dark:text-gray-700" />
                </div>
                <h3 className="text-xl font-black text-gray-400 uppercase">
                  {t('home.events.not_found')}
                </h3>
            </div>
        )}
      </section>

      {/* 💎 Why BASTICKET? */}
      <section className="max-w-[1400px] mx-auto px-6 py-20 bg-gray-50/50 dark:bg-[#0a0a0c] rounded-[4rem] border border-gray-100 dark:border-white/5 mb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div>
                <h2 className="text-5xl font-black text-gray-900 dark:text-white leading-[1.1] mb-8 uppercase italic tracking-tighter">
                    {t('home.features.title_part1')} <br />
                    <span className="text-neon-green">{t('home.features.title_highlight')}</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <GlowCard>
                        <Shield className="w-8 h-8 text-neon-green mb-4" />
                        <h4 className="text-lg font-black dark:text-white uppercase mb-2">
                          {t('home.features.secure_title')}
                        </h4>
                        <p className="text-xs font-bold text-gray-400 leading-relaxed">
                          {t('home.features.secure_desc')}
                        </p>
                    </GlowCard>
                    <GlowCard>
                        <Zap className="w-8 h-8 text-neon-green mb-4" />
                        <h4 className="text-lg font-black dark:text-white uppercase mb-2">
                          {t('home.features.instant_title')}
                        </h4>
                        <p className="text-xs font-bold text-gray-400 leading-relaxed">
                          {t('home.features.instant_desc')}
                        </p>
                    </GlowCard>
                    <GlowCard>
                        <Users className="w-8 h-8 text-neon-green mb-4" />
                        <h4 className="text-lg font-black dark:text-white uppercase mb-2">
                          {t('home.features.market_title')}
                        </h4>
                        <p className="text-xs font-bold text-gray-400 leading-relaxed">
                          {t('home.features.market_desc')}
                        </p>
                    </GlowCard>
                    <GlowCard>
                        <Calendar className="w-8 h-8 text-neon-green mb-4" />
                        <h4 className="text-lg font-black dark:text-white uppercase mb-2">
                          {t('home.features.smart_title')}
                        </h4>
                        <p className="text-xs font-bold text-gray-400 leading-relaxed">
                          {t('home.features.smart_desc')}
                        </p>
                    </GlowCard>
                </div>
            </div>
            <div className="relative">
                <img 
                    src="/feature-card.png" 
                    alt="Why BASTICKET" 
                    className="w-full rounded-[3rem] shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-700"
                />
                <div className="absolute -bottom-10 -left-10 p-8 bg-neon-green rounded-3xl shadow-xl hidden md:block">
                    <div className="flex items-center gap-4 text-black">
                        <div className="text-4xl font-black italic tracking-tighter">10K+</div>
                        <div className="text-[10px] font-black uppercase tracking-widest leading-none">
                          {t('home.features.trust_stat')}
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </section>

    </div>
  );
};

export default Home;

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Shield, Zap, Users, ArrowRight, TrendingUp, Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const nameMapToEn = {
  'Âm nhạc': 'Music', 'Hội thảo': 'Workshop', 'Sân khấu': 'Theater',
  'Ẩm thực': 'Food', 'Thể thao': 'Sports', 'Du lịch': 'Travel',
  'Từ thiện': 'Charity', 'Lễ hội': 'Festival', 'Công nghệ': 'Technology',
};
import { useQuery } from '@tanstack/react-query';
import eventService from '../../services/event.service';
import EventCard from '../../components/Home/EventCard';
import CategoryBar from '../../components/Home/CategoryBar';
import { 
  startOfToday, 
  endOfWeek, 
  lastDayOfMonth 
} from 'date-fns';

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
      className={`relative overflow-hidden rounded-[2.5rem] bg-white dark:bg-[#111114] border border-gray-200 dark:border-white/5 hover:border-neon-green/50 hover:scale-105 transition-all duration-500 cursor-pointer ${className}`}
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
  const { t, i18n } = useTranslation();
  const isEn = i18n.language.startsWith('en');
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [timeFilter, setTimeFilter] = useState('week'); // 'week' or 'month'
  
  // Ref map for category sections
  const categoryRefs = React.useRef({});
  const resultsRef = React.useRef(null);

  // 1. Fetch Categories
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => eventService.getCategories()
  });
  const dbCategories = categoriesData?.data || [];

  // 2. Fetch Recommendations (Featured)
  const { data: recommendationsData, isLoading: isRecLoading } = useQuery({
    queryKey: ['recommendations'],
    queryFn: () => eventService.getRecommendations()
  });
  const recommendations = recommendationsData?.data || [];

  // 3. Fetch Time-Filtered Events
  const timeParams = React.useMemo(() => {
    const today = startOfToday();
    if (timeFilter === 'week') {
      return {
        startDate: today.toISOString(),
        endDate: endOfWeek(today, { weekStartsOn: 1 }).toISOString()
      };
    } else {
      return {
        startDate: today.toISOString(),
        endDate: lastDayOfMonth(today).toISOString()
      };
    }
  }, [timeFilter]);

  const { data: timeEventsData, isLoading: isTimeLoading } = useQuery({
    queryKey: ['events-time', timeFilter],
    queryFn: () => eventService.getEvents(timeParams)
  });
  const timeEvents = timeEventsData?.data || [];

  // 4. Fetch All Events to group by category
  const { data: allEventsData, isLoading: isAllEventsLoading } = useQuery({
    queryKey: ['all-active-events'],
    queryFn: () => eventService.getEvents({ status: 'active' })
  });
  const allEvents = allEventsData?.data || [];

  const handleCategoryChange = (catId) => {
    setActiveCategory(catId);
    
    // Smooth scroll to the specific category section
    if (catId === 'all') {
        if (resultsRef.current) {
            resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    } else {
        const targetRef = categoryRefs.current[catId];
        if (targetRef) {
            targetRef.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
        }
    }
  };

  return (
    <div className="bg-white dark:bg-dark-bg transition-colors duration-500 font-sans selection:bg-neon-green/30">
      
      {/* 🚀 Hero Section */}
      <section className="relative h-[85vh] min-h-[600px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
            <img 
                src="/hero-banner.png" 
                alt="Hero Banner" 
                className="w-full h-full object-cover scale-105 animate-slow-zoom"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-white dark:to-dark-bg"></div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-neon-green/10 backdrop-blur-md rounded-full border border-neon-green/30 mb-8 animate-in fade-in slide-in-from-bottom-4">
                <TrendingUp className="w-4 h-4 text-neon-green" />
                <span className="text-[10px] font-black uppercase tracking-widest text-neon-green/80">
                  {t('home.hero.badge')}
                </span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black text-white leading-[1] mb-10 uppercase tracking-tighter animate-in fade-in slide-in-from-bottom-6 duration-700">
                {t('home.hero.title_part1')} <span className="text-neon-green">{t('home.hero.title_highlight1')}</span> <br />
                {t('home.hero.title_part2')} <span className=" decoration-neon-green decoration-8 underline-offset-8">{t('home.hero.title_highlight2')}</span>
            </h1>

            <div className="max-w-3xl mx-auto p-2 bg-white/10 backdrop-blur-2xl rounded-[2.5rem] border border-white/20 shadow-2xl animate-in fade-in slide-in-from-bottom-10 duration-1000">
                <div className="relative flex items-center bg-white dark:bg-[#111114] rounded-[2rem] overflow-hidden p-1 border border-gray-100 dark:border-white/5">
                    <div className="pl-6 text-gray-400">
                        <Search className="w-5 h-5 text-neon-green" />
                    </div>
                    <input 
                        type="text" 
                        placeholder={t('home.hero.search_placeholder')}
                        className="w-full px-4 py-4 bg-transparent outline-none text-sm font-bold placeholder:text-gray-400 text-gray-900 dark:text-white"
                        value={searchKeyword}
                        onChange={(e) => setSearchKeyword(e.target.value)}
                    />
                    <button className="bg-neon-green hover:bg-neon-hover text-black px-8 py-4 rounded-[1.5rem] font-black uppercase text-xs tracking-widest transition-all shadow-lg shadow-neon-green/30 whitespace-nowrap">
                        {t('home.hero.search_button')} 
                    </button>
                </div>
            </div>
        </div>
      </section>

      {/* 🌟 Featured: Events For You */}
      <section className="relative overflow-hidden">
        {/* Abstract background for premium feel */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-neon-green/5 rounded-full blur-[120px] -z-4"></div>
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-neon-green/10 rounded-full blur-[100px] -z-4"></div>
        
        <div className="max-w-[1400px] mx-auto px-6">
            <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-xl md:text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">
                        {t('home.for_you.title')} <span className="text-neon-green">{t('home.for_you.title_highlight')}</span>
                    </h2>
                    <p className="text-[11px] text-gray-400 dark:text-white/30 tracking-[0.1em] mt-2">
                        {t('home.for_you.subtitle')}
                    </p>
                </div>
                <div className="hidden md:block h-px flex-1 bg-gray-100 dark:bg-white/5 mx-10 mb-5"></div>
            </div>

            <div className="flex gap-10 overflow-x-auto pb-8 no-scrollbar px-4 -mx-4 snap-x">
                {isRecLoading ? (
                    [...Array(4)].map((_, i) => (
                        <div key={i} className="min-w-[280px] md:min-w-[320px] h-[360px] md:h-[400px] bg-gray-100 dark:bg-white/5 rounded-[3rem] animate-pulse"></div>
                    ))
                ) : (
                    recommendations.map(event => (
                        <div key={event.id} className="snap-start shrink-0">
                            <EventCard event={event} variant="featured" />
                        </div>
                    ))
                )}
            </div>
        </div>
      </section>

      {/* 🎸 Category Explorer Icons Bar */}
      <section className="max-w-[1400px] mx-auto px-6 py-2 relative z-20">
        <div className="flex items-center justify-between mb-10">
            <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">
                {t('home.categories.title')}
            </h2>
            <div className="h-px flex-1 bg-gray-100 dark:bg-white/5 ml-10"></div>
        </div>
        <CategoryBar 
            activeCategory={activeCategory} 
            onCategoryChange={handleCategoryChange} 
            dbCategories={dbCategories}
        />
      </section>

      {/* 🕒 Time-Based Events */}
      <section className="max-w-[1400px] mx-auto px-4 py-4 bg-gray-50/50 dark:bg-white/[0.01] rounded-[5rem] my-8 border border-gray-100 dark:border-white/5">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-4 px-6">
            <div>
                <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">
                    {t('home.time_filter.title')} <span className="text-neon-green">{t('home.time_filter.title_highlight')}</span>
                </h2>
                <p className="text-[11px] text-gray-400 dark:text-white/30 tracking-[0.1em] mt-2">
                    {t('home.time_filter.subtitle')}
                </p>
            </div>
            <div className="flex bg-white dark:bg-[#0c0c0e] p-2 rounded-3xl border border-gray-200 dark:border-white/10 shadow-xl">
                <button 
                    onClick={() => setTimeFilter('week')}
                    className={`px-3 py-2 rounded-2xl text-[10px] font-black tracking-widest transition-all duration-300 ${timeFilter === 'week' ? 'bg-neon-green text-black scale-105 shadow-lg shadow-neon-green/20' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    {t('home.time_filter.this_week')}
                </button>
                <button 
                    onClick={() => setTimeFilter('month')}
                    className={`px-3 py-2 rounded-2xl text-[10px] font-black tracking-widest transition-all duration-300 ${timeFilter === 'month' ? 'bg-neon-green text-black scale-105 shadow-lg shadow-neon-green/20' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    {t('home.time_filter.this_month')}
                </button>
            </div>
        </div>
        
        {/* Changed Grid to Horizontal Scroll */}
        <div className="flex gap-10 overflow-x-auto pb-12 no-scrollbar px-4 -mx-4 snap-x">
            {isTimeLoading ? (
                [...Array(4)].map((_, i) => (
                    <div key={i} className="min-w-[280px] md:min-w-[320px] h-[390px] md:h-[480px] bg-gray-100 dark:bg-white/5 rounded-[3rem] animate-pulse"></div>
                ))
            ) : timeEvents.length > 0 ? (
                timeEvents.map(event => (
                    <div key={event.id} className="snap-start shrink-0">
                        <EventCard event={event} />
                    </div>
                ))
            ) : (
                <div className="col-span-full py-24 text-center text-gray-500 font-bold italic tracking-wider w-full">
                    {t('home.events.not_found')}
                </div>
            )}
        </div>
      </section>

      {/* 📱 Dynamic Category Sections */}
      <div ref={resultsRef} className="scroll-mt-4 space-y-4">
        {dbCategories.map(cat => {
            const categoryEvents = allEvents.filter(e => e.category_id === cat.id);
            if (categoryEvents.length === 0) return null;

            return (
                <section 
                    key={cat.id} 
                    ref={el => categoryRefs.current[cat.id] = el}
                    className="max-w-[1400px] mx-auto px-4 py-2 scroll-mt-2"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-6">
                            <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none pr-4 border-r-4 border-neon-green">
                                {isEn ? (nameMapToEn[cat.name] || cat.name) : cat.name}
                            </h2>
                            <span className="text-[10px] font-bold text-gray-400 tracking-widest pt-2">
                                {categoryEvents.length} {t('common.events')}
                            </span>
                        </div>
                        <Link 
                            to={`/events?category=${cat.id}`} 
                            className="group flex items-center gap-4 text-sm font-bold text-gray-500 hover:text-neon-green transition-all"
                        >
                            <span className="opacity-60 group-hover:opacity-100">{t('home.events.view_all')}</span>
                            <div className="w-8 h-8 rounded-full border border-gray-200 dark:border-white/10 flex items-center justify-center group-hover:border-neon-green group-hover:bg-neon-green/10 transition-all shadow-xl">
                                <ArrowRight className="w-4 h-4" />
                            </div>
                        </Link>
                    </div>

                    <div className="flex gap-10 overflow-x-auto pb-4 no-scrollbar snap-x px-4 -mx-4">
                        {categoryEvents.map(event => (
                            <div key={event.id} className="snap-start shrink-0">
                                <EventCard event={event} />
                            </div>
                        ))}
                    </div>
                </section>
            );
        })}
      </div>

      {/* 💎 Premium Features */}
      <section className="max-w-[1400px] mx-auto px-6 py-10 bg-gray-50/50 dark:bg-[#0a0a0c] rounded-[4rem] border border-gray-100 dark:border-white/5 mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div>
                <h2 className="text-5xl font-black text-gray-900 dark:text-white leading-[1.1] mb-8 uppercase italic tracking-tighter">
                    {t('home.features.title_part1')} <br />
                    <span className="text-neon-green">{t('home.features.title_highlight')}</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <GlowCard>
                        <Shield className="w-8 h-8 text-neon-green mb-4" />
                        <h4 className="text-lg font-black text-gray-900 dark:text-white uppercase mb-2">
                          {t('home.features.secure_title')}
                        </h4>
                        <p className="text-xs font-bold text-gray-600 dark:text-gray-400 leading-relaxed">
                          {t('home.features.secure_desc')}
                        </p>
                    </GlowCard>
                    <GlowCard>
                        <Zap className="w-8 h-8 text-neon-green mb-4" />
                        <h4 className="text-lg font-black text-gray-900 dark:text-white uppercase mb-2">
                          {t('home.features.instant_title')}
                        </h4>
                        <p className="text-xs font-bold text-gray-600 dark:text-gray-400 leading-relaxed">
                          {t('home.features.instant_desc')}
                        </p>
                    </GlowCard>
                    <GlowCard>
                        <Users className="w-8 h-8 text-neon-green mb-4" />
                        <h4 className="text-lg font-black text-gray-900 dark:text-white uppercase mb-2">
                          {t('home.features.market_title')}
                        </h4>
                        <p className="text-xs font-bold text-gray-600 dark:text-gray-400 leading-relaxed">
                          {t('home.features.market_desc')}
                        </p>
                    </GlowCard>
                    <GlowCard>
                        <Calendar className="w-8 h-8 text-neon-green mb-4" />
                        <h4 className="text-lg font-black text-gray-900 dark:text-white uppercase mb-2">
                          {t('home.features.smart_title')}
                        </h4>
                        <p className="text-xs font-bold text-gray-600 dark:text-gray-400 leading-relaxed">
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
                <div className="absolute -bottom-8 -left-10 p-6 bg-neon-green rounded-3xl shadow-xl hidden md:block">
                    <div className="flex items-center gap-4 text-black">
                        <div className="text-3xl font-black italic tracking-tighter">10K+</div>
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

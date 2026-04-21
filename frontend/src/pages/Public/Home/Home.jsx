import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Shield, Zap, Users, ArrowRight, TrendingUp, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useQuery } from '@tanstack/react-query';
import eventService from '../../../services/event.service';
import blogService from '../../../services/blog.service';
import EventCard from '../../../components/events/EventCard';
import CategoryBar from '../../../components/events/CategoryBar';
import { useDebounce } from '../../../hooks/useDebounce';
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
      <div className="relative z-10 p-6 md:p-8">
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
  const { data: categoriesData, isLoading: isCategoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => eventService.getCategories()
  });
  const dbCategories = categoriesData?.data || [];

  // 1.2 Fetch Blogs for footer section
  const { data: blogsData, isLoading: isBlogsLoading } = useQuery({
    queryKey: ['public-blogs-home'],
    queryFn: () => blogService.getPublicBlogs({ limit: 3, type: 'all' })
  });
  const blogs = blogsData?.data || [];

  // 1.5. Live Search Logic
  const debouncedSearch = useDebounce(searchKeyword, 500);
  const isSearching = debouncedSearch.length >= 2;

  const { data: searchResultsData, isLoading: isSearchLoading } = useQuery({
    queryKey: ['events-search', debouncedSearch],
    queryFn: () => eventService.getEvents({ keyword: debouncedSearch, status: 'active' }),
    enabled: isSearching
  });
  const searchResults = searchResultsData?.data || [];

  // 2. Fetch Featured Events
  const { data: featuredEventsData, isLoading: isFeaturedLoading } = useQuery({
    queryKey: ['featured-events'],
    queryFn: () => eventService.getEvents({ is_featured: true, status: 'active' })
  });
  const featuredEvents = featuredEventsData?.data || [];

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
    <div className="bg-white  dark:bg-dark-bg transition-colors duration-500 font-sans selection:bg-neon-green/30">
      
      {/* 🚀 Hero Section */}
      <section className="relative h-[50vh] min-h-[520px] flex items-center justify-center overflow-hidden">
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
                <span className="text-[9px] md:text-xs font-black uppercase tracking-tight text-neon-green/80">
                  {t('home.hero.badge')}
                </span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-extrabold text-white leading-[1.1] mb-10 uppercase tracking-tight animate-in fade-in slide-in-from-bottom-6 duration-700">
                {t('home.hero.title_part1')} <span className="text-neon-green">{t('home.hero.title_highlight1')}</span> <br className="hidden md:block" />
                {t('home.hero.title_part2')} <span className=" decoration-neon-green decoration-4 md:decoration-8 underline-offset-8">{t('home.hero.title_highlight2')}</span>
            </h1>

            <div className="max-w-2xl mx-auto p-1 bg-white/10 backdrop-blur-2xl rounded-[2.5rem] border border-white/20 shadow-2xl animate-in fade-in slide-in-from-bottom-10 duration-1000">
                <div className="relative flex items-center bg-white dark:bg-[#111114] rounded-[2rem] overflow-hidden p-1 border border-gray-100 dark:border-white/5">
                    <div className="pl-6 text-gray-400">
                        <Search className="w-5 h-5 text-neon-green" />
                    </div>
                    <input 
                        type="text" 
                        placeholder={t('home.hero.search_placeholder')}
                        className="w-full px-4 md:px-6 py-3 md:py-4 bg-transparent outline-none text-sm md:text-base font-semibold placeholder:text-gray-400 text-gray-900 dark:text-white"
                        value={searchKeyword}
                        onChange={(e) => setSearchKeyword(e.target.value)}
                    />
                    <button className="bg-neon-green hover:bg-neon-hover text-black px-4 md:px-8 py-2 md:py-4 rounded-[1.5rem] font-black uppercase text-[10px] md:text-sm tracking-tight transition-all shadow-lg shadow-neon-green/30 whitespace-nowrap">
                        {t('home.hero.search_button')} 
                    </button>
                </div>
            </div>
        </div>
      </section>

      {/* 🔍 Search Results View (Floating/Integrated Section) */}
      {isSearching && (
        <section className="relative z-20 max-w-[1450px] mx-auto px-4 sm:px-6 md:px-8 pt-6 mb-3 bg-neon-green/[0.03] backdrop-blur-3xl rounded-[4rem] border border-neon-green/10 animate-in fade-in slide-in-from-top-10 duration-700">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-sm md:text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
                        {t('home.search.results_for')} <span className="text-neon-green">"{debouncedSearch}"</span>
                    </h2>
                    <p className="text-[10px] md:text-sm text-gray-500 dark:text-white/40 mt-2 font-medium">
                        {isSearchLoading ? t('common.loading') : `${searchResults.length} ${t('home.search.results_found')}`}
                    </p>
                </div>
            </div>

            {isSearchLoading ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-8">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="aspect-[4/5] bg-gray-100 dark:bg-white/5 rounded-2xl md:rounded-[2.5rem] animate-pulse"></div>
                    ))}
                </div>
            ) : searchResults.length > 0 ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-8">
                    {searchResults.map(event => (
                        <div key={event.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <EventCard event={event} />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="py-20 text-center">
                    <div className="w-20 h-20 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Search className="w-8 h-8 text-gray-300" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 uppercase">
                        {t('home.search.no_results_title')}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium max-w-md mx-auto">
                        {t('home.search.no_results_desc')}
                    </p>
                </div>
            )}
            
            {/* Elegant Separator */}
            <div className="mt-16 h-px w-full bg-gradient-to-r from-transparent via-neon-green/20 to-transparent"></div>
        </section>
      )}

      {/* 🌟 Featured: Events For You */}
      <section className="relative overflow-hidden">
          {/* Abstract background for premium feel */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-neon-green/5 rounded-full blur-[120px] -z-4"></div>
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-neon-green/10 rounded-full blur-[100px] -z-4"></div>
          
          <div className="max-w-[1450px] mx-auto px-4 sm:px-6 md:px-8">
              <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <div>
                      <h2 className="text-sm md:text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
                          {t('home.for_you.title')} <span className="text-neon-green">{t('home.for_you.title_highlight')}</span>
                      </h2>
                      <p className="text-[10px] md:text-sm text-gray-500 dark:text-white/40 mt-1 font-medium">
                          {t('home.for_you.subtitle')}
                      </p>
                  </div>
                  <div className="hidden md:block h-px flex-1 bg-gray-100 dark:bg-white/5 mx-10 mb-5"></div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-8">
                  {isFeaturedLoading ? (
                      [...Array(5)].map((_, i) => (
                          <div key={i} className="aspect-[4/5] bg-gray-100 dark:bg-white/5 rounded-2xl md:rounded-[3rem] animate-pulse"></div>
                      ))
                  ) : (
                      featuredEvents.map(event => (
                          <div key={event.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                              <EventCard event={event} variant="featured" />
                          </div>
                      ))
                  )}
              </div>
          </div>
      </section>

      {/* 🎸 Category Explorer Icons Bar */}
      <section className="max-w-[1450px] mx-auto px-4 sm:px-6 md:px-8 py-2 relative z-20 mt-8">
          <div className="flex items-center justify-between mb-8">
              <h2 className="text-sm md:text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
                  {t('home.categories.title')}
              </h2>
              <div className="h-px flex-1 bg-gray-100 dark:bg-white/5 ml-10"></div>
          </div>
          <CategoryBar 
              activeCategory={activeCategory} 
              onCategoryChange={handleCategoryChange} 
          />
      </section>

      {/* 🕒 Time-Based Events */}
      <section className="max-w-[1500px] mx-auto px-4 sm:px-6 md:px-8 py-4  rounded-[5rem] my-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8 px-6">
              <div>
                  <h2 className="text-sm md:text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
                      {t('home.time_filter.title')} <span className="text-neon-green">{t('home.time_filter.title_highlight')}</span>
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-white/40 tracking-tight mt-1 font-medium">
                      {t('home.time_filter.subtitle')}
                  </p>
              </div>
              <div className="flex bg-white dark:bg-[#0c0c0e] p-1.5 rounded-[1.25rem] border border-gray-200 dark:border-white/10 shadow-lg">
                  <button 
                      onClick={() => setTimeFilter('week')}
                      className={`px-6 py-2 rounded-xl text-xs font-bold tracking-tight transition-all duration-300 ${timeFilter === 'week' ? 'bg-neon-green text-black shadow-md shadow-neon-green/20' : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'}`}
                  >
                      {t('home.time_filter.this_week')}
                  </button>
                  <button 
                      onClick={() => setTimeFilter('month')}
                      className={`px-6 py-2 rounded-xl text-xs font-bold tracking-tight transition-all duration-300 ${timeFilter === 'month' ? 'bg-neon-green text-black shadow-md shadow-neon-green/20' : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'}`}
                  >
                      {t('home.time_filter.this_month')}
                  </button>
              </div>
          </div>
          
          {/* Changed Grid to Horizontal Scroll */}
          <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-8 px-6">
              {isTimeLoading ? (
                  [...Array(5)].map((_, i) => (
                      <div key={i} className="aspect-[4/5] bg-gray-100 dark:bg-white/5 rounded-2xl md:rounded-[3rem] animate-pulse"></div>
                  ))
              ) : timeEvents.length > 0 ? (
                  timeEvents.map(event => (
                      <div key={event.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
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
          {isAllEventsLoading || isCategoriesLoading ? (
              [...Array(3)].map((_, i) => (
                  <section key={i} className="max-w-[1450px] mx-auto px-4 sm:px-6 md:px-8 py-2">
                      <div className="flex items-center justify-between mb-6">
                          <div className="w-48 h-8 bg-gray-100 dark:bg-white/5 rounded-xl animate-pulse"></div>
                      </div>
                      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-8">
                          {[...Array(5)].map((_, j) => (
                              <div key={j} className="aspect-[4/5] bg-gray-100 dark:bg-white/5 rounded-2xl md:rounded-[3rem] animate-pulse"></div>
                          ))}
                      </div>
                  </section>
              ))
          ) : dbCategories.map(cat => {
              const categoryEvents = allEvents.filter(e => e.category_id === cat.id);
              if (categoryEvents.length === 0) return null;

              return (
                  <section 
                      key={cat.id} 
                      ref={el => categoryRefs.current[cat.id] = el}
                      className="max-w-[1450px] mx-auto px-4 sm:px-6 md:px-8 py-2 scroll-mt-2"
                  >
                      <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-6">
                              <h2 className="text-sm md:text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight leading-none pr-4 border-r-4 border-neon-green">
                                  {cat.name}
                              </h2>
                              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-tight pt-1">
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

                      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-8">
                          {categoryEvents.map(event => (
                              <div key={event.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                  <EventCard event={event} />
                              </div>
                          ))}
                      </div>
                  </section>
              );
          })}
      </div>

      {/* 📰 BASTICKET News (Blog) Section */}
      <section className="max-w-[1450px] mx-auto px-4 sm:px-6 md:px-8 py-4 md:py-4 dark:border-white/5">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
              <div className="animate-in fade-in slide-in-from-left-4 duration-700">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-neon-green/10 rounded-full mb-2">
                      <span className="text-[8px] md:text-[10px] font-black text-neon-green uppercase tracking-wider">{t('home.blogs.system_news')}</span>
                  </div>
                  <h2 className="text-sm md:text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight leading-none">
                      {t('home.blogs.title')}
                  </h2>
                  <p className="text-[10px] md:text-sm text-gray-500 dark:text-white/40 mt-2 font-medium max-w-xl">
                      {t('home.blogs.subtitle')}
                  </p>
              </div>
              <Link 
                  to="/blog" 
                  className="group flex items-center gap-4 text-xs md:text-sm font-bold text-gray-400 hover:text-neon-green transition-all pb-1 border-b border-transparent hover:border-neon-green/30"
              >
                  {t('home.blogs.view_all')} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-10">
              {isBlogsLoading ? (
                  [...Array(3)].map((_, i) => (
                      <div key={i} className="aspect-video md:aspect-[4/3] bg-gray-100 dark:bg-white/5 rounded-2xl md:rounded-[2.5rem] animate-pulse"></div>
                  ))
              ) : blogs.length > 0 ? (
                  blogs.map((blog, idx) => (
                      <Link 
                          to={`/blog/${blog.slug}`} 
                          key={blog.id}
                          className="group relative flex flex-col bg-white dark:bg-[#111114] rounded-2xl md:rounded-[2.5rem] border border-gray-100 dark:border-white/5 hover:border-neon-green/30 transition-all duration-500 overflow-hidden hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(82,196,45,0.1)]"
                      >
                          {/* Blog Image */}
                          <div className="relative aspect-[16/9] md:aspect-[16/10] overflow-hidden">
                              <img 
                                  src={blog.image_url} 
                                  alt={blog.title} 
                                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-[#111114] via-transparent to-transparent opacity-60"></div>
                              <div className="absolute top-3 left-3 md:top-4 md:left-4 px-2 md:px-3 py-0.5 md:py-1 bg-black/60 backdrop-blur-md rounded-full border border-white/10">
                                  <span className="text-[8px] md:text-[10px] font-bold text-white uppercase tracking-tight">
                                      {blog.type === 'SYSTEM_NEWS' ? t('home.blogs.system_news') : t('home.blogs.organizer_news')}
                                  </span>
                              </div>
                          </div>

                          {/* Blog Content */}
                          <div className="p-3 md:p-6 flex flex-col flex-1">
                              <span className="text-[8px] md:text-[10px] font-bold text-gray-400 mb-2 md:mb-3 uppercase tracking-tight">
                                  {new Date(blog.created_at).toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'vi-VN', { 
                                      year: 'numeric', 
                                      month: 'long', 
                                      day: 'numeric' 
                                  })}
                              </span>
                              <h3 className="text-sm md:text-xl font-black text-gray-900 dark:text-white uppercase mb-2 md:mb-3 group-hover:text-neon-green transition-colors line-clamp-2">
                                  {blog.title}
                              </h3>
                              <p className="text-[10px] md:text-sm text-gray-500 dark:text-gray-400 font-medium line-clamp-2 md:line-clamp-3 mb-2 md:mb-4">
                                  {blog.content}
                              </p>
                              <div className="mt-auto pt-2 md:pt-4 flex items-center text-[10px] md:text-xs font-black text-neon-green uppercase tracking-tight gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                  {t('home.blogs.read_more')} <ArrowRight className="w-4 h-4" />
                              </div>
                          </div>
                      </Link>
                  ))
              ) : (
                  <div className="col-span-full py-20 text-center text-gray-500 font-bold italic">
                      No matching news found.
                  </div>
              )}
          </div>
      </section>

      {/* 💎 Premium Features */}
      <section className="max-w-[1450px] mx-auto px-4 sm:px-6 md:px-8 py-10 md:py-16 bg-gray-50/50 dark:bg-white/[0.01] rounded-[3.5rem] md:rounded-[5rem] border border-gray-100 dark:border-white/5 my-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div className="text-center lg:text-left">
                <h2 className="text-xl md:text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-10 leading-relaxed">
                    {t('home.features.title_part1')} <br className="hidden lg:block" />
                    <span className="text-neon-green">{t('home.features.title_highlight')}</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                    <GlowCard className="text-left">
                        <Shield className="w-6 h-6 md:w-8 md:h-8 text-neon-green mb-3 md:mb-4" />
                        <h4 className="text-sm md:text-base font-bold text-gray-900 dark:text-white uppercase mb-1.5 md:mb-2 text-balance">
                          {t('home.features.secure_title')}
                        </h4>
                        <p className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400 leading-relaxed">
                          {t('home.features.secure_desc')}
                        </p>
                    </GlowCard>
                    <GlowCard className="text-left">
                        <Zap className="w-6 h-6 md:w-8 md:h-8 text-neon-green mb-3 md:mb-4" />
                        <h4 className="text-sm md:text-base font-bold text-gray-900 dark:text-white uppercase mb-1.5 md:mb-2 text-balance">
                          {t('home.features.instant_title')}
                        </h4>
                        <p className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400 leading-relaxed">
                          {t('home.features.instant_desc')}
                        </p>
                    </GlowCard>
                    <GlowCard className="text-left">
                        <Users className="w-6 h-6 md:w-8 md:h-8 text-neon-green mb-3 md:mb-4" />
                        <h4 className="text-sm md:text-base font-bold text-gray-900 dark:text-white uppercase mb-1.5 md:mb-2 text-balance">
                          {t('home.features.market_title')}
                        </h4>
                        <p className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400 leading-relaxed">
                          {t('home.features.market_desc')}
                        </p>
                    </GlowCard>
                    <GlowCard className="text-left">
                        <Calendar className="w-6 h-6 md:w-8 md:h-8 text-neon-green mb-3 md:mb-4" />
                        <h4 className="text-sm md:text-base font-bold text-gray-900 dark:text-white uppercase mb-1.5 md:mb-2 text-balance">
                          {t('home.features.smart_title')}
                        </h4>
                        <p className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400 leading-relaxed">
                          {t('home.features.smart_desc')}
                        </p>
                    </GlowCard>
                </div>
            </div>
            <div className="relative mt-8 lg:mt-0 px-4 md:px-0">
                <div className="relative group">
                    <img 
                        src="/feature-card.png" 
                        alt="Why BASTICKET" 
                        className="w-full rounded-[2.5rem] md:rounded-[3rem] shadow-2xl rotate-0 lg:rotate-3 group-hover:rotate-0 transition-transform duration-700"
                    />
                    <div className="absolute -bottom-6 -left-2 md:-bottom-8 md:-left-10 p-5 md:p-6 bg-neon-green rounded-3xl shadow-xl hidden sm:block animate-bounce-subtle">
                        <div className="flex items-center gap-2 md:gap-4 text-black">
                            <div className="text-xl md:text-3xl font-black uppercase tracking-tight leading-none">10K+</div>
                            <div className="text-[8px] md:text-[9px] font-black uppercase tracking-tight leading-none">
                              {t('home.features.trust_stat')}
                            </div>
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

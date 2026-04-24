import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Search, SlidersHorizontal, LayoutGrid, List, ArrowUpDown } from 'lucide-react';
import eventService from '../../../services/event.service';
import EventCard from '../../../components/events/EventCard';
import EventsFilter from '../../../components/events/EventsFilter';

const Events = () => {
    const { t } = useTranslation();
    const [searchParams, setSearchParams] = useSearchParams();
    
    // States for filters
    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
    const [selectedCategories, setSelectedCategories] = useState(
        searchParams.get('category') ? [searchParams.get('category')] : []
    );
    const [priceRange, setPriceRange] = useState([0, 10000000]);
    const [selectedDate, setSelectedDate] = useState(null);
    const [sortBy, setSortBy] = useState('newest');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isSortOpen, setIsSortOpen] = useState(false);

    // Sync state with search params if they change (e.g. from nav or home)
    useEffect(() => {
        const cat = searchParams.get('category');
        if (cat) {
            setSelectedCategories([cat]);
        }
        const search = searchParams.get('search');
        if (search) {
            setSearchTerm(search);
        }
    }, [searchParams]);

    // Fetch Categories for Sidebar
    const { data: categoriesResult } = useQuery({
        queryKey: ['categories'],
        queryFn: () => eventService.getCategories()
    });
    const categories = Array.isArray(categoriesResult?.data) ? categoriesResult.data : [];

    // Fetch Events with Filters
    const { data: eventsResult, isLoading } = useQuery({
        queryKey: ['events-explore', selectedCategories, priceRange, selectedDate, sortBy, searchTerm],
        queryFn: () => eventService.getEvents({
            category_id: selectedCategories.length > 0 ? selectedCategories.join(',') : undefined,
            minPrice: priceRange[0],
            maxPrice: priceRange[1],
            date: selectedDate,
            sort: sortBy,
            keyword: searchTerm || undefined
        }),
        keepPreviousData: true
    });
    const events = Array.isArray(eventsResult?.data) ? eventsResult.data : [];

    // Update search term when typing
    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleCategoryToggle = (id) => {
        setSelectedCategories(prev => 
            prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
        );
    };

    const handleClearAll = () => {
        setSearchTerm('');
        setSelectedCategories([]);
        setPriceRange([0, 10000000]);
        setSelectedDate(null);
        setSearchParams({});
    };

    return (
        <div className="min-h-screen bg-white dark:bg-[#0a0a0a] transition-colors pt-4 pb-20 font-sans selection:bg-neon-green/30">
            <div className="max-w-[1450px] mx-auto px-4 sm:px-6 md:px-12">
                
                {/* 🚀 Hero Section Header */}
                <div className="mb-2 animate-in fade-in slide-in-from-bottom-4 duration-700 mt-6">
                    <div className="flex items-center gap-4 mb-2">
                        <h1 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
                            {t('explore.title')} <span className="text-neon-green">{t('explore.title_highlight')}</span>
                        </h1>
                    </div>
                    <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 font-medium max-w-3xl leading-relaxed">
                        {t('explore.subtitle')}
                    </p>
                </div>

                {/* 🛡️ Search & Tools Bar - STICKY BELOW NAVBAR */}
                {/* 🛡️ Search & Tools Bar - SCROLLS WITH PAGE */}
                <div className="flex flex-col md:flex-row gap-4 mb-6 relative z-[100] py-4 animate-in fade-in duration-700 transition-all">
                    <div className="flex-1 relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-hover:text-neon-green group-focus-within:text-neon-green transition-colors" />
                        <input 
                            type="text" 
                            placeholder={t('explore.search_placeholder')}
                            value={searchTerm}
                            onChange={handleSearchChange}
                            className="w-full pl-14 pr-4 py-4 text-xs md:text-sm bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/5 rounded-2xl outline-none hover:border-neon-green/30 focus:border-neon-green/50 text-gray-900 dark:text-white font-medium transition-all shadow-sm focus:bg-white dark:focus:bg-white/5"
                        />
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className={`flex items-center gap-2 px-6 py-4 border rounded-2xl font-bold text-xs transition-all group ${isSidebarOpen ? 'bg-neon-green/10 border-neon-green text-neon-green' : 'bg-gray-50 dark:bg-white/[0.03] border-gray-200 dark:border-white/5 text-gray-900 dark:text-white hover:border-neon-green/30'}`}
                        >
                            <SlidersHorizontal className={`w-4 h-4 transition-transform duration-500 ${isSidebarOpen ? 'rotate-180' : ''}`} />
                            <span>{t('explore.filters')}</span>
                        </button>
                        <div className="relative group min-w-[200px]">
                            <button 
                                onClick={() => setIsSortOpen(!isSortOpen)}
                                className="w-full flex items-center justify-between gap-3 px-6 py-4 bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/5 rounded-2xl font-bold text-xs text-gray-900 dark:text-white hover:border-neon-green/30 transition-all shadow-sm"
                            >
                                <span className="truncate">
                                    {sortBy === 'newest' && t('explore.sort.newest')}
                                    {sortBy === 'price-asc' && t('explore.sort.price_asc')}
                                    {sortBy === 'price-desc' && t('explore.sort.price_desc')}
                                    {sortBy === 'popular' && t('explore.sort.popular')}
                                </span>
                                <ArrowUpDown className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${isSortOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Custom Dropdown Content */}
                            {isSortOpen && (
                                <>
                                    <div 
                                        className="fixed inset-0 z-[110]" 
                                        onClick={() => setIsSortOpen(false)}
                                    />
                                    <div className="absolute top-[calc(100%+12px)] right-0 w-full z-[150] bg-white dark:bg-[#111114] border border-gray-100 dark:border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] p-1.5 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                                        {[
                                            { id: 'newest', label: t('explore.sort.newest') },
                                            { id: 'price-asc', label: t('explore.sort.price_asc') },
                                            { id: 'price-desc', label: t('explore.sort.price_desc') },
                                            { id: 'popular', label: t('explore.sort.popular') }
                                        ].map((opt) => (
                                            <button
                                                key={opt.id}
                                                onClick={() => {
                                                    setSortBy(opt.id);
                                                    setIsSortOpen(false);
                                                }}
                                                className={`w-full text-left px-4 py-3 rounded-xl text-[10px] md:text-[12px] font-bold transition-all ${sortBy === opt.id ? 'bg-neon-green text-black' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'}`}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="relative">
                    {/* Inline Filter Section (Collapsible) */}
                    <EventsFilter 
                        categories={categories}
                        selectedCategories={selectedCategories}
                        onCategoryChange={handleCategoryToggle}
                        priceRange={priceRange}
                        onPriceChange={setPriceRange}
                        selectedDate={selectedDate}
                        onDateChange={setSelectedDate}
                        onClearAll={handleClearAll}
                        isOpen={isSidebarOpen}
                        onClose={() => setIsSidebarOpen(false)}
                    />

                    {/* 📊 Event Grid Area */}
                    <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 pt-2">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-1.5 h-8 bg-neon-green rounded-full"></div>
                                <h2 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white tracking-tight leading-none">
                                    {t('explore.found', { count: events.length })}
                                </h2>
                            </div>
                        </div>

                        {isLoading ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                                {[...Array(10)].map((_, i) => (
                                    <div key={i} className="aspect-[4/5] bg-gray-100 dark:bg-white/5 rounded-[2.5rem] animate-pulse" />
                                ))}
                            </div>
                        ) : events.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                                {events.map(event => (
                                    <div key={event.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <EventCard event={event} />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-40 text-center">
                                <div className="w-20 h-20 bg-neon-green/5 rounded-[2rem] flex items-center justify-center mb-6">
                                    <Search className="w-8 h-8 text-neon-green/50" />
                                </div>
                                <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight mb-2">
                                    {t('explore.no_results')}
                                </h3>
                                <button 
                                    onClick={handleClearAll}
                                    className="text-neon-green font-bold text-xs uppercase tracking-widest hover:underline"
                                >
                                    {t('explore.clear_all')}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Events;

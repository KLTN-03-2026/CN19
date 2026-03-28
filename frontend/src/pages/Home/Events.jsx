import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Search, SlidersHorizontal, LayoutGrid, List, ArrowUpDown } from 'lucide-react';
import eventService from '../../services/event.service';
import EventCard from '../../components/Home/EventCard';
import EventsFilter from '../../components/Explore/EventsFilter';

const Events = () => {
    const { t } = useTranslation();
    const [searchParams, setSearchParams] = useSearchParams();
    
    // States for filters
    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
    const [selectedCategories, setSelectedCategories] = useState(
        searchParams.get('category') ? [parseInt(searchParams.get('category'))] : []
    );
    const [priceRange, setPriceRange] = useState([0, 10000000]);
    const [selectedDate, setSelectedDate] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [sortBy, setSortBy] = useState('newest');

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
        <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] transition-colors pt-4 pb-10">
            <div className="max-w-[1440px] mx-auto px-6">
                
                {/* 🚀 Hero Section Header */}
                <div className="mb-2 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <h1 className="text-xl md:text-xl font-black uppercase tracking-tighter text-gray-900 dark:text-white mb-2">
                        {t('explore.title')} <span className="text-neon-green">{t('explore.title_highlight')}</span>
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 font-medium max-w-xl">
                        {t('explore.subtitle')}
                    </p>
                </div>

                {/* 🛡️ Search & Tools Bar - STICKY BELOW NAVBAR */}
                <div className="flex flex-col md:flex-row gap-4 mb-6 sticky top-20 z-40 py-6 backdrop-blur-md animate-in fade-in duration-700 transition-all">
                    <div className="flex-1 relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-hover:text-neon-green group-focus-within:text-neon-green transition-colors" />
                        <input 
                            type="text" 
                            placeholder={t('explore.search_placeholder')}
                            value={searchTerm}
                            onChange={handleSearchChange}
                            className="w-full pl-12 pr-4 py-4 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl outline-none hover:border-neon-green/30 focus:border-neon-green/50 text-gray-900 dark:text-white font-bold transition-all shadow-sm hover:shadow-md focus:shadow-[0_0_20px_rgba(82,196,45,0.1)]"
                        />
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setIsSidebarOpen(true)}
                            className="lg:hidden flex items-center gap-2 px-6 py-4 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl font-black uppercase text-[10px] tracking-widest text-gray-900 dark:text-white"
                        >
                            <SlidersHorizontal className="w-4 h-4 text-neon-green" />
                            {t('explore.filters')}
                        </button>

                        <div className="hidden md:flex items-center bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-1">
                            <button className="p-3 text-neon-green bg-neon-green/10 rounded-xl">
                                <LayoutGrid className="w-5 h-5" />
                            </button>
                            <button className="p-3 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                                <List className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="relative group">
                            <select 
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="appearance-none pl-6 pr-12 py-4 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl font-black uppercase text-[10px] tracking-widest text-gray-900 dark:text-white outline-none focus:border-neon-green/50 cursor-pointer"
                            >
                                <option value="newest" className="bg-white dark:bg-[#111114] text-gray-900 dark:text-white">Mới nhất</option>
                                <option value="price-asc" className="bg-white dark:bg-[#111114] text-gray-900 dark:text-white">Giá: Thấp &rarr; Cao</option>
                                <option value="price-desc" className="bg-white dark:bg-[#111114] text-gray-900 dark:text-white">Giá: Cao &rarr; Thấp</option>
                                <option value="popular" className="bg-white dark:bg-[#111114] text-gray-900 dark:text-white">Phổ biến</option>
                            </select>
                            <ArrowUpDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>
                </div>

                <div className="flex gap-10 items-start relative px-1">
                    {/* 🎨 Sidebar Filters - STICKY */}
                    <div className="hidden lg:block sticky top-[180px] z-30 w-80 shrink-0">
                        <EventsFilter 
                            categories={categories}
                            selectedCategories={selectedCategories}
                            onCategoryChange={handleCategoryToggle}
                            priceRange={priceRange}
                            onPriceChange={setPriceRange}
                            selectedDate={selectedDate}
                            onDateChange={setSelectedDate}
                            onClearAll={handleClearAll}
                            isOpen={false}
                            onClose={() => {}}
                        />
                    </div>

                    {/* Mobile Sidebar (Fixed Overlay) */}
                    <div className="lg:hidden">
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
                    </div>

                    {/* 📊 Event Grid Area */}
                    <div className="flex-1 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-20">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-xl font-black uppercase tracking-tighter text-gray-900 dark:text-white">
                                {t('explore.found', { count: events.length })}
                            </h2>
                        </div>

                        {isLoading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                                {[1, 2, 3, 4, 5, 6].map(i => (
                                    <div key={i} className="aspect-[2/3] bg-gray-200 dark:bg-white/5 rounded-3xl animate-pulse" />
                                ))}
                            </div>
                        ) : events.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                                {events.map(event => (
                                    <EventCard key={event.id} event={event} />
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-40 text-center">
                                <div className="w-24 h-24 bg-neon-green/10 rounded-full flex items-center justify-center mb-6">
                                    <Search className="w-10 h-10 text-neon-green" />
                                </div>
                                <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-2">
                                    {t('explore.no_results')}
                                </h3>
                                <button 
                                    onClick={handleClearAll}
                                    className="text-neon-green font-black uppercase text-xs tracking-widest hover:underline"
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

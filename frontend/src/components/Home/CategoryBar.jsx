import React, { useRef, useEffect } from 'react';
import { Music, Mic2, Theater, Utensils, Trophy, Plane, Rocket, Heart, Cpu, ArrowUpRight, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import eventService from '../../services/event.service';

const iconMap = {
    'Âm nhạc': Music, 'Music': Music,
    'Hội thảo': Mic2, 'Workshop': Mic2,
    'Sân khấu': Theater, 'Theater': Theater,
    'Ẩm thực': Utensils, 'Food': Utensils,
    'Thể thao': Trophy, 'Sports': Trophy,
    'Du lịch': Plane, 'Travel': Plane,
    'Từ thiện': Heart, 'Charity': Heart,
    'Lễ hội': Rocket, 'Festival': Rocket,
    'Công nghệ': Cpu, 'Technology': Cpu,
};

// Map Vietnamese DB names → English display names
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=1000';

const CategoryBar = ({ activeCategory, onCategoryChange }) => {
    const { t, i18n } = useTranslation();
    const scrollRef = useRef(null);
    const isHovering = useRef(false);
    const isEn = i18n.language.startsWith('en');

    // 1. Fetch Categories internally
    const { data: categoriesData, isLoading } = useQuery({
        queryKey: ['categories'],
        queryFn: () => eventService.getCategories(),
        staleTime: 5 * 60 * 1000, 
    });

    const dbCategories = categoriesData?.data || [];

    const categories = dbCategories.map(cat => ({
        id: cat.id,
        name: cat.name,
        icon: iconMap[cat.name] || Rocket,
        image: cat.image_url || FALLBACK_IMAGE,
    }));

    // Dynamic display logic: Only triple if we have enough items for scrolling to look good
    const isSmallSet = categories.length > 0 && categories.length <= 4;
    const displayCategories = isSmallSet ? categories : (categories.length > 0 ? [...categories, ...categories, ...categories] : []);

    const handleViewAllInternal = (catId) => {
        if (onCategoryChange) {
            onCategoryChange(catId);
        }
    };

    // Initialize scroll position only for scrollable sets
    useEffect(() => {
        const container = scrollRef.current;
        if (container && !isSmallSet && categories.length > 0) {
            const singleWidth = container.scrollWidth / 3;
            container.scrollLeft = singleWidth;
        }
    }, [categories.length, isSmallSet]);

    // Infinite Looping only for scrollable sets
    useEffect(() => {
        const container = scrollRef.current;
        if (!container || isSmallSet || categories.length === 0) return;

        const handleInfiniteScroll = () => {
            const singleWidth = container.scrollWidth / 3;
            const scrollLeft = container.scrollLeft;
            
            if (scrollLeft >= singleWidth * 2 - 10) {
                container.scrollLeft = scrollLeft - singleWidth;
            } 
            else if (scrollLeft <= 10) {
                container.scrollLeft = scrollLeft + singleWidth;
            }
        };

        container.addEventListener('scroll', handleInfiniteScroll);
        return () => container.removeEventListener('scroll', handleInfiniteScroll);
    }, [categories.length, isSmallSet]);

    // Auto-scroll only for scrollable sets
    useEffect(() => {
        const container = scrollRef.current;
        if (!container || isSmallSet || categories.length === 0) return;

        const interval = setInterval(() => {
            if (isHovering.current) return;
            const singleWidth = container.scrollWidth / 3;
            const step = singleWidth / categories.length;
            container.scrollBy({ left: step, behavior: 'smooth' });
        }, 2000);

        return () => clearInterval(interval);
    }, [categories.length, isSmallSet]);

    if (isLoading) {
        return (
            <div className="flex gap-4 md:gap-6 overflow-x-hidden px-4 md:px-0">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="min-w-[150px] md:min-w-[180px] lg:min-w-[220px] aspect-[3.4/4] rounded-[2rem] bg-gray-100 dark:bg-white/5 animate-pulse flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-gray-300 dark:text-white/10 animate-spin" />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div
            ref={scrollRef}
            className="flex gap-4 md:gap-6 overflow-x-auto no-scrollbar px-4 md:px-0 snap-x"
            onMouseEnter={() => { isHovering.current = true; }}
            onMouseLeave={() => { isHovering.current = false; }}
        >
            {displayCategories.length > 0 && displayCategories.map((cat, idx) => {
                const isActive = activeCategory && activeCategory.toString() === cat.id.toString();

                return (
                    <div
                        key={`${cat.id}-${idx}`}
                        className={`group relative min-w-[150px] md:min-w-[180px] lg:min-w-[220px] aspect-[3.4/4] rounded-[2rem] overflow-hidden cursor-pointer border-2 transition-all duration-500 snap-start shrink-0 select-none ${
                            isActive ? 'border-neon-green shadow-2xl shadow-neon-green/20 scale-105' : 'border-white/5 hover:border-neon-green/30'
                        }`}
                        onClick={() => onCategoryChange(cat.id)}
                    >
                        {/* Background Image từ CSDL */}
                        <img
                            src={cat.image}
                            alt={cat.name}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />

                        {/* Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-80"></div>

                        {/* Content */}
                        <div className="absolute inset-0 p-4 md:p-6 flex flex-col justify-end z-10">
                            <div>
                                <h3 className="text-sm md:text-sm lg:text-lg font-bold text-white uppercase mb-2">
                                    {cat.name}
                                </h3>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleViewAllInternal(cat.id);
                                    }}
                                    className="flex items-center gap-2 text-neon-green font-bold text-[px] md:text-[12px] hover:gap-4 transition-all group"
                                >
                                    {t('home.categories.view_all')}
                                    <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default CategoryBar;

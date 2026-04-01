import React, { useRef, useEffect } from 'react';
import { Music, Mic2, Theater, Utensils, Trophy, Plane, Rocket, Heart, Cpu, ArrowUpRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=1000';
const CategoryBar = ({ activeCategory, onCategoryChange, dbCategories = [] }) => {
    const { t } = useTranslation();
    const scrollRef = useRef(null);
    const isHovering = useRef(false);

    const categories = dbCategories.map(cat => ({
        id: cat.id,
        name: cat.name,
        icon: iconMap[cat.name] || Rocket,
        image: cat.image_url || FALLBACK_IMAGE,
    }));

    // Tripled categories to support infinite circular scroll
    const displayCategories = [...categories, ...categories, ...categories];

    const handleViewAllInternal = (catId) => {
        if (onCategoryChange) {
            onCategoryChange(catId);
        }
    };

    // Initialize scroll position to the start of the middle set
    useEffect(() => {
        const container = scrollRef.current;
        if (container && categories.length > 0) {
            const singleWidth = container.scrollWidth / 3;
            container.scrollLeft = singleWidth;
        }
    }, [categories.length]);

    // Infinite Looping Logic: Jump between sets seamlessly
    useEffect(() => {
        const container = scrollRef.current;
        if (!container || categories.length === 0) return;

        const handleInfiniteScroll = () => {
            const singleWidth = container.scrollWidth / 3;
            const scrollLeft = container.scrollLeft;
            
            // If scrolled into the third set, jump back to middle set
            if (scrollLeft >= singleWidth * 2 - 10) {
                container.scrollLeft = scrollLeft - singleWidth;
            } 
            // If scrolled into the first set, jump forward to middle set
            else if (scrollLeft <= 10) {
                container.scrollLeft = scrollLeft + singleWidth;
            }
        };

        container.addEventListener('scroll', handleInfiniteScroll);
        return () => container.removeEventListener('scroll', handleInfiniteScroll);
    }, [categories.length]);

    // Auto-scroll every 2 seconds
    useEffect(() => {
        const container = scrollRef.current;
        if (!container || categories.length === 0) return;

        const interval = setInterval(() => {
            if (isHovering.current) return;
            const step = (container.scrollWidth / 3) / categories.length;
            container.scrollBy({ left: step, behavior: 'smooth' });
        }, 2000);

        return () => clearInterval(interval);
    }, [categories.length]);

    return (
        <div
            ref={scrollRef}
            className="flex gap-6 overflow-x-auto  no-scrollbar px-4 md:px-0 snap-x"
            onMouseEnter={() => { isHovering.current = true; }}
            onMouseLeave={() => { isHovering.current = false; }}
        >
            {displayCategories.length > 0 && displayCategories.map((cat, idx) => {
                const isActive = activeCategory && activeCategory.toString() === cat.id.toString();

                return (
                    <div
                        key={`${cat.id}-${idx}`}
                        className={`group relative min-w-[220px] aspect-[3.4/4] rounded-[2rem] overflow-hidden cursor-pointer border-2 transition-all duration-500 snap-start shrink-0 select-none ${
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
                        <div className="absolute inset-0 p-6 flex flex-col justify-end z-10">
                            <div>
                                <h3 className="text-xl font-black text-white uppercase mb-2">
                                    {cat.name}
                                </h3>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleViewAllInternal(cat.id);
                                    }}
                                    className="flex items-center gap-2 text-neon-green font-bold text-[13px] hover:gap-4 transition-all group"
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

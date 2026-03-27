import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Music, Mic2, Theater, Utensils, Trophy, Plane, Rocket, Heart, LayoutGrid, Cpu, ArrowUpRight } from 'lucide-react';
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
    const navigate = useNavigate();

    const categories = dbCategories.map(cat => ({
        id: cat.id,
        name: cat.name,
        icon: iconMap[cat.name] || Rocket,
        // Ưu tiên ảnh từ CSDL, fallback về ảnh mặc định
        image: cat.image_url || FALLBACK_IMAGE,
    }));

    const handleViewAll = (catId) => {
        navigate(`/events?category=${catId}`);
    };

    return (
        <div className="flex gap-6 overflow-x-auto pb-8 no-scrollbar px-4 md:px-0 scroll-smooth snap-x">
            {categories.map((cat) => {
                const Icon = cat.icon;
                const isActive = activeCategory.toString() === cat.id.toString();

                return (
                    <div
                        key={cat.id}
                        className={`group relative min-w-[280px] aspect-[4/3] rounded-[2rem] overflow-hidden cursor-pointer border-2 transition-all duration-500 snap-start shrink-0 select-none ${
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
                                <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-4">
                                    {cat.name}
                                </h3>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleViewAll(cat.id);
                                    }}
                                    className="flex items-center gap-2 text-neon-green font-black uppercase text-[11px] tracking-[0.2em] hover:gap-4 transition-all group"
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

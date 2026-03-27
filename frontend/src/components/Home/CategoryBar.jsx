import React from 'react';
import { Music, Mic2, Theater, Utensils, Trophy, Plane, Rocket, Heart } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const categories = [
    { id: 'all', icon: Rocket },
    { id: 'music', icon: Music },
    { id: 'workshop', icon: Mic2 },
    { id: 'theater', icon: Theater },
    { id: 'food', icon: Utensils },
    { id: 'sports', icon: Trophy },
    { id: 'travel', icon: Plane },
    { id: 'charity', icon: Heart },
];

const CategoryBar = ({ activeCategory, onCategoryChange }) => {
    const { t } = useTranslation();

    return (
        <div className="flex items-center gap-3 overflow-x-auto pb-4 no-scrollbar">
            {categories.map((cat) => {
                const Icon = cat.icon;
                const isActive = activeCategory === cat.id;
                
                return (
                    <button
                        key={cat.id}
                        onClick={() => onCategoryChange(cat.id)}
                        className={`flex items-center gap-2 px-6 py-3 rounded-2xl whitespace-nowrap transition-all duration-300 border ${
                            isActive 
                            ? 'bg-neon-green border-neon-green text-black shadow-[0_10px_20px_rgba(82,196,45,0.3)] font-bold scale-105' 
                            : 'bg-white dark:bg-[#111114] border-gray-100 dark:border-white/5 text-gray-500 dark:text-gray-400 hover:border-neon-green/30 hover:text-neon-green'
                        }`}
                    >
                        <Icon className={`w-4 h-4 ${isActive ? 'animate-pulse' : ''}`} />
                        <span className="text-xs font-black uppercase tracking-widest">
                            {t(`home.categories.${cat.id}`)}
                        </span>
                    </button>
                );
            })}
        </div>
    );
};

export default CategoryBar;

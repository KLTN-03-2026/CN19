import React from 'react';
import { useTranslation } from 'react-i18next';
import { X, Calendar, Tag, DollarSign, Filter, RefreshCcw, MapPin } from 'lucide-react';

const EventsFilter = ({ 
    categories = [], 
    selectedCategories = [], 
    onCategoryChange,
    priceRange = [0, 10000000],
    onPriceChange,
    selectedDate,
    onDateChange,
    location,
    onLocationChange,
    onClearAll,
    isOpen,
    onClose
}) => {
    const { t } = useTranslation();

    const formatPrice = (price) => {
        try {
            return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price || 0);
        } catch (e) {
            return '0đ';
        }
    };

    const safeCategories = Array.isArray(categories) ? categories : [];
    const safeSelectedCategories = Array.isArray(selectedCategories) ? selectedCategories : [];

    if (!isOpen) return null;

    return (
        <div className="w-full bg-gray-50/50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 rounded-[2.5rem] p-6 mb-8 animate-in slide-in-from-top-4 fade-in duration-500 overflow-hidden relative">
            {/* Top accent line */}
            <div className="absolute top-0 left-12 w-24 h-1 bg-gradient-to-r from-neon-green to-transparent"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {/* 🏷️ Categories Column */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-[10px] font-black uppercase text-gray-600 dark:text-gray-400 flex items-center gap-2">
                            <Tag className="w-3 h-3 text-neon-green" /> {t('explore.filter_section.category')}
                        </h3>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 max-h-[140px] overflow-y-auto no-scrollbar pr-2">
                        {safeCategories.length > 0 ? safeCategories.map((cat) => (
                            <label 
                                key={cat?.id || `cat-${Math.random()}`}
                                className="flex items-center gap-2 group cursor-pointer p-1 rounded-lg hover:bg-white dark:hover:bg-white/5 transition-all"
                            >
                                <div className="relative flex items-center shrink-0">
                                    <input 
                                        type="checkbox"
                                        className="peer appearance-none w-4 h-4 rounded-md border border-gray-300 dark:border-white/10 checked:bg-neon-green checked:border-neon-green transition-all"
                                        checked={safeSelectedCategories.includes(cat?.id)}
                                        onChange={() => onCategoryChange && onCategoryChange(cat?.id)}
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none">
                                        <div className="w-1.5 h-1.5 rounded-full bg-white dark:bg-black" />
                                    </div>
                                </div>
                                <span className="text-[13px] font-medium text-gray-700 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors truncate">
                                    {cat?.name}
                                </span>
                            </label>
                        )) : (
                            <span className="text-[11px] text-gray-500 italic">No categories</span>
                        )}
                    </div>
                </div>

                {/* 💰 Price Range Column */}
                <div className="space-y-4">
                    <h3 className="text-[10px]  font-black uppercase text-gray-600 dark:text-gray-400 flex items-center gap-2">
                        {t('explore.filter_section.price')}
                    </h3>
                    <div className="space-y-6 pt-2">
                        <input 
                            type="range" 
                            min="0" 
                            max="10000000" 
                            step="100000"
                            value={Array.isArray(priceRange) ? priceRange[1] : 10000000}
                            onChange={(e) => onPriceChange && onPriceChange([0, parseInt(e.target.value)])}
                            className="w-full h-1.5 bg-gray-300 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-neon-green"
                        />
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-[9px] uppercase font-bold text-gray-600 dark:text-gray-400">{t('explore.filter_section.price_up_to')}</span>
                                <span className="text-sm font-black text-gray-900 dark:text-white">
                                    {formatPrice(Array.isArray(priceRange) ? priceRange[1] : 10000000)}
                                </span>
                            </div>
                            <div className="p-2 rounded-full bg-neon-green/5">
                                <DollarSign className="w-4 h-4 text-neon-green/30" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 📅 Date & Actions Column */}
                <div className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase text-gray-600 dark:text-gray-400 flex items-center gap-2">
                         {t('explore.filter_section.time')} & ĐỊA ĐIỂM
                    </h3>
                    <div className="space-y-4 pt-2">
                        {/* Location Input */}
                        <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input 
                                type="text"
                                placeholder="Nhập địa điểm..."
                                value={location || ''}
                                onChange={(e) => onLocationChange && onLocationChange(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-white dark:bg-white/5 border border-gray-300 dark:border-white/5 rounded-2xl text-[13px] font-bold text-gray-900 dark:text-white outline-none focus:border-neon-green/30 transition-all shadow-sm"
                            />
                        </div>

                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input 
                                type="date" 
                                value={selectedDate || ''}
                                onChange={(e) => onDateChange && onDateChange(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-white dark:bg-white/5 border border-gray-300 dark:border-white/5 rounded-2xl text-[13px] font-bold text-gray-900 dark:text-white outline-none focus:border-neon-green/30 transition-all shadow-sm"
                            />
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                            <button 
                                onClick={onClearAll}
                                className="flex-1 py-3 px-4 flex items-center justify-center gap-2 border border-gray-300 dark:border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-tight text-gray-600 dark:text-gray-400 hover:text-red-500 hover:bg-red-500/5 transition-all"
                            >
                                <RefreshCcw className="w-3 h-3" />
                                {t('explore.filter_section.clear')}
                            </button>
                            <button 
                                onClick={onClose}
                                className="px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-black rounded-2xl text-[10px] font-black uppercase tracking-tight shadow-xl active:scale-95 transition-all"
                            >
                                {t('explore.filter_section.done')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EventsFilter;

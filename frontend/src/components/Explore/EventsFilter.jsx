import React from 'react';
import { useTranslation } from 'react-i18next';
import { X, ChevronDown, Calendar, Tag, DollarSign, Filter } from 'lucide-react';

const EventsFilter = ({ 
    categories = [], 
    selectedCategories = [], 
    onCategoryChange,
    priceRange = [0, 10000000],
    onPriceChange,
    selectedDate,
    onDateChange,
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

    // Ensure categories is always an array
    const safeCategories = Array.isArray(categories) ? categories : [];
    const safeSelectedCategories = Array.isArray(selectedCategories) ? selectedCategories : [];

    return (
        <aside className={`
            fixed inset-y-0 left-0 z-50 w-80 bg-white dark:bg-[#0a0a0a] border-r border-gray-200 dark:border-white/5 
            transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:border-none lg:bg-transparent lg:dark:bg-transparent
            ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
            <div className="flex flex-col h-full lg:max-h-[calc(100vh-220px)]">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 dark:border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Filter className="w-5 h-5 text-neon-green" />
                        <h2 className="text-lg font-black uppercase tracking-tighter text-gray-900 dark:text-white">
                            {t('explore.filters')}
                        </h2>
                    </div>
                    <button 
                        onClick={onClose}
                        className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-900 dark:text-white" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
                    {/* Clear All Button (Desktop) */}
                    <button 
                        onClick={onClearAll}
                        className="hidden lg:block w-full py-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-neon-green border border-gray-200 dark:border-white/5 rounded-xl hover:border-neon-green/20 transition-all"
                    >
                        {t('explore.clear_all')}
                    </button>

                    {/* Categories */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">
                                {t('explore.category_label')}
                            </h3>
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                            {safeCategories.length > 0 ? safeCategories.map((cat) => (
                                <label 
                                    key={cat?.id || `cat-${Math.random()}`}
                                    className="flex items-center gap-3 group cursor-pointer"
                                >
                                    <div className="relative flex items-center">
                                        <input 
                                            type="checkbox"
                                            className="peer appearance-none w-5 h-5 rounded border border-gray-300 dark:border-white/10 checked:bg-neon-green checked:border-neon-green transition-all"
                                            checked={safeSelectedCategories.includes(cat?.id)}
                                            onChange={() => onCategoryChange && onCategoryChange(cat?.id)}
                                        />
                                        <X className="absolute w-3 h-3 text-black opacity-0 peer-checked:opacity-100 left-1 transition-opacity pointer-events-none" />
                                    </div>
                                    <span className="text-sm font-bold text-gray-600 dark:text-gray-400 group-hover:text-neon-green transition-colors">
                                        {cat?.name || 'Unknown'}
                                    </span>
                                </label>
                            )) : (
                                <span className="text-xs text-gray-500 italic">No categories available</span>
                            )}
                        </div>
                    </div>

                    {/* Price Range */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">
                            {t('explore.price_label')}
                        </h3>
                        <div className="space-y-6">
                            <input 
                                type="range" 
                                min="0" 
                                max="10000000" 
                                step="100000"
                                value={Array.isArray(priceRange) ? priceRange[1] : 10000000}
                                onChange={(e) => onPriceChange && onPriceChange([0, parseInt(e.target.value)])}
                                className="w-full h-1.5 bg-gray-200 dark:bg-white/5 rounded-lg appearance-none cursor-pointer accent-neon-green"
                            />
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black font-mono text-gray-400">0đ</span>
                                <span className="text-[10px] font-black font-mono text-neon-green bg-neon-green/10 px-2 py-1 rounded border border-neon-green/20">
                                    {formatPrice(Array.isArray(priceRange) ? priceRange[1] : 10000000)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Date Selector */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">
                            {t('explore.date_label')}
                        </h3>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input 
                                type="date" 
                                value={selectedDate || ''}
                                onChange={(e) => onDateChange && onDateChange(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm font-bold text-gray-900 dark:text-white outline-none focus:border-neon-green/50 transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* Footer (Mobile Only) */}
                <div className="lg:hidden p-6 border-t border-gray-200 dark:border-white/5">
                    <button 
                        onClick={onClose}
                        className="w-full py-4 bg-neon-green text-black font-black uppercase text-xs tracking-widest rounded-xl shadow-lg shadow-neon-green/20"
                    >
                        Áp dụng
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default EventsFilter;

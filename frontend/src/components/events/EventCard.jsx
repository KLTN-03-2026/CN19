import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Ticket } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const EventCard = ({ event, className = "", variant = "default" }) => {
    const { t, i18n } = useTranslation();
    
    // Logic to format date/time
    const eventDate = new Date(event.event_date);
    const day = eventDate.getDate();
    const month = eventDate.toLocaleString(i18n.language === 'vi' ? 'vi-VN' : 'en-US', { month: 'short' });

    const isFeatured = variant === "featured";

    // Handle image error by showing a nice gradient fallback
    const handleImageError = (e) => {
        e.target.style.display = 'none';
        e.target.parentElement.classList.add('bg-gradient-to-br', 'from-gray-800', 'to-gray-900');
    };

    return (
        <Link 
            to={`/events/${event.id}`}
            className={`group relative overflow-hidden rounded-[2rem] bg-gray-100 dark:bg-[#0a0a0b] border border-gray-100 dark:border-white/5 transition-all duration-500 hover:scale-[1.02] hover:border-neon-green/30 hover:shadow-[0_20px_50px_rgba(82,196,45,0.2)] block w-full aspect-[4/5] ${className}`}
        >
            {/* Poster Background Image */}
            <div className="absolute inset-0 z-0 bg-gray-200 dark:bg-white/5 flex items-center justify-center">
                <img 
                    src={event.image_url || 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?q=80&w=1000'} 
                    alt="" 
                    onError={handleImageError}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                {/* Multi-layer Gradient for better readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent opacity-90"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent opacity-40"></div>
            </div>

            {/* Poster Content Overlay */}
            <div className="absolute inset-0 z-10 p-6 md:p-6 flex flex-col justify-between h-full">
                <div className="flex justify-between items-start">
                    {/* Date Badge */}
                    <div className="bg-black/40 backdrop-blur-xl rounded-2xl px-3 py-1 flex flex-col items-center min-w-[50px] border border-white/20 shadow-xl">
                        <span className="text-base font-black text-white leading-none">{day}</span>
                        <span className="text-[10px] font-bold text-neon-green mt-1 lowercase first-letter:uppercase">{month}</span>
                    </div>

                    {/* Category Label */}
                    <div className="bg-black/40 backdrop-blur-xl px-2.5 py-0.5 rounded-full border border-neon-green/40 shadow-2xl">
                        <span className="text-[10px] font-black text-neon-green tracking-wider lowercase">
                            {event.category?.name || t('event.card.category_default')}
                        </span>
                    </div>
                </div>

                <div className="mt-auto transform translate-y-2 group-hover:translate-y-0 transition-all duration-500">
                    {isFeatured && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-neon-green text-black rounded-full text-[10px] font-semibold mb-3 animate-pulse">
                            <Ticket className="w-3 h-3" />
                            {t('event.card.featured_badge')}
                        </div>
                    )}
                    
                    <h3 className="text-base font-black text-slate-900 text-white tracking-tighter leading-tight mb-4 group-hover:text-neon-green transition-colors line-clamp-2 uppercase">
                        {event.title}
                    </h3>

                    <div className="flex items-center justify-between pt-4 md:pt-6 border-t border-white/10 mt-auto">
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-semibold text-white/40 mb-0.5">{t('event.card.price_from')}</p>
                            <p className="text-sm md:text-base font-bold text-neon-green truncate w-full pr-2">
                                {event.ticket_tiers && event.ticket_tiers.length > 0 
                                    ? `${new Intl.NumberFormat(i18n.language === 'vi' ? 'vi-VN' : 'en-US').format(Math.min(...event.ticket_tiers.map(t => parseFloat(t.price) || 0)))} ${i18n.language === 'vi' ? 'VNĐ' : 'VND'}`
                                    : t('event.card.free')
                                }
                            </p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-neon-green flex-shrink-0 flex items-center justify-center text-black shadow-lg shadow-neon-green/30 transform scale-90 group-hover:scale-100 transition-all duration-500">
                            <ArrowRight className="w-5 h-5" />
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
};

export default EventCard;

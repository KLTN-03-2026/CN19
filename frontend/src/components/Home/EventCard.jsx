import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Ticket, Star } from 'lucide-react';

const EventCard = ({ event }) => {
    // Logic to format date/time
    const eventDate = new Date(event.event_date);
    const day = eventDate.getDate();
    const month = eventDate.toLocaleString('vi-VN', { month: 'short' });

    return (
        <Link 
            to={`/events/${event.id}`}
            className="group relative bg-white dark:bg-[#111114] rounded-[2.5rem] overflow-hidden border border-gray-100 dark:border-white/5 hover:border-neon-green/50 transition-all duration-500 hover:shadow-[0_20px_40px_rgba(0,0,0,0.2)] dark:hover:shadow-[0_20px_40px_rgba(82,196,45,0.1)] flex flex-col h-full"
        >
            {/* Image Section */}
            <div className="relative aspect-[4/3] overflow-hidden">
                <img 
                    src={event.image_url || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=1000'} 
                    alt={event.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                
                {/* Date Badge */}
                <div className="absolute top-4 left-4 bg-white/90 dark:bg-black/60 backdrop-blur-md rounded-2xl px-3 py-2 flex flex-col items-center min-w-[50px] border border-white/20">
                    <span className="text-lg font-black text-gray-900 dark:text-white leading-none">{day}</span>
                    <span className="text-[10px] font-bold text-neon-green uppercase tracking-tighter">{month}</span>
                </div>

                {/* Category Badge */}
                <div className="absolute top-4 right-4 bg-neon-green text-black text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-lg">
                    {event.category?.name || 'Sự kiện'}
                </div>

                {/* Glass Bottom Overlay */}
                <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-between">
                    <span className="text-white text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                        <Ticket className="w-3 h-3 text-neon-green" /> {window.location.pathname.startsWith('/en') ? 'View Details' : 'Xem chi tiết'}
                    </span>
                    <div className="flex gap-1">
                         <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse"></div>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="p-6 flex flex-col flex-1">
                <div className="flex items-center gap-2 mb-3">
                    <div className="flex text-yellow-500">
                        {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-current" />
                        ))}
                    </div>
                    <span className="text-[10px] text-gray-400 font-bold">(4.9)</span>
                </div>

                <h3 className="text-xl font-black text-gray-900 dark:text-white leading-tight mb-4 group-hover:text-neon-green transition-colors line-clamp-2 uppercase italic tracking-tighter">
                    {event.title}
                </h3>

                <div className="mt-auto space-y-2">
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs font-bold">
                        <MapPin className="w-3.5 h-3.5 text-neon-green" />
                        <span className="line-clamp-1">{event.location_address || 'Địa điểm chưa xác định'}</span>
                    </div>
                    
                    <div className="pt-4 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
                        <div>
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Giá từ</p>
                            <p className="text-lg font-black text-neon-green">
                                {event.ticket_tiers?.length > 0 
                                    ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Math.min(...event.ticket_tiers.map(t => t.price)))
                                    : 'Miễn phí'
                                }
                            </p>
                        </div>
                        <div className="w-10 h-10 rounded-full border border-gray-100 dark:border-white/10 flex items-center justify-center group-hover:bg-neon-green group-hover:text-black transition-all">
                            <Ticket className="w-5 h-5" />
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
};

export default EventCard;

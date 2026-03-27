import React from 'react';
import { Link } from 'react-router-dom';
import { Star, ArrowRight, Ticket } from 'lucide-react';

const EventCard = ({ event, className = "" }) => {
    // Logic to format date/time
    const eventDate = new Date(event.event_date);
    const day = eventDate.getDate();
    const month = eventDate.toLocaleString('vi-VN', { month: 'short' });

    return (
        <Link 
            to={`/events/${event.id}`}
            className={`group relative overflow-hidden rounded-[2rem] bg-white dark:bg-[#111114] border border-gray-100 dark:border-white/5 transition-all duration-500 hover:scale-105 hover:border-neon-green/30 hover:shadow-[0_20px_50px_rgba(82,196,45,0.2)] aspect-[2/3] block min-w-[260px] md:min-w-[300px] flex-shrink-0 ${className}`}
        >
            {/* Poster Background Image */}
            <div className="absolute inset-0 z-0">
                <img 
                    src={event.image_url || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=1000'} 
                    alt={event.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                {/* Overlay Gradients */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-transparent opacity-40"></div>
            </div>

            {/* Poster Content Overlay */}
            <div className="absolute inset-0 z-10 p-6 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                    {/* Date Badge */}
                    <div className="bg-white/10 backdrop-blur-xl rounded-2xl px-3 py-2 flex flex-col items-center min-w-[50px] border border-white/20 shadow-xl">
                        <span className="text-xl font-black text-white leading-none">{day}</span>
                        <span className="text-[10px] font-bold text-neon-green uppercase tracking-tighter">{month}</span>
                    </div>

                    {/* Category Badge */}
                    <div className="bg-neon-green/20 backdrop-blur-xl px-3 py-1.5 rounded-full border border-neon-green/30">
                        <span className="text-[10px] font-black uppercase tracking-widest text-neon-green">
                            {event.category?.name || 'Sự kiện'}
                        </span>
                    </div>
                </div>

                <div className="transform translate-y-2 group-hover:translate-y-0 transition-all duration-500">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="flex text-yellow-500">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} className="w-2.5 h-2.5 fill-current" />
                            ))}
                        </div>
                        <span className="text-[10px] text-white/50 font-bold">(4.9)</span>
                    </div>

                    <h3 className="text-xl font-black text-white leading-tight mb-4 group-hover:text-neon-green transition-colors line-clamp-2 uppercase italic tracking-tighter">
                        {event.title}
                    </h3>

                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                        <div>
                            <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">Giá từ</p>
                            <p className="text-lg font-black text-neon-green">
                                {event.ticket_tiers?.length > 0 
                                    ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Math.min(...event.ticket_tiers.map(t => t.price)))
                                    : 'Miễn phí'
                                }
                            </p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-neon-green flex items-center justify-center text-black shadow-lg shadow-neon-green/30 transform scale-90 group-hover:scale-100 transition-all duration-500">
                            <ArrowRight className="w-5 h-5" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Status Pulse */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                <div className="w-16 h-16 rounded-full bg-neon-green/20 animate-ping"></div>
            </div>
        </Link>
    );
};

export default EventCard;

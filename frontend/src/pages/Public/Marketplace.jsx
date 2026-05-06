import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
    Tag, 
    Search, 
    Filter, 
    Calendar, 
    MapPin, 
    ArrowRight, 
    Loader2, 
    Ticket as TicketIcon,
    AlertCircle,
    ChevronRight,
    ShoppingBag,
    Info,
    X,
    CheckCircle2,
    ExternalLink,
    Eye
} from 'lucide-react';
import { marketplaceService } from '../../services/marketplace.service';
import orderService from '../../services/order.service';
import eventService from '../../services/event.service';
import EventsFilter from '../../components/events/EventsFilter';
import { useAuthStore } from '../../store/useAuthStore';
import toast from 'react-hot-toast';
import { RefreshCcw } from 'lucide-react';
import { useBehaviorTracker } from '../../hooks/useBehaviorTracker';
import { useTranslation } from 'react-i18next';
import EventCard from '../../components/events/EventCard';
import { useSystemConfig } from '../../hooks/useSystemConfig';

import PuzzleCaptcha from '../../components/common/PuzzleCaptcha';

const formatImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');
    return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
};


const Marketplace = () => {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const { user } = useAuthStore();
    const { config } = useSystemConfig();
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isBuying, setIsBuying] = useState(null);
    const [selectedListing, setSelectedListing] = useState(null);
    const [showFilters, setShowFilters] = useState(false);

    // Filter states
    const [categories, setCategories] = useState([]);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [priceRange, setPriceRange] = useState([0, 10000000]);
    const [selectedDate, setSelectedDate] = useState(null);

    // Anti-bot states
    const { getBehaviorData } = useBehaviorTracker();
    const [isCaptchaOpen, setIsCaptchaOpen] = useState(false);
    const [pendingListingId, setPendingListingId] = useState(null);

    // Suggested events states
    const [featuredEvents, setFeaturedEvents] = useState([]);
    const [popularEvents, setPopularEvents] = useState([]);
    const [eventsLoading, setEventsLoading] = useState(true);

    useEffect(() => {
        fetchListings();
        fetchCategories();
        fetchSuggestedEvents();
    }, []);

    const fetchSuggestedEvents = async () => {
        try {
            setEventsLoading(true);
            const [featuredRes, popularRes] = await Promise.all([
                eventService.getRecommendations(),
                eventService.getEvents({ sort: 'popular', status: 'active' })
            ]);
            setFeaturedEvents((featuredRes.data || []).slice(0, 10));
            setPopularEvents((popularRes.data || []).slice(0, 10));
        } catch (error) {
            console.error('Lỗi lấy sự kiện gợi ý:', error);
        } finally {
            setEventsLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await eventService.getCategories();
            setCategories(response.data);
        } catch (error) {
            console.error('Lỗi lấy danh mục:', error);
        }
    };

    const fetchListings = async () => {
        try {
            setLoading(true);
            const res = await marketplaceService.getListings();
            // Filter only active listings
            setListings(res.data.filter(l => l.status === 'active'));
        } catch (error) {
            console.error('Error fetching listings:', error);
            toast.error(t('marketplace.messages.load_error') || 'Không thể tải danh sách vé.');
        } finally {
            setLoading(false);
        }
    };

    const handleBuyTicket = async (listingId, puzzleData = null) => {
        if (!user) {
            toast.error(t('marketplace.messages.login_required') || 'Vui lòng đăng nhập để mua vé.');
            navigate('/login');
            return;
        }

        // Nếu chưa có captcha, mở modal captcha lên
        if (!puzzleData) {
            setPendingListingId(listingId);
            setIsCaptchaOpen(true);
            return;
        }

        try {
            setIsBuying(listingId);
            const behaviorData = getBehaviorData();
            
            const res = await orderService.createMarketplaceOrder(
                listingId, 
                behaviorData, 
                null, // captchaToken (recaptcha) if needed
                puzzleData
            );
            
            toast.success(t('marketplace.messages.buy_success') || 'Đã xác nhận giữ chỗ vé. Đang chuyển hướng đến thanh toán...');
            
            const mktTx = res.data;
            navigate(`/checkout/${mktTx.transaction_number}?type=marketplace`);
        } catch (error) {
            toast.error(error.response?.data?.error || t('marketplace.messages.buy_error') || 'Lỗi khi mua vé.');
        } finally {
            setIsBuying(null);
            setPendingListingId(null);
        }
    };

    const onCaptchaSuccess = (data) => {
        setIsCaptchaOpen(false);
        if (pendingListingId) {
            handleBuyTicket(pendingListingId, data);
        }
    };

    const filteredListings = listings.filter(listing => {
        const matchesSearch = listing.event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             listing.ticket.ticket_tier.tier_name.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(listing.event.category_id);
        
        const matchesPrice = listing.asking_price <= priceRange[1];
        
        const matchesDate = !selectedDate || new Date(listing.event.event_date).toISOString().split('T')[0] === selectedDate;
        
        return matchesSearch && matchesCategory && matchesPrice && matchesDate;
    });

    if (loading) {
        return (
            <div className="min-h-screen bg-dark-bg flex items-center justify-center pt-20">
                <Loader2 className="w-12 h-12 text-neon-green animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-bg transition-colors duration-500 pt-6 pb-10 px-4 sm:px-8">
            <div className="max-w-7xl mx-auto space-y-4">
                
                {/* Header Section - More Compact */}
                <div className="relative overflow-hidden p-1 md:p-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-neon-green/10 border border-neon-green/20 rounded-lg">
                            <Tag className="w-3.5 h-3.5 text-neon-green" />
                            <span className="text-[9px] font-black text-neon-green uppercase tracking-tight">{t('marketplace.hero.badge')}</span>
                        </div>
                        <h1 className="text-xl mt-2 md:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">
                            {t('marketplace.hero.title_part1')} <span className="text-neon-green">{t('marketplace.hero.title_part2')}</span>
                        </h1>
                        <p className="text-sm mt-2 text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
                            {t('marketplace.hero.subtitle')}
                        </p>
                </div>
                {/* Search & Filter Bar - Adaptive */}
                <div className="flex flex-col sm:flex-row gap-3 items-center bg-white/50 dark:bg-dark-card/50 backdrop-blur-xl border border-gray-200 dark:border-white/5 p-3 rounded-2xl">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                        <input 
                            type="text" 
                            placeholder={t('marketplace.filters.search_placeholder')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-gray-100 dark:bg-white/[0.02] border border-gray-200 dark:border-white/5 rounded-xl py-3 pl-12 pr-6 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-neon-green/30 transition-all font-medium"
                        />
                    </div>
                    <button 
                        onClick={() => setShowFilters(!showFilters)}
                        className={`w-full sm:w-auto px-6 py-3 border rounded-xl text-[10px] font-black uppercase tracking-tight transition-all flex items-center justify-center gap-2 ${
                            showFilters 
                            ? 'bg-neon-green text-black border-neon-green shadow-[0_0_15px_rgba(82,196,45,0.3)]' 
                            : 'bg-white/50 dark:bg-white/[0.03] border-gray-200 dark:border-white/5 text-slate-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/5'
                        }`}
                    >
                        <Filter className={`w-3.5 h-3.5 ${showFilters ? 'text-black' : 'text-neon-green'}`} />
                        {t('explore.filters') || 'Bộ lọc'}
                    </button>
                </div>

                {/* Expanded Filters Section - Using EventsFilter Component */}
                <EventsFilter 
                    categories={categories}
                    selectedCategories={selectedCategories}
                    onCategoryChange={(id) => {
                        setSelectedCategories(prev => 
                            prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
                        );
                    }}
                    priceRange={priceRange}
                    onPriceChange={setPriceRange}
                    selectedDate={selectedDate}
                    onDateChange={setSelectedDate}
                    onClearAll={() => {
                        setSearchQuery('');
                        setSelectedCategories([]);
                        setPriceRange([0, 10000000]);
                        setSelectedDate(null);
                    }}
                    isOpen={showFilters}
                    onClose={() => setShowFilters(false)}
                />
                {filteredListings.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 space-y-4 bg-gray-100 dark:bg-dark-card/30 rounded-3xl border border-dashed border-gray-300 dark:border-white/10">
                        <div className="w-16 h-16 bg-gray-200 dark:bg-white/5 rounded-full flex items-center justify-center">
                            <TicketIcon className="w-8 h-8 text-gray-400 dark:text-gray-700" />
                        </div>
                        <div className="text-center">
                            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                {listings.length === 0 ? t('marketplace.sections.no_listings') : t('explore.no_results')}
                            </h3>
                            <p className="text-gray-500 text-[10px] uppercase font-bold">
                                {listings.length === 0 ? t('marketplace.messages.load_error') : t('explore.filters')}
                            </p>
                            {listings.length > 0 && (
                                <button 
                                    onClick={() => {
                                        setSearchQuery('');
                                        setSelectedCategories([]);
                                        setPriceRange([0, 10000000]);
                                        setSelectedDate(null);
                                    }}
                                    className="mt-4 px-4 py-2 bg-neon-green text-black text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-neon-green/90 transition-all"
                                >
                                    {t('explore.clear_all') || 'Xóa tất cả bộ lọc'}
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredListings.map((listing) => (
                            <div 
                                key={listing.id}
                                className="group relative bg-white dark:bg-dark-card border border-gray-100 dark:border-white/5 rounded-3xl overflow-hidden hover:border-neon-green/30 transition-all duration-500 shadow-xl"
                            >
                                {/* Event Image Preview */}
                                <div className="relative aspect-[16/10] overflow-hidden">
                                    <img 
                                        src={formatImageUrl(listing.event.image_url || listing.event.poster_url)} 
                                        alt=""
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-dark-card via-transparent to-transparent opacity-80" />
                                    
                                    {/* Price Badge */}
                                    <div className="absolute top-4 right-4 px-3 py-1.5 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl">
                                        <p className="text-[8px] font-black text-neon-green uppercase tracking-tight leading-none mb-0.5">{t('marketplace.listing.asking_price')}</p>
                                        <p className="text-sm font-black text-white tracking-tight">
                                            {(() => {
                                                const resaleGasFee = Number(listing.event.resale_gas_fee || config.system_gas_fee || 10000);
                                                const platformFeePercent = Number(listing.event.resale_platform_fee_percent || config.resale_transaction_fee_percent || 3.0);
                                                const totalAskingPrice = Number(listing.asking_price);
                                                
                                                // [Smart Fee Calculation]: Chỉ tính phí trên phần vé
                                                const metadata = listing.metadata || {};
                                                const ticketPrice = Number(metadata.ticket_price || totalAskingPrice);
                                                
                                                const systemFee = resaleGasFee + (ticketPrice * platformFeePercent / 100);
                                                return (totalAskingPrice + systemFee).toLocaleString();
                                            })()} <span className="text-[9px] text-gray-400">{i18n.language === 'vi' ? 'VNĐ' : 'VND'}</span>
                                        </p>
                                    </div>

                                    {/* Merchandise Indicator */}
                                    {listing.metadata?.selected_merchandise?.length > 0 && (
                                        <div className="absolute top-4 left-4 px-2 py-1 bg-blue-600 text-white text-[8px] font-black uppercase tracking-tight rounded-md flex items-center gap-1 shadow-lg z-10 animate-in fade-in zoom-in duration-300">
                                            <ShoppingBag className="w-2.5 h-2.5" />
                                            +{listing.metadata.selected_merchandise.length} {t('marketplace.listing.merchandise_included')}
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="p-5 space-y-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-500 text-[8px] font-black uppercase tracking-tight rounded-sm border border-gray-200 dark:border-white/5">
                                                NFT #{listing.listing_number.split('-')[1].slice(-4)}
                                            </span>
                                            <span className="text-[8px] font-black text-neon-green uppercase tracking-tight">{t('marketplace.stats.verified')}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-tight line-clamp-1 group-hover:text-neon-green transition-colors">
                                                {listing.event.title}
                                            </h3>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            <div className="px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                                <p className="text-[7px] font-black text-blue-400  uppercase leading-none mb-0.5">{t('myTickets.labels.tier')}</p>
                                                <p className="text-[10px] font-bold text-slate-900 dark:text-white">{listing.ticket.ticket_tier.tier_name}</p>
                                            </div>
                                            <div className="px-2 py-1 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                                                <p className="text-[7px] font-black text-purple-400 uppercase leading-none mb-0.5">{t('myTickets.labels.location')}</p>
                                                <p className="text-[10px] font-bold text-slate-900 dark:text-white">{listing.ticket.ticket_tier.section_name || t('myTickets.labels.general_area')}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1 text-[10px] font-bold text-gray-600 dark:text-gray-500 tracking-tight">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar className="w-3 h-3 text-neon-green" />
                                                {t('eventDetail.time')}: {new Date(listing.event.event_date).toLocaleDateString('vi-VN')}
                                            </div>
                                            <div className="flex items-center gap-1.5 truncate">
                                                <MapPin className="w-3 h-3 text-blue-500" />
                                                {listing.event.location_address}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Seller Info & Action Buttons Row */}
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 flex items-center justify-between p-2 bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 rounded-xl">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-neon-green to-blue-600 flex items-center justify-center text-[8px] font-black text-white">
                                                    {listing.seller.full_name.charAt(0)}
                                                </div>
                                                <span className="text-[12px] font-black text-slate-900 dark:text-white tracking-tight truncate max-w-[80px]">{listing.seller.full_name}</span>
                                            </div>
                                            <p className="text-[9px] font-black text-gray-600 dark:text-gray-500">#{listing.ticket.nft_token_id || 'N/A'}</p>
                                        </div>

                                        <div className="flex items-center gap-1.5">
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedListing(listing);
                                                }}
                                                className="p-2 bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white rounded-xl border border-blue-500/20 transition-all"
                                                title="Xem chi tiết vé"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/events/${listing.event_id}`);
                                                }}
                                                className="p-2 bg-purple-500/10 hover:bg-purple-500 text-purple-400 hover:text-white rounded-xl border border-purple-500/20 transition-all"
                                                title="Xem sự kiện gốc"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Action */}
                                    {user && (listing.seller_id === user.id || listing.event.organizer?.user_id === user.id) ? (
                                        <div className="w-full py-3 px-4 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl flex items-center justify-center">
                                            <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-tight">
                                                {listing.seller_id === user.id ? t('eventDetail.you_are_owner') : t('reviews.organizer')}
                                            </span>
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={() => handleBuyTicket(listing.id)}
                                            disabled={isBuying === listing.id}
                                            className="w-full group/btn relative overflow-hidden bg-neon-green hover:bg-neon-green/90 border border-neon-green py-3 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.98]"
                                        >
                                            {isBuying === listing.id ? (
                                                <Loader2 className="w-4 h-4 text-black animate-spin" />
                                            ) : (
                                                <>
                                                    <span className="text-[10px] font-black text-black uppercase tracking-widest">{t('marketplace.listing.buy_now')}</span>
                                                    <ArrowRight className="w-3.5 h-3.5 text-black group-hover/btn:translate-x-1 transition-all" />
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Benefits Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-10">
                    {[
                        { title: t('home.features.secure_title'), desc: t('home.features.secure_desc') },
                        { title: t('home.features.instant_title'), desc: t('home.features.instant_desc') },
                        { title: t('home.features.market_title'), desc: t('home.features.market_desc') }
                    ].map((item, i) => (
                        <div key={i} className="p-4 md:p-6 bg-white dark:bg-dark-card/50 border border-gray-100 dark:border-white/5 rounded-3xl space-y-2 shadow-sm dark:shadow-none">
                            <div className="w-8 h-8 md:w-10 md:h-10 bg-neon-green/10 rounded-xl md:rounded-2xl flex items-center justify-center">
                                <AlertCircle className="w-4 h-4 md:w-4.5 md:h-4.5 text-neon-green" />
                            </div>
                            <h4 className="text-sm md:text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">{item.title}</h4>
                            <p className="text-[11px] md:text-sm text-gray-500 font-medium leading-relaxed">{item.desc}</p>
                        </div>
                    ))}
                </div>
                                {/* ── EVENT SUGGESTION ROWS ── */}
                {/* Row 1: Sự kiện nổi bật */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <span className="w-1 h-5 bg-neon-green rounded-full block"></span>
                            <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{t('marketplace.suggested_events.featured')}</h2>
                            <span className="px-2 py-0.5 bg-neon-green/10 border border-neon-green/20 rounded-full text-[8px] font-black text-neon-green uppercase">{t('marketplace.suggested_events.featured_badge')}</span>
                        </div>
                        <Link to="/events?is_featured=true" className="flex items-center gap-1 text-[10px] font-black text-gray-500 dark:text-gray-400 hover:text-neon-green transition-colors">
                            {t('marketplace.suggested_events.view_all')} <ChevronRight className="w-3 h-3" />
                        </Link>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                        {eventsLoading ? (
                            Array(5).fill(0).map((_, i) => (
                                <div key={i} className="h-64 bg-gray-100 dark:bg-white/5 rounded-2xl animate-pulse" />
                            ))
                        ) : featuredEvents.slice(0, 5).map(event => (
                            <EventCard key={event.id} event={event} variant="featured" />
                        ))}
                    </div>
                </div>

                {/* Row 2: Sự kiện phổ biến */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <span className="w-1 h-5 bg-blue-500 rounded-full block"></span>
                            <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{t('marketplace.suggested_events.popular')}</h2>
                            <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-[8px] font-black text-blue-400 uppercase">{t('marketplace.suggested_events.popular_badge')}</span>
                        </div>
                        <Link to="/events?sort=popular" className="flex items-center gap-1 text-[10px] font-black text-gray-500 dark:text-gray-400 hover:text-blue-400 transition-colors">
                            {t('marketplace.suggested_events.view_all')} <ChevronRight className="w-3 h-3" />
                        </Link>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                        {eventsLoading ? (
                            Array(5).fill(0).map((_, i) => (
                                <div key={i} className="h-64 bg-gray-100 dark:bg-white/5 rounded-2xl animate-pulse" />
                            ))
                        ) : popularEvents.slice(0, 5).map((event, idx) => (
                            <div key={event.id} className="relative">
                                <EventCard event={event} t={t} />
                                <div className="absolute top-2.5 left-2.5 w-6 h-6 bg-black/60 backdrop-blur-md rounded-lg flex items-center justify-center z-10 pointer-events-none">
                                    <span className="text-[9px] font-black text-white">#{idx + 1}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Detail Modal */}
            {selectedListing && (
                <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/80 backdrop-blur-sm animate-in fade-in duration-300 flex justify-center py-20 px-4">
                    <div className="relative w-full max-w-lg h-fit bg-white dark:bg-dark-card border border-gray-100 dark:border-white/10 rounded-[2rem] overflow-hidden shadow-2xl border border-gray-200 dark:border-white/5 animate-in zoom-in-95 duration-300 mt-8">
                        {/* Modal Header Image */}
                        <div className="relative h-46">
                            <img 
                                src={formatImageUrl(selectedListing.event.image_url || selectedListing.event.poster_url)} 
                                className="w-full h-full object-cover"
                                alt=""
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-dark-card via-dark-card/40 to-transparent" />
                            <button 
                                onClick={() => setSelectedListing(null)}
                                className="absolute top-4 right-4 p-2 bg-black/50 backdrop-blur-md rounded-full text-white hover:bg-red-500 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                            
                            <div className="absolute bottom-4 left-6">
                                <span className="px-2 py-1 bg-neon-green text-black text-[8px] font-black rounded-md mb-2 inline-block">
                                    {t('marketplace.captcha.verify') || 'Chi tiết vé niêm yết'}
                                </span>
                                <h2 className="text-2xl font-black text-white uppercase tracking-tighter">{selectedListing.event.title}</h2>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="p-8 space-y-3">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3.5 bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/5 rounded-2xl">
                                    <p className="text-[9px] font-black text-gray-500 uppercase mb-1">{t('myTickets.labels.tier')} & {t('myTickets.labels.location')}</p>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                                        {selectedListing.ticket.ticket_tier.tier_name} - {selectedListing.ticket.ticket_tier.section_name || t('myTickets.labels.general_area')}
                                    </p>
                                </div>
                                <div className="p-3.5 bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/5 rounded-2xl">
                                    <p className="text-[9px] font-black text-gray-500 uppercase mb-1">{t('myTickets.labels.nft_id') || 'NFT ID'}</p>
                                    <p className="text-sm font-mono font-bold text-neon-green">#{selectedListing.ticket.nft_token_id || 'N/A'}</p>
                                </div>
                            </div>

                            {/* Ticket Benefits Section */}
                            <div className="p-4 bg-purple-500/5 border border-purple-500/10 rounded-2xl space-y-2">
                                <h4 className="text-[10px] font-black text-purple-400 uppercase flex items-center gap-2">
                                    {t('eventDetail.importantNote')}
                                </h4>
                                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed italic">
                                    {selectedListing.ticket.ticket_tier.benefits ? `"${selectedListing.ticket.ticket_tier.benefits}"` : t('eventDetail.infoUpdating')}
                                </p>
                            </div>

                            {/* Merchandise Section in Modal */}
                            {selectedListing.metadata?.selected_merchandise?.length > 0 && (
                                <div className="space-y-3">
                                    <h4 className="text-[10px] font-black text-slate-900 dark:text-white uppercase flex items-center gap-2">
                                        <ShoppingBag className="w-3.5 h-3.5 text-blue-500" />
                                        {t('checkout.addons')}
                                    </h4>
                                    <div className="space-y-2">
                                        {selectedListing.metadata.selected_merchandise.map((item, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl overflow-hidden border border-blue-500/20 bg-blue-500/5 flex-shrink-0">
                                                        {item.image_url ? (
                                                            <img src={formatImageUrl(item.image_url)} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500/10 to-purple-500/10">
                                                                <ShoppingBag className="w-4 h-4 text-blue-500/50" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-[11px] font-bold text-slate-900 dark:text-white uppercase">{item.name}</p>
                                                        <p className="text-[10px] text-gray-500 font-bold ">{t('checkout.quantity')} {item.quantity}</p>
                                                    </div>
                                                </div>
                                                <p className="text-xs font-black text-blue-600 dark:text-blue-400">{item.unit_price?.toLocaleString()} VND</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Summary Price */}
                            <div className="p-4 bg-neon-green/5 border border-neon-green/10 rounded-2xl flex items-center justify-between">
                                <div>
                                    <p className="text-[9px] font-black text-neon-green uppercase ">{t('checkout.totalToPay')}</p>
                                    <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">
                                        {(() => {
                                            const resaleGasFee = Number(selectedListing.event.resale_gas_fee || config.system_gas_fee || 10000);
                                            const platformFeePercent = Number(selectedListing.event.resale_platform_fee_percent || config.resale_transaction_fee_percent || 3.0);
                                            const totalAskingPrice = Number(selectedListing.asking_price);
                                            
                                            const metadata = selectedListing.metadata || {};
                                            const ticketPrice = Number(metadata.ticket_price || totalAskingPrice);
                                            
                                            const systemFee = resaleGasFee + (ticketPrice * platformFeePercent / 100);
                                            return (totalAskingPrice + systemFee).toLocaleString();
                                        })()} <span className="text-xs text-gray-500">{i18n.language === 'vi' ? 'VNĐ' : 'VND'}</span>
                                    </p>
                                </div>
                                <button 
                                    onClick={() => {
                                        const listingId = selectedListing.id;
                                        setSelectedListing(null);
                                        handleBuyTicket(listingId);
                                    }}
                                    disabled={isBuying === selectedListing.id || (user && (selectedListing.seller_id === user.id || selectedListing.event.organizer?.user_id === user.id))}
                                    className="px-6 py-3 bg-neon-green hover:bg-neon-green-hover text-black text-xs font-black uppercase rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:grayscale"
                                >
                                    {isBuying === selectedListing.id ? t('common.loading') : t('marketplace.listing.buy_now')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Anti-bot Captcha */}
            <PuzzleCaptcha 
                isOpen={isCaptchaOpen}
                onClose={() => setIsCaptchaOpen(false)}
                onSuccess={onCaptchaSuccess}
            />
        </div>
    );
};

export default Marketplace;

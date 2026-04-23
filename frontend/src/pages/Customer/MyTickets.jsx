import React, { useState, useEffect } from 'react';
import { 
    Ticket, 
    Calendar, 
    MapPin, 
    Search, 
    Clock, 
    QrCode, 
    RefreshCcw, 
    ExternalLink, 
    ArrowRightLeft, 
    Tag,
    Eye,
    AlertCircle,
    Loader2,
    LayoutGrid,
    List,
    DollarSign,
    XCircle,
    X,
    Send,
    FileText,
    Shield,
    Grid as LucideGrid,
    Sparkles,
    CheckCircle2,
    PartyPopper
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { ticketService } from '../../services/ticket.service';
import { marketplaceService } from '../../services/marketplace.service';
import { userService } from '../../services/user.service';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const MyTickets = () => {
    const { t } = useTranslation();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('upcoming'); // 'all', 'upcoming', 'transferred', 'sold', 'reselling', 'cancelled', 'rescheduled'
    const [viewMode, setViewMode] = useState('grid'); // 'grid', 'list'
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [showQrModal, setShowQrModal] = useState(false);
    const [qrCodeData, setQrCodeData] = useState(null);
    const [qrLoading, setQrLoading] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [isScanned, setIsScanned] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);



    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        try {
            setLoading(true);
            const res = await ticketService.getMyTickets();
            setTickets(res.data || []);
        } catch (error) {
            toast.error(t('myTickets.error_loading') || 'Không thể tải danh sách vé.');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleViewQr = async (ticket) => {
        if (!ticket.is_current_owner) {
            toast.error(t('myTickets.error_not_owner') || 'Bạn không còn sở hữu vé này.');
            return;
        }
        if (ticket.status === 'used' || ticket.status === 'cancelled') {
            toast.error(t('myTickets.error_invalid_auth') || 'Vé không khả dụng để xác thực.');
            return;
        }
        setIsScanned(false);
        setSelectedTicket(ticket);
        setShowQrModal(true);
        generateQr(ticket.id);
    };



    const generateQr = async (ticketId) => {
        try {
            setQrLoading(true);
            const res = await ticketService.getQrCode(ticketId);
            setQrCodeData(res.qr_code);
            const expiresAt = new Date(res.expires_at).getTime();
            const now = new Date().getTime();
            setCountdown(Math.max(0, Math.floor((expiresAt - now) / 1000)));
        } catch (error) {
            toast.error(error.response?.data?.error || t('myTickets.error_get_qr') || 'Không thể lấy mã QR.');
            setShowQrModal(false);
        } finally {
            setQrLoading(false);
        }
    };

    useEffect(() => {
        let timer;
        if (showQrModal && countdown > 0 && !isScanned) {
            timer = setInterval(() => {
                setCountdown(prev => prev - 1);
            }, 1000);
        } else if (countdown === 0 && showQrModal && selectedTicket && !isScanned) {
            generateQr(selectedTicket.id);
        }
        return () => clearInterval(timer);
    }, [showQrModal, countdown, selectedTicket, isScanned]);

    // Polling trạng thái vé khi Modal đang mở
    useEffect(() => {
        let pollTimer;
        if (showQrModal && selectedTicket && !isScanned) {
            pollTimer = setInterval(async () => {
                try {
                    const res = await ticketService.getTicketById(selectedTicket.id);
                    if (res.data?.status === 'used' || res.data?.is_used === true) {
                        setIsScanned(true);
                        toast.success(t('myTickets.scan_success') || 'Tuyệt vời! Vé đã được xác thực thành công.');
                        // Làm mới danh sách vé ở nền
                        fetchTickets();
                    }
                } catch (error) {
                    console.error("Lỗi khi kiểm tra trạng thái vé:", error);
                }
            }, 3000); // Kiểm tra mỗi 3 giây
        }
        return () => clearInterval(pollTimer);
    }, [showQrModal, selectedTicket, isScanned]);
    
    const handleCancelListing = async (listingId) => {
        if (!window.confirm(t('myTickets.confirm_cancel_listing') || 'Bạn có chắc chắn muốn hủy bài đăng bán vé này? Vé sẽ được mở khóa để sử dụng bình thường.')) return;
        
        try {
            setIsCancelling(true);
            await marketplaceService.deleteListing(listingId);
            toast.success(t('myTickets.cancel_listing_success') || 'Đã hủy bài đăng thành công.');
            fetchTickets(); // Reload list
        } catch (error) {
            toast.error(error.response?.data?.error || 'Lỗi khi hủy bài đăng.');
        } finally {
            setIsCancelling(false);
        }
    };

    const filteredTickets = tickets.filter(ticket => {
        const matchesSearch = ticket.event.title.toLowerCase().includes(searchTerm.toLowerCase());
        const eventDate = new Date(ticket.event.event_date);
        const isUpcomingDate = eventDate >= new Date();
        
        switch (activeTab) {
            case 'all': 
                return matchesSearch;
            case 'upcoming': 
                return matchesSearch && isUpcomingDate && ticket.is_current_owner && ticket.status === 'minted' && !ticket.is_on_marketplace;
            case 'past':
                // Hiển thị nếu sự kiện đã qua HOẶC vé đã được sử dụng (đã quét)
                return matchesSearch && ticket.is_current_owner && (!isUpcomingDate || ticket.status === 'used');
            case 'transferred': 
                // Chuyển nhượng trực tiếp (kông qua chợ)
                return matchesSearch && ticket.is_original_buyer && !ticket.is_current_owner && !ticket.was_sold_on_marketplace;
            case 'sold': 
                // Đã bán qua Chợ vé
                return matchesSearch && ticket.is_original_buyer && !ticket.is_current_owner && ticket.was_sold_on_marketplace;
            case 'reselling': 
                return matchesSearch && ticket.is_current_owner && ticket.is_on_marketplace;
            case 'cancelled': 
                return matchesSearch && (ticket.status === 'cancelled' || ticket.event.status === 'cancelled');
            case 'rescheduled': 
                return matchesSearch && ticket.event.status === 'rescheduled';
            default:
                return matchesSearch;
        }
    });

    const getStatusBadge = (ticket) => {
        if (!ticket.is_current_owner) {
            if (ticket.is_on_marketplace) return <span className="bg-orange-500/10 text-orange-600 dark:text-orange-500 px-3 py-1 rounded-full text-[10px] font-black border border-orange-500/20 uppercase">{t('myTickets.status.sold')}</span>;
            return <span className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-500 px-3 py-1 rounded-full text-[10px] font-black border border-indigo-500/20 uppercase">{t('myTickets.status.transferred')}</span>;
        }

        if (ticket.is_on_marketplace) return <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 px-3 py-1 rounded-full text-[10px] font-black border border-emerald-500/20 uppercase">{t('myTickets.status.reselling')}</span>;

        switch (ticket.status) {
            case 'minted':
                return <span className="bg-neon-green/10 text-neon-hover dark:text-neon-green px-3 py-1 rounded-full text-[10px] font-black border border-neon-green/20 uppercase">{t('myTickets.status.available')}</span>;
            case 'used':
                return <span className="bg-gray-500/10 text-gray-500 dark:text-gray-400 px-3 py-1 rounded-full text-[10px] font-black border border-gray-500/20 uppercase">{t('myTickets.status.scanned')}</span>;
            case 'cancelled':
                return <span className="bg-red-500/10 text-red-600 dark:text-red-500 px-3 py-1 rounded-full text-[10px] font-black border border-red-500/20 uppercase">{t('myTickets.status.cancelled')}</span>;
            default:
                return <span className="bg-neon-green/10 text-neon-hover dark:text-neon-green px-3 py-1 rounded-full text-[10px] font-black border border-neon-green/20 uppercase">{ticket.status}</span>;
        }
    };

    const ActionButtons = ({ ticket, view = 'grid' }) => {
        if (!ticket.is_current_owner || ticket.status === 'cancelled') return null;

        const containerClass = view === 'grid' ? "flex gap-2" : "flex flex-col gap-1.5 min-w-[120px]";
        const buttonBaseClass = "flex items-center justify-center gap-2 p-3.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-300 active:scale-95 border border-transparent";
        
        // Kiểm tra xem sự kiện đã diễn ra chưa
        const isPastEvent = new Date(ticket.event.event_date) < new Date();

        // Nếu vé đã quét, hiện nút Viết Blog
        if (ticket.status === 'used') {
            return (
                <div className={containerClass}>
                    <Link 
                        to={`/blog/create?eventId=${ticket.event.id}`}
                        className={`${buttonBaseClass} bg-gray-900 dark:bg-neon-green text-white dark:text-black hover:bg-black dark:hover:bg-neon-hover w-full shadow-lg dark:shadow-neon-green/10`}
                    >
                        <FileText className="w-3.5 h-3.5" />
                        {t('myTickets.buttons.write_blog')}
                    </Link>
                </div>
            );
        }

        return (
            <div className={containerClass}>
                {ticket.is_on_marketplace ? (
                    <Link 
                        to={`/my-tickets/${ticket.id}/resale`}
                        className={`${buttonBaseClass} bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500 hover:text-white border-indigo-500/20 w-full`}
                    >
                        <RefreshCcw className="w-3.5 h-3.5" />
                        {t('myTickets.buttons.edit_listing') || 'Chỉnh sửa bài đăng'}
                    </Link>
                ) : (
                    <>
                        <Link 
                            to={(isPastEvent || !ticket.event.allow_transfer) ? '#' : `/my-tickets/${ticket.id}/transfer`}
                            className={`${buttonBaseClass} bg-gray-900 dark:bg-neon-green/10 text-white dark:text-neon-green hover:bg-black dark:hover:bg-neon-green dark:hover:text-black disabled:opacity-20 transition-all duration-500 border border-transparent dark:border-neon-green/10 ${(isPastEvent || !ticket.event.allow_transfer) ? 'pointer-events-none opacity-20 grayscale' : ''}`}
                        >
                            <Send className="w-3.5 h-3.5" />
                            {t('myTickets.buttons.transfer')}
                        </Link>
                        <Link 
                            to={(isPastEvent || !ticket.event.allow_resale) ? '#' : `/my-tickets/${ticket.id}/resale`}
                            className={`${buttonBaseClass} bg-gray-100 dark:bg-neon-green/5 text-gray-600 dark:text-neon-green/60 hover:bg-gray-200 dark:hover:bg-neon-green dark:hover:text-black disabled:opacity-20 transition-all duration-500 border border-gray-200 dark:border-neon-green/10 ${(isPastEvent || !ticket.event.allow_resale) ? 'pointer-events-none opacity-20 grayscale' : ''}`}
                        >
                            <Tag className="w-3.5 h-3.5" />
                            {t('myTickets.buttons.resale')}
                        </Link>
                    </>
                )}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#050505] text-gray-900 dark:text-white transition-colors duration-500 selection:bg-neon-green/20 font-sans pb-24 overflow-x-hidden">
            {/* Background Decorative Elements */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
                <div className="absolute top-[-10%] right-[-5%] w-[40rem] h-[40rem] bg-[#52c42d]/10 dark:bg-neon-green/5 blur-[120px] rounded-full animate-pulse transition-colors duration-1000"></div>
                <div className="absolute bottom-[-10%] left-[-5%] w-[30rem] h-[30rem] bg-blue-500/10 dark:bg-blue-500/5 blur-[100px] rounded-full transition-colors duration-1000"></div>
                <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] dark:opacity-[0.03]"></div>
            </div>

            <div className="max-w-[1450px] mx-auto px-6 md:px-12 pt-8 space-y-6">
                
                {/* 1. Header Section with Vault Stats */}
                <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-6 duration-700">
                        <div className="space-y-1">
                            <h1 className="text-xl md:text-3xl font-black uppercase leading-tight">
                                {t('myTickets.header.title')}</h1>
                            <p className="text-[13px] text-gray-700 dark:text-gray-400 font-medium max-w-lg leading-relaxed">
                                {t('myTickets.header.subtitle')}
                            </p>
                        </div>
                    </div>

                    {/* Vault Stats Bar */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/5 rounded-2xl shadow-sm dark:shadow-none backdrop-blur-xl animate-in fade-in slide-in-from-bottom-10 duration-1000 w-full lg:w-auto">
                        <div className="px-5 py-3 border-r border-gray-100 dark:border-white/5 last:border-0">
                            <p className="text-[9px] font-black text-gray-500 dark:text-gray-400 mb-1 uppercase">{t('myTickets.stats.total')}</p>
                            <h4 className="text-lg font-black text-gray-900 dark:text-white">
                                {tickets.filter(t_item => t_item.is_current_owner && !t_item.is_on_marketplace).length}
                            </h4>
                        </div>
                        <div className="px-5 py-3 border-r border-gray-100 dark:border-white/5 last:border-0">
                            <p className="text-[9px] font-black text-gray-500 dark:text-gray-400 mb-1 uppercase">{t('myTickets.stats.upcoming')}</p>
                            <h4 className="text-lg font-black text-neon-green">
                                {tickets.filter(t_item => new Date(t_item.event.event_date) >= new Date() && t_item.is_current_owner && t_item.status === 'minted' && !t_item.is_on_marketplace).length}
                            </h4>
                        </div>
                        <div className="px-5 py-3 border-r border-gray-100 dark:border-white/5 last:border-0">
                            <p className="text-[9px] font-black text-gray-500 dark:text-gray-400 mb-1 uppercase">{t('myTickets.stats.transferred')}</p>
                            <h4 className="text-lg font-black text-indigo-500 dark:text-indigo-400">
                                {tickets.filter(t_item => t_item.is_original_buyer && !t_item.is_current_owner && !t_item.was_sold_on_marketplace).length}
                            </h4>
                        </div>
                        <div className="px-5 py-3 border-r border-gray-100 dark:border-white/5 last:border-0">
                            <p className="text-[9px] font-black text-gray-500 dark:text-gray-400 mb-1 uppercase">{t('myTickets.stats.sold')}</p>
                            <h4 className="text-lg font-black text-orange-500 dark:text-orange-400">
                                {tickets.filter(t_item => t_item.is_original_buyer && !t_item.is_current_owner && t_item.was_sold_on_marketplace).length}
                            </h4>
                        </div>
                    </div>
                </header>

                {/* 2. Controls Section: Search & View Modes */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-1 bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/5 rounded-2xl shadow-sm dark:shadow-none backdrop-blur-md">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-600 group-focus-within:text-neon-green transition-colors" />
                        <input 
                            type="text"
                            placeholder={t('myTickets.controls.search_placeholder')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-5 py-3 bg-transparent text-[13px] font-medium border-0 focus:ring-0 placeholder:text-gray-500 dark:placeholder:text-gray-700 text-gray-900 dark:text-white"
                        />
                    </div>
                    
                    <div className="flex items-center gap-1.5 pr-2">
                        <div className="h-8 w-px bg-gray-200 dark:bg-white/10 hidden md:block mr-2"></div>
                        <button 
                            onClick={() => setViewMode('grid')}
                            className={`p-2.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-neon-green text-black shadow-lg shadow-neon-green/10' : 'text-gray-500 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'}`}
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => setViewMode('list')}
                            className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-neon-green text-black shadow-lg shadow-neon-green/10' : 'text-gray-500 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'}`}
                        >
                            <List className="w-4 h-4" />
                        </button>
                    </div>
                </div>


                {/* 3. Categories Tab Bar */}
                <div className="no-scrollbar overflow-x-auto">
                    <div className="flex gap-2 p-1 bg-white dark:bg-white/[0.01] border border-gray-200 dark:border-white/5 rounded-xl w-max shadow-sm dark:shadow-none">
                        {[
                            { id: 'all', label: t('myTickets.tabs.all') },
                            { id: 'upcoming', label: t('myTickets.tabs.upcoming') },
                            { id: 'past', label: t('myTickets.tabs.past') },
                            { id: 'reselling', label: t('myTickets.tabs.reselling') },
                            { id: 'transferred', label: t('myTickets.tabs.transferred') },
                            { id: 'sold', label: t('myTickets.tabs.sold') },
                            { id: 'cancelled', label: t('myTickets.tabs.cancelled') },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2.5 px-5 py-2.5 rounded-lg text-[10px] font-black uppercase transition-all duration-300 ${
                                    activeTab === tab.id 
                                    ? 'bg-neon-green text-black shadow-lg shadow-neon-green/20' 
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 4. Content Area */}
                <main className="min-h-[40rem]">
                    {loading ? (
                        <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "space-y-4"}>
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                <div key={i} className={`bg-white/[0.03] border border-white/5 rounded-[1.75rem] animate-pulse ${viewMode === 'grid' ? 'h-[28rem]' : 'h-24'}`}></div>
                            ))}
                        </div>
                    ) : filteredTickets.length > 0 ? (
                        viewMode === 'grid' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {filteredTickets.map((ticket, idx) => (
                                    <div 
                                        key={ticket.id}
                                        className="group bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/5 rounded-[1.75rem] overflow-hidden hover:border-neon-green/20 dark:hover:border-neon-green/20 transition-all duration-500 shadow-sm hover:shadow-xl dark:shadow-none flex flex-col relative animate-in fade-in slide-in-from-bottom-6"
                                        style={{ animationDelay: `${idx * 40}ms` }}
                                    >
                                        {/* Image Section */}
                                        <div className="relative aspect-[4/3] overflow-hidden">
                                            <img 
                                                src={ticket.event.image_url} 
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" 
                                                alt={ticket.event.title}
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-[#050505] via-white/10 dark:via-black/10 to-transparent"></div>
                                            
                                            {/* Top Badges */}
                                            <div className="absolute top-4 left-4 flex flex-col gap-1.5">
                                                {getStatusBadge(ticket)}
                                                {ticket.is_original_buyer && !ticket.is_current_owner && (
                                                    <span className="bg-blue-500/10 backdrop-blur-md text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded-full text-[8.5px] font-black border border-blue-500/20 uppercase">{t('myTickets.status.history')}</span>
                                                )}
                                            </div>

                                            {/* Bottom Info Overlay */}
                                            <div className="absolute bottom-4 left-5 right-5">
                                                <div className="flex items-center gap-1.5 mb-1.5 text-neon-hover dark:text-neon-green">
                                                    <Calendar className="w-3 h-3" />
                                                    <span className="text-[9px] font-black">
                                                        {new Date(ticket.event.event_date).toLocaleDateString('vi-VN')}
                                                    </span>
                                                </div>
                                                <h3 className="text-sm uppercase font-black text-gray-900 dark:text-white leading-tight truncate group-hover:text-neon-green transition-colors">{ticket.event.title}</h3>
                                            </div>
                                        </div>

                                        {/* Ticket Stub Design (Separation line) */}
                                        <div className="relative h-4 flex items-center justify-between px-[-6px]">
                                            <div className="w-4 h-4 bg-gray-50 dark:bg-[#050505] rounded-full -ml-2 border border-gray-200 dark:border-white/5"></div>
                                            <div className="flex-1 border-t border-dashed border-gray-200 dark:border-white/10 mx-1"></div>
                                            <div className="w-4 h-4 bg-gray-50 dark:bg-[#050505] rounded-full -mr-2 border border-gray-200 dark:border-white/5"></div>
                                        </div>

                                        {/* Bottom Detail Section */}
                                        <div className="p-5 pt-1 space-y-3 flex-1 flex flex-col justify-between">
                                            {/* Info Grid */}
                                            <div className="grid grid-cols-2 gap-x-5 gap-y-3">
                                                <div className="space-y-0.5">
                                                    <p className="text-[8.5px] font-black text-gray-500 dark:text-gray-400 uppercase">{t('myTickets.labels.tier')}</p>
                                                    <p className="text-[12px] font-bold text-gray-800 dark:text-gray-300 truncate tracking-tight">{ticket.ticket_tier.tier_name}</p>
                                                </div>
                                                <div className="space-y-0.5">
                                                    <p className="text-[8.5px] font-black text-gray-500 dark:text-gray-400 uppercase">{t('myTickets.labels.location')}</p>
                                                    <p className="text-[12px] font-bold text-neon-hover dark:text-neon-green truncate tracking-tight">{ticket.ticket_tier.section_name || t('myTickets.labels.general_area')}</p>
                                                </div>
                                                <div className="space-y-0.5">
                                                    <p className="text-[8.5px] font-black text-gray-500 dark:text-gray-400 uppercase">{t('myTickets.labels.ticket_no')}</p>
                                                    <p className="text-[12px] font-bold text-gray-800 dark:text-gray-300 tracking-tight">#{ticket.ticket_number}</p>
                                                </div>
                                                <div className="space-y-0.5">
                                                    <p className="text-[8.5px] font-black text-gray-500 dark:text-gray-400 uppercase">{t('myTickets.labels.nft_price')}</p>
                                                    <p className="text-[12px] font-black text-indigo-600 dark:text-blue-400 tracking-tight">{(ticket.ticket_tier.price || 0).toLocaleString()} ₫</p>
                                                </div>
                                            </div>

                                            {/* Action Area */}
                                            <div className="space-y-2">
                                                <ActionButtons ticket={ticket} />
                                                
                                                <div className="flex gap-2">
                                                    {ticket.is_current_owner && (
                                                        <button 
                                                            disabled={ticket.status === 'used' || ticket.status === 'cancelled' || ticket.is_on_marketplace}
                                                            onClick={() => handleViewQr(ticket)}
                                                            className="flex-1 h-11 bg-gray-900 dark:bg-white hover:bg-neon-green text-white dark:text-black rounded-xl text-[10px] font-black uppercase transition-all duration-300 flex items-center justify-center gap-2 group/qr active:scale-95 disabled:opacity-20"
                                                        >
                                                            <QrCode className="w-4 h-4 group-hover/qr:rotate-12 transition-transform" />
                                                            {ticket.is_on_marketplace ? t('myTickets.buttons.locked') : t('myTickets.buttons.use_ticket')}
                                                        </button>
                                                    )}
                                                    <Link 
                                                        to={`/my-transactions/${ticket.order_id}`}
                                                        className="h-11 px-4 bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/5 text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl flex items-center justify-center transition-all"
                                                        title={t('myTickets.buttons.view_nft')}
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </Link>
                                                    <Link 
                                                        to={`/events/${ticket.event_id}`}
                                                        className="h-11 px-4 bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl flex items-center justify-center transition-all"
                                                        title={t('myTickets.buttons.view_event')}
                                                    >
                                                        <ExternalLink className="w-4 h-4" />
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Security Ribbon */}
                                        <div className="bg-gray-50 dark:bg-white/[0.01] px-5 py-2.5 border-t border-gray-200 dark:border-white/5 flex items-center justify-between">
                                            <div className="flex items-center gap-1.5">
                                                <Shield className="w-3 h-3 text-blue-500/50" />
                                                <span className="text-[8.5px] font-black text-gray-500 dark:text-gray-400 uppercase">{t('myTickets.security.polygon')}</span>
                                            </div>
                                            <span className="text-[8.5px] font-black text-gray-400 dark:text-gray-600">Ver. 2.0.4</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {filteredTickets.map((ticket, idx) => (
                                    <div 
                                        key={ticket.id}
                                        className="group bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/5 p-4 rounded-2xl hover:border-gray-300 dark:hover:border-white/10 transition-all flex flex-col md:flex-row md:items-center gap-5 md:gap-8 shadow-sm animate-in fade-in"
                                        style={{ animationDelay: `${idx * 30}ms` }}
                                    >
                                        <div className="w-full md:w-40 h-24 md:h-16 rounded-xl overflow-hidden shrink-0 relative">
                                            <img src={ticket.event.image_url} className="w-full h-full object-cover" alt="" />
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[1px]">
                                                {getStatusBadge(ticket)}
                                            </div>
                                        </div>
                                        
                                        <div className="flex-1 min-w-0 space-y-1">
                                            <div className="flex items-center gap-2.5">
                                                <p className="text-[9px] font-black text-neon-hover dark:text-neon-green">{new Date(ticket.event.event_date).toLocaleDateString()} • {ticket.event.event_time}</p>
                                                <span className="text-gray-400 dark:text-gray-700 text-[9px]">/</span>
                                                <p className="text-[9px] font-black text-gray-600 dark:text-gray-500">Token ID: {ticket.token_id || 'NFT-GEN-00'}</p>
                                            </div>
                                            <h3 className="text-[16px] font-black text-gray-900 dark:text-white truncate group-hover:text-neon-green transition-colors">{ticket.event.title}</h3>
                                            <div className="flex flex-wrap items-center gap-y-1 gap-x-5">
                                                <div className="flex items-center gap-2 text-[10.5px] font-black text-gray-700 dark:text-gray-400">
                                                    <Tag className="w-3.5 h-3.5 text-neon-green/40" />
                                                    {ticket.ticket_tier.tier_name}
                                                </div>
                                                <div className="flex items-center gap-2 text-[10.5px] font-black text-gray-700 dark:text-gray-400">
                                                    <MapPin className="w-3.5 h-3.5 text-blue-500/40" />
                                                    {ticket.ticket_tier.section_name || 'Sân vận động chính'}
                                                </div>
                                                <div className="flex items-center gap-2 text-[10.5px] font-black text-gray-700 dark:text-gray-400">
                                                    <DollarSign className="w-3.5 h-3.5 text-emerald-500/40" />
                                                    {(ticket.ticket_tier.price || 0).toLocaleString()} ₫
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-row md:flex-col lg:flex-row items-center gap-2.5 md:mt-0 pt-2 md:pt-0 border-t md:border-t-0 border-gray-100 dark:border-white/5">
                                            <ActionButtons ticket={ticket} view="list" />
                                            <div className="flex gap-2">
                                                {ticket.is_current_owner && (
                                                    <button 
                                                        onClick={() => handleViewQr(ticket)}
                                                        className="h-9 px-5 bg-gray-900 dark:bg-neon-green text-white dark:text-black rounded-xl hover:brightness-105 active:scale-95 transition-all disabled:opacity-20"
                                                        disabled={ticket.status === 'used' || ticket.status === 'cancelled' || ticket.is_on_marketplace}
                                                    >
                                                        <QrCode className="w-4.5 h-4.5" />
                                                    </button>
                                                )}
                                                <Link 
                                                    to={`/my-transactions/${ticket.order_id}`}
                                                    className="h-9 px-5 bg-gray-100 dark:bg-white/[0.03] border border-gray-200 dark:border-white/5 text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 rounded-xl flex items-center justify-center transition-all"
                                                    title="Xem chi tiết vé NFT"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Link>
                                                <Link 
                                                    to={`/events/${ticket.event_id}`}
                                                    className="h-9 px-4 bg-gray-100 dark:bg-white/[0.03] border border-gray-200 dark:border-white/5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-xl flex items-center justify-center transition-all"
                                                    title="Xem trang sự kiện"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    ) : (
                        <div className="relative group bg-white/[0.01] border border-dashed border-white/10 rounded-[2.5rem] p-20 md:p-24 text-center animate-in zoom-in-95 duration-700">
                            <div className="absolute inset-0 bg-neon-green/5 blur-[80px] rounded-full -z-10"></div>
                            <div className="w-24 h-24 bg-white/[0.02] border border-white/5 rounded-full flex items-center justify-center mx-auto mb-8">
                                <Ticket className="w-10 h-10 text-white opacity-20" />
                            </div>
                            <div className="space-y-3 max-w-xs mx-auto">
                                <h3 className="text-xl font-black text-white uppercase leading-none">{t('myTickets.empty.title')}</h3>
                                <p className="text-[12px] text-gray-600 font-medium leading-relaxed opacity-70">
                                    {t('myTickets.empty.desc')}
                                </p>
                            </div>
                            <div className="mt-8">
                                <Link 
                                    to="/events"
                                    className="inline-flex items-center gap-3 bg-neon-green text-black px-8 py-4 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-neon-green/10 hover:scale-105 active:scale-95 transition-all"
                                >
                                    {t('myTickets.empty.btn')}
                                    <Sparkles className="w-3.5 h-3.5" />
                                </Link>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* Premium QR View Modal - Khắc phục lỗi cuộn (Scrollable) */}
            {showQrModal && selectedTicket && (
                <div className="fixed inset-0 z-[100] overflow-y-auto outline-none focus:outline-none">
                    {/* Backdrop */}
                    <div 
                        className="fixed inset-0 bg-black/80 dark:bg-black/95 backdrop-blur-md animate-in fade-in duration-500" 
                        onClick={() => setShowQrModal(false)}
                    ></div>
                    
                    {/* Modal Wrapper - Căn giữa nhưng vẫn cho phép cuộn */}
                    <div className="flex min-h-full items-center justify-center p-4 sm:p-6 cursor-default">
                        <div className="relative bg-white dark:bg-[#0c0c0d] w-full max-w-sm rounded-[2.5rem] overflow-hidden shadow-2xl border border-gray-200 dark:border-white/5 animate-in zoom-in-95 duration-300">
                            
                            {/* Header - Xanh Neon rực rỡ */}
                            <div className="bg-neon-green px-7 py-5 text-black relative">
                                <button 
                                    onClick={() => setShowQrModal(false)}
                                    className="absolute top-6 right-6 p-2 bg-black/5 hover:bg-black/10 rounded-full transition-all active:scale-90"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                                
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="bg-black/10 px-3 py-1 rounded-full text-[8.5px] font-black border border-black/5 uppercase tracking-wider">{selectedTicket.ticket_tier.tier_name}</span>
                                    <span className="bg-black/10 px-3 py-1 rounded-full text-[8.5px] font-black border border-black/5 uppercase tracking-wider">#{selectedTicket.ticket_number}</span>
                                </div>
                                
                                <h2 className="text-[20px] font-black leading-tight uppercase mb-2 pr-10 tracking-tight">{selectedTicket.event.title}</h2>
                                <div className="flex items-center gap-2 opacity-70">
                                    <MapPin className="w-3 h-3" />
                                    <span className="text-[9px] font-black truncate">{selectedTicket.event.location_address}</span>
                                </div>
                            </div>

                            <div className="px-8 pb-4 space-y-7 flex flex-col items-center">
                                {isScanned ? (
                                    /* Giao diện Xác thực Thành công */
                                    <div className="w-full py-6 flex flex-col items-center text-center space-y-6 animate-in zoom-in-95 duration-500">
                                        <div className="relative">
                                            <div className="absolute inset-0 bg-neon-green/20 blur-[40px] rounded-full animate-pulse"></div>
                                            <div className="relative w-24 h-24 bg-neon-green text-black rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(57,255,20,0.4)]">
                                                <CheckCircle2 className="w-12 h-12 stroke-[3px] animate-bounce" />
                                            </div>
                                            <div className="absolute -top-4 -right-4">
                                                <PartyPopper className="w-8 h-8 text-neon-hover dark:text-neon-green animate-bounce delay-100" />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <h3 className="text-[22px] font-black text-neon-hover dark:text-neon-green uppercase tracking-tighter leading-none">
                                                {t('myTickets.qr_modal.success_title') || 'XÁC THỰC THÀNH CÔNG'}
                                            </h3>
                                            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest">
                                                {t('myTickets.qr_modal.success_subtitle') || 'Chúc bạn có một sự kiện tuyệt vời!'}
                                            </p>
                                        </div>

                                        <div className="w-full p-5 bg-neon-green/5 rounded-2xl border border-neon-green/10 space-y-3">
                                            <div className="flex justify-between items-center text-[9px] font-black uppercase text-gray-500">
                                                <span>{t('myTickets.labels.ticket_no')}</span>
                                                <span className="text-gray-900 dark:text-white">#{selectedTicket?.ticket_number}</span>
                                            </div>
                                            <div className="h-[1px] bg-neon-green/10"></div>
                                            <div className="flex justify-center text-[10px] font-black text-neon-hover dark:text-neon-green">
                                                POLYGON BLOCKCHAIN VERIFIED
                                            </div>
                                        </div>

                                        <button 
                                            onClick={() => setShowQrModal(false)}
                                            className="w-full py-4 bg-gray-900 dark:bg-white dark:text-black text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl"
                                        >
                                            {t('common.close') || 'Đóng'}
                                        </button>
                                    </div>
                                ) : (
                                    /* Giao diện Mã QR (Ban đầu) */
                                    <>
                                        {/* QR Frame */}
                                        <div className="relative w-full aspect-square max-w-[220px] mt-4">
                                            <div className="w-full h-full bg-gray-50 dark:bg-white/[0.02] rounded-[2.5rem] flex items-center justify-center border border-gray-200 dark:border-white/5 p-4 relative overflow-hidden">
                                                {qrLoading ? (
                                                    <Loader2 className="w-10 h-10 text-neon-green animate-spin" />
                                                ) : qrCodeData ? (
                                                    <div className="w-full h-full bg-white rounded-[2rem] p-5 relative shadow-xl">
                                                        <QRCodeSVG 
                                                            value={qrCodeData} 
                                                            size={256}
                                                            level="H"
                                                            includeMargin={false}
                                                            className="w-full h-full"
                                                        />
                                                    </div>
                                                ) : (
                                                    <AlertCircle className="w-10 h-10 text-red-500/50" />
                                                )}

                                                {countdown === 0 && !qrLoading && (
                                                    <div className="absolute inset-0 bg-white/95 dark:bg-black/98 flex flex-col items-center justify-center p-6 text-center space-y-4 rounded-[2rem] backdrop-blur-md">
                                                        <RefreshCcw className="w-8 h-8 text-neon-hover dark:text-neon-green/40" />
                                                        <div className="space-y-1">
                                                            <p className="text-sm font-black text-gray-900 dark:text-white uppercase">{t('myTickets.qr_modal.expired')}</p>
                                                            <p className="text-[8px] text-gray-600 dark:text-gray-500 font-bold leading-relaxed">{t('myTickets.qr_modal.expired_desc')}</p>
                                                        </div>
                                                        <button 
                                                            onClick={() => generateQr(selectedTicket.id)}
                                                            className="bg-neon-green text-black px-6 py-2.5 rounded-xl text-[9px] font-black uppercase active:scale-95 transition-all shadow-lg shadow-neon-green/20"
                                                        >
                                                            {t('myTickets.qr_modal.refresh_btn')}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Timer & Progress */}
                                        {countdown > 0 && (
                                            <div className="w-full flex flex-col items-center gap-4">
                                                <div className="flex items-center gap-2.5">
                                                    <Clock className="w-3.5 h-3.5 text-neon-hover dark:text-neon-green" />
                                                    <span className="text-[11px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-tight">
                                                        {t('myTickets.qr_modal.countdown')}: <span className="text-neon-green tabular-nums">{countdown}s</span>
                                                    </span>
                                                </div>
                                                <div className="w-48 h-1 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                                                    <div 
                                                        className={`h-full transition-all duration-1000 ease-linear ${countdown < 10 ? 'bg-red-500' : 'bg-neon-green'}`}
                                                        style={{ width: `${(countdown / 60) * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* Blockchain Verification Button */}
                                        <button
                                            onClick={() => window.open(`https://amoy.polygonscan.com/tx/${selectedTicket.nft_mint_tx_hash}`, '_blank')}
                                            className="w-full h-12 flex items-center justify-between px-6 bg-gray-50 dark:bg-white/[0.03] rounded-2xl hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-all text-gray-600 hover:text-neon-hover dark:hover:text-neon-green group border border-gray-200 dark:border-white/5 shadow-sm"
                                        >
                                            <div className="flex items-center gap-3">
                                                <LucideGrid className="w-4 h-4 text-blue-500/50" />
                                                <span className="text-[10px] font-black text-gray-600 dark:text-gray-400 uppercase tracking-widest group-hover:text-inherit transition-colors">{t('myTickets.security.verification')}</span>
                                            </div>
                                            <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-1" />
                                        </button>
                                    </>
                                )}
                            </div>

                            {/* Footer với Background đậm hơn */}
                            <div className="px-8 py-5 bg-gray-100 dark:bg-black/60 text-center border-t border-gray-200 dark:border-white/5">
                                <p className="text-[8.5px] text-gray-700 dark:text-gray-500 font-bold leading-relaxed uppercase">
                                    {t('myTickets.qr_modal.disclaimer')}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Modal Chỉnh sửa bài đăng đã được thay thế bằng trang ResaleTicket */}
        </div>
    );
};

export default MyTickets;

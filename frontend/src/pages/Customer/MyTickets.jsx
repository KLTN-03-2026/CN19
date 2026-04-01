import React, { useState, useEffect } from 'react';
import { 
    Ticket, 
    Calendar, 
    MapPin, 
    Search, 
    Filter, 
    ChevronRight, 
    Clock, 
    QrCode, 
    RefreshCcw, 
    ExternalLink, 
    ArrowRightLeft, 
    Tag,
    History,
    AlertCircle,
    Loader2,
    LayoutGrid,
    List,
    DollarSign,
    XCircle,
    CheckCircle2,
    Send,
    FileText,
    Shield,
    Grid
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { ticketService } from '../../services/ticket.service';
import { userService } from '../../services/user.service';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const MyTickets = () => {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('upcoming'); // 'all', 'upcoming', 'transferred', 'sold', 'reselling', 'cancelled', 'rescheduled'
    const [viewMode, setViewMode] = useState('grid'); // 'grid', 'list'
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [showQrModal, setShowQrModal] = useState(false);
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [receiverEmail, setReceiverEmail] = useState('');
    const [receiverInfo, setReceiverInfo] = useState(null);
    const [isCheckingEmail, setIsCheckingEmail] = useState(false);
    const [isTransferring, setIsTransferring] = useState(false);
    const [qrCodeData, setQrCodeData] = useState(null);
    const [qrLoading, setQrLoading] = useState(false);
    const [countdown, setCountdown] = useState(0);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (receiverEmail && receiverEmail.includes('@')) {
                checkReceiver(receiverEmail);
            } else {
                setReceiverInfo(null);
            }
        }, 500); // 500ms debounce
        return () => clearTimeout(timeoutId);
    }, [receiverEmail]);

    const checkReceiver = async (email) => {
        try {
            setIsCheckingEmail(true);
            const res = await userService.findByEmail(email);
            setReceiverInfo(res.data);
        } catch (error) {
            setReceiverInfo(null);
        } finally {
            setIsCheckingEmail(false);
        }
    };

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        try {
            setLoading(true);
            const res = await ticketService.getMyTickets();
            setTickets(res.data || []);
        } catch (error) {
            toast.error('Không thể tải danh sách vé.');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleViewQr = async (ticket) => {
        if (!ticket.is_current_owner) {
            toast.error('Bạn không còn sở hữu vé này.');
            return;
        }
        if (ticket.status === 'used' || ticket.status === 'cancelled') {
            toast.error('Vé không khả dụng để xác thực.');
            return;
        }
        setSelectedTicket(ticket);
        setShowQrModal(true);
        generateQr(ticket.id);
    };

    const handleOpenTransfer = (ticket) => {
        setSelectedTicket(ticket);
        setReceiverEmail('');
        setShowTransferModal(true);
    };

    const handleTransfer = async () => {
        if (!receiverEmail) {
            toast.error('Vui lòng nhập email người nhận.');
            return;
        }
        
        try {
            setIsTransferring(true);
            const res = await ticketService.transferTicket(selectedTicket.id, receiverEmail);
            toast.success(res.message || 'Chuyển nhượng vé thành công!');
            setShowTransferModal(false);
            fetchTickets(); // Refresh list to reflect ownership change
        } catch (error) {
            toast.error(error.response?.data?.error || 'Lỗi khi chuyển nhượng vé.');
        } finally {
            setIsTransferring(false);
        }
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
            toast.error(error.response?.data?.error || 'Không thể lấy mã QR.');
            setShowQrModal(false);
        } finally {
            setQrLoading(false);
        }
    };

    useEffect(() => {
        let timer;
        if (showQrModal && countdown > 0) {
            timer = setInterval(() => {
                setCountdown(prev => prev - 1);
            }, 1000);
        } else if (countdown === 0 && showQrModal && selectedTicket) {
            // TỰ ĐỘNG LÀM MỚI KHI HẾT HẠN - Đây mới là QR Động thực sự
            generateQr(selectedTicket.id);
        }
        return () => clearInterval(timer);
    }, [showQrModal, countdown, selectedTicket]);

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
                return matchesSearch && ticket.is_original_buyer && !ticket.is_current_owner && !ticket.is_on_marketplace;
            case 'sold': 
                return matchesSearch && ticket.is_original_buyer && !ticket.is_current_owner && ticket.is_on_marketplace;
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
            if (ticket.is_on_marketplace) return <span className="bg-orange-500/10 text-orange-500 px-3 py-1 rounded-full text-[10px] font-black uppercase border border-orange-500/20">Đã bán</span>;
            return <span className="bg-indigo-500/10 text-indigo-500 px-3 py-1 rounded-full text-[10px] font-black uppercase border border-indigo-500/20">Đã chuyển</span>;
        }

        if (ticket.is_on_marketplace) return <span className="bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full text-[10px] font-black uppercase border border-emerald-500/20">Đang đăng bán</span>;

        switch (ticket.status) {
            case 'minted':
                return <span className="bg-neon-green/10 text-neon-green px-3 py-1 rounded-full text-[10px] font-black uppercase border border-neon-green/20">Khả dụng</span>;
            case 'used':
                return <span className="bg-gray-500/10 text-gray-400 px-3 py-1 rounded-full text-[10px] font-black uppercase border border-gray-500/20">Đã quét</span>;
            case 'cancelled':
                return <span className="bg-red-500/10 text-red-500 px-3 py-1 rounded-full text-[10px] font-black uppercase border border-red-500/20">Bị hủy</span>;
            default:
                return <span className="bg-neon-green/10 text-neon-green px-3 py-1 rounded-full text-[10px] font-black uppercase border border-neon-green/20">{ticket.status}</span>;
        }
    };

    const ActionButtons = ({ ticket, view = 'grid' }) => {
        if (!ticket.is_current_owner || ticket.status === 'cancelled') return null;

        const containerClass = view === 'grid' ? "flex gap-2" : "flex flex-col gap-1.5 min-w-[120px]";
        const buttonBaseClass = "flex items-center justify-center gap-2 p-3.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-300 active:scale-95 border border-transparent";

        // Nếu vé đã quét, hiện nút Viết Blog
        if (ticket.status === 'used') {
            return (
                <div className={containerClass}>
                    <Link 
                        to={`/blog/create?eventId=${ticket.event.id}`}
                        className={`${buttonBaseClass} bg-neon-green text-black hover:bg-neon-hover w-full`}
                    >
                        <FileText className="w-3.5 h-3.5" />
                        Viết blog
                    </Link>
                </div>
            );
        }

        return (
            <div className={containerClass}>
                <button 
                    disabled={!ticket.event.allow_transfer || ticket.is_on_marketplace}
                    className={`${buttonBaseClass} bg-neon-green/10 text-neon-green hover:bg-neon-green hover:text-black disabled:opacity-20 transition-all duration-500`}
                    onClick={() => handleOpenTransfer(ticket)}
                >
                    <Send className="w-3.5 h-3.5" />
                    {!ticket.is_on_marketplace ? 'Chuyển' : 'Đã khóa'}
                </button>
                <Link 
                    to={(!ticket.event.allow_resale || ticket.is_on_marketplace) ? '#' : `/my-tickets/${ticket.id}/resale`}
                    className={`${buttonBaseClass} bg-neon-green/5 text-neon-green/60 hover:bg-neon-green hover:text-black disabled:opacity-20 transition-all duration-500 border border-neon-green/10 ${(!ticket.event.allow_resale || ticket.is_on_marketplace) ? 'pointer-events-none opacity-20' : ''}`}
                >
                    <Tag className="w-3.5 h-3.5" />
                    {!ticket.is_on_marketplace ? 'Bán lại' : 'Đã đăng'}
                </Link>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-bg transition-colors duration-500 flex flex-col pt-24 pb-20 px-4 sm:px-8 relative overflow-hidden">
            <div className="max-w-[1400px] mx-auto space-y-10 relative z-10 w-full">
                {/* Header Section */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 text-neon-green font-black uppercase tracking-[0.2em] text-[10px] bg-neon-green/5 px-4 py-2 rounded-full border border-neon-green/20">
                            <History className="w-3.5 h-3.5" />
                            <span>Vault / Tài sản số</span>
                        </div>
                        <h1 className="text-6xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none">Vé của tôi</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium tracking-wide">Quản lý toàn bộ lịch sử vé NFT của bạn: <span className="text-neon-green font-black">{tickets.length} lượt sở hữu</span>.</p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                        {/* Search & Filter */}
                        <div className="flex gap-4 flex-1 sm:flex-initial">
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input 
                                    type="text"
                                    placeholder="Tìm sự kiện..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-2xl py-3.5 pl-12 pr-6 text-sm focus:outline-none focus:ring-4 focus:ring-neon-green/10 focus:border-neon-green transition-all w-full sm:w-64 dark:text-white"
                                />
                            </div>
                            <div className="flex p-1.5 bg-gray-200/50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-dark-border shadow-inner">
                                <button 
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-neon-green text-neon-hover dark:text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
                                >
                                    <LayoutGrid className="w-5 h-5" />
                                </button>
                                <button 
                                    onClick={() => setViewMode('list')}
                                    className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white dark:bg-neon-green text-neon-hover dark:text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
                                >
                                    <List className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Categories Tab Bar */}
                <div className="no-scrollbar overflow-x-auto pb-2">
                    <div className="flex gap-3 p-2 bg-gray-200/30 dark:bg-white/5 rounded-[2rem] w-max border border-gray-100 dark:border-dark-border backdrop-blur-xl shadow-inner">
                        {[
                            { id: 'all', label: 'Tất cả', icon: History },
                            { id: 'upcoming', label: 'Sắp diễn ra', icon: Calendar },
                            { id: 'past', label: 'Đã diễn ra', icon: CheckCircle2 },
                            { id: 'transferred', label: 'Đã chuyển nhượng', icon: Send },
                            { id: 'sold', label: 'Vé đã bán', icon: DollarSign },
                            { id: 'reselling', label: 'Đang đăng bán', icon: Tag },
                            { id: 'cancelled', label: 'Vé đã hủy', icon: XCircle },
                            { id: 'rescheduled', label: 'Bị dời lịch', icon: Clock },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2.5 px-6 py-3.5 rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest transition-all duration-300 relative group overflow-hidden ${
                                    activeTab === tab.id 
                                    ? 'bg-white dark:bg-neon-green text-neon-hover dark:text-black shadow-xl shadow-neon-green/20' 
                                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-white/10'
                                }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                                {activeTab === tab.id && (
                                    <div className="absolute inset-0 bg-neon-green blur-xl opacity-20 -z-10"></div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content Area */}
                {loading ? (
                    <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8" : "space-y-4"}>
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className={viewMode === 'grid' ? "h-[30rem] bg-gray-200 dark:bg-dark-card rounded-[3.5rem] animate-pulse" : "h-24 bg-gray-200 dark:bg-dark-card rounded-3xl animate-pulse"}></div>
                        ))}
                    </div>
                ) : filteredTickets.length > 0 ? (
                    viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
                            {filteredTickets.map((ticket) => (
                                <div 
                                    key={ticket.id}
                                    className="group bg-white dark:bg-dark-card rounded-[3.5rem] overflow-hidden border border-gray-200 dark:border-dark-border hover:border-neon-green/40 transition-all duration-700 shadow-sm hover:shadow-[0_0_80px_rgba(82,196,45,0.08)] flex flex-col relative"
                                >
                                    {/* Event Banner */}
                                    <div className="relative aspect-[4/3] overflow-hidden">
                                        <img 
                                            src={ticket.event.image_url} 
                                            alt={ticket.event.title}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[2000ms] grayscale-[30%] group-hover:grayscale-0" 
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
                                        <div className="absolute top-6 left-6 flex flex-col gap-2">
                                            {getStatusBadge(ticket)}
                                            {ticket.is_original_buyer && !ticket.is_current_owner && (
                                                <span className="bg-black/40 backdrop-blur-md text-white/60 px-3 py-1 rounded-full text-[8px] font-bold uppercase tracking-widest border border-white/10">Lịch sử sở hữu</span>
                                            )}
                                        </div>
                                        <div className="absolute bottom-6 left-6 right-6">
                                            <p className="text-[10px] font-black text-neon-green uppercase tracking-[0.3em] mb-2">
                                                {new Date(ticket.event.event_date).toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric', year: 'numeric' })} • {ticket.event.event_time}
                                            </p>
                                            <h3 className="text-xl font-black text-white uppercase leading-tight line-clamp-1 drop-shadow-xl">{ticket.event.title}</h3>
                                        </div>
                                    </div>

                                    {/* Ticket Info */}
                                    <div className="p-8 space-y-6 flex-1 flex flex-col">
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="p-4 bg-gray-50/50 dark:bg-white/[0.02] rounded-2xl border border-gray-100 dark:border-dark-border">
                                                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1.5 opacity-60">Hạng vé</p>
                                                    <p className="text-[11px] font-black text-gray-900 dark:text-white uppercase truncate">{ticket.ticket_tier.tier_name}</p>
                                                </div>
                                                <div className="p-4 bg-gray-50/50 dark:bg-white/[0.02] rounded-2xl border border-gray-100 dark:border-dark-border">
                                                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1.5 opacity-60">Vị trí</p>
                                                    <p className="text-[11px] font-black text-neon-green uppercase truncate">{ticket.ticket_tier.section_name || 'GENERAL'}</p>
                                                </div>
                                            </div>
                                            <ActionButtons ticket={ticket} />
                                        </div>

                                        <div className="mt-auto pt-6 flex gap-3">
                                            {ticket.is_current_owner && (
                                                <button 
                                                    disabled={ticket.status === 'used' || ticket.status === 'cancelled'}
                                                    onClick={() => handleViewQr(ticket)}
                                                    className="flex-1 bg-neon-green hover:bg-neon-hover text-black py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-neon-green/20 active:scale-95 group/val disabled:opacity-30"
                                                >
                                                    <QrCode className="w-4 h-4 group-hover/val:rotate-12 transition-transform" />
                                                    Số hóa vé
                                                </button>
                                            )}
                                            <Link 
                                                to={`/events/${ticket.event_id}`}
                                                className="p-4 bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:text-neon-green border border-gray-200 dark:border-dark-border rounded-2xl transition-all group/link"
                                            >
                                                <History className="w-5 h-5 group-hover/link:rotate-y-180 transition-transform duration-500" />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredTickets.map((ticket) => (
                                <div 
                                    key={ticket.id}
                                    className="group bg-white dark:bg-dark-card p-5 rounded-3xl border border-gray-200 dark:border-dark-border hover:border-neon-green/30 transition-all flex items-center gap-10 shadow-sm relative"
                                >
                                    <div className="w-40 h-24 rounded-2xl overflow-hidden flex-shrink-0 relative">
                                        <img src={ticket.event.image_url} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                            {getStatusBadge(ticket)}
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[9px] font-black text-neon-green uppercase tracking-widest mb-1.5">{new Date(ticket.event.event_date).toLocaleDateString()} • {ticket.event.event_time}</p>
                                        <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase truncate mb-2">{ticket.event.title}</h3>
                                        <div className="flex items-center gap-6 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                            <div className="flex items-center gap-2"><Tag className="w-3.5 h-3.5" />{ticket.ticket_tier.tier_name}</div>
                                            <div className="flex items-center gap-2 text-neon-green/80"><MapPin className="w-3.5 h-3.5" />{ticket.ticket_tier.section_name || 'GENERAL'}</div>
                                        </div>
                                    </div>
                                    <ActionButtons ticket={ticket} view="list" />
                                    <div className="flex flex-col gap-2">
                                        {ticket.is_current_owner && (
                                            <button 
                                                onClick={() => handleViewQr(ticket)}
                                                className="p-3.5 bg-neon-green text-black rounded-xl hover:brightness-110 transition-all disabled:opacity-20"
                                                disabled={ticket.status === 'used' || ticket.status === 'cancelled'}
                                            >
                                                <QrCode className="w-5 h-5" />
                                            </button>
                                        )}
                                        <Link 
                                            to={`/events/${ticket.event_id}`}
                                            className="p-3.5 bg-gray-100 dark:bg-white/5 text-gray-500 rounded-xl hover:text-white transition-all"
                                        >
                                            <ExternalLink className="w-5 h-5" />
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                ) : (
                    <div className="bg-white dark:bg-dark-card rounded-[5rem] p-32 text-center border border-gray-100 dark:border-dark-border space-y-10 relative overflow-hidden backdrop-blur-3xl shadow-2xl">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-neon-green/5 blur-[150px] -z-10"></div>
                        <div className="w-40 h-40 bg-neon-green/5 rounded-full flex items-center justify-center mx-auto ring-1 ring-neon-green/20 relative z-10 animate-pulse">
                            <History className="w-20 h-20 text-neon-green opacity-30" />
                        </div>
                        <div className="space-y-4 relative z-10">
                            <h3 className="text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Kho lưu trữ trống</h3>
                            <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto font-medium text-base leading-relaxed opacity-70 italic">
                                Bạn chưa có hồ sơ giao dịch nào khớp với tiêu chí lọc này.
                            </p>
                        </div>
                        <Link 
                            to="/events"
                            className="inline-flex items-center gap-4 bg-neon-green text-black px-16 py-6 rounded-full text-[11px] font-black uppercase tracking-[0.2em] hover:bg-neon-hover transition-all shadow-2xl shadow-neon-green/20 active:scale-95"
                        >
                            Khám phá thị trường ngay
                            <ArrowRightLeft className="w-4 h-4 rotate-45" />
                        </Link>
                    </div>
                )}
            </div>

            {/* QR View Modal - Kế thừa từ thiết kế trước nhưng tối ưu hóa hơn */}
            {showQrModal && selectedTicket && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-500">
                    <div className="absolute inset-0 bg-black/95 backdrop-blur-3xl" onClick={() => setShowQrModal(false)}></div>
                    <div className="relative bg-white dark:bg-dark-bg w-full max-w-xl rounded-[5rem] overflow-hidden shadow-[0_0_120px_rgba(82,196,45,0.15)] border border-white/5 animate-in zoom-in-95 duration-500">
                        {/* Modal Header */}
                        <div className="bg-neon-green p-12 text-black relative">
                            <div className="absolute top-0 right-0 p-12 opacity-10">
                                <QrCode className="w-48 h-48" />
                            </div>
                            <button 
                                onClick={() => setShowQrModal(false)}
                                className="absolute top-10 right-10 p-4 hover:bg-black/10 rounded-full transition-colors"
                            >
                                <XCircle className="w-8 h-8" />
                            </button>
                            <div className="flex items-center gap-4 mb-4">
                                <span className="bg-black/10 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-black/5">{selectedTicket.ticket_tier.tier_name}</span>
                                <span className="bg-black/10 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-black/5">#{selectedTicket.ticket_number}</span>
                            </div>
                            <h2 className="text-4xl font-black uppercase tracking-tighter leading-none line-clamp-2 max-w-[85%] mb-2">{selectedTicket.event.title}</h2>
                            <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest">{selectedTicket.event.location_address}</p>
                        </div>

                        {/* Modal Body */}
                        <div className="p-16 space-y-12 flex flex-col items-center bg-[#0c0c0e]">
                            {/* Vault / QR Security Info */}
                            <div className="w-full flex items-center justify-between px-8 py-5 bg-neon-green/[0.03] rounded-3xl border border-neon-green/10">
                                <div className="flex items-center gap-3">
                                    <Shield className="w-5 h-5 text-neon-green" />
                                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Giao thức bảo mật NFT-Gate</span>
                                </div>
                                <span className="text-[10px] font-black text-neon-green uppercase tracking-widest">Active</span>
                            </div>

                            {/* QR Canvas Simulation */}
                            <div className="relative group">
                                <div className="w-[20rem] h-[20rem] bg-white/[0.02] rounded-[4rem] flex items-center justify-center border-[12px] border-white/[0.02] p-8 relative ring-1 ring-white/10 shadow-[inner_0_0_40px_rgba(0,0,0,0.5)]">
                                    {qrLoading ? (
                                        <Loader2 className="w-20 h-20 text-neon-green animate-spin" />
                                    ) : qrCodeData ? (
                                        <div className="w-full h-full bg-white rounded-[3rem] p-10 shadow-[0_0_50px_rgba(255,255,255,0.1)] relative group-hover:scale-[1.02] transition-transform duration-500">
                                            <QRCodeSVG 
                                                value={qrCodeData} 
                                                size={256}
                                                level="H"
                                                includeMargin={false}
                                                className="w-full h-full"
                                            />
                                        </div>
                                    ) : (
                                        <AlertCircle className="w-16 h-16 text-red-500/50" />
                                    )}

                                    {/* Expiry Timer Overlay */}
                                    {countdown === 0 && !qrLoading && (
                                        <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center p-12 text-center space-y-8 rounded-[3rem] backdrop-blur-md">
                                            <XCircle className="w-16 h-16 text-red-500 opacity-50" />
                                            <div className="space-y-2">
                                                <p className="text-base font-black text-white uppercase tracking-tighter">Chứng chỉ hết hạn</p>
                                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Thời gian chờ tối đa 60 giây đã kết thúc</p>
                                            </div>
                                            <button 
                                                onClick={() => generateQr(selectedTicket.id)}
                                                className="bg-neon-green text-black px-12 py-4 rounded-full text-xs font-black uppercase tracking-widest shadow-2xl shadow-neon-green/30 active:scale-95"
                                            >
                                                Yêu cầu mã mới
                                            </button>
                                        </div>
                                    )}
                                </div>
                                
                                {countdown > 0 && (
                                    <div className="mt-10 flex flex-col items-center gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2.5 h-2.5 bg-neon-green rounded-full shadow-[0_0_10px_#52c42d] animate-pulse"></div>
                                            <span className="text-xs font-black text-gray-300 uppercase tracking-[0.2em]">
                                                Token cập nhật sau: <span className="text-neon-green font-bold">{countdown}s</span>
                                            </span>
                                        </div>
                                        <div className="w-72 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-neon-green transition-all duration-1000 ease-linear shadow-[0_0_15px_#52c42d]"
                                                style={{ width: `${(countdown / 60) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Explorer Links */}
                            <div className="w-full space-y-4 pt-8">
                                <button
                                    onClick={() => window.open(`https://mumbai.polygonscan.com/tx/${selectedTicket.nft_mint_tx_hash}`, '_blank')}
                                    className="w-full flex items-center justify-between p-7 bg-white/[0.01] rounded-3xl hover:bg-white/[0.03] transition-all text-gray-500 group border border-white/5"
                                >
                                    <div className="flex items-center gap-4">
                                        <Grid className="w-5 h-5 text-neon-green" />
                                        <span className="text-[11px] font-black uppercase tracking-widest">Xác minh On-chain (Polygon scan)</span>
                                    </div>
                                    <ExternalLink className="w-5 h-5 group-hover:translate-x-1" />
                                </button>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-16 py-10 bg-black/60 text-center border-t border-white/5">
                            <p className="text-[10px] text-gray-500 font-bold italic leading-relaxed uppercase tracking-[0.1em]">
                                * Đây là tài sản NFT không thể làm giả. Chỉ trình diện mã này tại thiết bị kiểm soát chính thức của Ban tổ chức.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Transfer Modal */}
            {showTransferModal && selectedTicket && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-dark-card w-full max-w-lg rounded-[2.5rem] border border-white/10 overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.8)] relative">
                        {/* Header */}
                        <div className="px-10 py-8 border-b border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <ArrowRightLeft className="w-5 h-5 text-neon-green" />
                                <h3 className="text-xl font-black text-white uppercase tracking-tighter">Chuyển nhượng vé</h3>
                            </div>
                            <button onClick={() => setShowTransferModal(false)} className="p-2 hover:bg-white/5 rounded-full text-gray-500 transition-all">
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-10 space-y-8">
                            <div className="bg-white/5 rounded-3xl p-6 border border-white/5 flex items-center gap-5">
                                <img src={selectedTicket.event.poster_url} className="w-16 h-20 object-cover rounded-xl" alt="" />
                                <div>
                                    <p className="text-[10px] font-black text-neon-green uppercase tracking-widest mb-1">{selectedTicket.category_name}</p>
                                    <p className="text-base font-bold text-white leading-tight mb-1">{selectedTicket.event.title}</p>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Token ID: #{selectedTicket.nft_token_id || 'N/A'}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] px-2 block">Email người nhận</label>
                                <div className="relative">
                                    <Send className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input 
                                        type="email"
                                        placeholder="Nhập email tài khoản BASTICKET..."
                                        value={receiverEmail}
                                        onChange={(e) => setReceiverEmail(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-14 pr-6 text-sm text-white focus:outline-none focus:border-neon-green focus:ring-1 focus:ring-neon-green transition-all placeholder:text-gray-600"
                                    />
                                    {isCheckingEmail && (
                                        <Loader2 className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-neon-green animate-spin" />
                                    )}
                                </div>

                                {/* Receiver Info Card */}
                                {receiverInfo ? (
                                    <div className="mx-2 p-4 bg-neon-green/5 border border-neon-green/20 rounded-2xl flex items-center gap-4 animate-in slide-in-from-top-2 duration-300">
                                        <img 
                                            src={receiverInfo.avatar_url || 'https://via.placeholder.com/100'} 
                                            className="w-11 h-11 rounded-full border-2 border-neon-green/30 object-cover shadow-[0_0_15px_rgba(82,196,45,0.2)]"
                                            alt=""
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[9px] font-black text-neon-green uppercase tracking-widest flex items-center gap-1.5">
                                                <Shield className="w-2.5 h-2.5" />
                                                Người nhận xác thực
                                            </p>
                                            <p className="text-sm font-black text-white truncate uppercase tracking-tight">{receiverInfo.full_name}</p>
                                            <p className="text-[10px] text-gray-500 font-bold truncate">{receiverInfo.email}</p>
                                        </div>
                                        <div className="w-8 h-8 bg-neon-green rounded-full flex items-center justify-center shadow-lg shadow-neon-green/20">
                                            <CheckCircle2 className="w-5 h-5 text-black" />
                                        </div>
                                    </div>
                                ) : receiverEmail && !isCheckingEmail && receiverEmail.includes('@') ? (
                                    <div className="mx-2 p-4 bg-red-500/5 border border-red-500/20 rounded-2xl flex items-center gap-3 animate-in fade-in duration-300">
                                        <AlertCircle className="w-5 h-5 text-red-500" />
                                        <p className="text-[10px] text-red-500 font-black uppercase tracking-widest">
                                            Không tìm thấy tài khoản người dùng này
                                        </p>
                                    </div>
                                ) : (
                                    <p className="text-[10px] text-gray-500 font-bold italic px-4 uppercase tracking-widest opacity-60">
                                        * Vui lòng nhập email chính xác để định danh người nhận.
                                    </p>
                                )}
                            </div>

                            <div className="p-6 bg-red-500/5 border border-red-500/10 rounded-2xl flex gap-4">
                                <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                                <p className="text-[10px] text-red-200/60 font-black leading-relaxed uppercase tracking-widest">
                                    Hành động này không thể hoàn tác. Vé sẽ được chuyển quyền sở hữu vĩnh viễn trên Blockchain sau khi xác nhận.
                                </p>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-10 py-8 bg-black/40 border-t border-white/5">
                            <button 
                                onClick={handleTransfer}
                                disabled={isTransferring || !receiverInfo}
                                className="w-full bg-neon-green hover:bg-neon-hover disabled:opacity-20 text-black font-black uppercase tracking-[0.2em] py-5 rounded-2xl text-xs flex items-center justify-center gap-3 transition-all shadow-xl shadow-neon-green/20 active:scale-95 border-none"
                            >
                                {isTransferring ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Giao thức đang thực thi...
                                    </>
                                ) : (
                                    <>
                                        <ArrowRightLeft className="w-4 h-4" />
                                        Xác nhận chuyển nhượng
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyTickets;

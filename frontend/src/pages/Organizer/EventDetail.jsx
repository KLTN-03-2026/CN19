import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    Calendar, 
    MapPin, 
    Ticket, 
    ArrowLeft, 
    Clock, 
    CheckCircle2, 
    AlertCircle, 
    ExternalLink,
    Loader2,
    Users,
    TrendingUp,
    ShieldCheck,
    Coins,
    AlertTriangle,
    Info,
    ChevronLeft,
    ChevronRight,
    Search,
    Layout,
    ShoppingBag,
    Eye,
    DollarSign,
    Wallet,
    Tag,
    Newspaper,
    History,
    TrendingDown,
    PieChart as PieIcon,
    Image as ImageIcon,
    Play,
    Send
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { organizerService } from '../../services/organizer.service';
import EmergencyActionModal from '../../components/Organizer/EmergencyActionModal';

const EventDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [selectedTier, setSelectedTier] = useState(null);
    const [tierTab, setTierTab] = useState('overview');
    const [timeRange, setTimeRange] = useState('7d');
    const tabContainerRef = useRef(null);

    const [txTotalPages, setTxTotalPages] = useState(1);
    const [transactions, setTransactions] = useState([]);
    const [txLoading, setTxLoading] = useState(false);
    const [txSearch, setTxSearch] = useState('');
    const [txStatus, setTxStatus] = useState('all');
    const [txPage, setTxPage] = useState(1);
    
    // Owners State
    const [owners, setOwners] = useState([]);
    const [ownersLoading, setOwnersLoading] = useState(false);
    const [ownersSearch, setOwnersSearch] = useState('');

    // Resale State
    const [resaleSettings, setResaleSettings] = useState({
        allow_resale: true,
        price_ceiling: '',
        royalty_fee_percent: 3.0,
        resale_price_limit_percent: 108.0
    });
    const [savingResale, setSavingResale] = useState(false);
    const [secondaryActivity, setSecondaryActivity] = useState({ marketplace: [], transfers: [] });
    const [loadingSecondary, setLoadingSecondary] = useState(false);

    // Transfer State
    const [transferSettings, setTransferSettings] = useState({ allow_transfer: true });
    const [savingTransfer, setSavingTransfer] = useState(false);

    useEffect(() => {
        fetchEvent();
    }, [id]);

    useEffect(() => {
        if (activeTab === 'tiers' && selectedTier) {
            if (tierTab === 'transactions') fetchTransactions();
            if (tierTab === 'attendees') fetchOwners();
        }
    }, [id, selectedTier?.id, tierTab, txPage, txStatus]);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (activeTab === 'tiers' && selectedTier) {
                if (tierTab === 'transactions') {
                    setTxPage(1);
                    fetchTransactions();
                } else if (tierTab === 'attendees') {
                    fetchOwners();
                }
            }
        }, 600);
        return () => clearTimeout(timer);
    }, [txSearch, ownersSearch]);

    const handleEmergencyAction = async (data) => {
        try {
            await organizerService.requestEmergencyAction(id, data);
            toast.success('Gửi yêu cầu xử lý khẩn cấp thành công!');
            setIsEmergencyModalOpen(false);
            fetchEvent();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Đã xảy ra lỗi.');
            throw err;
        }
    };

    useEffect(() => {
        if (activeTab === 'resale' || activeTab === 'transfers') {
            fetchSecondaryActivity();
        }
    }, [activeTab, id]);

    const fetchSecondaryActivity = async () => {
        try {
            setLoadingSecondary(true);
            const res = await organizerService.getEventSecondaryActivity(id);
            setSecondaryActivity(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingSecondary(false);
        }
    };

    const handleUpdateResalePolicy = async (e) => {
        e.preventDefault();
        try {
            setSavingResale(true);
            await organizerService.updateResalePolicy(id, {
                allow_resale: resaleSettings.allow_resale,
                price_ceiling: resaleSettings.price_ceiling ? Number(resaleSettings.price_ceiling) : null,
                royalty_fee_percent: Number(resaleSettings.royalty_fee_percent),
                resale_price_limit_percent: Number(resaleSettings.resale_price_limit_percent)
            });
            toast.success('Cập nhật chính sách Chợ vé thành công');
            fetchEvent(); // Refresh data
        } catch (error) {
            toast.error(error.response?.data?.error || 'Lỗi cập nhật chính sách');
        } finally {
            setSavingResale(false);
        }
    };

    const handleUpdateTransferPolicy = async (e) => {
        e.preventDefault();
        try {
            setSavingTransfer(true);
            await organizerService.updateTransferPolicy(id, {
                allow_transfer: transferSettings.allow_transfer
            });
            toast.success('Cập nhật chính sách Chuyển nhượng thành công');
            fetchEvent(); // Refresh data
        } catch (error) {
            toast.error(error.response?.data?.error || 'Lỗi cập nhật chính sách');
        } finally {
            setSavingTransfer(false);
        }
    };

    const fetchEvent = async () => {
        try {
            setLoading(true);
            const res = await organizerService.getEventById(id);
            setEvent(res.data);
            setResaleSettings({
                allow_resale: res.data.allow_resale,
                price_ceiling: res.data.price_ceiling || '',
                royalty_fee_percent: res.data.royalty_fee_percent || 3.0,
                resale_price_limit_percent: res.data.resale_price_limit_percent || 108.0
            });
            setTransferSettings({
                allow_transfer: res.data.allow_transfer !== undefined ? res.data.allow_transfer : true
            });
        } catch (error) {
            toast.error('Không thể tải thông tin sự kiện.');
            console.error(error);
            navigate('/organizer/my-events');
        } finally {
            setLoading(false);
        }
    };

    const fetchTransactions = async () => {
        try {
            setTxLoading(true);
            const res = await organizerService.getTierTransactions(id, {
                tier_id: selectedTier?.id,
                search: txSearch,
                status: txStatus === 'all' ? 'all' : txStatus, // success or failed
                page: txPage,
                limit: 10
            });
            setTransactions(res.data);
            setTxTotalPages(res.pagination.totalPages);
        } catch (error) {
            console.error(error);
        } finally {
            setTxLoading(false);
        }
    };

    const fetchOwners = async () => {
        try {
            setOwnersLoading(true);
            const res = await organizerService.getEventParticipants(id, {
                tier_id: selectedTier?.id,
                search: ownersSearch
            });
            setOwners(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setOwnersLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Đang tải dữ liệu sự kiện...</p>
            </div>
        );
    }

    if (!event) return null;

    const getStatusInfo = (status) => {
        switch (status) {
            case 'draft': return { label: 'Bản nháp', color: 'bg-gray-500/10 text-gray-500 border-gray-1000/20', icon: Clock };
            case 'pending': return { label: 'Chờ duyệt', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20', icon: AlertCircle };
            case 'active': return { label: 'Đang mở bán', color: 'bg-green-500/10 text-green-500 border-green-500/20', icon: CheckCircle2 };
            case 'ended': return { label: 'Đã hoàn thành', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', icon: Calendar };
            case 'cancelled': return { label: 'Đã hủy', color: 'bg-red-500/10 text-red-500 border-red-500/20', icon: AlertTriangle };
            default: return { label: status, color: 'bg-gray-500/10 text-gray-500 border-gray-1000/20', icon: Clock };
        }
    };

    const statusInfo = getStatusInfo(event.status);
    const totalTickets = event.ticket_tiers?.reduce((sum, t) => sum + Number(t.quantity_total), 0) || 0;
    const soldTickets = event.total_sold || 0; 
    const checkInCount = event.check_in_count || 0; 
    
    // Charts Colors (Vibrant Mix)
    const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

    // Helper to extract YouTube ID
    const getYouTubeId = (url) => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const youtubeId = getYouTubeId(event.video_url);

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-10 font-sans">
            
            {/* --- TOP BANNER & HEADER --- */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Event Photo Column */}
                <div className="lg:col-span-3">
                    <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-gray-200 dark:border-white/5 shadow-sm group">
                        {event.image_url ? (
                            <img src={event.image_url} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700" />
                        ) : (
                            <div className="w-full h-full bg-gray-100 dark:bg-white/5 flex items-center justify-center"><ImageIcon className="w-10 h-10 text-gray-400" /></div>
                        )}
                        <div className="absolute top-3 left-3 flex gap-2">
                             <div className={`px-2 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 font-bold uppercase text-[9px] text-white flex items-center gap-1`}>
                                <statusInfo.icon className="w-3 h-3 text-blue-500" />
                                {statusInfo.label}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Header Information Column */}
                <div className="lg:col-span-9 flex flex-col justify-between p-1">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center space-x-3">
                            <button 
                                onClick={() => navigate('/organizer/my-events')}
                                className="p-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition-all text-gray-500 shadow-sm active:scale-95"
                            >
                                <ArrowLeft className="w-4 h-4" />
                            </button>
                            <div>
                                <h1 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">{event.title}</h1>
                                <div className="flex items-center gap-3 mt-1">
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest opacity-60">SỰ KIỆN: {event.id.split('-')[0]}</p>
                                    <span className="w-1 h-1 bg-gray-300 dark:bg-gray-800 rounded-full"></span>
                                    <p className="text-[10px] text-gray-500 font-bold flex items-center gap-1.5">
                                        <Calendar className="w-3 h-3 text-blue-500" />
                                        {format(new Date(event.event_date), 'dd/MM/yyyy')} {event.event_time}
                                    </p>
                                    <span className="w-1 h-1 bg-gray-300 dark:bg-gray-800 rounded-full"></span>
                                    <p className="text-[10px] text-gray-500 font-bold flex items-center gap-1.5 truncate max-w-[200px]">
                                        <MapPin className="w-3 h-3 text-indigo-500" />
                                        {event.location_address}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {(event.status === 'draft' || event.status === 'pending') && (
                                <button onClick={() => navigate(`/organizer/events/${event.id}/edit`)} className="px-5 py-2 bg-blue-600 text-white font-bold uppercase text-[10px] rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95">Cập nhật</button>
                            )}
                            {event.status === 'active' && (
                                <button onClick={() => setIsEmergencyModalOpen(true)} className="flex items-center gap-2 px-5 py-2 rounded-xl bg-red-600 text-white font-bold uppercase text-[10px] shadow-lg shadow-red-600/20 hover:bg-red-700 transition-all active:scale-95"><AlertTriangle className="w-3.5 h-3.5" /> Khẩn cấp</button>
                            )}
                            <button onClick={() => window.open(`http://localhost:5173/events/${event.id}`, '_blank')} className="p-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-500 hover:text-blue-600 transition-all shadow-sm active:scale-95"><ExternalLink className="w-4 h-4" /></button>
                        </div>
                    </div>

                    {/* Quick Finance Overlay Cards - Compact VERSION */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 lg:mt-0">
                        <div className="bg-white dark:bg-[#111114] border border-gray-200 dark:border-white/5 p-3 rounded-2xl shadow-sm hover:border-blue-500/20 transition-all">
                            <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Doanh thu Thực nhận</p>
                            <p className="text-lg font-black text-gray-900 dark:text-white mt-0.5">{new Intl.NumberFormat('vi-VN').format(event.estimated_net_revenue || 0)} <span className="text-[9px] text-gray-500">đ</span></p>
                        </div>
                        <div className="bg-white dark:bg-[#111114] border border-gray-200 dark:border-white/5 p-3 rounded-2xl shadow-sm">
                            <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Lấp đầy</p>
                            <p className="text-lg font-black text-gray-900 dark:text-white mt-0.5">{totalTickets > 0 ? Math.round((soldTickets / totalTickets) * 100) : 0}% <span className="text-[9px] text-gray-500 uppercase">({soldTickets}/{totalTickets})</span></p>
                        </div>
                        <div className="bg-white dark:bg-[#111114] border border-gray-200 dark:border-white/5 p-3 rounded-2xl shadow-sm">
                            <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Đã Check-in</p>
                            <p className="text-lg font-black text-gray-900 dark:text-white mt-0.5">{soldTickets > 0 ? Math.round((checkInCount / soldTickets) * 100) : 0}% <span className="text-[9px] text-gray-500 uppercase">({checkInCount})</span></p>
                        </div>
                        <div className="bg-white dark:bg-[#111114] border border-gray-200 dark:border-white/5 p-3 rounded-2xl shadow-sm">
                            <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Hồng bán lại</p>
                            <p className="text-lg font-black text-gray-900 dark:text-white mt-0.5">+{new Intl.NumberFormat('vi-VN').format(event.financials?.resale_royalties || 0)} <span className="text-[9px] text-gray-500">đ</span></p>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- TAB NAVIGATION & MAIN CONTENT --- */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center space-x-1 p-1 bg-white dark:bg-[#111114] border border-gray-200 dark:border-white/5 rounded-2xl shadow-sm overflow-x-auto no-scrollbar max-w-fit">
                    {[
                        { id: 'overview', label: 'Tổng quan', icon: TrendingUp },
                        { id: 'tiers', label: `Hạng vé (${event.ticket_tiers?.length || 0})`, icon: Ticket },
                        { id: 'orders', label: 'Đơn hàng', icon: ShoppingBag },
                        { id: 'resale', label: 'Chợ vé', icon: DollarSign },
                        { id: 'transfers', label: 'Chuyển nhượng', icon: Send },
                        { id: 'seating', label: 'Sơ đồ chỗ ngồi', icon: Layout },
                        { id: 'products', label: 'Sản phẩm', icon: Tag },
                        { id: 'blogs', label: 'Tin tức', icon: Newspaper },
                        { id: 'location', label: 'Vị trí', icon: MapPin },
                        { id: 'logs', label: 'Nhật ký', icon: History }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => { setActiveTab(tab.id); setSelectedTier(null); }}
                            className={`flex items-center justify-center px-4 py-2.5 rounded-xl text-[11px] font-bold uppercase transition-all whitespace-nowrap ${
                                activeTab === tab.id 
                                    ? 'bg-blue-600 text-white shadow-sm' 
                                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'
                            }`}
                        >
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                <div className="bg-white dark:bg-[#111114] border border-gray-200 dark:border-white/5 rounded-2xl p-5 shadow-sm min-h-[500px]">
                    {/* --- OVERVIEW TAB --- */}
                    {activeTab === 'overview' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                                <div className="xl:col-span-8 space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase">Hiệu suất Doanh thu</h3>
                                        </div>
                                        <div className="flex items-center gap-1 p-0.5 bg-gray-100 dark:bg-black/20 rounded-xl">
                                            <button onClick={() => setTimeRange('7d')} className={`px-4 py-1 rounded-lg text-[10px] font-bold transition-all ${timeRange === '7d' ? 'bg-white dark:bg-white/10 text-blue-600 shadow-sm' : 'text-gray-500'}`}>7 Ngày</button>
                                            <button onClick={() => setTimeRange('30d')} className={`px-4 py-1 rounded-lg text-[10px] font-bold transition-all ${timeRange === '30d' ? 'bg-white dark:bg-white/10 text-blue-600 shadow-sm' : 'text-gray-500'}`}>30 Ngày</button>
                                        </div>
                                    </div>

                                    <div className="h-[260px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={timeRange === '7d' ? event.statistics?.timeline7d : event.statistics?.timeline30d}>
                                                <defs>
                                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                                                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888815" />
                                                <XAxis dataKey="date" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} tick={{ fontWeight: 800 }} />
                                                <YAxis stroke="#888888" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `${value/1000}k`} tick={{ fontWeight: 800 }} />
                                                <Tooltip contentStyle={{ backgroundColor: '#111114', border: '1px solid #ffffff05', borderRadius: '12px', fontSize: '11px', color: '#fff' }} />
                                                <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '10px' }} />
                                                <Area type="monotone" name="Doanh thu" dataKey="revenue" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>

                                    {/* VIDEO SECTION - AS PART OF OVERVIEW */}
                                    {event.video_url && (
                                        <div className="space-y-3">
                                            <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase flex items-center gap-2">
                                                <Play className="w-4 h-4 text-blue-600" />
                                                Video giới thiệu & Trailer
                                            </h3>
                                            <div className="aspect-video w-full rounded-2xl overflow-hidden border border-gray-200 dark:border-white/10 bg-black shadow-lg relative max-w-3xl mx-auto">
                                                {youtubeId ? (
                                                    <iframe
                                                        width="100%"
                                                        height="100%"
                                                        src={`https://www.youtube.com/embed/${youtubeId}?autoplay=0`}
                                                        title="YouTube video player"
                                                        frameBorder="0"
                                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                        allowFullScreen
                                                        className="w-full h-full"
                                                    ></iframe>
                                                ) : (
                                                    <video controls className="w-full h-full object-contain" poster={event.image_url}>
                                                        <source src={event.video_url} type="video/mp4" />
                                                    </video>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="xl:col-span-4 space-y-6">
                                    <div className="p-5 bg-gray-50/50 dark:bg-black/20 border border-gray-200 dark:border-white/5 rounded-2xl">
                                        <h3 className="text-[11px] font-bold text-gray-900 dark:text-white uppercase mb-4 flex items-center gap-2"><PieIcon className="w-4 h-4 text-blue-600" /> Cơ cấu doanh thu</h3>
                                        <div className="h-[200px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie data={event.statistics?.revenue_mix} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                                                        {event.statistics?.revenue_mix?.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip contentStyle={{ backgroundColor: '#111114', border: 'none', borderRadius: '12px', fontSize: '11px' }} />
                                                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 800 }} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    <div className="p-5 bg-gray-50/50 dark:bg-black/20 border border-gray-200 dark:border-white/5 rounded-2xl space-y-4">
                                        <h3 className="text-[11px] font-bold text-gray-900 dark:text-white uppercase flex items-center gap-2"><Info className="w-4 h-4 text-blue-600" /> Mô tả sự kiện</h3>
                                        <p className="text-[12px] text-gray-600 dark:text-gray-500 font-bold leading-relaxed whitespace-pre-line border-l-2 border-blue-600/20 pl-4">{event.description || 'Không có mô tả.'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- TIERS TAB --- */}
                    {activeTab === 'tiers' && (
                        <div className="animate-in fade-in duration-300">
                            {selectedTier ? (
                                <div className="space-y-5">
                                    <div className="flex items-center justify-between">
                                        <button onClick={() => { setSelectedTier(null); setTierTab('overview'); }} className="flex items-center space-x-2 text-[11px] font-bold text-gray-500 hover:text-blue-600 transition-colors uppercase"><ArrowLeft className="w-4 h-4" /><span>Quay lại</span></button>
                                        <div className="flex items-center gap-1 p-0.5 bg-gray-100 dark:bg-black/20 rounded-xl">
                                            {[
                                                { id: 'overview', label: 'Chi tiết', icon: Info },
                                                { id: 'transactions', label: 'Giao dịch', icon: ShoppingBag },
                                                { id: 'attendees', label: 'Người sở hữu', icon: Users }
                                            ].map(t => (
                                                <button key={t.id} onClick={() => setTierTab(t.id)} className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${tierTab === t.id ? 'bg-white dark:bg-white/10 text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-600'}`}>{t.label}</button>
                                            ))}
                                        </div>
                                    </div>

                                    {tierTab === 'overview' && (
                                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 animate-in fade-in duration-300">
                                            <div className="lg:col-span-12 p-6 bg-blue-600/5 rounded-2xl border border-blue-600/10 flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-blue-600/10 rounded-xl flex items-center justify-center text-blue-600"><Ticket className="w-6 h-6" /></div>
                                                    <div>
                                                        <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase leading-none">{selectedTier.tier_name}</h3>
                                                        <p className="text-[11px] font-bold text-gray-500 uppercase mt-1.5">{selectedTier.section_name || 'Khu vực chung'}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-2xl font-black text-blue-600">{new Intl.NumberFormat('vi-VN').format(selectedTier.price)} <span className="text-xs">đ</span></p>
                                                </div>
                                            </div>
                                            <div className="lg:col-span-8 flex flex-col gap-5">
                                                <div className="grid grid-cols-3 gap-4">
                                                    <div className="p-4 bg-gray-50 dark:bg-black/20 rounded-xl border border-gray-200 dark:border-white/5 text-center"><p className="text-[11px] font-bold text-gray-500 uppercase mb-1">Phát hành</p><p className="text-xl font-black text-gray-900 dark:text-white">{selectedTier.quantity_total}</p></div>
                                                    <div className="p-4 bg-blue-600/5 rounded-xl border border-blue-600/10 text-center"><p className="text-[11px] font-bold text-blue-600 uppercase mb-1">Đã bán</p><p className="text-xl font-black text-blue-600">{selectedTier._count.tickets}</p></div>
                                                    <div className="p-4 bg-indigo-600/5 rounded-xl border border-indigo-600/10 text-center"><p className="text-[11px] font-bold text-indigo-600 uppercase mb-1">Còn lại</p><p className="text-xl font-black text-indigo-600">{selectedTier.quantity_total - selectedTier._count.tickets}</p></div>
                                                </div>
                                                <div className="p-6 bg-gray-50/50 dark:bg-black/20 border border-gray-200 dark:border-white/5 rounded-2xl">
                                                    <h4 className="text-[11px] font-bold text-gray-900 dark:text-white uppercase mb-4 flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-blue-600" /> Đặc quyền hạng vé</h4>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        {selectedTier.benefits?.split('\n').filter(b => b.trim()).map((b, i) => (
                                                            <div key={i} className="flex items-center gap-2.5 text-[12px] text-gray-600 dark:text-gray-500 font-bold p-3 bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/5"><div className="w-1.5 h-1.5 rounded-full bg-blue-600" /><span>{b.trim()}</span></div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="lg:col-span-4 p-6 bg-gray-50/50 dark:bg-black/20 border border-gray-200 dark:border-white/5 rounded-2xl flex flex-col items-center">
                                                <h4 className="text-[11px] font-bold text-gray-900 dark:text-white uppercase mb-6 self-start">Hoàn thành hạng vé</h4>
                                                <div className="relative w-36 h-36 flex items-center justify-center">
                                                    <div className="absolute flex flex-col items-center"><span className="text-xl font-black text-gray-900 dark:text-white">{selectedTier.quantity_total > 0 ? Math.round((selectedTier._count.tickets / selectedTier.quantity_total) * 100) : 0}%</span><span className="text-[9px] font-bold text-gray-500 uppercase">Lấp đầy</span></div>
                                                    <svg className="w-full h-full -rotate-90">
                                                        <circle cx="72" cy="72" r="64" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-100 dark:text-white/5" />
                                                        <circle cx="72" cy="72" r="64" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={402} strokeDashoffset={402 - (402 * (selectedTier.quantity_total > 0 ? selectedTier._count.tickets / selectedTier.quantity_total : 0))} className="text-blue-600" strokeLinecap="round" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {tierTab === 'transactions' && (
                                        <div className="space-y-4 animate-in fade-in duration-300">
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="relative flex-1 max-w-sm"><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" /><input type="text" placeholder="Tìm theo ID, Khách hàng..." className="w-full pl-9 pr-4 py-2.5 bg-gray-50/50 dark:bg-black/20 border border-gray-200 dark:border-white/5 rounded-xl text-[11px] font-medium placeholder:text-gray-500 focus:outline-none focus:border-blue-600/30 transition-all" value={txSearch} onChange={(e) => setTxSearch(e.target.value)} /></div>
                                                <div className="flex items-center p-0.5 bg-gray-100 dark:bg-black/20 rounded-xl">
                                                    {[
                                                        { id: 'all', label: 'Tất cả' },
                                                        { id: 'success', label: 'Thành công' },
                                                        { id: 'cancelled', label: 'Bị hủy' }
                                                    ].map(s => (
                                                        <button key={s.id} onClick={() => { setTxStatus(s.id); setTxPage(1); }} className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${txStatus === s.id ? 'bg-white dark:bg-white/10 text-blue-600 shadow-sm' : 'text-gray-500'}`}>
                                                            {s.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="border border-gray-200 dark:border-white/5 rounded-xl overflow-hidden">
                                                <table className="w-full text-left bg-gray-50/20 dark:bg-black/10">
                                                    <thead>
                                                        <tr className="bg-gray-100/50 dark:bg-white/5 text-[10px] font-bold text-gray-500 uppercase tracking-widest border-b border-gray-200 dark:border-white/5">
                                                            <th className="px-5 py-4">Mã đơn</th>
                                                            <th className="px-5 py-4">Loại</th>
                                                            <th className="px-5 py-4">Khách hàng</th>
                                                            <th className="px-5 py-4 text-center">Trạng thái</th>
                                                            <th className="px-5 py-4 text-right">Tổng thanh toán</th>
                                                            <th className="px-5 py-4 text-center">Thao tác</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                                        {txLoading ? (<tr><td colSpan="6" className="px-5 py-24 text-center text-xs font-bold uppercase  text-gray-500">Đang tải dữ liệu...</td></tr>) : transactions.length > 0 ? (
                                                            transactions.map(tx => (
                                                                <tr key={tx.id} className="hover:bg-gray-100/30 dark:hover:bg-white/5 transition-colors group">
                                                                    <td className="px-5 py-3">
                                                                        <p className="text-[11px] font-black text-gray-900 dark:text-white uppercase">{tx.order_number}</p>
                                                                        <p className="text-[9px] font-bold text-gray-500 uppercase mt-0.5 ">{format(new Date(tx.created_at), 'dd/MM/yyyy HH:mm', { locale: vi })}</p>
                                                                    </td>
                                                                    <td className="px-5 py-3">
                                                                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${tx.type === 'primary' ? 'bg-blue-600/10 text-blue-600' : tx.type === 'resale' ? 'bg-indigo-600/10 text-indigo-600' : 'bg-gray-500/10 text-gray-500'}`}>
                                                                            {tx.type === 'primary' ? 'Mua mới' : tx.type === 'resale' ? 'Bán lại' : 'Chuyển nhượng'}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-5 py-3">
                                                                        <div className="flex items-center gap-2.5">
                                                                            <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-blue-600 text-[11px] font-bold overflow-hidden border border-gray-200/50">
                                                                                {tx.customer?.avatar_url ? <img src={tx.customer.avatar_url} className="w-full h-full object-cover" alt="" /> : tx.customer?.full_name?.charAt(0)}
                                                                            </div>
                                                                            <div className="min-w-0">
                                                                                <p className="text-[11px] font-bold text-gray-900 dark:text-white truncate max-w-[140px]">{tx.customer?.full_name}</p>
                                                                                <p className="text-[9px] font-bold text-gray-500 lowercase truncate max-w-[140px]">{tx.customer?.email}</p>
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-5 py-3 text-center">
                                                                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase shadow-sm border ${['paid', 'success', 'completed'].includes(tx.status) ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                                                                            {['paid', 'success', 'completed'].includes(tx.status) ? 'Thành công' : 'Thất bại'}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-5 py-3 text-right">
                                                                        <p className="text-[12px] font-bold text-gray-900 dark:text-white">{new Intl.NumberFormat('vi-VN').format(tx.total_amount)} <span className="text-[9px]">đ</span></p>
                                                                        <p className="text-[8px] font-bold text-gray-500 uppercase opacity-60">{tx.payment_method}</p>
                                                                    </td>
                                                                    <td className="px-5 py-3 text-center"><button onClick={() => navigate(`/organizer/orders/${tx.id}`)} className="p-2 bg-gray-100/50 dark:bg-white/5 text-gray-500 hover:text-blue-600 hover:bg-blue-600/10 rounded-lg transition-all active:scale-90"><Eye className="w-4 h-4" /></button></td>
                                                                </tr>
                                                            ))
                                                        ) : (<tr><td colSpan="5" className="px-5 py-24 text-center text-[11px] font-bold uppercase  text-gray-500">Không có dữ liệu</td></tr>)}
                                                    </tbody>
                                                </table>
                                            </div>
                                            {txTotalPages > 1 && (
                                                <div className="flex items-center justify-between pt-4 px-2">
                                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Trang {txPage} / {txTotalPages}</p>
                                                    <div className="flex items-center gap-2">
                                                        <button 
                                                            disabled={txPage === 1}
                                                            onClick={() => setTxPage(p => p - 1)}
                                                            className="p-2 bg-gray-100 dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/10 disabled:opacity-30 transition-all hover:bg-white dark:hover:bg-white/10"
                                                        >
                                                            <ChevronLeft className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button 
                                                            disabled={txPage === txTotalPages}
                                                            onClick={() => setTxPage(p => p + 1)}
                                                            className="p-2 bg-gray-100 dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/10 disabled:opacity-30 transition-all hover:bg-white dark:hover:bg-white/10"
                                                        >
                                                            <ChevronLeft className="w-3.5 h-3.5 rotate-180" />
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {tierTab === 'attendees' && (
                                        <div className="animate-in fade-in duration-300 space-y-4">
                                            <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-white/5">
                                                <h4 className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                                    <Users className="w-3.5 h-3.5 text-blue-600" />
                                                    Danh sách người sở hữu hiện tại
                                                </h4>
                                                <div className="relative w-64">
                                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                                                    <input 
                                                        type="text" 
                                                        placeholder="Tìm theo tên, email..." 
                                                        value={ownersSearch}
                                                        onChange={(e) => setOwnersSearch(e.target.value)}
                                                        className="w-full pl-9 pr-4 py-2 text-[11px] font-medium bg-gray-50/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:border-blue-500/50 transition-colors placeholder:opacity-50"
                                                    />
                                                </div>
                                            </div>

                                            <div className="overflow-x-auto no-scrollbar">
                                                <table className="w-full">
                                                    <thead>
                                                        <tr className="bg-gray-100/50 dark:bg-white/5 text-[10px] font-bold text-gray-500 uppercase tracking-widest border-b border-gray-200 dark:border-white/5">
                                                            <th className="px-5 py-4 text-left">Người sở hữu</th>
                                                            <th className="px-5 py-4 text-left">Số điện thoại</th>
                                                            <th className="px-5 py-4 text-left">Mã vé</th>
                                                            <th className="px-5 py-4 text-left">Mã đơn</th>
                                                            <th className="px-5 py-4 text-center">Trạng thái</th>
                                                            <th className="px-5 py-4 text-right">Ngày nhận</th>
                                                            <th className="px-5 py-4 text-center">Thao tác</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                                        {ownersLoading ? (
                                                            <tr><td colSpan="5" className="px-5 py-24 text-center text-xs font-bold uppercase text-gray-500">Đang tải dữ liệu...</td></tr>
                                                        ) : owners.length > 0 ? (
                                                            owners.map(owner => (
                                                                <tr key={owner.id} className="hover:bg-gray-100/30 dark:hover:bg-white/5 transition-colors group">
                                                                    <td className="px-5 py-3">
                                                                        <div className="flex items-center gap-2.5">
                                                                            <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-blue-600 text-[11px] font-bold overflow-hidden border border-gray-200/50">
                                                                                {owner.current_owner?.avatar_url ? (
                                                                                    <img 
                                                                                        src={owner.current_owner.avatar_url.startsWith('http') ? owner.current_owner.avatar_url : `http://localhost:5000/${owner.current_owner.avatar_url}`} 
                                                                                        className="w-full h-full object-cover" 
                                                                                        alt="" 
                                                                                    />
                                                                                ) : owner.current_owner?.full_name?.charAt(0)}
                                                                            </div>
                                                                            <div className="min-w-0">
                                                                                <p className="text-[11px] font-bold text-gray-900 dark:text-white truncate max-w-[140px]">{owner.current_owner?.full_name}</p>
                                                                                <p className="text-[9px] font-bold text-gray-500 lowercase truncate max-w-[140px]">{owner.current_owner?.email}</p>
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-5 py-3 text-[10px] font-bold text-gray-500">
                                                                        {owner.current_owner?.phone_number || 'N/A'}
                                                                    </td>
                                                                    <td className="px-5 py-3">
                                                                        <span className="text-[10px] font-bold text-blue-600 uppercase">#{owner.id.slice(-8)}</span>
                                                                    </td>
                                                                    <td className="px-5 py-3">
                                                                        <span className="text-[10px] font-bold text-gray-500 uppercase">
                                                                            {owner.order?.order_number || (owner.order_id ? `#ORD-${owner.order_id.slice(-8)}` : 'N/A')}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-5 py-3 text-center">
                                                                        <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase shadow-sm border ${owner.is_used ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-green-500/10 text-green-500 border-green-500/20'}`}>
                                                                            {owner.is_used ? 'Đã Check-in' : 'Hợp lệ'}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-5 py-3 text-right text-[9px] font-bold text-gray-500 uppercase">
                                                                        {owner.order?.created_at ? format(new Date(owner.order.created_at), 'dd/MM/yyyy HH:mm', { locale: vi }) : 'N/A'}
                                                                    </td>
                                                                    <td className="px-5 py-3 text-center">
                                                                        {owner.is_used && (
                                                                            <button onClick={() => navigate(`/organizer/orders/${owner.order_id}`)} className="p-2 bg-gray-100/50 dark:bg-white/5 text-gray-500 hover:text-blue-600 hover:bg-blue-600/10 rounded-lg transition-all active:scale-90">
                                                                                <Eye className="w-4 h-4" />
                                                                            </button>
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            ))
                                                        ) : (
                                                            <tr><td colSpan="5" className="px-5 py-24 text-center text-xs font-bold uppercase text-gray-500">Không có dữ liệu người tham gia</td></tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-4 animate-in fade-in duration-300">
                                    {event.ticket_tiers?.map(t => {
                                        const sold = t._count.tickets || 0;
                                        const progress = t.quantity_total > 0 ? Math.round((sold/t.quantity_total)*100) : 0;
                                        return (
                                            <div key={t.id} onClick={() => setSelectedTier(t)} className="p-5 bg-gray-50/50 dark:bg-black/20 border border-gray-200 dark:border-white/5 rounded-2xl cursor-pointer hover:bg-white dark:hover:bg-[#16161a] hover:border-blue-600/30 transition-all active:scale-[0.98]">
                                                <div className="flex justify-between items-start mb-5"><div className="flex items-center gap-2.5"><div className="p-2 bg-blue-600/10 rounded-xl text-blue-600"><Ticket className="w-4 h-4" /></div><h4 className="text-[12px] font-bold text-gray-900 dark:text-white leading-none">{t.tier_name}</h4></div><div className="p-1.5 bg-gray-100 dark:bg-white/10 rounded-lg text-gray-500"><Eye className="w-3.5 h-3.5" /></div></div>
                                                <div className="flex justify-between items-end mb-5"><div><p className="text-[10px] font-bold text-gray-500 mb-1">Giá vé</p><p className="text-lg font-black text-blue-600">{new Intl.NumberFormat('vi-VN').format(t.price)} đ</p></div><div className="text-right"><p className="text-[10px] font-bold text-gray-500 mb-1">Đã bán</p><div className="flex items-baseline gap-1.5 font-bold"><span className="text-base text-gray-900 dark:text-white">{sold}</span><span className="text-[px] text-gray-500">/ {t.quantity_total}</span></div></div></div>
                                                <div className="h-1.5 w-full bg-gray-200 dark:bg-white/5 rounded-full overflow-hidden mb-1"><div className="h-full bg-blue-600 transition-all duration-1000" style={{ width: `${progress}%` }} /></div>
                                                <div className="flex justify-between text-[9px] font-bold text-gray-500 "><span>Tiến độ</span><span>{progress}%</span></div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* --- ORDERS TAB --- */}
                    {activeTab === 'orders' && (
                        <div className="space-y-4 animate-in fade-in duration-300">
                             <div className="flex items-center justify-between mb-4 px-2"><h3 className="text-[11px] font-black text-gray-900 dark:text-white uppercase">Đơn hàng mới nhất</h3><button onClick={() => navigate('/organizer/orders')} className="text-[10px] font-bold text-blue-600 hover:text-blue-700 transition-colors uppercase  flex items-center gap-1.5">Quản lý nâng cao <ExternalLink className="w-3 h-3" /></button></div>
                            <div className="border border-gray-200 dark:border-white/5 rounded-xl overflow-hidden">
                                <table className="w-full text-left bg-gray-50/20 dark:bg-black/10">
                                    <thead><tr className="bg-gray-100/50 dark:bg-white/5 text-[10px] font-bold text-gray-600 uppercase border-b border-gray-200 dark:border-white/5"><th className="px-6 py-3">Mã đơn</th><th className="px-6 py-3">Khách hàng</th><th className="px-6 py-3 text-center">Số lượng</th><th className="px-6 py-3 text-right">Tổng tiền</th><th className="px-6 py-3 text-center">Thời gian</th><th className="px-6 py-3 text-center w-24">Thao tác</th></tr></thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                        {event.recent_orders?.map(order => (
                                            <tr key={order.id} className="hover:bg-gray-100/30 dark:hover:bg-white/5 transition-colors group">
                                                <td className="px-6 py-3.5">
                                                    <p className="text-[11px] font-black text-gray-900 dark:text-white uppercase">{order.order_number}</p>
                                                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase inline-block mt-0.5 ${['paid', 'success', 'completed'].includes(order.status) ? 'bg-green-600/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                                        {order.status === 'paid' || order.status === 'success' ? 'Đã thanh toán' : 'Thất bại'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3.5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 flex-shrink-0">
                                                            {order.customer?.avatar_url ? (
                                                                <img src={order.customer.avatar_url} alt="" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-gray-500">
                                                                    {order.customer?.full_name?.charAt(0)}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-[11px] font-bold text-gray-900 dark:text-white truncate max-w-[180px]">{order.customer?.full_name}</p>
                                                            <p className="text-[9px] font-bold text-gray-500 truncate max-w-[180px]">{order.customer?.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3.5 text-center">
                                                    <div className="flex flex-col items-center gap-1">
                                                        {order.ticket_count > 0 && <span className="text-[10px] font-bold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded-md">{order.ticket_count} vé</span>}
                                                        {order.merch_count > 0 && <span className="text-[10px] font-bold text-blue-600 bg-blue-600/10 px-2 py-0.5 rounded-md">{order.merch_count} sản phẩm</span>}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3.5 text-right">
                                                    <p className="font-bold text-[12px] text-gray-900 dark:text-white">{new Intl.NumberFormat('vi-VN').format(order.total_amount)} đ</p>
                                                    <p className="text-[9px] font-bold text-green-500 mt-0.5">Thực nhận: {new Intl.NumberFormat('vi-VN').format(order.net_revenue)} đ</p>
                                                </td>
                                                <td className="px-6 py-3.5 text-center text-[10px] text-gray-600 font-bold uppercase">
                                                    {format(new Date(order.created_at), 'dd/MM/yyyy HH:mm', { locale: vi })}
                                                </td>
                                                <td className="px-6 py-3.5 text-center">
                                                    <button onClick={() => navigate(`/organizer/orders/${order.id}`)} className="p-2 bg-gray-100/50 dark:bg-white/5 text-gray-500 hover:text-blue-600 hover:bg-blue-600/10 rounded-lg transition-all active:scale-90">
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        )) || <tr><td colSpan="6" className="py-20 text-center text-[11px] font-bold uppercase text-gray-500">Không có đơn hàng nào</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* --- RESALE / MARKETPLACE TAB --- */}
                    {activeTab === 'resale' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            {/* Analytics */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-5 bg-gradient-to-br from-blue-600/10 to-transparent border border-blue-600/20 rounded-2xl">
                                    <div className="flex justify-between items-start mb-2"><h4 className="text-[10px] font-bold text-gray-500 uppercase">Tổng GD Chợ Vé</h4><div className="p-1.5 bg-blue-600/20 rounded-lg text-blue-600"><DollarSign className="w-4 h-4"/></div></div>
                                    <p className="text-2xl font-black text-gray-900 dark:text-white">{new Intl.NumberFormat('vi-VN').format(event.financials?.resale_volume || 0)} đ</p>
                                </div>
                                <div className="p-5 bg-gradient-to-br from-green-600/10 to-transparent border border-green-600/20 rounded-2xl">
                                    <div className="flex justify-between items-start mb-2"><h4 className="text-[10px] font-bold text-gray-500 uppercase">Tiền bản quyền (BTC thu)</h4><div className="p-1.5 bg-green-600/20 rounded-lg text-green-600"><Wallet className="w-4 h-4"/></div></div>
                                    <p className="text-2xl font-black text-green-600">+{new Intl.NumberFormat('vi-VN').format(event.financials?.resale_royalties || 0)} đ</p>
                                </div>
                                <div className="p-5 bg-gray-50/50 dark:bg-black/20 border border-gray-200 dark:border-white/5 rounded-2xl">
                                    <div className="flex justify-between items-start mb-2"><h4 className="text-[10px] font-bold text-gray-500 uppercase">Vé đã bán lại</h4><div className="p-1.5 bg-gray-100 dark:bg-white/10 rounded-lg text-gray-500"><TrendingUp className="w-4 h-4"/></div></div>
                                    <p className="text-2xl font-black text-gray-900 dark:text-white">{secondaryActivity.marketplace?.length || 0} <span className="text-[12px] font-bold text-gray-500">lượt</span></p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                {/* Settings */}
                                <div className="lg:col-span-4">
                                    <form onSubmit={handleUpdateResalePolicy} className="p-5 bg-gray-50 dark:bg-[#16161a] border border-gray-200 dark:border-white/5 rounded-2xl space-y-5 sticky top-4 shadow-sm">
                                        <div className="flex items-center gap-2 mb-2">
                                            <ShieldCheck className="w-4 h-4 text-blue-600" />
                                            <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase">Cấu hình Chợ Vé</h3>
                                        </div>
                                        
                                        <div className="flex items-center justify-between p-3 bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/5">
                                            <div>
                                                <p className="text-[11px] font-bold text-gray-900 dark:text-white uppercase">Cho phép bán lại</p>
                                                <p className="text-[9px] text-gray-500 mt-0.5">Bật chợ vé thứ cấp</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" className="sr-only peer" checked={resaleSettings.allow_resale} onChange={(e) => setResaleSettings({...resaleSettings, allow_resale: e.target.checked})} disabled={event.status === 'active'} />
                                                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                                            </label>
                                        </div>

                                        <div className="space-y-4 pt-2">
                                            <div>
                                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Phí bản quyền (Hoa hồng BTC) %</label>
                                                <input type="number" step="0.1" min="0" max="10" className="w-full px-3 py-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-[12px] font-bold focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all disabled:opacity-50" value={resaleSettings.royalty_fee_percent} onChange={(e) => setResaleSettings({...resaleSettings, royalty_fee_percent: e.target.value})} disabled={event.status === 'active'} />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Giới hạn giá trần bán lại (%)</label>
                                                <div className="relative">
                                                    <input type="number" step="0.1" min="100" max="150" className="w-full pl-3 pr-10 py-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-[12px] font-bold focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all disabled:opacity-50" value={resaleSettings.resale_price_limit_percent} onChange={(e) => setResaleSettings({...resaleSettings, resale_price_limit_percent: e.target.value})} disabled={event.status === 'active'} />
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-500">%</span>
                                                </div>
                                                <p className="text-[9px] text-gray-500 mt-1.5">Tối đa 108% theo quy định</p>
                                            </div>
                                        </div>

                                        <button type="submit" disabled={savingResale || event.status === 'active'} className="w-full py-2.5 bg-blue-600 text-white font-bold uppercase text-[11px] rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 flex justify-center items-center gap-2 shadow-lg shadow-blue-600/20">
                                            {savingResale ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Lưu cấu hình'}
                                        </button>
                                        {event.status === 'active' && (
                                            <p className="text-[9px] text-red-500 text-center font-bold">Không thể đổi cấu hình khi đã mở bán</p>
                                        )}
                                    </form>
                                </div>

                                {/* Activity List */}
                                <div className="lg:col-span-8 space-y-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <History className="w-4 h-4 text-blue-600" />
                                        <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase">Giao dịch mua bán lại</h3>
                                    </div>
                                    <div className="border border-gray-200 dark:border-white/5 rounded-xl overflow-hidden">
                                        <table className="w-full text-left bg-white dark:bg-[#111114]">
                                            <thead>
                                                <tr className="bg-gray-50 dark:bg-white/5 text-[10px] font-bold text-gray-600 tracking-widest border-b border-gray-200 dark:border-white/5">
                                                    <th className="px-5 py-3">Ngày</th>
                                                    <th className="px-5 py-3">Vé / Hạng</th>
                                                    <th className="px-5 py-3">Người bán</th>
                                                    <th className="px-5 py-3">Người mua</th>
                                                    <th className="px-5 py-3 text-right">Giá trị</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                                {loadingSecondary ? (
                                                    <tr><td colSpan="5" className="px-5 py-12 text-center"><Loader2 className="w-6 h-6 text-blue-600 animate-spin mx-auto"/></td></tr>
                                                ) : (
                                                    (secondaryActivity.marketplace || [])
                                                    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                                                    .slice(0, 50)
                                                    .map((tx, index) => {
                                                        const seller = tx.seller;
                                                        const buyer = tx.buyer;
                                                        const date = tx.created_at;

                                                        return (
                                                            <tr key={tx.id || index} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                                                                <td className="px-5 py-3">
                                                                    <p className="text-[10px] font-bold text-gray-900 dark:text-white uppercase">{format(new Date(date), 'dd/MM HH:mm')}</p>
                                                                </td>
                                                                <td className="px-5 py-3">
                                                                    <p className="text-[11px] font-bold text-gray-900 dark:text-white uppercase">{tx.ticket?.ticket_tier?.tier_name}</p>
                                                                    <p className="text-[9px] text-gray-500">#{tx.ticket?.id?.slice(-8)}</p>
                                                                </td>
                                                                <td className="px-5 py-3">
                                                                    <div className="flex items-center gap-2">
                                                                        <img src={seller?.avatar_url?.startsWith('http') ? seller.avatar_url : seller?.avatar_url ? `http://localhost:5000/${seller.avatar_url}` : 'https://ui-avatars.com/api/?name=' + seller?.full_name} className="w-6 h-6 rounded-full bg-gray-200 object-cover" alt=""/>
                                                                        <p className="text-[10px] font-bold text-gray-600 dark:text-gray-400 truncate max-w-[100px]">{seller?.full_name}</p>
                                                                    </div>
                                                                </td>
                                                                <td className="px-5 py-3">
                                                                    <div className="flex items-center gap-2">
                                                                        <img src={buyer?.avatar_url?.startsWith('http') ? buyer.avatar_url : buyer?.avatar_url ? `http://localhost:5000/${buyer.avatar_url}` : 'https://ui-avatars.com/api/?name=' + buyer?.full_name} className="w-6 h-6 rounded-full bg-gray-200 object-cover" alt=""/>
                                                                        <p className="text-[10px] font-bold text-gray-600 dark:text-gray-400 truncate max-w-[100px]">{buyer?.full_name}</p>
                                                                    </div>
                                                                </td>
                                                                <td className="px-5 py-3 text-right">
                                                                    <p className="text-[11px] font-bold text-green-600">{new Intl.NumberFormat('vi-VN').format(tx.buyer_pay_amount)} đ</p>
                                                                </td>
                                                                <td className="px-5 py-3 text-center">
                                                                    <button 
                                                                        onClick={() => {
                                                                            if (tx.nft_transfer_tx_hash) window.open(`https://amoy.polygonscan.com/tx/${tx.nft_transfer_tx_hash}`, '_blank');
                                                                            else toast.error('Giao dịch chưa có mã Hash trên Blockchain');
                                                                        }}
                                                                        className="p-1.5 bg-gray-100 dark:bg-white/5 hover:bg-blue-100 dark:hover:bg-blue-500/20 text-gray-500 hover:text-blue-600 rounded-lg transition-colors"
                                                                        title="Xem chi tiết Hash"
                                                                    >
                                                                        <Eye className="w-4 h-4" />
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })
                                                )}
                                                {(!loadingSecondary && (secondaryActivity.marketplace?.length === 0)) && (
                                                    <tr><td colSpan="5" className="px-5 py-16 text-center text-[11px] font-bold uppercase text-gray-500">Chưa có giao dịch bán lại nào</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- TRANSFERS TAB --- */}
                    {activeTab === 'transfers' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            {/* Analytics */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-5 bg-gradient-to-br from-indigo-600/10 to-transparent border border-indigo-600/20 rounded-2xl">
                                    <div className="flex justify-between items-start mb-2"><h4 className="text-[10px] font-bold text-gray-500 uppercase">Tổng lượt chuyển nhượng</h4><div className="p-1.5 bg-indigo-600/20 rounded-lg text-indigo-600"><Send className="w-4 h-4"/></div></div>
                                    <p className="text-2xl font-black text-gray-900 dark:text-white">{secondaryActivity.transfers?.length || 0} <span className="text-[12px] font-bold text-gray-500">vé</span></p>
                                </div>
                                <div className="p-5 bg-gray-50/50 dark:bg-black/20 border border-gray-200 dark:border-white/5 rounded-2xl">
                                    <div className="flex justify-between items-start mb-2"><h4 className="text-[10px] font-bold text-gray-500 uppercase">Tổng phí chuyển nhượng (Hệ thống thu)</h4><div className="p-1.5 bg-gray-100 dark:bg-white/10 rounded-lg text-gray-500"><Wallet className="w-4 h-4"/></div></div>
                                    <p className="text-2xl font-black text-gray-900 dark:text-white">{new Intl.NumberFormat('vi-VN').format((secondaryActivity.transfers?.length || 0) * Number(event.resale_gas_fee || 10000))} <span className="text-[12px] font-bold text-gray-500">đ</span></p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                {/* Settings */}
                                <div className="lg:col-span-4">
                                    <form onSubmit={handleUpdateTransferPolicy} className="p-5 bg-gray-50 dark:bg-[#16161a] border border-gray-200 dark:border-white/5 rounded-2xl space-y-5 sticky top-4 shadow-sm">
                                        <div className="flex items-center gap-2 mb-2">
                                            <ShieldCheck className="w-4 h-4 text-indigo-600" />
                                            <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase">Cấu hình Chuyển nhượng</h3>
                                        </div>
                                        
                                        <div className="flex items-center justify-between p-3 bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/5">
                                            <div>
                                                <p className="text-[11px] font-bold text-gray-900 dark:text-white uppercase">Cho phép sang tay</p>
                                                <p className="text-[9px] text-gray-500 mt-0.5">Bật tính năng tặng vé</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" className="sr-only peer" checked={transferSettings.allow_transfer} onChange={(e) => setTransferSettings({...transferSettings, allow_transfer: e.target.checked})} disabled={event.status === 'ended'} />
                                                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                                            </label>
                                        </div>

                                        <button type="submit" disabled={savingTransfer || event.status === 'ended'} className="w-full py-2.5 bg-indigo-600 text-white font-bold uppercase text-[11px] rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50 flex justify-center items-center gap-2 shadow-lg shadow-indigo-600/20">
                                            {savingTransfer ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Lưu cấu hình'}
                                        </button>
                                        {event.status === 'ended' && (
                                            <p className="text-[9px] text-red-500 text-center font-bold">Không thể đổi cấu hình khi sự kiện đã kết thúc</p>
                                        )}
                                    </form>
                                </div>

                                {/* Activity List */}
                                <div className="lg:col-span-8 space-y-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <History className="w-4 h-4 text-indigo-600" />
                                        <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase">Lịch sử chuyển nhượng</h3>
                                    </div>
                                    <div className="border border-gray-200 dark:border-white/5 rounded-xl overflow-hidden">
                                        <table className="w-full text-left bg-white dark:bg-[#111114]">
                                            <thead>
                                                <tr className="bg-gray-50 dark:bg-white/5 text-[10px] font-bold text-gray-600 uppercase tracking-widest border-b border-gray-200 dark:border-white/5">
                                                    <th className="px-5 py-3">Ngày</th>
                                                    <th className="px-5 py-3">Vé / Hạng</th>
                                                    <th className="px-5 py-3">Người gửi</th>
                                                    <th className="px-5 py-3">Người nhận</th>
                                                    <th className="px-5 py-3 text-right">Phí chuyển</th>
                                                    <th className="px-5 py-3 text-center"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                                {loadingSecondary ? (
                                                    <tr><td colSpan="5" className="px-5 py-12 text-center"><Loader2 className="w-6 h-6 text-indigo-600 animate-spin mx-auto"/></td></tr>
                                                ) : (
                                                    (secondaryActivity.transfers || [])
                                                    .sort((a, b) => new Date(b.requested_at) - new Date(a.requested_at))
                                                    .slice(0, 50)
                                                    .map((tx, index) => {
                                                        const seller = tx.sender;
                                                        const buyer = tx.receiver;
                                                        const date = tx.requested_at;

                                                        return (
                                                            <tr key={tx.id || index} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                                                                <td className="px-5 py-3">
                                                                    <p className="text-[10px] font-bold text-gray-900 dark:text-white uppercase">{format(new Date(date), 'dd/MM HH:mm')}</p>
                                                                </td>
                                                                <td className="px-5 py-3">
                                                                    <p className="text-[11px] font-bold text-gray-900 dark:text-white uppercase">{tx.ticket?.ticket_tier?.tier_name}</p>
                                                                    <p className="text-[9px] text-gray-500">#{tx.ticket?.id?.slice(-8)}</p>
                                                                </td>
                                                                <td className="px-5 py-3">
                                                                    <div className="flex items-center gap-2">
                                                                        <img src={seller?.avatar_url?.startsWith('http') ? seller.avatar_url : seller?.avatar_url ? `http://localhost:5000/${seller.avatar_url}` : 'https://ui-avatars.com/api/?name=' + seller?.full_name} className="w-6 h-6 rounded-full bg-gray-200 object-cover" alt=""/>
                                                                        <p className="text-[10px] font-bold text-gray-600 dark:text-gray-400 truncate max-w-[100px]">{seller?.full_name}</p>
                                                                    </div>
                                                                </td>
                                                                <td className="px-5 py-3">
                                                                    <div className="flex items-center gap-2">
                                                                        <img src={buyer?.avatar_url?.startsWith('http') ? buyer.avatar_url : buyer?.avatar_url ? `http://localhost:5000/${buyer.avatar_url}` : 'https://ui-avatars.com/api/?name=' + buyer?.full_name} className="w-6 h-6 rounded-full bg-gray-200 object-cover" alt=""/>
                                                                        <p className="text-[10px] font-bold text-gray-600 dark:text-gray-400 truncate max-w-[100px]">{buyer?.full_name}</p>
                                                                    </div>
                                                                </td>
                                                                <td className="px-5 py-3 text-right">
                                                                    <p className="text-[11px] font-bold text-indigo-600">{new Intl.NumberFormat('vi-VN').format(Number(event.resale_gas_fee || 10000))} đ</p>
                                                                </td>
                                                                <td className="px-5 py-3 text-center">
                                                                    <button 
                                                                        onClick={() => {
                                                                            if (tx.nft_transfer_tx_hash) window.open(`https://amoy.polygonscan.com/tx/${tx.nft_transfer_tx_hash}`, '_blank');
                                                                            else toast.error('Giao dịch chưa có mã Hash trên Blockchain');
                                                                        }}
                                                                        className="p-1.5 bg-gray-100 dark:bg-white/5 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-gray-500 hover:text-indigo-600 rounded-lg transition-colors"
                                                                        title="Xem chi tiết Hash"
                                                                    >
                                                                        <Eye className="w-4 h-4" />
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })
                                                )}
                                                {(!loadingSecondary && (secondaryActivity.transfers?.length === 0)) && (
                                                    <tr><td colSpan="5" className="px-5 py-16 text-center text-[11px] font-bold uppercase text-gray-500">Chưa có giao dịch chuyển nhượng nào</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- SEATING TAB --- */}
                    {activeTab === 'seating' && (
                        <div className="animate-in fade-in slide-in-from-right-2 duration-400">
                             <div className="flex items-center justify-between mb-6 px-2">
                                <div>
                                    <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase flex items-center gap-2"><Layout className="w-4 h-4 text-indigo-600"/> Sơ đồ phân khu & Chỗ ngồi</h3>
                                    <p className="text-[11px] font-bold text-gray-500 mt-1 uppercase ">Nhấp vào ảnh để xem kích thước lớn</p>
                                </div>
                            </div>
                            {event.seating_charts && event.seating_charts.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {event.seating_charts.map((url, index) => (
                                        <div key={index} className="relative aspect-video rounded-2xl overflow-hidden border border-gray-200 dark:border-white/10 group cursor-pointer shadow-sm hover:border-indigo-600/30 transition-all" onClick={() => window.open(url, '_blank')}>
                                            <img src={url} alt={`Sơ đồ ${index + 1}`} className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-700" />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                                <div className="bg-white/90 dark:bg-black/60 p-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><ExternalLink className="w-5 h-5 text-indigo-600" /></div>
                                            </div>
                                            <div className="absolute bottom-3 left-3 px-3 py-1 bg-black/60 backdrop-blur-md rounded-lg text-white text-[9px] font-bold uppercase">PHÂN KHU #{index + 1}</div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-32 opacity-30 "><Layout className="w-12 h-12 mb-4" /><p className="text-xs font-bold uppercase">Chưa có ảnh sơ đồ chỗ ngồi</p></div>
                            )}
                        </div>
                    )}

                    {/* --- PRODUCTS TAB --- */}
                    {activeTab === 'products' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                             <div className="flex items-center justify-between mb-2"><h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase">Sản phẩm Merchandise ({event.merchandise?.length || 0})</h3><button onClick={() => navigate('/organizer/merchandise')} className="px-4 py-2 bg-blue-600 text-white font-bold uppercase text-[10px] rounded-xl hover:bg-blue-700 transition-all">Thêm sản phẩm</button></div>
                            {event.merchandise?.length > 0 ? (<div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-4">{event.merchandise.map(p => (<div key={p.id} className="bg-gray-50/50 dark:bg-black/20 border border-gray-200 dark:border-white/5 rounded-2xl shrink-0 group hover:border-blue-600/30 transition-all"><div className="aspect-square relative overflow-hidden rounded-t-2xl"><img src={p.image_url} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt=""/><div className="absolute top-2 right-2 bg-black/60 backdrop-blur rounded-lg px-2 py-1 text-[9px] font-bold text-white">{new Intl.NumberFormat('vi-VN').format(p.price)} đ</div></div><div className="p-3"><p className="text-[10px] font-bold text-gray-900 dark:text-white uppercase truncate mb-2">{p.name}</p><div className="flex justify-between items-center text-[9px] font-bold text-gray-500 uppercase  opacity-70 pt-2 border-t border-gray-200 dark:border-white/5"><span>Tồn kho: {p.stock}</span><span>Bán: {p._count?.order_items || 0}</span></div></div></div>))}</div>) : (<div className="py-32 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 dark:border-white/5 rounded-[32px] opacity-30 "><Tag className="w-12 h-12 mb-3"/><p className="text-xs font-bold uppercase">Chưa có Merchandise</p></div>)}
                        </div>
                    )}

                    {/* --- BLOGS TAB --- */}
                    {activeTab === 'blogs' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                             <div className="flex items-center justify-between mb-2"><h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase">Tin tức & Thông báo</h3><button onClick={() => navigate('/organizer/blog/create')} className="px-4 py-2 bg-blue-600 text-white font-bold uppercase text-[10px] rounded-xl">Viết tin</button></div>
                            {event.blogs?.length > 0 ? (<div className="grid grid-cols-1 md:grid-cols-2 gap-4">{event.blogs.map(blog => (<div key={blog.id} className="flex gap-4 p-4 bg-gray-50/50 dark:bg-black/20 border border-gray-200 dark:border-white/5 rounded-2xl group hover:border-blue-600/30 transition-all"><div className="w-24 h-24 rounded-xl overflow-hidden shrink-0"><img src={blog.image_url} className="w-full h-full object-cover group-hover:scale-110" alt=""/></div><div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5"><h4 className="text-[12px] font-bold text-gray-900 dark:text-white uppercase truncate">{blog.title}</h4><p className="text-[11px] text-gray-500 font-bold  line-clamp-2 opacity-80">{blog.content.replace(/<[^>]*>/g, '')}</p><div className="flex items-center gap-3 text-[9px] font-bold text-blue-600 "><span>{format(new Date(blog.created_at), 'dd/MM/yyyy')}</span><span className="w-1 h-1 bg-blue-600/30 rounded-full" /><span>Bởi {blog.author?.full_name}</span></div></div></div>))}</div>) : (<div className="py-32 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 dark:border-white/5 rounded-[32px] opacity-30 "><Newspaper className="w-12 h-12 mb-3"/><p className="text-xs font-bold uppercase">Chưa có bài viết mới</p></div>)}
                        </div>
                    )}

                    {/* --- LOCATION TAB --- */}
                    {activeTab === 'location' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                             <div className="grid grid-cols-1 lg:grid-cols-12 gap-6"><div className="lg:col-span-4 space-y-6"><div className="p-6 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/5 rounded-2xl space-y-4"><div className="flex items-start gap-3.5"><div className="p-2.5 bg-indigo-600/10 text-indigo-600 rounded-xl"><MapPin className="w-5 h-5"/></div><div><p className="text-[10px] font-bold text-gray-500 uppercase  mb-1">Địa chỉ tổ chức</p><p className="text-[13px] font-bold text-gray-900 dark:text-white uppercase leading-snug tracking-tight">{event.location_address || 'Địa điểm chưa xác định'}</p></div></div><div className="pt-4 border-t border-gray-200 dark:border-white/10 space-y-2.5"><p className="text-[10px] font-bold text-indigo-600 uppercase ">Tọa độ vệ tinh</p><div className="flex justify-between text-[11px] font-bold uppercase"><span className="text-gray-500">Vĩ độ:</span><span className="text-gray-900 dark:text-white">{event.latitude || '--'}</span></div><div className="flex justify-between text-[11px] font-bold uppercase"><span className="text-gray-500">Kinh độ:</span><span className="text-gray-900 dark:text-white ">{event.longitude || '--'}</span></div></div></div><button onClick={() => window.open(`https://www.google.com/maps?q=${event.latitude},${event.longitude}`, '_blank')} className="w-full py-3.5 bg-blue-600 text-white font-bold uppercase text-[11px] rounded-2xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/10">Mở Google Maps <ExternalLink className="w-3.5 h-3.5"/></button></div><div className="lg:col-span-8 aspect-video rounded-3xl overflow-hidden border border-gray-200 dark:border-white/5 shadow-inner">{event.latitude && event.longitude ? (<iframe width="100%" height="100%" frameBorder="0" style={{ border: 0 }} src={`https://maps.google.com/maps?q=${event.latitude},${event.longitude}&hl=vi&z=15&output=embed`} allowFullScreen className="opacity-90 grayscale-[10%]" />) : (<div className="w-full h-full bg-gray-100 dark:bg-white/5 flex flex-col items-center justify-center opacity-30 "><MapPin className="w-12 h-12 mb-4"/><p className="text-xs font-bold uppercase">Tọa độ chưa thiết lập</p></div>)}</div></div>
                        </div>
                    )}

                    {/* --- LOGS TAB --- */}
                    {activeTab === 'logs' && (
                        <div className="space-y-4 animate-in fade-in duration-300">
                             <div className="flex items-center justify-between mb-4 px-2"><h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase flex items-center gap-2"><History className="w-4 h-4 text-blue-600"/> Nhật ký hệ thống</h3></div><div className="space-y-3">{event.admin_logs?.length > 0 ? (event.admin_logs.map(log => (<div key={log.id} className="p-4 bg-gray-50/50 dark:bg-black/20 border border-gray-200 dark:border-white/5 rounded-2xl group hover:border-blue-600/30 transition-all flex items-start gap-4"><div className="w-10 h-10 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl flex items-center justify-center text-blue-600 relative shrink-0"><ShieldCheck className="w-5 h-5" /><div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-blue-600 rounded-full border-2 border-white dark:border-[#111114]"></div></div><div className="flex-1 space-y-1.5"><div className="flex items-center justify-between"><h5 className="text-[11px] font-bold text-gray-900 dark:text-white uppercase tracking-tight group-hover:text-blue-600 transition-colors">Hành động: {log.action_type}</h5><span className="text-[9px] font-bold text-gray-500 uppercase ">{format(new Date(log.created_at), 'dd/MM/yyyy HH:mm')}</span></div><p className="text-[10px] font-bold text-gray-500 flex items-center gap-1.5 opacity-70"><Users className="w-3 h-3" /> Bởi {log.admin?.full_name} ({log.admin?.role})</p>{log.new_value && <div className="p-3 bg-white dark:bg-black/40 border border-gray-200 dark:border-white/5 rounded-xl text-[10px] text-blue-600/80 leading-relaxed break-all mt-2">{log.new_value}</div>}</div></div>))) : (<div className="py-32 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 dark:border-white/5 rounded-[32px] opacity-30 "><History className="w-12 h-12 mb-3"/><p className="text-xs font-bold uppercase">Chưa có nhật ký</p></div>)}</div>
                        </div>
                    )}
                </div>
            </div>

            <div className="py-6 pt-10 border-t border-gray-200 dark:border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4 opacity-40 font-bold">
                <p className="text-[9px] uppercase tracking-widest">© 2026 BASTICKET - TRANG QUẢN TRỊ BTC</p>
                <div className="flex items-center gap-6">
                    <span className="flex items-center gap-1.5 text-[9px] lg:text-[10px] uppercase tracking-widest"><ShieldCheck className="w-3 h-3 text-blue-600" /> BẢO MẬT BỚI BLOCKCHAIN</span>
                </div>
            </div>

            <EmergencyActionModal isOpen={isEmergencyModalOpen} onClose={() => setIsEmergencyModalOpen(false)} onSubmit={handleEmergencyAction} event={event} />
        </div>
    );
};

export default EventDetail;

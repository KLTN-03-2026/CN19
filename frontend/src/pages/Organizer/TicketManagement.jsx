import React, { useState, useEffect, useRef } from 'react';
import { 
    Ticket, 
    TrendingUp, 
    DollarSign, 
    Search, 
    Filter, 
    ChevronLeft, 
    ChevronRight,
    ChevronDown,
    Loader2,
    Calendar,
    User,
    CheckCircle2,
    Clock,
    AlertCircle,
    ExternalLink,
    Tag,
    Activity,
    BarChart3
} from 'lucide-react';
import { ticketService } from '../../services/ticket.service';
import { organizerService } from '../../services/organizer.service';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import toast from 'react-hot-toast';

// Custom Select Component for reliable dark mode aesthetics
const CustomSelect = ({ value, onChange, options, placeholder, icon: Icon, className = "" }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(opt => String(opt.value) === String(value));

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-white dark:bg-[#1a1a1e] border border-gray-200 dark:border-white/5 rounded-2xl py-3 px-10 text-[11px] font-black uppercase text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 transition-all text-left flex items-center justify-between group shadow-sm"
            >
                <div className="flex items-center gap-3 truncate">
                    {Icon && <Icon className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors shrink-0" />}
                    <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
                </div>
                <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute z-[100] mt-2 w-full bg-white dark:bg-[#1f1f23] border border-gray-100 dark:border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] py-2 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="max-h-60 overflow-y-auto custom-scrollbar">
                        {options.length === 0 ? (
                            <div className="px-5 py-3 text-[10px] text-gray-400">Không có dữ liệu</div>
                        ) : (
                            options.map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => {
                                        onChange(opt.value);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full px-5 py-3 text-[10px] font-bold uppercase text-left transition-colors flex items-center justify-between ${
                                        String(value) === String(opt.value)
                                        ? 'bg-blue-600 text-white' 
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'
                                    }`}
                                >
                                    <span className="truncate pr-2">{opt.label}</span>
                                    {String(value) === String(opt.value) && <CheckCircle2 className="w-3 h-3 text-white shrink-0" />}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const StatCard = ({ title, value, subValue, icon: Icon, color }) => (
    <div className="bg-white dark:bg-[#111114] px-5 py-4 rounded-[2rem] border border-gray-100 dark:border-white/5 relative overflow-hidden group hover:shadow-2xl transition-all duration-500">
        <div className={`absolute top-0 right-0 w-32 h-32 bg-${color}-500/5 blur-[60px] -mr-12 -mt-12 group-hover:bg-${color}-500/10 transition-colors`}></div>
        <div className="relative z-10 flex items-start justify-between">
            <div>
                <p className="text-[10px] font-black text-gray-400 dark:text-white/20 uppercase mb-3">{title}</p>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white">
                    {value}
                </h3>
                {subValue && (
                    <div className="flex items-center mt-3 gap-2">
                        <span className={`px-2 py-0.5 rounded-md bg-${color}-500/10 text-${color}-500 text-[10px] font-black`}>
                            {subValue}
                        </span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase italic">Tính đến hiện tại</span>
                    </div>
                )}
            </div>
            <div className={`p-3 bg-${color}-500/10 rounded-2xl group-hover:scale-110 transition-transform duration-500`}>
                <Icon className={`w-5 h-5 text-${color}-500`} />
            </div>
        </div>
    </div>
);

const TicketManagement = () => {
    const [stats, setStats] = useState(null);
    const [tickets, setTickets] = useState([]);
    const [events, setEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isStatsLoading, setIsStatsLoading] = useState(false);
    const [statsEventId, setStatsEventId] = useState('');
    const [tierPage, setTierPage] = useState(1);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, total_pages: 1 });
    
    // Filters
    const [filters, setFilters] = useState({
        event_id: '',
        ticket_tier_id: '',
        status: '',
        search: ''
    });

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        fetchTickets();
    }, [filters, pagination.page]);

    useEffect(() => {
        fetchStats(statsEventId);
        setTierPage(1); // Reset tier page when event changes
    }, [statsEventId]);

    const fetchInitialData = async () => {
        try {
            setIsLoading(true);
            const eventsRes = await organizerService.getMyEvents();
            setEvents(eventsRes.data || []);
            // Initial fetch of stats handled by statsEventId useEffect
        } catch (error) {
            toast.error('Không thể tải dữ liệu khởi tạo');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchStats = async (eventId = '') => {
        try {
            setIsStatsLoading(true);
            const res = await ticketService.getOrganizerStats({ event_id: eventId });
            setStats(res.data);
        } catch (error) {
            console.error('Fetch stats error:', error);
            toast.error('Không thể cập nhật thống kê');
        } finally {
            setIsStatsLoading(false);
        }
    };

    const fetchTickets = async () => {
        try {
            setIsLoading(true);
            const res = await ticketService.getOrganizerTickets({
                ...filters,
                page: pagination.page,
                limit: pagination.limit
            });
            setTickets(res.data);
            setPagination(prev => ({ 
                ...prev, 
                total: res.pagination.total, 
                total_pages: res.pagination.total_pages 
            }));
        } catch (error) {
            toast.error('Không thể tải danh sách vé');
        } finally {
            setIsLoading(false);
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => {
            const next = { ...prev, [key]: value };
            // Clear tier_id if event changes manually in the table filter
            if (key === 'event_id') next.ticket_tier_id = '';
            return next;
        });
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const handleTierClick = (tierId) => {
        setFilters({
            ...filters,
            event_id: statsEventId,
            ticket_tier_id: tierId
        });
        setPagination(prev => ({ ...prev, page: 1 }));
        
        // Scroll to the table section
        const tableElement = document.getElementById('ticket-table-section');
        if (tableElement) {
            tableElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'minted':
                return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            case 'used':
                return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            case 'reselling':
                return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
            case 'refunded':
                return 'bg-red-500/10 text-red-500 border-red-500/20';
            default:
                return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'minted': return 'Chưa sử dụng';
            case 'used': return 'Đã check-in';
            case 'reselling': return 'Đang rao bán';
            case 'refunded': return 'Đã hoàn tiền';
            default: return status;
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-2 rounded-[2.5rem]">
                <div className="flex items-center gap-6">
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase">
                            Quản lý <span className="text-blue-600">Vé đã bán</span>
                        </h1>
                        <p className="text-sm font-medium text-gray-400 dark:text-white/30 mt-1">
                            {pagination.total} vé được phát hành qua hệ thống
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center justify-center gap-3 bg-blue-600  text-white dark:text-black px-8 py-4 rounded-2xl font-black uppercase text-xs transition-all transform hover:scale-105 active:scale-95 shadow-xl">
                        Xuất báo cáo
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ">
                <StatCard 
                    title="Tổng doanh thu" 
                    value={`${(stats?.total_revenue || 0).toLocaleString()} VNĐ`}
                    subValue="Thanh toán thành công"
                    icon={DollarSign} 
                    color="emerald" 
                />
                <StatCard 
                    title="Vé đã phát hành" 
                    value={stats?.total_sold || 0}
                    subValue={`${stats?.total_sold || 0} NFT`}
                    icon={Ticket} 
                    color="blue" 
                />
                <StatCard 
                    title="Đã check-in" 
                    value={stats?.total_checkins || 0}
                    subValue={`${stats?.checkin_rate || 0}% tỉ lệ`}
                    icon={CheckCircle2} 
                    color="indigo" 
                />
                <StatCard 
                    title="Nhu cầu thị trường" 
                    value="Cao"
                    subValue="+12.5% resale"
                    icon={Activity} 
                    color="amber" 
                />
            </div>

            {/* Tier Summary Section */}
            <div className="bg-white dark:bg-[#111114] p-6 rounded-[2rem] border border-gray-200 dark:border-white/5 shadow-lg overflow-hidden transition-all duration-500">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <BarChart3 className="w-5 h-5 text-blue-600" />
                        <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase leading-none">Tiến độ theo hạng vé</h3>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Stats Event Filter */}
                        <CustomSelect 
                            value={statsEventId}
                            onChange={setStatsEventId}
                            placeholder="Tất cả sự kiện (Tổng quan)"
                            icon={Filter}
                            className="w-full sm:w-80"
                            options={[
                                { value: "", label: "Tất cả sự kiện (Tổng quan)" },
                                ...events.map(ev => ({ value: ev.id, label: ev.title.toUpperCase() }))
                            ]}
                        />

                        {isStatsLoading && (
                            <div className="flex items-center gap-2 px-3 py-1 bg-blue-600/10 rounded-full animate-pulse">
                                <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
                                <span className="text-[10px] font-bold text-blue-600 uppercase">Đang tải...</span>
                            </div>
                        )}
                    </div>
                </div>

                {!statsEventId && (!stats?.tiers || stats?.tiers.length === 0) ? (
                    <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 bg-gray-50/50 dark:bg-white/[0.01] rounded-[1.5rem] border border-dashed border-gray-200 dark:border-white/10 group hover:border-blue-600/30 transition-colors">
                        <div className="p-4 bg-blue-600/10 rounded-full text-blue-600 group-hover:scale-110 transition-transform">
                            <TrendingUp className="w-8 h-8" />
                        </div>
                        <div className="max-w-xs">
                            <p className="text-sm font-black text-gray-900 dark:text-white uppercase italic">Thống kê tổng hợp</p>
                            <p className="text-[11px] text-gray-400 font-medium mt-1">Chọn một sự kiện cụ thể để xem chi tiết tiến độ bán vé theo từng hạng</p>
                        </div>
                    </div>
                ) : stats?.tiers?.length > 0 ? (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {stats.tiers.slice((tierPage - 1) * 6, tierPage * 6).map((tier) => {
                                const percent = Math.round((tier.sold_count / tier.quantity_total) * 100);
                                const isActive = filters.ticket_tier_id === tier.id;
                                return (
                                    <button 
                                        key={tier.id} 
                                        onClick={() => handleTierClick(tier.id)}
                                        className={`group/tier text-left space-y-3 p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden ${
                                            isActive 
                                            ? 'bg-blue-600/[0.03] dark:bg-blue-600/[0.08] border-blue-600 shadow-[0_0_25px_rgba(37,99,235,0.15)] ring-1 ring-blue-600/20' 
                                            : 'bg-white dark:bg-[#1a1a1e] border-gray-200 dark:border-white/5 hover:border-blue-600/30 hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-none'
                                        }`}
                                    >
                                        <div className="flex justify-between items-start relative z-10">
                                            <div>
                                                <p className={`text-[9px] font-black uppercase mb-1 transition-colors ${isActive ? 'text-blue-600' : 'text-gray-400 dark:text-gray-500 group-hover/tier:text-blue-600'}`}>{tier.tier_name}</p>
                                                <p className="text-base font-black text-gray-900 dark:text-white italic leading-none">{tier.sold_count} <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium tracking-normal">/ {tier.quantity_total} vé</span></p>
                                            </div>
                                            <div className={`px-2 py-0.5 rounded text-[9px] font-black ${percent > 80 ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                                {percent}%
                                            </div>
                                        </div>
                                        <div className="w-full h-1.5 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden relative z-10">
                                            <div 
                                                className={`h-full transition-all duration-1000 ${percent > 80 ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.5)]'}`}
                                                style={{ width: `${percent}%` }}
                                            ></div>
                                        </div>
                                        <div className="flex justify-between items-center pt-1 relative z-10">
                                            <p className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase">
                                                Giá: <span className="text-gray-900 dark:text-white transition-colors">{Number(tier.price).toLocaleString()} VNĐ</span>
                                            </p>
                                            <p className="text-[9px] font-bold text-gray-400 dark:text-gray-500">
                                                Còn lại: <span className={tier.remaining < 10 ? 'text-red-500' : 'text-gray-600 dark:text-gray-300'}>
                                                    {tier.remaining} <span className="opacity-50">/ {tier.quantity_total}</span>
                                                </span>
                                            </p>
                                        </div>

                                        {/* Simplified highlight for active state instead of 'Chi tiết' text */}
                                        {isActive && (
                                            <div className="absolute top-0 right-0 w-12 h-12 bg-blue-600/10 blur-xl"></div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Tier Pagination */}
                        {stats.tiers.length > 6 && (
                            <div className="flex items-center justify-center gap-4 pt-4 border-t border-gray-100 dark:border-white/5">
                                <button 
                                    disabled={tierPage === 1}
                                    onClick={() => setTierPage(prev => prev - 1)}
                                    className="p-2 bg-gray-50 dark:bg-white/[0.05] rounded-xl text-gray-400 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-gray-400 transition-all"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <span className="text-[10px] font-black text-gray-900 dark:text-white uppercase">
                                    Trang {tierPage} / {Math.ceil(stats.tiers.length / 6)}
                                </span>
                                <button 
                                    disabled={tierPage === Math.ceil(stats.tiers.length / 6)}
                                    onClick={() => setTierPage(prev => prev + 1)}
                                    className="p-2 bg-gray-50 dark:bg-white/[0.05] rounded-xl text-gray-400 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-gray-400 transition-all"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="py-12 text-center text-gray-400 font-bold uppercase text-xs bg-gray-50/50 dark:bg-white/[0.01] rounded-[1.5rem]">
                        Không có dữ liệu hạng vé cho sự kiện này
                    </div>
                )}
            </div>

            {/* Filter & Table Area */}
            <div id="ticket-table-section" className="bg-white dark:bg-[#111114] rounded-[2.5rem] border border-gray-200 dark:border-white/5 shadow-2xl overflow-hidden mt-8">
                <div className="p-6 border-b border-gray-100 dark:border-white/5">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-600/20">
                                <Search className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-gray-900 dark:text-white uppercase ">Quản lý vé</h2>
                                <p className="text-[10px] text-gray-400 font-medium leading-none pt-2">Tất cả hồ sơ giao dịch</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 flex-1 lg:max-w-4xl">
                            {/* Event Filter */}
                            <CustomSelect 
                                value={filters.event_id}
                                onChange={(val) => handleFilterChange('event_id', val)}
                                placeholder="Tất cả sự kiện"
                                icon={Filter}
                                className="w-full"
                                options={[
                                    { value: "", label: "Tất cả sự kiện" },
                                    ...events.map(ev => ({ value: ev.id, label: ev.title }))
                                ]}
                            />

                            {/* Tier Filter */}
                            <CustomSelect 
                                value={filters.ticket_tier_id}
                                onChange={(val) => handleFilterChange('ticket_tier_id', val)}
                                placeholder="Tất cả hạng vé"
                                icon={BarChart3}
                                className="w-full"
                                options={[
                                    { value: "", label: "Tất cả hạng vé" },
                                    ...(filters.event_id 
                                        ? (events.find(e => e.id === filters.event_id)?.ticket_tiers || []).map(tier => ({ value: tier.id, label: tier.tier_name }))
                                        : [])
                                ]}
                            />

                            {/* Status Filter */}
                            <CustomSelect 
                                value={filters.status}
                                onChange={(val) => handleFilterChange('status', val)}
                                placeholder="Tất cả trạng thái"
                                icon={Tag}
                                className="w-full"
                                options={[
                                    { value: "", label: "Tất cả trạng thái" },
                                    { value: "minted", label: "Chưa sử dụng" },
                                    { value: "used", label: "Đã check-in" },
                                    { value: "reselling", label: "Đang rao bán" },
                                    { value: "refunded", label: "Đã hoàn tiền" }
                                ]}
                            />

                            {/* Search */}
                            <div className="relative group">
                                <input 
                                    type="text"
                                    placeholder="Tìm theo mã vé..."
                                    value={filters.search}
                                    onChange={(e) => handleFilterChange('search', e.target.value)}
                                    className="w-full bg-white dark:bg-[#1a1a1e] border border-gray-200 dark:border-white/5 rounded-2xl py-3 px-10 text-[11px] font-black uppercase text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 transition-all placeholder:text-gray-400 hover:border-gray-300 dark:hover:border-white/10"
                                />
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table Content */}
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 dark:bg-white/[0.01]">
                                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 dark:text-white/20 uppercase">Mã vé / NFT ID</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 dark:text-white/20 uppercase">Thông tin mua hàng</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 dark:text-white/20 uppercase">Sự kiện & Hạng vé</th>
                                <th className="px-8 py-5 text-center text-[10px] font-black text-gray-400 dark:text-white/20 uppercase">Trạng thái</th>
                                <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 dark:text-white/20 uppercase">Giá vé</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                            {isLoading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="5" className="px-8 py-6"><div className="h-12 bg-gray-100 dark:bg-white/5 rounded-2xl w-full"></div></td>
                                    </tr>
                                ))
                            ) : tickets.length > 0 ? (
                                tickets.map((t) => (
                                    <tr key={t.id} className="group hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-600">
                                                    <Ticket className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="font-black text-gray-900 dark:text-white text-sm tracking-tighter">#{t.ticket_number}</p>
                                                    <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase flex items-center gap-1">
                                                        NFT ID: {t.nft_token_id || 'Chưa đúc'} 
                                                        {t.nft_mint_tx_hash && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="space-y-0.5 text-left">
                                                <p className="text-sm font-bold text-gray-900 dark:text-white truncate lg:max-w-[200px]">{t.current_owner.full_name}</p>
                                                <p className="text-[10px] font-bold text-gray-400 italic lowercase">{t.current_owner.email}</p>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col gap-1 text-left">
                                                <p className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-tighter italic truncate lg:max-w-[150px]">{t.event.title}</p>
                                                <span className="text-[10px] font-black text-blue-600 bg-blue-50 dark:bg-blue-600/10 px-2 py-0.5 rounded w-fit uppercase">{t.ticket_tier.tier_name}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex justify-center">
                                                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusStyle(t.status)}`}>
                                                    {getStatusLabel(t.status)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex flex-col items-end">
                                                <span className="text-sm font-black text-gray-900 dark:text-white italic">
                                                    {Number(t.ticket_tier.price).toLocaleString()}
                                                </span>
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter italic">VNĐ (Đã bao gồm phí)</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-8 py-20 text-center text-gray-400 font-bold uppercase text-xs italic tracking-widest">
                                        Không tìm thấy dữ liệu vé nào phù hợp
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="p-8 bg-gray-50 dark:bg-white/[0.01] border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">
                        Trang {pagination.page} / {pagination.total_pages} — Hiển thị {tickets.length} kết quả
                    </p>
                    <div className="flex gap-2">
                        <button 
                            disabled={pagination.page === 1}
                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                            className="p-3 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl hover:bg-gray-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft className="w-4 h-4 dark:text-white" />
                        </button>
                        <button 
                            disabled={pagination.page >= pagination.total_pages}
                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                            className="p-3 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl hover:bg-gray-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <ChevronRight className="w-4 h-4 dark:text-white" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TicketManagement;

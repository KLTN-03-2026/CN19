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
    BarChart3,
    Download,
    Layers,
    QrCode
} from 'lucide-react';
import { ticketService } from '../../services/ticket.service';
import { organizerService } from '../../services/organizer.service';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

// Custom Select Component for premium aesthetics
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
                className="w-full bg-white dark:bg-[#1a1a1e] border border-gray-200 dark:border-white/5 rounded-2xl py-3 px-8 md:px-10 text-[10px] font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-blue-600/5 transition-all text-left flex items-center justify-between group shadow-sm h-[48px]"
            >
                <div className="flex items-center gap-3 truncate">
                    {Icon && <Icon className="w-4 h-4 text-gray-500 group-hover:text-blue-600 transition-colors shrink-0" />}
                    <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
                </div>
                <ChevronDown className={`w-3 h-3 text-gray-500 transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute z-[100] mt-2 w-full bg-white dark:bg-[#1f1f23] border border-gray-200 dark:border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] py-2 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
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
                                    className={`w-full px-5 py-3 text-[11px] font-bold text-left transition-colors flex items-center justify-between ${
                                        String(value) === String(opt.value)
                                        ? 'bg-blue-600 text-white' 
                                        : 'text-gray-700 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'
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
    <div className="bg-white dark:bg-[#111114] p-4 md:p-5 rounded-2xl md:rounded-[1.5rem] border border-gray-200 dark:border-white/5 shadow-sm flex items-center gap-3 md:gap-4 relative overflow-hidden group hover:shadow-md transition-all duration-300">
        <div className={`absolute top-0 right-0 w-24 h-24 bg-${color}-500/5 blur-3xl -mr-12 -mt-12 group-hover:bg-${color}-500/10 transition-colors`}></div>
        <div className={`w-10 h-10 md:w-12 md:h-12 bg-${color}-500/10 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-500`}>
            <Icon className={`w-5 h-5 md:w-6 md:h-6 text-${color}-600`} />
        </div>
        <div className="min-w-0">
            <p className="text-[10px] font-black text-gray-500 dark:text-gray-500 uppercase tracking-widest leading-none mb-1 md:mb-1.5">{title}</p>
            <h4 className="text-sm md:text-xl font-black text-gray-900 dark:text-white truncate leading-none mb-0.5 md:mb-1">{value}</h4>
            <p className="text-[9px] md:text-[10px] font-bold text-gray-500 dark:text-gray-400 opacity-80 leading-none">{subValue}</p>
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
        
        const tableElement = document.getElementById('ticket-table-section');
        if (tableElement) {
            tableElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const handleExport = async () => {
        try {
            toast.loading('Đang chuẩn bị dữ liệu báo cáo toàn bộ...', { id: 'export-tickets' });

            // Fetch ALL tickets using the export endpoint with current filters
            const { data: allTickets } = await ticketService.exportOrganizerTickets({
                event_id: filters.event_id,
                ticket_tier_id: filters.ticket_tier_id,
                status: filters.status,
                search: filters.search
            });

            if (!allTickets || allTickets.length === 0) {
                toast.error('Không có dữ liệu để xuất', { id: 'export-tickets' });
                return;
            }

            const dataToExport = allTickets.map((t, index) => {
                const resalePrice = t.marketplace_listings?.length > 0 
                    ? Number(t.marketplace_listings[0].asking_price) 
                    : 0;

                return {
                    'STT': index + 1,
                    'Mã vé': t.ticket_number,
                    'NFT Token ID': t.nft_token_id || 'Chưa đúc',
                    'NFT Mint Hash': t.nft_mint_tx_hash || '',
                    'Sự kiện': t.event?.title,
                    'Hạng vé': t.ticket_tier?.tier_name,
                    'Giá gốc (VNĐ)': Number(t.ticket_tier?.price || 0),
                    'Khách hàng': t.current_owner?.full_name,
                    'Email': t.current_owner?.email,
                    'Trạng thái': getStatusLabel(t),
                    'Đang rao bán': resalePrice > 0 ? 'Có' : 'Không',
                    'Giá rao bán (VNĐ)': resalePrice || '',
                    'Ngày phát hành': format(new Date(t.order?.created_at || new Date()), 'dd/MM/yyyy HH:mm:ss'),
                };
            });

            const worksheet = XLSX.utils.json_to_sheet(dataToExport);
            
            // Tự động điều chỉnh độ rộng cột
            const colWidths = [
                { wch: 5 },  // STT
                { wch: 20 }, // Mã vé
                { wch: 15 }, // NFT ID
                { wch: 35 }, // NFT Hash
                { wch: 30 }, // Sự kiện
                { wch: 15 }, // Hạng vé
                { wch: 15 }, // Giá gốc
                { wch: 25 }, // Khách hàng
                { wch: 30 }, // Email
                { wch: 15 }, // Trạng thái
                { wch: 12 }, // Đang rao bán
                { wch: 15 }, // Giá rao bán
                { wch: 20 }, // Ngày phát hành
            ];
            worksheet['!cols'] = colWidths;

            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Danh sách vé chi tiết');

            const fileName = `Bao_cao_toan_bo_ve_${format(new Date(), 'ddMMyyyy_HHmm')}.xlsx`;
            XLSX.writeFile(workbook, fileName);

            toast.success(`Đã xuất ${allTickets.length} vé thành công!`, { id: 'export-tickets' });
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Có lỗi xảy ra khi xuất báo cáo', { id: 'export-tickets' });
        }
    };

    const getStatusStyle = (ticket) => {
        const status = ticket.marketplace_listings?.length > 0 ? 'reselling' : ticket.status;
        switch (status) {
            case 'minted': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
            case 'used': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
            case 'reselling': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
            case 'refunded': return 'bg-red-500/10 text-red-600 border-red-500/20';
            default: return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
        }
    };

    const getStatusLabel = (ticket) => {
        const status = ticket.marketplace_listings?.length > 0 ? 'reselling' : ticket.status;
        switch (status) {
            case 'minted': return 'Chưa sử dụng';
            case 'used': return 'Đã check-in';
            case 'reselling': return 'Đang rao bán';
            case 'refunded': return 'Đã hoàn tiền';
            default: return status;
        }
    };

    return (
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="flex items-center justify-between gap-2 md:gap-4">
                <div className="space-y-0.5 md:space-y-1 min-w-0">
                    <h1 className="text-sm md:text-lg font-black text-gray-900 dark:text-white tracking-tight uppercase truncate">
                        Quản lý <span className="text-blue-600">Vé đã bán</span>
                    </h1>
                    <div className="flex items-center gap-1.5">
                        <div className="w-1 md:w-1.5 h-1 md:h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                        <p className="text-blue-600 font-bold text-[9px] md:text-[11px] truncate">
                            {pagination.total} vé NFT
                        </p>
                    </div>
                </div>
                <div className="shrink-0">
                    <button 
                        onClick={handleExport}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 md:px-5 py-2 md:py-2.5 rounded-xl text-[10px] md:text-xs font-bold shadow-lg shadow-blue-600/20 transition-all flex items-center gap-1.5 md:gap-2 active:scale-95 whitespace-nowrap"
                    >
                        <Download className="w-3 h-3 md:w-4 md:h-4" />
                        <span className="hidden xs:inline">Xuất báo cáo</span>
                        <span className="xs:hidden">Xuất</span>
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard 
                    title="Doanh thu từ vé" 
                    value={`${((stats?.ticket_revenue || 0) + (stats?.royalty_revenue || 0)).toLocaleString()} VNĐ`}
                    subValue="Đã trừ sản phẩm"
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
                    title="Thị trường bán lại" 
                    value={`${stats?.total_reselling || 0} vé`}
                    subValue={`+${stats?.market_demand?.resale_rate || 0}% tỉ lệ`}
                    icon={Activity} 
                    color="amber" 
                />
            </div>

            {/* Tier Summary Section */}
            <div className="bg-white dark:bg-[#111114] p-4 md:p-5 rounded-3xl border border-gray-200 dark:border-white/5 shadow-xl overflow-hidden transition-all duration-500">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                        <BarChart3 className="w-5 h-5 text-blue-600" />
                        <h3 className="text-sm md:text-base font-black text-gray-900 dark:text-white uppercase leading-none tracking-tight">Tiến độ theo hạng vé</h3>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3">
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
                    <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 bg-gray-50/50 dark:bg-white/[0.01] rounded-[1.5rem] border border-dashed border-gray-200 dark:border-white/10">
                        <div className="p-4 bg-blue-600/10 rounded-full text-blue-600">
                            <TrendingUp className="w-8 h-8" />
                        </div>
                        <div className="max-w-xs">
                            <p className="text-sm font-black text-gray-900 dark:text-white uppercase leading-none">Thống kê tổng hợp</p>
                            <p className="text-[11px] text-gray-600 dark:text-gray-400 font-medium mt-2 leading-relaxed">Chọn một sự kiện cụ thể để xem chi tiết tiến độ bán vé theo từng hạng</p>
                        </div>
                    </div>
                ) : stats?.tiers?.length > 0 ? (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 min-[1920px]:grid-cols-6 gap-2 md:gap-4">
                            {stats.tiers.slice((tierPage - 1) * 8, tierPage * 8).map((tier) => {
                                const percent = Math.round((tier.sold_count / tier.quantity_total) * 100);
                                const isActive = filters.ticket_tier_id === tier.id;
                                return (
                                    <button 
                                        key={tier.id} 
                                        onClick={() => handleTierClick(tier.id)}
                                        className={`group/tier text-left space-y-2 p-3 md:p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden ${
                                            isActive 
                                            ? 'bg-blue-600/[0.03] dark:bg-blue-600/[0.08] border-blue-600 shadow-lg shadow-blue-600/10' 
                                            : 'bg-white dark:bg-[#1a1a1e] border-gray-200 dark:border-white/5 hover:border-blue-600/30'
                                        }`}
                                    >
                                        <div className="flex justify-between items-start relative z-10">
                                            <div>
                                                <p className={`text-[11px] font-black mb-1 transition-colors uppercase tracking-tight ${isActive ? 'text-blue-600' : 'text-gray-900 dark:text-gray-100 group-hover/tier:text-blue-600'}`}>{tier.tier_name}</p>
                                                <p className="text-sm md:text-base font-black text-gray-900 dark:text-gray-200 leading-none">
                                                    {tier.sold_count} <span className="text-[9px] md:text-[10px] text-gray-500 dark:text-gray-600 font-bold tracking-normal">/ {tier.quantity_total} vé</span>
                                                </p>
                                                {tier.reselling_count > 0 && (
                                                    <p className="text-[9px] font-black text-amber-600 dark:text-amber-500 mt-1 flex items-center gap-1">
                                                        <Activity className="w-2.5 h-2.5" />
                                                        {tier.reselling_count} vé đang rao bán
                                                    </p>
                                                )}
                                            </div>
                                            <div className={`px-2 py-0.5 rounded text-[9px] font-black ${percent > 80 ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                                {percent}%
                                            </div>
                                        </div>
                                        <div className="w-full h-1.5 bg-gray-200 dark:bg-white/5 rounded-full overflow-hidden relative z-10 mt-1">
                                            <div 
                                                className={`h-full transition-all duration-1000 ${percent > 80 ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]' : 'bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.3)]'}`}
                                                style={{ width: `${percent}%` }}
                                            ></div>
                                        </div>
                                        <div className="flex flex-col gap-1 pt-0.5 relative z-10">
                                            <p className="text-[9px] font-black text-gray-600 dark:text-gray-500 ">
                                                Giá: <span className="text-gray-900 dark:text-gray-300 transition-colors">{Number(tier.price).toLocaleString()}</span>
                                            </p>
                                            <p className="text-[9px] font-black text-gray-600 dark:text-gray-500">
                                                Còn lại: <span className={tier.remaining < 10 ? 'text-red-500' : 'text-gray-900 dark:text-gray-300'}>
                                                    {tier.remaining} <span className="text-gray-400 dark:text-gray-600">/ {tier.quantity_total}</span>
                                                </span>
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {stats.tiers.length > 6 && (
                            <div className="flex items-center justify-center gap-4 pt-4 border-t border-gray-100 dark:border-white/5">
                                <button 
                                    disabled={tierPage === 1}
                                    onClick={() => setTierPage(prev => prev - 1)}
                                    className="p-2 bg-gray-50 dark:bg-white/[0.05] rounded-xl text-gray-400 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-gray-400 transition-all"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <span className="text-[10px] font-black text-gray-900 dark:text-white">
                                    Trang {tierPage} / {Math.ceil(stats.tiers.length / 8)}
                                </span>
                                <button 
                                    disabled={tierPage === Math.ceil(stats.tiers.length / 8)}
                                    onClick={() => setTierPage(prev => prev + 1)}
                                    className="p-2 bg-gray-50 dark:bg-white/[0.05] rounded-xl text-gray-400 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-gray-400 transition-all"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="py-12 text-center text-gray-400 font-bold uppercase text-[10px] bg-gray-50/50 dark:bg-white/[0.01] rounded-[1.5rem]">
                        Không có dữ liệu hạng vé cho sự kiện này
                    </div>
                )}
            </div>

            {/* Filter & Table Area */}
            <div id="ticket-table-section" className="bg-white dark:bg-[#111114] rounded-3xl border border-gray-200 dark:border-white/5 shadow-2xl overflow-hidden mt-3">
                <div className="p-4 md:p-5 border-b border-gray-200 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 backdrop-blur-xl">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-600/20">
                                <Search className="w-5 h-5 text-white" />
                            </div>
                            <div className="space-y-1">
                                <h2 className="text-base md:text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">Danh sách vé</h2>
                                <p className="text-[10px] text-gray-600 dark:text-gray-400 font-black uppercase leading-none tracking-widest opacity-80">Tất cả hồ sơ giao dịch</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3 flex-1 lg:max-w-4xl">
                            <CustomSelect 
                                value={filters.event_id}
                                onChange={(val) => handleFilterChange('event_id', val)}
                                placeholder="Sự kiện: Tất cả"
                                icon={Filter}
                                options={[
                                    { value: "", label: "Tất cả sự kiện" },
                                    ...events.map(ev => ({ value: ev.id, label: ev.title }))
                                ]}
                            />

                            <CustomSelect 
                                value={filters.ticket_tier_id}
                                onChange={(val) => handleFilterChange('ticket_tier_id', val)}
                                placeholder="Hạng vé: Tất cả"
                                icon={BarChart3}
                                options={[
                                    { value: "", label: "Tất cả hạng vé" },
                                    ...(filters.event_id 
                                        ? (events.find(e => e.id === filters.event_id)?.ticket_tiers || []).map(tier => ({ value: tier.id, label: tier.tier_name }))
                                        : [])
                                ]}
                            />

                            <CustomSelect 
                                value={filters.status}
                                onChange={(val) => handleFilterChange('status', val)}
                                placeholder="Trạng thái: Tất cả"
                                icon={Tag}
                                options={[
                                    { value: "", label: "Tất cả trạng thái" },
                                    { value: "minted", label: "Chưa sử dụng" },
                                    { value: "used", label: "Đã check-in" },
                                    { value: "reselling", label: "Đang rao bán" },
                                    { value: "refunded", label: "Đã hoàn tiền" }
                                ]}
                            />

                            <div className="relative group">
                                <input 
                                    type="text"
                                    placeholder="Tìm theo mã vé..."
                                    value={filters.search}
                                    onChange={(e) => handleFilterChange('search', e.target.value)}
                                    className="w-full bg-white dark:bg-[#1a1a1e] border border-gray-200 dark:border-white/5 rounded-2xl py-3 px-8 md:px-10 text-[11px] md:text-[13px] font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-blue-600/5 transition-all placeholder:text-gray-500 hover:border-gray-300 dark:hover:border-white/10 h-[48px]"
                                />
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-blue-600 transition-colors" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto custom-scrollbar">
                    <table className="w-full border-collapse min-w-[900px]">
                        <thead>
                            <tr className="bg-gray-50/50 dark:bg-white/[0.01]">
                                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-600 dark:text-gray-400 uppercase tracking-widest">Vé & NFT ID</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-600 dark:text-gray-400 uppercase tracking-widest">Khách hàng</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-600 dark:text-gray-400 uppercase tracking-widest">Thông tin sự kiện</th>
                                <th className="px-8 py-5 text-center text-[10px] font-black text-gray-600 dark:text-gray-400 uppercase tracking-widest">Trạng thái</th>
                                <th className="px-8 py-5 text-right text-[10px] font-black text-gray-600 dark:text-gray-400 uppercase tracking-widest">Giá bán</th>
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
                                    <tr key={t.id} className="group hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-600">
                                                    <Ticket className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="font-black text-gray-900 dark:text-white text-sm tracking-tight">#{t.ticket_number}</p>
                                                    <p className="text-[10px] font-bold text-gray-500 dark:text-gray-500 uppercase flex items-center gap-1">
                                                        NFT: {t.nft_token_id || 'Chưa đúc'} 
                                                        {t.nft_mint_tx_hash && <QrCode className="w-3 h-3 text-emerald-500" />}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-white dark:border-white/10 shadow-sm bg-gray-100 dark:bg-white/5 flex items-center justify-center shrink-0">
                                                    {t.current_owner.avatar_url ? (
                                                        <img 
                                                            src={t.current_owner.avatar_url} 
                                                            alt={t.current_owner.full_name} 
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                e.target.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(t.current_owner.full_name);
                                                            }}
                                                        />
                                                    ) : (
                                                        <User className="w-5 h-5 text-gray-400" />
                                                    )}
                                                </div>
                                                <div className="space-y-0.5 min-w-0">
                                                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">{t.current_owner.full_name}</p>
                                                    <p className="text-[10px] font-medium text-gray-600 dark:text-gray-500 lowercase truncate">{t.current_owner.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex flex-col gap-1">
                                                <p className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-tight truncate max-w-[150px]">{t.event.title}</p>
                                                <span className="text-[10px] font-black text-blue-600 bg-blue-50 dark:bg-blue-600/10 px-2 py-0.5 rounded w-fit uppercase">{t.ticket_tier.tier_name}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex justify-center">
                                                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusStyle(t)}`}>
                                                    {getStatusLabel(t)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="flex flex-col items-end">
                                                <span className="text-sm font-black text-gray-900 dark:text-white">
                                                    {Number(t.ticket_tier.price).toLocaleString()}
                                                </span>
                                                {t.marketplace_listings?.length > 0 && (() => {
                                                    const listing = t.marketplace_listings[0];
                                                    const askingPrice = Number(listing.asking_price);
                                                    const ticketPriceOnly = Number(listing.metadata?.ticket_price || askingPrice);
                                                    const gasFee = Number(t.event.resale_gas_fee || 7000);
                                                    const platformFeePercent = Number(t.event.resale_platform_fee_percent || 3.0) / 100;
                                                    const systemFee = gasFee + (ticketPriceOnly * platformFeePercent);
                                                    const totalPrice = askingPrice + systemFee;

                                                    return (
                                                        <span className="text-[9px] font-black text-amber-600 flex items-center gap-1 mt-0.5">
                                                            <Tag className="w-2.5 h-2.5" />
                                                            Rao bán: {totalPrice.toLocaleString()}
                                                        </span>
                                                    );
                                                })()}
                                                <span className="text-[10px] font-medium text-gray-500 mt-0.5">VNĐ (Đã gồm phí)</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center justify-center opacity-40">
                                            <Ticket className="w-16 h-16 mb-4 text-gray-400" />
                                            <p className="text-sm font-black uppercase tracking-widest text-gray-500">Không tìm thấy vé nào</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden divide-y divide-gray-100 dark:divide-white/5">
                    {isLoading ? (
                        Array(3).fill(0).map((_, i) => (
                            <div key={i} className="p-4 animate-pulse">
                                <div className="h-24 bg-gray-100 dark:bg-white/5 rounded-2xl w-full"></div>
                            </div>
                        ))
                    ) : tickets.length > 0 ? (
                        tickets.map((t) => (
                            <div key={t.id} className="p-4 space-y-4 group active:bg-gray-50 dark:active:bg-white/5 transition-colors">
                                {/* Header: Ticket Num & Status */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-blue-600/10 flex items-center justify-center text-blue-600">
                                            <Ticket className="w-4 h-4" />
                                        </div>
                                        <span className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-tight">#{t.ticket_number}</span>
                                    </div>
                                    <span className={`px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${getStatusStyle(t)}`}>
                                        {getStatusLabel(t)}
                                    </span>
                                </div>

                                {/* Customer Info */}
                                <div className="flex items-center gap-3 bg-gray-50 dark:bg-white/[0.02] p-3 rounded-2xl">
                                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white dark:border-white/10 shadow-sm shrink-0 bg-gray-200 dark:bg-gray-800">
                                        {t.current_owner.avatar_url ? (
                                            <img 
                                                src={t.current_owner.avatar_url} 
                                                alt={t.current_owner.full_name} 
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    e.target.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(t.current_owner.full_name);
                                                }}
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center"><User className="w-5 h-5 text-gray-400" /></div>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">{t.current_owner.full_name}</p>
                                        <p className="text-[10px] font-medium text-gray-500 lowercase truncate">{t.current_owner.email}</p>
                                    </div>
                                </div>

                                {/* Event & Price Info */}
                                <div className="grid grid-cols-2 gap-4 pt-1">
                                    <div>
                                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Sự kiện & Hạng</p>
                                        <p className="text-[10px] font-black text-gray-900 dark:text-white uppercase truncate mb-1">{t.event.title}</p>
                                        <span className="text-[8px] font-black text-blue-600 bg-blue-50 dark:bg-blue-600/10 px-1.5 py-0.5 rounded uppercase">{t.ticket_tier.tier_name}</span>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Giá thanh toán</p>
                                        <p className="text-xs font-black text-gray-900 dark:text-white">{Number(t.ticket_tier.price).toLocaleString()} đ</p>
                                        {t.marketplace_listings?.length > 0 && (() => {
                                            const listing = t.marketplace_listings[0];
                                            const askingPrice = Number(listing.asking_price);
                                            const ticketPriceOnly = Number(listing.metadata?.ticket_price || askingPrice);
                                            const gasFee = Number(t.event.resale_gas_fee || 7000);
                                            const platformFeePercent = Number(t.event.resale_platform_fee_percent || 3.0) / 100;
                                            const systemFee = gasFee + (ticketPriceOnly * platformFeePercent);
                                            const totalPrice = askingPrice + systemFee;

                                            return (
                                                <div className="flex items-center justify-end gap-1 mt-1">
                                                    <Tag className="w-2 h-2 text-amber-600" />
                                                    <span className="text-[8px] font-black text-amber-600 uppercase">Rao: {totalPrice.toLocaleString()}</span>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>
                                
                                {/* NFT Info Footer */}
                                <div className="pt-2 flex items-center justify-between border-t border-gray-100 dark:border-white/5">
                                    <p className="text-[8px] font-bold text-gray-500 uppercase tracking-wider">NFT ID: {t.nft_token_id || 'N/A'}</p>
                                    {t.nft_mint_tx_hash && (
                                        <div className="flex items-center gap-1">
                                            <QrCode className="w-2.5 h-2.5 text-emerald-500" />
                                            <span className="text-[8px] font-black text-emerald-500 uppercase">Blockchain Verified</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="py-20 text-center flex flex-col items-center justify-center opacity-40">
                             <Ticket className="w-12 h-12 mb-3 text-gray-400" />
                             <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Trống</p>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                <div className="p-5 md:p-8 bg-gray-50/50 dark:bg-white/[0.01] border-t border-gray-100 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-[11px] font-bold text-gray-600 dark:text-gray-400 order-2 sm:order-1">
                        Trang {pagination.page} / {pagination.total_pages} — Hiển thị {tickets.length} kết quả
                    </p>
                    <div className="flex items-center gap-2 order-1 sm:order-2 w-full sm:w-auto">
                        <button 
                            disabled={pagination.page === 1}
                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                            className="flex-1 sm:flex-none p-2.5 md:p-3 bg-white dark:bg-[#1a1a1e] border border-gray-200 dark:border-white/5 rounded-xl md:rounded-2xl text-gray-500 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-gray-500 transition-all shadow-sm"
                        >
                            <ChevronLeft className="w-4 h-4 md:w-5 md:h-5 mx-auto" />
                        </button>
                        <button 
                            disabled={pagination.page === pagination.total_pages || pagination.total_pages === 0}
                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                            className="flex-1 sm:flex-none p-2.5 md:p-3 bg-white dark:bg-[#1a1a1e] border border-gray-200 dark:border-white/5 rounded-xl md:rounded-2xl text-gray-500 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-gray-500 transition-all shadow-sm"
                        >
                            <ChevronRight className="w-4 h-4 md:w-5 md:h-5 mx-auto" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TicketManagement;

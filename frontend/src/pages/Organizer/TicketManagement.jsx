import React, { useState, useEffect } from 'react';
import { 
    Ticket, 
    TrendingUp, 
    DollarSign, 
    Search, 
    Filter, 
    ChevronLeft, 
    ChevronRight,
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

const StatCard = ({ title, value, subValue, icon: Icon, color }) => (
    <div className="bg-white dark:bg-[#111114] p-8 rounded-[2rem] border border-gray-100 dark:border-white/5 relative overflow-hidden group hover:shadow-2xl transition-all duration-500">
        <div className={`absolute top-0 right-0 w-32 h-32 bg-${color}-500/5 blur-[60px] -mr-12 -mt-12 group-hover:bg-${color}-500/10 transition-colors`}></div>
        <div className="relative z-10 flex items-start justify-between">
            <div>
                <p className="text-[10px] font-black text-gray-400 dark:text-white/20 uppercase tracking-[0.2em] mb-3">{title}</p>
                <h3 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter italic">
                    {value}
                </h3>
                {subValue && (
                    <div className="flex items-center mt-3 gap-2">
                        <span className={`px-2 py-0.5 rounded-md bg-${color}-500/10 text-${color}-500 text-[10px] font-black uppercase tracking-wider`}>
                            {subValue}
                        </span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase italic tracking-tighter">Tính đến hiện tại</span>
                    </div>
                )}
            </div>
            <div className={`p-4 bg-${color}-500/10 rounded-2xl group-hover:scale-110 transition-transform duration-500`}>
                <Icon className={`w-6 h-6 text-${color}-500`} />
            </div>
        </div>
    </div>
);

const TicketManagement = () => {
    const [stats, setStats] = useState(null);
    const [tickets, setTickets] = useState([]);
    const [events, setEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, total_pages: 1 });
    
    // Filters
    const [filters, setFilters] = useState({
        event_id: '',
        status: '',
        search: ''
    });

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        fetchTickets();
    }, [filters, pagination.page]);

    const fetchInitialData = async () => {
        try {
            const [statsRes, eventsRes] = await Promise.all([
                ticketService.getOrganizerStats(),
                organizerService.getMyEvents()
            ]);
            setStats(statsRes.data);
            setEvents(eventsRes.data || []);
        } catch (error) {
            toast.error('Không thể tải dữ liệu thống kê');
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
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, page: 1 }));
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
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-[#111114] p-8 rounded-[2.5rem] border border-gray-200 dark:border-white/5 shadow-xl">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-600">
                        <Tag className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">
                            Quản lý <span className="text-blue-600">Vé đã bán</span>
                        </h1>
                        <p className="text-xs font-bold text-gray-400 dark:text-white/30 uppercase tracking-widest mt-1">
                            {pagination.total} vé được phát hành qua hệ thống
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center justify-center gap-3 bg-gray-900 dark:bg-white text-white dark:text-black px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all transform hover:scale-105 active:scale-95 shadow-xl">
                        Xuất báo cáo
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
            {stats?.tiers && (
                <div className="bg-white dark:bg-[#111114] p-8 rounded-[2rem] border border-gray-200 dark:border-white/5 shadow-lg overflow-hidden">
                    <div className="flex items-center gap-3 mb-8">
                        <BarChart3 className="w-5 h-5 text-blue-600" />
                        <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest italic">Tiến độ theo hạng vé</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {stats.tiers.map((tier) => {
                            const percent = Math.round((tier.sold_count / tier.quantity_total) * 100);
                            return (
                                <div key={tier.id} className="space-y-3 p-6 bg-gray-50 dark:bg-white/[0.02] rounded-2xl border border-gray-100 dark:border-white/5">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{tier.tier_name}</p>
                                            <p className="text-lg font-black text-gray-900 dark:text-white italic">{tier.sold_count} <span className="text-[10px] text-gray-400">/ {tier.quantity_total} vé</span></p>
                                        </div>
                                        <div className={`px-2 py-1 rounded text-[10px] font-black ${percent > 80 ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                            {percent}%
                                        </div>
                                    </div>
                                    <div className="w-full h-2 bg-gray-200 dark:bg-white/5 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full transition-all duration-1000 ${percent > 80 ? 'bg-red-500' : 'bg-blue-600'}`}
                                            style={{ width: `${percent}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase italic">
                                        Giá: {Number(tier.price).toLocaleString()} VNĐ
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Filter & Table Area */}
            <div className="bg-white dark:bg-[#111114] rounded-[2.5rem] border border-gray-200 dark:border-white/5 shadow-2xl overflow-hidden">
                {/* Filter Bar */}
                <div className="p-8 border-b border-gray-100 dark:border-white/5 grid grid-cols-1 lg:grid-cols-12 gap-4">
                    <div className="lg:col-span-5 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Tìm kiếm mã vé, tên người mua, email..."
                            value={filters.search}
                            onChange={(e) => handleFilterChange('search', e.target.value)}
                            className="w-full bg-gray-50 dark:bg-[#0a0a0c] border border-gray-100 dark:border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/10 dark:text-white font-medium"
                        />
                    </div>
                    <div className="lg:col-span-3 relative">
                        <select 
                            value={filters.event_id}
                            onChange={(e) => handleFilterChange('event_id', e.target.value)}
                            className="w-full bg-gray-50 dark:bg-[#0a0a0c] border border-gray-100 dark:border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/10 dark:text-white font-bold appearance-none cursor-pointer"
                        >
                            <option value="">Tất cả sự kiện</option>
                            {events.map(ev => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
                        </select>
                    </div>
                    <div className="lg:col-span-4 relative">
                        <select 
                            value={filters.status}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                            className="w-full bg-gray-50 dark:bg-[#0a0a0c] border border-gray-100 dark:border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/10 dark:text-white font-bold appearance-none cursor-pointer"
                        >
                            <option value="">Tất cả trạng thái</option>
                            <option value="minted">Chưa sử dụng</option>
                            <option value="used">Đã check-in</option>
                            <option value="reselling">Đang bán lại</option>
                            <option value="refunded">Đã hoàn tiền</option>
                        </select>
                    </div>
                </div>

                {/* Table Content */}
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 dark:bg-white/[0.01]">
                                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 dark:text-white/20 uppercase tracking-[0.2em]">Mã vé / NFT ID</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 dark:text-white/20 uppercase tracking-[0.2em]">Thông tin mua hàng</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 dark:text-white/20 uppercase tracking-[0.2em]">Sự kiện & Hạng vé</th>
                                <th className="px-8 py-5 text-center text-[10px] font-black text-gray-400 dark:text-white/20 uppercase tracking-[0.2em]">Trạng thái</th>
                                <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 dark:text-white/20 uppercase tracking-[0.2em]">Giá vé</th>
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

import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, 
  Search, 
  Calendar, 
  DollarSign, 
  ChevronRight, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  ArrowUpRight,
  RefreshCcw,
  Banknote,
  Ticket,
  ShoppingBag,
  TrendingUp,
  Wallet,
  ArrowRight,
  Eye
} from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const OrganizerSettlement = () => {
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [requestingId, setRequestingId] = useState(null);

    const fetchEvents = async () => {
        try {
            setIsLoading(true);
            const res = await api.get('/settlements/organizer/events');
            let data = res.data.data;

            // Sorting logic: 
            const now = new Date();
            data.sort((a, b) => {
                const aFinished = a.settlement_status === 'eligible' && new Date(a.end_date || a.event_date) <= now;
                const bFinished = b.settlement_status === 'eligible' && new Date(b.end_date || b.event_date) <= now;

                // Priority 1: Finished & Ready
                if (aFinished && !bFinished) return -1;
                if (!aFinished && bFinished) return 1;

                // Priority 2: Ongoing & Soon to finish
                const aOngoing = a.settlement_status === 'eligible' && new Date(a.end_date || a.event_date) > now;
                const bOngoing = b.settlement_status === 'eligible' && new Date(b.end_date || b.event_date) > now;

                if (aOngoing && bOngoing) {
                    // Sort by closest end date first
                    return new Date(a.end_date || a.event_date) - new Date(b.end_date || b.event_date);
                }
                if (aOngoing && !bOngoing) return -1;
                if (!aOngoing && bOngoing) return 1;

                // Priority 3: Pending/Processing
                const aPending = ['pending', 'processing'].includes(a.settlement_status);
                const bPending = ['pending', 'processing'].includes(b.settlement_status);
                if (aPending && !bPending) return -1;
                if (!aPending && bPending) return 1;

                // Default: Newest events first
                return new Date(b.event_date) - new Date(a.event_date);
            });

            setEvents(data);
        } catch (error) {
            toast.error('Không thể tải dữ liệu quyết toán');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    const handleRequestSettlement = async (eventId) => {
        try {
            setRequestingId(eventId);
            await api.post('/settlements/organizer/request', { eventId });
            toast.success('Yêu cầu quyết toán thành công! Admin sẽ sớm xem duyệt.');
            fetchEvents();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Lỗi khi yêu cầu quyết toán');
        } finally {
            setRequestingId(null);
        }
    };

    const filteredEvents = events.filter(event => {
        const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase());
        
        let matchesFilter = filterStatus === 'all';
        const isFinished = new Date(event.end_date || event.event_date) <= new Date();

        if (filterStatus === 'eligible') {
            matchesFilter = event.settlement_status === 'eligible' && isFinished;
        }
        if (filterStatus === 'settled') {
            matchesFilter = event.settlement_status === 'settled';
        }
        if (filterStatus === 'pending') {
            matchesFilter = ['pending', 'processing'].includes(event.settlement_status);
        }
        
        return matchesSearch && matchesFilter;
    });

    const stats = {
        totalEligible: events.filter(e => e.settlement_status === 'eligible').reduce((s, e) => s + (e.financials?.pending_revenue || 0), 0),
        totalSettled: events.filter(e => e.settlement_status === 'settled').reduce((s, e) => s + (e.financials?.pending_revenue || 0), 0),
        pendingRequests: events.filter(e => ['pending', 'processing'].includes(e.settlement_status)).length
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'settled':
                return { 
                    bg: 'bg-green-500/10', 
                    text: 'text-green-500', 
                    label: 'Đã quyết toán',
                    icon: CheckCircle2 
                };
            case 'pending':
            case 'processing':
                return { 
                    bg: 'bg-orange-500/10', 
                    text: 'text-orange-500', 
                    label: 'Đang chờ duyệt',
                    icon: Clock 
                };
            case 'eligible':
                return { 
                    bg: 'bg-blue-500/10', 
                    text: 'text-blue-600', 
                    label: 'Sẵn sàng quyết toán',
                    icon: TrendingUp 
                };
            case 'cancelled':
                return {
                    bg: 'bg-red-500/10 dark:bg-red-500/20',
                    text: 'text-red-600 dark:text-red-400',
                    label: 'Sự kiện đã bị hủy',
                    icon: AlertCircle
                };
            case 'rejected':
                return {
                    bg: 'bg-rose-500/10 dark:bg-rose-500/20',
                    text: 'text-rose-600 dark:text-rose-400',
                    label: 'Thất bại đối soát / Bị từ chối',
                    icon: AlertCircle
                };
            default:
                return { 
                    bg: 'bg-gray-100 dark:bg-white/5', 
                    text: 'text-gray-600 dark:text-gray-400', 
                    label: 'Chưa có dữ liệu',
                    icon: AlertCircle 
                };
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0a0a0c] text-gray-900 dark:text-white transition-colors duration-300 font-sans">
            <div className="max-w-[1400px] mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
                    <div>
                        <h1 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                            <Wallet className="w-6 h-6 text-blue-600" />
                            QUYẾT TOÁN SỰ KIỆN
                        </h1>
                        <p className="text-sm text-gray-600 dark:text-zinc-500 mt-1 font-medium ">Quản lý dòng tiền giải ngân từ các sự kiện</p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                            <input 
                                type="text"
                                placeholder="Tìm tên sự kiện..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-xl py-2.5 pl-10 pr-6 text-[12px] font-medium focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 transition-all w-full md:w-56 shadow-sm"
                            />
                        </div>
                        <button onClick={fetchEvents} className="p-2.5 bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/10 transition-all shadow-sm">
                            <RefreshCcw className={`w-3.5 h-3.5 text-gray-600 dark:text-gray-400 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="bg-white dark:bg-[#111114] p-5 rounded-[1.5rem] border border-gray-200 dark:border-white/5 shadow-sm relative overflow-hidden group">
                        <p className="text-[9px] font-black text-gray-700 dark:text-gray-500 uppercase mb-1">Sẵn sàng quyết toán</p>
                        <h2 className="text-xl font-black text-blue-600 tracking-tighter">{formatCurrency(stats.totalEligible)}</h2>
                        <div className="mt-2 flex items-center gap-1.5 text-[9px] font-bold text-gray-500 ">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span> Bao gồm vé & vật phẩm
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#111114] p-5 rounded-[1.5rem] border border-gray-200 dark:border-white/5 shadow-sm relative overflow-hidden group">
                        <p className="text-[9px] font-black text-gray-700 dark:text-gray-500 uppercase mb-1">Đã quyết toán (Tổng)</p>
                        <h2 className="text-xl font-black text-green-600 tracking-tighter">{formatCurrency(stats.totalSettled)}</h2>
                        <div className="mt-2 flex items-center gap-1.5 text-[9px] font-bold text-gray-500 ">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-600"></span> Tiền đã về ví BTC
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#111114] p-5 rounded-[1.5rem] border border-gray-200 dark:border-white/5 shadow-sm relative overflow-hidden group">
                        <p className="text-[9px] font-black text-gray-700 dark:text-gray-500 uppercase mb-1">Đang chờ duyệt</p>
                        <h2 className="text-xl font-black text-orange-600 tracking-tighter">{stats.pendingRequests} <span className="text-[10px] font-bold text-gray-400">Yêu cầu</span></h2>
                        <div className="mt-2 flex items-center gap-1.5 text-[9px] font-bold text-gray-500 ">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-600 animate-pulse"></span> Đang chờ Admin xử lý
                        </div>
                    </div>
                </div>

                {/* Filter */}
                <div className="flex items-center gap-2 mb-6">
                    <button onClick={() => setFilterStatus('all')} className={`text-[10px] font-black uppercase px-4 py-1.5 rounded-lg transition-all ${filterStatus === 'all' ? 'bg-gray-900 text-white dark:bg-white dark:text-black' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'}`}>Tất cả</button>
                    <button onClick={() => setFilterStatus('eligible')} className={`text-[10px] font-black uppercase px-4 py-1.5 rounded-lg transition-all ${filterStatus === 'eligible' ? 'bg-blue-600 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'}`}>Sẵn sàng</button>
                    <button onClick={() => setFilterStatus('pending')} className={`text-[10px] font-black uppercase px-4 py-1.5 rounded-lg transition-all ${filterStatus === 'pending' ? 'bg-orange-500 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'}`}>Chờ duyệt</button>
                    <button onClick={() => setFilterStatus('settled')} className={`text-[10px] font-black uppercase px-4 py-1.5 rounded-lg transition-all ${filterStatus === 'settled' ? 'bg-green-600 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'}`}>Đã xong</button>
                </div>

                {/* Grid */}
                {isLoading && events.length === 0 ? (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        {[1, 2, 3, 4].map(i => <div key={i} className="h-48 bg-white dark:bg-white/5 rounded-[1.5rem] animate-pulse"></div>)}
                    </div>
                ) : filteredEvents.length > 0 ? (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        {filteredEvents.map((event) => {
                            const style = getStatusStyle(event.settlement_status);
                            const fin = event.financials || {};

                            return (
                                <div key={event.id} className="bg-white dark:bg-[#111114] border border-gray-200 dark:border-white/5 rounded-[1.5rem] overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col sm:flex-row">
                                    <div className="w-full sm:w-40 h-32 sm:h-auto relative shrink-0">
                                        <img src={event.image_url} className="w-full h-full object-cover" alt="event" />
                                    </div>

                                    <div className="flex-1 p-5 flex flex-col">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-1.5 mb-1">
                                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${style.bg} ${style.text}`}>{style.label}</span>
                                                    <span className="text-[9px] text-gray-700 dark:text-gray-500 font-bold uppercase tracking-tight">{format(new Date(event.event_date), 'dd/MM/yyyy')}</span>
                                                </div>
                                                <h3 className="text-sm font-black text-gray-900 dark:text-white tracking-tight line-clamp-1 uppercase">{event.title}</h3>
                                            </div>
                                            <div className="text-right shrink-0 ml-4">
                                                <p className="text-[10px] font-bold text-gray-700 dark:text-gray-500 mb-0.5">Thực nhận (Net)</p>
                                                <p className={`text-lg font-black tracking-tighter leading-none ${event.settlement_status === 'settled' ? 'text-green-600' : 'text-gray-900 dark:text-white'}`}>
                                                    {formatCurrency(fin.pending_revenue)}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-gray-50 dark:bg-white/[0.02] rounded-xl border border-gray-100 dark:border-white/5 mb-4">
                                            <div className="space-y-0.5">
                                                <div className="text-[10px] font-bold text-gray-700 dark:text-gray-500">Doanh thu vé</div>
                                                <p className="text-[11px] font-bold text-gray-900 dark:text-white leading-none">{formatCurrency(fin.ticket_revenue)}</p>
                                            </div>
                                            <div className="space-y-0.5">
                                                <div className="text-[10px] font-bold text-gray-700 dark:text-gray-500">Vật phẩm</div>
                                                <p className="text-[11px] font-bold text-gray-900 dark:text-white leading-none">{formatCurrency(fin.merch_revenue)}</p>
                                            </div>
                                            <div className="space-y-0.5">
                                                <div className="flex items-center gap-1">
                                                    <div className="text-[10px] font-bold text-gray-700 dark:text-gray-500">Marketplace</div>
                                                    <button 
                                                        onClick={() => navigate(`/organizer/marketplace?event_id=${event.id}`)}
                                                        className="text-gray-400 hover:text-purple-600 transition-colors"
                                                        title="Xem giao dịch Marketplace"
                                                    >
                                                        <Eye className="w-2.5 h-2.5" />
                                                    </button>
                                                </div>
                                                <p className="text-[11px] font-bold text-gray-900 dark:text-white leading-none">{formatCurrency(fin.marketplace_royalty || 0)}</p>
                                            </div>
                                            <div className="space-y-0.5">
                                                <div className="text-[10px] font-bold text-gray-700 dark:text-gray-500">Phí sàn</div>
                                                <p className="text-[11px] font-bold text-red-500 leading-none">-{formatCurrency(fin.total_fees)}</p>
                                            </div>
                                        </div>

                                        <div className="mt-auto flex items-center justify-between">
                                            <div className="flex items-center gap-1.5 group/eye">
                                                <div className="text-[10px] font-bold text-gray-600 dark:text-gray-500">
                                                    {event.settlement_status === 'settled' ? 'Quyết toán hoàn tất' : `${fin.pending_orders_count} đơn hàng • 100% Sẵn sàng`}
                                                </div>
                                                {event.settlement_status !== 'settled' && (
                                                    <button 
                                                        onClick={() => navigate(`/organizer/orders?event_id=${event.id}&is_settled=false`)}
                                                        className="p-1 hover:bg-gray-100 dark:hover:bg-white/5 rounded-md transition-colors text-gray-400 hover:text-blue-600 flex items-center gap-1"
                                                        title="Xem chi tiết các đơn hàng này"
                                                    >
                                                        <Eye className="w-3 h-3" />
                                                    </button>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {event.settlement_status === 'eligible' && (
                                                    <button 
                                                        onClick={() => handleRequestSettlement(event.id)}
                                                        disabled={requestingId === event.id || new Date(event.end_date || event.event_date) > new Date()}
                                                        className={`px-4 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all flex items-center gap-1.5 shadow-lg active:scale-95 ${
                                                            new Date(event.end_date || event.event_date) > new Date()
                                                                ? 'bg-gray-200 dark:bg-white/10 text-gray-400 dark:text-gray-500 cursor-not-allowed shadow-none'
                                                                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/10'
                                                        }`}
                                                    >
                                                        {requestingId === event.id ? 'Đang gửi...' : 
                                                         new Date(event.end_date || event.event_date) > new Date() ? (
                                                            <>
                                                                <Clock className="w-3 h-3" />
                                                                Đợi kết thúc sự kiện
                                                            </>
                                                         ) : 'Yêu cầu quyết toán'}
                                                    </button>
                                                )}
                                            </div>

                                            {['pending', 'processing'].includes(event.settlement_status) && (
                                                <div className="flex items-center gap-1.5 text-orange-500 text-[9px] font-black uppercase">
                                                    <Clock className="w-3 h-3 animate-pulse" /> Đang chờ duyệt...
                                                </div>
                                            )}
                                            
                                            {event.settlement_status === 'settled' && (
                                                <button className="text-[9px] font-black uppercase text-gray-600 dark:text-gray-400 hover:text-blue-600 flex items-center gap-1 transition-colors">
                                                    Xem chi tiết <ArrowRight className="w-3 h-3" />
                                                </button>
                                            )}

                                            {event.settlement_status === 'rejected' && (
                                                <div className="flex items-center gap-1.5 text-rose-500 text-[9px] font-black uppercase" title="Dữ liệu tài chính không khớp Blockchain. Vui lòng liên hệ Admin.">
                                                    <AlertCircle className="w-3.5 h-3.5" /> Sai lệch Blockchain!
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white dark:bg-white/5 rounded-[2rem] border border-dashed border-gray-200 dark:border-white/10 shadow-sm">
                        <ClipboardList className="w-10 h-10 text-gray-300 dark:text-white/10 mx-auto mb-4" />
                        <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">Chưa có sự kiện khả dụng</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-[11px] mt-1 font-medium">Các sự kiện sẽ xuất hiện ở đây sau khi kết thúc 24h.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrganizerSettlement;

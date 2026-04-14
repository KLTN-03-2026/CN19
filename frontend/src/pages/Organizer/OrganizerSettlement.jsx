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
  Filter,
  RefreshCcw,
  Banknote,
  Info
} from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

const OrganizerSettlement = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [requestingId, setRequestingId] = useState(null);

    const fetchEvents = async () => {
        try {
            setLoading(true);
            const res = await api.get('/settlements/organizer/events');
            setEvents(res.data.data);
        } catch (error) {
            console.error(error);
            toast.error('Không thể tải danh sách kết toán');
        } finally {
            setLoading(false);
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
        const matchesFilter = filterStatus === 'all' || event.settlement_status === filterStatus;
        return matchesSearch && matchesFilter;
    });

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
                    bg: 'bg-yellow-500/10', 
                    text: 'text-yellow-500', 
                    label: 'Đang xử lý',
                    icon: Clock 
                };
            case 'eligible':
                return { 
                    bg: 'bg-blue-500/10', 
                    text: 'text-blue-500', 
                    label: 'Sẵn sàng đối soát',
                    icon: ArrowUpRight 
                };
            default:
                return { 
                    bg: 'bg-gray-500/10', 
                    text: 'text-gray-500', 
                    label: 'Chưa có dữ liệu',
                    icon: Info 
                };
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    return (
        <div className="p-1 min-h-screen bg-white dark:bg-[#0a0a0c] text-gray-900 dark:text-white transition-colors duration-300">
            {/* Header */}
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-zinc-500 bg-clip-text text-transparent uppercase tracking-tight">
                         QUYẾT TOÁN SỰ KIỆN
                    </h1>
                    <p className="text-gray-500 dark:text-zinc-400 mt-1">Quản lý và yêu cầu giải ngân doanh thu cho các sự kiện đã kết thúc.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={fetchEvents}
                        className="p-3 bg-gray-100 dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-all"
                    >
                        <RefreshCcw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input 
                            type="text"
                            placeholder="Tìm sự kiện..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-2xl py-3 pl-12 pr-6 text-sm focus:outline-none focus:border-blue-600 transition-all w-full md:w-64"
                        />
                    </div>
                </div>
            </div>

            {/* Warning Box */}
            <div className="mb-8 p-4 bg-blue-500/5 border border-blue-500/20 rounded-3xl flex items-start gap-4">
                <div className="p-2 bg-blue-500/10 rounded-xl">
                    <AlertCircle className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                    <h4 className="text-sm font-black text-blue-500 uppercase tracking-widest">Lưu ý về quy trình đối soát</h4>
                    <p className="text-xs text-blue-500/80 mt-1 leading-relaxed font-medium">
                        Hệ thống sẽ **tự động đối soát sau 3 ngày** kể từ khi sự kiện kết thúc. 
                        Bạn có thể gửi yêu cầu thủ công để Admin xử lý sớm hơn hoặc để chính xác hóa các khoản phí sàn.
                    </p>
                </div>
            </div>

            {/* List */}
            {loading && events.length === 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-48 bg-gray-100 dark:bg-white/5 rounded-3xl animate-pulse"></div>
                    ))}
                </div>
            ) : filteredEvents.length > 0 ? (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {filteredEvents.map((event) => {
                        const style = getStatusStyle(event.settlement_status);
                        const StatusIcon = style.icon;

                        return (
                            <div key={event.id} className="group bg-white dark:bg-[#111114] border border-gray-100 dark:border-white/5 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 border-l-4 border-l-blue-600">
                                <div className="p-6 md:p-8">
                                    <div className="flex flex-col md:flex-row gap-6">
                                        {/* Event Info */}
                                        <div className="w-full md:w-32 h-32 rounded-2xl overflow-hidden border border-gray-100 dark:border-white/10 shrink-0">
                                            <img src={event.image_url} className="w-full h-full object-cover" alt="event" />
                                        </div>

                                        <div className="flex-1 space-y-4">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${style.bg} ${style.text} flex items-center gap-1.5 w-fit mb-2`}>
                                                        <StatusIcon className="w-3 h-3" />
                                                        {style.label}
                                                    </span>
                                                    <h3 className="text-lg font-black text-gray-900 dark:text-white tracking-tight line-clamp-1">{event.title}</h3>
                                                    <div className="flex items-center text-xs text-gray-500 mt-1 font-medium">
                                                        <Calendar className="w-3.5 h-3.5 mr-2 text-blue-600" />
                                                        {format(new Date(event.event_date), 'dd/MM/yyyy')}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Tạm tính thực nhận</div>
                                                    <div className="text-xl font-black text-gray-900 dark:text-white tracking-tighter mt-1">
                                                        {formatCurrency(event.financials.pending_revenue)}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-white/[0.03] rounded-2xl border border-gray-100 dark:border-white/5">
                                                <div>
                                                    <div className="text-[9px] text-gray-400 font-bold uppercase tracking-widest leading-none">Số lượng đơn</div>
                                                    <div className="text-sm font-black text-gray-900 dark:text-white mt-1.5">{event.financials.pending_orders_count}</div>
                                                </div>
                                                <div>
                                                    <div className="text-[9px] text-gray-400 font-bold uppercase tracking-widest leading-none">Phí sàn (Fee)</div>
                                                    <div className="text-sm font-black text-red-500 mt-1.5">-{formatCurrency(event.financials.total_fees)}</div>
                                                </div>
                                                <div>
                                                    <div className="text-[9px] text-gray-400 font-bold uppercase tracking-widest leading-none">Trạng thái vé</div>
                                                    <div className="text-sm font-black text-gray-900 dark:text-white mt-1.5">Sẵn sàng</div>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between pt-2">
                                                <div className="flex -space-x-2">
                                                    {[1, 2, 3].map(i => (
                                                        <div key={i} className="w-6 h-6 rounded-full border-2 border-white dark:border-[#111114] bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                                                            <DollarSign className="w-3 h-3 text-gray-400" />
                                                        </div>
                                                    ))}
                                                    <div className="w-6 h-6 rounded-full border-2 border-white dark:border-[#111114] bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white">
                                                        +3
                                                    </div>
                                                </div>

                                                {event.settlement_status === 'eligible' && (
                                                    <button 
                                                        onClick={() => handleRequestSettlement(event.id)}
                                                        disabled={requestingId === event.id}
                                                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-blue-600/20 disabled:opacity-50"
                                                    >
                                                        {requestingId === event.id ? 'Đang gửi...' : (
                                                            <>
                                                                Yêu cầu quyết toán <Banknote className="w-4 h-4" />
                                                            </>
                                                        )}
                                                    </button>
                                                )}
                                                
                                                {event.settlement_status === 'settled' && (
                                                    <button className="px-6 py-2.5 bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 text-[11px] font-black uppercase tracking-widest rounded-xl flex items-center gap-2">
                                                        Xem phiếu chi <ChevronRight className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-20 bg-gray-50 dark:bg-white/[0.02] rounded-[3rem] border border-dashed border-gray-200 dark:border-white/5">
                    <ClipboardList className="w-16 h-16 text-gray-300 dark:text-white/5 mx-auto mb-4" />
                    <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">Chưa có sự kiện khả dụng</h3>
                    <p className="text-gray-500 text-sm mt-2 max-w-sm mx-auto">Các sự kiện sẽ xuất hiện ở đây sau khi kết thúc 24h hoặc bạn chủ động kết thúc sự kiện.</p>
                </div>
            )}
        </div>
    );
};

export default OrganizerSettlement;

import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Eye, 
  ExternalLink,
  ChevronRight,
  ArrowRightLeft,
  Banknote,
  ShieldCheck,
  AlertCircle,
  RefreshCcw,
  FileText,
  ShieldAlert,
  Calendar,
  Download,
  TrendingUp
} from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

const AdminSettlementManagement = () => {
    const [requests, setRequests] = useState([]);
    const [eligibleEvents, setEligibleEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'all_requests', 'pending', 'settled'
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [adminNote, setAdminNote] = useState('');
    const [evidenceUrl, setEvidenceUrl] = useState('');

    const fetchRequests = async () => {
        try {
            setLoading(true);
            // Luôn lấy tất cả để stats luôn đúng
            const res = await api.get('/settlements/admin/requests');
            setRequests(res.data.data);
        } catch (error) {
            toast.error('Không thể tải danh sách yêu cầu');
        } finally {
            setLoading(false);
        }
    };

    const fetchEligibleEvents = async () => {
        try {
            setLoading(true);
            const res = await api.get('/settlements/admin/eligible-events');
            setEligibleEvents(res.data.data);
        } catch (error) {
            console.error('Không thể tải dữ liệu dự kiến quyết toán');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Tải cả hai để stats luôn đầy đủ
        fetchEligibleEvents();
        fetchRequests();
    }, []); // Chỉ chạy lần đầu, hoặc bạn có thể thêm refresh logic

    // Refresh khi đổi tab nếu cần, nhưng fetchRequests đã lấy all rồi
    useEffect(() => {
        if (activeTab === 'overview' || activeTab === 'all_requests') {
            fetchEligibleEvents();
        }
    }, [activeTab]);

    const handleProcess = async (id, action) => {
        try {
            setIsProcessing(true);
            await api.post(`/settlements/admin/process/${id}`, {
                action,
                note: adminNote,
                evidence_url: evidenceUrl
            });
            toast.success(action === 'settle' ? 'Quyết toán thành công!' : 'Đã xử lý yêu cầu');
            setSelectedRequest(null);
            setAdminNote('');
            setEvidenceUrl('');
            fetchEligibleEvents();
            fetchRequests();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Lỗi xử lý');
        } finally {
            setIsProcessing(false);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'settled':
                return <span className="px-3 py-1.5 bg-neon-green/10 text-neon-green rounded-xl text-[10px] font-black uppercase tracking-tight flex items-center gap-1.5 w-fit"><CheckCircle2 className="w-3 h-3" /> Đã trả tiền</span>;
            case 'pending':
                return <span className="px-3 py-1.5 bg-yellow-500/10 text-yellow-500 rounded-xl text-[10px] font-black uppercase tracking-tight flex items-center gap-1.5 w-fit"><Clock className="w-3 h-3" /> Chờ duyệt</span>;
            case 'processing':
                return <span className="px-3 py-1.5 bg-blue-500/10 text-blue-500 rounded-xl text-[10px] font-black uppercase tracking-tight flex items-center gap-1.5 w-fit"><ArrowRightLeft className="w-3 h-3" /> Đang chuyển</span>;
            case 'rejected':
                return <span className="px-3 py-1.5 bg-red-500/10 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-tight flex items-center gap-1.5 w-fit"><XCircle className="w-3 h-3" /> Từ chối</span>;
            case 'eligible':
                return <span className="px-3 py-1.5 bg-purple-500/10 text-purple-500 rounded-xl text-[10px] font-black uppercase tracking-tight flex items-center gap-1.5 w-fit"><AlertCircle className="w-3 h-3" /> Sắp quyết toán</span>;
            case 'not_started':
                return <span className="px-3 py-1.5 bg-gray-500/10 text-gray-500 rounded-xl text-[10px] font-black uppercase tracking-tight flex items-center gap-1.5 w-fit"><ShieldAlert className="w-3 h-3" /> Chưa đối soát</span>;
            default:
                return <span className="px-3 py-1.5 bg-gray-100 text-gray-500 rounded-xl text-[10px] font-black uppercase tracking-tight w-fit">{status}</span>;
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
    };

    // Tính toán thống kê tự động từ toàn bộ dữ liệu
    const stats = {
        pendingCount: requests.filter(r => r.status === 'pending').length,
        pendingAmount: requests.filter(r => r.status === 'pending').reduce((sum, r) => sum + Number(r.net_payout), 0),
        settledCount: requests.filter(r => r.status === 'settled').length,
        settledAmount: requests.filter(r => r.status === 'settled').reduce((sum, r) => sum + Number(r.net_payout), 0),
        forecastCount: eligibleEvents.filter(e => e.settlement_status === 'eligible').length,
        forecastAmount: eligibleEvents.filter(e => e.settlement_status === 'eligible').reduce((sum, e) => sum + Number(e.financials?.pending_revenue || 0), 0),
        totalEvents: eligibleEvents.length,
        totalOverviewAmount: eligibleEvents.reduce((sum, e) => sum + Number(e.financials?.pending_revenue || 0), 0),
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0a0a0c] text-gray-900 dark:text-white transition-colors duration-300 font-sans">
            <div className="max-w-[1400px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 tracking-tight">
                {/* Header & Stats Grid */}
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3 uppercase">
                                <CreditCard className="w-6 h-6 text-neon-green" />
                                QUẢN LÝ QUYẾT TOÁN
                            </h1>
                            <p className="text-[11px] text-slate-600 dark:text-zinc-500 mt-1 font-bold uppercase tracking-tight">Phê duyệt và giải ngân doanh thu cho Ban tổ chức sau sự kiện</p>
                        </div>

                        <div className="flex items-center gap-3">
                            <button 
                                onClick={() => { fetchRequests(); fetchEligibleEvents(); }}
                                className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800/80 hover:border-neon-green/50 transition-all text-slate-600 hover:text-neon-green shadow-sm active:scale-95"
                            >
                                <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                    </div>

                    {/* Stats Grid - Enhanced Contrast */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white dark:bg-zinc-900/50 p-6 rounded-[2rem] border border-gray-200 dark:border-zinc-800/50 relative overflow-hidden group hover:border-yellow-500/30 hover:shadow-xl transition-all cursor-pointer" onClick={() => setActiveTab('pending')}>
                            <div className="absolute -right-5 -top-5 text-yellow-500/5 group-hover:text-yellow-500/10 group-hover:scale-110 transition-all duration-700 pointer-events-none">
                                <Clock className="w-32 h-32" />
                            </div>
                            <div className="relative">
                                <div className="text-[10px] font-black text-slate-600 dark:text-gray-400 uppercase tracking-tight flex items-center gap-2 mb-4">
                                    <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
                                    Tổng nợ chưa trả ({stats.pendingCount + stats.forecastCount})
                                </div>
                                <div className="text-2xl font-black text-gray-900 dark:text-white tracking-tight leading-none">
                                    {formatCurrency(stats.pendingAmount + stats.forecastAmount)}
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-zinc-900/50 p-6 rounded-[2rem] border border-gray-200 dark:border-zinc-800/50 relative overflow-hidden group hover:border-purple-500/30 hover:shadow-xl transition-all cursor-pointer" onClick={() => setActiveTab('overview')}>
                            <div className="absolute -right-5 -top-5 text-purple-500/5 group-hover:text-purple-500/10 group-hover:scale-110 transition-all duration-700 pointer-events-none">
                                <AlertCircle className="w-32 h-32" />
                            </div>
                            <div className="relative">
                                <div className="text-[10px] font-black text-slate-600 dark:text-gray-400 uppercase tracking-tight flex items-center gap-2 mb-4">
                                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                                    Tổng quan sự kiện ({stats.totalEvents})
                                </div>
                                <div className="text-2xl font-black text-purple-600 dark:text-purple-400 tracking-tight leading-none">
                                    {formatCurrency(stats.totalOverviewAmount)}
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-zinc-900/50 p-6 rounded-[2rem] border border-gray-200 dark:border-zinc-800/50 relative overflow-hidden group hover:border-neon-green/30 hover:shadow-xl transition-all cursor-pointer" onClick={() => setActiveTab('settled')}>
                            <div className="absolute -right-5 -top-5 text-neon-green/5 group-hover:text-neon-green/10 group-hover:scale-110 transition-all duration-700 pointer-events-none">
                                <CheckCircle2 className="w-32 h-32" />
                            </div>
                            <div className="relative">
                                <div className="text-[10px] font-black text-slate-600 dark:text-gray-400 uppercase tracking-tight flex items-center gap-2 mb-4">
                                    <span className="w-2 h-2 rounded-full bg-neon-green"></span>
                                    Đã quyết toán ({stats.settledCount})
                                </div>
                                <div className="text-2xl font-black text-neon-green tracking-tight leading-none">
                                    {formatCurrency(stats.settledAmount)}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tabs Navigation - Premium Style */}
                    <div className="flex items-center gap-2 border-b border-gray-200 dark:border-zinc-800/50 pb-0.5 overflow-x-auto custom-scrollbar whitespace-nowrap">
                        <button 
                            onClick={() => setActiveTab('overview')}
                            className={`px-6 py-3 text-[10px] font-black uppercase tracking-tight transition-all relative ${activeTab === 'overview' ? 'text-purple-600' : 'text-slate-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                        >
                            TẤT CẢ SỰ KIỆN
                            {activeTab === 'overview' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 animate-in fade-in zoom-in duration-300"></div>}
                        </button>
                        <button 
                            onClick={() => setActiveTab('all_requests')}
                            className={`px-6 py-3 text-[10px] font-black uppercase tracking-tight transition-all relative ${activeTab === 'all_requests' ? 'text-neon-green' : 'text-slate-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                        >
                            SẮP QUYẾT TOÁN
                            {activeTab === 'all_requests' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-neon-green animate-in fade-in zoom-in duration-300"></div>}
                        </button>
                        <button 
                            onClick={() => setActiveTab('pending')}
                            className={`px-6 py-3 text-[10px] font-black uppercase tracking-tight transition-all relative ${activeTab === 'pending' ? 'text-yellow-500' : 'text-slate-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                        >
                            CHỜ DUYỆT ({stats.pendingCount})
                            {activeTab === 'pending' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow-500 animate-in fade-in zoom-in duration-300"></div>}
                        </button>
                        <button 
                            onClick={() => setActiveTab('settled')}
                            className={`px-6 py-3 text-[10px] font-black uppercase tracking-tight transition-all relative ${activeTab === 'settled' ? 'text-blue-500' : 'text-slate-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                        >
                            ĐÃ HOÀN TẤT
                            {activeTab === 'settled' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 animate-in fade-in zoom-in duration-300"></div>}
                        </button>
                    </div>
                </div>

                {/* Grid Content */}
                {(loading && (activeTab === 'overview' || activeTab === 'all_requests' ? eligibleEvents.length === 0 : requests.length === 0)) ? (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        {[1, 2, 3, 4].map(i => <div key={i} className="h-48 bg-white dark:bg-zinc-900/50 rounded-[2rem] animate-pulse border border-gray-200 dark:border-zinc-800"></div>)}
                    </div>
                ) : (
                    activeTab === 'overview' || activeTab === 'all_requests' 
                    ? (activeTab === 'all_requests' ? eligibleEvents.filter(e => e.settlement_status === 'eligible') : eligibleEvents)
                    : requests.filter(r => r.status === activeTab)
                ).length > 0 ? (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        {(
                            activeTab === 'overview' || activeTab === 'all_requests' 
                            ? (activeTab === 'all_requests' ? eligibleEvents.filter(e => e.settlement_status === 'eligible') : eligibleEvents)
                            : requests.filter(r => r.status === activeTab)
                        ).map((item) => {
                            const isOverview = activeTab === 'overview' || activeTab === 'all_requests';
                            const status = isOverview ? item.settlement_status : item.status;
                            const financials = isOverview ? (item.financials || {}) : item;
                            
                            return (
                                <div key={item.id} className="bg-white dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-800/50 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl hover:border-neon-green/30 transition-all group flex flex-col sm:flex-row min-h-[14rem]">
                                    {/* Event Image */}
                                    <div className="w-full sm:w-44 h-32 sm:h-auto relative shrink-0 overflow-hidden">
                                        <img 
                                            src={(isOverview ? item.image_url : item.event?.image_url) || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&q=80'} 
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" 
                                            alt="event" 
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent sm:hidden"></div>
                                    </div>

                                    <div className="flex-1 p-6 flex flex-col">
                                        {/* Header */}
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 mb-2">
                                                    {getStatusBadge(status)}
                                                    <span className="text-[10px] text-slate-600 dark:text-gray-500 font-black uppercase tracking-tight">
                                                        {format(new Date(isOverview ? (item.end_date || item.event_date) : (item.requested_at || item.created_at)), 'dd/MM/yyyy')}
                                                    </span>
                                                </div>
                                                <h3 className="text-sm font-black text-gray-900 dark:text-white tracking-tight line-clamp-1 uppercase group-hover:text-neon-green transition-colors">
                                                    {isOverview ? item.title : item.event?.title}
                                                </h3>
                                                <div className="text-[10px] text-slate-600 dark:text-gray-400 font-black uppercase tracking-tight mt-1 flex items-center gap-1.5">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-neon-green/40"></div>
                                                    BTC: {isOverview ? item.organizer?.organization_name : item.event?.organizer?.organization_name}
                                                </div>
                                            </div>
                                            
                                            <div className="text-right shrink-0 ml-4">
                                                <p className="text-[10px] font-black text-slate-500 dark:text-gray-500 uppercase mb-1">{!isOverview || status === 'settled' ? 'THỰC TRẢ' : 'DỰ KIẾN'}</p>
                                                <p className={`text-xl font-black tracking-tight leading-none ${status === 'settled' ? 'text-neon-green' : (status === 'eligible' ? 'text-purple-600' : 'text-gray-900 dark:text-white')}`}>
                                                    {formatCurrency(isOverview ? financials.pending_revenue : item.net_payout)}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Revenue Breakdown - High Contrast */}
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50/80 dark:bg-zinc-950/80 rounded-[1.25rem] border border-gray-200 dark:border-zinc-800/80 mb-5 shadow-inner">
                                            <div className="space-y-1">
                                                <div className="text-[9px] font-black text-slate-600 dark:text-gray-400 uppercase tracking-tight">Vé</div>
                                                <p className="text-[11px] font-black text-gray-900 dark:text-white tracking-tight leading-none">{formatCurrency(financials.ticket_revenue || 0)}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="text-[9px] font-black text-slate-600 dark:text-gray-400 uppercase tracking-tight">Vật phẩm</div>
                                                <p className="text-[11px] font-black text-gray-900 dark:text-white tracking-tight leading-none">{formatCurrency(financials.merch_revenue || 0)}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="text-[9px] font-black text-slate-600 dark:text-gray-400 uppercase tracking-tight">Mkt</div>
                                                <p className="text-[11px] font-black text-gray-900 dark:text-white tracking-tight leading-none">{formatCurrency(financials.marketplace_royalty || 0)}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="text-[9px] font-black text-red-500 dark:text-red-400 uppercase tracking-tight">Phí sàn</div>
                                                <p className="text-[11px] font-black text-red-600 dark:text-red-500 tracking-tight leading-none">-{formatCurrency(financials.total_fees || 0)}</p>
                                            </div>
                                        </div>

                                        {/* Footer */}
                                        <div className="mt-auto flex items-center justify-between pt-1">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center">
                                                    <Banknote className="w-4 h-4 text-slate-600 dark:text-gray-400" />
                                                </div>
                                                <div className="text-[10px] font-black text-slate-600 dark:text-gray-400 uppercase">
                                                    {!isOverview ? `TK: *${item.bank_info?.account_number?.slice(-4) || '****'}` : (status === 'settled' ? 'Hoàn tất giải ngân' : 'Chờ BTC yêu cầu')}
                                                </div>
                                            </div>

                                            {!isOverview ? (
                                                <button 
                                                    onClick={() => setSelectedRequest(item)}
                                                    className="px-6 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-black text-[10px] font-black uppercase rounded-xl hover:bg-neon-green hover:text-black dark:hover:bg-neon-green transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-zinc-900/10 dark:shadow-white/5"
                                                >
                                                    XỬ LÝ NGAY
                                                    <ChevronRight className="w-3 h-3" />
                                                </button>
                                            ) : (
                                                <div className="text-[10px] font-black text-slate-500 dark:text-gray-500 uppercase italic opacity-80 tracking-tight">
                                                    {status === 'settled' ? 'DONE' : 'PENDING'}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-28 bg-white dark:bg-zinc-900/50 rounded-[2.5rem] border-2 border-dashed border-gray-200 dark:border-zinc-800 shadow-sm">
                        <ShieldCheck className="w-20 h-20 text-slate-200 dark:text-zinc-800 mx-auto mb-6" />
                        <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">Hiện chưa có dữ liệu</h3>
                        <p className="text-slate-600 dark:text-gray-500 text-[11px] mt-2 font-bold uppercase tracking-tight">
                            {activeTab === 'requests' ? 'Các yêu cầu mới từ BTC sẽ xuất hiện tại đây' : 'Hiện không có sự kiện nào trong danh sách này'}
                        </p>
                    </div>
                )}
            </div>


            {/* Modal Chi Tiết Quyết Toán (Premium Redesign) */}
            {selectedRequest && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/60 dark:bg-black/80 backdrop-blur-xl transition-all" onClick={() => setSelectedRequest(null)}></div>
                    <div className="relative bg-white dark:bg-zinc-950 w-full max-w-2xl rounded-[2.5rem] border border-gray-100 dark:border-zinc-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        
                        {/* Glow Effects */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-neon-green/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none"></div>
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full -ml-32 -mb-32 blur-3xl pointer-events-none"></div>

                        {/* Modal Header */}
                        <div className="px-10 py-8 border-b border-gray-100 dark:border-zinc-800/50 bg-gray-50/50 dark:bg-zinc-900/30 relative z-10">
                             <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
                                  <div className="p-2 bg-neon-green/10 rounded-xl">
                                     <FileText className="w-6 h-6 text-neon-green" />
                                  </div>
                                  CHI TIẾT GIẢI NGÂN
                             </h2>
                             <p className="text-[11px] text-slate-500 dark:text-zinc-500 font-black uppercase tracking-tight mt-2 ml-14">Mã yêu cầu: #{selectedRequest.id}</p>
                        </div>

                        {/* Modal Content */}
                        <div className="p-10 space-y-8 max-h-[65vh] overflow-y-auto custom-scrollbar relative z-10">
                            
                            {/* Event Image & Summary Header */}
                            <div className="flex flex-col md:flex-row gap-8 items-start">
                                <div className="w-full md:w-48 h-32 rounded-[2rem] overflow-hidden shrink-0 border border-gray-200 dark:border-zinc-800 shadow-md">
                                    <img 
                                        src={selectedRequest.event?.image_url || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&q=80'} 
                                        className="w-full h-full object-cover" 
                                        alt="event" 
                                    />
                                </div>
                                <div className="flex-1 space-y-5">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="text-[10px] font-black text-slate-500 dark:text-zinc-500 uppercase tracking-tight block mb-2">Tên sự kiện</label>
                                            <div className="font-black text-gray-900 dark:text-white uppercase tracking-tight leading-tight text-sm">{selectedRequest.event?.title}</div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-neon-green uppercase tracking-tight block mb-2 opacity-80">Ban tổ chức</label>
                                            <div className="font-black text-neon-green uppercase tracking-tight leading-tight text-sm">{selectedRequest.event?.organizer?.organization_name}</div>
                                        </div>
                                    </div>
                                    <div className="pt-6 border-t border-gray-100 dark:border-zinc-800/50 flex items-end justify-between">
                                        <div>
                                            <label className="text-[10px] font-black text-slate-500 dark:text-zinc-500 uppercase tracking-widest block mb-2">Tổng doanh thu (GROSS)</label>
                                            <div className="font-black text-gray-900 dark:text-white text-2xl tracking-tight">{formatCurrency(selectedRequest.total_revenue)}</div>
                                        </div>
                                        <div className="text-right">
                                            <label className="text-[10px] font-black text-neon-green uppercase tracking-widest block mb-2 opacity-80">Thực nhận (NET)</label>
                                            <div className="font-black text-neon-green text-3xl tracking-tight leading-none">{formatCurrency(selectedRequest.net_payout)}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Detailed Breakdown */}
                            <div className="p-6 bg-slate-50/50 dark:bg-zinc-900/50 rounded-[2rem] border border-gray-200 dark:border-zinc-800/50">
                                <h3 className="text-[10px] font-black text-slate-600 dark:text-zinc-500 uppercase tracking-tight mb-5 flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4 text-neon-green/70" />
                                    BẢNG PHÂN BỔ TÀI CHÍNH
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="p-4 bg-white dark:bg-zinc-950 rounded-2xl border border-gray-100 dark:border-zinc-800/50 shadow-sm">
                                        <div className="text-[9px] font-black text-slate-500 dark:text-gray-500 uppercase mb-1.5 tracking-tight">Doanh thu vé</div>
                                        <div className="font-black text-gray-900 dark:text-white text-sm tracking-tight">{formatCurrency(selectedRequest.ticket_revenue || 0)}</div>
                                    </div>
                                    <div className="p-4 bg-white dark:bg-zinc-950 rounded-2xl border border-gray-100 dark:border-zinc-800/50 shadow-sm">
                                        <div className="text-[9px] font-black text-slate-500 dark:text-gray-500 uppercase mb-1.5 tracking-tight">Vật phẩm</div>
                                        <div className="font-black text-gray-900 dark:text-white text-sm tracking-tight">{formatCurrency(selectedRequest.merch_revenue || 0)}</div>
                                    </div>
                                    <div className="p-4 bg-white dark:bg-zinc-950 rounded-2xl border border-gray-100 dark:border-zinc-800/50 shadow-sm">
                                        <div className="text-[9px] font-black text-slate-500 dark:text-gray-500 uppercase mb-1.5 tracking-tight">Marketplace</div>
                                        <div className="font-black text-gray-900 dark:text-white text-sm tracking-tight">{formatCurrency(selectedRequest.marketplace_royalty || 0)}</div>
                                    </div>
                                    <div className="p-4 bg-white dark:bg-zinc-950 rounded-2xl border border-gray-100 dark:border-zinc-800/50 shadow-sm">
                                        <div className="text-[9px] font-black text-red-400 uppercase mb-1.5 tracking-tight">Phí hệ thống</div>
                                        <div className="font-black text-red-500 text-sm tracking-tight">-{formatCurrency(selectedRequest.total_fees || 0)}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Bank Info Section */}
                            <div className="p-6 bg-slate-50/80 dark:bg-zinc-900/80 rounded-[2rem] border border-gray-200 dark:border-zinc-800">
                                <div className="text-[10px] font-black text-slate-600 dark:text-zinc-500 uppercase tracking-tight mb-5 flex items-center gap-2">
                                    <Banknote className="w-4 h-4 text-neon-green/70" />
                                    THÔNG TIN CHUYỂN KHOẢN
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white dark:bg-zinc-950 p-6 rounded-[1.5rem] border border-gray-100 dark:border-zinc-800/50 shadow-sm">
                                    <div className="md:col-span-2">
                                        <span className="text-[10px] text-slate-500 font-black uppercase tracking-tight block mb-2">Số tài khoản thụ hưởng</span>
                                        <span className="font-black text-gray-900 dark:text-white text-3xl tracking-tight select-all">{selectedRequest.bank_info?.account_number || 'N/A'}</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-slate-500 font-black uppercase tracking-tight block mb-2">Tên chủ tài khoản</span>
                                        <span className="font-black text-gray-900 dark:text-white uppercase tracking-tight text-lg">{selectedRequest.bank_info?.account_holder || 'N/A'}</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-slate-500 font-black uppercase tracking-tight block mb-2">Ngân hàng</span>
                                        <span className="font-black text-gray-900 dark:text-zinc-300 tracking-tight uppercase text-sm">{selectedRequest.bank_info?.bank_name || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Processing Section */}
                            {selectedRequest.status !== 'settled' && (
                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-600 dark:text-zinc-500 uppercase tracking-tight flex items-center gap-2 ml-1">
                                            <FileText className="w-4 h-4 text-neon-green/60" /> Ghi chú nội bộ
                                        </label>
                                        <textarea 
                                            value={adminNote}
                                            onChange={(e) => setAdminNote(e.target.value)}
                                            className="w-full bg-white dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-800 rounded-[1.5rem] p-5 text-sm font-bold focus:outline-none focus:border-neon-green transition-all dark:text-white placeholder-slate-400 dark:placeholder-zinc-600 shadow-sm resize-none"
                                            placeholder="Nhập hướng dẫn hoặc ghi chú đối soát..."
                                            rows="3"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-600 dark:text-zinc-500 uppercase tracking-tight flex items-center gap-2 ml-1">
                                            <ExternalLink className="w-4 h-4 text-neon-green/60" /> Biên lai chuyển khoản (URL)
                                        </label>
                                        <input 
                                            type="url"
                                            value={evidenceUrl}
                                            onChange={(e) => setEvidenceUrl(e.target.value)}
                                            className="w-full bg-white dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-800 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:border-neon-green transition-all dark:text-white placeholder-slate-400 dark:placeholder-zinc-600 shadow-sm"
                                            placeholder="https://imgur.com/example.png"
                                        />
                                    </div>
                                </div>
                            )}

                            {selectedRequest.status === 'settled' && (
                                <div className="flex items-center gap-6 p-6 bg-neon-green/5 border border-neon-green/20 rounded-[2rem] animate-in slide-in-from-bottom-4 duration-500">
                                    <div className="w-14 h-14 rounded-full bg-neon-green/20 flex items-center justify-center shrink-0 shadow-lg shadow-neon-green/5">
                                        <CheckCircle2 className="w-7 h-7 text-neon-green" />
                                    </div>
                                    <div>
                                        <span className="text-sm font-black text-neon-green uppercase tracking-tight">GIAO DỊCH HOÀN TẤT</span>
                                        <p className="text-[11px] text-slate-600 dark:text-zinc-400 font-bold mt-1 uppercase tracking-tight">Mã tham chiếu: {selectedRequest.payout_trans_id}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-10 bg-slate-50/90 dark:bg-zinc-900/90 border-t border-gray-100 dark:border-zinc-800/80 flex items-center gap-4 relative z-10 backdrop-blur-xl">
                            <button 
                                onClick={() => setSelectedRequest(null)}
                                className="px-10 py-4 text-[11px] font-black uppercase tracking-tight text-slate-600 hover:text-gray-900 dark:hover:text-white bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-2xl transition-all shadow-sm active:scale-95"
                            >
                                QUAY LẠI
                            </button>
                            
                            {selectedRequest.status !== 'settled' && selectedRequest.status !== 'rejected' && (
                                <div className="flex gap-4 ml-auto">
                                    <button 
                                        onClick={() => handleProcess(selectedRequest.id, 'reject')}
                                        className="px-8 py-4 bg-red-500/10 text-red-600 border border-red-500/20 text-[11px] font-black uppercase tracking-tight rounded-2xl hover:bg-red-600 hover:text-white transition-all active:scale-95"
                                    >
                                        TỪ CHỐI
                                    </button>
                                    {selectedRequest.status === 'pending' && (
                                        <button 
                                            onClick={() => handleProcess(selectedRequest.id, 'approve')}
                                            className="px-10 py-4 bg-zinc-900 dark:bg-blue-600 text-white text-[11px] font-black uppercase tracking-tight rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 active:scale-95"
                                        >
                                            DUYỆT YÊU CẦU
                                        </button>
                                    )}
                                    {selectedRequest.status === 'processing' && (
                                        <button 
                                            onClick={() => handleProcess(selectedRequest.id, 'settle')}
                                            className="px-10 py-4 bg-neon-green text-black text-[11px] font-black uppercase tracking-tight rounded-2xl hover:bg-neon-green/90 transition-all shadow-xl shadow-neon-green/20 active:scale-95"
                                        >
                                            XÁC NHẬN GIẢI NGÂN
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminSettlementManagement;

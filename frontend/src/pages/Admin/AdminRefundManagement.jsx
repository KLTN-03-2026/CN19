import React, { useState, useEffect } from 'react';
import { 
  RotateCcw, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Eye, 
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  RefreshCcw,
  FileText,
  User,
  Ticket,
  Calendar,
  Wallet,
  ArrowUpRight,
  MessageSquare
} from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

const AdminRefundManagement = () => {
    const [refunds, setRefunds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('pending'); // 'all', 'pending', 'approved', 'rejected'
    const [selectedRefund, setSelectedRefund] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [adminNote, setAdminNote] = useState('');

    const fetchRefunds = async () => {
        try {
            setLoading(true);
            const res = await api.get('/refunds/admin/list');
            setRefunds(res.data.data);
        } catch (error) {
            toast.error('Không thể tải danh sách yêu cầu hoàn tiền');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRefunds();
    }, []);

    const handleProcess = async (id, action) => {
        try {
            setIsProcessing(true);
            await api.post(`/refunds/admin/${id}/process`, {
                action,
                admin_notes: adminNote
            });
            toast.success(action === 'approve' ? 'Đã duyệt hoàn tiền thành công' : 'Đã từ chối yêu cầu');
            setSelectedRefund(null);
            setAdminNote('');
            fetchRefunds();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Lỗi xử lý');
        } finally {
            setIsProcessing(false);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'approved':
                return <span className="px-3 py-1.5 bg-green-500/10 text-green-600 rounded-xl text-[10px] font-black uppercase tracking-tight flex items-center gap-1.5 w-fit border border-green-500/20"><CheckCircle2 className="w-3 h-3" /> Đã hoàn tiền</span>;
            case 'pending':
                return <span className="px-3 py-1.5 bg-yellow-500/10 text-yellow-600 rounded-xl text-[10px] font-black uppercase tracking-tight flex items-center gap-1.5 w-fit border border-yellow-500/20"><Clock className="w-3 h-3" /> Đang chờ duyệt</span>;
            case 'rejected':
                return <span className="px-3 py-1.5 bg-red-500/10 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-tight flex items-center gap-1.5 w-fit border border-red-500/20"><XCircle className="w-3 h-3" /> Đã từ chối</span>;
            default:
                return <span className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-xl text-[10px] font-black uppercase tracking-tight w-fit">{status}</span>;
        }
    };

    const getTypeBadge = (type) => {
        switch (type) {
            case 'event_cancelled':
                return <span className="px-2.5 py-1 bg-red-500/10 text-red-600 dark:text-red-400 rounded-lg text-[9px] font-black uppercase tracking-tight border border-red-500/20 flex items-center gap-1"><AlertCircle className="w-2.5 h-2.5" /> Hủy sự kiện</span>;
            case 'event_postponed':
                return <span className="px-2.5 py-1 bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-lg text-[9px] font-black uppercase tracking-tight border border-orange-500/20 flex items-center gap-1"><Clock className="w-2.5 h-2.5" /> Dời lịch</span>;
            default:
                return <span className="px-2.5 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg text-[9px] font-black uppercase tracking-tight border border-blue-500/20 flex items-center gap-1"><User className="w-2.5 h-2.5" /> Khách yêu cầu</span>;
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
    };

    const filteredRefunds = activeTab === 'all' 
        ? refunds 
        : refunds.filter(r => r.status === activeTab);

    const stats = {
        pendingCount: refunds.filter(r => r.status === 'pending').length,
        pendingAmount: refunds.filter(r => r.status === 'pending').reduce((sum, r) => sum + Number(r.refund_amount), 0),
        approvedCount: refunds.filter(r => r.status === 'approved').length,
        approvedAmount: refunds.filter(r => r.status === 'approved').reduce((sum, r) => sum + Number(r.refund_amount), 0),
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0a0a0c] text-gray-900 dark:text-white transition-colors duration-300 font-sans p-6">
            <div className="max-w-[1400px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 tracking-tight">
                
                {/* Header Section */}
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3 uppercase">
                                <RotateCcw className="w-6 h-6 text-orange-500" />
                                QUẢN LÝ HOÀN TIỀN (REFUNDS)
                            </h1>
                            <p className="text-[11px] text-slate-800 dark:text-zinc-400 mt-1 font-bold uppercase tracking-tight">Xử lý các yêu cầu trả vé và hoàn tiền từ người dùng hệ thống</p>
                        </div>

                        <div className="flex items-center gap-3">
                            <button 
                                onClick={fetchRefunds}
                                className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800/80 hover:border-orange-500/50 transition-all text-slate-800 hover:text-orange-500 shadow-sm active:scale-95"
                            >
                                <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white dark:bg-zinc-900/50 p-6 rounded-[2rem] border border-gray-200 dark:border-zinc-800/50 relative overflow-hidden group hover:border-yellow-500/30 hover:shadow-xl transition-all cursor-pointer" onClick={() => setActiveTab('pending')}>
                            <div className="absolute -right-5 -top-5 text-yellow-500/5 group-hover:text-yellow-500/10 group-hover:scale-110 transition-all duration-700 pointer-events-none">
                                <Clock className="w-32 h-32" />
                            </div>
                            <div className="relative">
                                <div className="text-[10px] font-black text-slate-800 dark:text-gray-400 uppercase tracking-tight flex items-center gap-2 mb-4">
                                    <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
                                    Chờ xử lý ({stats.pendingCount})
                                </div>
                                <div className="text-2xl font-black text-gray-900 dark:text-white tracking-tight leading-none">
                                    {formatCurrency(stats.pendingAmount)}
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-zinc-900/50 p-6 rounded-[2rem] border border-gray-200 dark:border-zinc-800/50 relative overflow-hidden group hover:border-green-500/30 hover:shadow-xl transition-all cursor-pointer" onClick={() => setActiveTab('approved')}>
                            <div className="absolute -right-5 -top-5 text-green-500/5 group-hover:text-green-500/10 group-hover:scale-110 transition-all duration-700 pointer-events-none">
                                <CheckCircle2 className="w-32 h-32" />
                            </div>
                            <div className="relative">
                                <div className="text-[10px] font-black text-slate-800 dark:text-gray-400 uppercase tracking-tight flex items-center gap-2 mb-4">
                                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                    Đã hoàn tiền ({stats.approvedCount})
                                </div>
                                <div className="text-2xl font-black text-green-600 dark:text-green-400 tracking-tight leading-none">
                                    {formatCurrency(stats.approvedAmount)}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tabs Navigation */}
                    <div className="flex items-center gap-2 border-b border-gray-200 dark:border-zinc-800/50 pb-0.5 overflow-x-auto custom-scrollbar whitespace-nowrap">
                        {[
                            { id: 'pending', label: 'Chờ xét duyệt', color: 'yellow-500' },
                            { id: 'approved', label: 'Đã hoàn tất', color: 'green-500' },
                            { id: 'rejected', label: 'Đã từ chối', color: 'red-500' },
                            { id: 'all', label: 'Tất cả yêu cầu', color: 'slate-500' }
                        ].map(tab => (
                            <button 
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-6 py-3 text-[10px] font-black uppercase tracking-tight transition-all relative ${activeTab === tab.id ? `text-${tab.color}` : 'text-slate-800 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                            >
                                {tab.label}
                                {activeTab === tab.id && <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-${tab.color} animate-in fade-in zoom-in duration-300`}></div>}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content Grid */}
                {loading && filteredRefunds.length === 0 ? (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        {[1, 2, 3, 4].map(i => <div key={i} className="h-48 bg-white dark:bg-zinc-900/50 rounded-[2rem] animate-pulse border border-gray-200 dark:border-zinc-800"></div>)}
                    </div>
                ) : filteredRefunds.length > 0 ? (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        {filteredRefunds.map((item) => (
                            <div key={item.id} className="bg-white dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-800/50 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl hover:border-orange-500/30 transition-all group flex flex-col min-h-[14rem]">
                                <div className="p-6 flex-1 flex flex-col">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center shrink-0 border border-orange-500/20 group-hover:scale-110 transition-all">
                                                <User className="w-6 h-6 text-orange-600" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                    {getStatusBadge(item.status)}
                                                    {getTypeBadge(item.type)}
                                                    <span className="text-[10px] text-slate-800 dark:text-gray-500 font-black uppercase tracking-tight ml-auto">
                                                        {format(new Date(item.created_at), 'dd/MM/yyyy HH:mm')}
                                                    </span>
                                                </div>
                                                <h3 className="text-sm font-black text-gray-900 dark:text-white tracking-tight uppercase">
                                                    {item.customer?.full_name || 'Người dùng ẩn danh'}
                                                </h3>
                                                <p className="text-[10px] text-slate-800 dark:text-gray-400 font-black uppercase tracking-tight opacity-80">{item.customer?.email}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-slate-800 dark:text-gray-500 uppercase mb-1">SỐ TIỀN HOÀN</p>
                                            <p className={`text-xl font-black tracking-tight leading-none ${item.status === 'approved' ? 'text-green-600' : 'text-gray-900 dark:text-white'}`}>
                                                {formatCurrency(item.refund_amount)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Event & Ticket Info */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50/80 dark:bg-zinc-950/80 rounded-[1.5rem] border border-gray-200 dark:border-zinc-800/80 mb-5">
                                        <div className="space-y-1">
                                            <div className="text-[9px] font-black text-slate-800 dark:text-gray-400 uppercase flex items-center gap-1.5"><Calendar className="w-3 h-3" /> Sự kiện</div>
                                            <p className="text-[11px] font-black text-gray-900 dark:text-white tracking-tight uppercase line-clamp-1">{item.ticket?.event?.title}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="text-[9px] font-black text-slate-800 dark:text-gray-400 uppercase flex items-center gap-1.5"><Ticket className="w-3 h-3" /> Loại vé</div>
                                            <p className="text-[11px] font-black text-gray-900 dark:text-white tracking-tight uppercase">{item.ticket?.ticket_tier?.tier_name}</p>
                                        </div>
                                    </div>

                                    <div className="mt-auto flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-slate-800 dark:text-zinc-500">
                                            <MessageSquare className="w-3.5 h-3.5" />
                                            <span className="text-[10px] font-bold italic line-clamp-1">"{item.reason || 'Không có lý do chi tiết'}"</span>
                                        </div>

                                        {item.status === 'pending' ? (
                                            <button 
                                                onClick={() => setSelectedRefund(item)}
                                                className="px-6 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-black text-[10px] font-black uppercase rounded-xl hover:bg-orange-500 hover:text-white dark:hover:bg-orange-500 transition-all active:scale-95 flex items-center gap-2 shadow-lg"
                                            >
                                                XỬ LÝ REFUND
                                                <ChevronRight className="w-3 h-3" />
                                            </button>
                                        ) : (
                                            <div className="text-[10px] font-black text-slate-700 dark:text-gray-500 uppercase tracking-widest opacity-80">
                                                ID: #{item.id.slice(0, 8).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-28 bg-white dark:bg-zinc-900/50 rounded-[2.5rem] border-2 border-dashed border-gray-200 dark:border-zinc-800 shadow-sm">
                        <ShieldCheck className="w-20 h-20 text-slate-200 dark:text-zinc-800 mx-auto mb-6" />
                        <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">Không có yêu cầu nào</h3>
                        <p className="text-slate-700 dark:text-gray-500 text-[11px] mt-2 font-bold uppercase tracking-tight">Danh sách yêu cầu hoàn tiền đang trống ở trạng thái này</p>
                    </div>
                )}
            </div>

            {/* Processing Modal */}
            {selectedRefund && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/60 dark:bg-black/80 backdrop-blur-xl transition-all" onClick={() => setSelectedRefund(null)}></div>
                    <div className="relative bg-white dark:bg-zinc-950 w-full max-w-lg rounded-[2.5rem] border border-gray-100 dark:border-zinc-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        
                        <div className="px-10 py-8 border-b border-gray-100 dark:border-zinc-800/50 bg-orange-500/5 dark:bg-zinc-900/30">
                             <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
                                  <div className="p-2 bg-orange-500/10 rounded-xl">
                                     <RotateCcw className="w-6 h-6 text-orange-500" />
                                  </div>
                                  XÉT DUYỆT HOÀN TIỀN
                             </h2>
                             <p className="text-[11px] text-slate-800 dark:text-zinc-400 font-black uppercase tracking-tight mt-2 ml-14">Giao dịch vé: #{selectedRefund.ticket_id.slice(0, 12).toUpperCase()}</p>
                        </div>

                        <div className="p-10 space-y-8">
                            {/* Summary */}
                            <div className="p-6 bg-slate-50/80 dark:bg-zinc-900/80 rounded-[2rem] border border-gray-200 dark:border-zinc-800">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] text-slate-700 font-black uppercase tracking-tight">Số tiền hoàn trả</span>
                                        <span className="font-black text-orange-600 text-3xl tracking-tight">{formatCurrency(selectedRefund.refund_amount)}</span>
                                    </div>
                                    <div className="pt-4 border-t border-gray-200 dark:border-zinc-800 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-800 flex items-center justify-center border border-gray-200 dark:border-zinc-700">
                                                <Wallet className="w-4 h-4 text-orange-500" />
                                            </div>
                                            <div>
                                                <span className="text-[9px] text-slate-800 font-black uppercase tracking-tight block">Phương thức</span>
                                                <span className="text-[11px] font-black text-gray-900 dark:text-white uppercase">Cộng vào số dư ví</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[9px] text-slate-800 font-black uppercase tracking-tight block">Ví người nhận</span>
                                            <span className="text-[11px] font-black text-gray-900 dark:text-white italic">#{selectedRefund.customer_id.slice(0, 8)}...</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-800 dark:text-zinc-500 uppercase tracking-tight flex items-center gap-2 ml-1">
                                    <FileText className="w-4 h-4 text-orange-500/60" /> Phản hồi cho khách hàng
                                </label>
                                <textarea 
                                    value={adminNote}
                                    onChange={(e) => setAdminNote(e.target.value)}
                                    className="w-full bg-white dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-800 rounded-[1.5rem] p-5 text-sm font-bold focus:outline-none focus:border-orange-500 transition-all dark:text-white placeholder-slate-400 dark:placeholder-zinc-600 shadow-sm resize-none"
                                    placeholder="Nhập lý do duyệt hoặc từ chối..."
                                    rows="3"
                                />
                            </div>
                        </div>

                        <div className="p-10 bg-slate-50/90 dark:bg-zinc-900/90 border-t border-gray-100 dark:border-zinc-800/80 flex items-center gap-4">
                            <button 
                                onClick={() => setSelectedRefund(null)}
                                className="px-8 py-4 text-[11px] font-black uppercase tracking-tight text-slate-700 hover:text-gray-900 dark:hover:text-white bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-2xl transition-all shadow-sm active:scale-95"
                            >
                                ĐÓNG
                            </button>
                            
                            <div className="flex gap-4 ml-auto">
                                <button 
                                    disabled={isProcessing}
                                    onClick={() => handleProcess(selectedRefund.id, 'reject')}
                                    className="px-8 py-4 bg-red-500/10 text-red-600 border border-red-500/20 text-[11px] font-black uppercase tracking-tight rounded-2xl hover:bg-red-600 hover:text-white transition-all active:scale-95 disabled:opacity-50"
                                >
                                    TỪ CHỐI
                                </button>
                                <button 
                                    disabled={isProcessing}
                                    onClick={() => handleProcess(selectedRefund.id, 'approve')}
                                    className="px-10 py-4 bg-orange-600 text-white text-[11px] font-black uppercase tracking-tight rounded-2xl hover:bg-orange-700 transition-all shadow-xl shadow-orange-600/20 active:scale-95 disabled:opacity-50 flex items-center gap-2"
                                >
                                    {isProcessing ? 'ĐANG XỬ LÝ...' : 'DUYỆT HOÀN TIỀN'}
                                    <ArrowUpRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminRefundManagement;

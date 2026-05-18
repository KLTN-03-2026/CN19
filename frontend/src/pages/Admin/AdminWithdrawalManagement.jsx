import React, { useState, useEffect } from 'react';
import { 
  Banknote, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Eye, 
  ExternalLink,
  ChevronRight,
  ArrowRightLeft,
  ShieldCheck,
  AlertCircle,
  RefreshCcw,
  FileText,
  TrendingUp,
  User,
  ArrowUpRight,
  Wallet
} from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

const AdminWithdrawalManagement = () => {
    const [withdrawals, setWithdrawals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('pending'); // 'all', 'pending', 'approved', 'rejected'
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [adminNote, setAdminNote] = useState('');
    const [qrData, setQrData] = useState(null);
    const [isGeneratingQR, setIsGeneratingQR] = useState(false);

    const fetchWithdrawals = async () => {
        try {
            setLoading(true);
            const res = await api.get('/admin/withdrawals');
            setWithdrawals(res.data.data);
        } catch (error) {
            toast.error('Không thể tải danh sách yêu cầu rút tiền');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWithdrawals();
    }, []);

    // Tự động kiểm tra trạng thái mỗi 3 giây khi đang mở modal đơn chờ
    useEffect(() => {
        let interval;
        if (selectedRequest && selectedRequest.status === 'pending') {
            interval = setInterval(async () => {
                try {
                    const res = await api.get('/admin/withdrawals');
                    const updatedList = res.data.data;
                    setWithdrawals(updatedList);
                    
                    // Tìm xem đơn hiện tại đã được duyệt chưa (qua Webhook payOS)
                    const currentReq = updatedList.find(w => w.id === selectedRequest.id);
                    if (currentReq && currentReq.status === 'approved') {
                        toast.success('Tuyệt vời! Hệ thống đã tự động nhận tiền và duyệt đơn!');
                        setSelectedRequest(null);
                        setQrData(null);
                    }
                } catch (error) {
                    // Ignore errors during background polling
                }
            }, 3000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [selectedRequest]);

    const handleProcess = async (id, action) => {
        try {
            setIsProcessing(true);
            await api.post(`/admin/withdrawals/${id}/process`, {
                action,
                admin_notes: adminNote
            });
            toast.success(action === 'approve' ? 'Đã duyệt yêu cầu rút tiền' : 'Đã từ chối yêu cầu');
            setSelectedRequest(null);
            setAdminNote('');
            setQrData(null);
            fetchWithdrawals();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Lỗi xử lý');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleGenerateQR = async (id) => {
        try {
            setIsGeneratingQR(true);
            const res = await api.get(`/admin/withdrawals/${id}/qr`);
            setQrData(res.data.data);
            toast.success('Đã sinh mã VietQR');
        } catch (error) {
            toast.error('Không thể tạo mã QR');
        } finally {
            setIsGeneratingQR(false);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'approved':
                return <span className="px-3 py-1.5 bg-neon-green/10 text-neon-green rounded-xl text-[10px] font-black uppercase tracking-tight flex items-center gap-1.5 w-fit"><CheckCircle2 className="w-3 h-3" /> Đã duyệt</span>;
            case 'pending':
                return <span className="px-3 py-1.5 bg-yellow-500/10 text-yellow-500 rounded-xl text-[10px] font-black uppercase tracking-tight flex items-center gap-1.5 w-fit"><Clock className="w-3 h-3" /> Đang chờ</span>;
            case 'rejected':
                return <span className="px-3 py-1.5 bg-red-500/10 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-tight flex items-center gap-1.5 w-fit"><XCircle className="w-3 h-3" /> Đã từ chối</span>;
            default:
                return <span className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-xl text-[10px] font-black uppercase tracking-tight w-fit">{status}</span>;
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
    };

    const stats = {
        pendingCount: withdrawals.filter(w => w.status === 'pending').length,
        pendingAmount: withdrawals.filter(w => w.status === 'pending').reduce((sum, w) => sum + Number(w.amount), 0),
        approvedCount: withdrawals.filter(w => w.status === 'approved').length,
        approvedAmount: withdrawals.filter(w => w.status === 'approved').reduce((sum, w) => sum + Number(w.net_amount), 0),
        totalFees: withdrawals.filter(w => w.status === 'approved').reduce((sum, w) => sum + Number(w.fee_amount), 0),
    };

    const filteredWithdrawals = activeTab === 'all' 
        ? withdrawals 
        : withdrawals.filter(w => w.status === activeTab);

    return (
        <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0a0a0c] text-gray-900 dark:text-white transition-colors duration-300 font-sans">
            <div className="max-w-[1400px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 tracking-tight">
                
                {/* Header Section */}
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3 uppercase">
                                <Banknote className="w-6 h-6 text-neon-green" />
                                QUẢN LÝ RÚT TIỀN
                            </h1>
                            <p className="text-[11px] text-slate-800 dark:text-zinc-400 mt-1 font-bold uppercase tracking-tight">Duyệt yêu cầu rút tiền từ số dư ví của Khách hàng và Ban tổ chức</p>
                        </div>

                        <div className="flex items-center gap-3">
                            <button 
                                onClick={fetchWithdrawals}
                                className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800/80 hover:border-neon-green/50 transition-all text-slate-800 hover:text-neon-green shadow-sm active:scale-95"
                            >
                                <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

                        <div className="bg-white dark:bg-zinc-900/50 p-6 rounded-[2rem] border border-gray-200 dark:border-zinc-800/50 relative overflow-hidden group hover:border-neon-green/30 hover:shadow-xl transition-all cursor-pointer" onClick={() => setActiveTab('approved')}>
                            <div className="absolute -right-5 -top-5 text-neon-green/5 group-hover:text-neon-green/10 group-hover:scale-110 transition-all duration-700 pointer-events-none">
                                <CheckCircle2 className="w-32 h-32" />
                            </div>
                            <div className="relative">
                                <div className="text-[10px] font-black text-slate-800 dark:text-gray-400 uppercase tracking-tight flex items-center gap-2 mb-4">
                                    <span className="w-2 h-2 rounded-full bg-neon-green"></span>
                                    Đã giải ngân ({stats.approvedCount})
                                </div>
                                <div className="text-2xl font-black text-neon-green tracking-tight leading-none">
                                    {formatCurrency(stats.approvedAmount)}
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-zinc-900/50 p-6 rounded-[2rem] border border-gray-200 dark:border-zinc-800/50 relative overflow-hidden group hover:border-blue-500/30 hover:shadow-xl transition-all">
                            <div className="absolute -right-5 -top-5 text-blue-500/5 group-hover:text-blue-500/10 group-hover:scale-110 transition-all duration-700 pointer-events-none">
                                <TrendingUp className="w-32 h-32" />
                            </div>
                            <div className="relative">
                                <div className="text-[10px] font-black text-slate-800 dark:text-gray-400 uppercase tracking-tight flex items-center gap-2 mb-4">
                                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                    Tổng phí thu sàn
                                </div>
                                <div className="text-2xl font-black text-blue-600 dark:text-blue-400 tracking-tight leading-none">
                                    {formatCurrency(stats.totalFees)}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tabs Navigation */}
                    <div className="flex items-center gap-2 border-b border-gray-200 dark:border-zinc-800/50 pb-0.5 overflow-x-auto custom-scrollbar whitespace-nowrap">
                        {[
                            { id: 'pending', label: 'Yêu cầu mới', color: 'yellow-500' },
                            { id: 'approved', label: 'Đã hoàn tất', color: 'neon-green' },
                            { id: 'rejected', label: 'Đã từ chối', color: 'red-500' },
                            { id: 'all', label: 'Tất cả lịch sử', color: 'slate-500' }
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
                {loading && filteredWithdrawals.length === 0 ? (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        {[1, 2, 3, 4].map(i => <div key={i} className="h-48 bg-white dark:bg-zinc-900/50 rounded-[2rem] animate-pulse border border-gray-200 dark:border-zinc-800"></div>)}
                    </div>
                ) : filteredWithdrawals.length > 0 ? (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        {filteredWithdrawals.map((item) => (
                            <div key={item.id} className="bg-white dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-800/50 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl hover:border-neon-green/30 transition-all group flex flex-col min-h-[12rem]">
                                <div className="p-6 flex-1 flex flex-col">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 border border-gray-200 dark:border-zinc-700 group-hover:border-neon-green/30 transition-all">
                                                <User className="w-6 h-6 text-slate-800 dark:text-gray-400" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    {getStatusBadge(item.status)}
                                                    <span className="text-[10px] text-slate-800 dark:text-gray-500 font-black uppercase tracking-tight">
                                                        {format(new Date(item.created_at), 'dd/MM/yyyy HH:mm')}
                                                    </span>
                                                </div>
                                                <h3 className="text-sm font-black text-gray-900 dark:text-white tracking-tight line-clamp-1 uppercase">
                                                    {item.user?.full_name || 'Người dùng ẩn danh'}
                                                </h3>
                                                <div className="text-[10px] text-slate-800 dark:text-gray-400 font-black uppercase tracking-tight mt-0.5 flex items-center gap-2">
                                                    Email: {item.user?.email}
                                                    <span className={`px-2 py-0.5 rounded-md text-[9px] ${item.user?.role === 'organizer' ? 'bg-purple-500/10 text-purple-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                                        {item.user?.role === 'organizer' ? 'BAN TỔ CHỨC' : 'KHÁCH HÀNG'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-slate-800 dark:text-gray-500 uppercase mb-1">SỐ TIỀN RÚT</p>
                                            <p className={`text-xl font-black tracking-tight leading-none ${item.status === 'approved' ? 'text-neon-green' : 'text-gray-900 dark:text-white'}`}>
                                                {formatCurrency(item.amount)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50/80 dark:bg-zinc-950/80 rounded-[1.5rem] border border-gray-200 dark:border-zinc-800/80 mb-5 shadow-inner">
                                        <div className="space-y-1">
                                            <div className="text-[9px] font-black text-slate-800 dark:text-gray-400 uppercase tracking-tight">Thực nhận (NET)</div>
                                            <p className="text-[12px] font-black text-gray-900 dark:text-white tracking-tight leading-none">{formatCurrency(item.net_amount)}</p>
                                        </div>
                                        <div className="space-y-1 text-right">
                                            <div className="text-[9px] font-black text-red-500 dark:text-red-400 uppercase tracking-tight">Phí rút ({item.fee_percent ? `${Number(item.fee_percent)}%` : '2%'})</div>
                                            <p className="text-[12px] font-black text-red-600 dark:text-red-500 tracking-tight leading-none">-{formatCurrency(item.fee_amount)}</p>
                                        </div>
                                    </div>

                                    <div className="mt-auto flex items-center justify-between pt-1">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-slate-100 dark:bg-zinc-800 rounded-lg">
                                                <Wallet className="w-3.5 h-3.5 text-slate-800 dark:text-gray-400" />
                                            </div>
                                            <div className="text-[10px] font-black text-slate-800 dark:text-gray-400 uppercase">
                                                {item.bank_name} • STK: {item.account_number}
                                            </div>
                                        </div>

                                        {item.status === 'pending' ? (
                                            <button 
                                                onClick={() => setSelectedRequest(item)}
                                                className="px-6 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-black text-[10px] font-black uppercase rounded-xl hover:bg-neon-green hover:text-black dark:hover:bg-neon-green transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-zinc-900/10 dark:shadow-white/5"
                                            >
                                                XỬ LÝ NGAY
                                                <ChevronRight className="w-3 h-3" />
                                            </button>
                                        ) : (
                                            <div className="flex flex-col items-end gap-1">
                                                <div className="text-[10px] font-black text-slate-800 dark:text-gray-500 uppercase opacity-80 tracking-tight">
                                                    {item.status === 'success' || item.status === 'approved' ? 'COMPLETED' : 'REJECTED'}
                                                </div>
                                                {item.payout_trans_id && (
                                                    <a 
                                                        href={`https://amoy.polygonscan.com/tx/${item.payout_trans_id}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-[9px] font-black text-neon-green hover:underline flex items-center gap-1"
                                                    >
                                                        BLOCKCHAIN PROOF <ExternalLink className="w-2.5 h-2.5" />
                                                    </a>
                                                )}
                                                {item.bank_transaction_id && (
                                                    <div className="text-[9px] font-black text-slate-700 uppercase opacity-60">
                                                        BANK TID: {item.bank_transaction_id}
                                                    </div>
                                                )}
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
                        <p className="text-slate-800 dark:text-gray-500 text-[11px] mt-2 font-bold uppercase tracking-tight">Danh sách yêu cầu rút tiền đang trống ở trạng thái này</p>
                    </div>
                )}
            </div>

            {/* Modal Xử lý */}
            {selectedRequest && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/60 dark:bg-black/80 backdrop-blur-xl transition-all" onClick={() => { setSelectedRequest(null); setQrData(null); }}></div>
                    <div className="relative bg-white dark:bg-zinc-950 w-full max-w-xl rounded-[2.5rem] border border-gray-100 dark:border-zinc-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        
                        <div className="px-10 py-8 border-b border-gray-100 dark:border-zinc-800/50 bg-gray-50/50 dark:bg-zinc-900/30">
                             <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
                                  <div className="p-2 bg-neon-green/10 rounded-xl">
                                     <Banknote className="w-6 h-6 text-neon-green" />
                                  </div>
                                  XỬ LÝ RÚT TIỀN
                             </h2>
                             <p className="text-[11px] text-slate-800 dark:text-zinc-400 font-black uppercase tracking-tight mt-2 ml-14">ID: #{selectedRequest.id.slice(0, 8)}...</p>
                        </div>

                        <div className="p-10 space-y-8">
                            {/* Bank Details */}
                            <div className="p-6 bg-slate-50/80 dark:bg-zinc-900/80 rounded-[2rem] border border-gray-200 dark:border-zinc-800">
                                <div className="space-y-4">
                                    <div>
                                        <span className="text-[10px] text-slate-800 font-black uppercase tracking-tight block mb-1">Số tài khoản thụ hưởng</span>
                                        <span className="font-black text-gray-900 dark:text-white text-3xl tracking-tight select-all">{selectedRequest.account_number}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-zinc-800">
                                        <div>
                                            <span className="text-[10px] text-slate-800 font-black uppercase tracking-tight block mb-1">Chủ tài khoản</span>
                                            <span className="font-black text-gray-900 dark:text-white uppercase tracking-tight text-sm">{selectedRequest.account_holder}</span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-slate-800 font-black uppercase tracking-tight block mb-1">Ngân hàng</span>
                                            <span className="font-black text-gray-900 dark:text-zinc-300 tracking-tight uppercase text-sm">{selectedRequest.bank_name}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between px-2">
                                <div>
                                    <span className="text-[10px] text-slate-800 font-black uppercase tracking-tight block mb-1">Số tiền chuyển (NET)</span>
                                    <span className="font-black text-neon-green text-3xl tracking-tight">{formatCurrency(selectedRequest.net_amount)}</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] text-slate-800 font-black uppercase tracking-tight block mb-1">Phí hệ thống ({selectedRequest.fee_percent ? `${Number(selectedRequest.fee_percent)}%` : '2%'})</span>
                                    <span className="font-black text-red-500 text-lg tracking-tight">-{formatCurrency(selectedRequest.fee_amount)}</span>
                                </div>
                            </div>

                            {/* VietQR Section */}
                            {qrData ? (
                                <div className="p-6 bg-white dark:bg-zinc-900 rounded-[2rem] border-2 border-neon-green/30 flex flex-col items-center animate-in zoom-in-95 duration-500 shadow-xl shadow-neon-green/5">
                                    <p className="text-[10px] font-black uppercase text-neon-green mb-4 flex items-center gap-2">
                                        <ShieldCheck className="w-4 h-4" /> QUÉT MÃ ĐỂ CHUYỂN KHOẢN (VIETQR)
                                    </p>
                                    <div className="relative p-2 bg-white rounded-2xl">
                                        <img src={qrData.qrUrl} alt="VietQR" className="w-56 h-auto" />
                                        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-neon-green rounded-tl-xl"></div>
                                        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-neon-green rounded-tr-xl"></div>
                                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-neon-green rounded-bl-xl"></div>
                                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-neon-green rounded-br-xl"></div>
                                    </div>
                                    <div className="mt-4 text-center">
                                        <p className="text-[11px] font-black text-gray-900 dark:text-white uppercase tracking-tight">Nội dung chuyển khoản:</p>
                                        <p className="text-[13px] font-black text-neon-green mt-1 bg-neon-green/10 px-4 py-1 rounded-lg select-all">
                                            {qrData.bankInfo.reference.split('-')[0]}
                                        </p>
                                        <p className="text-[9px] text-slate-700 font-bold uppercase mt-3">Hệ thống sẽ tự động xác nhận sau khi nhận được tiền</p>
                                    </div>
                                </div>
                            ) : (
                                <button 
                                    onClick={() => handleGenerateQR(selectedRequest.id)}
                                    disabled={isGeneratingQR}
                                    className="w-full py-6 border-2 border-dashed border-gray-200 dark:border-zinc-800 rounded-[2rem] hover:border-neon-green/50 hover:bg-neon-green/5 transition-all group flex flex-col items-center justify-center gap-3 active:scale-[0.98]"
                                >
                                    {isGeneratingQR ? (
                                        <RefreshCcw className="w-6 h-6 text-neon-green animate-spin" />
                                    ) : (
                                        <>
                                            <RefreshCcw className="w-6 h-6 text-gray-400 group-hover:text-neon-green transition-colors" />
                                            <span className="text-[10px] font-black uppercase text-gray-500 group-hover:text-neon-green transition-colors tracking-widest">Bấm để sinh mã VietQR thanh toán</span>
                                        </>
                                    )}
                                </button>
                            )}

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-800 dark:text-zinc-500 uppercase tracking-tight flex items-center gap-2 ml-1">
                                    <FileText className="w-4 h-4 text-neon-green/60" /> Ghi chú cho người dùng
                                </label>
                                <textarea 
                                    value={adminNote}
                                    onChange={(e) => setAdminNote(e.target.value)}
                                    className="w-full bg-white dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-800 rounded-[1.5rem] p-5 text-sm font-bold focus:outline-none focus:border-neon-green transition-all dark:text-white placeholder-slate-400 dark:placeholder-zinc-600 shadow-sm resize-none"
                                    placeholder="Nhập ghi chú xử lý (nếu có)..."
                                    rows="3"
                                />
                            </div>
                        </div>

                        <div className="p-10 bg-slate-50/90 dark:bg-zinc-900/90 border-t border-gray-100 dark:border-zinc-800/80 flex items-center gap-4">
                            <button 
                                onClick={() => setSelectedRequest(null)}
                                className="px-10 py-4 text-[11px] font-black uppercase tracking-tight text-slate-800 hover:text-gray-900 dark:hover:text-white bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-2xl transition-all shadow-sm active:scale-95"
                            >
                                QUAY LẠI
                            </button>
                            
                            <div className="flex gap-4 ml-auto">
                                <button 
                                    disabled={isProcessing}
                                    onClick={() => handleProcess(selectedRequest.id, 'reject')}
                                    className="px-8 py-4 bg-red-500/10 text-red-600 border border-red-500/20 text-[11px] font-black uppercase tracking-tight rounded-2xl hover:bg-red-600 hover:text-white transition-all active:scale-95 disabled:opacity-50"
                                >
                                    TỪ CHỐI
                                </button>
                                <button 
                                    disabled={isProcessing}
                                    onClick={() => handleProcess(selectedRequest.id, 'approve')}
                                    className="px-10 py-4 bg-neon-green text-black text-[11px] font-black uppercase tracking-tight rounded-2xl hover:bg-neon-green/90 transition-all shadow-xl shadow-neon-green/20 active:scale-95 disabled:opacity-50 flex items-center gap-2"
                                >
                                    {isProcessing ? 'ĐANG XỬ LÝ...' : 'XÁC NHẬN ĐÃ CHUYỂN'}
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

export default AdminWithdrawalManagement;

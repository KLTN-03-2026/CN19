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
  FileText
} from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

const AdminSettlementManagement = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [adminNote, setAdminNote] = useState('');
    const [evidenceUrl, setEvidenceUrl] = useState('');

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/settlements/admin/requests${statusFilter !== 'all' ? `?status=${statusFilter}` : ''}`);
            setRequests(res.data.data);
        } catch (error) {
            toast.error('Không thể tải danh sách yêu cầu');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, [statusFilter]);

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
                return <span className="px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3" /> Đã trả tiền</span>;
            case 'pending':
                return <span className="px-3 py-1 bg-yellow-500/10 text-yellow-500 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5"><Clock className="w-3 h-3" /> Chờ duyệt</span>;
            case 'processing':
                return <span className="px-3 py-1 bg-blue-500/10 text-blue-500 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5"><ArrowRightLeft className="w-3 h-3" /> Đang chuyển</span>;
            case 'rejected':
                return <span className="px-3 py-1 bg-red-500/10 text-red-500 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5"><XCircle className="w-3 h-3" /> Từ chối</span>;
            default:
                return status;
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3 uppercase">
                        <CreditCard className="w-8 h-8 text-neon-green" />
                        Quản lý Quyết toán (Payouts)
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Phê duyệt và giải ngân doanh thu cho Ban tổ chức sau sự kiện.</p>
                </div>

                <div className="flex items-center gap-3">
                     <select 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-neon-green appearance-none pr-10 cursor-pointer font-bold"
                     >
                        <option value="all">Tất cả trạng thái</option>
                        <option value="pending">Chờ phê duyệt</option>
                        <option value="processing">Đang xử lý</option>
                        <option value="settled">Hoàn tất</option>
                     </select>
                     <button 
                        onClick={fetchRequests}
                        className="p-3 bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 hover:border-neon-green/50 transition-all text-gray-400 hover:text-neon-green"
                     >
                        <RefreshCcw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                     </button>
                </div>
            </div>

            {/* Main Table */}
            <div className="bg-white dark:bg-[#111114] rounded-3xl border border-gray-100 dark:border-white/5 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-50 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02]">
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Sự kiện / BTC</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Ngày yêu cầu</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Số tiền giải ngân</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Trạng thái</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 text-right">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                            {loading && requests.length === 0 ? (
                                [1, 2, 3].map(i => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="5" className="px-6 py-8"><div className="h-4 bg-gray-100 dark:bg-white/5 rounded-full w-3/4 mx-auto"></div></td>
                                    </tr>
                                ))
                            ) : requests.length > 0 ? (
                                requests.map((req) => (
                                    <tr key={req.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.01] transition-colors group">
                                        <td className="px-6 py-5">
                                            <div className="font-black text-gray-900 dark:text-white uppercase tracking-tight">{req.event.title}</div>
                                            <div className="text-[10px] text-neon-green font-bold uppercase tracking-widest mt-0.5">{req.event.organizer.organization_name}</div>
                                        </td>
                                        <td className="px-6 py-5 text-sm text-gray-500 dark:text-gray-400">
                                            {format(new Date(req.requested_at || req.created_at), 'dd/MM/yyyy HH:mm')}
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="font-black text-gray-900 dark:text-white tracking-tighter">{formatCurrency(req.net_payout)}</div>
                                            <div className="text-[10px] text-gray-400 font-medium">Đã khấu trừ phí sàn</div>
                                        </td>
                                        <td className="px-6 py-5">
                                            {getStatusBadge(req.status)}
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <button 
                                                onClick={() => setSelectedRequest(req)}
                                                className="p-2 bg-gray-100 dark:bg-white/5 rounded-xl text-gray-400 hover:text-neon-green transition-all"
                                            >
                                                <Eye className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3 opacity-20">
                                            <ShieldCheck className="w-16 h-16" />
                                            <p className="font-black uppercase tracking-widest text-xs">Không có dữ liệu quyết toán</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Detail Overlay / Modal (Custom) */}
            {selectedRequest && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedRequest(null)}></div>
                    <div className="relative bg-white dark:bg-[#0f0f11] w-full max-w-2xl rounded-[2.5rem] border border-gray-100 dark:border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        {/* Modal Header */}
                        <div className="px-10 py-8 border-b border-gray-50 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02]">
                             <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter flex items-center gap-3">
                                 <FileText className="w-6 h-6 text-neon-green" />
                                 Chi tiết yêu cầu giải ngân
                             </h2>
                             <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] mt-1">ID: {selectedRequest.id}</p>
                        </div>

                        {/* Modal Content */}
                        <div className="p-10 space-y-8 max-h-[70vh] overflow-y-auto">
                            <div className="grid grid-cols-2 gap-8 text-sm">
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Sự kiện</label>
                                        <div className="font-bold text-gray-900 dark:text-white uppercase">{selectedRequest.event.title}</div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Tổng doanh thu</label>
                                        <div className="font-black text-gray-900 dark:text-white text-lg">{formatCurrency(selectedRequest.total_revenue)}</div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Ban tổ chức</label>
                                        <div className="font-bold text-neon-green uppercase">{selectedRequest.event.organizer.organization_name}</div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Số tiền thực trả</label>
                                        <div className="font-black text-neon-green text-xl tracking-tighter">{formatCurrency(selectedRequest.net_payout)}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Bank Info Section */}
                            <div className="p-6 bg-gray-50 dark:bg-white/[0.03] rounded-3xl border border-gray-100 dark:border-white/5">
                                <h3 className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Banknote className="w-4 h-4 text-neon-green" />
                                    Thông tin chuyển khoản (BTC cung cấp)
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <span className="text-[10px] text-gray-400 uppercase block">Ngân hàng</span>
                                        <span className="font-bold text-gray-900 dark:text-white">{selectedRequest.bank_info?.bank_name || 'N/A'}</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-gray-400 uppercase block">Chủ tài khoản</span>
                                        <span className="font-bold text-gray-900 dark:text-white uppercase">{selectedRequest.bank_info?.account_holder || 'N/A'}</span>
                                    </div>
                                    <div className="col-span-2">
                                        <span className="text-[10px] text-gray-400 uppercase block">Số tài khoản</span>
                                        <span className="font-black text-gray-900 dark:text-white text-lg tracking-widest">{selectedRequest.bank_info?.account_number || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Processing Section */}
                            {selectedRequest.status !== 'settled' && (
                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Ghi chú xử lý (Nội bộ / BTC xem)</label>
                                        <textarea 
                                            value={adminNote}
                                            onChange={(e) => setAdminNote(e.target.value)}
                                            className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:border-neon-green transition-all dark:text-white"
                                            placeholder="Ghi chú về kỳ đối soát này..."
                                            rows="3"
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Link bằng chứng chuyển khoản (Tùy chọn)</label>
                                        <input 
                                            type="text"
                                            value={evidenceUrl}
                                            onChange={(e) => setEvidenceUrl(e.target.value)}
                                            className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-3 text-sm focus:outline-none focus:border-neon-green transition-all dark:text-white"
                                            placeholder="Link ảnh/PDF biên lai ngân hàng..."
                                        />
                                    </div>
                                </div>
                            )}

                            {selectedRequest.status === 'settled' && (
                                <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-2xl">
                                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                                    <div>
                                        <span className="text-xs font-bold text-green-500 uppercase">Giao dịch đã hoàn tất</span>
                                        <p className="text-[10px] text-gray-500 mt-0.5">Mã đối soát: {selectedRequest.payout_trans_id}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-10 bg-gray-50/50 dark:bg-white/[0.02] border-t border-gray-50 dark:border-white/5 flex gap-4">
                            <button 
                                onClick={() => setSelectedRequest(null)}
                                className="px-8 py-4 text-xs font-black uppercase text-gray-500 hover:text-gray-900 dark:hover:text-white transition-all flex item-center gap-2"
                            >
                                Đóng
                            </button>
                            
                            {selectedRequest.status !== 'settled' && selectedRequest.status !== 'rejected' && (
                                <>
                                    <button 
                                        onClick={() => handleProcess(selectedRequest.id, 'reject')}
                                        className="px-6 py-4 bg-red-500/10 text-red-500 text-xs font-black uppercase rounded-2xl hover:bg-red-500/20 transition-all ml-auto"
                                    >
                                        Từ chối
                                    </button>
                                    {selectedRequest.status === 'pending' && (
                                        <button 
                                            onClick={() => handleProcess(selectedRequest.id, 'approve')}
                                            className="px-6 py-4 bg-blue-500 text-white text-xs font-black uppercase rounded-2xl hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20"
                                        >
                                            Phê duyệt yêu cầu
                                        </button>
                                    )}
                                    {selectedRequest.status === 'processing' && (
                                        <button 
                                            onClick={() => handleProcess(selectedRequest.id, 'settle')}
                                            className="px-6 py-4 bg-neon-green text-black text-xs font-black uppercase rounded-2xl hover:bg-neon-green/90 transition-all shadow-lg shadow-neon-green/20"
                                        >
                                            Xác nhận Đã chuyển tiền
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminSettlementManagement;

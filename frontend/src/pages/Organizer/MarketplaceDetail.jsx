import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  User, 
  Ticket, 
  CreditCard, 
  Tag, 
  Clock, 
  Hash,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Wallet,
  ArrowLeftRight,
  ShoppingBag
} from 'lucide-react';
import api from '../../services/api';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

const MarketplaceDetail = () => {
    const { type, id } = useParams();
    const navigate = useNavigate();
    const [transaction, setTransaction] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchDetail = async () => {
        try {
            setIsLoading(true);
            // Sử dụng endpoint chi tiết đơn hàng chung để lấy đầy đủ thông tin
            const response = await api.get(`/organizer/orders/${id}`);
            
            if (response.data) {
                setTransaction(response.data);
            } else {
                toast.error('Không tìm thấy thông tin giao dịch.');
            }
        } catch (error) {
            console.error('Fetch detail error:', error);
            toast.error('Lỗi khi tải thông tin chi tiết.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchDetail();
    }, [id, type]);

    if (isLoading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
                <p className="text-gray-600 dark:text-gray-400 font-bold animate-pulse uppercase text-xs">Đang xác thực dữ liệu...</p>
            </div>
        );
    }

    if (!transaction) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
                <AlertCircle className="w-20 h-20 text-gray-200 dark:text-white/5 mb-6" />
                <h2 className="text-2xl font-black uppercase text-gray-600">Giao dịch không tồn tại</h2>
                <button 
                    onClick={() => navigate('/organizer/marketplace')}
                    className="mt-6 px-8 py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 uppercase text-xs"
                >
                    Quay lại Marketplace
                </button>
            </div>
        );
    }

    const isResale = type === 'resale';
    const sender = isResale ? transaction.seller : transaction.sender;
    const receiver = isResale ? transaction.buyer : transaction.receiver;

    return (
        <div className="min-h-screen pb-20 bg-white dark:bg-[#0a0a0c] text-gray-900 dark:text-white transition-colors duration-300">
            {/* Header Area */}
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate('/organizer/marketplace')}
                        className="p-3 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 rounded-2xl transition-all group shadow-sm"
                    >
                        <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-xl font-black uppercase leading-none">
                                {isResale ? 'Chi tiết Mua bán Marketplace' : 'Chi tiết Chuyển nhượng trực tiếp'}
                            </h1>
                            <span className={`px-3 py-1 text-white font-mono text-[10px] font-black rounded-lg shadow-lg ${isResale ? 'bg-purple-600 shadow-purple-600/20' : 'bg-blue-600 shadow-blue-600/20'}`}>
                                #{transaction.transaction_number || transaction.id.slice(0, 8).toUpperCase()}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                            <p className="text-gray-500 dark:text-gray-400 text-[11px] font-bold">
                                Khởi tạo lúc: {format(new Date(transaction.created_at), 'HH:mm - dd/MM/yyyy')}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Cột Trái: Thông tin chính (8 columns) */}
                <div className="lg:col-span-8 space-y-6">
                    
                    {/* User Transfer Map */}
                    <div className="bg-white dark:bg-[#111114] p-6 rounded-[2rem] border border-gray-200 dark:border-white/5 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-10 opacity-[0.03] dark:opacity-[0.05] pointer-events-none rotate-12">
                            <ArrowLeftRight className="w-64 h-64 text-blue-600" />
                        </div>

                        <div className="relative z-10">
                            <h3 className="text-[10px] font-black text-gray-500 mb-4 flex items-center gap-2 uppercase">
                                <ShieldCheck className="w-4 h-4 text-green-500" /> Luồng chuyển giao quyền sở hữu
                            </h3>

                            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                                {/* Sender/Seller */}
                                <div className="flex-1 w-full max-w-sm">
                                    <div className="p-4 bg-orange-500/5 dark:bg-orange-500/[0.03] rounded-[1.5rem] border border-orange-500/10 dark:border-orange-500/5 text-center relative group transition-all hover:scale-[1.02]">
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-[9px] font-black px-4 py-1 rounded-full uppercase">
                                            {isResale ? 'Bên bán' : 'Bên chuyển'}
                                        </div>
                                        <div className="w-16 h-16 bg-white dark:bg-zinc-900 rounded-2xl mx-auto mb-3 border-2 border-orange-500/20 overflow-hidden shadow-xl p-1">
                                            {sender?.avatar_url ? (
                                                <img src={sender.avatar_url} className="w-full h-full object-cover rounded-xl" alt="" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-orange-500/10">
                                                    <User className="w-8 h-8 text-orange-500" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="font-black text-gray-900 dark:text-white text-base leading-tight truncate px-2">{sender?.full_name}</div>
                                        <div className="text-[11px] text-gray-500 font-bold mt-0.5 truncate px-2">{sender?.email}</div>
                                    </div>
                                </div>

                                {/* Arrow Indicator */}
                                <div className="flex flex-col items-center gap-2 shrink-0">
                                    <div className="w-12 h-12 bg-white dark:bg-[#1a1a1e] rounded-full border border-gray-200 dark:border-white/10 flex items-center justify-center shadow-lg relative group overflow-hidden">
                                        <div className="absolute inset-0 bg-blue-600 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                                        <ArrowRight className="w-6 h-6 text-blue-600 group-hover:text-white relative z-10 transition-colors" />
                                    </div>
                                    <span className="text-[10px] font-black text-blue-600/50 uppercase">Confirmed</span>
                                </div>

                                {/* Receiver/Buyer */}
                                <div className="flex-1 w-full max-w-sm">
                                    <div className="p-4 bg-green-500/5 dark:bg-green-500/[0.03] rounded-[1.5rem] border border-green-500/10 dark:border-green-500/5 text-center relative group transition-all hover:scale-[1.02]">
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-white text-[9px] font-black px-4 py-1 rounded-full uppercase">
                                            {isResale ? 'Bên mua' : 'Bên nhận'}
                                        </div>
                                        <div className="w-16 h-16 bg-white dark:bg-zinc-900 rounded-2xl mx-auto mb-3 border-2 border-green-500/20 overflow-hidden shadow-xl p-1">
                                            {receiver?.avatar_url ? (
                                                <img src={receiver.avatar_url} className="w-full h-full object-cover rounded-xl" alt="" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-green-500/10">
                                                    <User className="w-8 h-8 text-green-500" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="font-black text-gray-900 dark:text-white text-base leading-tight truncate px-2">{receiver?.full_name}</div>
                                        <div className="text-[11px] text-gray-500 font-bold mt-0.5 truncate px-2">{receiver?.email}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Ticket Details Card */}
                    <div className="bg-white dark:bg-[#111114] rounded-[2rem] border border-gray-200 dark:border-white/5 shadow-sm overflow-hidden">
                        <div className="px-8 py-5 border-b border-gray-200 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.01] flex items-center justify-between">
                            <h3 className="text-[11px] font-black uppercase text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                <Ticket className="w-4 h-4 text-blue-600" /> Thông tin vé giao dịch
                            </h3>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase mb-1.5">Sự kiện liên quan</p>
                                        <p className="text-lg font-black text-gray-900 dark:text-white leading-tight">{transaction.event_title}</p>
                                    </div>
                                    <div className="flex gap-10">
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase mb-1.5 tracking-tighter">Hạng vé</p>
                                            <span className="px-3 py-1 bg-blue-600 text-white text-[11px] font-black uppercase rounded-lg shadow-lg shadow-blue-600/10">
                                                {transaction.tier_name}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase mb-1.5 tracking-tighter">Số hiệu vé</p>
                                            <p className="text-base font-black font-mono text-gray-900 dark:text-white">{transaction.ticket_number}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="p-5 bg-zinc-900 rounded-3xl border border-white/5">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center">
                                                    <Hash className="w-3.5 h-3.5 text-white" />
                                                </div>
                                                <span className="text-[9px] font-black text-zinc-400 uppercase">NFT Asset Hash</span>
                                            </div>
                                            <span className="text-[8px] font-black text-blue-500 uppercase bg-blue-500/10 px-2 py-0.5 rounded animate-pulse">On-Chain</span>
                                        </div>
                                        <p className="text-[10px] font-mono text-zinc-500 break-all bg-black/40 p-3 rounded-xl border border-white/5 leading-relaxed selection:bg-blue-600 selection:text-white">
                                            {transaction.nft_transfer_tx_hash || 'Đang cập nhật mã giao dịch từ mạng lưới blockchain...'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Merchandise Section - Full Width under the grid */}
                            {(transaction.merchandise_items?.length > 0 || transaction.listing?.merchandise_items?.length > 0) && (
                                <div className="mt-8 pt-8 border-t border-gray-100 dark:border-white/5">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-[11px] font-black uppercase text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                            <ShoppingBag className="w-4 h-4 text-emerald-600" />
                                            Sản phẩm kèm theo ({(transaction.merchandise_items || transaction.listing?.merchandise_items || []).length})
                                        </h3>
                                    </div>
                                    <div className="overflow-hidden rounded-2xl border border-gray-100 dark:border-white/5 bg-gray-50/30 dark:bg-white/[0.01]">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm text-left">
                                                <thead>
                                                    <tr className="text-[10px] font-black uppercase text-gray-500 bg-gray-50/50 dark:bg-white/[0.02]">
                                                        <th className="px-6 py-3 font-bold">Sản phẩm</th>
                                                        <th className="px-6 py-3 text-center font-bold">Số lượng</th>
                                                        <th className="px-6 py-3 text-right font-bold">Trạng thái</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                                    {(transaction.merchandise_items?.length > 0 || transaction.listing?.merchandise_items?.length > 0) ? (
                                                        (transaction.merchandise_items || transaction.listing?.merchandise_items || []).map((m, idx) => (
                                                            <tr key={m.id || `merch-${idx}`} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                                                                <td className="px-6 py-4">
                                                                    <div className="flex items-center gap-4">
                                                                        <div className="w-10 h-10 bg-white dark:bg-zinc-800 rounded-xl overflow-hidden flex items-center justify-center border border-gray-200 dark:border-white/5 shrink-0 shadow-sm">
                                                                            {(m.merchandise?.image_url || m.image_url) ? (
                                                                                <img src={m.merchandise?.image_url || m.image_url} className="w-full h-full object-cover" alt="" />
                                                                            ) : (
                                                                                <ShoppingBag className="w-5 h-5 text-gray-300" />
                                                                            )}
                                                                        </div>
                                                                        <div className="font-bold text-gray-900 dark:text-white leading-tight">{m.merchandise?.name || m.name || 'Sản phẩm'}</div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4 text-center">
                                                                    <span className="px-4 py-1 bg-emerald-500/10 text-emerald-600 rounded-lg font-bold text-xs">
                                                                        x{m.quantity}
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-4 text-right">
                                                                    <div className="flex flex-col items-end">
                                                                        <span className="text-[10px] font-bold text-blue-500 uppercase flex items-center gap-1">
                                                                            <ShieldCheck className="w-3 h-3" /> Đã chuyển giao
                                                                        </span>
                                                                        <span className="text-[9px] text-gray-400 mt-0.5 font-medium">Ghi nhận chủ sở hữu mới</span>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan="3" className="px-6 py-12 text-center">
                                                                <div className="flex flex-col items-center gap-2 opacity-40">
                                                                    <ShoppingBag className="w-8 h-8" />
                                                                    <p className="text-[10px] font-bold uppercase tracking-widest">Không có vật phẩm đi kèm giao dịch này</p>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Cột Phải: Thống kê & Phí (4 columns) */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Financial Breakdown Card */}
                    <div className="bg-slate-900 dark:bg-[#0d0d10] p-5 md:p-6 rounded-[2rem] border border-slate-800 dark:border-white/5 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-all pointer-events-none -mr-10 -mt-10">
                            <Wallet className="w-48 h-48 text-blue-500 rotate-12" />
                        </div>
                        
                        <h3 className="text-[10px] font-black uppercase text-slate-400 dark:text-gray-500 mb-4 relative z-10 flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-blue-400" /> Tài chính chi tiết
                        </h3>

                        <div className="space-y-4 relative z-10">
                            {isResale ? (
                                <>
                                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-white/5">
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 dark:text-gray-500 mb-1.5 uppercase">Giá bán thực tế</p>
                                            <p className="text-2xl md:text-3xl font-black text-white">{Number(transaction.resale_price).toLocaleString()}đ</p>
                                        </div>
                                        <div className="sm:text-right">
                                            <p className="text-[9px] font-black text-slate-400 dark:text-gray-500 mb-1.5 uppercase">Chênh lệch vé</p>
                                            <span className={`text-xs font-black px-2 py-0.5 rounded inline-block ${ (Number(transaction.resale_price) - Number(transaction.merchandise_total || 0)) > Number(transaction.original_price) ? 'bg-green-500 text-white' : 'bg-orange-500 text-white'}`}>
                                                { (Number(transaction.resale_price) - Number(transaction.merchandise_total || 0)) > Number(transaction.original_price) ? '+' : ''}
                                                {(Number(transaction.resale_price) - Number(transaction.merchandise_total || 0) - Number(transaction.original_price)).toLocaleString()}đ
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-3 py-6">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-slate-400 dark:text-gray-500 font-bold flex items-center gap-2">
                                                <CreditCard className="w-3.5 h-3.5" /> Phương thức thanh toán
                                            </span>
                                            <span className="text-white font-bold bg-blue-500/20 px-3 py-1 rounded-lg border border-blue-500/30 uppercase text-[10px]">
                                                {transaction.payment_method === 'VNPAY' ? 'VNPay' : transaction.payment_method === 'MOMO' ? 'MoMo' : (transaction.payment_method || 'VNPay')}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-slate-400 dark:text-gray-500 font-bold flex items-center gap-2">
                                                <Tag className="w-3.5 h-3.5" /> Giá vé (Người bán thiết lập)
                                            </span>
                                            <span className="text-slate-300 dark:text-gray-300 font-bold font-mono">
                                                {Number(transaction.original_ticket_price || transaction.original_price).toLocaleString()}đ
                                            </span>
                                        </div>
                                        {Number(transaction.merchandise_total) > 0 && (
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-slate-400 dark:text-gray-500 font-bold flex items-center gap-2">
                                                    <ShoppingBag className="w-3.5 h-3.5" /> Giá trị sản phẩm đi kèm
                                                </span>
                                                <span className="text-slate-300 dark:text-gray-300 font-bold font-mono">
                                                    {Number(transaction.merchandise_total).toLocaleString()}đ
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-slate-400 dark:text-gray-500 font-bold flex items-center gap-2">
                                                <ShieldCheck className="w-3.5 h-3.5" /> Phí nền tảng (Platform)
                                            </span>
                                            <span className="text-red-400 dark:text-red-500 font-bold font-mono">
                                                -{Number(transaction.platform_fee || Math.round(Number(transaction.resale_price) * 0.03)).toLocaleString()}đ
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs pt-3 border-t border-white/5">
                                            <span className="text-blue-400 font-black uppercase">Doanh thu BTC (Royalty)</span>
                                            <span className="text-green-400 dark:text-green-500 text-lg font-black">+{Number(transaction.royalty_amount).toLocaleString()}đ</span>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="pb-6 border-b border-white/5">
                                        <p className="text-[9px] font-black text-slate-400 dark:text-gray-500 mb-1.5 uppercase">Loại giao dịch</p>
                                        <p className="text-xl font-black text-white uppercase">Chuyển nhượng trực tiếp</p>
                                    </div>
                                    <div className="py-6 space-y-4">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-slate-400 dark:text-gray-500 font-bold">Phương thức thanh toán</span>
                                            <span className="text-white font-bold bg-blue-500/20 px-3 py-1 rounded-lg border border-blue-500/30 uppercase text-[10px]">
                                                {transaction.payment_method === 'VNPAY' ? 'VNPay' : transaction.payment_method === 'MOMO' ? 'MoMo' : (transaction.payment_method || 'VNPay')}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs pt-4 border-t border-white/5">
                                            <span className="text-blue-400 font-black uppercase">Phí hệ thống thu về</span>
                                            <span className="text-green-400 dark:text-green-500 text-2xl font-black">+{Number(transaction.fee_amount).toLocaleString()}đ</span>
                                        </div>
                                    </div>
                                </>
                            )}

                            <div className="pt-8 text-center border-t border-white/5">
                                {transaction.status === 'cancelled' ? (
                                    <div className="inline-flex items-center gap-2 px-6 py-2 bg-red-500/20 rounded-full border border-red-500/30">
                                        <AlertCircle className="w-4 h-4 text-red-400" />
                                        <span className="text-[10px] font-black text-red-400 uppercase">Giao dịch đã bị hủy do hủy sự kiện</span>
                                    </div>
                                ) : (
                                    <div className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600/20 rounded-full border border-blue-600/30">
                                        <ShieldCheck className="w-4 h-4 text-blue-400" />
                                        <span className="text-[10px] font-black text-blue-400 uppercase">Giao dịch đã tất toán</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Quick Help / Info */}
                    <div className="p-6 bg-blue-600/5 dark:bg-blue-600/[0.03] rounded-[2rem] border border-blue-600/10 dark:border-blue-600/5">
                        <h4 className="text-[10px] font-black uppercase text-blue-600 mb-3">Ghi chú vận hành</h4>
                        <ul className="space-y-2">
                            <li className="text-[10px] text-gray-500 font-medium leading-relaxed flex gap-2">
                                <span className="text-blue-600">•</span>
                                Tiền Royalty được cộng trực tiếp vào ví BTC sau khi giao dịch Marketplace hoàn tất.
                            </li>
                            <li className="text-[10px] text-gray-500 font-medium leading-relaxed flex gap-2">
                                <span className="text-blue-600">•</span>
                                Các giao dịch NFT được xác thực bởi Smart Contract trên mạng lưới Base Sepolia.
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MarketplaceDetail;

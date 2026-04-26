import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  Calendar, 
  User, 
  Ticket, 
  CreditCard, 
  ShoppingBag, 
  Tag, 
  CheckCircle2, 
  Clock, 
  Hash,
  AlertCircle,
  Download
} from 'lucide-react';
import api from '../../services/api';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

const OrderDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchOrderDetail = async () => {
        try {
            setIsLoading(true);
            const response = await api.get(`/organizer/orders/${id}`);
            setOrder(response.data);
            setIsLoading(false);
        } catch (error) {
            toast.error('Không thể tải chi tiết đơn hàng.');
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchOrderDetail();
    }, [id]);

    if (isLoading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
                <p className="text-gray-600 font-bold animate-pulse">Đang tải thông tin đơn hàng...</p>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
                <AlertCircle className="w-20 h-20 text-gray-200 dark:text-white/5 mb-6" />
                <h2 className="text-2xl font-black uppercase text-gray-600">Không tìm thấy đơn hàng</h2>
                <button 
                    onClick={() => navigate('/organizer/orders')}
                    className="mt-6 px-8 py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
                >
                    Quay lại danh sách
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-20">
            {/* Header Area */}
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate('/organizer/orders')}
                        className="p-3 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 rounded-xl transition-all group shadow-sm"
                    >
                        <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-xl font-black uppercase tracking-tight text-gray-900 dark:text-white leading-none">Chi tiết Đơn hàng</h1>
                            <span className="px-3 py-1 bg-blue-600 text-white font-mono text-[10px] font-black rounded-lg shadow-lg shadow-blue-600/20">
                                #{order.order_number}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                            <Calendar className="w-3 h-3 text-blue-500" />
                            <p className="text-gray-900 dark:text-white text-[11px] font-black uppercase tracking-tight">
                                {order.event?.title || 'Sự kiện chưa xác định'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Top Row: Overview Grid (3 Columns) */}
            {(() => {
                const ticketItems = (order.items || []).filter(i => i.ticket_tier_id);
                const ticketCommission = ticketItems.reduce((s, i) => s + Number(i.subtotal), 0) * 0.08;
                const gasFee = ticketItems.reduce((s, i) => s + i.quantity, 0) * 10000;
                const merchCommission = (order.merchandise_items || []).reduce((s, i) => s + Number(i.subtotal), 0) * 0.08;
                const totalFees = ticketCommission + gasFee + merchCommission;
                const netRevenue = Number(order.total_amount) - totalFees;

                return (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-4">
                        {/* Column 1: Customer Info */}
                        <div className="bg-white dark:bg-[#111114] p-6 rounded-[1.5rem] border border-gray-200 dark:border-white/5 shadow-sm flex flex-col h-full">
                            <h3 className="text-[10px] font-black uppercase text-gray-700 dark:text-gray-400 mb-5 flex items-center gap-2">
                                <User className="w-3.5 h-3.5 text-blue-500" /> Thông tin khách hàng
                            </h3>
                            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100 dark:border-white/5">
                                <div className="w-14 h-14 bg-blue-600/10 rounded-2xl border border-blue-600/10 overflow-hidden flex items-center justify-center shrink-0 shadow-inner">
                                    {order.customer?.avatar_url ? (
                                        <img src={order.customer.avatar_url} className="w-full h-full object-cover" alt="" />
                                    ) : (
                                        <User className="w-8 h-8 text-blue-600/30" />
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <div className="text-base font-black text-gray-900 dark:text-white truncate leading-tight">{order.customer?.full_name}</div>
                                    <div className="text-[11px] text-gray-600 dark:text-gray-400 font-bold mt-1 truncate">{order.customer?.email}</div>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-[10px]">
                                    <span className="text-gray-600 dark:text-gray-400 font-black uppercase tracking-tight">Số điện thoại</span>
                                    <span className="font-black text-blue-600 tracking-tight">{order.customer?.phone_number || '---'}</span>
                                </div>
                                <div className="flex justify-between items-center text-[10px]">
                                    <span className="text-gray-600 dark:text-gray-400 font-black uppercase tracking-tight">Mã định danh</span>
                                    <span className="font-mono text-gray-600 dark:text-gray-400 font-bold text-[10px]">#{order.customer?.id?.slice(0, 12)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Column 2: Financial Summary */}
                        <div className="bg-slate-900 dark:bg-[#09090b] p-6 rounded-[1.5rem] border border-slate-800 dark:border-white/5 shadow-xl relative overflow-hidden group h-full">
                            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                                <Tag className="w-32 h-32 scale-150 rotate-12 text-blue-500" />
                            </div>
                            <h3 className="text-[10px] font-black uppercase text-slate-400 dark:text-gray-500 mb-5 relative z-10 flex items-center gap-2">
                                <CreditCard className="w-3.5 h-3.5 text-blue-400" /> Tổng kết tài chính
                            </h3>
                            <div className="space-y-4 relative z-10">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 dark:text-gray-500 mb-1">Tổng tiền (Gross)</p>
                                        <p className="text-xl font-black text-white tracking-tighter">{Number(order.total_amount).toLocaleString()}đ</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[9px] font-black text-slate-400 dark:text-gray-500 mb-1 tracking-tight">Tổng khấu trừ</p>
                                        <p className="text-sm font-black text-red-400 dark:text-red-500">-{totalFees.toLocaleString()}đ</p>
                                    </div>
                                </div>

                                {/* Chi tiết các loại phí */}
                                <div className="space-y-2 py-3 border-y border-white/5 dark:border-white/5 mt-2">
                                    <div className="flex justify-between items-center text-[10px]">
                                        <span className="text-slate-400 dark:text-gray-500 font-bold tracking-tight">Phí dịch vụ vé (8%)</span>
                                        <span className="text-slate-200 dark:text-gray-300 font-bold font-mono">-{ticketCommission.toLocaleString()}đ</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[10px]">
                                        <span className="text-slate-400 dark:text-gray-500 font-bold tracking-tight">Phí hệ thống (Gas fee)</span>
                                        <span className="text-slate-200 dark:text-gray-300 font-bold font-mono">-{gasFee.toLocaleString()}đ</span>
                                    </div>
                                    {merchCommission > 0 && (
                                        <div className="flex justify-between items-center text-[10px]">
                                            <span className="text-slate-400 dark:text-gray-500 font-bold tracking-tight">Phí dịch vụ vật phẩm (8%)</span>
                                            <span className="text-slate-200 dark:text-gray-300 font-bold font-mono">-{merchCommission.toLocaleString()}đ</span>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-2 bg-blue-500/10 -mx-6 px-6 py-3 -mb-6 border-t border-white/5">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="text-[10px] font-black text-blue-400 mb-1">Thực nhận về ví (BTC)</p>
                                            <p className="text-xl font-black text-green-400 dark:text-green-500 tracking-tighter">{netRevenue.toLocaleString()}đ</p>
                                        </div>
                                        <div className="w-8 h-8 bg-blue-500/20 rounded-xl flex items-center justify-center border border-blue-500/30">
                                            <CheckCircle2 className="w-4 h-4 text-blue-400" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Column 3: Order Info */}
                        <div className="bg-white dark:bg-[#111114] p-6 rounded-[1.5rem] border border-gray-200 dark:border-white/5 shadow-sm h-full">
                            <h3 className="text-[10px] font-black uppercase text-gray-600 dark:text-gray-400 mb-5 flex items-center gap-2">
                                <Hash className="w-3.5 h-3.5 text-emerald-500" /> Thông tin giao dịch
                            </h3>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-[10px] font-black text-gray-700 dark:text-gray-400 mb-1">Ngày đặt hàng</p>
                                    <p className="text-xs font-black text-gray-800 dark:text-white tracking-tight">
                                        {format(new Date(order.created_at), 'HH:mm - dd/MM/yyyy')}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-700 dark:text-gray-400 mb-1">Trạng thái đơn</p>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter ${
                                        order.status === 'paid' ? 'bg-green-500/10 text-green-500' : 
                                        (order.status === 'cancelled' || order.status === 'canceled') ? 'bg-red-500/10 text-red-500' :
                                        'bg-orange-500/10 text-orange-500'
                                    }`}>
                                        {order.status === 'paid' ? 'Đã thanh toán' : 
                                         (order.status === 'cancelled' || order.status === 'canceled') ? 'Đã hủy' : 
                                         'Đang xử lý'}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-700 dark:text-gray-400 mb-1">Thanh toán qua</p>
                                    <p className="text-xs font-black text-blue-600 uppercase leading-none">
                                        {order.payment_method}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-700 dark:text-gray-400 mb-1">Phân loại</p>
                                    <p className="text-xs font-black text-gray-800 dark:text-white uppercase tracking-tight">
                                        {order.order_type === 'TICKET_TRANSFER' ? 'Vé chuyển nhượng' : 'Đơn hàng mới'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* Bottom Areas: Full Width Tables */}
            <div className="space-y-6">
                
                {/* Tickets Section */}
                <div className="bg-white dark:bg-[#111114] rounded-[1.5rem] border border-gray-200 dark:border-white/5 overflow-hidden shadow-sm">
                    <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.01] flex items-center justify-between">
                        <h3 className="text-[11px] font-black uppercase text-gray-700 dark:text-gray-300 flex items-center gap-2">
                            <Ticket className="w-4 h-4 text-blue-600" />
                            Danh sách Vé ({order.tickets?.length || 0})
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead>
                                <tr className="text-[10px] font-black uppercase text-gray-600 dark:text-gray-400 border-b border-gray-100 dark:border-white/5">
                                    <th className="px-6 py-4">Mã số vé</th>
                                    <th className="px-6 py-4">Hạng vé</th>
                                    <th className="px-6 py-4 text-center">Giá vé</th>
                                    <th className="px-6 py-4 text-center">NFT Token ID</th>
                                    <th className="px-6 py-4 text-right">Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                {order.tickets?.map(ticket => (
                                    <tr key={ticket.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                                        <td className="px-6 py-4 font-mono font-bold text-blue-600 text-[13px]">{ticket.ticket_number}</td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-[11px] text-gray-800 dark:text-white leading-none">{ticket.ticket_tier?.tier_name}</div>
                                            <div className="text-[9px] text-gray-500 mt-1.5 italic font-medium">Bảo mật bởi Blockchain</div>
                                        </td>
                                        <td className="px-6 py-4 text-center font-black text-gray-700 dark:text-gray-300">
                                            {(() => {
                                                const item = order.items?.find(i => i.ticket_tier_id === ticket.ticket_tier_id);
                                                return Number(item?.unit_price || ticket.ticket_tier?.price || 0).toLocaleString();
                                            })()}đ
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="px-3 py-1 bg-gray-100 dark:bg-zinc-800 rounded-lg font-mono text-[11px] font-bold text-gray-700 dark:text-gray-300">
                                                #{ticket.nft_token_id || 'N/A'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-tighter ${
                                                ticket.status === 'used' ? 'bg-gray-100 text-gray-500' : 'bg-green-500/10 text-green-600 border border-green-500/20'
                                            }`}>
                                                {ticket.status === 'used' ? 'Đã sử dụng' : 'Khả dụng'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Merchandise Section */}
                {order.merchandise_items?.length > 0 && (
                    <div className="bg-white dark:bg-[#111114] rounded-[1.5rem] border border-gray-200 dark:border-white/5 overflow-hidden shadow-sm">
                        <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.01]">
                            <h3 className="text-[11px] font-black uppercase text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                <ShoppingBag className="w-4 h-4 text-emerald-600" />
                                Vật phẩm đi kèm ({order.merchandise_items.length})
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead>
                                    <tr className="text-[10px] font-black uppercase text-gray-500 border-b border-gray-100 dark:border-white/5">
                                        <th className="px-6 py-4">Sản phẩm</th>
                                        <th className="px-6 py-4 text-center">Số lượng</th>
                                        <th className="px-6 py-4 text-right">Đơn giá</th>
                                        <th className="px-6 py-4 text-right">Thành tiền</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                    {order.merchandise_items.map(m => (
                                        <tr key={m.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-gray-100 dark:bg-white/5 rounded-lg overflow-hidden flex items-center justify-center border border-gray-200 dark:border-white/5 shrink-0">
                                                        {m.merchandise?.image_url ? (
                                                            <img src={m.merchandise.image_url} className="w-full h-full object-cover" alt="" />
                                                        ) : (
                                                            <ShoppingBag className="w-4 h-4 text-gray-400" />
                                                        )}
                                                    </div>
                                                    <div className="font-bold text-gray-800 dark:text-white">{m.merchandise?.name}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center font-black text-blue-600">{m.quantity}</td>
                                            <td className="px-6 py-4 text-right font-bold text-gray-600">{Number(m.unit_price).toLocaleString()}đ</td>
                                            <td className="px-6 py-4 text-right font-black text-gray-900 dark:text-white">{Number(m.subtotal).toLocaleString()}đ</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrderDetail;

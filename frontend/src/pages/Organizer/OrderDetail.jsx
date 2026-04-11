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
  AlertCircle
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

    const getStatusStyle = (status) => {
        switch (status) {
            case 'paid': return 'bg-green-500/10 text-green-500';
            case 'pending': return 'bg-yellow-500/10 text-yellow-500';
            case 'cancelled': return 'bg-red-500/10 text-red-500';
            default: return 'bg-white/5 text-gray-400';
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
                <p className="text-gray-400 font-bold animate-pulse">Đang tải thông tin đơn hàng...</p>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
                <AlertCircle className="w-20 h-20 text-gray-200 dark:text-white/5 mb-6" />
                <h2 className="text-2xl font-black uppercase text-gray-400">Không tìm thấy đơn hàng</h2>
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
            {/* Header & Back Button */}
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                    <button 
                        onClick={() => navigate('/organizer/orders')}
                        className="p-4 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-2xl transition-all group"
                    >
                        <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-xl font-black uppercase tracking-tight">Chi tiết Đơn hàng</h1>
                            <span className="px-4 py-1 bg-blue-600/10 text-blue-600 font-mono text-l font-black rounded-xl">
                                #{order.order_number}
                            </span>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 font-medium">
                            Xem thông tin chi tiết về vé, sản phẩm và giao dịch.
                        </p>
                    </div>
                </div>
                
                <div className={`px-6 py-2 rounded-2xl font-black uppercase text-xs  border border-current/10 ${getStatusStyle(order.status)}`}>
                    {order.status === 'paid' ? 'Đã thanh toán' : 
                     order.status === 'pending' ? 'Chờ xử lý' : 
                     order.status === 'cancelled' ? 'Đã hủy' : order.status}
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left Column: Infos */}
                <div className="lg:col-span-2 space-y-8">
                    
                    {/* Items Section (Tickets & Merchandise Combined if needed, or separate) */}
                    <div className="bg-white dark:bg-[#111114] rounded-[2.5rem] border border-gray-100 dark:border-white/5 overflow-hidden shadow-sm">
                        <div className="px-8 py-5 border-b border-gray-50 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.01]">
                            <h3 className="text-sm font-black uppercase text-gray-400 flex items-center gap-2">
                                <Ticket className="w-4 h-4" />
                                Danh sách Vé ({order.tickets?.length || 0})
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead>
                                    <tr className="text-[10px] font-black uppercase text-gray-400 border-b border-gray-50 dark:border-white/5">
                                        <th className="px-8 py-5">Mã số vé</th>
                                        <th className="px-8 py-5">Hạng vé</th>
                                        <th className="px-8 py-5 text-center">NFT Token ID</th>
                                        <th className="px-8 py-5 text-right">Trạng thái</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                                    {order.tickets?.map(ticket => (
                                        <tr key={ticket.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                                            <td className="px-8 py-6 font-mono font-bold text-blue-600">{ticket.ticket_number}</td>
                                            <td className="px-8 py-6">
                                                <div className="font-bold text-gray-900 dark:text-white">{ticket.ticket_tier?.tier_name}</div>
                                                <div className="text-[10px] text-gray-500 mt-0.5 italic">Vé điện tử Blockchain</div>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <span className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg font-mono text-xs font-bold text-gray-500">
                                                    {ticket.nft_token_id || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <span className="text-[10px] font-black px-3 py-1 bg-green-500/10 text-green-500 rounded-full uppercase tracking-tighter">
                                                    {ticket.status}
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
                        <div className="bg-white dark:bg-[#111114] rounded-[2.5rem] border border-gray-100 dark:border-white/5 overflow-hidden shadow-sm">
                            <div className="px-8 py-5  border-b border-gray-50 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.01]">
                                <h3 className="text-sm font-black uppercase  text-gray-400 flex items-center gap-2">
                                    <ShoppingBag className="w-4 h-4" />
                                    Vật phẩm đi kèm ({order.merchandise_items.length})
                                </h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead>
                                        <tr className="text-[10px] font-black uppercase text-gray-400 border-b border-gray-50 dark:border-white/5">
                                            <th className="px-8 py-5">Ảnh</th>
                                            <th className="px-8 py-5">Tên sản phẩm</th>
                                            <th className="px-8 py-5 text-center">Số lượng</th>
                                            <th className="px-8 py-5 text-right">Đơn giá</th>
                                            <th className="px-8 py-5 text-right">Thành tiền</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                                        {order.merchandise_items.map(m => (
                                            <tr key={m.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                                                <td className="px-8 py-4">
                                                    <div className="w-12 h-12 bg-gray-100 dark:bg-white/5 rounded-xl overflow-hidden flex items-center justify-center border border-gray-100 dark:border-white/5">
                                                        {m.merchandise?.image_url ? (
                                                            <img src={m.merchandise.image_url} className="w-full h-full object-cover" alt="" />
                                                        ) : (
                                                            <ShoppingBag className="w-5 h-5 text-gray-400" />
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 font-bold">{m.merchandise?.name}</td>
                                                <td className="px-8 py-6 text-center font-black text-blue-600">{m.quantity}</td>
                                                <td className="px-8 py-6 text-right font-black">{Number(m.unit_price).toLocaleString()}đ</td>
                                                <td className="px-8 py-6 text-right font-black text-gray-900 dark:text-white">{Number(m.subtotal).toLocaleString()}đ</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Summaries */}
                <div className="space-y-8">
                    
                    {/* Customer Info Card */}
                    <div className="bg-white dark:bg-[#111114] rounded-[2.5rem] border border-gray-100 dark:border-white/5 p-8 shadow-sm">
                        <h3 className="text-sm font-black uppercase text-gray-400 mb-6">Thông tin khách hàng</h3>
                        <div className="flex items-center gap-5 mb-4">
                            <div className="w-20 h-20 bg-blue-600/10 rounded-[3rem] border-4 border-white dark:border-zinc-900 shadow-xl overflow-hidden flex items-center justify-center">
                                {order.customer?.avatar_url ? (
                                    <img src={order.customer.avatar_url} className="w-full h-full object-cover" alt="" />
                                ) : (
                                    <User className="w-10 h-10 text-blue-600" />
                                )}
                            </div>
                            <div>
                                <div className="text-xl font-black">{order.customer?.full_name}</div>
                                <div className="text-sm text-gray-500 font-medium">{order.customer?.email}</div>
                            </div>
                        </div>
                        <div className="space-y-4 pt-6 border-t border-gray-50 dark:border-white/5">
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-400 font-bold">Số điện thoại</span>
                                <span className="text-sm font-black text-blue-600">{order.customer?.phone_number || 'Chưa cập nhật'}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-400 font-bold">Mã Khách hàng</span>
                                <span className="text-[10px] font-mono font-bold text-gray-500">#{order.customer?.id.slice(0, 13)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Order Summary & Payment */}
                    <div className="bg-zinc-900 rounded-[2.5rem] border border-white/5 p-8 text-white relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Tag className="w-40 h-40 scale-150 rotate-12 text-blue-500" />
                        </div>
                        <h3 className="text-sm font-black uppercase opacity-60 mb-6 relative z-10">Chi tiết Phí & Đối soát</h3>
                        
                        <div className="space-y-4 relative z-10">
                            {/* Order Metadata (Date & Payment) */}
                            <div className="grid grid-cols-2 gap-3 pb-4 border-b border-white/10">
                                <div>
                                    <div className="text-[9px] font-black uppercase opacity-40 mb-1 flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> Ngày giờ đặt
                                    </div>
                                    <div className="text-xs font-bold text-white tracking-tight">
                                        {format(new Date(order.created_at), 'HH:mm - dd/MM/yyyy')}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[9px] font-black uppercase opacity-40 mb-1 flex items-center gap-1 justify-end">
                                        <CreditCard className="w-3 h-3" /> Thanh toán
                                    </div>
                                    <div className="text-xs font-black text-blue-400 uppercase italic">
                                        {order.payment_method}
                                    </div>
                                </div>
                            </div>

                            {/* Customer Total Payment Highlight */}
                            <div className="pb-4 border-b border-white/10 mb-2">
                                <div className="text-[10px] font-black uppercase opacity-60 mb-1">Tổng tiền khách đã thanh toán</div>
                                <div className="text-2xl font-black text-white">
                                    {Number(order.total_amount).toLocaleString()}đ
                                </div>
                            </div>

                            {/* Fee Calculations */}
                            {(() => {
                                const ticketItems = (order.items || []).filter(i => i.ticket_tier_id);
                                const ticketCommission = ticketItems.reduce((s, i) => s + Number(i.subtotal), 0) * 0.08;
                                const gasFee = ticketItems.reduce((s, i) => s + i.quantity, 0) * 10000;
                                const merchCommission = (order.merchandise_items || []).reduce((s, i) => s + Number(i.subtotal), 0) * 0.08;
                                const totalCalculatedFee = ticketCommission + gasFee + merchCommission;

                                return (
                                    <>
                                        {ticketItems.length > 0 && (
                                            <div className="space-y-3 pb-2 border-b border-white/10">
                                                <div className="flex justify-between items-start text-xs">
                                                    <div className="flex flex-col">
                                                        <span className="opacity-60 font-bold uppercase">Phí vé (8%)</span>
                                                        <span className="text-[9px] opacity-40 italic mt-0.5">(Sàn 5% + Giao dịch 3%)</span>
                                                    </div>
                                                    <span className="font-bold text-red-300">-{Number(ticketCommission).toLocaleString()}đ</span>
                                                </div>
                                                <div className="flex justify-between items-center text-xs text-yellow-500/80">
                                                    <span className="opacity-80 uppercase font-black tracking-tighter text-[10px]">Phí Gas Blockchain</span>
                                                    <span className="font-bold">-{Number(gasFee).toLocaleString()}đ</span>
                                                </div>
                                            </div>
                                        )}

                                        {(order.merchandise_items || []).length > 0 && (
                                            <div className="space-y-3 pb-3 border-b border-white/10">
                                                <div className="flex justify-between items-start text-xs">
                                                    <div className="flex flex-col">
                                                        <span className="opacity-60 font-bold uppercase">Phí sản phẩm (8%)</span>
                                                        <span className="text-[9px] opacity-40 italic mt-0.5">(Sàn 5% + Giao dịch 3%)</span>
                                                    </div>
                                                    <span className="font-bold text-red-300">-{Number(merchCommission).toLocaleString()}đ</span>
                                                </div>
                                            </div>
                                        )}

                                        <div className="pt-2 flex justify-between items-center">
                                            <span className="text-[10px] opacity-60 font-black uppercase tracking-widest text-red-400">Tổng phí khấu trừ</span>
                                            <span className="text-sm font-black text-red-400">-{Number(totalCalculatedFee).toLocaleString()}đ</span>
                                        </div>

                                        <div className="pt-6 border-t border-white/10 mt-6 bg-blue-600/10 -mx-8 px-8 py-6 rounded-b-[2.5rem]">
                                            <div className="flex items-center gap-2 mb-2">
                                                <CreditCard className="w-4 h-4 text-blue-400" />
                                                <div className="text-[10px] font-black uppercase text-blue-400">Số dư thực nhận dự kiến</div>
                                            </div>
                                            <div className="text-xl font-black text-white tracking-tighter">
                                                {(Number(order.total_amount) - totalCalculatedFee).toLocaleString()}
                                                <span className="text-xl ml-1 text-blue-400">đ</span>
                                            </div>
                                            <div className="text-[10px] text-zinc-500 mt-3 italic flex items-center gap-1.5 font-medium">
                                                <Clock className="w-3 h-3 text-yellow-600" />
                                                Phát hành ví đối soát sau 3 ngày hoàn tất thanh toán
                                            </div>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default OrderDetail;

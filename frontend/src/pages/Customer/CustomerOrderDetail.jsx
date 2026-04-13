import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ChevronLeft, 
  Calendar, 
  Ticket, 
  ShoppingBag, 
  ArrowRight,
  MapPin,
  Clock,
  ExternalLink,
  Shield,
  Info,
  Mail
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const CustomerOrderDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { i18n } = useTranslation();
    const isVi = i18n.language.startsWith('vi');
    const [order, setOrder] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchOrderDetail = async () => {
            try {
                setIsLoading(true);
                const response = await api.get(`/orders/${id}`);
                setOrder(response.data.data);
            } catch (error) {
                toast.error(isVi ? 'Không thể tải chi tiết đơn hàng.' : 'Failed to load order details.');
                navigate('/my-transactions');
            } finally {
                setIsLoading(false);
            }
        };
        fetchOrderDetail();
    }, [id]);

    if (isLoading) {
        return (
            <div className="min-h-screen pt-40 flex flex-col items-center">
                <div className="w-12 h-12 border-4 border-neon-green/20 border-t-neon-green rounded-full animate-spin"></div>
                <p className="mt-4 text-gray-500 font-bold animate-pulse uppercase tracking-widest text-xs">
                    {isVi ? 'Đang giải mã dữ liệu NFT...' : 'Decrypting NFT data...'}
                </p>
            </div>
        );
    }

    if (!order) return null;

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-bg transition-colors duration-500 flex flex-col pt-10 pb-24 px-4 sm:px-8 relative">
            <div className="max-w-[1200px] mx-auto w-full space-y-8">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <button 
                            onClick={() => navigate('/my-transactions')}
                            className="p-4 bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border hover:border-neon-green/40 rounded-2xl transition-all group"
                        >
                            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        </button>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase leading-none">Chi tiết giao dịch</h1>
                                <span className="bg-neon-green/10 text-neon-green px-3 py-1 rounded-lg font-mono text-xs font-black border border-neon-green/20">
                                    #{order.order_number}
                                </span>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-1">
                                {isVi ? 'Thông tin chi tiết về vé và các sản phẩm đi kèm trong đơn hàng này.' : 'Details of tickets and add-on products in this order.'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Main Content Area */}
                    <div className="lg:col-span-2 space-y-8">
                        
                        {/* Transfer Information Section */}
                        {order.order_type === 'TICKET_TRANSFER' && order.metadata?.receiver_email && (
                            <div className="bg-white dark:bg-dark-card rounded-[2.5rem] p-8 border border-gray-200 dark:border-dark-border flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm overflow-hidden relative group">
                                <div className="absolute inset-0 bg-blue-600/5 -z-10 group-hover:bg-blue-600/10 transition-colors"></div>
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 bg-blue-600/10 text-blue-600 rounded-2xl flex items-center justify-center">
                                        <Mail className="w-8 h-8" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{isVi ? 'Thông tin người nhận' : 'Receiver Information'}</p>
                                        <h3 className="text-xl font-black text-gray-900 dark:text-white">{order.metadata.receiver_email}</h3>
                                        <p className="text-xs text-gray-400 font-medium italic">{isVi ? '* Vé sẽ được chuyển tự động sau khi thanh toán thành công.' : '* Ticket will be transferred automatically after successful payment.'}</p>
                                    </div>
                                </div>
                                <div className="px-6 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">
                                    {isVi ? 'Đang chờ chuyển' : 'Pending Transfer'}
                                </div>
                            </div>
                        )}

                        {/* Event Context Card */}
                        <div className="group bg-white dark:bg-dark-card rounded-[2.5rem] p-8 border border-gray-200 dark:border-dark-border overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-neon-green/5 blur-[80px] -z-10 group-hover:bg-neon-green/10 transition-colors"></div>
                            <div className="flex flex-col md:flex-row gap-8">
                                <div className="w-full md:w-32 h-32 rounded-3xl overflow-hidden flex-shrink-0 border border-gray-200 dark:border-dark-border">
                                    <img src={order.event.image_url} className="w-full h-full object-cover" alt="" />
                                </div>
                                <div className="space-y-4">
                                    <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">{order.event.title}</h2>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-xs text-gray-500 font-bold uppercase tracking-widest">
                                            <Calendar className="w-3.5 h-3.5 text-neon-green" />
                                            {new Date(order.event.event_date).toLocaleDateString('vi-VN')}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-gray-500 font-bold uppercase tracking-widest">
                                            <MapPin className="w-3.5 h-3.5 text-neon-green" />
                                            {order.event.location_address}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tickets Section */}
                        {order.order_type !== 'TICKET_TRANSFER' && (
                            <div className="bg-white dark:bg-dark-card rounded-[2.5rem] border border-gray-200 dark:border-dark-border overflow-hidden">
                                <div className="px-8 py-5 border-b border-gray-100 dark:border-dark-border flex justify-between items-center">
                                    <h3 className="text-xs font-black uppercase text-gray-400 tracking-widest flex items-center gap-2">
                                        <Ticket className="w-4 h-4 text-neon-green" />
                                        {isVi ? 'Sở hữu Vé' : 'Ticket Ownership'} ({order.items.length})
                                    </h3>
                                </div>
                                <div className="divide-y divide-gray-100 dark:divide-dark-border">
                                    {order.items.map((item, idx) => (
                                        <div key={idx} className="p-8 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/[0.01] transition-colors">
                                            <div className="flex items-center gap-6">
                                                <div className="w-12 h-12 bg-neon-green/10 text-neon-green rounded-2xl flex items-center justify-center font-black">
                                                    {item.quantity}
                                                </div>
                                                <div>
                                                    <div className="text-base font-black text-gray-900 dark:text-white uppercase tracking-tight">{item.ticket_tier.tier_name}</div>
                                                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{isVi ? 'Hạng vé chính thức' : 'Official Tier'}</div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-black text-gray-900 dark:text-white">{formatCurrency(item.subtotal)}</div>
                                                <div className="text-[10px] text-gray-400 mt-0.5 uppercase font-bold">{formatCurrency(item.unit_price)} / vé</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Merchandise Section */}
                        {order.merchandise_items && order.merchandise_items.length > 0 && (
                            <div className="bg-white dark:bg-dark-card rounded-[2.5rem] border border-gray-200 dark:border-dark-border overflow-hidden">
                                <div className="px-8 py-5 border-b border-gray-100 dark:border-dark-border">
                                    <h3 className="text-xs font-black uppercase text-gray-400 tracking-widest flex items-center gap-2">
                                        <ShoppingBag className="w-4 h-4 text-neon-green" />
                                        {isVi ? 'Sản phẩm đi kèm' : 'Add-ons'} ({order.merchandise_items.length})
                                    </h3>
                                </div>
                                <div className="divide-y divide-gray-100 dark:divide-dark-border">
                                    {order.merchandise_items.map((m, idx) => (
                                        <div key={idx} className="p-8 flex items-center gap-6 hover:bg-gray-50 dark:hover:bg-white/[0.01] transition-colors">
                                            <div className="w-20 h-20 bg-gray-100 dark:bg-white/5 rounded-2xl overflow-hidden flex-shrink-0 border border-gray-100 dark:border-dark-border">
                                                <img src={m.merchandise.image_url} className="w-full h-full object-cover" alt="" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-base font-black text-gray-900 dark:text-white uppercase tracking-tight">{m.merchandise.name}</div>
                                                <div className="text-xs text-neon-green font-bold uppercase mt-0.5">x{m.quantity}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-black text-gray-900 dark:text-white">{formatCurrency(m.subtotal)}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Order Summary Sidebar */}
                    <div className="space-y-8">
                        <div className="bg-white dark:bg-dark-card rounded-[2.5rem] border border-gray-200 dark:border-dark-border p-8 shadow-sm space-y-6">
                            <h3 className="text-xs font-black uppercase text-gray-400 tracking-widest border-b border-gray-100 dark:border-dark-border pb-4">{isVi ? 'Tổng thanh toán' : 'Payment Summary'}</h3>
                            
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-sm font-medium">
                                    <span className="text-gray-500">{isVi ? 'Tạm tính' : 'Subtotal'}</span>
                                    <span className="text-gray-900 dark:text-white">{formatCurrency(order.subtotal)}</span>
                                </div>
                                {order.discount_amount > 0 && (
                                    <div className="flex justify-between items-center text-sm font-medium text-red-500 font-black">
                                        <span>{isVi ? 'Giảm giá' : 'Discount'}</span>
                                        <span>-{formatCurrency(order.discount_amount)}</span>
                                    </div>
                                )}
                                <div className="pt-4 border-t border-gray-100 dark:border-dark-border flex justify-between items-center">
                                    <span className="text-base font-black text-gray-900 dark:text-white uppercase tracking-tighter">{isVi ? 'Thành tiền' : 'Grand Total'}</span>
                                    <span className="text-2xl font-black text-neon-green">{formatCurrency(order.total_amount)}</span>
                                </div>
                            </div>

                            <div className="pt-6">
                                <Link 
                                    to="/my-tickets"
                                    className="w-full bg-neon-green text-black py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-neon-hover transition-all shadow-xl shadow-neon-green/20"
                                >
                                    <Ticket className="w-4 h-4" />
                                    {isVi ? 'Quản lý vé' : 'Manage Tickets'}
                                </Link>
                            </div>
                        </div>

                        {/* Order Meta Card */}
                        <div className="bg-zinc-900 p-8 rounded-[2.5rem] text-white space-y-6 relative overflow-hidden">
                             <Shield className="absolute top-0 right-0 w-32 h-32 text-neon-green opacity-5 -translate-y-10 translate-x-10" />
                             <div className="relative z-10 space-y-6">
                                <div>
                                    <div className="text-[10px] font-black uppercase opacity-40 mb-2 flex items-center gap-2 tracking-widest">
                                        <Clock className="w-3 h-3" /> {isVi ? 'Ngày giao dịch' : 'Order Time'}
                                    </div>
                                    <div className="text-sm font-bold uppercase tracking-tight">{new Date(order.created_at).toLocaleString('vi-VN')}</div>
                                </div>
                                <div>
                                    <div className="text-[10px] font-black uppercase opacity-40 mb-2 flex items-center gap-2 tracking-widest">
                                        <Shield className="w-3 h-3" /> {isVi ? 'Chứng thực NFT' : 'NFT Proof'}
                                    </div>
                                    <div className="text-[10px] font-mono font-medium opacity-60 break-all bg-white/5 p-3 rounded-xl border border-white/5">
                                        Verified by Proof-of-Ticket Protocols
                                    </div>
                                </div>
                             </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomerOrderDetail;

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
  Mail,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const CustomerOrderDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const [order, setOrder] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchOrderDetail = async () => {
            try {
                setIsLoading(true);
                const response = await api.get(`/orders/${id}`);
                setOrder(response.data.data);
            } catch (error) {
                toast.error(t('transactions.toast.error'));
                navigate('/my-transactions');
            } finally {
                setIsLoading(false);
            }
        };
        fetchOrderDetail();
    }, [id]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-neon-green/10 border-t-neon-green rounded-full animate-spin"></div>
                    <div className="absolute inset-0 bg-neon-green/20 blur-xl rounded-full"></div>
                </div>
                <p className="mt-8 text-gray-500 font-black animate-pulse uppercase tracking-[0.2em] text-[10px]">
                    {t('eventDetail.loading')}
                </p>
            </div>
        );
    }

    if (!order) return null;

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    const getStatusInfo = (status) => {
        const s = status?.toLowerCase();
        if (['paid', 'success', 'completed'].includes(s)) {
            return {
                label: t('transactions.status.success'),
                color: 'text-neon-green bg-neon-green/10 border-neon-green/20',
                icon: <CheckCircle2 className="w-4 h-4" />
            };
        }
        if (['cancelled', 'failed', 'expired'].includes(s)) {
            return {
                label: t('transactions.status.cancelled'),
                color: 'text-red-500 bg-red-500/10 border-red-500/20',
                icon: <XCircle className="w-4 h-4" />
            };
        }
        return {
            label: t('transactions.status.pending'),
            color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
            icon: <Clock className="w-4 h-4" />
        };
    };

    const statusInfo = getStatusInfo(order.status);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#050505] text-gray-900 dark:text-white transition-colors duration-500 pt-8 pb-6 overflow-x-hidden relative">
            {/* Background Decorations */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
                <div className="absolute top-[-10%] right-[-5%] w-[40rem] h-[40rem] bg-neon-green/5 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] left-[-5%] w-[30rem] h-[30rem] bg-blue-500/5 blur-[100px] rounded-full"></div>
            </div>

            <div className="max-w-[1200px] mx-auto px-4 md:px-8 space-y-4 animate-in fade-in slide-in-from-bottom-10 duration-1000">
                {/* Top Navigation & Status */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => navigate('/my-transactions')}
                            className="w-10 h-10 flex items-center justify-center bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/5 rounded-2xl hover:border-neon-green/40 hover:text-neon-green transition-all group"
                        >
                            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        </button>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-xl font-black">{t('transactions.detail.title')}</h1>
                                <div className={`flex items-center gap-2 px-2 py-0.5 rounded-full border text-[11px] font-bold ${statusInfo.color}`}>
                                    {statusInfo.icon}
                                    {statusInfo.label}
                                </div>
                            </div>
                            <p className="text-[12px] text-gray-600 dark:text-gray-400 font-medium mt-1">
                                #{order.order_number} • {new Date(order.created_at).toLocaleString('vi-VN')}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Event & Items */}
                    <div className="lg:col-span-2 space-y-3">
                        
                        {/* Transfer Information Section */}
                        {order.order_type === 'TICKET_TRANSFER' && order.metadata?.receiver_email && (
                            <div className="bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/5 rounded-[2rem] py-3 md:px-6 md:px-4 overflow-hidden relative group shadow-sm">
                                <div className="absolute inset-0 bg-blue-600/5 -z-10"></div>
                                <div className="flex items-center gap-4">
                                    {order.receiver?.avatar_url ? (
                                        <img 
                                            src={order.receiver.avatar_url} 
                                            alt={order.receiver.full_name} 
                                            className="w-14 h-14 rounded-full object-cover border-2 border-white dark:border-white/10 shadow-lg"
                                        />
                                    ) : (
                                        <div className="w-14 h-14 rounded-full bg-blue-600/10 flex items-center justify-center text-blue-600 text-2xl font-bold border-2 border-white dark:border-white/10 shadow-lg">
                                            {order.receiver?.full_name?.charAt(0) || order.metadata.receiver_email.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-[10px] font-bold text-blue-600 ">{t('transactions.detail.receiver_info')}</p>
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                            {order.receiver?.full_name || order.metadata.receiver_email}
                                        </h3>
                                        {order.receiver?.full_name && (
                                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{order.metadata.receiver_email}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Event Preview Card */}
                        <div className="bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/5 rounded-[2rem] p-3 md:p-4 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-neon-green/5 blur-[80px] -z-10 group-hover:bg-neon-green/10 transition-colors"></div>
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="w-full md:w-36 h-36 rounded-2xl overflow-hidden flex-shrink-0 border border-gray-200 dark:border-white/10 shadow-2xl">
                                    <img 
                                        src={order.event?.image_url || order.event?.thumbnail_url} 
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                                        alt={order.event?.title} 
                                    />
                                </div>
                                <div className="flex-1 flex flex-col justify-center space-y-5">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-neon-green/10 rounded-full w-fit">
                                        <span className="text-[11px] font-bold text-neon-green">{t('transactions.detail.related_event')}</span>
                                    </div>
                                    <h2 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white leading-tight">
                                        {order.event?.title}
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center text-neon-green">
                                                <Calendar className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">{t('eventDetail.time')}</p>
                                                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{new Date(order.event?.event_date).toLocaleDateString(i18n.language, { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center text-neon-green">
                                                <MapPin className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">{t('eventDetail.location')}</p>
                                                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 line-clamp-1">
                                                    {order.event?.location_name || order.event?.location_address || t('transactions.detail.updating')}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tickets List */}
                        <div className="bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/5 rounded-[2rem] overflow-hidden shadow-sm">
                            <div className="px-6 py-2.5 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-gray-50/50 dark:bg-white/[0.01]">
                                <div className="flex items-center gap-3">
                                    <Ticket className="w-4 h-4 text-neon-green" />
                                    <h3 className="text-sm font-bold text-gray-600 dark:text-gray-400">
                                        {order.order_type === 'TICKET_TRANSFER' ? t('transactions.detail.transfer_ticket') : t('transactions.detail.ticket_list')}
                                    </h3>
                                </div>
                                <span className="text-[11px] font-bold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-white/5 px-3 py-1 rounded-full">
                                    {order.items?.length || 0} {t('checkout.quantity').toLowerCase().replace(':', '')}
                                </span>
                            </div>
                            <div className="divide-y divide-gray-100 dark:divide-white/5">
                                {(order.items?.length > 0 ? order.items : (order.metadata?.tickets || [])).map((item, idx) => (
                                    <div key={idx} className="p-3 md:p-4 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-gray-50 dark:hover:bg-white/[0.01] transition-all group">
                                        <div className="flex items-center gap-6">
                                            <div className="w-14 h-14 bg-neon-green/10 text-neon-green rounded-2xl flex items-center justify-center text-xl font-bold">
                                                {item.quantity || 1}
                                            </div>
                                            <div>
                                                <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                                                    {item.ticket_tier?.tier_name || item.tier_name || t('transactions.detail.transfer_ticket')}
                                                </h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                                                        {item.ticket_code ? `#${item.ticket_code}` : t('transactions.detail.official_tier')}
                                                    </span>
                                                    <div className="w-1 h-1 bg-gray-300 dark:bg-white/20 rounded-full"></div>
                                                    <span className="text-[10px] font-bold text-neon-green flex items-center gap-1.5 bg-neon-green/5 px-2 py-0.5 rounded-md">
                                                        <Shield className="w-3 h-3" /> NFT Verified
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col md:items-end gap-1">
                                            <div className="text-lg font-black text-gray-900 dark:text-white">
                                                {formatCurrency(item.subtotal || order.total_amount / (order.items?.length || 1))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Merchandise if any */}
                        {order.merchandise_items?.length > 0 && (
                            <div className="bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/5 rounded-[2rem] overflow-hidden shadow-sm">
                                <div className="px-6 py-2.5 border-b border-gray-100 dark:border-white/5 flex items-center gap-3 bg-gray-50/50 dark:bg-white/[0.01]">
                                    <ShoppingBag className="w-4 h-4 text-neon-green" />
                                    <h3 className="text-sm font-bold text-gray-600 dark:text-gray-400">{t('transactions.detail.addon')}</h3>
                                </div>
                                <div className="divide-y divide-gray-100 dark:divide-white/5">
                                    {order.merchandise_items.map((m, idx) => (
                                        <div key={idx} className="p-3 md:p-4 flex items-center gap-6 hover:bg-gray-50 dark:hover:bg-white/[0.01] transition-all group">
                                            <div className="w-20 h-20 bg-gray-100 dark:bg-white/5 rounded-2xl overflow-hidden flex-shrink-0 border border-gray-100 dark:border-white/10">
                                                <img src={m.merchandise?.image_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-base font-bold text-gray-900 dark:text-white">{m.merchandise?.name}</h4>
                                                <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-gray-100 dark:bg-white/5 rounded-lg mt-2 text-[11px] font-bold text-gray-600 dark:text-gray-400">
                                                    {t('transactions.detail.qty')}: <span className="text-neon-green">{m.quantity}</span>
                                                </div>
                                            </div>
                                            <div className="text-lg font-black text-gray-900 dark:text-white">{formatCurrency(m.subtotal)}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Payment Summary & Meta */}
                    <div className="space-y-4">
                        {/* Summary Card */}
                        <div className="bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/5 rounded-[2.5rem] p-6 shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-neon-green/5 blur-[50px] -z-10"></div>
                            <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400 mb-8">
                                <Info className="w-4 h-4" />
                                <h3 className="text-xs font-black uppercase">{t('transactions.detail.payment')}</h3>
                            </div>
                            
                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between items-center">
                                    <span className="text-[12px] font-medium text-gray-500 dark:text-gray-400">{t('transactions.detail.subtotal')}</span>
                                    <span className="text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(order.subtotal)}</span>
                                </div>

                                {/* Chi tiết phí cho giao dịch Marketplace/Transfer */}
                                {Number(order.platform_fee) > 0 && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-[12px] font-medium text-gray-500 dark:text-gray-400">{t('transactions.detail.service_fee')}</span>
                                        <span className="text-sm font-bold text-gray-700 dark:text-gray-400">+{formatCurrency(order.platform_fee)}</span>
                                    </div>
                                )}

                                {order.discount_amount > 0 && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-[12px] font-bold text-neon-green uppercase tracking-tight">{t('transactions.detail.discount')}</span>
                                        <span className="text-sm font-bold text-neon-green">-{formatCurrency(order.discount_amount)}</span>
                                    </div>
                                )}
                                
                                <div className="pt-4 border-t border-gray-100 dark:border-white/5">
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1">{t('transactions.detail.total_amount')}</p>
                                            <h2 className="text-2xl font-black text-neon-green tracking-tighter">
                                                {formatCurrency(order.total_amount)}
                                            </h2>
                                        </div>
                                        <div className="px-2 py-1 bg-white/5 rounded text-[9px] font-bold text-gray-600 dark:text-gray-500 border border-gray-200 dark:border-white/10 uppercase tracking-tighter">
                                            VAT Included
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-2">
                                <Link 
                                    to="/my-tickets"
                                    className="w-full bg-neon-green text-black py-4 rounded-2xl text-xs font-black uppercase flex items-center justify-center gap-3 hover:bg-white hover:scale-[1.02] transition-all shadow-xl shadow-neon-green/20"
                                >
                                    <Ticket className="w-4 h-4" />
                                    {t('transactions.detail.manage_tickets')}
                                </Link>
                            </div>
                        </div>

                        {/* Security Card */}
                        <div className="bg-zinc-900 rounded-[2.5rem] p-6 text-white space-y-6 relative overflow-hidden group border border-white/5 shadow-2xl">
                            <Shield className="absolute top-0 right-0 w-32 h-32 text-neon-green opacity-5 -translate-y-10 translate-x-10 group-hover:scale-110 transition-transform duration-700" />
                            
                            <div className="relative z-10 space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-neon-green border border-white/10">
                                        <Shield className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold">{t('transactions.detail.secured')}</h4>
                                        <p className="text-[11px] text-gray-500 font-medium">{t('transactions.detail.nft_verification')}</p>
                                    </div>
                                </div>

                                <div className="space-y-4 pt- border-t border-white/5">
                                    <div className="flex items-center justify-between text-[11px] font-medium text-gray-400">
                                        <span>{t('transactions.detail.order_id')}</span>
                                        <span className="text-white font-mono">{order.order_number}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-[11px] font-medium text-gray-400">
                                        <span>{t('transactions.detail.method')}</span>
                                        <span className="text-white font-bold uppercase">
                                            {order.payment_method || t('transactions.detail.updating')}
                                        </span>
                                    </div>
                                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                        <p className="text-[10px] font-bold text-gray-500 uppercase mb-2 flex items-center gap-2">
                                            <ExternalLink className="w-3 h-3" /> Blockchain Proof
                                        </p>
                                        <p className="text-[11px] font-mono opacity-50 break-all leading-relaxed">
                                            0x{order.id.substring(0, 16)}...{order.id.substring(order.id.length - 8)}
                                        </p>
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

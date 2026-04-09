import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  ShieldCheck, 
  ChevronLeft, 
  Ticket, 
  Clock, 
  AlertCircle,
  ArrowRight,
  Zap,
  Lock,
  Calendar,
  MapPin,
  Check,
  Info
} from 'lucide-react';
import orderService from '../../services/order.service';
import paymentService from '../../services/payment.service';
import merchandiseService from '../../services/merchandise.service';
import couponService from '../../services/coupon.service';
import { Plus, Minus, Tag, ShoppingBag, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';

// --- Price Formatter Helper ---
const formatPrice = (price, locale = 'vi-VN') => {
  return new Intl.NumberFormat(locale, { 
    style: 'currency', 
    currency: 'VND',
    maximumFractionDigits: 0
  }).format(parseFloat(price));
};

// --- Embedded SVG Logos (Always visible) ---
const VNPayLogo = () => (
  <svg viewBox="0 0 100 40" className="w-16 h-auto">
    <text x="5" y="30" fontFamily="sans-serif" fontSize="24" fontWeight="black" fill="currentColor">VN</text>
    <text x="42" y="30" fontFamily="sans-serif" fontSize="24" fontWeight="black" fill="#E31D26">PAY</text>
  </svg>
);

const MoMoLogo = () => (
  <svg viewBox="0 0 100 100" className="w-8 h-8">
    <rect width="100" height="100" rx="16" fill="#A50064" />
    <text x="50" y="65" textAnchor="middle" fontFamily="sans-serif" fontSize="40" fontWeight="black" fill="white">M</text>
  </svg>
);

// --- Circular Timer Component ---
const CircularTimer = ({ seconds, total = 600, locale = 'vi-VN' }) => {
  const percentage = (seconds / total) * 100;
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative w-14 h-14 flex items-center justify-center">
      <svg className="w-full h-full transform -rotate-90">
        <circle
          cx="28" cy="28" r={radius}
          stroke="currentColor" strokeWidth="3"
          fill="transparent"
          className="text-gray-200 dark:text-white/10"
        />
        <circle
          cx="28" cy="28" r={radius}
          stroke="currentColor" strokeWidth="3"
          fill="transparent"
          strokeDasharray={circumference}
          style={{ strokeDashoffset, transition: 'stroke-dashoffset 1s linear' }}
          className={seconds < 120 ? 'text-red-500' : 'text-neon-green'}
        />
      </svg>
      <div className={`absolute inset-0 flex items-center justify-center text-[10px] font-black ${seconds < 120 ? 'text-red-500 animate-pulse' : 'text-gray-900 dark:text-white'}`}>
        {Math.floor(seconds / 60)}:{(seconds % 60).toString().padStart(2, '0')}
      </div>
    </div>
  );
};

const Checkout = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const currentLocale = i18n.language === 'en' ? 'en-US' : 'vi-VN';
  
  const [paymentMethod, setPaymentMethod] = useState('vnpay');
  const [isProcessing, setIsProcessing] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);

  // --- Add-ons & Coupon State ---
  const [selectedMerch, setSelectedMerch] = useState({}); // { id: qty }
  const [couponCode, setCouponCode] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [isUpdatingOrder, setIsUpdatingOrder] = useState(false);
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);

  const { data, isLoading: isOrderLoading, error, refetch } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => orderService.getOrderById(orderId),
    enabled: !!orderId,
    refetchOnWindowFocus: false
  });

  const order = data?.data;

  // Fetch Merchandise for this event
  const { data: merchData, isLoading: isMerchLoading } = useQuery({
    queryKey: ['event-merch', order?.event_id],
    queryFn: () => merchandiseService.getEventMerchandise(order.event_id),
    enabled: !!order?.event_id
  });

  const merchandise = merchData?.data || [];

  // Fetch Available Coupons for this event
  const { data: couponsData, isLoading: isCouponsLoading } = useQuery({
    queryKey: ['available-coupons', order?.event_id],
    queryFn: () => couponService.getEventCoupons(order.event_id),
    enabled: !!order?.event_id
  });

  const availableCoupons = couponsData?.data?.data || [];

  // Persistence & Real-time Ticketing logic
  useEffect(() => {
    if (order) {
      const calculateTimeLeft = () => {
        const createdTime = new Date(order.created_at).getTime();
        const expiryTime = createdTime + 10 * 60 * 1000;
        const diff = Math.floor((expiryTime - Date.now()) / 1000);
        return diff > 0 ? diff : 0;
      };

      setTimeLeft(calculateTimeLeft());

      const timer = setInterval(() => {
        const remaining = calculateTimeLeft();
        setTimeLeft(remaining);
        if (remaining <= 0) {
          clearInterval(timer);
          toast.error(t('checkout.expired'));
          navigate('/events');
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [order, navigate, t]);

  const handlePayment = async () => {
    if (timeLeft <= 0) return;
    setIsProcessing(true);
    try {
      let res;
      if (paymentMethod === 'vnpay') {
        res = await paymentService.createVNPayUrl(order.id);
      } else if (paymentMethod === 'momo') {
        res = await paymentService.createMoMoUrl(order.id);
      }
      if (res?.paymentUrl) window.location.href = res.paymentUrl;
    } catch (err) {
      toast.error(t('profile.security.change_failed'));
      setIsProcessing(false);
    }
  };

  const syncOrder = async (merchItems, code) => {
    setIsUpdatingOrder(true);
    try {
      const items = Object.entries(merchItems).map(([id, qty]) => ({
        merchandise_id: id,
        quantity: qty
      }));
      await orderService.updateOrder(order.id, {
        merchandise_items: items,
        coupon_code: code || null
      });
      await refetch();
    } catch (err) {
      toast.error(err.response?.data?.error || "Cập nhật thất bại");
    } finally {
      setIsUpdatingOrder(false);
    }
  };

  const handleMerchCount = (merchId, delta, stock) => {
    const currentQty = selectedMerch[merchId] || 0;
    const newQty = Math.max(0, Math.min(stock, currentQty + delta));
    
    if (newQty === currentQty) return;

    const newSelected = { ...selectedMerch, [merchId]: newQty };
    if (newQty === 0) delete newSelected[merchId];
    
    setSelectedMerch(newSelected);
    syncOrder(newSelected, order.coupon?.code);
  };

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    setIsApplyingCoupon(true);
    try {
      await syncOrder(selectedMerch, couponCode);
      toast.success(t('checkout.couponApplied'));
    } catch (err) {
      // Error handled in syncOrder toast
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = async () => {
    setCouponCode('');
    await syncOrder(selectedMerch, null);
  };

  if (isOrderLoading || timeLeft === null) {
    return (
      <div className="min-h-screen pt-32 flex flex-col items-center justify-center bg-gray-50 dark:bg-[#0a0a0c]">
        <div className="w-12 h-12 border-4 border-neon-green/10 border-t-neon-green rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-400 font-bold uppercase tracking-[0.3em] text-[10px]">{t('checkout.syncing')}</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen pt-32 flex flex-col items-center justify-center bg-gray-50 dark:bg-[#0a0a0c]">
        <AlertCircle className="w-16 h-16 text-red-500 mb-6" />
        <h2 className="text-xl font-black uppercase text-gray-900 dark:text-white">{t('eventDetail.notFound')}</h2>
        <button onClick={() => navigate('/events')} className="mt-6 px-8 py-3 bg-neon-green text-black font-black rounded-2xl">{t('common.backHome')}</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0c] text-gray-900 dark:text-white pt-10 pb-20 transition-colors">
      <div className="max-w-6xl mx-auto px-6">
        
        {/* Navigation & Status */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-6">
           <div>
              <button 
                onClick={() => navigate(-1)} 
                className="flex items-center gap-2 text-gray-500 hover:text-neon-green mb-4 transition-all group"
              >
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="font-medium text-[13px]">{t('common.back')}</span>
              </button>
              <h1 className="text-xl md:text-xl font-black uppercase leading-none ">
                {t('checkout.title')}
              </h1>
              <p className="text-gray-400 text-[10px] font-bold uppercase mt-2">
                {t('checkout.orderNumber')} #{order.order_number}
              </p>
           </div>
           
           <div className="flex items-center gap-4 p-2 pr-6 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-[2rem] shadow-sm">
              <CircularTimer seconds={timeLeft} locale={currentLocale} />
              <div>
                 <p className="text-[9px] font-black text-gray-500 uppercase mb-0.5">{t('checkout.holdTime')}</p>
                 <p className="text-xs font-bold opacity-70">{t('checkout.holdTimeDesc')}</p>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* Left Side: Digital Ticket UI */}
          <div className="lg:col-span-12 xl:col-span-7">
             <div className="bg-white dark:bg-[#111114] border border-gray-200 dark:border-white/10 rounded-[2.5rem] shadow-xl overflow-hidden group transition-all duration-500">
                
                {/* Visual Banner */}
                <div className="relative h-48 overflow-hidden">
                   <img src={order.event.image_url} className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-700" alt="" />
                   <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-[#111114] via-transparent to-transparent"></div>
                   <div className="absolute bottom-6 left-8">
                      <span className="px-2 py-1 bg-neon-green text-black text-[9px] font-black uppercase rounded mb-2 inline-block">
                        {t('checkout.officialTicket')}
                      </span>
                      <h2 className="text-2xl font-black uppercase tracking-tight leading-none text-gray-900 dark:text-white">
                        {order.event.title}
                      </h2>
                   </div>
                </div>

                <div className="pt-6 pr-8 pl-8  space-y-8">
                   {/* Grid Info */}
                   <div className="grid grid-cols-2 gap-8">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-neon-green" />
                         </div>
                         <div>
                            <p className="text-[9px] text-gray-400 font-black uppercase ">{t('eventDetail.time')}</p>
                            <p className="text-xs font-bold uppercase tracking-tighter">
                                {new Date(order.event.event_date).toLocaleDateString(currentLocale, {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric'
                                })}
                            </p>
                         </div>
                      </div>
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 flex items-center justify-center">
                            <MapPin className="w-5 h-5 text-neon-green" />
                         </div>
                         <div className="overflow-hidden">
                            <p className="text-[9px] text-gray-400 font-black uppercase">{t('eventDetail.location')}</p>
                            <p className="text-xs font-bold truncate">{order.event.location_address}</p>
                         </div>
                      </div>
                   </div>

                   {/* Separator */}
                   <div className="relative">
                      <div className="absolute left-[-42px] top-1/2 -translate-y-1/2 w-6 h-6 bg-gray-50 dark:bg-[#0a0a0c] rounded-full border border-gray-200 dark:border-white/10"></div>
                      <div className="absolute right-[-42px] top-1/2 -translate-y-1/2 w-6 h-6 bg-gray-50 dark:bg-[#0a0a0c] rounded-full border border-gray-200 dark:border-white/10"></div>
                      <div className="w-full border-t border-dashed border-gray-200 dark:border-white/20"></div>
                   </div>

                   {/* Tiers List */}
                   <div className="space-y-4 pb-6">
                      <p className="text-[9px] font-black text-gray-400 uppercase">{t('checkout.ticketDetails')}</p>
                      {order.items.map((item, idx) => (
                         <div key={idx} className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                               <Ticket className="w-4 h-4 text-neon-green/50" />
                               <div>
                                  <p className="text-sm font-black uppercase tracking-tight">{item.ticket_tier.tier_name}</p>
                                  <p className="text-[10px] text-gray-400 font-bold">{t('checkout.quantity')} x{item.quantity}</p>
                               </div>
                            </div>
                            <p className="font-black text-sm">{formatPrice(item.subtotal, currentLocale)}</p>
                         </div>
                      ))}
                   </div>
                </div>

             </div>

                             {/* Merchandise Section */}
                {merchandise.length > 0 && (
                   <div className="mt-8 bg-white dark:bg-[#111114] border border-gray-200 dark:border-white/10 rounded-[2.5rem] shadow-xl overflow-hidden p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="flex items-center justify-between mb-6">
                         <h3 className="text-sm font-black uppercase flex items-center gap-2">
                            <ShoppingBag className="w-4 h-4 text-neon-green" /> {t('checkout.addons')}
                         </h3>
                         {isUpdatingOrder && <div className="w-4 h-4 border-2 border-neon-green/20 border-t-neon-green rounded-full animate-spin"></div>}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         {merchandise.map((m) => {
                            const qty = selectedMerch[m.id] || 0;
                            return (
                               <div key={m.id} className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${qty > 0 ? 'bg-neon-green/5 border-neon-green/30' : 'bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/5'}`}>
                                  <div className="flex items-center gap-4">
                                     <div className="w-12 h-12 rounded-xl bg-black/10 overflow-hidden shrink-0">
                                        <img src={m.image_url || 'https://via.placeholder.com/100'} className="w-full h-full object-cover" alt="" />
                                     </div>
                                     <div>
                                        <p className="text-xs font-black uppercase tracking-tight leading-tight mb-1">{m.name}</p>
                                        <p className="text-[11px] font-bold text-neon-green">{formatPrice(m.price, currentLocale)}</p>
                                     </div>
                                  </div>

                                  <div className="flex items-center gap-2 bg-white dark:bg-black/40 p-1 rounded-xl border border-gray-100 dark:border-white/5">
                                     <button 
                                        onClick={() => handleMerchCount(m.id, -1, m.stock)}
                                        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                                     >
                                        <Minus className="w-3 h-3" />
                                     </button>
                                     <span className="w-6 text-center text-xs font-black">{qty}</span>
                                     <button 
                                        onClick={() => handleMerchCount(m.id, 1, m.stock)}
                                        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-neon-green text-black transition-colors"
                                     >
                                        <Plus className="w-3 h-3" />
                                     </button>
                                  </div>
                               </div>
                            );
                         })}
                      </div>
                   </div>
                )}
          </div>

          

          {/* Right Side: Payment Logic Card */}
          <div className="lg:col-span-12 xl:col-span-5 relative group">
             <div className="lg:sticky lg:top-12 bg-white dark:bg-[#111114] border border-gray-200 dark:border-white/10 rounded-[2.5rem] p-8 shadow-2xl space-y-8">
                
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('checkout.orderSummary')}</p>
                
                <div className="space-y-4">
                   <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-gray-400 font-black uppercase">{t('checkout.subtotal')}</span>
                      <span>{formatPrice(order.subtotal, currentLocale)}</span>
                   </div>

                   {/* Discount row if present */}
                   {order.discount_amount > 0 && (
                      <div className="flex justify-between items-center text-xs font-bold animate-in slide-in-from-right-2">
                         <span className="text-pink-500 font-black uppercase">{t('checkout.discount')}</span>
                         <span className="text-pink-500">-{formatPrice(order.discount_amount, currentLocale)}</span>
                      </div>
                   )}

                   <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-gray-400 font-black uppercase">{t('checkout.serviceFee')}</span>
                      <span className="text-neon-green">{t('checkout.free')}</span>
                   </div>

                   {/* Coupon Input */}
                   <div className="pt-4 border-t border-gray-100 dark:border-white/10">
                      {order.coupon ? (
                         <div className="flex items-center justify-between p-3 bg-pink-500/10 border border-pink-500/30 rounded-xl">
                            <div className="flex items-center gap-2">
                               <Tag className="w-3 h-3 text-pink-500" />
                               <span className="text-[10px] font-black uppercase text-pink-500">{order.coupon.code}</span>
                            </div>
                            <button onClick={handleRemoveCoupon} className="p-1 hover:bg-pink-500/20 rounded-md transition-colors">
                               <X className="w-3 h-3 text-pink-500" />
                            </button>
                         </div>
                      ) : (
                         <div className="flex gap-2">
                            <div className="relative flex-1">
                               <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                               <input 
                                  type="text" 
                                  value={couponCode}
                                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                  placeholder={t('checkout.couponCode')}
                                  className="w-full pl-8 pr-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl text-[11px] font-bold focus:border-neon-green outline-none transition-all"
                                />
                            </div>
                            <button 
                               onClick={handleApplyCoupon}
                               disabled={!couponCode || isApplyingCoupon}
                               className="px-4 py-2 bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded-xl text-[10px] font-black uppercase hover:bg-neon-green hover:text-black transition-all disabled:opacity-50"
                            >
                               {isApplyingCoupon ? '...' : t('checkout.apply')}
                            </button>
                         </div>
                      )}
                      {!order.coupon && (
                         <div className="mt-2 text-right">
                            <button 
                              onClick={() => setIsVoucherModalOpen(true)}
                              className="text-[10px] font-black uppercase text-neon-green hover:underline flex items-center gap-1 ml-auto"
                            >
                              <Tag className="w-3 h-3" />
                              {t('checkout.selectVoucher')}
                            </button>
                         </div>
                       )}
                   </div>

                   <div className="pt-6 border-t border-gray-100 dark:border-white/10 flex justify-between items-end">
                      <div className="flex flex-col">
                         <span className="text-[10px] font-black uppercase text-gray-400 mb-1">{t('checkout.totalToPay')}</span>
                         <span className="text-2xl font-black text-neon-green tracking-tighter drop-shadow-sm">
                            {formatPrice(order.total_amount, currentLocale)}
                         </span>
                      </div>
                      <Lock className="w-5 h-5 text-gray-300 dark:text-gray-700 mb-1" />
                   </div>
                </div>

                {/* Method Selection */}
                <div className="space-y-3">
                   <p className="text-xs font-black uppercase text-gray-400 mb-4">{t('checkout.selectMethod')}</p>
                   
                   {/* VNPay */}
                   <div 
                      onClick={() => setPaymentMethod('vnpay')}
                      className={`relative px-5 py-3 rounded-2xl border transition-all cursor-pointer group flex items-center justify-between ${paymentMethod === 'vnpay' ? 'bg-neon-green/10 border-neon-green/50 shadow-sm' : 'bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/5'}`}
                   >
                      <div className="flex items-center gap-4">
                         <div className="h-10 w-10 bg-[#a50064] rounded-xl flex items-center justify-center shadow-lg">
                            <img className="rounded-lg" src="data:image/png;base64,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"></img>
                         </div>
                         <span className="text-sm font-black ">{t('checkout.vnpayGateway')}</span>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${paymentMethod === 'vnpay' ? 'border-neon-green bg-neon-green' : 'border-gray-200 dark:border-gray-700'}`}>
                         {paymentMethod === 'vnpay' && <Check className="w-3 h-3 text-black" />}
                      </div>
                   </div>

                   {/* MoMo */}
                   <div 
                      onClick={() => setPaymentMethod('momo')}
                      className={`relative px-5 py-3 rounded-2xl border transition-all cursor-pointer group flex items-center justify-between ${paymentMethod === 'momo' ? 'bg-[#a50064]/10 border-[#a50064]/50 shadow-sm' : 'bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/5'}`}
                   >
                      <div className="flex items-center gap-4">
                         <div className="h-10 w-10 bg-[#a50064] rounded-xl flex items-center justify-center shadow-lg">
                            <img className="rounded-lg" src="data:image/png;base64,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"></img>
                         </div>
                         <span className="text-sm font-black ">{t('checkout.momoWallet')}</span>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${paymentMethod === 'momo' ? 'border-[#a50064] bg-[#a50064]' : 'border-gray-200 dark:border-gray-700'}`}>
                         {paymentMethod === 'momo' && <Check className="w-3 h-3 text-white" />}
                      </div>
                   </div>
                </div>

                <button 
                  onClick={handlePayment}
                  disabled={isProcessing || timeLeft <= 0}
                  className="w-full py-4 bg-neon-green text-black font-black uppercase text-sm rounded-3xl hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all flex items-center justify-center gap-3 shadow-[0_15px_40px_rgba(82,196,45,0.25)] disabled:opacity-50"
                >
                  {isProcessing ? t('checkout.initializing') : t('checkout.payNow')} 
                </button>

                <div className="flex items-center justify-center gap-6">
                   <div className="flex flex-col items-center gap-1 opacity-40">
                      <Zap className="w-3 h-3" />
                      <span className="text-[7px] font-black uppercase tracking-widest">{t('checkout.instant')}</span>
                   </div>
                   <div className="w-px h-4 bg-gray-200 dark:bg-white/10"></div>
                   <div className="flex flex-col items-center gap-1 opacity-40">
                      <ShieldCheck className="w-3 h-3" />
                      <span className="text-[7px] font-black uppercase tracking-widest">{t('checkout.secure')}</span>
                   </div>
                </div>

             </div>
          </div>

      </div>
    </div>

    {/* Voucher Selector Modal */}
    <AnimatePresence>
        {isVoucherModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setIsVoucherModalOpen(false)}
               className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-[#111114] border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
              {/* Header */}
              <div className="p-8 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-neon-green/10 flex items-center justify-center">
                       <Tag className="w-5 h-5 text-neon-green" />
                    </div>
                    <div>
                       <h3 className="text-sm font-black uppercase tracking-widest">{t('checkout.availableVouchers')}</h3>
                       <p className="text-[10px] text-gray-400 font-bold uppercase">{availableCoupons.length} {t('checkout.availableVouchers')}</p>
                    </div>
                 </div>
                 <button 
                    onClick={() => setIsVoucherModalOpen(false)}
                    className="w-10 h-10 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 flex items-center justify-center transition-colors"
                 >
                    <X className="w-5 h-5" />
                 </button>
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto p-8 space-y-4">
                 {availableCoupons.length === 0 ? (
                    <div className="py-12 text-center text-gray-500">
                       <Info className="w-12 h-12 mx-auto mb-4 opacity-20" />
                       <p className="text-xs font-bold uppercase">{t('checkout.noAvailableVouchers')}</p>
                    </div>
                 ) : (
                    availableCoupons.map((coupon) => (
                       <div 
                          key={coupon.id} 
                          className="relative group border border-gray-100 dark:border-white/5 rounded-2xl overflow-hidden flex"
                       >
                          {/* Left visual side */}
                          <div className="w-24 bg-neon-green/10 flex flex-col items-center justify-center border-r border-dashed border-gray-200 dark:border-white/10 relative">
                             <div className="absolute top-[-8px] left-[-8px] w-4 h-4 rounded-full bg-white dark:bg-[#111114]"></div>
                             <div className="absolute bottom-[-8px] left-[-8px] w-4 h-4 rounded-full bg-white dark:bg-[#111114]"></div>
                             <div className="absolute top-[-8px] right-[-8px] w-4 h-4 rounded-full bg-white dark:bg-[#111114]"></div>
                             <div className="absolute bottom-[-8px] right-[-8px] w-4 h-4 rounded-full bg-white dark:bg-[#111114]"></div>
                             
                             <div className="p-2 bg-neon-green text-black rounded-lg mb-2">
                                <Tag className="w-4 h-4" />
                             </div>
                             <div className="text-[10px] font-black uppercase tracking-tighter text-neon-green text-center px-1">
                                {coupon.discount_type === 'percentage' ? `${coupon.discount_value}% OFF` : 'VOUCHER'}
                             </div>
                          </div>

                          {/* Right Content */}
                          <div className="flex-1 p-5 bg-gray-50/50 dark:bg-white/[0.02] flex flex-col justify-between">
                             <div>
                                <div className="flex items-center justify-between mb-1">
                                   <span className="text-xs font-black uppercase tracking-tight">{coupon.code}</span>
                                   <span className="text-[9px] font-black text-neon-green bg-green-500/10 px-2 py-0.5 rounded uppercase">
                                      {coupon.event_id ? 'Sự kiện' : 'Global'}
                                   </span>
                                </div>
                                <p className="text-[11px] text-gray-400 font-bold mb-3 leading-tight">
                                   {coupon.description || `Giảm ${coupon.discount_type === 'percentage' ? coupon.discount_value + '%' : formatPrice(coupon.discount_value, currentLocale)} cho đơn hàng từ ${formatPrice(coupon.min_order_amount || 0, currentLocale)}`}
                                </p>
                             </div>

                             <div className="flex items-center justify-between mt-auto">
                                <div className="text-[9px] font-bold text-gray-500 uppercase">
                                   <span className="block mb-0.5">{t('checkout.minSpend')}: {formatPrice(coupon.min_order_amount || 0, currentLocale)}</span>
                                   <span>{t('checkout.expiry')}: {new Date(coupon.end_date).toLocaleDateString(currentLocale)}</span>
                                </div>
                                <button 
                                   onClick={() => {
                                      setCouponCode(coupon.code);
                                      setIsVoucherModalOpen(false);
                                      // Trigger apply immediately
                                      syncOrder(selectedMerch, coupon.code);
                                   }}
                                   className="px-4 py-2 bg-neon-green text-black text-[10px] font-black uppercase rounded-xl hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all"
                                >
                                   {t('checkout.apply')}
                                </button>
                             </div>
                          </div>
                       </div>
                    ))
                 )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Checkout;

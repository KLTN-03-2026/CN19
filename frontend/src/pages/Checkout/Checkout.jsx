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
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

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

  const { data, isLoading, error } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => orderService.getOrderById(orderId),
    enabled: !!orderId,
    refetchOnWindowFocus: false
  });

  const order = data?.data;

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

  if (isLoading || timeLeft === null) {
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
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0c] text-gray-900 dark:text-white pt-12 pb-24 transition-colors">
      <div className="max-w-6xl mx-auto px-6">
        
        {/* Navigation & Status */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12">
           <div>
              <button 
                onClick={() => navigate(-1)} 
                className="flex items-center gap-2 text-gray-500 hover:text-neon-green mb-4 transition-all group"
              >
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="font-black uppercase tracking-widest text-[9px]">{t('common.back')}</span>
              </button>
              <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none italic">
                {t('checkout.title')}
              </h1>
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-2">
                {t('checkout.orderNumber')} #{order.order_number}
              </p>
           </div>
           
           <div className="flex items-center gap-4 p-2 pr-6 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-[2rem] shadow-sm">
              <CircularTimer seconds={timeLeft} locale={currentLocale} />
              <div>
                 <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-0.5">{t('checkout.holdTime')}</p>
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

                <div className="p-8 space-y-8">
                   {/* Grid Info */}
                   <div className="grid grid-cols-2 gap-8">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-neon-green" />
                         </div>
                         <div>
                            <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">{t('eventDetail.time')}</p>
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
                            <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">{t('eventDetail.location')}</p>
                            <p className="text-xs font-bold truncate">{order.event.location_address}</p>
                         </div>
                      </div>
                   </div>

                   {/* Separator */}
                   <div className="relative py-2">
                      <div className="absolute left-[-42px] top-1/2 -translate-y-1/2 w-6 h-6 bg-gray-50 dark:bg-[#0a0a0c] rounded-full border border-gray-200 dark:border-white/10"></div>
                      <div className="absolute right-[-42px] top-1/2 -translate-y-1/2 w-6 h-6 bg-gray-50 dark:bg-[#0a0a0c] rounded-full border border-gray-200 dark:border-white/10"></div>
                      <div className="w-full border-t border-dashed border-gray-200 dark:border-white/20"></div>
                   </div>

                   {/* Tiers List */}
                   <div className="space-y-4">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{t('checkout.ticketDetails')}</p>
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

                {/* Footer Security */}
                <div className="bg-gray-50 dark:bg-white/[0.02] p-6 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <ShieldCheck className="w-4 h-4 text-blue-500" />
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                          {t('checkout.verified')} {t('org.step2')} BASTICKET
                      </span>
                   </div>
                   <div className="flex items-center gap-1">
                      <Check className="w-3 h-3 text-neon-green" />
                      <span className="text-[9px] font-bold text-neon-green uppercase tracking-widest">{t('checkout.active')}</span>
                   </div>
                </div>
             </div>
          </div>

          {/* Right Side: Payment Logic Card */}
          <div className="lg:col-span-12 xl:col-span-5 relative group">
             <div className="lg:sticky lg:top-12 bg-white dark:bg-[#111114] border border-gray-200 dark:border-white/10 rounded-[2.5rem] p-8 shadow-2xl space-y-8">
                
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('checkout.orderSummary')}</p>
                
                <div className="space-y-4">
                   <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-gray-400 tracking-wider uppercase">{t('checkout.subtotal')}</span>
                      <span>{formatPrice(order.subtotal, currentLocale)}</span>
                   </div>
                   <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-gray-400 tracking-wider uppercase">{t('checkout.serviceFee')}</span>
                      <span className="text-neon-green">{t('checkout.free')}</span>
                   </div>
                   <div className="pt-6 border-t border-gray-100 dark:border-white/10 flex justify-between items-end">
                      <div className="flex flex-col">
                         <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">{t('checkout.totalToPay')}</span>
                         <span className="text-4xl font-black text-neon-green tracking-tighter drop-shadow-sm">
                            {formatPrice(order.total_amount, currentLocale)}
                         </span>
                      </div>
                      <Lock className="w-5 h-5 text-gray-300 dark:text-gray-700 mb-1" />
                   </div>
                </div>

                {/* Method Selection */}
                <div className="space-y-3">
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{t('checkout.selectMethod')}</p>
                   
                   {/* VNPay */}
                   <div 
                      onClick={() => setPaymentMethod('vnpay')}
                      className={`relative p-5 rounded-2xl border transition-all cursor-pointer group flex items-center justify-between ${paymentMethod === 'vnpay' ? 'bg-neon-green/10 border-neon-green/50 shadow-sm' : 'bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/5'}`}
                   >
                      <div className="flex items-center gap-4">
                         <div className="h-10 px-3 bg-white rounded-xl flex items-center justify-center shadow-sm">
                            <div className={paymentMethod === 'vnpay' ? 'text-blue-700' : 'text-gray-400'}>
                               <VNPayLogo />
                            </div>
                         </div>
                         <span className="text-xs font-black uppercase tracking-widest">{t('checkout.vnpayGateway')}</span>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${paymentMethod === 'vnpay' ? 'border-neon-green bg-neon-green' : 'border-gray-200 dark:border-gray-700'}`}>
                         {paymentMethod === 'vnpay' && <Check className="w-3 h-3 text-black" />}
                      </div>
                   </div>

                   {/* MoMo */}
                   <div 
                      onClick={() => setPaymentMethod('momo')}
                      className={`relative p-5 rounded-2xl border transition-all cursor-pointer group flex items-center justify-between ${paymentMethod === 'momo' ? 'bg-[#a50064]/10 border-[#a50064]/50 shadow-sm' : 'bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/5'}`}
                   >
                      <div className="flex items-center gap-4">
                         <div className="h-10 w-10 bg-[#a50064] rounded-xl flex items-center justify-center shadow-lg">
                            <MoMoLogo />
                         </div>
                         <span className="text-xs font-black uppercase tracking-widest">{t('checkout.momoWallet')}</span>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${paymentMethod === 'momo' ? 'border-[#a50064] bg-[#a50064]' : 'border-gray-200 dark:border-gray-700'}`}>
                         {paymentMethod === 'momo' && <Check className="w-3 h-3 text-white" />}
                      </div>
                   </div>
                </div>

                <button 
                  onClick={handlePayment}
                  disabled={isProcessing || timeLeft <= 0}
                  className="w-full py-6 bg-neon-green text-black font-black uppercase text-sm tracking-[0.3em] rounded-3xl hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all flex items-center justify-center gap-3 shadow-[0_15px_40px_rgba(82,196,45,0.25)] disabled:opacity-50"
                >
                  {isProcessing ? t('checkout.initializing') : t('checkout.payNow')} <ArrowRight className="w-5 h-5" />
                </button>

                <div className="flex items-center justify-center gap-6 pt-2">
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
    </div>
  );
};

export default Checkout;

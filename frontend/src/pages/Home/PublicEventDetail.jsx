import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Calendar, MapPin, Share2, Heart, ArrowLeft, Ticket, ShieldCheck, Tag, Sparkles, Clock, Map, CheckCircle2, ShoppingCart, Plus, Minus, ChevronRight, X, ChevronLeft, Image as ImageIcon, Video } from 'lucide-react';
import eventService from '../../services/event.service';
import orderService from '../../services/order.service';
import { useTranslation } from 'react-i18next';
import EventReviews from '../../components/Explore/EventReviews';
import useBotBehavior from '../../hooks/useBotBehavior';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { useAuthStore } from '../../store/useAuthStore';
import toast from 'react-hot-toast';

// Utility format price
const formatPrice = (price) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(parseFloat(price));
};

const PublicEventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [selectedTickets, setSelectedTickets] = useState({});
  const [showSeatingModal, setShowSeatingModal] = useState(false);
  const [currentSeatingIndex, setCurrentSeatingIndex] = useState(0);

  // AI Bot Protection Hooks
  const { getBehaviorData } = useBotBehavior();
  const { executeRecaptcha } = useGoogleReCaptcha();
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['event', id],
    queryFn: () => eventService.getEventById(id)
  });

  if (isLoading) {
    return (
      <div className="min-h-screen pt-32 pb-20 flex flex-col items-center justify-center bg-gray-50 dark:bg-[#0a0a0c] transition-colors duration-500">
        <div className="w-16 h-16 border-4 border-neon-green/20 border-t-neon-green rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-500 font-bold tracking-widest uppercase text-sm">{t('eventDetail.loading', 'Đang tải siêu phẩm...')}</p>
      </div>
    );
  }

  if (error || !data?.data) {
    return (
      <div className="min-h-screen pt-32 pb-20 flex flex-col items-center justify-center bg-gray-50 dark:bg-[#0a0a0c] transition-colors duration-500">
        <h2 className="text-4xl font-black text-gray-900 dark:text-white uppercase mb-4">{t('eventDetail.notFound', 'Không tìm thấy sự kiện')}</h2>
        <button onClick={() => navigate(-1)} className="px-6 py-3 bg-neon-green text-black font-black uppercase text-xs tracking-widest rounded-xl hover:scale-105 transition-transform">{t('eventDetail.back', 'Quay lại')}</button>
      </div>
    );
  }

  const event = data.data;
  // Determine locale for date formatting based on i18n language
  const dateLocale = i18n.language === 'en' ? 'en-US' : 'vi-VN';
  const eventDate = new Date(event.event_date);
  const formattedDate = eventDate.toLocaleDateString(dateLocale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  
  // Lấy giá thấp nhất
  const lowestPrice = event.ticket_tiers?.length > 0 
    ? Math.min(...event.ticket_tiers.map(t => parseFloat(t.price))) 
    : 0;

  const scrollToTickets = () => {
    document.getElementById('ticket-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Ticket Selection Logic
  const handleTicketChange = (tierId, change, maxAvailable) => {
    setSelectedTickets(prev => {
      const currentQty = prev[tierId] || 0;
      const newQty = currentQty + change;
      if (newQty < 0 || newQty > maxAvailable) return prev;
      
      const newState = { ...prev, [tierId]: newQty };
      if (newState[tierId] === 0) delete newState[tierId];
      return newState;
    });
  };

  const totalSelectedTickets = Object.values(selectedTickets).reduce((a, b) => a + b, 0);
  const totalPrice = Object.entries(selectedTickets).reduce((total, [tierId, qty]) => {
    const tier = event.ticket_tiers.find(t => t.id === tierId);
    return total + (parseFloat(tier?.price || 0) * qty);
  }, 0);

  // Xử lý tạo đơn hàng với AI Protection
  const handleCheckout = async () => {
    if (!isAuthenticated) {
      toast.error(t('eventDetail.loginToBuy', 'Vui lòng đăng nhập hệ thống để mua vé.'));
      navigate('/login');
      return;
    }

    if (totalSelectedTickets === 0) return;

    try {
      // 1. [Tạm ẩn] Phân tích Hành vi (AI Behavior Analysis)
      // const behaviorData = getBehaviorData();
      const behaviorData = null;

      // 2. [Tạm ẩn] Lấy reCAPTCHA Token ẩn (Invisible AI)
      let captchaToken = null;
      /*
      if (executeRecaptcha) {
        captchaToken = await executeRecaptcha('checkout');
      }
      */

      // 3. Gom dữ liệu đơn hàng
      const items = Object.entries(selectedTickets).map(([tierId, qty]) => ({
        ticket_tier_id: tierId,
        quantity: qty
      }));

      const orderData = {
        event_id: event.id,
        items,
        behaviorData,    // Truyền dữ liệu AI xuống Backend
        captchaToken
      };

      // 4. Bắn API tạo Đơn hàng (Backend chạy check AI)
      const res = await orderService.createPrimaryOrder(orderData);
      
      toast.success(res.message || t('eventDetail.orderSuccess', 'Đã giữ chỗ thành công!'));
      
      // Thành công => Điều hướng sang trang chọn phương thức thanh toán
      navigate(`/checkout/${res.data.id}`);

    } catch (error) {
      console.error("Checkout Error:", error);
      // Nếu Backend phát hiện Bot (HTTP 403), show lỗi màu đỏ gắt lên
      const errorMsg = error.response?.data?.error || t('eventDetail.orderFailed', 'Lỗi hệ thống. Vui lòng thử lại.');
      toast.error(errorMsg, { duration: 5000, icon: '🛡️' });
    }
  };

  return (
    <div className="bg-white dark:bg-[#0a0a0c] mt-12 min-h-screen font-sans selection:bg-neon-green/30 text-gray-900 dark:text-white pb-10 transition-colors duration-500">
      
      {/* 🌟 1. HERO SECTION */}
      <section className="relative w-full pt-4 pb-16 md:pt-4 md:pb-6 overflow-hidden border-b border-gray-200 dark:border-white/5">
        {/* Cinematic Blurred Background */}
        <div className="absolute inset-0 z-0 hidden dark:block">
          <img 
            src={event.image_url || 'https://images.unsplash.com/photo-1540317580384-e5d43867caa6?q=80&w=1920&auto=format&fit=crop'} 
            alt={event.title}
            className="w-full h-full object-cover scale-125 blur-[100px] opacity-40 saturate-150"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0c]/40 via-[#0a0a0c]/80 to-[#0a0a0c]"></div>
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
        </div>
        
        {/* Light Mode Bright Background Gradient */}
        <div className="absolute inset-0 z-0 dark:hidden bg-gradient-to-br from-gray-50 via-white to-gray-100"></div>

        <div className="relative z-10 max-w-[1400px] mx-auto px-6">
          
          {/* Top Navigation */}
          <div className="flex justify-between items-center mb-4 w-full animate-in fade-in slide-in-from-top-4 duration-700">
            <button 
              onClick={() => navigate(-1)}
              className="flex items-center gap-3 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all font-medium group"
            >
              <div className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-800 flex items-center justify-center group-hover:border-gray-400 dark:group-hover:border-white transition-colors bg-white/50 dark:bg-[#0a0a0c]/50 backdrop-blur-md">
                <ArrowLeft className="w-4 h-4" />
              </div>
              {t('eventDetail.back', 'Quay lại')}
            </button>
          </div>

          {/* Premium Split Layout */}
          <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-center lg:items-start">
            
            {/* Left Column: Event Poster */}
            <div className="w-full lg:w-[370px] shrink-0 animate-in fade-in slide-in-from-bottom-8 duration-1000">
               <div className="relative aspect-[3/4] rounded-[2.5rem] p-3 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 backdrop-blur-2xl shadow-xl dark:shadow-[0_0_80px_rgba(82,196,45,0.15)] group mx-auto max-w-sm lg:max-w-none transform transition-transform duration-700 hover:-translate-y-2">
                 <div className="w-full h-full rounded-[2rem] overflow-hidden relative border border-gray-100 dark:border-transparent">
                    <img 
                      src={event.image_url || 'https://images.unsplash.com/photo-1540317580384-e5d43867caa6?q=80&w=800&auto=format&fit=crop'} 
                      className="w-full h-full object-cover transform transition-transform duration-1000 group-hover:scale-110"
                      alt="Event Poster"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 dark:opacity-80"></div>
                 </div>
                 
                 {/* Live Status Badge */}
                 <div className="absolute top-8 left-8">
                    <div className="px-4 py-1.5 bg-neon-green text-black font-black text-[10px] rounded-xl flex items-center gap-2 shadow-[0_0_20px_rgba(82,196,45,0.6)] animate-pulse-slow">
                      <Sparkles className="w-4 h-4" /> {t('eventDetail.onSale', 'Đang mở bán')}
                    </div>
                 </div>
               </div>
            </div>

            {/* Right Column: Event Info */}
            <div className="flex-1 w-full animate-in fade-in slide-in-from-bottom-12 duration-1000 pt-4">
               {/* Tags & Category */}
               <div className="flex flex-wrap items-center gap-3 mb-6">
                 <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10 backdrop-blur-md">
                    <Tag className="w-4 h-4 text-neon-green" />
                    <span className="text-[10px] font-black uppercase text-gray-500 dark:text-gray-300">
                      {event.category?.name || t('eventDetail.musicEvent', 'Sự kiện âm nhạc')}
                    </span>
                 </div>
                 {/* Removed: "Có hoàn vé" element as requested */}
               </div>
               
               <h1 className="text-2xl lg:text-3xl font-black text-gray-900 dark:text-white leading-[1.05] mb-6 uppercase tracking-tighter drop-shadow-sm dark:drop-shadow-2xl">
                  {event.title}
               </h1>

               {/* Grid Info Boxes */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6 w-full xl:max-w-[750px]">
                  <div className="p-5 rounded-[2rem] bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 backdrop-blur-xl hover:bg-gray-50 dark:hover:bg-white/10 transition-colors flex items-start gap-4 shadow-sm dark:shadow-none">
                     <div className="w-14 h-14 bg-gray-100 dark:bg-black/50 rounded-[1.25rem] flex items-center justify-center shrink-0 border border-gray-200 dark:border-white/5">
                        <Calendar className="w-6 h-6 text-neon-green" />
                     </div>
                     <div className="pt-1">
                        <p className="text-[10px] uppercase text-gray-500 dark:text-gray-400 font-bold mb-1.5 flex items-center gap-1.5"><Clock className="w-3 h-3"/>{t('eventDetail.time', 'Thời gian')}</p>
                        <p className="font-bold text-gray-900 dark:text-white text-[15px]">{formattedDate}</p>
                        <p className="text-[13px] text-neon-green font-medium mt-1 ">{event.event_time || t('eventDetail.pendingUpdate', 'Đang cập nhật')}</p>
                     </div>
                  </div>

                  <div className="p-5 rounded-[2rem] bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 backdrop-blur-xl hover:bg-gray-50 dark:hover:bg-white/10 transition-colors flex items-start gap-4 shadow-sm dark:shadow-none">
                     <div className="w-14 h-14 bg-gray-100 dark:bg-black/50 rounded-[1.25rem] flex items-center justify-center shrink-0 border border-gray-200 dark:border-white/5">
                        <MapPin className="w-6 h-6 text-neon-green" />
                     </div>
                     <div className="pt-1 overflow-hidden">
                        <p className="text-[10px] uppercase text-gray-500 dark:text-gray-400 font-bold mb-1.5 flex items-center gap-1.5"><Map className="w-3 h-3"/>{t('eventDetail.location', 'Địa điểm')}</p>
                        <p className="font-bold text-gray-900 dark:text-white text-[15px] truncate">{event.location_address || t('eventDetail.pendingUpdate', 'Đang chờ cập nhật')}</p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                           {event.latitude && event.longitude ? (
                              <button onClick={() => document.getElementById('map-section')?.scrollIntoView({ behavior: 'smooth' })} className="text-[11px] font-bold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mt-1.5 inline-flex items-center gap-1 uppercase transition-colors"><ChevronRight className="w-3 h-3" /> {t('eventDetail.map', 'Bản đồ')}</button>
                           ) : (
                              <a href={`https://maps.google.com/?q=${event.location_address}`} target="_blank" rel="noreferrer" className="text-[11px] font-bold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mt-1.5 inline-flex items-center gap-1 uppercase  transition-colors"><ChevronRight className="w-3 h-3" /> {t('eventDetail.map', 'Bản đồ')}</a>
                           )}
                        </div>
                     </div>
                  </div>
               </div>

               {/* Organizer Quick Profile */}
               <Link 
                 to={`/organizers/${event.organizer?.id}`}
                 className="flex items-center gap-5 p-5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 backdrop-blur-xl rounded-[2rem] mb-6 max-w-[400px] shadow-sm dark:shadow-none hover:border-neon-green/50 hover:bg-gray-50 dark:hover:bg-white/10 transition-all group"
               >
                  <div className="relative">
                    <img 
                      src={event.organizer?.user?.avatar_url || `https://ui-avatars.com/api/?name=${event.organizer?.organization_name}&background=111&color=fff`}
                      className="w-16 h-14 rounded-full border-2 border-neon-green/30 object-cover group-hover:scale-105 transition-transform"
                      alt="Organizer"
                    />
                    {event.organizer?.is_verified && (
                      <div className="absolute bottom-0 right-0 w-5 h-5 bg-blue-500 rounded-full border-2 border-white dark:border-[#1a1a1c] flex items-center justify-center shadow-lg">
                        <CheckCircle2 className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">{t('eventDetail.organizer', 'Ban tổ chức')}</p>
                    <p className="font-black text-l text-gray-900 dark:text-white tracking-tight group-hover:text-neon-green transition-colors">{event.organizer?.organization_name}</p>
                  </div>
               </Link>

               {/* Buy Box & Auxiliary Controls Wrapper */}
               <div className="flex flex-col md:flex-row items-center gap-10 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300 w-full mt-4">
                  {/* Price Action Highlights */}
                  <div className="flex flex-col lg:flex-row items-center justify-between gap-6 p-2 lg:pr-2 pl-4 lg:pl-8 bg-gray-900 dark:bg-[#111114] rounded-[2rem] lg:rounded-full border border-gray-800 dark:border-white/10 flex-1 w-full relative overflow-hidden group shadow-xl dark:shadow-2xl">
                     {/* Decorative ambient light */}
                     <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-32 h-32 bg-neon-green/20 rounded-full blur-[50px] pointer-events-none group-hover:bg-neon-green/30 transition-colors"></div>
                     
                     <div className="relative z-10 py-5 lg:py-0 w-full lg:w-auto text-center lg:text-left">
                        <p className="text-[13px] font-bold text-gray-400 mb-1">{t('eventDetail.lowestPriceFrom', 'Vé rẻ nhất chỉ từ')}</p>
                        <p className="text-xl xl:text-xl font-black text-neon-green tracking-tighter filter drop-shadow-[0_0_10px_rgba(82,196,45,0.4)]">
                           {lowestPrice === 0 ? t('eventDetail.free', 'MIỄN PHÍ') : formatPrice(lowestPrice)}
                        </p>
                     </div>
                     <button 
                       onClick={scrollToTickets}
                       className="relative z-8 w-full lg:w-auto px-4 xl:px-4 py-4 xl:py-4 bg-neon-green text-black font-black uppercase text-xs xl:text-xs  rounded-[1.5rem] lg:rounded-[2rem] hover:bg-white hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(82,196,45,0.3)] shrink-0"
                     >
                       {t('eventDetail.buyNow', 'CHỌN VÉ NGAY')} <ArrowLeft className="w-5 h-5 rotate-180" />
                     </button>
                  </div>

                  {/* Auxiliary Controls: Share, Heart */}
                  <div className="flex items-center gap-4 shrink-0 w-full md:w-auto justify-center md:justify-start">
                     <button className="flex-1 md:flex-none w-auto md:w-12 h-12 flex items-center justify-center rounded-[1.5rem] md:rounded-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/30 text-gray-700 dark:text-white hover:text-neon-green transition-all backdrop-blur-xl group shadow-sm">
                       <Share2 className="w-4 h-4 md:w-4 md:h-4 group-hover:scale-110 transition-transform" />
                     </button>
                     <button className="flex-1 md:flex-none w-auto md:w-12 h-12 flex items-center justify-center rounded-[1.5rem] md:rounded-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/30 text-gray-700 dark:text-white hover:text-pink-500 transition-all backdrop-blur-xl group shadow-sm">
                       <Heart className="w-4 h-4 md:w-4 md:h-4 group-hover:scale-110 transition-transform" />
                     </button>
                  </div>
               </div>

            </div>
          </div>
        </div>
      </section>

      {/* 📜 2. TICKET & CONTENT GRID */}
      <section className="max-w-[1400px] mx-auto px-6 mt-10 relative">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-14 items-start">
          
          {/* Main Context (Left) */}
          <div className="flex-1 w-full order-2 lg:order-1 space-y-8">
             <div className="bg-white dark:bg-[#111114] rounded-[2.5rem] p-8 md:p-10 border border-gray-200 dark:border-white/5 shadow-xl dark:shadow-2xl relative overflow-hidden transition-colors">
                <div className="absolute top-0 left-12 w-32 h-1 bg-gradient-to-r from-neon-green to-transparent"></div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-4 flex items-center gap-3">
                   {t('eventDetail.introduction', 'Giới thiệu sự kiện')}
                </h3>
                {/* Rich text container */}
                <div 
                  className="prose dark:prose-invert max-w-none prose-emerald
                             prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tight 
                             prose-a:text-neon-green hover:prose-a:text-neon-hover 
                             prose-p:text-gray-600 dark:prose-p:text-gray-300 prose-p:leading-[1.8] prose-p:text-[16px]
                             prose-li:text-gray-600 dark:prose-li:text-gray-300 prose-li:leading-[1.8]
                             prose-strong:text-gray-900 dark:prose-strong:text-white prose-strong:font-black
                             prose-img:rounded-[2rem] prose-img:border prose-img:border-gray-200 dark:prose-img:border-white/10 prose-img:shadow-xl dark:prose-img:shadow-2xl"
                  dangerouslySetInnerHTML={{ __html: event.description || `<p>${t('eventDetail.infoUpdating', 'Thông tin đang được cập nhật...')}</p>` }}
                />
             </div>
             
             {/* 🎬 VIDEO SECTION */}
             {event.video_url && (
                <div className="bg-white dark:bg-[#111114] rounded-[2.5rem] p-8 md:p-10 border border-gray-200 dark:border-white/5 shadow-xl dark:shadow-2xl relative overflow-hidden transition-colors mt-8">
                   <div className="absolute top-0 left-12 w-32 h-1 bg-gradient-to-r from-neon-green to-transparent"></div>
                   <h3 className="text-lg md:text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-8 flex items-center gap-3">
                      <Video className="w-7 h-7 text-neon-green" /> {t('eventDetail.introductionVideo', 'Video Giới Thiệu')}
                   </h3>
                   <div className="w-full aspect-video rounded-[2rem] overflow-hidden border border-gray-200 dark:border-white/10 shadow-sm relative group bg-black">
                      <video 
                        src={event.video_url} 
                        controls 
                        className="w-full h-full object-contain"
                        poster={event.image_url}
                      />
                   </div>
                </div>
             )}
             
             {/* 🎟️ SEATING CHART BLOCK */}
             {event.seating_charts && event.seating_charts.length > 0 && (
                <div className="bg-white dark:bg-[#111114] rounded-[2.5rem] p-8 md:p-10 border border-gray-200 dark:border-white/5 shadow-xl dark:shadow-2xl relative overflow-hidden transition-colors mt-8">
                   <div className="absolute top-0 left-12 w-32 h-1 bg-gradient-to-r from-neon-green to-transparent"></div>
                   <h3 className="text-lg md:text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-8 flex items-center gap-3">
                      <ImageIcon className="w-7 h-7 text-neon-green" /> {t('eventDetail.viewSeatingChart', 'Sơ đồ khu vực và hình ảnh')}
                   </h3>
                   <div className="space-y-6">
                      {event.seating_charts.map((chart, index) => (
                         <div 
                           key={index} 
                           onClick={() => { setCurrentSeatingIndex(index); setShowSeatingModal(true); }}
                           className="w-full rounded-[2rem] border border-gray-200 dark:border-white/10 overflow-hidden shadow-sm dark:shadow-[0_0_50px_rgba(255,255,255,0.02)] cursor-pointer group hover:border-neon-green/50 transition-colors"
                         >
                            <img 
                              src={chart} 
                              alt={`Seating Chart ${index + 1}`} 
                              className="w-full h-auto object-cover bg-gray-50 dark:bg-black/50 group-hover:scale-105 transition-transform duration-700" 
                            />
                         </div>
                      ))}
                   </div>
                </div>
             )}

             {/* 📍 EMBEDDED MAP BLOCK */}
             {event.latitude && event.longitude && (
                <div id="map-section" className="bg-white dark:bg-[#111114] rounded-[2.5rem] p-8 md:p-10 border border-gray-200 dark:border-white/5 shadow-xl dark:shadow-2xl relative overflow-hidden transition-colors mt-8">
                   <div className="absolute top-0 left-12 w-32 h-1 bg-gradient-to-r from-neon-green to-transparent"></div>
                   <h3 className="text-lg md:text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb- flex items-center gap-3">
                      <MapPin className="w-7 h-7 text-neon-green" /> {t('eventDetail.locationMap', 'Bản đồ địa điểm')}
                   </h3>
                   <p className="mb-5 text-sm md:text-base text-gray-600 dark:text-gray-400 font-medium flex items-start gap-2">
                     <Map className="w-5 h-5 shrink-0 mt-0.5" />
                     {event.location_address}
                   </p>
                   <div className="w-full aspect-[4/3] sm:aspect-video rounded-[2rem] overflow-hidden border border-gray-200 dark:border-white/10 shadow-sm relative group">
                      <iframe
                          width="100%"
                          height="100%"
                          frameBorder="0"
                          style={{ border: 0 }}
                          src={`https://maps.google.com/maps?q=${event.latitude},${event.longitude}&hl=vi&z=15&output=embed`}
                          allowFullScreen
                          className="grayscale-0 dark:grayscale-[30%] opacity-100 dark:opacity-90 hover:grayscale-0 hover:opacity-100 transition-all duration-700 w-full h-full"
                      />
                   </div>
                </div>
             )}

             {/* Note / Terms Box */}
             <div className="bg-orange-50 dark:bg-[#151210] border border-orange-200 dark:border-[#ff6b00]/20 rounded-[2.5rem] p-8 lg:p-10 relative overflow-hidden group transition-colors mt-8 lg:mt-8">
                <div className="absolute top-0 right-0 w-64 h-64 bg-orange-100 dark:bg-[#ff6b00]/5 rounded-full blur-[80px] group-hover:bg-orange-200 dark:group-hover:bg-[#ff6b00]/10 transition-colors"></div>
                <h4 className="text-orange-600 dark:text-[#ff6b00] font-black uppercase tracking-[0.2em] text-xs mb-6 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-orange-600 dark:bg-[#ff6b00]"></span> {t('eventDetail.importantNote', 'Lưu ý quan trọng')}
                </h4>
                <ul className="text-gray-600 dark:text-gray-400 text-sm space-y-4 font-medium leading-relaxed max-w-2xl relative z-10 list-none pl-0">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-orange-400 dark:text-[#ff6b00]/60 shrink-0 mt-0.5" />
                    {t('eventDetail.note1', 'Vui lòng kiểm tra kỹ hạng vé và thời gian trước khi thanh toán.')}
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-orange-400 dark:text-[#ff6b00]/60 shrink-0 mt-0.5" />
                    {t('eventDetail.note2', 'Vé đã mua không được hoàn trả dưới mọi hình thức trừ khi sự kiện bị hủy từ BTC.')}
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-orange-400 dark:text-[#ff6b00]/60 shrink-0 mt-0.5" />
                    {t('eventDetail.note3', 'Sự kiện sử dụng vé kỹ thuật số dưới dạng NFT sinh thái cao & Mã QR động bảo mật.')}
                  </li>
                </ul>
             </div>

             {/* 💬 COMMUNITY REVIEWS SECTION */}
             <EventReviews 
                eventId={event.id} 
                eventEndTime={event.end_date || event.event_date} 
             />
          </div>

          {/* Ticket Selection Area (Right Sticky Column) */}
          <div className="w-full lg:w-[400px] shrink-0 sticky top-20 order-1 lg:order-2" id="ticket-section">
             <div className="bg-white dark:bg-[#111114] rounded-[2.5rem] p-6 border border-gray-200 dark:border-white/5 shadow-xl dark:shadow-2xl relative transition-colors">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter flex items-center gap-3">
                    <Ticket className="w-5 h-5 text-neon-green" /> {t('eventDetail.buyTicket', 'Mua vé')}
                  </h3>
                  <div className="px-3 py-1 rounded-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-[13px] font-bold text-gray-500 dark:text-gray-400">
                    {event.ticket_tiers?.length || 0} {t('eventDetail.ticketCategories', 'hạng vé')}
                  </div>
                </div>

                <div className="space-y-2">
                  {event.ticket_tiers && event.ticket_tiers.length > 0 ? (
                    event.ticket_tiers.map(tier => {
                      const isSoldOut = tier.quantity_available === 0;
                      const selectedQty = selectedTickets[tier.id] || 0;
                      
                      return (
                      <div 
                        key={tier.id} 
                        className={`relative rounded-[2rem] border transition-all duration-300 overflow-hidden ${
                          isSoldOut 
                            ? 'border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-[#1a0f0f] opacity-60' 
                            : selectedQty > 0 
                              ? 'border-neon-green bg-gradient-to-b from-none dark:from-neon-green/5 to-transparent bg-green-50/50 dark:bg-transparent' 
                              : 'border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 hover:border-gray-300 dark:hover:border-white/30'
                        }`}
                      >
                         {/* Ticket design cutouts */}
                         <div className="absolute top-[4.5rem] -left-3 w-6 h-6 bg-white dark:bg-[#111114] rounded-full border-r border-gray-200 dark:border-white/10 transition-colors"></div>
                         <div className="absolute top-[4.5rem] -right-3 w-6 h-6 bg-white dark:bg-[#111114] rounded-full border-l border-gray-200 dark:border-white/10 transition-colors"></div>
                         
                         {/* Border Separator */}
                         <div className="absolute top-[4.5rem] inset-x-4 border-t border-dashed border-gray-200 dark:border-white/10 mt-3 transition-colors"></div>

                         <div className="p-7">
                            {/* Top part: Info */}
                            <div className="pb-6">
                              <h5 className="font-black text-gray-900 dark:text-white text-lg uppercase tracking-tight pr-4">{tier.tier_name}</h5>
                              {tier.benefits && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed max-w-[90%]">{tier.benefits}</p>
                              )}
                            </div>
                            
                            {/* Bottom part: Price & Action */}
                            <div className="pt-2 flex items-end justify-between">
                              <div>
                                <div className="text-[13px] font-black text-gray-400 dark:text-gray-500 mb-1">{t('eventDetail.unitPrice', 'Đơn giá')}</div>
                                <div className="text-xl font-black text-neon-green drop-shadow-sm">
                                  {parseFloat(tier.price) === 0 ? t('eventDetail.free', 'MIỄN PHÍ') : formatPrice(tier.price)}
                                </div>
                              </div>
                              
                              {/* Action Quantity Selection */}
                              <div className="flex flex-col items-end gap-2">
                                <span className={`text-[10px] font-black px-3 py-1.5 rounded-lg ${isSoldOut ? 'bg-red-500/20 text-red-600 dark:text-red-400' : 'bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-white/50 backdrop-blur-md'}`}>
                                  {isSoldOut ? t('eventDetail.soldOut', 'HẾT VÉ') : `${t('eventDetail.remaining', 'CÒN')} ${tier.quantity_available}`}
                                </span>
                                
                                {!isSoldOut && (
                                  <div className="flex items-center gap-1 bg-gray-100 dark:bg-black/50 p-1.5 rounded-2xl border border-gray-200 dark:border-white/10 backdrop-blur-md">
                                    <button 
                                      onClick={() => handleTicketChange(tier.id, -1, tier.quantity_available)}
                                      disabled={selectedQty === 0}
                                      className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${selectedQty > 0 ? 'bg-white dark:bg-white/10 hover:bg-gray-50 dark:hover:bg-white/20 text-gray-900 dark:text-white shadow-sm' : 'text-gray-300 dark:text-white/20 cursor-not-allowed'}`}
                                    >
                                      <Minus className="w-4 h-" />
                                    </button>
                                    <div className="w-10 text-center font-black text-lg text-gray-900 dark:text-white">
                                      {selectedQty}
                                    </div>
                                    <button 
                                      onClick={() => handleTicketChange(tier.id, 1, tier.quantity_available)}
                                      disabled={selectedQty >= tier.quantity_available}
                                      className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${selectedQty >= tier.quantity_available ? 'text-gray-300 dark:text-white/20 cursor-not-allowed' : 'bg-neon-green hover:bg-neon-hover text-black shadow-sm'}`}
                                    >
                                      <Plus className="w-4 h-4" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                         </div>
                      </div>
                    )})
                  ) : (
                    <div className="py- text-center border-2 border-dashed border-gray-200 dark:border-white/10 rounded-[2.5rem] bg-gray-50 dark:bg-white/5">
                      <Ticket className="w-12 h-12 text-gray-300 dark:text-white/20 mx-auto mb-4" />
                      <p className="text-gray-400 dark:text-gray-400 font-bold uppercase tracking-widest text-sm">{t('eventDetail.noTickets', 'Sự kiện chưa có vé')}</p>
                    </div>
                  )}
                </div>

             </div>
          </div>
          
        </div>
      </section>
      
      {/* 🚀 Sticky Header Action (Visible on Scroll down to identify event) */}
      <div className={`fixed top-0 inset-x-0 bg-white/90 dark:bg-[#0a0a0c]/80 backdrop-blur-2xl border-b border-gray-200 dark:border-white/5 z-40 transform transition-all duration-500 ${isScrolled && totalSelectedTickets === 0 ? 'translate-y-0 shadow-lg' : '-translate-y-full'}`}>
         <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
               <img src={event.image_url} alt="Thumbnail" className="w-14 h-14 rounded-2xl object-cover hidden sm:block border border-gray-200 dark:border-white/10" />
               <div>
                  <h3 className="font-black text-gray-900 dark:text-white text-sm md:text-base uppercase tracking-tighter truncate max-w-[200px] md:max-w-[400px]">{event.title}</h3>
                  <p className="text-[10px] font-black text-neon-green uppercase tracking-[0.2em] mt-0.5">{formattedDate}</p>
               </div>
            </div>
            <button 
                onClick={scrollToTickets}
                className="px-8 py-3.5 bg-neon-green text-black font-black uppercase text-xs tracking-[0.2em] rounded-[1.5rem] hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-colors shadow-lg shadow-neon-green/20"
            >
              {t('eventDetail.buyTicket', 'MUA VÉ')}
            </button>
         </div>
      </div>
      {/* 💳 Floating Payment Checkout Bar (Visible when tickets are selected) */}
      <div className={`fixed bottom-0 inset-x-0 z-50 transform transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${totalSelectedTickets > 0 ? 'translate-y-0' : 'translate-y-[150%]'}`}>
         {/* Gradient fade to hide content behind bar */}
         <div className="absolute bottom-[100%] inset-x-0 h-32 bg-gradient-to-t from-white dark:from-[#0a0a0c] to-transparent pointer-events-none transition-colors"></div>
         
         <div className="px-4 pb-4 md:px-6 md:pb-6 max-w-[1400px] mx-auto">
           <div className="bg-gray-900/90 dark:bg-white/10 backdrop-blur-3xl border border-gray-800 dark:border-white/20 shadow-[0_-20px_80px_rgba(0,0,0,0.1)] dark:shadow-[0_-20px_80px_rgba(0,0,0,0.8)] rounded-[2.5rem] p-4 pr-4 pl-6 md:pl-10 flex flex-col sm:flex-row items-center justify-between gap-4 md:gap-8 transition-colors">
              
              <div className="flex items-center gap-6 w-full sm:w-auto overflow-hidden">
                <div className="w-12 h-12 bg-neon-green/10 rounded-[1.5rem] flex items-center justify-center shrink-0 border border-neon-green/30 relative">
                  <ShoppingCart className="w-5 h-5 text-neon-green" />
                  <div className="absolute -top-0.5 -right-1 w-5 h-5 bg-white text-black font-black flex items-center justify-center rounded-full text-xs shadow-lg animate-bounce duration-500">
                    {totalSelectedTickets}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase text-gray-400 mb-1">{t('eventDetail.subtotal', 'Tổng Tạm Tính')}</div>
                  <div className="text-xl md:text-xl font-black text-white tracking-tighter truncate max-w-[200px] md:max-w-none">
                    {totalPrice === 0 ? t('eventDetail.free', 'MIỄN PHÍ') : formatPrice(totalPrice)}
                  </div>
                </div>
              </div>

              <button 
                onClick={handleCheckout}
                disabled={totalSelectedTickets === 0}
                className="w-full sm:w-auto px-10 py-5 bg-neon-green hover:bg-white hover:scale-105 active:scale-95 text-black font-black uppercase text-sm rounded-[2rem] transition-all flex items-center justify-center gap-3 shadow-[0_10px_40px_rgba(82,196,45,0.4)] disabled:opacity-50 disabled:pointer-events-none"
              >
                {t('eventDetail.checkoutNow', 'Thanh toán ngay')} <ChevronRight className="w-5 h-5" />
              </button>
              
           </div>
         </div>
      </div>



      {/* 🖼️ SEATING CHART MODAL */}
      {showSeatingModal && event.seating_charts && event.seating_charts.length > 0 && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
           <div className="w-full max-w-5xl rounded-[2.5rem] border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-300 bg-[#0a0a0c]">
              
              <div className="p-4 sm:p-6 border-b border-white/10 flex items-center justify-between bg-black/50 backdrop-blur-md absolute top-0 inset-x-0 z-20">
                 <div>
                    <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                       <ImageIcon className="w-5 h-5 text-neon-green" /> {t('eventDetail.viewSeatingChart', 'Sơ đồ khu vực')}
                    </h3>
                    <p className="text-xs text-neon-green mt-1 font-bold tracking-widest uppercase">
                      {t('eventDetail.image', 'Ảnh')} {currentSeatingIndex + 1} / {event.seating_charts.length}
                    </p>
                 </div>
                 <button 
                   onClick={() => setShowSeatingModal(false)}
                   className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center transition-colors border border-white/10 group"
                 >
                   <X className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                 </button>
              </div>

              <div className="w-full h-[70vh] md:h-[80vh] relative flex items-center justify-center overflow-auto p-4 pt-24 bg-[#0a0a0c]">
                 <img 
                   src={event.seating_charts[currentSeatingIndex]} 
                   alt={`Seating Chart ${currentSeatingIndex + 1}`}
                   className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
                 />
                 
                 {event.seating_charts.length > 1 && (
                   <>
                     <button 
                       onClick={() => setCurrentSeatingIndex(prev => prev === 0 ? event.seating_charts.length - 1 : prev - 1)}
                       className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 hover:bg-neon-green text-white hover:text-black rounded-full flex items-center justify-center backdrop-blur-md transition-all border border-white/10 shadow-xl z-20"
                     >
                       <ChevronLeft className="w-6 h-6" />
                     </button>
                     <button 
                       onClick={() => setCurrentSeatingIndex(prev => prev === event.seating_charts.length - 1 ? 0 : prev + 1)}
                       className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 hover:bg-neon-green text-white hover:text-black rounded-full flex items-center justify-center backdrop-blur-md transition-all border border-white/10 shadow-xl z-20"
                     >
                       <ChevronRight className="w-6 h-6" />
                     </button>
                   </>
                 )}
              </div>
           </div>
        </div>
      )}

    </div>
  );
};

export default PublicEventDetail;

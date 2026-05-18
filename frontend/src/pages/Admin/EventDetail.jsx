import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Calendar,
  MapPin,
  Clock,
  Tag,
  Building2,
  Shield,
  Ticket,
  ShoppingBag,
  ArrowLeft,
  ExternalLink,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Package,
  TrendingUp,
  ShieldCheck,
  User,
  Zap,
  CalendarDays,
  DollarSign,
  History,
  FileText,
  Wallet,
  Globe,
  Eye,
  Star,
  Users,
  ChevronLeft,
  ChevronRight,
  Search,
  Image,
  Play,
  Layout
} from 'lucide-react';
import { adminService } from '../../services/admin.service';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell,
  CartesianGrid
} from 'recharts';

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedTier, setSelectedTier] = useState(null);
  const [tierTab, setTierTab] = useState('overview');
  const [txSearch, setTxSearch] = useState('');
  const [txStatusFilter, setTxStatusFilter] = useState('');
  const [txPage, setTxPage] = useState(1);
  const [ownerSearch, setOwnerSearch] = useState('');
  const [ownerFilter, setOwnerFilter] = useState('all');
  const [ownerPage, setOwnerPage] = useState(1);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('');
  const [orderPage, setOrderPage] = useState(1);
  const [productSearch, setProductSearch] = useState('');
  const [productPage, setProductPage] = useState(1);
  const [blogTypeFilter, setBlogTypeFilter] = useState('all');
  const [logPage, setLogPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Reset pages on search/filter change
  useEffect(() => { setTxPage(1); }, [txSearch, txStatusFilter]);
  useEffect(() => { setOwnerPage(1); }, [ownerSearch, ownerFilter]);
  useEffect(() => { setOrderPage(1); }, [orderSearch, orderStatusFilter]);
  useEffect(() => { setProductPage(1); }, [productSearch]);
  const tabContainerRef = useRef(null);

  useEffect(() => {
    // Scroll active tab into view
    const activeBtn = tabContainerRef.current?.querySelector(`[data-tab-id="${activeTab}"]`);
    if (activeBtn) {
      activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeTab]);

  useEffect(() => {
    fetchEventDetail();
  }, [id]);

  const fetchEventDetail = async () => {
    try {
      setLoading(true);
      const data = await adminService.getEventById(id);
      setEvent(data);
    } catch (error) {
      toast.error('Lỗi khi tải thông tin sự kiện');
      navigate('/admin/events');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (window.confirm('Bạn có chắc chắn muốn PHÊ DUYỆT và CÔNG KHAI sự kiện này? Smart Contract sẽ được triển khai.')) {
      try {
        setIsProcessing(true);
        const res = await adminService.approveEvent(id, { action: 'approve' });
        toast.success(`Phê duyệt thành công!`);
        fetchEventDetail();
      } catch (error) {
        toast.error('Phê duyệt thất bại');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleReject = async () => {
    const reason = window.prompt('Lý do từ chối (Gửi cho BTC):');
    if (reason !== null) {
      try {
        await adminService.approveEvent(id, { action: 'reject', reason });
        toast.success('Đã từ chối sự kiện');
        fetchEventDetail();
      } catch (error) {
        toast.error('Thao tác thất bại');
      }
    }
  };

  const handleForceCancel = async (confirmFeePaid) => {
    const actionMsg = confirmFeePaid
      ? 'Bạn có chắc chắn xác nhận BTC đã nộp đủ phí bồi hoàn và CHÍNH THỨC HỦY sự kiện này?\nHệ thống sẽ đóng băng hợp đồng, gửi email thông báo và chuyển toàn bộ đơn hàng sang CHỜ HOÀN TIỀN.'
      : 'Bạn muốn gửi yêu cầu Ban tổ chức nộp phí bồi hoàn hủy sự kiện (Phí hệ thống, Dịch vụ, Gas)?';
      
    if (window.confirm(actionMsg)) {
      const reason = window.prompt('Nhập lý do hủy sự kiện (sẽ được đính kèm trong email thông báo):', 'Sự kiện không thể tiếp tục diễn ra theo kế hoạch.');
      if (reason !== null) {
        try {
          setIsProcessing(true);
          const res = await adminService.forceCancelEvent(id, { reason, confirm_fee_paid: confirmFeePaid });
          toast.success(res.message || 'Xử lý thành công!');
          fetchEventDetail();
        } catch (error) {
          toast.error(error.response?.data?.error || 'Lỗi xử lý hủy sự kiện');
        } finally {
          setIsProcessing(false);
        }
      }
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-vh-[400px] space-y-4 pt-20">
      <div className="w-12 h-12 border-4 border-neon-green/20 border-t-neon-green rounded-full animate-spin" />
      <p className="text-gray-600 font-black animate-pulse uppercase text-[10px] tracking-widest">Đang bóc tách dữ liệu show...</p>
    </div>
  );

  if (!event) return null;

  return (
    <div className="space-y-4 animate-in fade-in duration-500 max-w-[1600px] mx-auto">
      {/* Header - Modern & Compact */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => navigate('/admin/events')}
            className="p-2 sm:p-2.5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl hover:bg-gray-50 dark:hover:bg-white/10 transition-all text-gray-500 group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          </button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight truncate">Chi tiết Sự kiện</h1>
              <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase border shrink-0 ${
                event.status === 'active' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 
                event.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                event.status === 'pending_cancel' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                event.status === 'pending_cancellation_fee' ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' :
                event.status === 'pending_reschedule' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                'bg-gray-500/10 text-gray-600 border-white/5'
              }`}>
                {event.status === 'active' ? 'ĐANG HOẠT ĐỘNG' : 
                 event.status === 'pending' ? 'CHỜ DUYỆT' :
                 event.status === 'pending_cancel' ? 'CHỜ HỦY KHẨN CẤP' :
                 event.status === 'pending_cancellation_fee' ? 'CHỜ NỘP PHÍ HỦY' :
                 event.status === 'pending_reschedule' ? 'CHỜ DỜI LỊCH' :
                 event.status === 'cancelled' ? 'ĐÃ HỦY' :
                 'BẢN NHÁP'}
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-gray-700 font-bold font-mono opacity-60 flex items-center mt-0.5 truncate">
               ID: {event.id}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {event.status === 'active' && (
            <button 
              onClick={() => handleForceCancel(false)}
              disabled={isProcessing}
              className="px-4 py-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl font-black text-[10px] uppercase hover:bg-red-500 hover:text-white transition-all disabled:opacity-50"
            >
              Hủy Sự kiện
            </button>
          )}
          {event.status === 'pending_cancellation_fee' && (
            <button 
              onClick={() => handleForceCancel(true)}
              disabled={isProcessing}
              className="px-6 py-2 bg-purple-600 text-white rounded-xl font-black text-[10px] uppercase hover:bg-purple-700 transition-all shadow-lg shadow-purple-600/20 disabled:opacity-50 animate-pulse"
            >
              Xác nhận Đã Nộp Phí & Hủy
            </button>
          )}
          {event.status === 'pending' && (
            <>
              <button 
                onClick={handleReject}
                disabled={isProcessing}
                className="px-4 py-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl font-black text-[10px] uppercase hover:bg-red-500 hover:text-white transition-all disabled:opacity-50"
              >
                Từ chối
              </button>
              <button 
                onClick={handleApprove}
                disabled={isProcessing}
                className="px-6 py-2 bg-neon-green text-black rounded-xl font-black text-[10px] uppercase hover:bg-neon-hover transition-all shadow-lg shadow-neon-green/20"
              >
                Phê duyệt & Public
              </button>
            </>
          )}
          <button 
            onClick={() => window.open(`${window.location.origin}/events/${event.id}`, '_blank')}
            className="p-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-500 hover:text-neon-green transition-all"
            title="Xem trang công khai"
          >
            <Globe className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Profile Sidebar (4/12) */}
        <div className="lg:col-span-4 space-y-5">
          {/* Main Card */}
          <div className="bg-white dark:bg-[#111114] border border-gray-200 dark:border-white/5 rounded-3xl overflow-hidden shadow-sm">
            <div className="aspect-[16/9] relative overflow-hidden group">
              {event.image_url ? (
                <img src={event.image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              ) : (
                <div className="w-full h-full bg-gray-100 dark:bg-white/5 flex items-center justify-center">
                  <CalendarDays className="w-12 h-12 text-gray-200" />
                </div>
              )}
              <div className="absolute top-4 left-4">
                 <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 flex items-center space-x-2">
                    <Tag className="w-3 h-3 text-neon-green" />
                    <span className="text-[10px] font-black text-white uppercase tracking-tight">{event.category?.name}</span>
                 </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
               <div>
                  <h3 className="text-xl font-black text-gray-900 dark:text-white leading-tight uppercase mb-3 line-clamp-2">
                    {event.title}
                  </h3>
                  <button 
                    onClick={() => navigate(`/admin/users/${event.organizer?.user_id}`)}
                    className="w-full flex items-center space-x-3 p-3 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 hover:border-neon-green/30 transition-all group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 flex-shrink-0">
                       <Building2 className="w-5 h-5" />
                    </div>
                    <div className="text-left min-w-0">
                       <p className="text-[11px] font-black text-gray-600 uppercase tracking-widest mb-0.5">Ban Tổ Chức</p>
                       <p className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate group-hover:text-neon-green transition-colors">
                         {event.organizer?.organization_name}
                       </p>
                    </div>
                  </button>
               </div>

               <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 text-center transition-all hover:border-neon-green/30">
                     <p className="text-[10px] font-black text-gray-600 uppercase mb-1 flex items-center justify-center">
                        <Ticket className="w-3 h-3 mr-1 text-neon-green" />
                        Đã bán
                     </p>
                     <p className="text-xl font-black text-neon-green">{event._count.tickets}</p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 text-center transition-all hover:border-blue-500/30">
                     <p className="text-[10px] font-black text-gray-600 uppercase mb-1 flex items-center justify-center">
                        <ShoppingBag className="w-3 h-3 mr-1 text-blue-500" />
                        Số lượng Đơn
                     </p>
                     <p className="text-xl font-black text-blue-500">{event._count.orders}</p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 text-center transition-all hover:border-orange-500/30">
                     <p className="text-[10px] font-black text-gray-600 uppercase mb-1 flex items-center justify-center">
                        <TrendingUp className="w-3 h-3 mr-1 text-orange-500" />
                        Thực thu BTC
                     </p>
                     <p className="text-base font-black text-orange-500 truncate">{parseFloat(event.financials?.net_revenue || 0).toLocaleString()}đ</p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 text-center transition-all hover:border-purple-500/30">
                     <p className="text-[10px] font-black text-gray-600 uppercase mb-1 flex items-center justify-center">
                        <ShieldCheck className="w-3 h-3 mr-1 text-purple-500" />
                        Hoa hồng HT
                     </p>
                     <p className="text-base font-black text-purple-500 truncate">{parseFloat(event.financials?.system_commission || 0).toLocaleString()}đ</p>
                  </div>
               </div>

               <div className="space-y-3 pt-3 border-t border-gray-100 dark:border-white/5">
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-gray-600 uppercase tracking-widest">Phí Bản quyền:</span>
                    <span className="text-gray-900 dark:text-gray-100">{event.royalty_fee_percent}%</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-gray-400 uppercase tracking-widest">Hoàn tiền:</span>
                    <span className={event.allow_refund ? 'text-neon-green' : 'text-red-500'}>
                      {event.allow_refund ? 'Được phép (Admin duyệt)' : 'Vô hiệu hóa'}
                    </span>
                  </div>
               </div>
            </div>
          </div>

          {/* Infrastructure Stats */}
          <div className="bg-white dark:bg-[#111114] border border-gray-200 dark:border-white/5 rounded-3xl p-6 shadow-sm">
             <h4 className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-4 flex items-center space-x-2">
                <Shield className="w-3.5 h-3.5 text-blue-500" />
                <span>Số liệu Hạ tầng</span>
             </h4>
             <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                   <div className="flex items-center space-x-2">
                      <Zap className="w-4 h-4 text-yellow-500" />
                      <span className="text-[11px] font-bold text-gray-600 dark:text-gray-400 uppercase">Tin bán lại (Resale)</span>
                   </div>
                   <span className="text-sm font-black text-gray-900 dark:text-gray-100">{event._count.marketplace_listings}</span>
                </div>
                <div className="space-y-2">
                   <p className="text-[9px] font-black text-gray-400 uppercase">Địa chỉ Smart Contract</p>
                   <div className="bg-gray-100 dark:bg-black/40 rounded-xl p-3 border border-gray-200 dark:border-white/5 font-mono text-[10px] break-all leading-relaxed text-gray-500 dark:text-gray-400">
                      {event.smart_contract_address || 'Hệ thống chưa triển khai chuỗi (Blockchain)'}
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* Dynamic Detail Section (8/12) */}
        <div className="lg:col-span-8 space-y-5">
           {/* Tab Navigation with Scroll Arrows - matching UserDetail style */}
           <div className="relative group/tabs flex items-center">
             <button 
               onClick={() => {
                 if (tabContainerRef.current) {
                   tabContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
                 }
               }}
               className="absolute left-1 z-10 p-1.5 bg-white/90 dark:bg-black/90 rounded-full border border-gray-200 dark:border-white/10 shadow-md opacity-0 group-hover/tabs:opacity-100 transition-opacity"
             >
               <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
             </button>

             <div 
               ref={tabContainerRef}
               className="flex items-center space-x-1 p-1 bg-white dark:bg-[#111114] border border-gray-200 dark:border-white/5 rounded-2xl overflow-x-auto no-scrollbar scroll-smooth shadow-sm"
             >
               {[
                 { id: 'overview', label: 'Tổng quan', icon: Info },
                 { id: 'tiers', label: `Hạng vé (${event.ticket_tiers?.length || 0})`, icon: Ticket },
                 { id: 'orders', label: `Đơn hàng (${event.recent_orders?.length || 0})`, icon: ShoppingBag },
                 { id: 'products', label: `Sản phẩm (${event.merchandise?.length || 0})`, icon: Package },
                 { id: 'blogs', label: `Tin tức (${event.blogs?.length || 0})`, icon: FileText },
                 { id: 'logs', label: 'Nhật ký Hoạt động', icon: History },
                 { id: 'location', label: 'Vị trí Map', icon: MapPin }
               ].map((tab) => (
                 <button
                   key={tab.id}
                   data-tab-id={tab.id}
                   onClick={() => setActiveTab(tab.id)}
                   className={`flex-shrink-0 flex items-center space-x-2 px-5 py-2.5 rounded-xl text-[11px] font-bold uppercase transition-all ${
                     activeTab === tab.id 
                       ? 'bg-neon-green text-black shadow-lg shadow-neon-green/20 scale-[1.02]' 
                       : 'text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'
                   }`}
                 >
                   <tab.icon className={`w-3.5 h-3.5 shrink-0 ${activeTab === tab.id ? 'animate-pulse' : 'opacity-60'}`} />
                   <span className="whitespace-nowrap">{tab.label}</span>
                 </button>
               ))}
             </div>

             <button 
               onClick={() => {
                 if (tabContainerRef.current) {
                   tabContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
                 }
               }}
               className="absolute right-1 z-10 p-1.5 bg-white/90 dark:bg-black/90 rounded-full border border-gray-200 dark:border-white/10 shadow-md opacity-0 group-hover/tabs:opacity-100 transition-opacity"
             >
               <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
             </button>
           </div>

           {/* Tab Content Display */}
           <div className="bg-white dark:bg-[#111114] border border-gray-200 dark:border-white/5 rounded-3xl p-8 shadow-sm min-h-[600px]">
              {activeTab === 'overview' && (
                <div className="space-y-8 animate-in fade-in duration-300">
                   {/* Emergency Request Section */}
                   {['pending_cancel', 'pending_cancellation_fee', 'pending_reschedule'].includes(event.status) && event.emergency_requests?.length > 0 && (
                     <div className="bg-red-500/5 dark:bg-red-500/10 border-2 border-red-500/20 rounded-[2rem] p-8 space-y-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-[60px] -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-1000" />
                        
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative">
                          <div className="flex items-center space-x-4">
                            <div className="w-14 h-14 bg-red-500 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/30">
                              <AlertTriangle className="w-8 h-8 text-white animate-pulse" />
                            </div>
                            <div>
                              <h3 className="text-xl font-black text-red-600 dark:text-red-400 uppercase tracking-tight">Yêu cầu xử lý khẩn cấp</h3>
                              <p className="text-sm text-gray-500 font-bold uppercase italic">Loại yêu cầu: {['pending_cancel', 'pending_cancellation_fee'].includes(event.status) ? 'Hủy bỏ sự kiện' : 'Thay đổi lịch diễn'}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                             <span className="text-[10px] font-black text-gray-400 uppercase">Ngày gửi: {format(new Date(event.emergency_requests[0].created_at), 'dd/MM/yyyy HH:mm')}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                          <div className="space-y-4">
                            <div>
                              <label className="text-[10px] font-black text-red-500 uppercase mb-2 block ml-1 tracking-widest">Lý do từ BTC</label>
                              <div className="bg-white dark:bg-black/40 border border-red-500/20 p-5 rounded-2xl text-sm font-medium text-gray-700 dark:text-gray-300 italic leading-relaxed">
                                "{event.emergency_requests[0].reason}"
                              </div>
                            </div>
                            {event.status === 'pending_reschedule' && (
                              <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl">
                                    <p className="text-[9px] font-black text-orange-500 uppercase mb-1">Bắt đầu mới</p>
                                    <p className="text-sm font-black text-gray-900 dark:text-white">
                                      {event.emergency_requests[0].new_date ? format(new Date(event.emergency_requests[0].new_date), 'dd/MM/yyyy') : 'N/A'}
                                    </p>
                                    <p className="text-[11px] font-bold text-orange-600 mt-1">{event.emergency_requests[0].new_time || 'N/A'}</p>
                                  </div>
                                  <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-2xl">
                                    <p className="text-[9px] font-black text-purple-500 uppercase mb-1">Kết thúc mới</p>
                                    <p className="text-sm font-black text-gray-900 dark:text-white">
                                      {event.emergency_requests[0].new_end_date ? format(new Date(event.emergency_requests[0].new_end_date), 'dd/MM/yyyy') : 'N/A'}
                                    </p>
                                    <p className="text-[11px] font-bold text-purple-600 mt-1">{event.emergency_requests[0].new_end_time || 'N/A'}</p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          <div className="space-y-4">
                            <div>
                              <label className="text-[10px] font-black text-gray-500 uppercase mb-2 block ml-1 tracking-widest">Minh chứng đính kèm ({event.emergency_requests[0].evidence_urls?.length || 0})</label>
                              {event.emergency_requests[0].evidence_urls && event.emergency_requests[0].evidence_urls.length > 0 ? (
                                <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                  {event.emergency_requests[0].evidence_urls.map((url, idx) => (
                                    <div 
                                      key={idx}
                                      className="group/evidence relative aspect-[16/9] rounded-2xl overflow-hidden border border-gray-200 dark:border-white/10 bg-black cursor-pointer shadow-sm" 
                                      onClick={() => window.open(url, '_blank')}
                                    >
                                      <img src={url} alt={`Evidence ${idx + 1}`} className="w-full h-full object-cover group-hover/evidence:scale-105 transition-transform" />
                                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/evidence:opacity-100 transition-opacity flex items-center justify-center">
                                        <ExternalLink className="w-5 h-5 text-white" />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="aspect-[16/9] bg-gray-100 dark:bg-white/5 rounded-2xl flex items-center justify-center border border-dashed border-gray-300 dark:border-white/10">
                                  <p className="text-xs text-gray-400 italic font-medium">Không đính kèm minh chứng</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {event.status === 'pending_cancellation_fee' && (
                          <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-2xl flex items-center space-x-3">
                            <Info className="w-5 h-5 text-purple-500 shrink-0" />
                            <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 leading-relaxed">
                              Đã gửi thông báo yêu cầu BTC nộp phí bồi hoàn hủy sự kiện. Sau khi kiểm tra đối soát BTC đã thanh toán đủ, bấm nút xác nhận dưới đây để chính thức đóng băng hợp đồng và gửi thông báo hoàn tiền đến toàn bộ khách hàng.
                            </p>
                          </div>
                        )}

                        <div className="pt-4 border-t border-red-500/10 flex flex-col sm:flex-row items-center gap-3 relative">
                           <div className="flex-1 text-[11px] text-gray-500 font-bold italic leading-tight">
                              <Info className="w-3.5 h-3.5 inline-block mr-1 text-red-500" />
                              Hãy kiểm tra kỹ minh chứng trước khi đưa ra quyết định. Nếu duyệt, thông báo sẽ được gửi cho toàn bộ khách hàng đã mua vé.
                           </div>
                           <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-end">
                              <button 
                                onClick={handleReject}
                                disabled={isProcessing}
                                className="flex-1 sm:flex-none px-6 py-3 bg-white dark:bg-white/5 border border-red-500/30 text-red-500 rounded-xl font-black text-[10px] uppercase hover:bg-red-500 hover:text-white transition-all shadow-sm disabled:opacity-50"
                              >
                                Từ chối
                              </button>
                              {event.status === 'pending_cancel' && (
                                <button 
                                  onClick={() => handleForceCancel(false)}
                                  disabled={isProcessing}
                                  className="flex-1 sm:flex-none px-8 py-3 bg-red-500 text-white rounded-xl font-black text-[10px] uppercase hover:bg-red-600 transition-all shadow-lg shadow-red-500/20 disabled:opacity-50"
                                >
                                  Yêu cầu BTC Nộp phí Hủy
                                </button>
                              )}
                              {event.status === 'pending_cancellation_fee' && (
                                <button 
                                  onClick={() => handleForceCancel(true)}
                                  disabled={isProcessing}
                                  className="flex-1 sm:flex-none px-8 py-3 bg-purple-600 text-white rounded-xl font-black text-[10px] uppercase hover:bg-purple-700 transition-all shadow-lg shadow-purple-600/20 disabled:opacity-50 animate-pulse"
                                >
                                  Xác nhận Đã Nộp & Hủy Chính thức
                                </button>
                              )}
                              {event.status === 'pending_reschedule' && (
                                <button 
                                  onClick={handleApprove}
                                  disabled={isProcessing}
                                  className="flex-1 sm:flex-none px-10 py-3 bg-neon-green text-black rounded-xl font-black text-[10px] uppercase hover:bg-neon-hover transition-all shadow-lg shadow-neon-green/20 disabled:opacity-50"
                                >
                                  Duyệt Dời lịch
                                </button>
                              )}
                           </div>
                        </div>
                     </div>
                   )}
                   {/* Financial Stats Grid */}


                   {/* Date & Time Grid */}
                   <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-4 gap-4">
                      {[
                        { label: 'Ngày Bắt đầu', val: format(new Date(event.event_date), 'dd/MM/yyyy', { locale: vi }), icon: Calendar },
                        { label: 'Giờ Diễn', val: event.event_time || '--:--', icon: Clock },
                        { label: 'Ngày Kết thúc', val: event.end_date ? format(new Date(event.end_date), 'dd/MM/yyyy', { locale: vi }) : 'Trong ngày', icon: CalendarDays },
                        { label: 'Giờ Về', val: event.end_time || '--:--', icon: Clock }
                      ].map((item, i) => (
                        <div key={i} className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 flex flex-col items-center sm:items-start text-center sm:text-left">
                           <div className="flex items-center space-x-2 text-[9px] font-black text-gray-400 uppercase mb-1.5">
                              <item.icon className="w-3 h-3 text-neon-green opacity-70" />
                              <span>{item.label}</span>
                           </div>
                           <p className="text-sm font-bold text-gray-800 dark:text-gray-200 uppercase">{item.val}</p>
                        </div>
                      ))}
                   </div>

                   {/* Description & Banking */}
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                         <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center space-x-2">
                           <FileText className="w-4 h-4 text-neon-green" />
                           <span>Mô tả Sự kiện</span>
                         </h4>
                          <div
                            className="bg-gray-50/50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 p-6 rounded-3xl text-sm leading-relaxed text-gray-600 dark:text-gray-400 max-h-[250px] overflow-y-auto custom-scrollbar font-medium prose prose-sm dark:prose-invert max-w-none"
                            dangerouslySetInnerHTML={{ __html: event.description || "<p>Chưa cung cấp mô tả.</p>" }}
                           />
                       </div>
                       <div className="space-y-4">
                         <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center space-x-2">
                           <Building2 className="w-4 h-4 text-blue-500" />
                           <span>Hồ sơ Tài chính BTC</span>
                         </h4>
                         <div className="bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 p-6 rounded-3xl space-y-4">
                            <div className="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-white/5">
                               <span className="text-[10px] font-bold text-gray-400 uppercase">Ngân hàng</span>
                               <span className="text-sm font-black text-gray-800 dark:text-gray-200 uppercase tracking-tight">{event.organizer?.user?.bank_name || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-white/5">
                               <span className="text-[10px] font-bold text-gray-400 uppercase">Số tài khoản</span>
                               <span className="text-sm font-bold text-gray-800 dark:text-gray-200 font-mono tracking-widest">{event.organizer?.user?.account_number || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between items-center">
                               <span className="text-[10px] font-bold text-gray-400 uppercase">Chủ tài khoản</span>
                               <span className="text-sm font-black text-gray-800 dark:text-gray-200 uppercase">{event.organizer?.user?.account_holder || 'N/A'}</span>
                            </div>
                         </div>
                         <div className="p-4 bg-orange-500/5 border border-orange-500/10 rounded-2xl flex items-center space-x-3">
                            <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0" />
                            <p className="text-[10px] font-bold text-orange-500/80 leading-relaxed uppercase italic">Dữ liệu tài chính được xác thực qua eKYC trước khi show được duyệt.</p>
                         </div>
                      </div>
                   </div>

                   {/* Media & Seating Charts */}
                   {(event.seating_charts?.length > 0 || event.video_url) && (
                     <div className="grid grid-cols-1 gap-8 pt-4">
                        {event.seating_charts?.length > 0 && (
                          <div className="space-y-4">
                             <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center space-x-2">
                               <Layout className="w-4 h-4 text-purple-500" />
                               <span>Sơ đồ Chỗ ngồi</span>
                             </h4>
                             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                {event.seating_charts.map((url, idx) => (
                                   <div key={idx} className="group relative aspect-[4/3] rounded-2xl overflow-hidden border border-gray-100 dark:border-white/5 bg-white dark:bg-white/5 cursor-zoom-in hover:border-purple-500/50 transition-all">
                                      <img src={url} alt={`Sơ đồ ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                         <Eye className="w-5 h-5 text-white" />
                                      </div>
                                      <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/50 backdrop-blur-md rounded-md text-[8px] font-black text-white uppercase">Sơ đồ {idx + 1}</div>
                                   </div>
                                ))}
                             </div>
                          </div>
                        )}

                        {event.video_url && (
                          <div className="space-y-4">
                             <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center space-x-2">
                               <Play className="w-4 h-4 text-red-500" />
                               <span>Video Giới thiệu</span>
                             </h4>
                             <div className="p-1 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-3xl overflow-hidden max-w-2xl">
                                <div className="relative group aspect-video rounded-2xl overflow-hidden bg-black flex items-center justify-center">
                                   {event.video_url.includes('youtube.com') || event.video_url.includes('youtu.be') ? (
                                      <iframe
                                        className="w-full h-full"
                                        src={`https://www.youtube.com/embed/${event.video_url.split('v=')[1]?.split('&')[0] || event.video_url.split('/').pop()}`}
                                        title="Event Video"
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                      ></iframe>
                                   ) : (
                                      <video
                                        controls
                                        className="w-full h-full object-contain bg-black"
                                        poster={event.image_url}
                                      >
                                        <source src={event.video_url} />
                                        Trình duyệt của bạn không hỗ trợ phát video trực tiếp.
                                      </video>
                                   )}
                                </div>
                             </div>
                          </div>
                        )}
                     </div>
                   )}
                </div>
              )}

              {activeTab === 'tiers' && (
                <div className="animate-in fade-in duration-300">
                  {selectedTier ? (
                    // --- CHI TIẾT HẠNG VÉ ---
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => { setSelectedTier(null); setTierTab('overview'); }}
                          className="flex items-center space-x-1.5 text-xs font-semibold text-gray-400 hover:text-neon-green transition-colors group"
                        >
                          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                          <span>Quay lại danh sách</span>
                        </button>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-400">Hạng vé:</span>
                          <span className="text-xs font-bold text-gray-900 dark:text-white">{selectedTier.tier_name}</span>
                        </div>
                      </div>

                      {/* Sub-tab nav */}
                      <div className="flex space-x-1 p-1 bg-gray-100 dark:bg-white/5 rounded-xl">
                        {[
                          { id: 'overview', label: 'Tổng quan', icon: Info },
                          { id: 'transactions', label: `Giao dịch (${selectedTier._count?.tickets || 0})`, icon: ShoppingBag },
                          { id: 'owners', label: `Người sở hữu (${selectedTier._count?.tickets || 0})`, icon: Users }
                        ].map(t => (
                          <button
                            key={t.id}
                            onClick={() => setTierTab(t.id)}
                            className={`flex-1 flex items-center justify-center space-x-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                              tierTab === t.id
                                ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm'
                                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                          >
                            <t.icon className="w-3.5 h-3.5" />
                            <span>{t.label}</span>
                          </button>
                        ))}
                      </div>

                      {/* Sub-tab content */}
                      {tierTab === 'overview' && (
                        <div className="space-y-4 animate-in fade-in duration-200">
                          {/* Header */}
                          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                <Ticket className="w-5 h-5 text-blue-500" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-gray-900 dark:text-white">{selectedTier.tier_name}</p>
                                <p className="text-xs text-gray-400">{selectedTier.section_name || 'Khu vực Chung'}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-neon-green">{parseFloat(selectedTier.price).toLocaleString()} <span className="text-xs font-normal text-gray-400">VNĐ/vé</span></p>
                            </div>
                          </div>

                          {/* Stats */}
                          <div className="grid grid-cols-3 gap-3">
                            <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5 text-center">
                              <p className="text-xs text-gray-400 mb-1">Tổng phát hành</p>
                              <p className="text-xl font-bold text-gray-900 dark:text-white">{selectedTier.quantity_total}</p>
                            </div>
                            <div className="p-3 bg-neon-green/5 rounded-xl border border-neon-green/20 text-center">
                              <p className="text-xs text-neon-green mb-1">Đã bán</p>
                              <p className="text-xl font-bold text-neon-green">{selectedTier._count?.tickets || 0}</p>
                            </div>
                            <div className="p-3 bg-blue-500/5 rounded-xl border border-blue-500/20 text-center">
                              <p className="text-xs text-blue-500 mb-1">Còn lại</p>
                              <p className="text-xl font-bold text-blue-500">{selectedTier.quantity_total - (selectedTier._count?.tickets || 0)}</p>
                            </div>
                          </div>

                          {/* Progress */}
                          <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5 space-y-2">
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span>Tiến độ bán vé</span>
                              <span className="font-bold text-neon-green">
                                {selectedTier.quantity_total > 0 ? Math.round(((selectedTier._count?.tickets || 0) / selectedTier.quantity_total) * 100) : 0}%
                              </span>
                            </div>
                            <div className="h-2 w-full bg-gray-200 dark:bg-white/5 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-neon-green rounded-full shadow-[0_0_6px_rgba(50,255,100,0.4)] transition-all duration-1000"
                                style={{ width: `${selectedTier.quantity_total > 0 ? ((selectedTier._count?.tickets || 0) / selectedTier.quantity_total) * 100 : 0}%` }}
                              />
                            </div>
                            <p className="text-xs text-gray-400">
                              Doanh thu ước tính: <span className="font-bold text-orange-400">{(parseFloat(selectedTier.price) * (selectedTier._count?.tickets || 0)).toLocaleString()} đ</span>
                            </p>
                          </div>

                          {/* Benefits */}
                          <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5 space-y-2">
                            <div className="flex items-center space-x-2 mb-2">
                              <Star className="w-3.5 h-3.5 text-yellow-500" />
                              <h4 className="text-xs font-semibold text-gray-500">Quyền lợi đi kèm</h4>
                            </div>
                            {selectedTier.benefits ? (
                              <div className="space-y-1.5">
                                {selectedTier.benefits.split('\n').filter(b => b.trim()).map((benefit, i) => (
                                  <div key={i} className="flex items-start space-x-2">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-neon-green mt-0.5 shrink-0" />
                                    <span className="text-sm text-gray-600 dark:text-gray-400 leading-snug">{benefit.trim()}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-gray-400 italic">Không có quyền lợi đặc biệt.</p>
                            )}
                          </div>
                        </div>
                      )}

                      {tierTab === 'transactions' && (() => {
                        const filteredItems = (selectedTier.order_items || []).filter(item => {
                          const matchSearch = !txSearch || 
                            (item.order?.order_number || '').toLowerCase().includes(txSearch.toLowerCase()) ||
                            (item.order?.customer?.full_name || '').toLowerCase().includes(txSearch.toLowerCase()) ||
                            (item.order?.customer?.email || '').toLowerCase().includes(txSearch.toLowerCase());
                          // Refined status check to be more robust
                          const itemStatus = (item.order?.status || '').toLowerCase().trim();
                          const matchStatus = !txStatusFilter || itemStatus === txStatusFilter.toLowerCase().trim();
                          return matchSearch && matchStatus;
                        });
                        
                        const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
                        const paginatedItems = filteredItems.slice((txPage - 1) * ITEMS_PER_PAGE, txPage * ITEMS_PER_PAGE);

                        return (
                          <div className="space-y-3 animate-in fade-in duration-200">
                            {/* Filter bar */}
                            <div className="flex gap-2">
                              <div className="flex-1 relative">
                                <input
                                  type="text"
                                  placeholder="Tìm theo mã đơn, tên / email khách..."
                                  value={txSearch}
                                  onChange={e => setTxSearch(e.target.value)}
                                  className="w-full pl-8 pr-3 py-2 text-xs bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg focus:outline-none focus:ring-1 focus:ring-neon-green/50 text-gray-700 dark:text-gray-300 placeholder-gray-400"
                                />
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                              </div>
                              <select
                                value={txStatusFilter}
                                onChange={e => setTxStatusFilter(e.target.value)}
                                className="px-3 py-2 text-xs bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg focus:outline-none focus:ring-1 focus:ring-neon-green/50 text-gray-700 dark:text-gray-300"
                              >
                                <option value="">Tất cả trạng thái</option>
                                <option value="paid">Hoàn thành</option>
                                <option value="cancelled">Đã hủy</option>
                              </select>
                            </div>
                            <div className="rounded-xl border border-gray-100 dark:border-white/10 overflow-hidden">
                              <table className="w-full text-left">
                                <thead className="bg-gray-50 dark:bg-white/5 border-b border-gray-100 dark:border-white/10">
                                  <tr>
                                    {['Mã đơn hàng', 'Khách hàng', 'Số lượng', 'Tổng tiền', 'Thanh toán', 'Thời gian', 'Trạng thái'].map(h => (
                                      <th key={h} className="px-3 py-2.5 text-[11px] font-semibold text-gray-400 uppercase">{h}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                                  {paginatedItems.length > 0 ? paginatedItems.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors">
                                      <td className="px-3 py-2.5">
                                        <span className="text-xs font-bold text-gray-800 dark:text-gray-200">#{item.order?.order_number}</span>
                                      </td>
                                      <td className="px-3 py-2.5">
                                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{item.order?.customer?.full_name}</p>
                                        <p className="text-[11px] text-gray-400 truncate max-w-[130px]">{item.order?.customer?.email}</p>
                                      </td>
                                      <td className="px-3 py-2.5">
                                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{item.quantity} vé</span>
                                      </td>
                                      <td className="px-3 py-2.5">
                                        <span className="text-xs font-bold text-blue-500">{parseFloat(item.order?.total_amount || 0).toLocaleString()}đ</span>
                                      </td>
                                      <td className="px-3 py-2.5">
                                        <span className="text-[11px] text-gray-400">{item.order?.payment_method}</span>
                                      </td>
                                      <td className="px-3 py-2.5">
                                        <span className="text-[11px] text-gray-400">{item.order?.created_at ? format(new Date(item.order.created_at), 'HH:mm dd/MM/yy') : '-'}</span>
                                      </td>
                                      <td className="px-3 py-2.5">
                                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                          (item.order?.status || '').toLowerCase() === 'paid' ? 'bg-green-50 text-green-600 dark:bg-green-500/10' :
                                          (item.order?.status || '').toLowerCase() === 'pending' ? 'bg-yellow-50 text-yellow-600 dark:bg-yellow-500/10' :
                                          'bg-gray-100 text-gray-500 dark:bg-white/5'
                                        }`}>
                                          {(item.order?.status || '').toLowerCase() === 'paid' ? 'Hoàn thành' : (item.order?.status || '').toLowerCase() === 'pending' ? 'Chờ xử lý' : (item.order?.status || '-')}
                                        </span>
                                      </td>
                                      <td className="px-3 py-2.5 text-center">
                                        <button 
                                          onClick={() => navigate(`/admin/transactions/ORDER/${item.order?.id}`)}
                                          className="p-1 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-lg text-gray-400 hover:text-neon-green transition-all"
                                          title="Xem chi tiết đơn hàng"
                                        >
                                          <Eye className="w-3.5 h-3.5" />
                                        </button>
                                      </td>
                                    </tr>
                                  )) : (
                                    <tr><td colSpan={7} className="px-3 py-8 text-center text-xs text-gray-400 italic">Không có giao dịch nào khớp.</td></tr>
                                  )}
                                </tbody>
                              </table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                              <div className="flex items-center justify-between px-2 py-1">
                                <span className="text-[10px] text-gray-400 font-bold uppercase">Trang {txPage} / {totalPages}</span>
                                <div className="flex items-center space-x-1">
                                  <button
                                    onClick={() => setTxPage(p => Math.max(1, p - 1))}
                                    disabled={txPage === 1}
                                    className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-white/5 disabled:opacity-30 transition-colors"
                                  >
                                    <ChevronLeft className="w-3.5 h-3.5 text-gray-500" />
                                  </button>
                                  <button
                                    onClick={() => setTxPage(p => Math.min(totalPages, p + 1))}
                                    disabled={txPage === totalPages}
                                    className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-white/5 disabled:opacity-30 transition-colors"
                                  >
                                    <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {tierTab === 'owners' && (() => {
                        const ownershipLabel = (ticket) => {
                          if (ticket.is_transferred) return { text: 'Chỉnh nhượng', color: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10', type: 'transfer' };
                          if (ticket.is_on_marketplace) return { text: 'Rao bán lại', color: 'bg-orange-50 text-orange-600 dark:bg-orange-500/10', type: 'resale' };
                          return { text: 'Mua gốc', color: 'bg-green-50 text-green-600 dark:bg-green-500/10', type: 'primary' };
                        };
                        const filteredTickets = (selectedTier.tickets || []).filter(t => {
                          const matchSearch = !ownerSearch ||
                            (t.ticket_number || '').toLowerCase().includes(ownerSearch.toLowerCase()) ||
                            (t.current_owner?.full_name || '').toLowerCase().includes(ownerSearch.toLowerCase()) ||
                            (t.current_owner?.email || '').toLowerCase().includes(ownerSearch.toLowerCase());
                          
                          const label = ownershipLabel(t);
                          const matchFilter = ownerFilter === 'all' || label.type === ownerFilter;
                          
                          return matchSearch && matchFilter;
                        });

                        const totalPages = Math.ceil(filteredTickets.length / ITEMS_PER_PAGE);
                        const paginatedTickets = filteredTickets.slice((ownerPage - 1) * ITEMS_PER_PAGE, ownerPage * ITEMS_PER_PAGE);

                        return (
                          <div className="space-y-3 animate-in fade-in duration-200">
                            {/* Filter bar */}
                            <div className="flex gap-2">
                              <div className="flex-1 relative">
                                <input
                                  type="text"
                                  placeholder="Tìm theo mã vé, tên / email người sở hữu..."
                                  value={ownerSearch}
                                  onChange={e => setOwnerSearch(e.target.value)}
                                  className="w-full pl-8 pr-3 py-2 text-xs bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg focus:outline-none focus:ring-1 focus:ring-neon-green/50 text-gray-700 dark:text-gray-300 placeholder-gray-400"
                                />
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                              </div>
                              <select
                                value={ownerFilter}
                                onChange={e => setOwnerFilter(e.target.value)}
                                className="px-3 py-2 text-xs bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg focus:outline-none focus:ring-1 focus:ring-neon-green/50 text-gray-700 dark:text-gray-300"
                              >
                                <option value="all">Tất cả hình thức</option>
                                <option value="primary">Mua gốc</option>
                                <option value="transfer">Chuyển nhượng</option>
                                <option value="resale">Rao bán lại</option>
                              </select>
                            </div>
                            <div className="rounded-xl border border-gray-100 dark:border-white/10 overflow-hidden">
                              <table className="w-full text-left">
                                <thead className="bg-gray-50 dark:bg-white/5 border-b border-gray-100 dark:border-white/10">
                                  <tr>
                                    {['Số vé', 'Người sở hữu hiện tại', 'Người mua gốc', 'Hình thức sở hữu', 'Trạng thái', 'Check-in'].map(h => (
                                      <th key={h} className="px-3 py-2.5 text-[11px] font-semibold text-gray-400 uppercase">{h}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                                  {paginatedTickets.length > 0 ? paginatedTickets.map((ticket) => {
                                    const ownership = ownershipLabel(ticket);
                                    return (
                                      <tr key={ticket.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors">
                                        <td className="px-3 py-2.5">
                                          <span className="text-xs font-bold text-gray-800 dark:text-gray-200 font-mono">#{ticket.ticket_number}</span>
                                        </td>
                                        <td className="px-3 py-2.5">
                                          <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{ticket.current_owner?.full_name}</p>
                                          <p className="text-[11px] text-gray-400 truncate max-w-[140px]">{ticket.current_owner?.email}</p>
                                        </td>
                                        <td className="px-3 py-2.5">
                                          <p className="text-xs text-gray-500">{ticket.original_buyer?.full_name}</p>
                                          <p className="text-[11px] text-gray-400">{ticket.original_buyer?.email}</p>
                                        </td>
                                        <td className="px-3 py-2.5">
                                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${ownership.color}`}>
                                            {ownership.text}
                                          </span>
                                        </td>
                                        <td className="px-3 py-2.5">
                                          <span className={`inline-flex px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                                            ticket.is_used ? 'bg-gray-100 text-gray-500 dark:bg-white/5' :
                                            ticket.status === 'active' ? 'bg-green-50 text-green-600 dark:bg-green-500/10' :
                                            'bg-yellow-50 text-yellow-600 dark:bg-yellow-500/10'
                                          }`}>
                                            {ticket.is_used ? 'Đã dùng' : ticket.status === 'active' ? 'Hiệu lực' : (ticket.status || '-')}
                                          </span>
                                        </td>
                                        <td className="px-3 py-2.5">
                                          <span className="text-xs text-gray-500">
                                            {ticket.checked_in_at ? format(new Date(ticket.checked_in_at), 'HH:mm dd/MM') : '-'}
                                          </span>
                                        </td>
                                      </tr>
                                    );
                                  }) : (
                                    <tr><td colSpan={6} className="px-3 py-8 text-center text-xs text-gray-400 italic">Không tìm thấy vé nào khớp.</td></tr>
                                  )}
                                </tbody>
                              </table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                              <div className="flex items-center justify-between px-2 py-1">
                                <span className="text-[10px] text-gray-400 font-bold uppercase">Trang {ownerPage} / {totalPages}</span>
                                <div className="flex items-center space-x-1">
                                  <button
                                    onClick={() => setOwnerPage(p => Math.max(1, p - 1))}
                                    disabled={ownerPage === 1}
                                    className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-white/5 disabled:opacity-30 transition-colors"
                                  >
                                    <ChevronLeft className="w-3.5 h-3.5 text-gray-500" />
                                  </button>
                                  <button
                                    onClick={() => setOwnerPage(p => Math.min(totalPages, p + 1))}
                                    disabled={ownerPage === totalPages}
                                    className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-white/5 disabled:opacity-30 transition-colors"
                                  >
                                    <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    // --- DANH SÁCH HẠNG VÉ ---
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {event.ticket_tiers.map((tier, idx) => (
                        <div key={tier.id} className="p-5 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-3xl transition-all hover:border-neon-green/30 group">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 font-black text-base">
                                {idx + 1}
                              </div>
                              <div className="min-w-0">
                                <div className="text-sm font-black dark:text-white uppercase tracking-tight truncate">{tier.tier_name}</div>
                                <div className="text-[10px] text-gray-400 font-bold uppercase truncate">{tier.section_name || 'Khu vực Chung'}</div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="text-right mr-2">
                                <div className="text-base font-black text-neon-green tracking-tight">
                                  {parseFloat(tier.price).toLocaleString()} <span className="text-[10px]">VNĐ</span>
                                </div>
                              </div>
                              <button
                                onClick={() => setSelectedTier(tier)}
                                className="p-2 bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded-xl text-gray-400 hover:text-neon-green hover:border-neon-green/30 transition-all shadow-sm"
                                title="Xem chi tiết hạng vé"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          
                          <div className="mt-5 space-y-2">
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-tight text-gray-500">
                              <span>Đã bán: {tier._count?.tickets || 0}/{tier.quantity_total}</span>
                              <span className="text-blue-500">Tồn kho: {tier.quantity_total - (tier._count?.tickets || 0)}</span>
                            </div>
                            <div className="h-1.5 w-full bg-gray-200 dark:bg-white/5 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-neon-green rounded-full shadow-[0_0_8px_rgba(50,255,100,0.3)] transition-all duration-1000" 
                                style={{ width: `${((tier._count?.tickets || 0) / tier.quantity_total) * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'orders' && (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    {/* Filter bar */}
                    <div className="flex gap-2">
                       <div className="flex-1 relative">
                          <input
                            type="text"
                            placeholder="Tìm theo mã đơn, tên / email khách..."
                            value={orderSearch}
                            onChange={e => setOrderSearch(e.target.value)}
                            className="w-full pl-9 pr-3 py-2.5 text-[11px] bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-1 focus:ring-neon-green/50 text-gray-700 dark:text-gray-300 font-bold placeholder-gray-400"
                          />
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                       </div>
                       <select
                         value={orderStatusFilter}
                         onChange={e => setOrderStatusFilter(e.target.value)}
                         className="px-4 py-2.5 text-[11px] bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-1 focus:ring-neon-green/50 text-gray-700 dark:text-gray-300 font-black "
                       >
                         <option value="">Tất cả trạng thái</option>
                         <option value="paid">Đã thanh toán</option>
                         <option value="cancelled">Đã hủy</option>
                       </select>
                    </div>

                    <div className="bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-3xl overflow-x-auto shadow-inner custom-scrollbar">
                       <table className="w-full text-left min-w-[700px]">
                          <thead>
                             <tr className="text-[10px] font-black text-gray-400 uppercase bg-gray-100 dark:bg-white/5 border-b border-gray-200 dark:border-white/10">
                                <th className="px-6 py-4">Mã đơn hàng</th>
                                <th className="px-6 py-4">Khách hàng</th>
                                <th className="px-6 py-4 text-center">Tổng tiền</th>
                                <th className="px-6 py-4 text-center">Thời gian</th>
                                <th className="px-6 py-4 text-center">Trạng thái</th>
                                <th className="px-6 py-4 text-center">Thao tác</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                             {(() => {
                               const filtered = (event.recent_orders || []).filter(order => {
                                 const matchSearch = !orderSearch ||
                                   (order.order_number || '').toLowerCase().includes(orderSearch.toLowerCase()) ||
                                   (order.customer?.full_name || '').toLowerCase().includes(orderSearch.toLowerCase()) ||
                                   (order.customer?.email || '').toLowerCase().includes(orderSearch.toLowerCase());
                                 const matchStatus = !orderStatusFilter || (order.status || '').toLowerCase() === orderStatusFilter.toLowerCase();
                                 return matchSearch && matchStatus;
                               });
                               const paginated = filtered.slice((orderPage - 1) * ITEMS_PER_PAGE, orderPage * ITEMS_PER_PAGE);
                               const totalP = Math.ceil(filtered.length / ITEMS_PER_PAGE);
                               
                               return (
                                 <>
                                   {paginated.length > 0 ? paginated.map((order) => (
                                      <tr key={order.id} className="hover:bg-white/50 dark:hover:bg-white/[0.02] transition-colors group">
                                         <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                               <span className="text-xs font-black text-gray-800 dark:text-gray-200 uppercase tracking-tight">#{order.order_number}</span>
                                               <span className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">{order.total_ticket_quantity || 0} Vé / {order.total_merch_quantity || 0} Sản phẩm</span>
                                            </div>
                                         </td>
                                         <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                               <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{order.customer?.full_name}</span>
                                               <span className="text-[10px] text-gray-400 font-medium truncate max-w-[150px]">{order.customer?.email}</span>
                                            </div>
                                         </td>
                                         <td className="px-6 py-4 text-center">
                                            <span className="text-xs font-black text-blue-500 tracking-tight">{parseFloat(order.total_amount || 0).toLocaleString()}đ</span>
                                         </td>
                                         <td className="px-6 py-4 text-[10px] text-gray-400 font-bold uppercase text-center">
                                            {format(new Date(order.created_at), 'HH:mm dd/MM/yy', { locale: vi })}
                                         </td>
                                         <td className="px-6 py-4 text-center">
                                            <div className="flex justify-center">
                                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase max-w-[80px] text-center leading-tight ${
                                                order.status === 'paid' ? 'bg-green-500/10 text-green-500' : 
                                                order.status === 'cancelled' ? 'bg-red-500/10 text-red-500' :
                                                'bg-gray-500/10 text-gray-500'
                                              }`}>
                                                 {order.status === 'paid' ? 'Đã thanh toán' : 
                                                  order.status === 'cancelled' ? 'Đã hủy' : 
                                                  (order.status || '-')}
                                              </span>
                                            </div>
                                         </td>
                                         <td className="px-6 py-4 text-center">
                                            <button 
                                              onClick={() => navigate(`/admin/transactions/ORDER/${order.id}`)}
                                              className="p-1.5 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl text-gray-400 hover:text-neon-green transition-all"
                                              title="Xem chi tiết đơn hàng"
                                            >
                                              <Eye className="w-3 h-3" />
                                            </button>
                                         </td>
                                      </tr>
                                   )) : (
                                      <tr>
                                         <td colSpan="6" className="px-6 py-12 text-center text-gray-400 italic text-xs">Không tìm thấy đơn hàng nào.</td>
                                      </tr>
                                   )}
                                   {/* Hidden total pages info for pagination outside map */}
                                   <div className="hidden" data-total-pages={totalP}></div>
                                 </>
                               );
                             })()}
                          </tbody>
                       </table>
                    </div>

                    {/* Pagination - calculating totalPages again for simplicity outside of map results */}
                    {(() => {
                      const filtered = (event.recent_orders || []).filter(order => {
                        const matchSearch = !orderSearch ||
                          (order.order_number || '').toLowerCase().includes(orderSearch.toLowerCase()) ||
                          (order.customer?.full_name || '').toLowerCase().includes(orderSearch.toLowerCase()) ||
                          (order.customer?.email || '').toLowerCase().includes(orderSearch.toLowerCase());
                        const matchStatus = !orderStatusFilter || (order.status || '').toLowerCase() === orderStatusFilter.toLowerCase();
                        return matchSearch && matchStatus;
                      });
                      const totalP = Math.ceil(filtered.length / ITEMS_PER_PAGE);
                      
                      return totalP > 1 && (
                        <div className="flex items-center justify-between px-2 pt-2">
                          <span className="text-[10px] text-gray-400 font-black uppercase">Trang {orderPage} / {totalP}</span>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => setOrderPage(p => Math.max(1, p - 1))}
                              disabled={orderPage === 1}
                              className="p-2 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 hover:bg-neon-green hover:text-black hover:border-neon-green transition-all disabled:opacity-30"
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setOrderPage(p => Math.min(totalP, p + 1))}
                              disabled={orderPage === totalP}
                              className="p-2 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 hover:bg-neon-green hover:text-black hover:border-neon-green transition-all disabled:opacity-30"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
              )}

              {activeTab === 'products' && (() => {
                const filteredProducts = (event.merchandise || []).filter(item => {
                  return !productSearch || (item.name || '').toLowerCase().includes(productSearch.toLowerCase());
                });

                const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
                const paginatedProducts = filteredProducts.slice((productPage - 1) * ITEMS_PER_PAGE, productPage * ITEMS_PER_PAGE);

                return (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    {/* Search bar */}
                    <div className="relative">
                       <input
                         type="text"
                         placeholder="Tìm kiếm sản phẩm..."
                         value={productSearch}
                         onChange={e => setProductSearch(e.target.value)}
                         className="w-full pl-9 pr-3 py-2.5 text-[11px] bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-1 focus:ring-neon-green/50 text-gray-700 dark:text-gray-300 font-bold placeholder-gray-400"
                       />
                       <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       {paginatedProducts.length > 0 ? paginatedProducts.map((item) => (
                          <div key={item.id} className="p-4 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-2xl flex items-center space-x-4 group hover:border-neon-green/30 transition-all">
                             <div className="w-16 h-16 rounded-xl bg-white dark:bg-white/10 overflow-hidden flex-shrink-0 border border-gray-100 dark:border-white/5">
                                {item.image_url ? (
                                   <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                   <Package className="w-6 h-6 m-auto text-gray-300" />
                                )}
                             </div>
                             <div className="flex-1 min-w-0">
                                <h5 className="text-sm font-black text-gray-800 dark:text-gray-200 uppercase truncate group-hover:text-neon-green transition-colors">{item.name}</h5>
                                <p className="text-[10px] font-bold text-neon-green mt-1 uppercase tracking-widest">{parseFloat(item.price).toLocaleString()} VNĐ</p>
                                <div className="flex items-center space-x-4 mt-2">
                                   <div className="text-[10px] text-gray-400 font-bold uppercase">Kho: {item.stock}</div>
                                   <div className="text-[10px] text-blue-400 font-bold uppercase">Đơn: {item._count.order_items}</div>
                                </div>
                             </div>
                             <button 
                                onClick={() => navigate(`/admin/products/${item.id}`)}
                                className="p-2 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl text-gray-400 hover:text-neon-green transition-all"
                                title="Xem chi tiết sản phẩm"
                             >
                                <Eye className="w-4 h-4" />
                             </button>
                          </div>
                       )) : (
                          <div className="col-span-2 py-20 text-center text-gray-400 italic text-xs border border-gray-100 dark:border-white/5 rounded-3xl border-dashed">Không tìm thấy sản phẩm nào.</div>
                       )}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between px-2 pt-2">
                        <span className="text-[10px] text-gray-400 font-black uppercase">Trang {productPage} / {totalPages}</span>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setProductPage(p => Math.max(1, p - 1))}
                            disabled={productPage === 1}
                            className="p-2 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 hover:bg-neon-green hover:text-black hover:border-neon-green transition-all disabled:opacity-30"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setProductPage(p => Math.min(totalPages, p + 1))}
                            disabled={productPage === totalPages}
                            className="p-2 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 hover:bg-neon-green hover:text-black hover:border-neon-green transition-all disabled:opacity-30"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

               {activeTab === 'blogs' && (
                 <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="flex space-x-1 p-1 bg-gray-100 dark:bg-white/5 rounded-2xl">
                       {[
                         { id: 'all', label: 'Tất cả', count: event.blogs?.length || 0 },
                         { id: 'SYSTEM_NEWS', label: 'Khách đã mua vé', count: event.blogs?.filter(b => b.type === 'SYSTEM_NEWS' || b.type === 'BUYER_ONLY').length || 0 },
                         { id: 'CUSTOMER_REVIEW', label: 'Thảo luận Sự kiện', count: event.blogs?.filter(b => b.type === 'CUSTOMER_REVIEW' || b.type === 'PUBLIC').length || 0 },
                         { id: 'ORGANIZER_NEWS', label: 'Ban tổ chức', count: event.blogs?.filter(b => b.type === 'ORGANIZER_NEWS').length || 0 }
                       ].map(cat => (
                         <button
                           key={cat.id}
                           onClick={() => setBlogTypeFilter(cat.id)}
                           className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${
                             blogTypeFilter === cat.id 
                               ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm'
                               : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                           }`}
                         >
                           {cat.label} ({cat.count})
                         </button>
                       ))}
                    </div>

                    <div className="space-y-3">
                       {event.blogs?.filter(b => blogTypeFilter === 'all' || 
                         (blogTypeFilter === 'SYSTEM_NEWS' && (b.type === 'SYSTEM_NEWS' || b.type === 'BUYER_ONLY')) ||
                         (blogTypeFilter === 'CUSTOMER_REVIEW' && (b.type === 'CUSTOMER_REVIEW' || b.type === 'PUBLIC')) ||
                         b.type === blogTypeFilter
                       ).map((blog) => (
                          <div key={blog.id} className="p-4 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-2xl hover:border-neon-green/30 transition-all group flex flex-col md:flex-row md:items-center gap-4">
                             {/* Author & Meta (Left side on desktop) */}
                             <div className="flex items-center space-x-3 md:w-64 shrink-0">
                                <div className="w-9 h-9 rounded-xl overflow-hidden bg-gray-200 dark:bg-white/10 shrink-0 border border-white/10 shadow-sm">
                                   {blog.author?.avatar_url ? (
                                      <img src={blog.author.avatar_url} alt={blog.author.full_name} className="w-full h-full object-cover" />
                                   ) : (
                                      <div className="w-full h-full flex items-center justify-center text-xs font-black text-gray-400">
                                         {blog.author?.full_name?.charAt(0).toUpperCase() || 'U'}
                                      </div>
                                   )}
                                </div>
                                <div className="min-w-0">
                                   <p className="text-[10px] font-black text-gray-900 dark:text-white truncate uppercase tracking-tight">{blog.author?.full_name || 'Người dùng ẩn danh'}</p>
                                   <p className="text-[9px] text-gray-400 font-medium truncate">{blog.author?.email || 'N/A'}</p>
                                </div>
                             </div>

                             {/* Content (Center) */}
                             <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2 mb-1">
                                   <span className={`px-1.5 py-0.5 rounded-md text-[7px] font-black uppercase ${
                                     (blog.type === 'SYSTEM_NEWS' || blog.type === 'BUYER_ONLY') ? 'bg-purple-500/10 text-purple-500' :
                                     (blog.type === 'CUSTOMER_REVIEW' || blog.type === 'PUBLIC') ? 'bg-blue-500/10 text-blue-500' :
                                     'bg-gray-500/10 text-gray-500'
                                   }`}>
                                      {(blog.type === 'SYSTEM_NEWS' || blog.type === 'BUYER_ONLY') ? 'Khách đã mua vé' :
                                       (blog.type === 'CUSTOMER_REVIEW' || blog.type === 'PUBLIC') ? 'Thảo luận' :
                                       'Ban tổ chức'}
                                   </span>
                                   <span className="text-[8px] text-gray-400 font-bold">{format(new Date(blog.created_at), 'dd/MM/yyyy', { locale: vi })}</span>
                                </div>

                                {((blog.type === 'CUSTOMER_REVIEW' || blog.type === 'PUBLIC')) ? (
                                  <p className="text-[11px] font-medium text-gray-700 dark:text-gray-400 line-clamp-2 leading-relaxed italic border-l-2 border-neon-green/30 pl-3">"{blog.content}"</p>
                                ) : (
                                  <h4 className="text-[11px] font-bold text-gray-800 dark:text-gray-200 line-clamp-1 group-hover:text-neon-green transition-colors uppercase tracking-tight">{blog.title}</h4>
                                )}
                             </div>

                             {/* Status & Stats (Right side) */}
                             <div className="flex items-center justify-between md:justify-end md:space-x-4 md:w-48 shrink-0">
                                <div className="flex items-center space-x-1 text-[9px] text-gray-400 font-bold">
                                   <Zap className="w-3 h-3 text-yellow-500" />
                                   <span>{blog.views}</span>
                                </div>
                                <span className={`px-2 py-0.5 rounded-md text-[8px] font-bold uppercase ${
                                  blog.status === 'published' ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500'
                                }`}>
                                   {blog.status}
                                </span>
                             </div>
                          </div>
                       ))}
                       {(!event.blogs || event.blogs.filter(b => blogTypeFilter === 'all' || 
                         (blogTypeFilter === 'SYSTEM_NEWS' && (b.type === 'SYSTEM_NEWS' || b.type === 'BUYER_ONLY')) ||
                         (blogTypeFilter === 'CUSTOMER_REVIEW' && (b.type === 'CUSTOMER_REVIEW' || b.type === 'PUBLIC')) ||
                         b.type === blogTypeFilter
                       ).length === 0) && (
                          <div className="py-20 text-center text-gray-400 italic text-xs border border-gray-100 dark:border-white/5 rounded-[24px] border-dashed">Không có bài viết nào trong mục này.</div>
                       )}
                    </div>
                 </div>
               )}

               {activeTab === 'logs' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                   <div className="space-y-3 relative before:absolute before:inset-0 before:left-3 before:w-px before:bg-gray-100 dark:before:bg-white/5 pb-4">
                      {event.admin_logs?.slice((logPage - 1) * 10, logPage * 10).map((log) => (
                        <div key={log.id} className="relative pl-10">
                           <div className="absolute left-1.5 top-1.5 w-3 h-3 rounded-full bg-blue-500/20 border-2 border-blue-500" />
                           <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                              <div className="flex items-center justify-between mb-1">
                                 <span className="text-[11px] font-black text-blue-500 uppercase tracking-widest">
                                    {(() => {
                                      const type = log.action_type?.toUpperCase();
                                      switch (type) {
                                        case 'EVENT_APPROVE': return 'Phê duyệt sự kiện';
                                        case 'EVENT_REJECT': return 'Từ chối sự kiện';
                                        case 'EVENT_CANCEL': return 'Hủy bỏ sự kiện';
                                        case 'EVENT_FORCE_CANCEL': return 'Bắt buộc hủy sự kiện';
                                        case 'EVENT_TOGGLE_FEATURED': return 'Thay đổi nổi bật';
                                        case 'EVENT_RESCHEDULE': return 'Dời ngày sự kiện';
                                        case 'UPDATE_EVENT': return 'Cập nhật thông tin';
                                        case 'CREATE_BLOG': return 'Đăng tin tức';
                                        case 'UPDATE_BLOG': return 'Cập nhật tin tức';
                                        case 'UPDATE_LOCATION': return 'Cập nhật địa điểm';
                                        case 'UPDATE_TIER': return 'Cập nhật hạng vé';
                                        case 'UPDATE_MEDIA': return 'Cập nhật hình ảnh/video';
                                        default: return log.action_type || 'Hành động khác';
                                      }
                                    })()}
                                 </span>
                                 <span className="text-[10px] text-gray-400 font-bold">{format(new Date(log.created_at), 'HH:mm - dd/MM/yyyy', { locale: vi })}</span>
                              </div>
                              <p className="text-xs text-gray-700 dark:text-gray-300 font-medium">Bởi Admin: <span className="font-bold text-gray-900 dark:text-gray-100">{log.admin?.full_name}</span> ({log.admin?.role})</p>
                              {log.new_value && (
                                <p className="text-[10px] text-gray-400 mt-2 italic px-3 py-1 bg-white dark:bg-black/20 rounded-lg">Ghi chú: {log.new_value}</p>
                              )}
                           </div>
                        </div>
                      ))}
                      {(!event.admin_logs || event.admin_logs.length === 0) && (
                         <div className="py-20 text-center text-gray-400 italic text-xs">Lịch sử trống.</div>
                      )}
                   </div>

                   {/* Activity Log Pagination */}
                   {event.admin_logs?.length > 10 && (
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-white/10">
                        <span className="text-[10px] text-gray-500 font-bold uppercase">Trang {logPage} / {Math.ceil(event.admin_logs.length / 10)}</span>
                        <div className="flex items-center space-x-2">
                           <button 
                             onClick={() => setLogPage(prev => Math.max(1, prev - 1))}
                             disabled={logPage === 1}
                             className="p-2 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl text-gray-500 disabled:opacity-30 hover:text-neon-green transition-all"
                           >
                             <ChevronLeft className="w-4 h-4" />
                           </button>
                           <button 
                             onClick={() => setLogPage(prev => Math.min(Math.ceil(event.admin_logs.length / 10), prev + 1))}
                             disabled={logPage >= Math.ceil(event.admin_logs.length / 10)}
                             className="p-2 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl text-gray-500 disabled:opacity-30 hover:text-neon-green transition-all"
                           >
                             <ChevronRight className="w-4 h-4" />
                           </button>
                        </div>
                      </div>
                   )}
                </div>
              )}

              {activeTab === 'location' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                   <div className="flex items-center space-x-4 p-5 bg-gray-50 dark:bg-white/5 rounded-3xl border border-gray-100 dark:border-white/5">
                      <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500">
                        <MapPin className="w-6 h-6" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-black dark:text-white uppercase tracking-widest mb-1 leading-none">Địa điểm tổ chức</h4>
                        <p className="text-sm font-bold text-gray-500 truncate mt-1 leading-relaxed">{event.location_address || 'Cơ sở hạ tầng N/A'}</p>
                      </div>
                   </div>

                   <div className="aspect-[21/9] bg-gray-100 dark:bg-white/5 rounded-[32px] overflow-hidden relative border border-gray-200 dark:border-white/5 shadow-inner">
                      {event.latitude && event.longitude ? (
                        <iframe
                          width="100%"
                          height="100%"
                          frameBorder="0"
                          style={{ border: 0 }}
                          src={`https://maps.google.com/maps?q=${event.latitude},${event.longitude}&hl=vi&z=14&output=embed`}
                          allowFullScreen
                          className="opacity-80 grayscale-[20%] hover:grayscale-0 transition-all duration-700"
                        />
                      ) : (
                         <div className="absolute inset-0 flex flex-col items-center justify-center opacity-20">
                            <MapPin className="w-12 h-12 mb-3 text-gray-400" />
                            <p className="font-black uppercase text-[10px] tracking-widest text-center">Tọa độ không được định vị</p>
                         </div>
                      )}
                   </div>
                </div>
              )}
            </div>
           </div>

         {/* Global Event Insights Charts - Full Width matching UserDetail pattern */}
         <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 mt-6 pb-10">
                 {/* Revenue Trend AreaChart */}
                 <div className="p-6 bg-white dark:bg-[#111114] border border-gray-100 dark:border-white/5 rounded-[32px] shadow-sm flex flex-col h-[350px]">
                    <div className="mb-6 flex justify-between items-start">
                       <div>
                          <h3 className="text-[11px] font-black uppercase text-gray-400 mb-1">Xu hướng doanh thu</h3>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">7 ngày gần nhất</p>
                       </div>
                       <div className="flex items-center space-x-1.5">
                          <div className="w-2 h-2 rounded-full bg-neon-green" />
                          <span className="text-[10px] font-bold text-gray-500 uppercase leading-none">Tổng thu</span>
                       </div>
                    </div>
                    
                    <div className="flex-1 w-full">
                       <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={event.statistics?.timeline || []}>
                             <defs>
                                <linearGradient id="colorRevenueGlobal" x1="0" y1="0" x2="0" y2="1">
                                   <stop offset="5%" stopColor="#00FF85" stopOpacity={0.3}/>
                                   <stop offset="95%" stopColor="#00FF85" stopOpacity={0}/>
                                </linearGradient>
                             </defs>
                             <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                             <XAxis 
                                dataKey="date" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: '#6B7280', fontSize: 10, fontWeight: 'bold' }} 
                             />
                             <YAxis hide />
                             <Tooltip 
                                contentStyle={{ 
                                   backgroundColor: '#111114', 
                                   border: '1px solid rgba(255,255,255,0.1)',
                                   borderRadius: '16px',
                                   fontSize: '11px',
                                   fontWeight: 'bold',
                                   color: '#fff'
                                }}
                             />
                             <Area 
                                type="monotone" 
                                dataKey="revenue" 
                                stroke="#00FF85" 
                                strokeWidth={3}
                                fillOpacity={1} 
                                fill="url(#colorRevenueGlobal)" 
                                animationDuration={1500}
                             />
                          </AreaChart>
                       </ResponsiveContainer>
                    </div>
                 </div>

                 {/* Tier Distribution PieChart */}
                 <div className="p-6 bg-white dark:bg-[#111114] border border-gray-100 dark:border-white/5 rounded-[32px] shadow-sm flex flex-col h-[350px]">
                    <div className="mb-6">
                       <h3 className="text-[11px] font-black uppercase text-gray-400 mb-1">Cấu trúc vé</h3>
                       <p className="text-sm font-bold text-gray-900 dark:text-white">Phân bổ theo hạng vé</p>
                    </div>
                    <div className="flex-1 w-full relative">
                       <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                             <Pie
                                data={event.statistics?.tier_distribution || []}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={8}
                                dataKey="value"
                                animationDuration={1500}
                             >
                                {(event.statistics?.tier_distribution || []).map((entry, index) => (
                                   <Cell 
                                      key={`cell-${index}`} 
                                      fill={['#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE', '#DBEAFE'][index % 5]} 
                                      stroke="none" 
                                   />
                                ))}
                             </Pie>
                             <Tooltip 
                                contentStyle={{ 
                                   backgroundColor: '#111114', 
                                   border: '1px solid rgba(255,255,255,0.1)',
                                   borderRadius: '16px',
                                   fontSize: '11px',
                                   fontWeight: 'bold',
                                   color: '#fff'
                                }}
                             />
                          </PieChart>
                       </ResponsiveContainer>
                       <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <p className="text-[10px] font-black text-gray-400 uppercase">Tổng vé</p>
                          <p className="text-xl font-black text-gray-900 dark:text-white">
                             {event.statistics?.tier_distribution?.reduce((sum, item) => sum + item.value, 0) || 0}
                          </p>
                       </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-4">
                       {(event.statistics?.tier_distribution || []).map((item, i) => (
                          <div key={i} className="flex items-center gap-2 truncate">
                             <div className={`w-1.5 h-1.5 rounded-full`} style={{ backgroundColor: ['#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE', '#DBEAFE'][i % 5] }} />
                             <span className="text-[9px] font-bold text-gray-500 uppercase truncate">{item.name}</span>
                          </div>
                       ))}
                    </div>
                 </div>

                 {/* Revenue Composition PieChart */}
                 <div className="p-6 bg-white dark:bg-[#111114] border border-gray-100 dark:border-white/5 rounded-[32px] shadow-sm flex flex-col h-[350px]">
                    <div className="mb-6">
                       <h3 className="text-[11px] font-black uppercase text-gray-400 mb-1">Cơ cấu doanh thu</h3>
                       <p className="text-sm font-bold text-gray-900 dark:text-white">Vé vs Merch vs Resale</p>
                    </div>
                    <div className="flex-1 w-full relative">
                       <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                             <Pie
                                data={event.statistics?.revenue_mix || []}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={8}
                                dataKey="value"
                                animationDuration={1500}
                             >
                                {(event.statistics?.revenue_mix || []).map((entry, index) => (
                                   <Cell 
                                      key={`cell_mix-${index}`} 
                                      fill={['#00FF85', '#3B82F6', '#F59E0B'][index % 3]} 
                                      stroke="none" 
                                   />
                                ))}
                             </Pie>
                             <Tooltip 
                                contentStyle={{ 
                                   backgroundColor: '#111114', 
                                   border: '1px solid rgba(255,255,255,0.1)',
                                   borderRadius: '16px',
                                   fontSize: '11px',
                                   fontWeight: 'bold',
                                   color: '#fff'
                                }}
                             />
                          </PieChart>
                       </ResponsiveContainer>
                       <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
                          <p className="text-[10px] font-black text-gray-400 uppercase">Gross</p>
                          <p className="text-xs font-black text-gray-900 dark:text-white truncate w-full">
                             {(event.financials?.total_revenue || 0).toLocaleString()} <span className="text-[8px]">đ</span>
                          </p>
                       </div>
                    </div>
                    <div className="grid grid-cols-1 gap-1.5 mt-4">
                       {(event.statistics?.revenue_mix || []).map((item, i) => (
                          <div key={i} className="flex items-center justify-between text-[9px] font-bold">
                             <div className="flex items-center gap-2">
                                <div className={`w-1.5 h-1.5 rounded-full`} style={{ backgroundColor: ['#00FF85', '#3B82F6', '#F59E0B'][i % 3] }} />
                                <span className="text-gray-500 uppercase">{item.name}</span>
                             </div>
                             <span className="text-gray-900 dark:text-gray-300">
                                {Math.round((item.value / event.financials.total_revenue) * 100)}%
                             </span>
                          </div>
                       ))}
                    </div>
                 </div>
              </div>
        </div>
      </div>
   );
};

export default EventDetail;

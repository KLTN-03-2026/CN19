import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Phone, 
  Shield, 
  Clock, 
  CreditCard, 
  Ticket, 
  ShoppingBag, 
  ArrowLeft,
  Calendar,
  MapPin,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  ShieldAlert,
  Ban,
  CheckCircle2,
  Package,
  ArrowRightLeft,
  Settings,
  Building2,
  CalendarDays,
  X,
  Search,
  Filter as FilterIcon,
  Tag,
  Eye,
  Globe,
  Info,
  FileText,
  Image as ImageIcon,
  ThumbsUp,
  MessageSquare,
  Wallet,
  Banknote,
  CheckSquare,
  History,
  AlertCircle,
  TrendingUp
} from 'lucide-react';
import { adminService } from '../../services/admin.service';
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
  CartesianGrid,
  BarChart,
  Bar
} from 'recharts';

const BOT_EVENT_TYPE_MAP = {
  'LOGIN': 'Đăng nhập',
  'REGISTER_OTP': 'Đăng ký OTP',
  'PRIMARY_ORDER': 'Đặt hàng vé gốc',
  'PAYMENT': 'Thanh toán',
};

const UserDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('general');
  const [ownedTickets, setOwnedTickets] = useState([]);
  const tabContainerRef = useRef(null);

  useEffect(() => {
    // Scroll active tab into view
    const activeBtn = tabContainerRef.current?.querySelector(`[data-tab-id="${activeTab}"]`);
    if (activeBtn) {
      activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeTab]);

  const [eventSearch, setEventSearch] = useState('');
  const [eventStatusFilter, setEventStatusFilter] = useState('');
  const [ticketStatusFilter, setTicketStatusFilter] = useState('');
  const [botEventTypeFilter, setBotEventTypeFilter] = useState('');
  const [ticketOwnershipFilter, setTicketOwnershipFilter] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('');
  const [orderTypeFilter, setOrderTypeFilter] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedLog, setSelectedLog] = useState(null);
  const [isBotModalOpen, setIsBotModalOpen] = useState(false);
  const [activityPage, setActivityPage] = useState(1);
  const [ticketPage, setTicketPage] = useState(1);
  const [orderPage, setOrderPage] = useState(1);
  const [botPage, setBotPage] = useState(1);
  const [eventPage, setEventPage] = useState(1);
  const [merchandisePage, setMerchandisePage] = useState(1);
  const [blogPage, setBlogPage] = useState(1);

  const [merchandiseStatusFilter, setMerchandiseStatusFilter] = useState('all');
  const [blogSearch, setBlogSearch] = useState('');
  
  const [activityTimeFilter, setActivityTimeFilter] = useState('all');

  const ACTIVITY_PER_PAGE = 10;
  const TICKETS_PER_PAGE = 4;
  const ORDERS_PER_PAGE = 3;
  const BOTS_PER_PAGE = 5;
  const EVENTS_PER_PAGE = 4;
  const MERCHANDISE_PER_PAGE = 6;
  const BLOGS_PER_PAGE = 4;

  useEffect(() => {
    fetchUserDetail();
  }, [id]);

  useEffect(() => {
    setActivityPage(1);
  }, [activityTimeFilter]);

  const fetchUserDetail = async () => {
    try {
      setLoading(true);
      const data = await adminService.getUserById(id);
      setUser(data);
      
      // Merge owned and original tickets to show full history
      const ticketMap = new Map();
      (data.owned_tickets || []).forEach(t => ticketMap.set(t.id, { ...t, isCurrentOwner: true }));
      (data.original_tickets || []).forEach(t => {
        if (!ticketMap.has(t.id)) {
          ticketMap.set(t.id, { ...t, isCurrentOwner: false });
        }
      });
      setOwnedTickets(Array.from(ticketMap.values()).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)));
    } catch (error) {
      toast.error('Lỗi khi tải thông tin người dùng');
      navigate('/admin/users');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (user.role === 'admin') {
      toast.error('Không thể khóa tài khoản admin.');
      return;
    }

    const newStatus = user.status === 'active' ? 'banned' : 'active';
    if (window.confirm(`Bạn có chắc chắn muốn ${newStatus === 'banned' ? 'KHÓA' : 'MỞ KHÓA'} tài khoản này?`)) {
      try {
        await adminService.toggleUserStatus(user.id, { status: newStatus });
        toast.success('Cập nhật trạng thái thành công');
        fetchUserDetail();
      } catch (error) {
        toast.error('Thao tác thất bại');
      }
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
      <div className="w-12 h-12 border-4 border-neon-green/20 border-t-neon-green rounded-full animate-spin" />
      <p className="text-gray-500 font-bold animate-pulse">Đang truy xuất hồ sơ 360...</p>
    </div>
  );

  if (!user) return null;

  const orders = user.orders || [];
  const botLogs = user.bot_logs || [];

  const translateOrderStatus = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'cancelled':
        return 'Đã hủy';
      case 'paid':
        return 'Đã thanh toán';
      default:
        return status || 'Chưa cập nhật';
    }
  };

  const allPurchases = [
    ...(user?.orders || []).map(o => ({ ...o, unifiedType: o.order_type })),
    ...(user?.buyer_transactions || []).map(t => ({ 
      ...t, 
      order_number: t.id.split('-')[0].toUpperCase(), // Fake an ID for display if needed
      total_amount: t.buyer_pay_amount,
      unifiedType: 'RESALE_PURCHASE',
      event: t.listing?.event
    }))
  ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const filteredOrders = allPurchases.filter((p) => {
    const matchesStatus = orderStatusFilter ? (p.status || '').toLowerCase() === orderStatusFilter.toLowerCase() : true;
    const matchesSearch = orderSearch ? (p.order_number || '').toLowerCase().includes(orderSearch.toLowerCase()) : true;
    const matchesType = orderTypeFilter ? (p.unifiedType || '').toLowerCase() === orderTypeFilter.toLowerCase() : true;
    return matchesStatus && matchesSearch && matchesType;
  });

  // --- Aggregated Activity Logic ---
  const allActivities = [
    ...(user.comments || []).map(c => ({ 
      ...c, 
      type: 'social', 
      icon: <MessageSquare className="w-3.5 h-3.5" />, 
      color: 'text-blue-500', 
      bg: 'bg-blue-500/10',
      title: 'Bình luận bài viết',
      desc: c.content,
      date: c.created_at 
    })),
    ...(user.likes || []).map(l => ({ 
      ...l, 
      type: 'social', 
      icon: <ThumbsUp className="w-3.5 h-3.5" />, 
      color: 'text-blue-500', 
      bg: 'bg-blue-500/10',
      title: 'Yêu thích nội dung',
      desc: `Đã thích ${l.target_type === 'comment' ? 'bình luận' : 'sự kiện'}`,
      date: l.created_at 
    })),
    ...(user.orders || []).map(o => ({ 
      ...o, 
      type: 'financial', 
      icon: <ShoppingBag className="w-3.5 h-3.5" />, 
      color: 'text-green-500', 
      bg: 'bg-green-500/10',
      title: 'Đặt hàng thành công',
      desc: `Đơn hàng #${o.order_number} - ${Number(o.total_amount).toLocaleString()}đ`,
      date: o.created_at 
    })),
    ...(user.transfers_sent || []).map(t => ({ 
      ...t, 
      type: 'asset', 
      icon: <ArrowRightLeft className="w-3.5 h-3.5" />, 
      color: 'text-purple-500', 
      bg: 'bg-purple-500/10',
      title: 'Chuyển nhượng vé',
      desc: `Chuyển vé cho ${t.receiver_email}`,
      date: t.requested_at 
    })),
    ...(user.transfers_received || []).map(t => ({ 
      ...t, 
      type: 'asset', 
      icon: <ArrowRightLeft className="w-3.5 h-3.5" />, 
      color: 'text-purple-500', 
      bg: 'bg-purple-500/10',
      title: 'Nhận vé nhượng',
      desc: `Nhận vé từ ${t.sender_email}`,
      date: t.requested_at 
    })),
    ...(user.bot_logs || []).map(b => ({ 
      ...b, 
      type: 'system', 
      icon: <ShieldAlert className="w-3.5 h-3.5" />, 
      color: b.is_bot_detected ? 'text-red-500' : 'text-gray-500', 
      bg: b.is_bot_detected ? 'bg-red-500/10' : 'bg-gray-500/10',
      title: 'Kiểm tra bảo mật',
      desc: b.event_type,
      date: b.created_at 
    }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  const filteredActivities = allActivities.filter(a => {
    if (!activityTimeFilter || activityTimeFilter === 'all') return true;
    const date = new Date(a.date);
    const now = new Date();
    if (activityTimeFilter === '24h') return (now - date) < 24 * 60 * 60 * 1000;
    if (activityTimeFilter === '7d') return (now - date) < 7 * 24 * 60 * 60 * 1000;
    if (activityTimeFilter === '30d') return (now - date) < 30 * 24 * 60 * 60 * 1000;
    return true;
  });

  // --- Ticket filter ---
  const getTicketOwnership = (t) => {
    if (!t.isCurrentOwner) return 'transferred_out';
    if (t.original_buyer_id === user.id) return 'primary';
    if (t.is_transferred) return 'transfer';
    return 'resale';
  };

  const filteredTickets = ownedTickets.filter(t => {
    // 1. Ownership filter
    if (ticketOwnershipFilter && getTicketOwnership(t) !== ticketOwnershipFilter) return false;

    // 2. Status filter
    if (!ticketStatusFilter) return true;
    
    // Check if the event has passed
    const isEventPassed = t.event && t.event.event_date && new Date(t.event.event_date) < new Date();
    const isExpired = !t.is_used && isEventPassed;

    if (ticketStatusFilter === 'used') return t.is_used;
    if (ticketStatusFilter === 'expired') return isExpired;
    if (ticketStatusFilter === 'unused') return !t.is_used && !isEventPassed;
    
    return true;
  });

  // --- Bot History filter ---
  const filteredBotLogs = botLogs.filter(log => {
    if (!botEventTypeFilter) return true;
    return log.event_type === botEventTypeFilter;
  });

  // --- Pagination Slicing ---
  const paginatedTickets = filteredTickets.slice((ticketPage - 1) * TICKETS_PER_PAGE, ticketPage * TICKETS_PER_PAGE);
  const paginatedOrders = filteredOrders.slice((orderPage - 1) * ORDERS_PER_PAGE, orderPage * ORDERS_PER_PAGE);
  const paginatedBotLogs = filteredBotLogs.slice((botPage - 1) * BOTS_PER_PAGE, botPage * BOTS_PER_PAGE);
  const paginatedActivities = filteredActivities.slice((activityPage - 1) * ACTIVITY_PER_PAGE, activityPage * ACTIVITY_PER_PAGE);

  const totalTicketPages = Math.ceil(filteredTickets.length / TICKETS_PER_PAGE);
  const totalOrderPages = Math.ceil(filteredOrders.length / ORDERS_PER_PAGE);
  const totalBotPages = Math.ceil(filteredBotLogs.length / BOTS_PER_PAGE);
  const totalActivityPages = Math.ceil(filteredActivities.length / ACTIVITY_PER_PAGE);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header & Quick Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => navigate('/admin/users')}
            className="p-3 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/10 transition-all text-gray-500"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
              <div className="flex items-center space-x-2 mb-1">
                <h1 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Hồ sơ người dùng</h1>
                <span className={`px-2 py-0.5 rounded-lg text-[11px] font-bold uppercase ${
                  user.role === 'admin' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 
                  user.role === 'organizer' ? 'bg-neon-green/10 text-neon-green border border-neon-green/20' :
                  'bg-gray-500/10 text-gray-500 border border-white/5'
                }`}>
                  {user.role === 'admin' ? 'Quản trị viên' : user.role === 'organizer' ? 'Ban tổ chức' : user.role === 'staff' ? 'Nhân viên' : 'Khách hàng'}
                </span>
              </div>
              <p className="text-gray-500 text-xs flex items-center space-x-2">
                <span className="opacity-60 font-medium">ID:</span>
                <span className="font-mono text-[10px] bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded-md">{user.id}</span>
              </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button 
            onClick={handleToggleStatus}
            disabled={user.role === 'admin'}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-md ${
              user.role === 'admin'
                ? 'bg-gray-100 dark:bg-white/5 text-gray-400 border border-gray-200 dark:border-white/10 cursor-not-allowed shadow-none'
                : user.status === 'active' 
                ? 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white' 
                : 'bg-green-500/10 text-green-500 border border-green-500/20 hover:bg-green-500 hover:text-white'
            }`}
          >
            {user.status === 'active' ? <Ban className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            <span>{user.role === 'admin' ? 'Tài khoản admin' : user.status === 'active' ? 'Khóa tài khoản' : 'Mở khóa'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Summary Card */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#111114] border border-gray-200 dark:border-white/5 rounded-[32px] overflow-hidden shadow-sm dark:shadow-2xl">
            <div className="h-24 bg-gradient-to-r from-neon-green/20 to-blue-500/20 relative">
              <div className="absolute -bottom-10 left-8">
                <div className="w-20 h-20 rounded-[24px] bg-white dark:bg-[#1a1a1e] border-4 border-white dark:border-[#111114] flex items-center justify-center font-black text-3xl text-neon-green shadow-xl overflow-hidden">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt={user.full_name || user.email} className="w-full h-full object-cover" />
                  ) : (
                    <span>{(user.full_name || user.email).charAt(0).toUpperCase()}</span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="px-6 pt-12 pb-6 space-y-4">
              <div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white leading-tight">{user.full_name || 'N/A'}</h3>
                <p className="text-gray-500 text-xs font-semibold">{user.email}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5 text-center transition-all hover:border-neon-green/30">
                  <div className="text-[11px] uppercase font-bold text-gray-400 mb-0.5 whitespace-nowrap">Vé đang có</div>
                  <div className="text-lg font-black text-neon-green leading-none">{ownedTickets.filter(t => t.isCurrentOwner).length}</div>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5 text-center transition-all hover:border-blue-500/30">
                  <div className="text-[11px] uppercase font-bold text-gray-400 mb-0.5 whitespace-nowrap">Giao dịch thành công</div>
                  <div className="text-lg font-black text-blue-500 leading-none">{orders.filter(o => (o.status || '').toLowerCase() !== 'cancelled').length}</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="p-3 bg-neon-green/10 rounded-xl border border-neon-green/20 text-center">
                  <div className="text-[11px] uppercase font-bold text-neon-green mb-0.5">Số dư tài khoản</div>
                  <div className="text-xl font-black text-neon-green">
                    {Number(user.balance || 0).toLocaleString()} <span className="text-[10px] font-bold uppercase">VNĐ</span>
                  </div>
                </div>

                <div className="p-3 bg-orange-500/10 rounded-xl border border-orange-500/20 text-center group relative overflow-hidden">
                  <div className="absolute inset-0 bg-orange-500/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                  <div className="relative z-10">
                    <div className="text-[10px] uppercase font-black text-orange-500 mb-0.5 flex items-center justify-center gap-1.5">
                      <Clock className="w-3 h-3" />
                      Doanh thu chờ quyết toán
                    </div>
                    <div className="text-lg font-black text-orange-500">
                      {Number(user.pending_balance || 0).toLocaleString()} <span className="text-[9px] font-bold uppercase">VNĐ</span>
                    </div>
                    <div className="text-[8px] text-orange-500/60 font-medium italic mt-0.5 uppercase tracking-tighter">
                      Dự kiến nhận sau khi sự kiện kết thúc
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-gray-100 dark:border-white/5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-3 text-gray-500">
                    <Clock className="w-4 h-4 opacity-40" />
                    <span className="font-semibold">Ngày tham gia</span>
                  </div>
                  <span className="font-bold dark:text-gray-300">{new Date(user.created_at).toLocaleString('vi-VN')}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-3 text-gray-500">
                    <Shield className="w-4 h-4 opacity-40" />
                    <span className="font-semibold">Trạng thái</span>
                  </div>
                  <span className={`font-black uppercase text-[10px] ${user.status === 'active' ? 'text-neon-green' : 'text-red-500'}`}>
                    {user.status === 'active' ? 'Đang hoạt động' : 'Đã khóa'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-black text-white rounded-[32px] p-6 space-y-4 relative overflow-hidden group border border-white/5">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Shield className="w-24 h-24" />
            </div>
            
            <div>
              <div className="flex items-center space-x-2 text-neon-green mb-1">
                <CreditCard className="w-3.5 h-3.5" />
                <span className="text-[11px] font-bold uppercase tracking-tight">Ví Web3 Custodial</span>
              </div>
              <h3 className="text-base font-black uppercase tracking-tight">Bảo mật tài sản</h3>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 font-mono text-[11px] break-all leading-relaxed relative group/wallet">
              <div className="text-gray-500 mb-2 flex items-center justify-between">
                <span>Địa chỉ Ví (Wallet)</span>
                <button className="text-neon-green opacity-0 group-hover/wallet:opacity-100 transition-all">Sao chép</button>
              </div>
              <span className="text-gray-300">{user.wallet_address || 'Chưa cập nhật'}</span>
            </div>

            <p className="text-[10px] text-gray-500 italic">
              * Đây là ví lưu ký (Custodial), Private Key được mã hóa an toàn tại server.
            </p>
          </div>
        </div>

        {/* Right Col: Tabs & Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tabs Container with scroll indicators */}
          <div className="relative group/tabs flex items-center">
            <button 
              onClick={() => {
                if (tabContainerRef.current) {
                  tabContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
                }
              }}
              className="absolute left-1 z-10 p-1.5 bg-white/90 dark:bg-black/90 rounded-full border border-gray-200 dark:border-white/10 shadow-md opacity-0 group-hover/tabs:opacity-100 transition-opacity disabled:opacity-0"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>

            <div 
              ref={tabContainerRef}
              className="flex items-center space-x-1 p-1 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-2xl overflow-x-auto no-scrollbar scroll-smooth"
            >
              {(() => {
                const baseTabs = [
                  { id: 'general', label: 'Thông tin chung', icon: User },
                  { id: 'tickets', label: `Kho vé (${ownedTickets.length})`, icon: Ticket },
                  { id: 'orders', label: `Giao dịch (${orders.length})`, icon: ShoppingBag },
                  { id: 'bot_history', label: `Chống bot (${botLogs.length})`, icon: ShieldAlert },
                  { id: 'activity', label: `Hoạt động (${user.seller_transactions?.length || 0})`, icon: ArrowRightLeft },
                  { id: 'blogs', label: `Bài viết (${user.authored_blogs?.length || 0})`, icon: FileText }
                ];

                if (user.organizer_profile) {
                  baseTabs.splice(1, 0, { id: 'organizer_events', label: `Sự kiện (${user.organizer_profile.events?.length || 0})`, icon: CalendarDays });
                  baseTabs.splice(2, 0, { id: 'merchandise', label: `Sản phẩm (${user.organizer_profile.merchandise?.length || 0})`, icon: Package });
                }

                return baseTabs.map(tab => (
                  <button
                    key={tab.id}
                    data-tab-id={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-shrink-0 flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-[11px] font-bold transition-all ${
                      activeTab === tab.id 
                        ? 'bg-neon-green text-black shadow-lg shadow-neon-green/20 scale-[1.02]' 
                        : 'text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'
                    }`}
                  >
                    <tab.icon className={`w-3.5 h-3.5 ${activeTab === tab.id ? 'animate-pulse' : 'opacity-60'}`} />
                    <span className="whitespace-nowrap">{tab.label}</span>
                  </button>
                ));
              })()}
            </div>

            <button 
              onClick={() => {
                if (tabContainerRef.current) {
                  tabContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
                }
              }}
              className="absolute right-1 z-10 p-1.5 bg-white/90 dark:bg-black/90 rounded-full border border-gray-200 dark:border-white/10 shadow-md opacity-0 group-hover/tabs:opacity-100 transition-opacity disabled:opacity-0"
            >
              <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
            
            {/* Fade indicators */}
            <div className="absolute left-10 top-0 bottom-0 w-8 bg-gradient-to-r from-gray-50 dark:from-black to-transparent pointer-events-none opacity-0 group-hover/tabs:opacity-100 transition-opacity"></div>
            <div className="absolute right-10 top-0 bottom-0 w-8 bg-gradient-to-l from-gray-50 dark:from-black to-transparent pointer-events-none opacity-0 group-hover/tabs:opacity-100 transition-opacity"></div>
          </div>

          {/* Tab Content */}
          <div className="bg-white dark:bg-[#111114] border border-gray-200 dark:border-white/5 rounded-[32px] p-6 shadow-sm dark:shadow-2xl min-h-[500px]">
            {activeTab === 'general' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] uppercase font-bold text-gray-400 tracking-tight">Họ và Tên</label>
                    <div className="text-sm font-bold dark:text-white p-3.5 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5">
                      {user.full_name || 'N/A'}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] uppercase font-bold text-gray-400 tracking-tight">Số điện thoại</label>
                    <div className="text-sm font-bold dark:text-white p-3.5 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5">
                      {user.phone_number || 'N/A'}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] uppercase font-bold text-gray-400 tracking-tight">Email</label>
                    <div className="text-sm font-bold dark:text-white p-3.5 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5">
                      {user.email}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] uppercase font-bold text-gray-400 tracking-tight">Ngày sinh</label>
                    <div className="text-sm font-bold dark:text-white p-3.5 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5">
                      {user.role === 'organizer' && user.organizer_profile?.dob_raw 
                        ? user.organizer_profile.dob_raw 
                        : (user.date_of_birth ? new Date(user.date_of_birth).toLocaleDateString('vi-VN') : 'Chưa cập nhật')}
                    </div>
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[11px] uppercase font-bold text-gray-400 tracking-tight">Phân quyền đặc biệt</label>
                    <div className="flex flex-wrap gap-2">
                      {user.permissions?.length > 0 ? (
                        user.permissions.map(p => (
                          <span key={p} className="px-2.5 py-1 bg-blue-500/10 text-blue-500 text-[10px] font-bold rounded-lg uppercase border border-blue-500/20">
                            {p}
                          </span>
                        ))
                      ) : (
                        <span className="text-[11px] text-gray-500 italic px-4 py-2 bg-gray-100 dark:bg-white/5 rounded-xl w-full">Không có phân quyền đặc biệt.</span>
                      )}
                    </div>
                  </div>
                </div>

                {user.organizer_profile && (
                  <div className="pt-6 border-t border-gray-100 dark:border-white/5">
                    <h4 className="text-[11px] font-bold uppercase tracking-tight text-gray-400 mb-4">Hồ sơ Ban tổ chức</h4>
                    <div className="bg-neon-green/5 border border-neon-green/10 rounded-2xl p-5 relative overflow-hidden">
                      <Shield className="absolute -right-6 -bottom-6 w-24 h-24 text-neon-green/10" />
                      <div className="flex items-center space-x-4 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-neon-green/20 flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-neon-green" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-base font-black dark:text-white leading-tight">{user.organizer_profile.organization_name}</div>
                          <div className={`text-[10px] font-bold uppercase ${
                            user.organizer_profile.kyc_status === 'approved' ? 'text-neon-green' : 'text-yellow-500'
                          }`}>
                            Trạng thái eKYC: {user.organizer_profile.kyc_status === 'approved' ? 'Đã phê duyệt' : user.organizer_profile.kyc_status === 'pending' ? 'Chờ kiểm tra' : 'Bị từ chối'}
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-3.5 bg-white/10 rounded-xl border border-white/10">
                          <div className="text-[10px] uppercase font-bold text-neon-green/60 mb-2">Thông tin định danh (OCR)</div>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center text-[11px]">
                              <span className="text-gray-400">Họ tên ID:</span>
                              <span className="font-bold dark:text-white">{user.organizer_profile.full_name_raw || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between items-center text-[11px]">
                              <span className="text-gray-400">Số CCCD:</span>
                              <span className="font-mono font-bold dark:text-white">{user.organizer_profile.id_number || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between items-center text-[11px] pt-1.5 border-t border-white/5">
                              <span className="text-gray-400">Giấy tờ định danh:</span>
                              <DocViewer urls={user.organizer_profile.identity_card} label="CCCD" />
                            </div>
                            {(user.organizer_profile.front_image_url || user.organizer_profile.back_image_url || user.organizer_profile.face_image_url) && (
                               <div className="flex justify-between items-center text-[11px] mt-1 pt-1.5 border-t border-white/5">
                                 <span className="text-gray-400">Ảnh thực tế eKYC:</span>
                                 <div className="flex gap-1">
                                    <DocViewer urls={user.organizer_profile.front_image_url} label="Trước" />
                                    <DocViewer urls={user.organizer_profile.back_image_url} label="Sau" />
                                    <DocViewer urls={user.organizer_profile.face_image_url} label="Mặt" />
                                 </div>
                               </div>
                            )}
                            <div className="flex flex-col text-[11px] mt-1.5 pt-1.5 border-t border-white/5">
                              <span className="text-gray-400 mb-0.5">Địa chỉ thường trú:</span>
                              <span className="font-medium dark:text-gray-300 leading-relaxed italic">{user.organizer_profile.address_raw || 'N/A'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="p-3.5 bg-white/10 rounded-xl border border-white/10">
                          <div className="text-[10px] uppercase font-bold text-neon-green/60 mb-2">Thông tin doanh nghiệp</div>
                          <div className="space-y-2">
                             <div className="flex justify-between items-center text-[11px]">
                               <span className="text-gray-400">Mã số thuế:</span>
                               <span className="font-bold dark:text-white">{user.organizer_profile.business_license || 'N/A'}</span>
                             </div>
                             <div className="flex justify-between items-center text-[11px]">
                               <span className="text-gray-400">GP Kinh doanh:</span>
                               <DocViewer urls={user.organizer_profile.business_license} label="GPKD" />
                             </div>
                             <div className="flex flex-col text-[11px] mt-1 pt-1.5 border-t border-white/5">
                               <span className="text-gray-400 mb-0.5">Địa chỉ thường trú:</span>
                               <span className="font-medium dark:text-gray-300 leading-relaxed italic line-clamp-1">{user.organizer_profile.address_raw || 'N/A'}</span>
                             </div>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 p-4 bg-white/5 rounded-[20px] border border-white/5">
                        <div className="text-[10px] uppercase font-bold text-gray-400 mb-2 italic flex items-center">
                          <Info className="w-3 h-3 mr-1" />
                          Mô tả hoạt động
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed italic">
                          {user.organizer_profile.description || 'Không có mô tả cho ban tổ chức này.'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Phần thông tin thanh toán dùng chung cho cả Customer và Organizer */}
                <div className="pt-4 border-t border-gray-100 dark:border-white/5">
                  <h4 className="text-[11px] font-bold uppercase text-gray-400 mb-4">Thông tin thanh toán & Quyết toán</h4>
                  <div className="bg-orange-500/5 border border-orange-500/10 rounded-2xl p-4 relative overflow-hidden">
                    <CreditCard className="absolute -right-6 -bottom-6 w-24 h-24 text-orange-500/10" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8 relative z-10">
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold text-orange-500/60">Ngân hàng thụ hưởng</label>
                        <div className="text-xs mt-2 font-black dark:text-white flex items-center gap-2.5">
                          {user.bank_name || 'Chưa cập nhật'}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold text-orange-500/60">Số tài khoản</label>
                        <div className="text-xs font-mono font-black dark:text-white bg-white/5 p-2.5 rounded-lg border border-white/5 line-clamp-1">
                          {user.account_number || '•••• •••• ••••'}
                        </div>
                      </div>
                      <div className="sm:col-span-2 md:col-span-1 space-y-2">
                        <label className="text-[10px] uppercase font-bold text-orange-500/60">Tên chủ tài khoản</label>
                        <div className="text-xs mt-2 font-black dark:text-white uppercase">
                          {user.account_holder || 'Chưa cập nhật'}
                        </div>
                      </div>
                    </div>

                    {!user.bank_name && (
                      <div className="mt-6 p-4 bg-orange-500/10 rounded-xl border border-orange-500/20 flex items-center gap-4">
                         <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                           <ShieldAlert className="w-5 h-5 text-orange-500" />
                         </div>
                         <div className="text-xs text-orange-500/90 font-bold leading-snug">
                            Lưu ý: Người dùng này chưa cấu hình tài khoản nhận tiền. Các khoản doanh thu từ vé hoặc Marketplace sẽ tạm thời được giữ lại cho đến khi thông tin này được cập nhật.
                         </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'organizer_events' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {/* Search & Filter for Events */}
                <div className="flex flex-col md:flex-row gap-4 mb-2">
                   <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input 
                        type="text"
                        placeholder="Tìm tên sự kiện..."
                        className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-neon-green transition-all"
                        value={eventSearch}
                        onChange={(e) => {
                          setEventSearch(e.target.value);
                          setEventPage(1);
                        }}
                      />
                   </div>
                   <select 
                     className="bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-neon-green"
                     value={eventStatusFilter}
                     onChange={(e) => {
                       setEventStatusFilter(e.target.value);
                       setEventPage(1);
                     }}
                   >
                     <option value="">Tất cả trạng thái</option>
                     <option value="active">Đang hoạt động</option>
                     <option value="pending">Chờ duyệt</option>
                     <option value="finished">Đã kết thúc</option>
                     <option value="cancelled">Đã hủy</option>
                     <option value="draft">Từ chối/Bản nháp</option>
                   </select>
                </div>

                {(() => {
                  const filtered = (user.organizer_profile?.events || []).filter(ev => {
                    const matchesSearch = ev.title.toLowerCase().includes(eventSearch.toLowerCase());
                    const isFinished = ev.event_date && new Date(ev.end_date || ev.event_date) < new Date();
                    
                    let matchesStatus = true;
                    if (eventStatusFilter) {
                      if (eventStatusFilter === 'finished') {
                        matchesStatus = isFinished;
                      } else if (eventStatusFilter === 'active') {
                        matchesStatus = ev.status === 'active' && !isFinished;
                      } else {
                        matchesStatus = ev.status === eventStatusFilter;
                      }
                    }
                    return matchesSearch && matchesStatus;
                  });
                  
                  const totalEventPages = Math.ceil(filtered.length / 4);
                  const paginatedEvents = filtered.slice((eventPage - 1) * 4, eventPage * 4);

                  return filtered.length > 0 ? (
                    <div>
                      <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
                        {paginatedEvents.map(ev => (
                          <div 
                            key={ev.id} 
                            onClick={() => setSelectedEvent(ev)}
                            className="group relative bg-white dark:bg-[#18181b] border border-gray-200 dark:border-white/10 rounded-[24px] overflow-hidden hover:border-neon-green hover:shadow-2xl hover:shadow-neon-green/20 transition-all duration-300 cursor-pointer flex flex-col"
                          >
                            <div className="relative h-36 w-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                               {ev.image_url ? (
                                 <img src={ev.image_url} alt={ev.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                               ) : (
                                 <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-white/5">
                                   <CalendarDays className="w-10 h-10 text-gray-400 opacity-50 group-hover:scale-110 transition-transform duration-700" />
                                 </div>
                               )}
                               <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
                               
                               <div className="absolute bottom-3 left-4 right-4 flex justify-between items-end">
                                  <div className="text-[10px] font-bold text-white uppercase tracking-widest bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/10">
                                     {ev.category?.name || 'Sự kiện'}
                                  </div>
                                  {(() => {
                                    const isEventFinished = ev.event_date && new Date(ev.end_date || ev.event_date) < new Date();
                                    if (isEventFinished) return <span className="text-[9px] font-black uppercase px-2 py-1 rounded bg-black/50 text-gray-400 backdrop-blur-md border border-white/10">Đã kết thúc</span>;
                                    if (ev.status === 'active') return <span className="text-[9px] font-black uppercase px-2 py-1 rounded bg-neon-green/20 text-neon-green backdrop-blur-md border border-neon-green/30">Đang hoạt động</span>;
                                    if (ev.status === 'pending') return <span className="text-[9px] font-black uppercase px-2 py-1 rounded bg-yellow-500/20 text-yellow-500 backdrop-blur-md border border-yellow-500/30">Chờ duyệt</span>;
                                    if (ev.status === 'cancelled') return <span className="text-[9px] font-black uppercase px-2 py-1 rounded bg-red-500/20 text-red-500 backdrop-blur-md border border-red-500/30">Đã hủy</span>;
                                    return <span className="text-[9px] font-black uppercase px-2 py-1 rounded bg-black/50 text-gray-400 backdrop-blur-md border border-white/10">{ev.status}</span>;
                                  })()}
                               </div>
                            </div>
                            
                            <div className="p-4 flex flex-col flex-1">
                              <h4 className="text-sm font-black text-gray-900 dark:text-white line-clamp-2 mb-3 group-hover:text-neon-green transition-colors">
                                {ev.title}
                              </h4>
                              
                              <div className="space-y-2 mt-auto">
                                 <div className="flex items-center text-[11px] text-gray-500 space-x-2">
                                    <Clock className="w-3.5 h-3.5 text-neon-green/70 shrink-0" />
                                    <span className="font-medium truncate">{ev.event_time ? ev.event_time.slice(0,5) : ''} - {new Date(ev.event_date).toLocaleDateString('vi-VN')}</span>
                                 </div>
                                 {ev.location_address && (
                                    <div className="flex items-start text-[11px] text-gray-500 space-x-2">
                                       <MapPin className="w-3.5 h-3.5 text-blue-500/70 shrink-0 mt-0.5" />
                                       <span className="font-medium line-clamp-1">{ev.location_address}</span>
                                    </div>
                                 )}
                              </div>
                            </div>

                            <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform scale-90 group-hover:scale-100">
                               <Eye className="w-4 h-4 text-white" />
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {totalEventPages > 1 && (
                        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100 dark:border-white/5">
                          <span className="text-[10px] text-gray-500 uppercase font-bold">Trang {eventPage} / {totalEventPages}</span>
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => setEventPage(p => Math.max(1, p - 1))}
                              disabled={eventPage === 1}
                              className="px-4 py-1.5 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center border border-gray-200 dark:border-white/10 hover:border-neon-green text-gray-400 hover:text-neon-green text-[10px] font-bold uppercase transition-all focus:outline-none disabled:opacity-50 disabled:hover:border-transparent disabled:hover:text-gray-400"
                            >
                              Trước
                            </button>
                            <button 
                              onClick={() => setEventPage(p => Math.min(totalEventPages, p + 1))}
                              disabled={eventPage === totalEventPages}
                              className="px-4 py-1.5 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center border border-gray-200 dark:border-white/10 hover:border-neon-green text-gray-400 hover:text-neon-green text-[10px] font-bold uppercase transition-all focus:outline-none disabled:opacity-50 disabled:hover:border-transparent disabled:hover:text-gray-400"
                            >
                              Sau
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 opacity-30 text-center">
                      <CalendarDays className="w-16 h-16 mb-4" />
                      <p className="text-sm font-bold uppercase">Không có sự kiện nào phù hợp</p>
                    </div>
                  );
                })()}
              </div>
            )}

            {activeTab === 'merchandise' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex flex-col md:flex-row gap-4 mb-2">
                   <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input 
                        type="text"
                        placeholder="Tìm tên sản phẩm..."
                        className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-neon-green transition-all"
                        value={eventSearch}
                        onChange={(e) => {
                          setEventSearch(e.target.value);
                          setMerchandisePage(1);
                        }}
                      />
                   </div>
                   <select 
                     className="bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-neon-green dark:text-gray-300"
                     value={merchandiseStatusFilter}
                     onChange={(e) => {
                       setMerchandiseStatusFilter(e.target.value);
                       setMerchandisePage(1);
                     }}
                   >
                     <option value="all">Tất cả trạng thái</option>
                     <option value="active">Đang bán</option>
                     <option value="inactive">Ngừng bán</option>
                   </select>
                </div>
                {(() => {
                  const items = user.organizer_profile?.merchandise || [];
                  const filtered = items.filter(m => {
                    const matchesSearch = m.name.toLowerCase().includes(eventSearch.toLowerCase());
                    let matchesStatus = true;
                    if (merchandiseStatusFilter === 'active') matchesStatus = m.is_active;
                    if (merchandiseStatusFilter === 'inactive') matchesStatus = !m.is_active;
                    return matchesSearch && matchesStatus;
                  });
                  
                  const totalPages = Math.ceil(filtered.length / MERCHANDISE_PER_PAGE);
                  const paginated = filtered.slice((merchandisePage - 1) * MERCHANDISE_PER_PAGE, merchandisePage * MERCHANDISE_PER_PAGE);

                  return filtered.length > 0 ? (
                    <div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
                        {paginated.map(m => (
                          <div key={m.id} className="group bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-2xl overflow-hidden hover:border-neon-green/30 transition-all flex flex-col">
                             <div className="relative h-32 w-full bg-gray-100 dark:bg-white/10 overflow-hidden">
                                {m.image_url ? (
                                  <img src={m.image_url} alt={m.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Package className="w-8 h-8 text-gray-400 opacity-30" />
                                  </div>
                                )}
                                <div className="absolute top-2 right-2">
                                   <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${
                                     m.is_active ? 'bg-neon-green/10 text-neon-green border-neon-green/20' : 'bg-red-500/10 text-red-500 border-red-500/20'
                                   }`}>
                                     {m.is_active ? 'Đang bán' : 'Ngừng bán'}
                                   </span>
                                </div>
                             </div>
                             <div className="p-3 flex-1 flex flex-col">
                                <div className="flex items-center justify-between mb-1">
                                   <h4 className="text-[11px] font-black text-gray-900 dark:text-white line-clamp-1">{m.name}</h4>
                                   <button 
                                      onClick={() => navigate(`/admin/products/${m.id}`)}
                                      className="p-1.5 rounded-lg border border-gray-100 dark:border-white/10 text-gray-400 hover:text-neon-green hover:border-neon-green/30 hover:bg-neon-green/5 transition-all outline-none"
                                      title="Xem chi tiết sản phẩm"
                                   >
                                      <Eye className="w-3 h-3" />
                                   </button>
                                </div>
                                <div className="text-[10px] text-gray-500 line-clamp-2 mb-2 italic grow">{m.description || 'Không có mô tả'}</div>
                                <div className="flex flex-col gap-1 mt-auto">
                                   <div className="flex items-center justify-between">
                                      <div className="text-xs font-black text-neon-green font-mono">{parseFloat(m.price).toLocaleString()}đ</div>
                                      <div className="text-[10px] font-bold text-gray-400 uppercase">Kho: <span className="text-gray-900 dark:text-white font-black">{m.stock}</span></div>
                                   </div>
                                   <div className="flex items-center justify-between pt-1.5 border-t border-gray-100 dark:border-white/5">
                                      <span className="text-[9px] uppercase font-bold text-gray-400">Đã bán:</span>
                                      <span className="text-[10px] font-black text-blue-500">{m.sold_count || 0}</span>
                                   </div>
                                </div>
                             </div>
                          </div>
                        ))}
                      </div>
                      
                      {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100 dark:border-white/5">
                          <span className="text-[10px] text-gray-500 uppercase font-bold">Trang {merchandisePage} / {totalPages}</span>
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => setMerchandisePage(p => Math.max(1, p - 1))}
                              disabled={merchandisePage === 1}
                              className="px-4 py-1.5 rounded-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-neon-green text-gray-400 hover:text-neon-green text-[10px] font-bold uppercase transition-all disabled:opacity-50"
                            >
                              Trước
                            </button>
                            <button 
                              onClick={() => setMerchandisePage(p => Math.min(totalPages, p + 1))}
                              disabled={merchandisePage === totalPages}
                              className="px-4 py-1.5 rounded-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-neon-green text-gray-400 hover:text-neon-green text-[10px] font-bold uppercase transition-all disabled:opacity-50"
                            >
                              Sau
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 opacity-30 text-center">
                      <Package className="w-16 h-16 mb-4" />
                      <p className="text-sm font-bold uppercase">Không có sản phẩm nào</p>
                    </div>
                  );
                })()}
              </div>
            )}

            {activeTab === 'tickets' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex flex-col sm:flex-row justify-end items-center gap-2 mb-2">
                  <select
                    value={ticketOwnershipFilter}
                    onChange={(e) => {
                      setTicketOwnershipFilter(e.target.value);
                      setTicketPage(1);
                    }}
                    className="w-full sm:w-auto bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:border-neon-green"
                  >
                    <option value="">Tất cả hình thức sở hữu</option>
                    <option value="primary">Mua gốc</option>
                    <option value="transfer">Chuyển nhượng</option>
                    <option value="resale">Mua lại từ Chợ</option>
                    <option value="transferred_out">Đã chuyển đi / Bán</option>
                  </select>
                  <select
                    value={ticketStatusFilter}
                    onChange={(e) => {
                      setTicketStatusFilter(e.target.value);
                      setTicketPage(1);
                    }}
                    className="w-full sm:w-auto bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:border-neon-green"
                  >
                    <option value="">Tất cả trạng thái vé</option>
                    <option value="unused">Chưa sử dụng</option>
                    <option value="used">Đã sử dụng</option>
                    <option value="expired">Đã hết hạn</option>
                  </select>
                </div>
                {ownedTickets.length > 0 ? (
                  filteredTickets.length > 0 ? (
                    <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {paginatedTickets.map(t => (
                        <div key={t.id} className="p-4 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-2xl space-y-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-14 h-14 rounded-lg bg-white dark:bg-white/10 flex-shrink-0 flex items-center justify-center border border-gray-200 dark:border-white/5 overflow-hidden">
                              {t.event?.image_url ? (
                                <img src={t.event.image_url} alt={t.event.title} className="w-full h-full object-cover" />
                              ) : (
                                <Ticket className="w-6 h-6 text-neon-green opacity-40" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-black text-gray-900 dark:text-white truncate mb-0.5">{t.event.title}</div>
                              <div className="text-[10px] text-gray-500 flex items-center gap-1.5 flex-wrap">
                                <span className="bg-neon-green/10 text-neon-green px-1.5 py-0.5 rounded text-[9px] font-bold uppercase">{t.ticket_tier.tier_name}</span>
                                {t.ticket_tier.section_name && (
                                  <span className="bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase">{t.ticket_tier.section_name}</span>
                                )}
                                <span className="font-mono font-medium">{t.ticket_number}</span>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                            <div className="p-2.5 rounded-xl bg-white dark:bg-black/20 border border-gray-100 dark:border-white/5">
                              <div className="text-[10px] uppercase font-bold text-gray-400 mb-0.5">Thời gian</div>
                              <div className="font-semibold text-gray-900 dark:text-white text-[11px]">
                                {t.event?.event_date ? new Date(t.event.event_date).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
                              </div>
                            </div>
                            <div className="p-2.5 rounded-xl bg-white dark:bg-black/20 border border-gray-100 dark:border-white/5">
                              <div className="text-[10px] uppercase font-bold text-gray-400 mb-0.5">Giá vé</div>
                              <div className="font-semibold text-gray-900 dark:text-white text-[11px]">
                                {t.ticket_tier?.price ? `${parseFloat(t.ticket_tier.price).toLocaleString()}đ` : 'Chưa cập nhật'}
                              </div>
                            </div>
                            <div className="p-2.5 rounded-xl bg-white dark:bg-black/20 border border-gray-100 dark:border-white/5 sm:col-span-2">
                              <div className="text-[10px] uppercase font-bold text-gray-400 mb-0.5">Địa điểm</div>
                              <div className="font-semibold text-gray-900 dark:text-white text-[11px] truncate">
                                {t.event?.location_address || 'Chưa cập nhật địa điểm'}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-1.5 pt-1">
                             <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase bg-gray-900/5 text-gray-600 dark:bg-white/10 dark:text-gray-300 border border-gray-200 dark:border-white/10">
                               {t.status}
                             </span>

                             {(() => {
                               const ownType = getTicketOwnership(t);
                               if (ownType === 'transferred_out') return <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase bg-red-500/10 text-red-500 border border-red-500/20">Đã chuyển đi</span>;
                               if (ownType === 'primary') return <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase bg-green-500/10 text-green-500 border border-green-500/20">Mua gốc</span>;
                               if (ownType === 'transfer') return <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase bg-purple-500/10 text-purple-500 border border-purple-500/20">Chuyển nhượng</span>;
                               return <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase bg-blue-500/10 text-blue-500 border border-blue-500/20">Mua từ chợ</span>;
                             })()}

                             {!t.isCurrentOwner ? (
                               <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase border bg-gray-900/10 text-gray-500 dark:bg-white/5 border-gray-200 dark:border-white/10">
                                 Không còn sở hữu
                               </span>
                             ) : t.is_used ? (
                               <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase border bg-red-500/10 text-red-500 border-red-500/20">
                                 Đã dùng
                               </span>
                             ) : (t.event && t.event.event_date && new Date(t.event.event_date) < new Date()) ? (
                               <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase border bg-gray-500/10 text-gray-500 border-gray-500/20">
                                 Đã hết hạn
                               </span>
                             ) : (
                               <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase border bg-green-500/10 text-green-500 border-green-500/20">
                                 Chưa dùng
                               </span>
                             )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {totalTicketPages > 1 && (
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-white/5">
                        <div className="text-[10px] uppercase font-bold text-gray-400">
                          Trang <span className="text-neon-green">{ticketPage}</span> / {totalTicketPages}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setTicketPage(prev => Math.max(1, prev - 1))}
                            disabled={ticketPage === 1}
                            className="px-4 py-1.5 rounded-xl border border-gray-100 dark:border-white/10 text-[11px] font-bold uppercase transition-all hover:border-neon-green/50 disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            Trước
                          </button>
                          <button
                            onClick={() => setTicketPage(prev => Math.min(totalTicketPages, prev + 1))}
                            disabled={ticketPage === totalTicketPages}
                            className="px-4 py-1.5 rounded-xl border border-gray-100 dark:border-white/10 text-[11px] font-bold uppercase transition-all hover:border-neon-green/50 disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            Sau
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 opacity-30 text-center">
                      <FilterIcon className="w-16 h-16 mb-4" />
                      <p className="text-sm font-bold uppercase">Không có vé phù hợp với bộ lọc</p>
                    </div>
                  )
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 opacity-30 text-center">
                    <Package className="w-16 h-16 mb-4" />
                    <p className="text-sm font-bold uppercase">Chưa sở hữu vé nào</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex flex-col md:flex-row gap-4 mb-2">
                   <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input 
                        type="text"
                        placeholder="Tìm mã đơn hàng..."
                        className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-neon-green transition-all dark:text-white"
                        value={orderSearch}
                        onChange={(e) => setOrderSearch(e.target.value)}
                      />
                   </div>
                   <select
                    value={orderTypeFilter}
                    onChange={(e) => setOrderTypeFilter(e.target.value)}
                    className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:border-neon-green"
                  >
                    <option value="">Tất cả hình thức</option>
                    <option value="ticket_purchase">Mua vé (Sơ cấp)</option>
                    <option value="resale_purchase">Mua lại (Thứ cấp)</option>
                    <option value="ticket_transfer">Chuyển nhượng</option>
                  </select>
                   <select
                    value={orderStatusFilter}
                    onChange={(e) => setOrderStatusFilter(e.target.value)}
                    className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:border-neon-green"
                  >
                    <option value="">Tất cả trạng thái</option>
                    <option value="paid">Đã thanh toán</option>
                    <option value="cancelled">Đã hủy</option>
                  </select>
                </div>
                {(() => {
                  const totalOrderPages = Math.ceil(filteredOrders.length / ORDERS_PER_PAGE);
                  const paginatedOrders = filteredOrders.slice((orderPage - 1) * ORDERS_PER_PAGE, orderPage * ORDERS_PER_PAGE);

                  return (
                    <div className="space-y-4">
                      {paginatedOrders.length > 0 ? (
                        paginatedOrders.map(o => (
                          <div key={o.id} className="p-3.5 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-2xl group hover:border-blue-500/30 transition-all space-y-3">
                             <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center space-x-3 min-w-0">
                                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                                     <ShoppingBag className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                   <div className="text-sm font-bold text-gray-900 dark:text-white">Đơn hàng #{o.order_number}</div>
                                     <div className="flex items-center gap-2 text-[10px] text-gray-500">
                                       <span>{new Date(o.created_at).toLocaleString('vi-VN')}</span>
                                       <span className="w-1 h-1 rounded-full bg-gray-300" />
                                       <span className="truncate max-w-[150px]">{o.event?.title || 'Chưa gắn sự kiện'}</span>
                                     </div>
                                     <div className="flex gap-1.5 mt-1.5">
                                        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-md border ${
                                          o.unifiedType === 'TICKET_PURCHASE' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                                          o.unifiedType === 'RESALE_PURCHASE' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                                          'bg-purple-500/10 text-purple-500 border-purple-500/20'
                                        }`}>
                                          {o.unifiedType === 'TICKET_PURCHASE' && 'Mua vé mới'}
                                          {o.unifiedType === 'RESALE_PURCHASE' && 'Mua lại'}
                                          {o.unifiedType === 'TICKET_TRANSFER' && 'Phí chuyển'}
                                        </span>
                                        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-md border ${
                                          o.status === 'paid' || o.status === 'completed' || o.status === 'success' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                          o.status === 'cancelled' || o.status === 'failed' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                          'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                                        }`}>
                                          {o.status}
                                        </span>
                                     </div>
                                </div>
                             </div>
                             <div className="flex items-center space-x-3">
                                <button
                                  onClick={() => navigate(`/admin/transactions/ORDER/${o.id}`)}
                                  className="p-2 rounded-lg border border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:text-neon-green hover:border-neon-green/30 hover:bg-neon-green/5 transition-all outline-none"
                                  title="Xem chi tiết"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <div className="text-right">
                                  <div className="text-sm font-black dark:text-white leading-tight">{parseFloat(o.total_amount).toLocaleString()}đ</div>
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-[11px]">
                                <div className="p-2.5 rounded-xl bg-white dark:bg-black/20 border border-gray-100 dark:border-white/5">
                                  <div className="text-[10px] uppercase font-bold text-gray-400 mb-0.5">Sự kiện</div>
                                  <div className="font-semibold text-gray-900 dark:text-white truncate">{o.event?.title || 'Chưa cập nhật'}</div>
                                </div>
                                <div className="p-2.5 rounded-xl bg-white dark:bg-black/20 border border-gray-100 dark:border-white/5">
                                  <div className="text-[10px] uppercase font-bold text-gray-400 mb-0.5">Thời gian</div>
                                  <div className="font-semibold text-gray-900 dark:text-white">
                                    {o.event?.event_date ? new Date(o.event.event_date).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
                                  </div>
                                </div>
                                <div className="p-2.5 rounded-xl bg-white dark:bg-black/20 border border-gray-100 dark:border-white/5">
                                  <div className="text-[10px] uppercase font-bold text-gray-400 mb-0.5">Thanh toán</div>
                                  <div className="font-semibold text-gray-900 dark:text-white uppercase text-[10px]">{o.payment_method || 'Chưa rõ'}</div>
                                </div>
                                <div className="p-2.5 rounded-xl bg-white dark:bg-black/20 border border-gray-100 dark:border-white/5">
                                  <div className="text-[10px] uppercase font-bold text-gray-400 mb-0.5">Số lượng</div>
                                  <div className="font-semibold text-gray-900 dark:text-white">
                                    {o.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) + 
                                     o.merchandise_items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0} món
                                  </div>
                                </div>
                              </div>
                          </div>
                        ))
                      ) : (
                        <div className="flex flex-col items-center justify-center py-20 opacity-30 text-center">
                          <ShoppingBag className="w-16 h-16 mb-4" />
                          <p className="text-sm font-bold uppercase tracking-widest">Chưa có giao dịch mua vé</p>
                        </div>
                      )}

                      {totalOrderPages > 1 && (
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-white/5">
                          <div className="text-[10px] uppercase font-bold text-gray-400">
                            Trang <span className="text-neon-green">{orderPage}</span> / {totalOrderPages}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setOrderPage(prev => Math.max(1, prev - 1))}
                              disabled={orderPage === 1}
                              className="px-4 py-1.5 rounded-xl border border-gray-100 dark:border-white/10 text-[11px] font-bold uppercase transition-all hover:border-neon-green/50 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              Trước
                            </button>
                            <button
                              onClick={() => setOrderPage(prev => Math.min(totalOrderPages, prev + 1))}
                              disabled={orderPage === totalOrderPages}
                              className="px-4 py-1.5 rounded-xl border border-gray-100 dark:border-white/10 text-[11px] font-bold uppercase transition-all hover:border-neon-green/50 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              Sau
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            {activeTab === 'bot_history' && (
              <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex justify-end mb-2">
                  <select
                    value={botEventTypeFilter}
                    onChange={(e) => {
                      setBotEventTypeFilter(e.target.value);
                      setBotPage(1);
                    }}
                    className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:border-neon-green"
                  >
                    <option value="">Tất cả sự kiện chặn bot</option>
                    {Object.keys(BOT_EVENT_TYPE_MAP).map(type => (
                      <option key={type} value={type}>{BOT_EVENT_TYPE_MAP[type]}</option>
                    ))}
                  </select>
                </div>
                {(() => {
                  const totalBotPages = Math.ceil(filteredBotLogs.length / BOTS_PER_PAGE);
                  const paginatedBotLogs = filteredBotLogs.slice((botPage - 1) * BOTS_PER_PAGE, botPage * BOTS_PER_PAGE);

                  return (
                    <div className="space-y-4">
                      {filteredBotLogs.length === 0 && botLogs.length > 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 opacity-30 text-center">
                          <FilterIcon className="w-16 h-16 mb-4" />
                          <p className="text-sm font-bold uppercase">Không có dữ liệu phù hợp với bộ lọc</p>
                        </div>
                      ) : paginatedBotLogs.length > 0 ? (
                        paginatedBotLogs.map((log) => (
                          <div key={log.id} className="p-3.5 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-2xl space-y-3">
                            <div className="flex items-center justify-between gap-4">
                              <div className="min-w-0">
                                <div className="text-sm font-bold text-gray-900 dark:text-white">
                                  {BOT_EVENT_TYPE_MAP[log.event_type] || log.event_type || 'Sự kiện chống bot'}
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-gray-500">
                                  <span>{new Date(log.created_at).toLocaleString('vi-VN')}</span>
                                  <span className="w-1 h-1 rounded-full bg-gray-300" />
                                  <span className="truncate">{log.order?.order_number ? `Số ĐH: ${log.order.order_number}` : (log.ip_address || 'Không IP')}</span>
                                </div>
                              </div>
                              <div className="flex items-center space-x-3">
                                 <button
                                   onClick={() => {
                                     setSelectedLog(log);
                                     setIsBotModalOpen(true);
                                   }}
                                   className="p-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:text-neon-green hover:border-neon-green/30 hover:bg-neon-green/5 transition-all outline-none"
                                   title="Phân tích"
                                 >
                                   <Eye className="w-3.5 h-3.5" />
                                 </button>
                                 <div className="text-right">
                                  <div className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-md inline-flex ${
                                    log.decision === 'BLOCK'
                                      ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                                      : 'bg-green-500/10 text-green-500 border border-green-500/20'
                                  }`}>
                                    {log.decision === 'BLOCK' ? 'Chặn' : 'Cho phép'}
                                  </div>
                                  <div className="text-xs font-black text-gray-900 dark:text-white mt-1 leading-none">
                                    Risk: {Number(log.risk_score || 0).toFixed(2)}
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-[11px]">
                              <div className="p-2.5 rounded-xl bg-white dark:bg-black/20 border border-gray-100 dark:border-white/5">
                                <div className="text-[10px] uppercase font-bold text-gray-400 mb-0.5">Tốc độ click</div>
                                <div className="font-semibold text-gray-900 dark:text-white">{log.click_speed_ms || 0} ms</div>
                              </div>
                              <div className="p-2.5 rounded-xl bg-white dark:bg-black/20 border border-gray-100 dark:border-white/5">
                                <div className="text-[10px] uppercase font-bold text-gray-400 mb-0.5">Điền form</div>
                                <div className="font-semibold text-gray-900 dark:text-white">{log.form_fill_duration || 0} ms</div>
                              </div>
                              <div className="p-2.5 rounded-xl bg-white dark:bg-black/20 border border-gray-100 dark:border-white/5 lg:col-span-2">
                                <div className="text-[10px] uppercase font-bold text-gray-400 mb-0.5">Nguồn truy cập</div>
                                <div className="font-semibold text-gray-900 dark:text-white truncate">{log.ip_address || 'Không có IP'}</div>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="flex flex-col items-center justify-center py-20 opacity-30 text-center">
                          <ShieldAlert className="w-16 h-16 mb-4" />
                          <p className="text-sm font-bold uppercase underline underline-offset-4">Chưa có lịch sử chống bot</p>
                        </div>
                      )}

                      {totalBotPages > 1 && (
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-white/5">
                          <div className="text-[10px] uppercase font-bold text-gray-400">
                            Trang <span className="text-neon-green">{botPage}</span> / {totalBotPages}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setBotPage(prev => Math.max(1, prev - 1))}
                              disabled={botPage === 1}
                              className="px-4 py-1.5 rounded-xl border border-gray-100 dark:border-white/10 text-[11px] font-bold uppercase transition-all hover:border-neon-green/50 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              Trước
                            </button>
                            <button
                              onClick={() => setBotPage(prev => Math.min(totalBotPages, prev + 1))}
                              disabled={botPage === totalBotPages}
                              className="px-4 py-1.5 rounded-xl border border-gray-100 dark:border-white/10 text-[11px] font-bold uppercase transition-all hover:border-neon-green/50 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              Sau
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {/* Time Filter Selector */}
                <div className="flex items-center gap-2 p-1.5 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5 w-fit">
                  {[
                    { id: 'all', label: 'Tất cả' },
                    { id: '24h', label: '24 Giờ' },
                    { id: '7d', label: '7 Ngày' },
                    { id: '30d', label: '30 Ngày' }
                  ].map(f => (
                    <button
                      key={f.id}
                      onClick={() => setActivityTimeFilter(f.id)}
                      className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${
                        activityTimeFilter === f.id 
                          ? 'bg-white dark:bg-neon-green text-gray-900 dark:text-black shadow-sm' 
                          : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {(() => {
                  const now = new Date();
                  const getCutoff = () => {
                    if (activityTimeFilter === '24h') return new Date(now - 24 * 60 * 60 * 1000);
                    if (activityTimeFilter === '7d') return new Date(now - 7 * 24 * 60 * 60 * 1000);
                    if (activityTimeFilter === '30d') return new Date(now - 30 * 24 * 60 * 60 * 1000);
                    return null;
                  };
                  const cutoff = getCutoff();

                  const activities = [
                    // Social
                    ...(user.comments || []).map(c => ({ ...c, type: 'social', subType: 'comment', date: c.created_at })),
                    ...(user.likes || []).map(l => ({ ...l, type: 'social', subType: 'like', date: l.created_at })),
                    // Assets
                    ...(user.orders || []).map(o => ({ ...o, type: 'asset', subType: 'purchase', date: o.created_at })),
                    ...(user.transfers_sent || []).map(t => ({ ...t, type: 'asset', subType: 'transfer_sent', date: t.requested_at })),
                    ...(user.transfers_received || []).map(t => ({ ...t, type: 'asset', subType: 'transfer_received', date: t.requested_at })),
                    ...(user.buyer_transactions || []).map(t => ({ ...t, type: 'asset', subType: 'marketplace_buy', date: t.created_at })),
                    ...(user.seller_transactions || []).map(t => ({ ...t, type: 'asset', subType: 'marketplace_sell', date: t.created_at })),
                    // Financial (Unified)
                    ...(user.wallet_transactions || []).map(t => ({ ...t, type: 'financial', subType: 'transaction', date: t.created_at })),
                    ...(user.withdrawal_requests || []).map(w => ({ ...w, type: 'financial', subType: 'withdrawal', date: w.created_at })),
                    // System
                    ...(user.bot_logs || []).filter(log => log.is_bot_detected).map(log => ({ ...log, type: 'system', subType: 'bot_alert', date: log.created_at }))
                  ]
                  .filter(act => !cutoff || new Date(act.date) >= cutoff)
                  .sort((a, b) => new Date(b.date) - new Date(a.date));

                  if (activities.length === 0) {
                    return (
                      <div className="flex flex-col items-center justify-center py-20 opacity-30 text-center">
                        <History className="w-16 h-16 mb-4" />
                        <p className="text-sm font-bold uppercase">Chưa có hoạt động nào</p>
                        <p className="text-[10px] mt-2 italic px-20">Mọi biến động vé, số dư và tương tác xã hội sẽ xuất hiện tại đây.</p>
                      </div>
                    );
                  }


                  const totalPages = Math.ceil(activities.length / ACTIVITY_PER_PAGE);
                  const paginatedActivities = activities.slice((activityPage - 1) * ACTIVITY_PER_PAGE, activityPage * ACTIVITY_PER_PAGE);

                  const getIcon = (act) => {
                    switch (act.subType) {
                      case 'comment': return <MessageSquare className="w-3 h-3" />;
                      case 'like': return <ThumbsUp className="w-3 h-3" />;
                      case 'purchase': return <ShoppingBag className="w-3 h-3" />;
                      case 'transfer_sent': return <ArrowRightLeft className="w-3 h-3" />;
                      case 'transfer_received': return <ArrowRightLeft className="w-3 h-3" />;
                      case 'marketplace_buy': return <Tag className="w-3 h-3" />;
                      case 'marketplace_sell': return <CreditCard className="w-3 h-3" />;
                      case 'transaction': return <Wallet className="w-3 h-3" />;
                      case 'withdrawal': return <Banknote className="w-3 h-3" />;
                      case 'bot_alert': return <AlertCircle className="w-3 h-3" />;
                      default: return <Clock className="w-3 h-3" />;
                    }
                  };

                  const getColors = (act) => {
                    switch (act.type) {
                      case 'social': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
                      case 'asset': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
                      case 'financial': return 'bg-neon-green/10 text-neon-green border-neon-green/20';
                      case 'system': return 'bg-red-500/10 text-red-500 border-red-500/20';
                      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
                    }
                  };

                  const getDotColor = (act) => {
                    switch (act.type) {
                      case 'social': return 'bg-blue-500';
                      case 'asset': return 'bg-purple-500';
                      case 'financial': return 'bg-neon-green';
                      case 'system': return 'bg-red-500';
                      default: return 'bg-gray-500';
                    }
                  };

                  const getLabel = (act) => {
                    switch (act.subType) {
                      case 'comment': return 'Bình luận';
                      case 'like': return 'Thích bài viết';
                      case 'purchase': return 'Mua vé mới';
                      case 'transfer_sent': return 'Chuyển vé đi';
                      case 'transfer_received': return 'Nhận vé tặng';
                      case 'marketplace_buy': return 'Mua vé Marketplace';
                      case 'marketplace_sell': return 'Bán vé thành công';
                      case 'transaction': return act.type_name || 'Biến động số dư';
                      case 'withdrawal': return 'Yêu cầu rút tiền';
                      case 'bot_alert': return 'Cảnh báo BOT';
                      default: return 'Hoạt động';
                    }
                  };

                  const getSummary = (act) => {
                    switch (act.subType) {
                      case 'comment': return act.blog?.title;
                      case 'like': return act.blog?.title;
                      case 'purchase': return `Đơn hàng #${act.order_number}`;
                      case 'transfer_sent': return `Gửi cho ${act.receiver?.full_name || act.receiver?.email}`;
                      case 'transfer_received': return `Từ ${act.sender?.full_name || act.sender?.email}`;
                      case 'marketplace_buy': return `Mua từ ${act.seller?.full_name}`;
                      case 'marketplace_sell': return `Bán cho ${act.buyer?.full_name}`;
                      case 'transaction': return act.description || `Số tiền: ${parseFloat(act.amount).toLocaleString()}đ`;
                      case 'withdrawal': return `Số tiền: ${parseFloat(act.amount).toLocaleString()}đ - ${act.status}`;
                      case 'bot_alert': return `Sự kiện: ${act.event_type} - Risk: ${Number(act.risk_score || 0).toFixed(2)}`;
                      default: return '';
                    }
                  };

                  return (
                    <div className="space-y-6">
                      <div className="relative space-y-3 before:absolute before:left-6 before:top-2 before:bottom-2 before:w-px before:bg-gray-100 dark:before:bg-white/5">
                        {paginatedActivities.map((act, idx) => (
                          <div key={idx} className="relative pl-12 group">
                            <div className={`absolute left-4.5 top-1 w-3 h-3 rounded-full border-2 border-white dark:border-[#111114] z-10 transition-colors ${getDotColor(act)} shadow-sm`} />
                            
                            <div className="px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-2xl group-hover:border-neon-green/30 transition-all">
                              <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2">
                                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center border ${getColors(act)}`}>
                                    {getIcon(act)}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-[10px] font-black uppercase text-gray-400 leading-none mb-1 flex items-center gap-2">
                                      {getLabel(act)}
                                      {act.status && <span className="text-[8px] opacity-60">({act.status})</span>}
                                    </div>
                                    <div className="text-sm font-bold text-gray-900 dark:text-white line-clamp-1">
                                      {getSummary(act)}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-[10px] text-gray-500 font-mono whitespace-nowrap bg-white dark:bg-white/5 px-2 py-1 rounded-lg border border-gray-100 dark:border-white/10">
                                  {new Date(act.date).toLocaleString('vi-VN')}
                                </div>
                              </div>
                              
                              {act.type === 'social' && act.content && (
                                <div className="mt-2 p-3 bg-white dark:bg-black/20 border border-gray-100 dark:border-white/5 rounded-xl italic text-xs text-gray-600 dark:text-gray-400 leading-relaxed quote">
                                  "{act.content}"
                                </div>
                              )}

                              {act.type === 'asset' && act.ticket && (
                                 <div className="mt-2 flex items-center gap-2 text-[10px] text-gray-500">
                                    <span className="font-bold text-neon-green uppercase">{act.ticket.ticket_number}</span>
                                    <span>•</span>
                                    <span className="truncate italic">{act.ticket.event?.title}</span>
                                 </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Pagination Controls */}
                      {totalPages > 1 && (
                        <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-white/5">
                          <div className="text-[10px] uppercase font-bold text-gray-400">
                            Trang <span className="text-neon-green">{activityPage}</span> / {totalPages}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setActivityPage(prev => Math.max(1, prev - 1))}
                              disabled={activityPage === 1}
                              className="px-4 rounded-xl border border-gray-100 dark:border-white/10 text-[11px] font-bold uppercase transition-all hover:border-neon-green disabled:opacity-30 disabled:hover:border-white/10 disabled:cursor-not-allowed"
                            >
                              Trước
                            </button>
                            <button
                              onClick={() => setActivityPage(prev => Math.min(totalPages, prev + 1))}
                              disabled={activityPage === totalPages}
                              className="px-4 rounded-xl border border-gray-100 dark:border-white/10 text-[11px] font-bold uppercase transition-all hover:border-neon-green disabled:opacity-30 disabled:hover:border-white/10 disabled:cursor-not-allowed"
                            >
                              Sau
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            {activeTab === 'blogs' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="text"
                    placeholder="Tìm kiếm bài viết..."
                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-neon-green transition-all dark:text-gray-300"
                    value={blogSearch}
                    onChange={(e) => {
                      setBlogSearch(e.target.value);
                      setBlogPage(1);
                    }}
                  />
                </div>
                {(() => {
                  const items = user.authored_blogs || [];
                  const filtered = items.filter(b => 
                    b.title.toLowerCase().includes(blogSearch.toLowerCase())
                  );
                  
                  const totalPages = Math.ceil(filtered.length / BLOGS_PER_PAGE);
                  const paginated = filtered.slice((blogPage - 1) * BLOGS_PER_PAGE, blogPage * BLOGS_PER_PAGE);

                  return filtered.length > 0 ? (
                    <div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                        {paginated.map(b => (
                          <div key={b.id} className="group bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-2xl overflow-hidden hover:border-blue-500/30 transition-all flex flex-col sm:flex-row h-auto sm:h-28">
                             <div className="w-full sm:w-40 h-32 sm:h-full bg-gray-100 dark:bg-white/10 overflow-hidden shrink-0">
                                {b.image_url ? (
                                  <img src={b.image_url} alt={b.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <FileText className="w-8 h-8 text-gray-400 opacity-30" />
                                  </div>
                                )}
                             </div>
                             <div className="p-4 flex-1 min-w-0 flex flex-col justify-between">
                                <h4 className="text-sm font-black text-gray-900 dark:text-white line-clamp-1 group-hover:text-blue-500 transition-colors uppercase tracking-tight">{b.title}</h4>
                                <div className="text-[10px] text-gray-500 line-clamp-1 italic italic">Sự kiện: {b.event?.title || 'Chung'}</div>
                                <div className="flex items-center justify-between mt-2">
                                   <div className="flex items-center space-x-3 text-[10px] text-gray-400 font-bold uppercase">
                                      <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {b.views} lượt xem</span>
                                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(b.created_at).toLocaleDateString('vi-VN')}</span>
                                   </div>
                                   <button 
                                      onClick={() => window.open(`/blog/${b.slug}`, '_blank')}
                                      className="text-blue-500 hover:text-blue-400 transition-colors p-1.5 rounded-lg hover:bg-blue-500/10 transition-all"
                                   >
                                      <ExternalLink className="w-4 h-4" />
                                   </button>
                                </div>
                             </div>
                          </div>
                        ))}
                      </div>
                      
                      {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100 dark:border-white/5">
                          <span className="text-[10px] text-gray-500 uppercase font-bold">Trang {blogPage} / {totalPages}</span>
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => setBlogPage(p => Math.max(1, p - 1))}
                              disabled={blogPage === 1}
                              className="px-4 py-1.5 rounded-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-blue-500 text-gray-400 hover:text-blue-500 text-[10px] font-bold uppercase transition-all disabled:opacity-50"
                            >
                              Trước
                            </button>
                            <button 
                              onClick={() => setBlogPage(p => Math.min(totalPages, p + 1))}
                              disabled={blogPage === totalPages}
                              className="px-4 py-1.5 rounded-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-blue-500 text-gray-400 hover:text-blue-500 text-[10px] font-bold uppercase transition-all disabled:opacity-50"
                            >
                              Sau
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 opacity-30 text-center">
                      <FileText className="w-16 h-16 mb-4" />
                      <p className="text-sm font-bold uppercase">Không tìm thấy bài viết nào</p>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>

        {/* Global Activity Insights Charts */}
        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* Distribution Chart */}
          <div className="p-4 sm:p-6 bg-white dark:bg-[#111114] border border-gray-100 dark:border-white/5 rounded-[32px] shadow-sm flex flex-col">
            <div className="mb-6">
              <h3 className="text-[11px] font-black uppercase text-gray-400 mb-1">Cấu trúc hành vi</h3>
              <p className="text-sm font-bold text-gray-900 dark:text-white">Phân bổ tương tác</p>
            </div>
            <div className="flex-1 min-h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Tương tác xã hội', value: (user.comments?.length || 0) + (user.likes?.length || 0) },
                      { name: 'Quản trị vé & NFT', value: (user.transfers_sent?.length || 0) + (user.transfers_received?.length || 0) + (user.organizer_profile?.events?.length || 0) },
                      { name: 'Giao dịch tài chính', value: (user.orders?.length || 0) + (user.buyer_transactions?.length || 0) + (user.wallet_transactions?.length || 0) },
                      { name: 'Bảo mật & Hệ thống', value: (user.bot_logs?.length || 0) }
                    ].filter(d => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    <Cell fill="#3B82F6" stroke="none" />
                    <Cell fill="#A855F7" stroke="none" />
                    <Cell fill="#00FF85" stroke="none" />
                    <Cell fill="#EF4444" stroke="none" />
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
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4">
              {[
                { label: 'Tương tác xã hội', color: 'bg-blue-500' },
                { label: 'Quản trị vé & NFT', color: 'bg-purple-500' },
                { label: 'Giao dịch tài chính', color: 'bg-neon-green' },
                { label: 'Bảo mật & Hệ thống', color: 'bg-red-500' }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${item.color}`} />
                  <span className="text-[9px] font-bold text-gray-500 uppercase truncate">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Trend Chart */}
          <div className="p-6 bg-white dark:bg-[#111114] border border-gray-100 dark:border-white/5 rounded-[32px] shadow-sm flex flex-col">
            <div className="mb-6">
              <h3 className="text-[11px] font-black uppercase text-gray-400 mb-1">Mật độ hoạt động</h3>
              <p className="text-sm font-bold text-gray-900 dark:text-white">7 ngày gần nhất</p>
            </div>
            <div className="flex-1 min-h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={(() => {
                  const last7Days = [...Array(7)].map((_, i) => {
                    const d = new Date();
                    d.setDate(d.getDate() - (6 - i));
                    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
                  });
                  
                  const allActivities = [
                    ...(user.comments || []).map(c => ({ ...c, date: c.created_at })),
                    ...(user.likes || []).map(l => ({ ...l, date: l.created_at })),
                    ...(user.orders || []).map(o => ({ ...o, date: o.created_at })),
                    ...(user.transfers_sent || []).map(t => ({ ...t, date: t.requested_at })),
                    ...(user.transfers_received || []).map(t => ({ ...t, date: t.requested_at })),
                    ...(user.buyer_transactions || []).map(t => ({ ...t, date: t.created_at })),
                    ...(user.seller_transactions || []).map(t => ({ ...t, date: t.created_at })),
                    ...(user.wallet_transactions || []).map(t => ({ ...t, date: t.created_at })),
                    ...(user.withdrawal_requests || []).map(w => ({ ...w, date: w.created_at })),
                    ...(user.bot_logs || []).filter(log => log.is_bot_detected).map(log => ({ ...log, date: log.created_at }))
                  ];

                  return last7Days.map(dateStr => {
                    const count = allActivities.filter(act => 
                      new Date(act.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) === dateStr
                    ).length;
                    return { date: dateStr, activities: count };
                  });
                })()}>
                  <defs>
                    <linearGradient id="colorActivitiesGlobal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
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
                      fontWeight: 'bold'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="activities" 
                    stroke="#3B82F6" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorActivitiesGlobal)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Financial Value Chart */}
          {user.role === 'organizer' && user.organizer_profile ? (
             <div className="p-6 bg-white dark:bg-[#111114] border border-gray-100 dark:border-white/5 rounded-[32px] shadow-sm flex flex-col relative overflow-hidden group transition-colors">
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] dark:opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none text-gray-900 dark:text-white">
                  <Wallet className="w-32 h-32" />
                </div>
                
                <div className="mb-6 relative z-10">
                   <h3 className="text-[11px] font-black uppercase text-blue-500/60 mb-1">Dòng tiền BTC</h3>
                   <p className="text-sm font-bold text-gray-900 dark:text-white">Doanh thu & Rút tiền (7 ngày)</p>
                </div>
                
                <div className="flex-1 min-h-[220px] w-full relative z-10">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={(() => {
                      const last7Days = [...Array(7)].map((_, i) => {
                        const d = new Date(); d.setDate(d.getDate() - (6 - i));
                        return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
                      });
                      const walletTrans = user.wallet_transactions || [];
                      const withdrawals = user.withdrawal_requests || [];

                      return last7Days.map(dateStr => {
                        const revenue = walletTrans
                          .filter(t => Number(t.amount) > 0 && new Date(t.created_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) === dateStr)
                          .reduce((sum, t) => sum + Number(t.amount), 0);
                        const withdraw = withdrawals
                          .filter(w => (w.status || '').toLowerCase() !== 'cancelled' && new Date(w.created_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) === dateStr)
                          .reduce((sum, w) => sum + Number(w.amount), 0);
                        return { date: dateStr, DoanhThu: revenue, RutTien: withdraw };
                      });
                    })()}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#4B5563', fontSize: 10, fontWeight: 'bold' }} />
                      <YAxis hide />
                      <Tooltip 
                        cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
                        contentStyle={{ backgroundColor: '#111114', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '16px', fontSize: '11px', fontWeight: 'bold', color: '#fff' }}
                        formatter={(value, name) => [`${Number(value).toLocaleString()}đ`, name === 'DoanhThu' ? 'Doanh Thu' : 'Rút Tiền']}
                      />
                      <Bar dataKey="DoanhThu" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={12} />
                      <Bar dataKey="RutTien" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={12} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/5 relative z-10">
                   <div className="flex justify-between items-end">
                      <div>
                        <p className="text-[9px] font-black text-gray-500 uppercase">Doanh thu mốc (7 ngày)</p>
                        <p className="text-lg font-black text-blue-500">
                           {(() => {
                              const last7 = new Date(); last7.setDate(last7.getDate() - 7);
                              const walletTrans = (user.wallet_transactions || []).filter(t => Number(t.amount) > 0 && new Date(t.created_at) >= last7);
                              return walletTrans.reduce((sum, t) => sum + Number(t.amount), 0).toLocaleString();
                           })()}
                           <span className="text-[10px] ml-1 uppercase">Vnđ</span>
                        </p>
                      </div>
                      <div className="flex space-x-3 items-center">
                         <div className="flex items-center text-[9px] font-bold text-gray-400 uppercase">
                            <div className="w-2 h-2 rounded-full bg-blue-500 mr-1.5"></div> Doanh Thu
                         </div>
                         <div className="flex items-center text-[9px] font-bold text-gray-400 uppercase">
                            <div className="w-2 h-2 rounded-full bg-red-500 mr-1.5"></div> Rút Tiền
                         </div>
                      </div>
                   </div>
                </div>
             </div>
          ) : (
            <div className="p-6 bg-white dark:bg-[#111114] border border-gray-100 dark:border-white/5 rounded-[32px] shadow-sm flex flex-col relative overflow-hidden group transition-colors">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] dark:opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none text-gray-900 dark:text-white">
                <TrendingUp className="w-32 h-32" />
              </div>
              
              <div className="mb-6 relative z-10">
                 <h3 className="text-[11px] font-black uppercase text-neon-green/60 mb-1">Giá trị giao dịch</h3>
                 <p className="text-sm font-bold text-gray-900 dark:text-white">Lưu lượng VNĐ ( 7 ngày )</p>
              </div>
              
              <div className="flex-1 min-h-[220px] w-full relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={(() => {
                    const last7Days = [...Array(7)].map((_, i) => {
                      const d = new Date();
                      d.setDate(d.getDate() - (6 - i));
                      return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
                    });
  
                    const financialMoves = [
                      ...(user.orders || []).filter(o => (o.status || '').toLowerCase() !== 'cancelled').map(o => ({ date: o.created_at, amount: o.total_amount })),
                      ...(user.buyer_transactions || []).filter(t => (t.status || '').toLowerCase() !== 'cancelled').map(t => ({ date: t.created_at, amount: t.buyer_pay_amount })),
                      ...(user.wallet_transactions || []).map(t => ({ date: t.created_at, amount: Math.abs(t.amount) })),
                      ...(user.withdrawal_requests || []).filter(w => (w.status || '').toLowerCase() !== 'cancelled').map(w => ({ date: w.created_at, amount: w.amount }))
                    ];
  
                    return last7Days.map(dateStr => {
                      const volume = financialMoves
                        .filter(m => new Date(m.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) === dateStr)
                        .reduce((sum, m) => sum + (Number(m.amount) || 0), 0);
                      return { date: dateStr, volume };
                    });
                  })()}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#4B5563', fontSize: 10, fontWeight: 'bold' }} 
                    />
                    <YAxis hide />
                    <Tooltip 
                      cursor={{ fill: 'rgba(0, 255, 133, 0.05)' }}
                      contentStyle={{ 
                        backgroundColor: '#111114', 
                        border: '1px solid rgba(0, 255, 133, 0.2)',
                        borderRadius: '16px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        color: '#fff'
                      }}
                      formatter={(value) => [`${Number(value).toLocaleString()}đ`, 'Khối lượng']}
                    />
                    <Bar 
                      dataKey="volume" 
                      fill="#00FF85" 
                      radius={[6, 6, 0, 0]}
                      barSize={20}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/5 relative z-10">
                 <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[9px] font-black text-gray-500 uppercase">Tổng ước tính ( 7 ngày )</p>
                      <p className="text-lg font-black text-neon-green">
                         {(() => {
                            const last7 = new Date(); last7.setDate(last7.getDate() - 7);
                            const financialMoves = [
                              ...(user.orders || []).filter(o => (o.status || '').toLowerCase() !== 'cancelled' && new Date(o.created_at) >= last7).map(o => o.total_amount),
                              ...(user.buyer_transactions || []).filter(t => (t.status || '').toLowerCase() !== 'cancelled' && new Date(t.created_at) >= last7).map(t => t.buyer_pay_amount),
                              ...(user.organizer_profile?.wallet_transactions || []).filter(t => new Date(t.created_at) >= last7).map(t => Math.abs(t.amount)),
                              ...(user.organizer_profile?.withdrawal_requests || []).filter(w => (w.status || '').toLowerCase() !== 'cancelled' && new Date(w.created_at) >= last7).map(w => w.amount)
                            ].flat();
                            const total = financialMoves.reduce((sum, val) => sum + (Number(val) || 0), 0);
                            return total.toLocaleString();
                         })()}
                         <span className="text-[10px] ml-1 uppercase">Vnđ</span>
                      </p>
                    </div>
                    <div className="flex items-center text-neon-green animate-pulse">
                      <TrendingUp className="w-4 h-4 mr-1" />
                      <span className="text-[10px] font-bold uppercase">Live Stats</span>
                    </div>
                 </div>
              </div>
            </div>
          )}
        </div>
      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-[#111114] w-full max-w-2xl rounded-[32px] overflow-hidden shadow-2xl border border-white/10 slide-in-from-bottom-8 duration-500">
            <div className="relative h-64 overflow-hidden">
               {selectedEvent.image_url ? (
                 <img src={selectedEvent.image_url} alt={selectedEvent.title} className="w-full h-full object-cover" />
               ) : (
                 <div className="w-full h-full bg-neon-green/10 flex items-center justify-center">
                   <CalendarDays className="w-20 h-20 text-neon-green opacity-20" />
                 </div>
               )}
               <button 
                onClick={() => setSelectedEvent(null)}
                className="absolute top-6 right-6 p-3 bg-black/50 hover:bg-black/80 text-white rounded-2xl backdrop-blur-md transition-all border border-white/10"
               >
                 <X className="w-5 h-5" />
               </button>
               <div className="absolute bottom-6 left-6">
                 <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-tight shadow-xl ${
                   selectedEvent.status === 'active' ? 'bg-neon-green text-black' : 'bg-yellow-500 text-black'
                 }`}>
                   {selectedEvent.status}
                 </span>
               </div>
            </div>
 
            <div className="p-8 space-y-8">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-neon-green font-bold uppercase text-[11px] tracking-tight">
                    <Tag className="w-3.5 h-3.5" />
                    <span>{selectedEvent.category?.name}</span>
                  </div>
                  <h2 className="text-3xl font-black text-gray-900 dark:text-white leading-tight uppercase tracking-tighter">
                    {selectedEvent.title}
                  </h2>
                </div>
                <button 
                  onClick={() => window.open(`/event/${selectedEvent.id}`, '_blank')}
                  className="flex items-center space-x-2 px-6 py-3 bg-neon-green/10 text-neon-green border border-neon-green/20 rounded-2xl hover:bg-neon-green hover:text-black transition-all font-black text-xs uppercase"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Trang Public</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-gray-50 dark:bg-white/5 rounded-3xl border border-gray-100 dark:border-white/5">
                <div className="space-y-1">
                  <div className="text-[11px] font-bold text-gray-400 uppercase tracking-tight flex items-center space-x-2">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Thời gian bắt đầu</span>
                  </div>
                  <div className="text-sm font-bold dark:text-white uppercase">
                    {new Date(selectedEvent.event_date).toLocaleString('vi-VN')}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-[11px] font-bold text-gray-400 uppercase tracking-tight flex items-center space-x-2">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Địa điểm</span>
                  </div>
                  <div className="text-sm font-bold dark:text-white truncate">
                    {selectedEvent.location_address || 'Hội trường trực tuyến'}
                  </div>
                </div>

                <div className="md:col-span-2 pt-4 border-t border-gray-100 dark:border-white/5 flex items-center space-x-4">
                   <div className="flex-1">
                      <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Địa chỉ cụ thể</div>
                      <div className="text-xs text-gray-500 italic">{selectedEvent.location_address || 'N/A'}</div>
                   </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Mô tả sự kiện</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed max-h-40 overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-white/10">
                  {selectedEvent.description || 'Không có mô tả chi tiết cho sự kiện này.'}
                </div>
              </div>

              <div className="flex justify-end pt-4">
                 <button 
                  onClick={() => setSelectedEvent(null)}
                  className="px-8 py-3 dark:text-gray-500 font-black text-xs uppercase hover:text-white transition-colors"
                 >
                   Đóng cửa sổ
                 </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Bot Detail Modal */}
      {isBotModalOpen && selectedLog && (
        <BotDetailModal 
          log={selectedLog} 
          onClose={() => {
            setIsBotModalOpen(false);
            setSelectedLog(null);
          }} 
          onProcess={async (id, action) => {
            try {
              const toastId = toast.loading('Đang xử lý...');
              await adminService.processFraudAlert(id, action);
              toast.success('Đã cập nhật trạng thái!', { id: toastId });
              fetchUserDetail(); // Refresh user data to see updated status
              setIsBotModalOpen(false);
              setSelectedLog(null);
            } catch (err) {
              toast.error('Lỗi khi xử lý.');
            }
          }}
        />
      )}
      </div>
    </div>
  );
};

// --- Helper & Sub-components ---

const normalizeBehaviorMetrics = (metrics = {}) => {
  const mouseDistance = metrics.mouse_distance ?? metrics.mouseDistance ?? 0;
  const clickCount = metrics.click_count ?? metrics.clickCount ?? metrics.totalClicks ?? 0;
  const timeToFirstClick = metrics.time_to_first_click ?? metrics.timeToFirstClick ?? 0;
  const mouseMovements = metrics.mouse_movements ?? metrics.mouseMovements ?? [];

  return {
    mouseDistance,
    clickCount,
    timeToFirstClick,
    mouseMovements: Array.isArray(mouseMovements) ? mouseMovements : []
  };
};

const RiskBadge = ({ score }) => {
  const s = parseFloat(score);
  let color = 'text-green-600 bg-green-50 dark:bg-green-500/10 dark:text-green-500 border-green-200 dark:border-green-500/20';
  let label = 'An toàn';
  
  if (s > 0.7) {
    color = 'text-red-600 bg-red-50 dark:bg-red-500/10 dark:text-red-500 border-red-200 dark:border-red-500/20';
    label = 'Rất Nguy hiểm';
  } else if (s > 0.4) {
    color = 'text-orange-600 bg-orange-50 dark:bg-orange-500/10 dark:text-orange-500 border-orange-200 dark:border-orange-500/20';
    label = 'Cần lưu ý';
  } else if (s > 0.2) {
    color = 'text-yellow-600 bg-yellow-50 dark:bg-yellow-500/10 dark:text-yellow-500 border-yellow-200 dark:border-yellow-500/20';
    label = 'Rủi ro thấp';
  }

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase border ${color}`}>
      {label} ({s.toFixed(2)})
    </span>
  );
};

const DocViewer = ({ urls, label = "Tài liệu" }) => {
  if (!urls) return <span className="text-gray-500 italic opacity-40">N/A</span>;
  
  const urlList = typeof urls === 'string' ? urls.split(',').filter(u => u.trim()) : [];
  if (urlList.length === 0) return <span className="text-gray-500 italic opacity-40">N/A</span>;

  return (
    <div className="flex flex-wrap gap-1.5 justify-end">
      {urlList.map((url, idx) => {
        const isImage = /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(url) || url.includes('cloudinary');
        return (
          <a 
            key={idx}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1.5 px-2 py-1 bg-white/5 hover:bg-neon-green/10 border border-white/10 hover:border-neon-green/30 rounded-lg transition-all group"
            title={`Xem ${label} ${urlList.length > 1 ? idx + 1 : ''}`}
          >
            {isImage ? (
                <ImageIcon className="w-3 h-3 text-neon-green group-hover:scale-110 transition-transform" />
            ) : (
                <FileText className="w-3 h-3 text-blue-400 group-hover:scale-110 transition-transform" />
            )}
            <span className="text-[9px] font-black text-gray-400 group-hover:text-neon-green uppercase whitespace-nowrap">
              {label}{urlList.length > 1 ? ` #${idx + 1}` : ''}
            </span>
          </a>
        );
      })}
    </div>
  );
};

const BotDetailModal = ({ log, onClose, onProcess }) => {
  const normalizedMetrics = normalizeBehaviorMetrics(log.behavior_metrics);
  
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#111114] rounded-[32px] shadow-2xl flex flex-col overflow-hidden max-h-[90vh] animate-in zoom-in-95 duration-300 border border-white/10">
        
        {/* Modal Header */}
        <div className="px-8 py-6 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-2xl ${parseFloat(log.risk_score) > 0.7 ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase text-gray-900 dark:text-white tracking-tighter">Phân tích Chống Bot 360°</h2>
              <p className="text-xs font-bold text-gray-500 mt-1 uppercase tracking-widest">{BOT_EVENT_TYPE_MAP[log.event_type] || log.event_type} • ID: {log.id.split('-')[0]}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
          {/* User & IP Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="p-5 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
              <div className="flex items-center text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">
                <Globe className="w-4 h-4 mr-2" />
                Nguồn truy cập
              </div>
              <p className="text-xs font-bold text-gray-900 dark:text-white font-mono">{log.ip_address || 'Không xác định'}</p>
              <p className="text-[10px] text-gray-500 mt-2 line-clamp-2" title={log.user_agent}>{log.user_agent}</p>
            </div>
            <div className="p-5 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
              <div className="flex items-center text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">
                <Clock className="w-4 h-4 mr-2" />
                Chỉ số Phản hồi
              </div>
              <div className="flex items-center space-x-8">
                <div>
                  <p className="text-2xl font-black text-gray-900 dark:text-white leading-none">{log.click_speed_ms}<span className="text-[10px] text-gray-400 ml-1 font-black uppercase tracking-widest">ms</span></p>
                  <p className="text-[9px] font-black text-gray-500 mt-2 uppercase tracking-tight">Tốc độ Click</p>
                </div>
                <div className="w-px h-10 bg-gray-200 dark:bg-white/10"></div>
                <div>
                  <p className="text-2xl font-black text-gray-900 dark:text-white leading-none">{log.form_fill_duration}<span className="text-[10px] text-gray-400 ml-1 font-black uppercase tracking-widest">ms</span></p>
                  <p className="text-[9px] font-black text-gray-500 mt-2 uppercase tracking-tight">Hoàn thành Form</p>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Behavior Analysis */}
          {log.behavior_metrics && Object.keys(log.behavior_metrics).length > 0 && (
            <div className="p-6 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
              <div className="flex items-center text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">
                <Settings className="w-4 h-4 mr-2" />
                Hành vi Chuyên sâu
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                <div>
                  <p className="text-lg font-black text-gray-900 dark:text-white leading-none">{normalizedMetrics.mouseDistance}<span className="text-[10px] text-gray-400 ml-1 font-black">px</span></p>
                  <p className="text-[9px] font-black text-gray-500 mt-2 uppercase tracking-tight">Di chuyển chuột</p>
                </div>
                <div className="sm:border-l sm:border-gray-200 dark:sm:border-white/10 sm:pl-6">
                  <p className="text-lg font-black text-gray-900 dark:text-white leading-none">{normalizedMetrics.mouseMovements.length}<span className="text-[10px] text-gray-400 ml-1 font-black">lần</span></p>
                  <p className="text-[9px] font-black text-gray-500 mt-2 uppercase tracking-tight">Hành trình chuột</p>
                </div>
                <div className="border-t pt-4 mt-2 sm:border-t-0 sm:pt-0 sm:mt-0 sm:border-l sm:border-gray-200 dark:sm:border-white/10 sm:pl-6">
                  <p className="text-lg font-black text-gray-900 dark:text-white leading-none">{normalizedMetrics.clickCount}<span className="text-[10px] text-gray-400 ml-1 font-black">lần</span></p>
                  <p className="text-[9px] font-black text-gray-500 mt-2 uppercase tracking-tight">Tổng tương tác</p>
                </div>
                <div className="border-t pt-4 mt-2 sm:border-t-0 sm:pt-0 sm:mt-0 sm:border-l sm:border-gray-200 dark:sm:border-white/10 sm:pl-6">
                  <p className="text-lg font-black text-gray-900 dark:text-white leading-none">{normalizedMetrics.timeToFirstClick}<span className="text-[10px] text-gray-400 ml-1 font-black">ms</span></p>
                  <p className="text-[9px] font-black text-gray-500 mt-2 uppercase tracking-tight">Độ trễ tương tác</p>
                </div>
              </div>
            </div>
          )}

          {/* Evaluation Details */}
          <div className="space-y-4">
            <div className="flex items-center text-[10px] font-black uppercase tracking-widest text-gray-400">
              <ShieldAlert className="w-4 h-4 mr-2" />
              Cơ sở đánh giá phân tích
            </div>
            <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-6 border border-gray-100 dark:border-white/5 space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-white/10">
                <span className="text-xs text-gray-600 dark:text-gray-400 font-bold uppercase tracking-widest">Bảo mật Captcha</span>
                <span className={`text-xs font-black uppercase ${(log.detection_details?.recaptchaScore ?? 1.0) >= 0.5 ? 'text-neon-green' : 'text-red-500'}`}>
                    {(log.detection_details?.recaptchaScore ?? 1.0) >= 0.5 ? `Hợp lệ (${log.detection_details?.recaptchaScore ?? '1.0'})` : 'Bất thường'}
                </span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-white/10">
                <span className="text-xs text-gray-600 dark:text-gray-400 font-bold uppercase tracking-widest">Đánh giá rủi ro AI</span>
                <div className="text-right">
                  <div className="text-xs font-black text-blue-500 uppercase pb-1">AI Risk Index: {log.detection_details?.aiRiskScore ?? log.risk_score}</div>
                  <RiskBadge score={log.risk_score} />
                </div>
              </div>
              <div className="pt-2">
                <p className="text-[10px] text-gray-400 mb-4 font-black uppercase tracking-widest">Kết luận từ hệ thống AI:</p>
                <div className="text-sm text-gray-800 dark:text-gray-300 leading-relaxed border-l-4 border-neon-green/30 pl-6 py-2 bg-neon-green/5 rounded-r-xl">
                  {(() => {
                      const detailsData = Array.isArray(log.detection_details) 
                          ? log.detection_details 
                          : log.detection_details?.details;
                          
                      return detailsData && detailsData.length > 0 ? (
                          <ul className="list-disc pl-4 space-y-3 marker:text-neon-green">
                              {detailsData.map((reason, index) => (
                                  <li key={index} className="font-bold">{reason}</li>
                              ))}
                          </ul>
                      ) : (
                          <p className="italic font-medium opacity-60">Mẫu hành vi bình thường. Không ghi nhận dấu hiệu vi phạm hoặc sử dụng script tự động.</p>
                      );
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-8 py-6 bg-gray-50 dark:bg-white/5 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
          <button 
            onClick={onClose}
            className="px-6 py-3 border border-gray-200 dark:border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
          >
            Đóng cửa sổ
          </button>
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => onProcess(log.id, 'safe')}
              className="px-6 py-3 bg-neon-green/10 text-neon-green border border-neon-green/20 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-neon-green hover:text-black transition-all"
            >
              Đánh dấu an toàn
            </button>
            <button 
              onClick={() => {
                if(window.confirm(`Xác nhận khóa tài khoản người dùng liên quan?`)) {
                  onProcess(log.id, 'ban_user')
                }
              }}
              className="px-6 py-3 bg-red-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
            >
              Cấm tài khoản
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetail;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Search, 
  Filter, 
  MoreVertical,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  ExternalLink,
  User,
  Tag,
  Clock,
  Eye,
  Building2,
  CalendarDays,
  LayoutGrid,
  List,
  Star,
  EyeOff,
  ClipboardList,
  History
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { adminService } from '../../services/admin.service';

const EventManagement = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0 });
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'list' or 'grid'
  const [filters, setFilters] = useState({
    keyword: '',
    status: '',
    from: '',
    to: ''
  });
  const [processingId, setProcessingId] = useState(null);
  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelEventId, setCancelEventId] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEvents();
    }, 500);
    return () => clearTimeout(timer);
  }, [filters.status, filters.from, filters.to]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await adminService.getEvents({ 
        status: filters.status || undefined,
        keyword: filters.keyword || undefined,
        from: filters.from || undefined,
        to: filters.to || undefined
      });
      setEvents(response.data);
      if (response.meta) {
        setStats(response.meta);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Không thể tải danh sách sự kiện');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchEvents();
  };

  const handleAction = async (id, action) => {
    try {
      setProcessingId(id);
      const response = await adminService.approveEvent(id, { action });
      toast.success(response.message);
      fetchEvents();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Thao tác thất bại');
    } finally {
      setProcessingId(null);
    }
  };

  const handleToggleFeatured = async (id) => {
    try {
      setProcessingId(id);
      const response = await adminService.toggleFeaturedEvent(id);
      toast.success(response.message);
      setEvents(prev => prev.map(ev => ev.id === id ? { ...ev, is_featured: response.is_featured } : ev));
    } catch (error) {
      toast.error('Không thể thay đổi trạng thái nổi bật');
    } finally {
      setProcessingId(null);
    }
  };

  const handleForceCancel = async () => {
    if (!cancelReason.trim()) {
      toast.error('Vui lòng nhập lý do hủy');
      return;
    }
    try {
      setProcessingId(cancelEventId);
      const response = await adminService.forceCancelEvent(cancelEventId, { reason: cancelReason });
      toast.success(response.message || 'Đã hủy sự kiện khẩn cấp');
      setShowCancelModal(false);
      setCancelReason('');
      fetchEvents();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Thao tác thất bại');
    } finally {
      setProcessingId(null);
    }
  };

  const handleToggleHide = async (id, currentStatus) => {
    try {
      setProcessingId(id);
      const action = currentStatus === 'hidden' ? 'active' : 'hide'; 
      const response = await adminService.approveEvent(id, { action });
      toast.success(response.message);
      fetchEvents();
    } catch (error) {
      toast.error('Không thể thay đổi trạng thái ẩn/hiện');
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <span className="px-3 py-1 bg-green-500 text-white shadow-lg shadow-green-500/20 rounded-full text-[10px] font-black border border-green-400/30">Đang hoạt động</span>;
      case 'pending':
        return <span className="px-3 py-1 bg-yellow-500 text-white shadow-lg shadow-yellow-500/20 rounded-full text-[10px] font-black border border-yellow-400/30">Chờ duyệt</span>;
      case 'cancelled':
        return <span className="px-3 py-1 bg-red-500 text-white shadow-lg shadow-red-500/20 rounded-full text-[10px] font-black  border border-red-400/30">Đã hủy</span>;
      case 'hidden':
        return <span className="px-3 py-1 bg-blue-500 text-white shadow-lg shadow-blue-500/20 rounded-full text-[10px] font-black border border-blue-400/30">Đã ẩn</span>;
      case 'completed':
        return <span className="px-3 py-1 bg-purple-500 text-white shadow-lg shadow-purple-500/20 rounded-full text-[10px] font-black border border-purple-400/30">Đã kết thúc</span>;
      case 'settled':
        return <span className="px-3 py-1 bg-teal-500 text-white shadow-lg shadow-teal-500/20 rounded-full text-[10px] font-black border border-teal-400/30">Đã quyết toán</span>;
      case 'pending_cancel':
        return <span className="px-3 py-1 bg-red-600 text-white shadow-lg shadow-red-600/20 rounded-full text-[10px] font-black border border-red-500/30">Chờ hủy khẩn cấp</span>;
      case 'pending_cancellation_fee':
        return <span className="px-3 py-1 bg-purple-600 text-white shadow-lg shadow-purple-600/20 rounded-full text-[10px] font-black border border-purple-500/30">Chờ nộp phí hủy</span>;
      case 'pending_reschedule':
        return <span className="px-3 py-1 bg-orange-500 text-white shadow-lg shadow-orange-500/20 rounded-full text-[10px] font-black border border-orange-400/30">Chờ dời lịch</span>;
      default:
        return <span className="px-3 py-1 bg-gray-600 text-white shadow-lg shadow-gray-500/20 rounded-full text-[10px] font-black border border-gray-400/30">{status === 'draft' ? 'Bản nháp' : status}</span>;
    }
  };

  return (
    <div className="space-y-3 md:space-y-4 animate-in fade-in duration-500 w-full mx-auto">
      {/* Header & Stats section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white flex items-center space-x-3 uppercase tracking-tight">
            <div className="p-2 bg-neon-green/10 rounded-xl">
              <CalendarDays className="w-5 h-5 sm:w-6 sm:h-6 text-neon-green" />
            </div>
            <span>Quản lý Sự kiện</span>
          </h1>
          <p className="text-gray-700 dark:text-gray-400 mt-1 text-xs sm:text-sm font-medium">
            Theo dõi và điều phối hệ thống sự kiện.
          </p>
        </div>
 
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:flex items-center gap-3 w-full lg:w-auto">
          <button 
            onClick={() => setFilters({ ...filters, status: '' })}
            className={`p-3 rounded-2xl border flex items-center space-x-3 sm:space-x-4 transition-all w-full lg:min-w-[160px] ${
              !filters.status 
                ? 'bg-neon-green/10 border-neon-green/30 text-neon-green shadow-sm' 
                : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/5 text-gray-700 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/10'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              !filters.status ? 'bg-neon-green/20' : 'bg-gray-100 dark:bg-white/5'
            }`}>
              <Calendar className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="text-[10px] uppercase font-bold opacity-60">Tất cả</div>
              <div className="text-lg sm:text-xl font-black">{stats.total}</div>
            </div>
          </button>
 
          <button 
            onClick={() => setFilters({ ...filters, status: 'pending' })}
            className={`p-3 rounded-2xl border flex items-center space-x-3 sm:space-x-4 transition-all w-full lg:min-w-[160px] ${
              filters.status === 'pending' 
                ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500 shadow-sm' 
                : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/5 text-gray-700 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/10'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              filters.status === 'pending' ? 'bg-yellow-500/20' : 'bg-gray-100 dark:bg-white/5'
            }`}>
              <Clock className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="text-[10px] uppercase font-bold opacity-60">Chờ duyệt</div>
              <div className="text-lg sm:text-xl font-black">{stats.pending}</div>
            </div>
          </button>

          <button 
            onClick={() => setShowRequestsModal(true)}
            className="p-3 rounded-2xl border flex items-center space-x-3 sm:space-x-4 transition-all w-full lg:min-w-[200px] bg-white dark:bg-white/5 border-gray-200 dark:border-white/5 text-gray-700 dark:text-gray-400 hover:bg-neon-green/10 hover:border-neon-green/30 hover:text-neon-green group"
          >
            <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-neon-green/20">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="text-[10px] uppercase font-bold opacity-60">Yêu cầu dời/hủy</div>
              <div className="text-xs font-black">Xem danh sách</div>
            </div>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-[#111114] p-3 rounded-2xl border border-gray-200 dark:border-white/5 flex flex-col md:flex-row items-stretch md:items-center gap-3 shadow-sm">
        <form onSubmit={handleSearch} className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
          <input 
            type="text"
            placeholder="Tìm theo tên sự kiện..."
            className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl py-2 pl-11 pr-4 text-sm focus:outline-none focus:border-neon-green/50 transition-all dark:text-white text-gray-900"
            value={filters.keyword}
            onChange={(e) => setFilters({...filters, keyword: e.target.value})}
          />
        </form>
 
        <div className="flex flex-col sm:flex-row gap-2">
          <select 
            className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-neon-green/50 font-bold"
            value={filters.status}
            onChange={(e) => setFilters({...filters, status: e.target.value})}
          >
            <option value="">Tất cả Trạng thái</option>
            <option value="pending">Chờ duyệt</option>
            <option value="active">Đang hoạt động</option>
            <option value="completed">Đã kết thúc</option>
            <option value="settled">Đã quyết toán</option>
            <option value="cancelled">Đã hủy</option>
            <option value="draft">Bản nháp</option>
          </select>
 
          <div className="flex items-center space-x-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-1 focus-within:border-neon-green/50 transition-all flex-1">
            <div className="flex flex-col flex-1">
              <label className="text-[9px] text-gray-500 dark:text-gray-500 font-bold uppercase ml-1">Từ ngày</label>
              <input 
                type="date" 
                className="bg-transparent text-gray-700 dark:text-gray-300 text-[11px] focus:outline-none transition-colors border-none p-0 h-4"
                value={filters.from}
                onChange={(e) => setFilters({...filters, from: e.target.value})}
              />
            </div>
            <div className="h-4 w-px bg-gray-200 dark:bg-white/10 mx-1" />
            <div className="flex flex-col flex-1">
              <label className="text-[9px] text-gray-600 dark:text-gray-500 font-bold uppercase ml-1">Đến ngày</label>
              <input 
                type="date" 
                className="bg-transparent text-gray-700 dark:text-gray-300 text-[11px] focus:outline-none transition-colors border-none p-0 h-4"
                value={filters.to}
                onChange={(e) => setFilters({...filters, to: e.target.value})}
              />
            </div>
          </div>
 
          <div className="flex items-center bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-1 justify-center">
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-white/10 text-neon-green shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              title="Dạng danh sách"
            >
              <List className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-white/10 text-neon-green shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              title="Dạng lưới"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
          
          <button 
            onClick={fetchEvents}
            className="p-2 bg-neon-green text-black rounded-xl hover:bg-neon-hover transition-all font-bold text-xs px-6 shadow-sm shadow-neon-green/20 uppercase"
          >
            Lọc
          </button>
        </div>
      </div>

      {/* Content Rendering */}
      {loading ? (
        <div className="bg-white dark:bg-[#111114] rounded-2xl border border-gray-200 dark:border-white/5 p-20 flex flex-col items-center justify-center shadow-sm">
          <Loader2 className="w-8 h-8 text-neon-green animate-spin mb-4" />
          <p className="text-gray-600 uppercase text-[10px] font-black tracking-widest">Đang tải dữ liệu...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white dark:bg-[#111114] rounded-2xl border border-gray-200 dark:border-white/5 p-20 flex flex-col items-center justify-center shadow-sm opacity-50 italic text-sm">
           Không tìm thấy sự kiện nào.
        </div>
      ) : viewMode === 'list' ? (
        <div className="bg-white dark:bg-[#111114] rounded-2xl border border-gray-200 dark:border-white/5 overflow-hidden shadow-sm animate-in slide-in-from-bottom-2 duration-300">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/5 text-[10px] sm:text-xs uppercase font-black text-gray-700 dark:text-gray-400">
                  <th className="px-4 sm:px-6 py-4">Sự kiện</th>
                  <th className="px-6 py-4 hidden lg:table-cell">Ban tổ chức</th>
                  <th className="px-6 py-4 hidden sm:table-cell">Vé đã bán</th>
                  <th className="px-6 py-4 hidden md:table-cell">Thời gian</th>
                  <th className="px-4 sm:px-6 py-4 text-center">Trạng thái</th>
                  <th className="px-4 sm:px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {events.map((event) => (
                  <tr key={event.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.01] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                         <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-white/5 overflow-hidden flex-shrink-0 border border-gray-200 dark:border-white/10">
                            {event.image_url ? (
                               <img src={event.image_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                               <Calendar className="w-5 h-5 m-auto text-gray-500" />
                            )}
                         </div>
                         <div className="flex flex-col min-w-0">
                            <span className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-neon-green transition-colors truncate max-w-[200px] tracking-tight">
                              {event.title}
                            </span>
                            <div className="flex items-center space-x-1.5 text-[10px] text-gray-500 font-bold uppercase mt-0.5">
                              <Tag className="w-3 h-3 text-neon-green opacity-50" />
                              <span className="opacity-70">{event.category?.name}</span>
                            </div>
                         </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <div className="flex items-center space-x-2">
                         <Building2 className="w-3.5 h-3.5 text-blue-500 opacity-60" />
                         <span className="text-sm font-semibold text-gray-800 dark:text-gray-300 truncate max-w-[150px]">
                           {event.organizer?.organization_name}
                         </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-gray-900 dark:text-white">
                          {event.sold_tickets || 0} <span className="text-gray-500 font-bold">/ {event.total_tickets || 0}</span>
                        </span>
                        <span className="text-[10px] text-gray-500 uppercase font-bold tracking-tighter">Vé hệ thống</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <div className="flex flex-col">
                        <div className="flex items-center space-x-2 text-xs font-bold text-gray-800 dark:text-gray-300">
                          <Calendar className="w-3.5 h-3.5 text-neon-green opacity-50" />
                          <span>
                            {format(new Date(event.event_date), 'dd/MM/yyyy')}
                            {event.end_date && format(new Date(event.event_date), 'yyyy-MM-dd') !== format(new Date(event.end_date), 'yyyy-MM-dd') && (
                               <span className="opacity-40 font-medium mx-1">→ {format(new Date(event.end_date), 'dd/MM/yyyy')}</span>
                            )}
                          </span>
                        </div>
                        <div className="text-[10px] text-gray-500 font-bold ml-5 mt-0.5 flex items-center space-x-1 uppercase italic">
                           <Clock className="w-3 h-3 opacity-40 shrink-0" />
                           <span>Giờ: {event.event_time || '00:00'} - {event.end_time || '--:--'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-center">
                      {getStatusBadge(event.status)}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        {(event.status === 'pending') && (
                          <div className="flex space-x-1 p-1 bg-gray-100 dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/10">
                            <button 
                              onClick={() => handleAction(event.id, 'approve')}
                              disabled={processingId === event.id}
                              className="p-1.5 text-green-500 hover:bg-green-500/10 rounded-md transition-all disabled:opacity-30"
                              title="Duyệt"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleAction(event.id, 'reject')}
                              disabled={processingId === event.id}
                              className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-md transition-all disabled:opacity-30"
                              title="Từ chối"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                        <button 
                          onClick={() => handleToggleFeatured(event.id)}
                          disabled={processingId === event.id}
                          className={`p-2 rounded-lg border transition-all ${
                            event.is_featured 
                              ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500 shadow-sm' 
                              : 'bg-gray-50 dark:bg-white/5 border-transparent text-gray-500 hover:text-yellow-500 hover:bg-yellow-500/10'
                          }`}
                          title={event.is_featured ? "Bỏ nổi bật" : "Đánh dấu nổi bật"}
                        >
                          <Star className={`w-4 h-4 ${event.is_featured ? 'fill-current' : ''}`} />
                        </button>
                        <button 
                          onClick={() => handleToggleHide(event.id, event.status)}
                          disabled={processingId === event.id}
                          className="p-2 bg-gray-50 dark:bg-white/5 text-gray-500 hover:text-blue-500 hover:bg-blue-500/10 rounded-lg border border-transparent dark:border-white/5 transition-all shadow-sm"
                          title={event.status === 'hidden' ? "Hiện sự kiện" : "Ẩn sự kiện"}
                        >
                          {event.status === 'hidden' ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                        {event.status !== 'cancelled' && (
                          <button 
                            onClick={() => { setCancelEventId(event.id); setShowCancelModal(true); }}
                            disabled={processingId === event.id}
                            className="p-2 bg-gray-50 dark:bg-white/5 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg border border-transparent dark:border-white/5 transition-all shadow-sm"
                            title="Hủy khẩn cấp"
                          >
                            <AlertTriangle className="w-4 h-4" />
                          </button>
                        )}
                        <button 
                          onClick={() => navigate(`/admin/events/${event.id}`)}
                          className="p-2 bg-gray-50 dark:bg-white/5 text-gray-500 hover:text-neon-green hover:bg-neon-green/10 rounded-lg border border-transparent dark:border-white/5 transition-all shadow-sm"
                          title="Chi tiết"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 md:gap-4 animate-in fade-in zoom-in-95 duration-300">
           {events.map((event) => (
             <div key={event.id} className="bg-white dark:bg-[#111114] border border-gray-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-neon-green/20 transition-all group flex flex-col h-full">
                <div className="aspect-[16/9] relative overflow-hidden flex-shrink-0">
                   {event.image_url ? (
                      <img src={event.image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                   ) : (
                      <div className="w-full h-full bg-gray-100 dark:bg-white/5 flex items-center justify-center">
                         <Calendar className="w-8 h-8 text-gray-400" />
                      </div>
                   )}
                   <div className="absolute top-3 left-3">
                      <div className="bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10 flex items-center space-x-1.5">
                         <Tag className="w-3 h-3 text-neon-green" />
                         <span className="text-[10px] font-black text-white uppercase tracking-tight">{event.category?.name}</span>
                      </div>
                   </div>
                   <div className="absolute top-3 right-3 flex flex-col items-end space-y-2">
                      {getStatusBadge(event.status)}
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleToggleFeatured(event.id); }}
                        disabled={processingId === event.id}
                        className={`p-1.5 rounded-lg border backdrop-blur-md transition-all ${
                          event.is_featured 
                            ? 'bg-yellow-500/80 border-yellow-400 text-white shadow-lg' 
                            : 'bg-black/40 border-white/10 text-white/60 hover:text-yellow-400 hover:bg-black/60'
                        }`}
                      >
                        <Star className={`w-3.5 h-3.5 ${event.is_featured ? 'fill-current' : ''}`} />
                      </button>
                   </div>
                </div>

                <div className="p-4 flex flex-col flex-1 space-y-3">
                   <div className="flex-1">
                      <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase leading-tight line-clamp-2 mb-1 group-hover:text-neon-green transition-colors">
                        {event.title}
                      </h3>
                      <p className="text-[11px] text-gray-600 font-bold flex items-center justify-between">
                        <span className="flex items-center truncate">
                          <Building2 className="w-3 h-3 mr-1.5 opacity-40 shrink-0" />
                          {event.organizer?.organization_name}
                        </span>
                        <span className="text-gray-900 dark:text-white shrink-0 ml-2 italic">
                          {event.sold_tickets} / {event.total_tickets} vé
                        </span>
                      </p>
                   </div>

                   <div className="space-y-1.5 pt-3 border-t border-gray-100 dark:border-white/5">
                      <div className="flex flex-col space-y-1">
                         <div className="flex items-center space-x-1.5 text-xs font-bold text-gray-800 dark:text-gray-300">
                            <Calendar className="w-3.5 h-3.5 text-neon-green opacity-50" />
                            <span>
                               {format(new Date(event.event_date), 'dd/MM/yyyy')}
                               {event.end_date && format(new Date(event.event_date), 'yyyy-MM-dd') !== format(new Date(event.end_date), 'yyyy-MM-dd') && (
                                  <span className="opacity-40 font-medium mx-1">→ {format(new Date(event.end_date), 'dd/MM/yyyy')}</span>
                               )}
                            </span>
                         </div>
                         <div className="text-[10px] text-gray-500 font-bold uppercase italic flex items-center space-x-1.5 ml-5">
                            <Clock className="w-3 h-3 opacity-40 shrink-0" />
                            <span>Giờ: {event.event_time || '00:00'} - {event.end_time || '--:--'}</span>
                         </div>
                      </div>
                   </div>

                   <div className="flex items-center gap-2 pt-2">
                      <button 
                        onClick={() => navigate(`/admin/events/${event.id}`)}
                        className="flex-1 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 py-2 rounded-xl text-[10px] font-black uppercase text-gray-600 hover:text-neon-green hover:bg-neon-green/10 hover:border-neon-green/20 transition-all text-center"
                      >
                         Xem Chi tiết
                      </button>
                      <button 
                        onClick={() => handleToggleHide(event.id, event.status)}
                        disabled={processingId === event.id}
                        className="p-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-500 hover:text-blue-500 hover:bg-blue-500/10 transition-all"
                        title={event.status === 'hidden' ? "Hiện" : "Ẩn"}
                      >
                        {event.status === 'hidden' ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      {event.status !== 'cancelled' && (
                        <button 
                          onClick={() => { setCancelEventId(event.id); setShowCancelModal(true); }}
                          disabled={processingId === event.id}
                          className="p-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-500 hover:text-red-500 hover:bg-red-500/10 transition-all"
                          title="Hủy khẩn cấp"
                        >
                          <AlertTriangle className="w-4 h-4" />
                        </button>
                      )}
                      {event.status === 'pending' && (
                         <div className="flex gap-1">
                            <button 
                               onClick={() => handleAction(event.id, 'approve')}
                               disabled={processingId === event.id}
                               className="p-2 bg-green-500/10 text-green-500 border border-green-500/20 rounded-xl hover:bg-green-500 transition-all hover:text-white shadow-sm disabled:opacity-30"
                               title="Duyệt"
                            >
                               <CheckCircle2 className="w-4 h-4" />
                            </button>
                            <button 
                               onClick={() => handleAction(event.id, 'reject')}
                               disabled={processingId === event.id}
                               className="p-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl hover:bg-red-500 transition-all hover:text-white shadow-sm disabled:opacity-30"
                               title="Từ chối"
                            >
                               <XCircle className="w-4 h-4" />
                            </button>
                         </div>
                      )}
                   </div>
                </div>
             </div>
           ))}
        </div>
      )}

      {/* Emergency Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCancelModal(false)} />
          <div className="bg-white dark:bg-[#111114] border border-gray-200 dark:border-white/10 rounded-[2.5rem] p-8 w-full max-w-md relative animate-in zoom-in-95 duration-300 shadow-2xl">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">Hủy sự kiện khẩn cấp</h3>
                <p className="text-xs text-gray-500 font-medium">Thao tác này sẽ dừng mọi hoạt động bán vé.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase mb-2 ml-1">Lý do hủy (Sẽ gửi cho người mua)</label>
                <textarea 
                  className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:border-red-500/50 transition-all min-h-[120px]"
                  placeholder="Vui lòng nhập lý do hủy sự kiện này..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                />
              </div>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 py-3 border border-gray-200 dark:border-white/10 rounded-2xl text-[10px] font-black uppercase text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 transition-all"
                >
                  Đóng
                </button>
                <button 
                  onClick={handleForceCancel}
                  disabled={processingId === cancelEventId}
                  className="flex-1 py-3 bg-red-500 text-white rounded-2xl text-[10px] font-black uppercase hover:bg-red-600 transition-all shadow-lg shadow-red-500/20 active:scale-95 disabled:opacity-50"
                >
                  Xác nhận Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Emergency Requests Modal */}
      {showRequestsModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowRequestsModal(false)} />
          <div className="bg-white dark:bg-[#111114] border border-gray-200 dark:border-white/10 rounded-[2.5rem] p-8 w-full max-w-4xl max-h-[80vh] overflow-hidden relative animate-in zoom-in-95 duration-300 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-neon-green/10 rounded-2xl flex items-center justify-center">
                  <ClipboardList className="w-6 h-6 text-neon-green" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">Yêu cầu thay đổi sự kiện</h3>
                  <p className="text-xs text-gray-500 font-medium">Danh sách các yêu cầu dời lịch hoặc hủy từ Ban tổ chức.</p>
                </div>
              </div>
              <button 
                onClick={() => setShowRequestsModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors"
              >
                <XCircle className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {events.filter(ev => ['pending_cancel', 'pending_cancellation_fee', 'pending_reschedule'].includes(ev.status)).length > 0 ? (
                <div className="space-y-4">
                  {events.filter(ev => ['pending_cancel', 'pending_cancellation_fee', 'pending_reschedule'].includes(ev.status)).map(ev => (
                    <div key={ev.id} className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-6 flex items-center justify-between group hover:border-neon-green/30 transition-all">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 shrink-0">
                          <img src={ev.image_url} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-black text-gray-900 dark:text-white uppercase tracking-tight group-hover:text-neon-green transition-colors">{ev.title}</h4>
                            {getStatusBadge(ev.status)}
                          </div>
                          <p className="text-xs text-gray-500 font-bold flex items-center">
                            <Building2 className="w-3 h-3 mr-1 opacity-50" />
                            {ev.organizer?.organization_name}
                          </p>
                          <p className="text-[10px] text-red-500 mt-2 font-black uppercase tracking-tighter flex items-center">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Yêu cầu: {['pending_cancel', 'pending_cancellation_fee'].includes(ev.status) ? 'Hủy bỏ sự kiện' : 'Dời lịch thi đấu'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => {
                            setShowRequestsModal(false);
                            navigate(`/admin/events/${ev.id}`);
                          }}
                          className="px-6 py-2 bg-neon-green text-black rounded-xl text-[10px] font-black uppercase hover:bg-neon-hover transition-all shadow-lg shadow-neon-green/20"
                        >
                          Xử lý ngay
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-10 flex flex-col items-center justify-center text-center">
                  <History className="w-12 h-12 text-gray-300 dark:text-gray-700 mb-4" />
                  <p className="text-gray-500 italic text-sm">Hiện không có yêu cầu thay đổi khẩn cấp nào cần xử lý.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventManagement;

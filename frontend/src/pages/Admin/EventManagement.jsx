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
  Star
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
      // Cập nhật state local để UI mượt mà hơn mà không cần fetch lại toàn bộ
      setEvents(prev => prev.map(ev => ev.id === id ? { ...ev, is_featured: response.is_featured } : ev));
    } catch (error) {
      toast.error('Không thể thay đổi trạng thái nổi bật');
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <span className="px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-[10px] font-black uppercase border border-green-500/20">Đang hoạt động</span>;
      case 'pending':
        return <span className="px-3 py-1 bg-yellow-500/10 text-yellow-500 rounded-full text-[10px] font-black uppercase border border-yellow-500/20">Chờ duyệt</span>;
      case 'cancelled':
        return <span className="px-3 py-1 bg-red-500/10 text-red-500 rounded-full text-[10px] font-black uppercase border border-red-500/20">Đã hủy</span>;
      default:
        return <span className="px-3 py-1 bg-gray-500/10 text-gray-500 rounded-full text-[10px] font-black uppercase border border-white/5">{status === 'draft' ? 'Bản nháp' : status}</span>;
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500 max-w-[1600px] mx-auto">
      {/* Header & Stats section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center space-x-3 uppercase tracking-tight">
            <div className="p-2 bg-neon-green/10 rounded-xl">
              <CalendarDays className="w-6 h-6 text-neon-green" />
            </div>
            <span>Quản lý Sự kiện</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm font-medium">
            Theo dõi và điều phối hệ thống sự kiện.
          </p>
        </div>

        {/* Stats Cards - Compact but matching UserManagement style */}
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setFilters({ ...filters, status: '' })}
            className={`p-3 rounded-2xl border flex items-center space-x-4 transition-all ${
              !filters.status 
                ? 'bg-neon-green/10 border-neon-green/30 text-neon-green shadow-sm' 
                : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/10'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              !filters.status ? 'bg-neon-green/20' : 'bg-gray-100 dark:bg-white/5'
            }`}>
              <Calendar className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="text-[10px] uppercase font-bold opacity-60">Tất cả</div>
              <div className="text-xl font-black">{stats.total}</div>
            </div>
          </button>

          <button 
            onClick={() => setFilters({ ...filters, status: 'pending' })}
            className={`p-3 rounded-2xl border flex items-center space-x-4 transition-all ${
              filters.status === 'pending' 
                ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500 shadow-sm' 
                : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/10'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              filters.status === 'pending' ? 'bg-yellow-500/20' : 'bg-gray-100 dark:bg-white/5'
            }`}>
              <Clock className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="text-[10px] uppercase font-bold opacity-60">Chờ duyệt</div>
              <div className="text-xl font-black">{stats.pending}</div>
            </div>
          </button>
        </div>
      </div>

      {/* Filter Bar - Standardized but compact */}
      <div className="bg-white dark:bg-[#111114] p-3 rounded-2xl border border-gray-200 dark:border-white/5 flex flex-wrap items-center gap-4 shadow-sm">
        <form onSubmit={handleSearch} className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text"
            placeholder="Tìm theo tên sự kiện..."
            className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl py-2 pl-11 pr-4 text-sm focus:outline-none focus:border-neon-green/50 transition-all dark:text-white text-gray-900"
            value={filters.keyword}
            onChange={(e) => setFilters({...filters, keyword: e.target.value})}
          />
        </form>

        <select 
          className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-neon-green/50 font-bold"
          value={filters.status}
          onChange={(e) => setFilters({...filters, status: e.target.value})}
        >
          <option value="">Tất cả Trạng thái</option>
          <option value="pending">Chờ duyệt</option>
          <option value="active">Đang hoạt động</option>
          <option value="cancelled">Đã hủy</option>
          <option value="draft">Bản nháp</option>
        </select>

        <div className="flex items-center space-x-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-1 focus-within:border-neon-green/50 transition-all">
          <div className="flex flex-col">
            <label className="text-[9px] text-gray-400 dark:text-gray-500 font-bold uppercase ml-1">Từ ngày</label>
            <input 
              type="date" 
              className="bg-transparent text-gray-700 dark:text-gray-300 text-[11px] focus:outline-none transition-colors border-none p-0 h-4"
              value={filters.from}
              onChange={(e) => setFilters({...filters, from: e.target.value})}
            />
          </div>
          <div className="h-4 w-px bg-gray-200 dark:bg-white/10 mx-1" />
          <div className="flex flex-col">
            <label className="text-[9px] text-gray-400 dark:text-gray-500 font-bold uppercase ml-1">Đến ngày</label>
            <input 
              type="date" 
              className="bg-transparent text-gray-700 dark:text-gray-300 text-[11px] focus:outline-none transition-colors border-none p-0 h-4"
              value={filters.to}
              onChange={(e) => setFilters({...filters, to: e.target.value})}
            />
          </div>
        </div>

        <div className="flex items-center bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-1">
          <button 
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-white/10 text-neon-green shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            title="Dạng danh sách"
          >
            <List className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-white/10 text-neon-green shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
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

      {/* Content Rendering */}
      {loading ? (
        <div className="bg-white dark:bg-[#111114] rounded-2xl border border-gray-200 dark:border-white/5 p-20 flex flex-col items-center justify-center shadow-sm">
          <Loader2 className="w-8 h-8 text-neon-green animate-spin mb-4" />
          <p className="text-gray-500 uppercase text-[10px] font-black tracking-widest">Đang tải dữ liệu...</p>
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
                <tr className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/5 text-xs uppercase font-black text-gray-500 dark:text-gray-400">
                  <th className="px-6 py-4">Sự kiện</th>
                  <th className="px-6 py-4">Ban tổ chức</th>
                  <th className="px-6 py-4">Vé đã bán</th>
                  <th className="px-6 py-4">Thời gian</th>
                  <th className="px-6 py-4 text-center">Trạng thái</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
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
                               <Calendar className="w-5 h-5 m-auto text-gray-300" />
                            )}
                         </div>
                         <div className="flex flex-col min-w-0">
                            <span className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-neon-green transition-colors truncate max-w-[200px] tracking-tight">
                              {event.title}
                            </span>
                            <div className="flex items-center space-x-1.5 text-[10px] text-gray-400 font-bold uppercase mt-0.5">
                              <Tag className="w-3 h-3 text-neon-green opacity-50" />
                              <span className="opacity-70">{event.category?.name}</span>
                            </div>
                         </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                         <Building2 className="w-3.5 h-3.5 text-blue-500 opacity-60" />
                         <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 truncate max-w-[150px]">
                           {event.organizer?.organization_name}
                         </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-gray-900 dark:text-white">
                          {event.sold_tickets || 0} <span className="text-gray-400 font-bold">/ {event.total_tickets || 0}</span>
                        </span>
                        <span className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">Vé hệ thống</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <div className="flex items-center space-x-2 text-xs font-bold text-gray-700 dark:text-gray-300">
                          <Calendar className="w-3.5 h-3.5 text-neon-green opacity-50" />
                          <span>
                            {format(new Date(event.event_date), 'dd/MM/yyyy')}
                            {event.end_date && format(new Date(event.event_date), 'yyyy-MM-dd') !== format(new Date(event.end_date), 'yyyy-MM-dd') && (
                               <span className="opacity-40 font-medium mx-1">→ {format(new Date(event.end_date), 'dd/MM/yyyy')}</span>
                            )}
                          </span>
                        </div>
                        <div className="text-[10px] text-gray-400 font-bold ml-5 mt-0.5 flex items-center space-x-1 uppercase italic">
                           <Clock className="w-3 h-3 opacity-40 shrink-0" />
                           <span>Giờ: {event.event_time || '00:00'} - {event.end_time || '--:--'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {getStatusBadge(event.status)}
                    </td>
                    <td className="px-6 py-4 text-right">
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
                              : 'bg-gray-50 dark:bg-white/5 border-transparent text-gray-400 hover:text-yellow-500 hover:bg-yellow-500/10'
                          }`}
                          title={event.is_featured ? "Bỏ nổi bật" : "Đánh dấu nổi bật"}
                        >
                          <Star className={`w-4 h-4 ${event.is_featured ? 'fill-current' : ''}`} />
                        </button>
                        <button 
                          onClick={() => navigate(`/admin/events/${event.id}`)}
                          className="p-2 bg-gray-50 dark:bg-white/5 text-gray-400 hover:text-neon-green hover:bg-neon-green/10 rounded-lg border border-transparent dark:border-white/5 transition-all shadow-sm"
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-in fade-in zoom-in-95 duration-300">
           {events.map((event) => (
             <div key={event.id} className="bg-white dark:bg-[#111114] border border-gray-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-neon-green/20 transition-all group flex flex-col h-full">
                <div className="aspect-[16/9] relative overflow-hidden flex-shrink-0">
                   {event.image_url ? (
                      <img src={event.image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                   ) : (
                      <div className="w-full h-full bg-gray-100 dark:bg-white/5 flex items-center justify-center">
                         <Calendar className="w-8 h-8 text-gray-200" />
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
                      <p className="text-[11px] text-gray-500 font-bold flex items-center justify-between">
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
                         <div className="flex items-center space-x-1.5 text-xs font-bold text-gray-700 dark:text-gray-300">
                            <Calendar className="w-3.5 h-3.5 text-neon-green opacity-50" />
                            <span>
                               {format(new Date(event.event_date), 'dd/MM/yyyy')}
                               {event.end_date && format(new Date(event.event_date), 'yyyy-MM-dd') !== format(new Date(event.end_date), 'yyyy-MM-dd') && (
                                  <span className="opacity-40 font-medium mx-1">→ {format(new Date(event.end_date), 'dd/MM/yyyy')}</span>
                               )}
                            </span>
                         </div>
                         <div className="text-[10px] text-gray-400 font-bold uppercase italic flex items-center space-x-1.5 ml-5">
                            <Clock className="w-3 h-3 opacity-40 shrink-0" />
                            <span>Giờ: {event.event_time || '00:00'} - {event.end_time || '--:--'}</span>
                         </div>
                      </div>
                   </div>

                   <div className="flex items-center gap-2 pt-2">
                      <button 
                        onClick={() => navigate(`/admin/events/${event.id}`)}
                        className="flex-1 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 py-2 rounded-xl text-[10px] font-black uppercase text-gray-500 hover:text-neon-green hover:bg-neon-green/10 hover:border-neon-green/20 transition-all text-center"
                      >
                         Xem Chi tiết
                      </button>
                      {event.status === 'pending' && (
                         <div className="flex gap-1">
                            <button 
                               onClick={() => handleAction(event.id, 'approve')}
                               className="p-2 bg-green-500/10 text-green-500 border border-green-500/20 rounded-xl hover:bg-green-500 transition-all hover:text-white shadow-sm"
                               title="Duyệt"
                            >
                               <CheckCircle2 className="w-4 h-4" />
                            </button>
                            <button 
                               onClick={() => handleAction(event.id, 'reject')}
                               className="p-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl hover:bg-red-500 transition-all hover:text-white shadow-sm"
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
    </div>
  );
};

export default EventManagement;

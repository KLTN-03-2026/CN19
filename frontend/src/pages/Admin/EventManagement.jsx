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
  CalendarDays
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

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <span className="px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-[10px] font-black uppercase border border-green-500/20">Đang hoạt động</span>;
      case 'pending':
        return <span className="px-3 py-1 bg-yellow-500/10 text-yellow-500 rounded-full text-[10px] font-black uppercase border border-yellow-500/20">Chờ duyệt</span>;
      case 'cancelled':
        return <span className="px-3 py-1 bg-red-500/10 text-red-500 rounded-full text-[10px] font-black uppercase border border-red-500/20">Đã hủy</span>;
      default:
        return <span className="px-3 py-1 bg-gray-500/10 text-gray-500 rounded-full text-[10px] font-black uppercase border border-white/5">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header & Stats section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center space-x-3 uppercase tracking-tighter">
            <div className="p-2 bg-neon-green/10 rounded-xl">
              <CalendarDays className="w-8 h-8 text-neon-green" />
            </div>
            <span>Quản lý Sự kiện</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm font-medium">
            Theo dõi, phê duyệt và điều phối toàn bộ sự kiện trên hệ thống.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setFilters({ ...filters, status: '' })}
            className={`p-4 rounded-2xl border flex items-center space-x-4 transition-all shadow-sm ${
              !filters.status 
                ? 'bg-neon-green/10 border-neon-green/30 text-neon-green' 
                : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/10'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              !filters.status ? 'bg-neon-green/20' : 'bg-gray-100 dark:bg-white/5'
            }`}>
              <Calendar className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="text-[10px] uppercase font-black tracking-widest opacity-60">Tất cả</div>
              <div className="text-xl font-black tracking-tighter">{stats.total}</div>
            </div>
          </button>

          <button 
            onClick={() => setFilters({ ...filters, status: 'pending' })}
            className={`p-4 rounded-2xl border flex items-center space-x-4 transition-all shadow-sm ${
              filters.status === 'pending' 
                ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500' 
                : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/10'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              filters.status === 'pending' ? 'bg-yellow-500/20' : 'bg-gray-100 dark:bg-white/5'
            }`}>
              <Clock className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="text-[10px] uppercase font-black tracking-widest opacity-60">Chờ duyệt</div>
              <div className="text-xl font-black tracking-tighter">{stats.pending}</div>
            </div>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-[#111114] p-4 rounded-[24px] border border-gray-200 dark:border-white/5 flex flex-wrap items-center gap-4 shadow-sm transition-all">
        <form onSubmit={handleSearch} className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text"
            placeholder="Tìm theo tên sự kiện (Nhấn Enter)..."
            className="w-full bg-gray-50 dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:border-neon-green transition-all dark:text-white text-gray-900 shadow-inner"
            value={filters.keyword}
            onChange={(e) => setFilters({...filters, keyword: e.target.value})}
          />
        </form>

        <select 
          className="bg-gray-50 dark:bg-white/10 border border-gray-200 dark:border-white/20 text-gray-700 dark:text-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-neon-green font-bold"
          value={filters.status}
          onChange={(e) => setFilters({...filters, status: e.target.value})}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="pending">Chờ duyệt</option>
          <option value="active">Đang hoạt động</option>
          <option value="cancelled">Đã hủy</option>
          <option value="draft">Bản nháp/Từ chối</option>
        </select>

        <div className="flex items-center space-x-2 bg-gray-50 dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-xl px-3 py-1.5 focus-within:border-neon-green transition-all shadow-inner">
          <div className="flex flex-col">
            <label className="text-[9px] text-gray-400 dark:text-gray-500 font-black uppercase ml-1">Bắt đầu từ</label>
            <input 
              type="date" 
              className="bg-transparent text-gray-700 dark:text-gray-300 text-xs focus:outline-none transition-colors border-none p-0 h-5"
              value={filters.from}
              onChange={(e) => setFilters({...filters, from: e.target.value})}
            />
          </div>
          <div className="h-4 w-px bg-gray-200 dark:bg-white/10 mx-2" />
          <div className="flex flex-col">
            <label className="text-[9px] text-gray-400 dark:text-gray-500 font-black uppercase ml-1">Đến hết ngày</label>
            <input 
              type="date" 
              className="bg-transparent text-gray-700 dark:text-gray-300 text-xs focus:outline-none transition-colors border-none p-0 h-5"
              value={filters.to}
              onChange={(e) => setFilters({...filters, to: e.target.value})}
            />
          </div>
        </div>
        
        <button 
          onClick={fetchEvents}
          className="p-3 bg-neon-green text-black rounded-xl hover:bg-neon-hover transition-all font-black text-xs uppercase shadow-lg shadow-neon-green/20 px-6"
        >
          Lọc
        </button>
      </div>

      {/* Content Table */}
      <div className="bg-white dark:bg-[#111114] rounded-[32px] border border-gray-200 dark:border-white/5 overflow-hidden shadow-sm dark:shadow-2xl transition-all">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/5">
                <th className="px-6 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest">Thông tin Sự kiện</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest">Ban tổ chức</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest">Thời gian Bắt đầu</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest">Thời gian Kết thúc</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest text-center">Trạng thái</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan="6" className="px-6 py-8">
                       <div className="h-4 bg-gray-100 dark:bg-white/5 rounded-full w-full opacity-50"></div>
                    </td>
                  </tr>
                ))
              ) : events.length > 0 ? events.map((event) => (
                <tr key={event.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="font-black text-gray-900 dark:text-white group-hover:text-neon-green transition-colors leading-tight mb-1 text-base tracking-tighter">
                        {event.title}
                      </span>
                      <div className="flex items-center space-x-2 text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                        <Tag className="w-3 h-3 text-neon-green" />
                        <span>{event.category?.name}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                        <Building2 className="w-4 h-4 text-blue-500" />
                      </div>
                      <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                        {event.organizer?.organization_name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <div className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300 font-bold">
                        <Calendar className="w-4 h-4 text-neon-green opacity-40" />
                        <span>{format(new Date(event.event_date), 'dd/MM/yyyy')}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-[10px] text-gray-500 mt-1 font-mono">
                        <Clock className="w-3 h-3 opacity-40" />
                        <span>{event.event_time || '--:--'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <div className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300 font-bold">
                        <Calendar className="w-4 h-4 text-gray-500 opacity-40" />
                        <span>{event.end_date ? format(new Date(event.end_date), 'dd/MM/yyyy') : '--/--/----'}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-[10px] text-gray-500 mt-1 font-mono">
                        <Clock className="w-3 h-3 opacity-40" />
                        <span>{event.end_time || '--:--'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    {getStatusBadge(event.status)}
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center justify-end space-x-2">
                      {(event.status === 'draft' || event.status === 'pending') && (
                        <div className="flex space-x-1 p-1 bg-gray-100 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10">
                          <button 
                            onClick={() => handleAction(event.id, 'approve')}
                            disabled={processingId === event.id}
                            className="p-2 text-green-500 hover:bg-green-500/20 rounded-lg transition-all"
                            title="Duyệt"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleAction(event.id, 'reject')}
                            disabled={processingId === event.id}
                            className="p-2 text-red-500 hover:bg-red-500/20 rounded-lg transition-all"
                            title="Từ chối"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                      <button 
                        onClick={() => navigate(`/admin/events/${event.id}`)}
                        className="p-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-400 hover:text-neon-green hover:border-neon-green/30 transition-all"
                        title="Xem chi tiết Admin"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="6" className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-20 h-20 rounded-3xl bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-4">
                        <CalendarDays className="w-10 h-10 text-gray-300 dark:text-gray-700" />
                      </div>
                      <p className="text-gray-500 font-bold uppercase tracking-widest text-sm">Không tìm thấy sự kiện nào phù hợp</p>
                      <button 
                        onClick={() => setFilters({ keyword: '', status: '', from: '', to: '' })}
                        className="mt-4 text-neon-green text-xs font-black uppercase hover:underline"
                      >
                        Xóa tất cả bộ lọc
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EventManagement;

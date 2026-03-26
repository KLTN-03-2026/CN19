import React, { useState, useEffect } from 'react';
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
  Eye
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { adminService } from '../../services/admin.service';

const EventManagement = () => {
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchEvents();
  }, [statusFilter]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await adminService.getEvents({ 
        status: statusFilter || undefined,
        keyword: searchTerm || undefined 
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
    if (e.key === 'Enter') {
      fetchEvents();
    }
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
        return <span className="px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-[10px] font-black uppercase">Đang hoạt động</span>;
      case 'draft':
      case 'pending': // Thêm case pending
        return <span className="px-3 py-1 bg-yellow-500/10 text-yellow-500 rounded-full text-[10px] font-black uppercase">Chờ duyệt</span>;
      case 'cancelled':
        return <span className="px-3 py-1 bg-red-500/10 text-red-500 rounded-full text-[10px] font-black uppercase">Đã hủy</span>;
      default:
        return <span className="px-3 py-1 bg-gray-500/10 text-gray-500 rounded-full text-[10px] font-black uppercase">{status}</span>;
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center space-x-3">
          <div className="p-2 bg-neon-green/10 rounded-lg">
            <Calendar className="w-6 h-6 text-neon-green" />
          </div>
          <span>Quản lý Sự kiện</span>
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Theo dõi, phê duyệt và điều phối tất cả sự kiện hệ thống.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="flex items-center space-x-4 mb-8">
        <button 
          onClick={() => setStatusFilter('')}
          className={`p-4 rounded-2xl border flex items-center space-x-4 transition-all flex-1 md:flex-none md:min-w-[200px] ${
            !statusFilter 
              ? 'bg-neon-green/10 border-neon-green/30 text-neon-green' 
              : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/10'
          }`}
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            !statusFilter ? 'bg-neon-green/20' : 'bg-gray-100 dark:bg-white/5'
          }`}>
            <Calendar className="w-5 h-5" />
          </div>
          <div className="text-left">
            <div className="text-xs uppercase font-bold tracking-wider opacity-60">Tất cả</div>
            <div className="text-xl font-black">{stats.total}</div>
          </div>
        </button>

        <button 
          onClick={() => setStatusFilter('pending')}
          className={`p-4 rounded-2xl border flex items-center space-x-4 transition-all flex-1 md:flex-none md:min-w-[200px] ${
            statusFilter === 'pending' 
              ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500' 
              : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/10'
          }`}
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            statusFilter === 'pending' ? 'bg-yellow-500/20' : 'bg-gray-100 dark:bg-white/5'
          }`}>
            <Clock className="w-5 h-5" />
          </div>
          <div className="text-left">
            <div className="text-xs uppercase font-bold tracking-wider opacity-60">Chờ duyệt</div>
            <div className="text-xl font-black">{stats.pending}</div>
          </div>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-[#111114] p-4 rounded-2xl border border-gray-100 dark:border-white/5 mb-6 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input 
            type="text"
            placeholder="Tìm theo tên sự kiện (Nhấn Enter)..."
            className="w-full bg-gray-50 dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:border-neon-green transition-all dark:text-white text-gray-900"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleSearch}
          />
        </div>
        
        <div className="flex gap-4">
          <select 
            className="bg-gray-50 dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-neon-green transition-all dark:text-white text-gray-900 min-w-[160px]"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="pending">Chờ duyệt (Mới)</option>
            <option value="draft">Bản nháp/Từ chối</option>
            <option value="active">Đang hoạt động</option>
            <option value="cancelled">Đã hủy</option>
          </select>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-neon-green animate-spin mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Đang tải danh sách sự kiện...</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#111114] rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-white/5 border-b border-gray-100 dark:border-white/5">
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-wider">Thông tin Sự kiện</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-wider">Ban tổ chức</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-wider">Thời gian</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-wider text-center">Trạng thái</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-wider text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {events.length > 0 ? events.map((event) => (
                  <tr key={event.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900 dark:text-white group-hover:text-neon-green transition-colors leading-tight mb-1">
                          {event.title}
                        </span>
                        <div className="flex items-center space-x-2 text-[10px] text-gray-500">
                          <Tag className="w-3 h-3" />
                          <span>{event.category?.name}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-7 h-7 rounded-full bg-blue-500/10 flex items-center justify-center">
                          <User className="w-3.5 h-3.5 text-blue-500" />
                        </div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {event.organizer?.organization_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <div className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-neon-green" />
                          <span>{format(new Date(event.event_date), 'dd/MM/yyyy')}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-[10px] text-gray-500 mt-1">
                          <Clock className="w-3 h-3" />
                          <span>{event.event_time || '--:--'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {getStatusBadge(event.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end space-x-2">
                        {(event.status === 'draft' || event.status === 'pending') && (
                          <>
                            <button 
                              onClick={() => handleAction(event.id, 'approve')}
                              disabled={processingId === event.id}
                              className="p-2 text-green-500 hover:bg-green-500/10 rounded-lg transition-all"
                              title="Duyệt sự kiện"
                            >
                              <CheckCircle2 className="w-5 h-5" />
                            </button>
                            <button 
                              onClick={() => handleAction(event.id, 'reject')}
                              disabled={processingId === event.id}
                              className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                              title="Từ chối"
                            >
                              <XCircle className="w-5 h-5" />
                            </button>
                          </>
                        )}
                        <button className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                          <Eye className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center">
                        <AlertTriangle className="w-12 h-12 text-gray-300 dark:text-gray-700 mb-4" />
                        <p className="text-gray-500">Không tìm thấy sự kiện nào</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventManagement;

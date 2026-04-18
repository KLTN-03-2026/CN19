import React, { useState, useEffect } from 'react';
import { useParams, Link , useNavigate } from 'react-router-dom';
import { 
  Tags, 
  ChevronLeft, 
  Calendar, 
  Users, 
  Edit2, 
  Trash2, 
  Loader2, 
  AlertCircle,
  Clock,
  ExternalLink,
  ArrowUpDown,
  Filter,
  ChevronRight,
  Search,
  LayoutGrid,
  List
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { adminService } from '../../services/admin.service';

const CategoryDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [organizerFilter, setOrganizerFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'list' or 'grid'

  useEffect(() => {
    fetchCategoryDetail();
  }, [id]);

  const fetchCategoryDetail = async () => {
    try {
      setLoading(true);
      const response = await adminService.getCategoryById(id);
      if (response.success) {
        setCategory(response.data);
      }
    } catch (error) {
      toast.error('Không thể tải thông tin danh mục');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = category?.events?.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' ? true : event.status === statusFilter;
    const matchesOrganizer = organizerFilter === 'all' ? true : event.organizer?.organization_name === organizerFilter;
    
    return matchesSearch && matchesStatus && matchesOrganizer;
  }) || [];

  // Lấy danh sách BTC duy nhất từ các sự kiện trong danh mục này
  const uniqueOrganizers = [...new Set(category?.events?.map(e => e.organizer?.organization_name).filter(Boolean))];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-10 h-10 text-neon-green animate-spin mb-4" />
        <p className="text-gray-500 animate-pulse">Đang tải dữ liệu danh mục...</p>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="p-8 text-center bg-red-500/10 rounded-2xl border border-red-500/20">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Không tìm thấy danh mục</h2>
        <Link to="/admin/categories" className="text-neon-green hover:underline">Quay lại danh sách</Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Header & Back Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => navigate('/admin/categories')}
            className="p-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl hover:bg-gray-50 dark:hover:bg-white/10 transition-all group shrink-0 shadow-sm"
          >
            <ChevronLeft className="w-5 h-5 text-gray-500 group-hover:text-neon-green" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center space-x-2 text-[10px] font-black uppercase text-gray-500 mb-0.5 tracking-tighter">
              <Tags className="w-3 h-3 text-neon-green" />
              <span>Cấu trúc Danh mục</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white uppercase truncate">
              {category.name}
            </h1>
          </div>
        </div>

        <div className="flex items-center">
          <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider ${
            category.is_active 
              ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
              : 'bg-red-500/10 text-red-500 border border-red-500/20'
          }`}>
            {category.is_active ? 'Đang hoạt động' : 'Tạm dừng'}
          </span>
        </div>
      </div>

      {/* Hero Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#111114] border border-gray-200 dark:border-white/5 p-4 rounded-2xl md:rounded-3xl shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-neon-green/10 rounded-xl text-neon-green shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-500 uppercase">Tổng sự kiện</p>
              <p className="text-lg font-black text-gray-900 dark:text-white leading-none mt-1">{category._count?.events || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#111114] border border-gray-200 dark:border-white/5 p-4 rounded-2xl md:rounded-3xl shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-500 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-500 uppercase">Cập nhật cuối</p>
              <p className="text-xs font-black text-gray-900 dark:text-white mt-1 leading-none">
                {category.updated_at ? format(new Date(category.updated_at), 'dd/MM/yyyy HH:mm', { locale: vi }) : 'Chưa có'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#111114] border border-gray-200 dark:border-white/5 p-4 rounded-2xl md:rounded-3xl md:col-span-1 overflow-hidden relative group shadow-sm">
          {category.image_url ? (
             <img 
               src={category.image_url} 
               alt={category.name} 
               className="absolute inset-0 w-full h-full object-cover opacity-20 group-hover:scale-110 transition-transform duration-700" 
             />
          ) : (
            <div className="absolute inset-0 bg-neon-green/5"></div>
          )}
          <div className="relative z-10">
             <p className="text-[10px] font-black text-gray-500 uppercase mb-1">Trạng thái Ảnh</p>
             <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${category.image_url ? 'bg-neon-green animate-pulse' : 'bg-gray-400'}`}></div>
                <p className="text-xs font-black text-gray-900 dark:text-white uppercase truncate">{category.image_url ? 'Đã tải lên' : 'Mặc định'}</p>
             </div>
          </div>
        </div>
      </div>

      {/* Events List in Category */}
      <div className="bg-white dark:bg-[#111114] border border-gray-200 dark:border-white/5 rounded-2xl md:rounded-3xl overflow-hidden shadow-sm">
        <div className="px-4 py-3 md:px-6 md:py-4 border-b border-gray-200 dark:border-white/5 flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-gray-50/50 dark:bg-white/[0.02]">
          <h2 className="text-base md:text-lg font-black text-gray-900 dark:text-white flex items-center space-x-2 shrink-0">
            <span className="uppercase tracking-tight">Danh sách Sự kiện</span>
            <span className="text-[10px] font-black text-neon-green bg-neon-green/10 border border-neon-green/20 px-2 py-0.5 rounded-full">
              {filteredEvents.length}
            </span>
          </h2>

          <div className="flex flex-wrap items-center gap-2 md:gap-3 w-full xl:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px] xl:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Tìm sự kiện..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs md:text-sm bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:border-neon-green transition-colors dark:text-white font-medium"
              />
            </div>

            {/* Status Filter */}
            <div className="relative w-full sm:w-auto">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full sm:w-auto pl-9 pr-8 py-2 text-[11px] font-black bg-gray-100 dark:bg-[#1a1a1e] border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:border-neon-green appearance-none cursor-pointer dark:text-white uppercase tracking-tighter"
              >
                <option value="all">Trạng thái</option>
                <option value="active">Hoạt động</option>
                <option value="pending">Chờ duyệt</option>
                <option value="cancelled">Đã hủy</option>
              </select>
            </div>

            {/* Organizer Filter */}
            <div className="relative w-full sm:w-auto">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              <select 
                value={organizerFilter}
                onChange={(e) => setOrganizerFilter(e.target.value)}
                className="w-full sm:w-auto pl-9 pr-8 py-2 text-[11px] font-black bg-gray-100 dark:bg-[#1a1a1e] border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:border-neon-green appearance-none cursor-pointer dark:text-white uppercase tracking-tighter"
              >
                <option value="all">Ban tổ chức</option>
                {uniqueOrganizers.map(org => (
                  <option key={org} value={org}>{org}</option>
                ))}
              </select>
            </div>

            {/* View Toggle */}
            <div className="flex items-center bg-gray-100 dark:bg-white/5 p-1 rounded-xl border border-gray-200 dark:border-white/10 ml-auto xl:ml-0">
              <button 
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-white/10 text-neon-green shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                title="Danh sách"
              >
                <List className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-white/10 text-neon-green shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                title="Lưới"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {viewMode === 'list' ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-white/[0.01] text-left text-[10px] text-gray-400 uppercase font-black tracking-widest border-b border-gray-200 dark:border-white/5">
                  <th className="px-6 py-3">Sự kiện</th>
                  <th className="px-6 py-3">Ban tổ chức</th>
                  <th className="px-6 py-3">Thời gian</th>
                  <th className="px-6 py-3">Trạng thái</th>
                  <th className="px-6 py-3 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {filteredEvents.length > 0 ? (
                  filteredEvents.map((event) => (
                    <tr key={event.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.015] transition-colors group">
                      <td className="px-6 py-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 group-hover:border-neon-green/30 transition-colors">
                            {event.image_url ? (
                              <img src={event.image_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <Calendar className="w-4 h-4" />
                              </div>
                            )}
                          </div>
                          <span className="text-sm font-black text-gray-900 dark:text-white uppercase truncate max-w-[200px] md:max-w-none tracking-tight">{event.title}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center space-x-2 text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-tighter">
                          <Users className="w-3.5 h-3.5 text-neon-green opacity-50" />
                          <span className="truncate max-w-[150px]">{event.organizer?.organization_name || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-500">
                        <div className="text-xs font-black text-gray-500 dark:text-gray-400 tracking-tighter">{format(new Date(event.event_date), 'dd/MM/yyyy')}</div>
                        <div className="text-[9px] font-black flex items-center space-x-1 mt-0.5 text-gray-400 uppercase tracking-widest">
                          <Clock className="w-3 h-3" />
                          <span>{event.event_time || '--:--'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase border ${
                          event.status === 'active' 
                            ? 'bg-green-500/10 text-green-500 border-green-500/10' 
                            : event.status === 'draft' || event.status === 'pending'
                              ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/10'
                              : 'bg-red-500/10 text-red-500 border-red-500/10'
                        }`}>
                          {event.status === 'active' ? 'Hoạt động' : 
                           event.status === 'draft' || event.status === 'pending' ? 'Chờ duyệt' : 'Đã hủy'}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <button 
                          onClick={() => navigate(`/admin/events/${event.id}`)}
                          className="p-2 text-gray-400 hover:text-neon-green hover:bg-neon-green/10 rounded-lg transition-all"
                          title="Xem chi tiết sự kiện"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                      <Calendar className="w-8 h-8 text-gray-300 mx-auto mb-3 opacity-30" />
                      <p className="text-xs font-black uppercase text-gray-400">Trống</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-4 md:p-5">
            {filteredEvents.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                {filteredEvents.map((event) => (
                  <div key={event.id} className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-2xl overflow-hidden hover:border-neon-green/30 transition-all group flex flex-col h-full shadow-sm">
                    <div className="relative aspect-video overflow-hidden">
                      {event.image_url ? (
                        <img src={event.image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-white/10 text-gray-400">
                          <Calendar className="w-8 h-8 opacity-10" />
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase backdrop-blur-md border ${
                          event.status === 'active' 
                            ? 'bg-green-500/80 text-white border-green-500/20' 
                            : event.status === 'draft' || event.status === 'pending'
                              ? 'bg-yellow-500/80 text-white border-yellow-500/20'
                              : 'bg-red-500/80 text-white border-red-500/20'
                        }`}>
                          {event.status === 'active' ? 'Hoạt động' : 
                           event.status === 'draft' || event.status === 'pending' ? 'Chờ duyệt' : 'Đã hủy'}
                        </span>
                      </div>
                    </div>
                    <div className="p-3 flex flex-col flex-1">
                      <h3 className="font-black text-gray-900 dark:text-white line-clamp-2 mb-2 h-9 leading-tight uppercase text-[11px] md:text-xs tracking-tight">
                        {event.title}
                      </h3>
                      <div className="space-y-1.5 mt-auto">
                        <div className="flex items-center space-x-2 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-tighter">
                          <Users className="w-3 h-3 text-neon-green opacity-50" />
                          <span className="truncate">{event.organizer?.organization_name || 'N/A'}</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>{format(new Date(event.event_date), 'dd/MM/yyyy')}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{event.event_time || '--:--'}</span>
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => navigate(`/admin/events/${event.id}`)}
                        className="w-full mt-3 py-2 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-600 dark:text-gray-300 hover:bg-neon-green hover:text-black hover:border-neon-green transition-all active:scale-95"
                      >
                        Chi tiết
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-gray-500">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4 opacity-50" />
                <p>Không có sự kiện nào thuộc danh mục này</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryDetail;

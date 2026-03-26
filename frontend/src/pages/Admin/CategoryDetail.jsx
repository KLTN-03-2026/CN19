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
  Search,
  CheckCircle2,
  XCircle
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

  const filteredEvents = category?.events?.filter(event => 
    event.title.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header & Back Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => navigate('/admin/categories')}
            className="p-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl hover:bg-gray-50 dark:hover:bg-white/10 transition-all group"
          >
            <ChevronLeft className="w-5 h-5 text-gray-500 group-hover:text-neon-green" />
          </button>
          <div>
            <div className="flex items-center space-x-2 text-sm text-gray-500 mb-1">
              <Tags className="w-4 h-4" />
              <span>Cấu trúc Danh mục</span>
            </div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
              {category.name}
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${
            category.is_active 
              ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
              : 'bg-red-500/10 text-red-500 border border-red-500/20'
          }`}>
            {category.is_active ? 'Đang hoạt động' : 'Đang tạm dừng'}
          </span>
        </div>
      </div>

      {/* Hero Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-[#111114] border border-gray-200 dark:border-white/5 p-6 rounded-2xl">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-neon-green/10 rounded-xl text-neon-green">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Tổng sự kiện</p>
              <p className="text-2xl font-black text-gray-900 dark:text-white">{category._count?.events || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#111114] border border-gray-200 dark:border-white/5 p-6 rounded-2xl">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Lần cuối cập nhật</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {category.updated_at ? format(new Date(category.updated_at), 'dd/MM/yyyy HH:mm', { locale: vi }) : 'Chưa có'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#111114] border border-gray-200 dark:border-white/5 p-6 rounded-2xl md:col-span-1 overflow-hidden relative group">
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
             <p className="text-sm text-gray-500 mb-1">Ảnh đại diện</p>
             <p className="text-xs text-gray-400 italic">Trang thái hệ thống:</p>
             <p className="text-sm font-bold text-neon-green uppercase truncate">{category.image_url ? 'Đã tải lên' : 'Mặc định lucide-icon'}</p>
          </div>
        </div>
      </div>

      {/* Events List in Category */}
      <div className="bg-white dark:bg-[#111114] border border-gray-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-gray-200 dark:border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center space-x-2">
            <span>Danh sách Sự kiện</span>
            <span className="text-xs font-normal text-gray-500 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded-full">
              {filteredEvents.length} kết quả
            </span>
          </h2>

          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Tìm sự kiện trong mục này..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:border-neon-green transition-colors"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-white/[0.02] text-left text-xs text-gray-500 uppercase font-black tracking-wider">
                <th className="px-6 py-4">Tên sự kiện</th>
                <th className="px-6 py-4">Ban tổ chức</th>
                <th className="px-6 py-4">Thời gian</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {filteredEvents.length > 0 ? (
                filteredEvents.map((event) => (
                  <tr key={event.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                          {event.image_url ? (
                            <img src={event.image_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <Calendar className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                        <span className="font-bold text-gray-900 dark:text-white line-clamp-1 truncate max-w-[200px]">{event.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span>{event.organizer?.organization_name || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div>{format(new Date(event.event_date), 'dd/MM/yyyy')}</div>
                      <div className="text-[10px] flex items-center space-x-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        <span>{event.event_time || '--:--'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase ${
                        event.status === 'active' 
                          ? 'bg-green-500/10 text-green-500' 
                          : event.status === 'draft' || event.status === 'pending'
                            ? 'bg-yellow-500/10 text-yellow-500'
                            : 'bg-red-500/10 text-red-500'
                      }`}>
                        {event.status === 'active' ? 'Đang hoạt động' : 
                         event.status === 'draft' || event.status === 'pending' ? 'Chờ duyệt' : 'Đã hủy'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => navigate(`/admin/events`)} // Link to main events for filter later? Or detail page
                        className="p-2 text-gray-400 hover:text-neon-green hover:bg-neon-green/10 rounded-lg transition-all"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4 opacity-50" />
                    <p>Không có sự kiện nào thuộc danh mục này</p>
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

export default CategoryDetail;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Search, 
  Filter, 
  Eye, 
  EyeOff, 
  Trash2, 
  Plus,
  ChevronRight,
  Loader2,
  User,
  Calendar,
  MessageSquare,
  Heart,
  Tag,
  AlertCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { adminService } from '../../services/admin.service';

const BlogManagement = () => {
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    fetchBlogs();
  }, [statusFilter, typeFilter]);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (typeFilter !== 'all') params.type = typeFilter;
      if (searchTerm) params.search = searchTerm;

      const response = await adminService.getBlogs(params);
      if (response.success) {
        setBlogs(response.data);
      }
    } catch (error) {
      console.error('Error fetching blogs:', error);
      toast.error('Không thể tải danh sách bài viết');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchBlogs();
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      const response = await adminService.toggleBlogStatus(id);
      if (response.success) {
        toast.success(currentStatus === 'published' ? 'Đã ẩn bài viết' : 'Đã hiển thị bài viết');
        fetchBlogs();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi cập nhật trạng thái');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bài viết này?')) return;

    try {
      const response = await adminService.deleteBlog(id);
      if (response.success) {
        toast.success('Xóa bài viết thành công');
        fetchBlogs();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể xóa bài viết này');
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'ORGANIZER_NEWS': return { label: 'Tin tức BTC', color: 'text-blue-500 bg-blue-500/10' };
      case 'CUSTOMER_REVIEW': return { label: 'Review Khách', color: 'text-purple-500 bg-purple-500/10' };
      case 'SYSTEM_NEWS': return { label: 'Hệ thống', color: 'text-neon-green bg-neon-green/10' };
      default: return { label: type, color: 'text-gray-500 bg-gray-500/10' };
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black uppercase text-gray-900 dark:text-white flex items-center space-x-3 tracking-tight">
            <div className="p-2 bg-neon-green/10 rounded-xl">
              <FileText className="w-6 h-6 text-neon-green" />
            </div>
            <span>Quản lý Bài viết</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm font-medium">
            Biên tập và điều phối nội dung cộng đồng.
          </p>
        </div>
        <button 
          onClick={() => navigate('/admin/blog/create')}
          className="flex items-center justify-center space-x-2 bg-neon-green hover:bg-neon-hover text-black px-6 py-2.5 rounded-xl font-black uppercase text-xs transition-all shadow-lg shadow-neon-green/10"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo mới</span>
        </button>
      </div>

      {/* Filter Bar - High Density */}
      <div className="bg-white dark:bg-[#111114] p-3 rounded-2xl border border-gray-200 dark:border-white/5 flex flex-wrap items-center gap-3 shadow-sm">
        <form onSubmit={handleSearch} className="relative flex-1 min-w-[280px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input 
            type="text"
            placeholder="Tìm theo tiêu đề hoặc tác giả..."
            className="w-full bg-gray-50 dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-sm focus:outline-none focus:border-neon-green/50 transition-all dark:text-white text-gray-900"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </form>
        
        <div className="flex items-center gap-2">
          {/* Type Filter */}
          <select 
            className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:border-neon-green/50 cursor-pointer"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">Loại bài viết</option>
            <option value="ORGANIZER_NEWS">Tin tức BTC</option>
            <option value="CUSTOMER_REVIEW">Review Khách</option>
            <option value="SYSTEM_NEWS">Tin hệ thống</option>
          </select>

          {/* Status Filter */}
          <select 
            className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:border-neon-green/50 cursor-pointer"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Trạng thái</option>
            <option value="published">Đang hiện</option>
            <option value="hidden">Đã ẩn</option>
            <option value="draft">Bản nháp</option>
          </select>

          <button onClick={fetchBlogs} className="bg-neon-green text-black px-6 py-2.5 rounded-xl text-xs font-black uppercase hover:bg-neon-hover transition-all">
            Lọc
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="bg-white dark:bg-[#111114] rounded-2xl border border-gray-200 dark:border-white/5 p-20 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-neon-green animate-spin mb-4" />
          <p className="text-gray-500 uppercase text-[10px] font-black tracking-widest">Đang tải dữ liệu...</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#111114] rounded-2xl border border-gray-200 dark:border-white/5 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/5">
                  <th className="px-6 py-4 text-xs font-black uppercase text-gray-400">Bài viết</th>
                  <th className="px-6 py-4 text-xs font-black uppercase text-gray-400">Tác giả</th>
                  <th className="px-6 py-4 text-xs font-black uppercase text-gray-400 text-center">Tương tác</th>
                  <th className="px-6 py-4 text-xs font-black uppercase text-gray-400 text-center">Trạng thái</th>
                  <th className="px-6 py-4 text-xs font-black uppercase text-gray-400 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {blogs.length > 0 ? blogs.map((blog) => {
                  const typeInfo = getTypeLabel(blog.type);
                  return (
                    <tr key={blog.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.01] transition-all group">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-10 rounded-lg bg-gray-100 dark:bg-white/5 flex flex-shrink-0 items-center justify-center overflow-hidden border border-gray-200 dark:border-white/10 group-hover:border-neon-green/30 transition-all">
                            {blog.image_url ? (
                              <img src={blog.image_url} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            ) : (
                              <FileText className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                          <div className="max-w-[350px]">
                            <div className="text-sm font-bold text-gray-900 dark:text-white line-clamp-1 group-hover:text-neon-green transition-colors tracking-tight">{blog.title}</div>
                            <div className="flex items-center space-x-2 mt-0.5">
                              <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded border border-transparent ${typeInfo.color.replace('bg-', 'border-').replace('/10', '/30')}`}>
                                {typeInfo.label}
                              </span>
                              <span className="text-[10px] text-gray-400 font-medium italic">
                                {format(new Date(blog.created_at), 'dd/MM/yyyy')}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-white/10 flex items-center justify-center overflow-hidden border border-gray-200 dark:border-white/5">
                            {blog.author.avatar_url ? (
                              <img src={blog.author.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <User className="w-3.5 h-3.5 text-gray-400" />
                            )}
                          </div>
                          <div>
                             <div className="text-sm font-bold text-gray-700 dark:text-gray-300">{blog.author.full_name}</div>
                             <div className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter italic">{blog.author.role}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center space-x-4 text-[10px] font-black text-gray-500">
                           <div className="flex items-center" title="Lượt thích">
                              <Heart className="w-3.5 h-3.5 mr-1 text-red-500" />
                              {blog._count.likes}
                           </div>
                           <div className="flex items-center" title="Bình luận">
                              <MessageSquare className="w-3.5 h-3.5 mr-1 text-blue-500" />
                              {blog._count.comments}
                           </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                         <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase transition-all shadow-sm ${
                            blog.status === 'published' 
                            ? 'bg-green-500/10 text-green-500 border border-green-500/10' 
                            : blog.status === 'hidden'
                              ? 'bg-red-500/10 text-red-500 border border-red-500/10'
                              : 'bg-amber-500/10 text-amber-500 border border-amber-500/10'
                          }`}
                        >
                          {blog.status === 'published' ? 'Hiện' : blog.status === 'hidden' ? 'Ẩn' : 'Nháp'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button 
                            onClick={() => window.open(`/blog/${blog.slug}`, '_blank')}
                            className="p-2 bg-gray-50 dark:bg-white/5 text-gray-400 hover:text-neon-green hover:bg-neon-green/10 rounded-lg border border-transparent dark:border-white/5 transition-all shadow-sm"
                            title="Xem"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {blog.status !== 'draft' && (
                            <button 
                              onClick={() => toggleStatus(blog.id, blog.status)}
                              className={`p-2 bg-gray-50 dark:bg-white/5 rounded-lg border border-transparent dark:border-white/5 shadow-sm transition-all ${
                                blog.status === 'published' 
                                ? 'text-amber-500 hover:bg-amber-500/10' 
                                : 'text-blue-500 hover:bg-blue-500/10'
                              }`}
                              title={blog.status === 'published' ? 'Ẩn' : 'Hiện'}
                            >
                              {blog.status === 'published' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          )}
                          <button 
                            onClick={() => handleDelete(blog.id)}
                            className="p-2 bg-gray-50 dark:bg-white/5 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg border border-transparent dark:border-white/5 shadow-sm transition-all"
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-20 text-center opacity-50 italic text-sm">
                      Không có bài viết nào.
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

export default BlogManagement;

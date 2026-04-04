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
    <div className="p-1">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-black uppercase text-gray-900 dark:text-white flex items-center space-x-3">
            <div className="p-2 bg-neon-green/10 rounded-lg">
              <FileText className="w-6 h-6 text-neon-green" />
            </div>
            <span>Quản lý Bài viết</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 font-[10px] italic">
            Kiểm duyệt tin tức, đánh giá và thông báo trên toàn hệ thống
          </p>
        </div>
        <button 
          onClick={() => navigate('/admin/blogs/create')}
          className="flex items-center justify-center space-x-2 bg-neon-green hover:bg-neon-green/90 text-black px-6 py-3 rounded-xl font-black uppercase text-xs transition-all hover:scale-105 active:scale-95 shadow-lg shadow-neon-green/20"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo bài viết mới</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-[#111114] p-4 rounded-2xl border border-gray-100 dark:border-white/5 mb-6 flex flex-col md:flex-row gap-4 items-center">
        <form onSubmit={handleSearch} className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input 
            type="text"
            placeholder="Tìm theo tiêu đề hoặc tác giả..."
            className="w-full bg-gray-50 dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:border-neon-green transition-all dark:text-white text-gray-900"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </form>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Type Filter */}
          <div className="relative w-full md:w-44">
            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            <select 
              className="w-full font-medium bg-gray-50 dark:bg-[#1a1a1e] border border-gray-200 dark:border-white/20 rounded-xl py-3 pl-9 pr-10 text-xs font-bold appearance-none focus:outline-none focus:border-neon-green transition-all dark:text-white text-gray-900 cursor-pointer"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">Tất cả loại bài</option>
              <option value="ORGANIZER_NEWS">Tin tức BTC</option>
              <option value="CUSTOMER_REVIEW">Review Khách</option>
              <option value="SYSTEM_NEWS">Tin hệ thống</option>
            </select>
            <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 rotate-90 pointer-events-none" />
          </div>

          {/* Status Filter */}
          <div className="relative w-full md:w-44">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            <select 
              className="w-full font-medium bg-gray-50 dark:bg-[#1a1a1e] border border-gray-200 dark:border-white/20 rounded-xl py-3 pl-9 pr-10 text-xs font-bold appearance-none focus:outline-none focus:border-neon-green transition-all dark:text-white text-gray-900 cursor-pointer"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="published">Đang hiển thị</option>
              <option value="hidden">Đã ẩn</option>
              <option value="draft">Bản nháp</option>
            </select>
            <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 rotate-90 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-neon-green animate-spin mb-4" />
          <p className="text-gray-500 dark:text-gray-400 animate-pulse uppercase text-xs font-black tracking-widest">Đang tải bài viết...</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#111114] rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-white/5 border-b border-gray-100 dark:border-white/5">
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-wider">Thông tin bài viết</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-wider">Tác giả</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-wider text-center">Tương tác</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-wider text-center">Trạng thái</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-wider text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {blogs.length > 0 ? blogs.map((blog) => {
                  const typeInfo = getTypeLabel(blog.type);
                  return (
                    <tr key={blog.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-4">
                          <div className="w-16 h-12 rounded-lg bg-gray-100 dark:bg-white/5 flex flex-shrink-0 items-center justify-center overflow-hidden border border-gray-100 dark:border-white/10">
                            {blog.image_url ? (
                              <img src={blog.image_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <FileText className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                          <div className="max-w-[300px]">
                            <div className="font-bold text-gray-900 dark:text-white line-clamp-1 group-hover:text-neon-green transition-colors">{blog.title}</div>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${typeInfo.color}`}>
                                {typeInfo.label}
                              </span>
                              <span className="text-[10px] text-gray-400 flex items-center">
                                <Calendar className="w-3 h-3 mr-1" />
                                {format(new Date(blog.created_at), 'dd/MM/yyyy')}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center overflow-hidden">
                            {blog.author.avatar_url ? (
                              <img src={blog.author.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <User className="w-3 h-3 text-gray-400" />
                            )}
                          </div>
                          <div>
                             <div className="text-sm font-bold text-gray-700 dark:text-gray-300">{blog.author.full_name}</div>
                             <div className="text-[9px] text-gray-400 font-medium uppercase tracking-tighter">{blog.author.role}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center space-x-4 text-[10px] font-bold text-gray-500">
                           <div className="flex items-center" title="Lượt thích">
                              <Heart className="w-3 h-3 mr-1 fill-red-500/20 text-red-500" />
                              {blog._count.likes}
                           </div>
                           <div className="flex items-center" title="Bình luận">
                              <MessageSquare className="w-3 h-3 mr-1 text-blue-500" />
                              {blog._count.comments}
                           </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                         <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                            blog.status === 'published' 
                            ? 'bg-green-500/10 text-green-500' 
                            : blog.status === 'hidden'
                              ? 'bg-red-500/10 text-red-500'
                              : 'bg-amber-500/10 text-amber-500'
                          }`}
                        >
                          {blog.status === 'published' ? 'Hiển thị' : blog.status === 'hidden' ? 'Đã ẩn' : 'Bản nháp'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end space-x-2">
                          <button 
                            onClick={() => window.open(`/blog/${blog.slug}`, '_blank')}
                            className="p-2 text-gray-400 hover:text-neon-green hover:bg-neon-green/10 rounded-lg transition-all"
                            title="Xem chi tiết"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {blog.status !== 'draft' && (
                            <button 
                              onClick={() => toggleStatus(blog.id, blog.status)}
                              className={`p-2 rounded-lg transition-all ${
                                blog.status === 'published' 
                                ? 'text-amber-500 hover:bg-amber-500/10' 
                                : 'text-blue-500 hover:bg-blue-500/10'
                              }`}
                              title={blog.status === 'published' ? 'Ẩn bài viết' : 'Hiện bài viết'}
                            >
                              {blog.status === 'published' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          )}
                          <button 
                            onClick={() => handleDelete(blog.id)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
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
                    <td colSpan="5" className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
                          <FileText className="w-8 h-8 text-gray-300 dark:text-white/10" />
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 font-bold">Không tìm thấy bài viết nào</p>
                        <p className="text-xs text-gray-400 mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
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

export default BlogManagement;

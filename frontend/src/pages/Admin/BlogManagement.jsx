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
  AlertCircle,
  BarChart3,
  CheckCircle2,
  XCircle,
  MoreVertical,
  Flag,
  ShieldAlert,
  ArrowUpRight,
  RefreshCcw,
  LayoutGrid,
  List,
  ChevronDown
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { adminService } from '../../services/admin.service';
import { motion, AnimatePresence } from 'framer-motion';

const BlogManagement = () => {
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('blogs'); // 'blogs', 'reports'
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); 

  useEffect(() => {
    fetchData();
  }, [activeTab, statusFilter, typeFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'blogs') {
        const params = {};
        if (statusFilter !== 'all') params.status = statusFilter;
        if (typeFilter !== 'all') params.type = typeFilter;
        if (searchTerm) params.search = searchTerm;
        const response = await adminService.getBlogs(params);
        if (response.success) setBlogs(response.data);
      } else {
        const response = await adminService.getBlogReports();
        if (response.success) setReports(response.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Không thể tải dữ liệu. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      const response = await adminService.toggleBlogStatus(id);
      if (response.success) {
        toast.success(currentStatus === 'published' ? 'Đã ẩn bài viết thành công' : 'Đã hiển thị bài viết thành công');
        fetchData();
      }
    } catch (error) {
      toast.error('Lỗi khi cập nhật trạng thái bài viết');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bài viết này? Hành động này không thể hoàn tác.')) return;
    try {
      const response = await adminService.deleteBlog(id);
      if (response.success) {
        toast.success('Xóa bài viết thành công');
        fetchData();
      }
    } catch (error) {
      toast.error('Không thể xóa bài viết này');
    }
  };

  const handleResolveReport = async (reportId, action) => {
    try {
      const response = await adminService.resolveBlogReport(reportId, { 
        status: 'resolved', 
        action 
      });
      if (response.success) {
        toast.success(action === 'hide' ? 'Đã ẩn bài viết và xử lý báo cáo' : 'Đã giữ bài viết và đóng báo cáo');
        fetchData();
      }
    } catch (error) {
      toast.error('Lỗi khi xử lý báo cáo');
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'ORGANIZER_NEWS': return { label: 'tin tức btc', color: 'text-blue-500 bg-blue-500/10' };
      case 'CUSTOMER_REVIEW': return { label: 'review khách', color: 'text-purple-500 bg-purple-500/10' };
      case 'SYSTEM_NEWS': return { label: 'hệ thống', color: 'text-neon-green bg-neon-green/10' };
      default: return { label: type.toLowerCase(), color: 'text-gray-500 bg-gray-500/10' };
    }
  };

  const stats = {
    total: blogs.length,
    views: blogs.reduce((acc, curr) => acc + (curr.views || 0), 0),
    reports: reports.filter(r => r.status === 'pending').length,
    hidden: blogs.filter(b => b.status === 'hidden').length
  };

  return (
    <div className="space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-[1600px] mx-auto pb-4 px-4">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3 pt-2">
        <div className="space-y-0.5">
          <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3 tracking-tight">
            <div className="p-2 bg-neon-green/10 rounded-xl">
              <FileText className="w-6 h-6 text-neon-green" />
            </div>
            quản lý nội dung & cộng đồng
          </h1>
          <p className="text-gray-800 dark:text-gray-400 font-black text-sm tracking-tight pl-[52px]">
            trung tâm kiểm duyệt và điều phối bài viết toàn hệ thống
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'blogs' && (
            <button 
              onClick={() => navigate('/admin/blog/create')}
              className="bg-neon-green hover:bg-neon-hover text-gray-900 px-6 py-2.5 rounded-xl font-black text-sm transition-all shadow-lg shadow-neon-green/10 active:scale-95 flex items-center gap-2 tracking-tight"
            >
              <Plus className="w-4 h-4" />
              tạo bài viết mới
            </button>
          )}
          <button 
            onClick={fetchData}
            className="p-2.5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-800 hover:text-neon-green transition-all shadow-sm"
          >
            <RefreshCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats Summary - More Vibrant */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'tổng bài viết', value: stats.total, icon: FileText, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: 'tổng lượt xem', value: stats.views.toLocaleString(), icon: Eye, color: 'text-neon-green', bg: 'bg-neon-green/10' },
          { label: 'báo cáo mới', value: stats.reports, icon: Flag, color: 'text-red-500', bg: 'bg-red-500/10' },
          { label: 'đã ẩn', value: stats.hidden, icon: EyeOff, color: 'text-amber-500', bg: 'bg-amber-500/10' }
        ].map((item, idx) => (
          <div key={idx} className="bg-white dark:bg-[#111114] p-3 rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm hover:shadow-md transition-all flex items-center gap-3">
            <div className={`p-3 rounded-xl ${item.bg}`}>
              <item.icon className={`w-5 h-5 ${item.color}`} />
            </div>
            <div>
              <p className="text-xs font-black text-gray-800 tracking-tight">{item.label}</p>
              <p className="text-xl font-black text-gray-900 dark:text-white tracking-tight">{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs & Filters */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center p-0.5 bg-gray-100 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-xl w-full md:w-fit shadow-inner">
            <button
              onClick={() => setActiveTab('blogs')}
              className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-black transition-all flex items-center justify-center gap-2 tracking-tight ${
                activeTab === 'blogs'
                ? 'bg-white dark:bg-neon-green text-gray-900 shadow-sm'
                : 'text-gray-800 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              bài viết hệ thống
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-black transition-all flex items-center justify-center gap-2 relative tracking-tight ${
                activeTab === 'reports'
                ? 'bg-white dark:bg-red-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-800 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Flag className="w-4 h-4" />
              báo cáo vi phạm
              {stats.reports > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-white text-[10px] flex items-center justify-center rounded-full border border-white dark:border-black font-black">
                  {stats.reports}
                </span>
              )}
            </button>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            {activeTab === 'blogs' && (
              <div className="flex items-center bg-gray-100 dark:bg-white/5 p-1 rounded-2xl shadow-inner shrink-0">
                <button 
                  onClick={() => setViewMode('table')}
                  className={`p-2.5 rounded-xl transition-all ${viewMode === 'table' ? 'bg-white dark:bg-neon-green text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <List className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`p-2.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-neon-green text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {activeTab === 'blogs' && (
          <div className="bg-white dark:bg-[#111114] p-4 rounded-3xl border border-gray-200 dark:border-white/5 flex flex-col lg:flex-row items-center gap-4 shadow-sm">
            <div className="relative flex-1 w-full group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-neon-green transition-colors w-4 h-4" />
              <input 
                type="text"
                placeholder="tìm kiếm tiêu đề bài viết hoặc tên tác giả..."
                className="w-full bg-gray-50 dark:bg-white/10 border border-gray-100 dark:border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-neon-green/10 focus:border-neon-green/30 transition-all dark:text-white text-gray-900 tracking-tight"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchData()}
              />
            </div>
            
            <div className="flex items-center gap-2 w-full lg:w-auto">
              <div className="relative w-full lg:w-44">
                <select 
                  className="w-full appearance-none bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-gray-700 dark:text-gray-300 rounded-xl pl-4 pr-8 py-2.5 text-sm font-bold tracking-tight focus:outline-none focus:ring-2 focus:ring-neon-green/10 cursor-pointer transition-all"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <option value="all">tất cả bài viết</option>
                  <option value="ORGANIZER_NEWS">tin tức btc</option>
                  <option value="CUSTOMER_REVIEW">cảm nhận khách hàng</option>
                  <option value="SYSTEM_NEWS">tin tức hệ thống</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>

              <div className="relative w-full lg:w-44">
                <select 
                  className="w-full appearance-none bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-gray-700 dark:text-gray-300 rounded-xl pl-4 pr-8 py-2.5 text-sm font-bold tracking-tight focus:outline-none focus:ring-2 focus:ring-neon-green/10 cursor-pointer transition-all"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">mọi trạng thái</option>
                  <option value="published">đang hiển thị</option>
                  <option value="hidden">đã bị ẩn</option>
                  <option value="draft">bản nháp</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>

              <button 
                onClick={fetchData}
                className="bg-neon-green text-gray-900 px-5 py-2.5 rounded-xl text-sm font-black tracking-tight hover:bg-neon-hover transition-all shadow-sm"
              >
                lọc bài
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab + viewMode}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="min-h-[400px]"
        >
          {loading ? (
            <div className="bg-white dark:bg-[#111114] rounded-[40px] border border-gray-200 dark:border-white/5 p-40 flex flex-col items-center justify-center shadow-xl">
              <Loader2 className="w-16 h-16 text-neon-green animate-spin mb-8" />
              <p className="text-gray-500 uppercase text-xs font-black tracking-[0.4em]">Đang xử lý dữ liệu...</p>
            </div>
          ) : activeTab === 'blogs' ? (
            viewMode === 'table' ? (
              <BlogTable blogs={blogs} toggleStatus={toggleStatus} handleDelete={handleDelete} getTypeLabel={getTypeLabel} />
            ) : (
              <BlogGrid blogs={blogs} toggleStatus={toggleStatus} handleDelete={handleDelete} getTypeLabel={getTypeLabel} />
            )
          ) : (
            <ReportList reports={reports} onResolve={handleResolveReport} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

const BlogTable = ({ blogs, toggleStatus, handleDelete, getTypeLabel }) => (
  <div className="bg-white dark:bg-[#111114] rounded-2xl border border-gray-200 dark:border-white/5 overflow-hidden shadow-sm">
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-50/50 dark:bg-white/5 border-b border-gray-100 dark:border-white/5">
            <th className="px-6 py-3.5 text-xs font-black text-gray-800 tracking-tight">nội dung bài viết</th>
            <th className="px-6 py-3.5 text-xs font-black text-gray-800 tracking-tight">tác giả & vai trò</th>
            <th className="px-6 py-3.5 text-xs font-black text-gray-800 tracking-tight text-center">chỉ số tương tác</th>
            <th className="px-6 py-3.5 text-xs font-black text-gray-800 tracking-tight text-center">trạng thái</th>
            <th className="px-6 py-3.5 text-xs font-black text-gray-800 tracking-tight text-right">thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-white/5">
          {blogs.length > 0 ? blogs.map((blog) => {
            const typeInfo = getTypeLabel(blog.type);
            return (
              <tr key={blog.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.01] transition-all group">
                <td className="px-6 py-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-16 h-11 rounded-lg bg-gray-100 dark:bg-white/5 flex flex-shrink-0 items-center justify-center overflow-hidden border border-gray-200 dark:border-white/10 group-hover:border-neon-green/30 transition-all duration-300">
                      {blog.image_url ? (
                        <img src={blog.image_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <FileText className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    <div className="max-w-[400px] space-y-0.5">
                      <div className="text-base font-black text-gray-900 dark:text-white line-clamp-1 group-hover:text-neon-green transition-colors tracking-tight">{blog.title}</div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded border border-transparent tracking-tight ${typeInfo.color}`}>
                          {typeInfo.label}
                        </span>
                        <div className="flex items-center text-xs text-gray-800 font-bold tracking-tight">
                          <Calendar className="w-4 h-4 mr-1 text-neon-green" />
                          {format(new Date(blog.created_at), 'dd/MM/yyyy')}
                        </div>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/10 flex items-center justify-center overflow-hidden border border-gray-200 dark:border-white/5 shadow-sm">
                      {blog.author.avatar_url ? (
                        <img src={blog.author.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-4 h-4 text-gray-600" />
                      )}
                    </div>
                    <div>
                       <div className="text-sm font-black text-gray-900 dark:text-gray-300 tracking-tight">{blog.author.full_name}</div>
                       <div className="text-[10px] text-gray-800 font-black tracking-tight flex items-center gap-1 mt-0.5">
                          <Tag className="w-2.5 h-2.5 text-neon-green" />
                          {blog.author.role === 'admin' ? 'hệ thống' : blog.author.role === 'organizer' ? 'ban tổ chức' : 'người dùng'}
                       </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-3 text-center">
                  <div className="flex items-center justify-center space-x-4 text-xs font-black text-gray-800">
                     <div className="flex flex-col items-center gap-0.5" title="lượt xem">
                        <Eye className="w-4 h-4 text-neon-green" />
                        <span className="tracking-tight">{blog.views || 0}</span>
                     </div>
                     <div className="flex flex-col items-center gap-0.5" title="lượt thích">
                        <Heart className="w-4 h-4 text-red-500" />
                        <span className="tracking-tight">{blog._count.likes}</span>
                     </div>
                     <div className="flex flex-col items-center gap-0.5" title="bình luận">
                        <MessageSquare className="w-4 h-4 text-blue-500" />
                        <span className="tracking-tight">{blog._count.comments}</span>
                     </div>
                  </div>
                </td>
                <td className="px-6 py-3 text-center">
                   <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-black tracking-tight border ${
                      blog.status === 'published' 
                      ? 'bg-green-500/10 text-green-500 border-green-500/20' 
                      : blog.status === 'hidden'
                        ? 'bg-red-500/10 text-red-500 border-red-500/20'
                        : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                    }`}
                  >
                    {blog.status === 'published' ? 'hiện' : blog.status === 'hidden' ? 'ẩn' : 'nháp'}
                  </span>
                </td>
                <td className="px-6 py-3 text-right">
                  <div className="flex items-center justify-end space-x-1.5">
                    <button 
                      onClick={() => window.open(`/blog/${blog.slug}`, '_blank')}
                      className="p-2 bg-gray-100 dark:bg-white/5 text-gray-500 hover:text-neon-green rounded-lg border border-transparent transition-all active:scale-90"
                      title="xem bài viết"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                    {blog.status !== 'draft' && (
                      <button 
                        onClick={() => toggleStatus(blog.id, blog.status)}
                        className={`p-2 bg-gray-100 dark:bg-white/5 rounded-lg border border-transparent transition-all active:scale-90 ${
                          blog.status === 'published' 
                          ? 'text-amber-500 hover:bg-amber-500/10' 
                          : 'text-blue-500 hover:bg-blue-500/10'
                        }`}
                        title={blog.status === 'published' ? 'ẩn bài viết' : 'hiện bài viết'}
                      >
                        {blog.status === 'published' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    )}
                    <button 
                      onClick={() => handleDelete(blog.id)}
                      className="p-2 bg-gray-100 dark:bg-white/5 text-gray-500 hover:text-red-500 rounded-lg border border-transparent transition-all active:scale-90"
                      title="xóa bài viết"
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
                <div className="flex flex-col items-center opacity-30">
                  <FileText className="w-16 h-16 mb-4 text-gray-300" />
                  <p className="text-sm font-black tracking-tight">không có dữ liệu bài viết.</p>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);

const BlogGrid = ({ blogs, toggleStatus, handleDelete, getTypeLabel }) => (
  <div className="grid grid-cols-2 lg:grid-cols-4 3xl:grid-cols-5 4xl:grid-cols-6 gap-3 md:gap-4 animate-in fade-in zoom-in-95 duration-500">
    {blogs.map((blog) => {
      const typeInfo = getTypeLabel(blog.type);
      return (
        <div key={blog.id} className="bg-white dark:bg-[#111114] rounded-2xl border border-gray-200 dark:border-white/5 overflow-hidden shadow-sm hover:shadow-md transition-all duration-500 group flex flex-col h-full">
          <div className="relative aspect-[16/10] overflow-hidden">
            {blog.image_url ? (
              <img src={blog.image_url} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
            ) : (
              <div className="w-full h-full bg-gray-100 dark:bg-white/5 flex items-center justify-center">
                <FileText className="w-10 h-10 md:w-12 md:h-12 text-gray-200" />
              </div>
            )}
            <div className="absolute top-2 right-2 md:top-3 md:right-3">
              <span className={`px-2 py-0.5 md:px-3 md:py-1.5 rounded-xl text-[9px] md:text-[10px] font-black backdrop-blur-md border border-white/20 shadow-xl tracking-tight ${typeInfo.color}`}>
                {typeInfo.label}
              </span>
            </div>
          </div>

          <div className="p-3 md:p-4 flex-1 flex flex-col gap-2 md:gap-3 justify-between">
            <div className="space-y-1.5 md:space-y-2">
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-4 h-4 md:w-5 md:h-5 rounded-lg overflow-hidden border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 flex flex-shrink-0 items-center justify-center shadow-sm">
                  {blog.author?.avatar_url ? (
                    <img src={blog.author.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-2.5 h-2.5 md:w-3 md:h-3 text-gray-400" />
                  )}
                </div>
                <span className="text-[9px] md:text-[10px] font-black text-gray-500 truncate tracking-tight">{blog.author?.full_name || 'Admin BASTICKET'}</span>
              </div>

              <h3 className="text-xs md:text-sm font-black text-gray-900 dark:text-white group-hover:text-neon-green transition-colors line-clamp-2 tracking-tight leading-snug">
                {blog.title}
              </h3>
              <div className="flex items-center gap-3 md:gap-5 text-[10px] md:text-xs font-black text-gray-600">
                 <div className="flex items-center gap-1"><Eye className="w-3.5 h-3.5 md:w-4 md:h-4 text-neon-green" /> {blog.views || 0}</div>
                 <div className="flex items-center gap-1"><Heart className="w-3.5 h-3.5 md:w-4 md:h-4 text-red-500" /> {blog._count?.likes || 0}</div>
                 <div className="flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-500" /> {blog._count?.comments || 0}</div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2.5 border-t border-gray-100 dark:border-white/5 mt-2">
              <div className="flex items-center gap-1 md:gap-2">
                 <span className={`text-[9px] md:text-[10px] font-black tracking-tight ${
                   blog.status === 'published' ? 'text-green-500' : blog.status === 'hidden' ? 'text-red-500' : 'text-amber-500'
                 }`}>{blog.status === 'published' ? 'hiện' : blog.status === 'hidden' ? 'ẩn' : 'nháp'}</span>
              </div>
              <div className="flex items-center gap-1 md:gap-1.5">
                <button onClick={() => window.open(`/blog/${blog.slug}`, '_blank')} title="Xem chi tiết" className="p-1.5 md:p-2 bg-gray-50 dark:bg-white/5 text-gray-400 hover:text-neon-green rounded-lg transition-all"><ArrowUpRight className="w-3 h-3 md:w-3.5 md:h-3.5" /></button>
                <button onClick={() => toggleStatus(blog.id, blog.status)} title="Ẩn/Hiện" className="p-1.5 md:p-2 bg-gray-50 dark:bg-white/5 text-amber-500 hover:bg-amber-500/10 rounded-lg transition-all"><EyeOff className="w-3 h-3 md:w-3.5 md:h-3.5" /></button>
                <button onClick={() => handleDelete(blog.id)} title="Xóa" className="p-1.5 md:p-2 bg-gray-50 dark:bg-white/5 text-gray-400 hover:text-red-500 rounded-lg transition-all"><Trash2 className="w-3 h-3 md:w-3.5 md:h-3.5" /></button>
              </div>
            </div>
          </div>
        </div>
      );
    })}
  </div>
);

const ReportList = ({ reports, onResolve }) => (
  <div className="bg-white dark:bg-[#111114] rounded-2xl border border-gray-200 dark:border-white/5 overflow-hidden shadow-sm">
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-50/50 dark:bg-white/5 border-b border-gray-100 dark:border-white/5">
            <th className="px-6 py-3.5 text-xs font-black text-gray-800 tracking-tight">nội dung bị báo cáo</th>
            <th className="px-6 py-3.5 text-xs font-black text-gray-800 tracking-tight">người báo cáo</th>
            <th className="px-6 py-3.5 text-xs font-black text-gray-800 tracking-tight">lý do vi phạm</th>
            <th className="px-6 py-3.5 text-xs font-black text-gray-800 tracking-tight text-center">trạng thái</th>
            <th className="px-6 py-3.5 text-xs font-black text-gray-800 tracking-tight text-right">xử lý</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-white/5">
          {reports.length > 0 && reports.map((report) => (
            <tr key={report.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.01] transition-all group">
              <td className="px-6 py-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-red-600/10 text-red-600 rounded-xl">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-[12px] font-black text-gray-900 dark:text-white tracking-tight line-clamp-1 group-hover:text-red-600 transition-colors">
                      {report.blog.title}
                    </div>
                    <div className="flex items-center text-xs text-gray-800 font-bold tracking-tight">
                      <span className="text-red-600 mr-2 font-black">cảnh báo vi phạm</span>
                      <Calendar className="w-3.5 h-3.5 mr-1 text-neon-green" />
                      {format(new Date(report.created_at), 'HH:mm - dd/MM/yyyy')}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-3">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-white/10 flex items-center justify-center overflow-hidden border border-gray-200 dark:border-white/5 shadow-sm">
                    <User className="w-3.5 h-3.5 text-gray-800 dark:text-gray-400" />
                  </div>
                   <div>
                    <div className="text-sm font-black text-gray-900 dark:text-gray-300 tracking-tight leading-none">{report.reporter.full_name}</div>
                    <div className="text-[10px] text-gray-800 dark:text-gray-400 font-black tracking-tight mt-1 leading-none">{report.reporter.role === 'organizer' ? 'ban tổ chức' : 'người dùng'}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-3 max-w-[280px]">
                 <div className="bg-red-50 dark:bg-red-600/5 p-2 rounded-xl border border-red-100 dark:border-red-600/10 shadow-inner">
                    <p className="text-[11px] font-bold text-red-600 leading-tight line-clamp-2">{report.reason}</p>
                 </div>
              </td>
              <td className="px-6 py-3 text-center">
                 <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-black tracking-tight transition-all ${
                    report.status === 'pending' 
                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/30' 
                    : 'bg-gray-100 dark:bg-white/10 text-gray-800 dark:text-gray-400 border border-gray-200 dark:border-white/5'
                   }`}
                >
                  {report.status === 'pending' ? 'chờ xử lý' : 'đã xong'}
                </span>
              </td>
              <td className="px-6 py-3 text-right">
                {report.status === 'pending' ? (
                  <div className="flex items-center justify-end space-x-2">
                    <button 
                      onClick={() => onResolve(report.id, 'hide')}
                      className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-black tracking-tight shadow-sm hover:brightness-110 transition-all active:scale-95"
                    >
                      ẩn bài
                    </button>
                    <button 
                      onClick={() => onResolve(report.id, 'keep')}
                      className="px-4 py-2 bg-gray-100 dark:bg-white/5 text-gray-600 rounded-xl text-xs font-black tracking-tight hover:bg-gray-200 dark:hover:bg-white/10 transition-all active:scale-95 border border-gray-200 dark:border-white/10"
                    >
                      bỏ qua
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-end text-green-500 gap-1.5">
                    <div className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-black tracking-tight">đã xong</span>
                  </div>
                )}
              </td>
            </tr>
          ))}
          {reports.length === 0 && (
            <tr>
              <td colSpan="5" className="px-8 py-48 text-center">
                <div className="flex flex-col items-center opacity-30">
                  <div className="p-8 bg-green-500/10 rounded-full mb-6">
                    <CheckCircle2 className="w-16 h-16 text-green-500" />
                  </div>
                  <p className="text-sm font-black tracking-widest">không có báo cáo vi phạm nào đang chờ.</p>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);

export default BlogManagement;

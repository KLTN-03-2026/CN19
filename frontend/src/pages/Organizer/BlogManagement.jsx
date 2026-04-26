import React, { useState, useEffect } from 'react';
import { 
    PlusCircle, 
    Search, 
    Filter, 
    FileText, 
    Calendar, 
    Eye, 
    MessageSquare, 
    Heart, 
    MoreVertical, 
    Edit, 
    Trash2, 
    ExternalLink, 
    Loader2, 
    CheckCircle2, 
    Clock, 
    ChevronRight,
    AlertCircle,
    LayoutGrid,
    List,
    Users,
    Download
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { organizerService } from '../../services/organizer.service';
import { communityService } from '../../services/community.service';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { X } from 'lucide-react';

const BlogManagement = () => {
    const [blogs, setBlogs] = useState([]);
    const [customerReviews, setCustomerReviews] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('my-blogs'); // 'my-blogs', 'customer-reviews'
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [viewMode, setViewMode] = useState('grid');
    const [selectedBlogStats, setSelectedBlogStats] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            if (activeTab === 'my-blogs') {
                const res = await organizerService.getMyBlogs();
                setBlogs(res.data);
            } else {
                const res = await organizerService.getCustomerReviews();
                setCustomerReviews(res.data);
            }
        } catch (error) {
            toast.error('Không thể tải dữ liệu.');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa bài viết này không?')) return;
        try {
            await organizerService.deleteBlog(id);
            toast.success('Đã xóa bài viết thành công.');
            setBlogs(blogs.filter(b => b.id !== id));
        } catch (error) {
            toast.error('Lỗi khi xóa bài viết.');
        }
    };

    const handleModerate = async (id, currentStatus) => {
        const newStatus = currentStatus === 'published' ? 'hidden' : 'published';
        try {
            await organizerService.moderateBlog(id, newStatus);
            toast.success(newStatus === 'published' ? 'Đã hiển thị bài viết.' : 'Đã ẩn bài viết.');
            setCustomerReviews(customerReviews.map(r => r.id === id ? { ...r, status: newStatus } : r));
        } catch (error) {
            toast.error('Lỗi khi cập nhật trạng thái bài viết.');
        }
    };
    const handleExport = () => {
        try {
            if (filteredData.length === 0) {
                toast.error('Không có dữ liệu để xuất');
                return;
            }

            toast.loading('Đang chuẩn bị báo cáo...', { id: 'export-blog' });

            const dataToExport = filteredData.map((item, index) => {
                const base = {
                    'STT': index + 1,
                    'Tiêu đề': item.title || 'N/A',
                    'Lượt xem': item.views || 0,
                    'Lượt thích': item._count?.likes || 0,
                    'Bình luận': item._count?.comments || 0,
                    'Trạng thái': item.status === 'published' ? 'Đã hiển thị' : item.status === 'draft' ? 'Bản nháp' : 'Đã ẩn',
                    'Ngày tạo': new Date(item.created_at).toLocaleDateString('vi-VN')
                };

                if (activeTab === 'customer-reviews') {
                    return {
                        ...base,
                        'Tác giả': item.author?.full_name || 'N/A',
                        'Sự kiện': item.event?.title || 'N/A'
                    };
                }
                return base;
            });

            const worksheet = XLSX.utils.json_to_sheet(dataToExport);
            const workbook = XLSX.utils.book_new();
            const sheetName = activeTab === 'my-blogs' ? 'Bài viết của tôi' : 'Cảm nhận khách hàng';
            XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

            // Adjust column widths
            const wscols = [
                { wch: 5 },  // STT
                { wch: 40 }, // Tiêu đề
                { wch: 10 }, // Lượt xem
                { wch: 10 }, // Lượt thích
                { wch: 10 }, // Bình luận
                { wch: 15 }, // Trạng thái
                { wch: 15 }, // Ngày tạo
            ];
            if (activeTab === 'customer-reviews') {
                wscols.push({ wch: 20 }, { wch: 30 }); // Tác giả, Sự kiện
            }
            worksheet['!cols'] = wscols;

            const fileName = `${activeTab === 'my-blogs' ? 'Bao_cao_blog' : 'Bao_cao_review'}_${new Date().getTime()}.xlsx`;
            XLSX.writeFile(workbook, fileName);

            toast.success('Xuất báo cáo thành công!', { id: 'export-blog' });
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Có lỗi xảy ra khi xuất báo cáo', { id: 'export-blog' });
        }
    };
    const getStatusInfo = (status) => {
        switch (status) {
            case 'published': return { label: 'Đã đăng', color: 'bg-green-500/10 text-green-500', icon: CheckCircle2 };
            case 'draft': return { label: 'Bản nháp', color: 'bg-gray-500/10 text-gray-500', icon: Clock };
            case 'hidden': return { label: 'Đã ẩn', color: 'bg-red-500/10 text-red-500', icon: AlertCircle };
            default: return { label: status, color: 'bg-gray-500/10 text-gray-500', icon: Clock };
        }
    };

    const currentData = activeTab === 'my-blogs' ? blogs : customerReviews;

    const filteredData = currentData.filter(item => {
        const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const stats = {
        total: blogs.length,
        published: blogs.filter(b => b.status === 'published').length,
        reviews: customerReviews.length
    };

    return (
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-lg md:text-xl font-black text-gray-900 dark:text-white uppercase">
                        Quản lý Blog & Cộng đồng
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium text-xs">
                        {activeTab === 'my-blogs' 
                            ? 'Chia sẻ tin tức, thông báo chính thức về các sự kiện của bạn.' 
                            : 'Theo dõi và quản lý những cảm nhận từ khán giả về các sự kiện của bạn.'}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <button 
                        onClick={handleExport}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-2xl text-xs font-bold shadow-lg shadow-blue-600/20 transition-all active:scale-95 flex items-center gap-2"
                    >
                        Xuất báo cáo
                    </button>
                    {activeTab === 'my-blogs' && (
                        <button 
                            onClick={() => navigate('/organizer/blog/create')}
                            className="bg-blue-600 text-white px-5 py-2.5 rounded-2xl text-xs font-bold shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 active:scale-95 flex items-center gap-2 uppercase"
                        >
                            <PlusCircle className="w-4 h-4" />
                            Viết bài mới
                        </button>
                    )}
                </div>
            </div>

            {/* Main Tabs */}
            <div className="flex items-center p-1 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-2xl w-fit">
                <button
                    onClick={() => setActiveTab('my-blogs')}
                    className={`px-5 py-2.5 rounded-xl text-[11px] font-bold transition-all flex items-center gap-2 ${
                        activeTab === 'my-blogs'
                        ? 'bg-white dark:bg-blue-600 text-blue-600 dark:text-white shadow-sm border border-gray-100 dark:border-transparent'
                        : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                    }`}
                >
                    <FileText className="w-4 h-4" />
                    Bài viết ({stats.total})
                </button>
                <button
                    onClick={() => setActiveTab('customer-reviews')}
                    className={`px-5 py-2.5 rounded-xl text-[11px] font-bold transition-all flex items-center gap-2 ${
                        activeTab === 'customer-reviews'
                        ? 'bg-white dark:bg-blue-600 text-blue-600 dark:text-white shadow-sm border border-gray-100 dark:border-transparent'
                        : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                    }`}
                >
                    <Users className="w-4 h-4" />
                    Cảm nhận ({stats.reviews})
                </button>
            </div>

            {/* Stats Bar (Only for My Blogs) */}
            {activeTab === 'my-blogs' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="bg-white dark:bg-[#111114] p-4 rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm flex items-center gap-4">
                        <div className="p-2.5 bg-blue-50 dark:bg-blue-600/10 text-blue-600 rounded-xl">
                            <FileText className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-500 uppercase">Tổng bài viết</p>
                            <p className="text-base font-black text-gray-900 dark:text-white">{stats.total}</p>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-[#111114] p-4 rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm flex items-center gap-4">
                        <div className="p-2.5 bg-emerald-50 dark:bg-emerald-600/10 text-emerald-600 rounded-xl">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-500 uppercase">Đã xuất bản</p>
                            <p className="text-base font-black text-gray-900 dark:text-white">{stats.published}</p>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-[#111114] p-4 rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm flex items-center gap-4">
                        <div className="p-2.5 bg-indigo-50 dark:bg-indigo-600/10 text-indigo-600 rounded-xl">
                            <Users className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-500 uppercase">Reviews mới</p>
                            <p className="text-base font-black text-gray-900 dark:text-white">{stats.reviews}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
                <div className="flex-1 relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                    <input 
                        type="text"
                        placeholder={activeTab === 'my-blogs' ? "Tìm kiếm bài viết..." : "Tìm kiếm cảm nhận khách hàng..."}
                        className="w-full pl-11 pr-4 py-3 bg-white dark:bg-[#111114] border border-gray-200 dark:border-white/5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all font-bold text-[13px] text-gray-900 dark:text-white shadow-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
                    <div className="flex items-center gap-1 p-1 bg-white dark:bg-[#111114] border border-gray-200 dark:border-white/5 rounded-2xl shadow-sm shrink-0">
                        {['all', 'published', 'hidden'].map((s) => (
                            <button
                                key={s}
                                onClick={() => setFilterStatus(s)}
                                className={`px-4 py-2.5 rounded-xl text-[11px] font-black transition-all whitespace-nowrap ${
                                    filterStatus === s 
                                    ? 'bg-blue-600 text-white shadow-sm' 
                                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                                }`}
                            >
                                {s === 'all' ? 'Tất cả' : s === 'published' ? 'Đã hiển thị' : 'Đã ẩn'}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center bg-white dark:bg-[#111114] p-1 rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm shrink-0">
                        <button 
                            onClick={() => setViewMode('grid')}
                            className={`p-2.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'}`}
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => setViewMode('list')}
                            className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'}`}
                        >
                            <List className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* List/Grid Content */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-24 space-y-4">
                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                    <p className="text-gray-500 font-bold uppercase text-xs text-gray-900 dark:text-white">Đang tải dữ liệu...</p>
                </div>
            ) : filteredData.length > 0 ? (
                <div className={viewMode === 'grid' ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4" : "space-y-3"}>
                    {filteredData.map((item) => {
                        const statusInfo = getStatusInfo(item.status);
                        const isMyBlog = item.type === 'ORGANIZER_NEWS';
                        
                        return (
                            <div key={item.id} className={`bg-white dark:bg-[#111114] border border-gray-200 dark:border-white/5 group hover:shadow-xl transition-all duration-500 overflow-hidden ${viewMode === 'grid' ? 'rounded-2xl md:rounded-[2rem] flex flex-col' : 'rounded-2xl p-4 flex flex-row items-center gap-6'}`}>
                                {/* Thumbnail / Author Info */}
                                <div className={`${viewMode === 'grid' ? 'aspect-video w-full' : 'w-24 h-24 rounded-xl shrink-0'} bg-gray-50 dark:bg-white/5 relative overflow-hidden`}>
                                    {item.image_url ? (
                                        <img src={item.image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                                            <FileText className="w-10 h-10" />
                                        </div>
                                    )}
                                    <div className="absolute top-3 right-3">
                                        <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[8px] font-black uppercase backdrop-blur-md shadow-xl ${statusInfo.color}`}>
                                            <statusInfo.icon className="w-2.5 h-2.5" />
                                            {statusInfo.label}
                                        </span>
                                    </div>
                                    {!isMyBlog && (
                                        <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/80 to-transparent flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full overflow-hidden border border-white/20">
                                                <img src={item.author?.avatar_url || "/default-avatar.png"} alt="Avatar" className="w-full h-full object-cover" />
                                            </div>
                                            <span className="text-[8px] font-black text-white uppercase truncate">{item.author?.full_name}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className={`${viewMode === 'grid' ? 'p-3 md:p-5' : 'p-0'} flex-1 flex flex-col gap-3 md:gap-4`}>
                                    <div className="space-y-1 flex-1">
                                        <div className="flex items-center gap-2 text-[10px] text-gray-600 dark:text-gray-400 font-bold mb-2">
                                            <Calendar className="w-3 h-3 text-blue-600" />
                                            {new Date(item.created_at).toLocaleDateString('vi-VN')}
                                            {item.event && (
                                                <>
                                                    <span className="opacity-30">•</span>
                                                    <span className="text-blue-600 truncate max-w-[100px]">@{item.event.title}</span>
                                                </>
                                            )}
                                        </div>
                                        <h3 className="text-[13px] font-black text-gray-900 dark:text-white line-clamp-2 group-hover:text-blue-600 transition-colors leading-tight tracking-tight">
                                            {item.title}
                                        </h3>
                                        {!isMyBlog && (
                                            <div className="mt-2 text-[11px] text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed font-medium" dangerouslySetInnerHTML={{ __html: item.content }} />
                                        )}
                                    </div>

                                    {/* Footer / Stats */}
                                    <div className={`pt-3 border-t border-gray-100 dark:border-white/5 flex ${viewMode === 'grid' ? 'flex-col gap-3' : 'flex-row items-center justify-between gap-4'} lg:flex-row lg:items-center lg:justify-between`}>
                                        <div className="flex items-center gap-3 text-[9px] font-bold text-gray-700 dark:text-gray-400">
                                            <div className="flex items-center gap-1"><Eye className="w-3 h-3" /> {item.views || 0}</div>
                                            <div className="flex items-center gap-1"><Heart className="w-3 h-3" /> {item._count?.likes || 0}</div>
                                            <div className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {item._count?.comments || 0}</div>
                                        </div>
                                        <div className={`flex items-center gap-1.5 ${viewMode === 'grid' ? 'justify-start' : ''}`}>
                                            <button 
                                                onClick={() => window.open(`/blog/${item.slug || item.id}`, '_blank')}
                                                className="p-2 bg-gray-50 dark:bg-white/5 text-gray-500 hover:bg-indigo-600 hover:text-white rounded-xl transition-all"
                                                title="Mở"
                                            >
                                                <ExternalLink className="w-3 h-3" />
                                            </button>
                                            
                                            <button 
                                                onClick={() => setSelectedBlogStats(item)}
                                                className="p-2 bg-gray-50 dark:bg-white/5 text-gray-500 hover:bg-blue-600 hover:text-white rounded-xl transition-all"
                                                title="Số liệu"
                                            >
                                                <Eye className="w-3 h-3" />
                                            </button>

                                            {isMyBlog ? (
                                                <>
                                                    <button 
                                                        onClick={() => navigate(`/organizer/blog/${item.id}/edit`)}
                                                        className="p-2 bg-blue-600/5 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl transition-all"
                                                        title="Sửa"
                                                    >
                                                        <Edit className="w-3 h-3" />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(item.id)}
                                                        className="p-2 bg-red-600/5 text-red-600 hover:bg-red-600 hover:text-white rounded-xl transition-all"
                                                        title="Xóa"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </button>
                                                </>
                                            ) : (
                                                <button 
                                                    onClick={() => handleModerate(item.id, item.status)}
                                                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black transition-all ${
                                                        item.status === 'published'
                                                        ? 'bg-red-600/10 text-red-600 hover:bg-red-600 hover:text-white'
                                                        : 'bg-green-600/10 text-green-600 hover:bg-green-600 hover:text-white'
                                                    }`}
                                                >
                                                    {item.status === 'published' ? 'Ẩn' : 'Hiện'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="bg-white dark:bg-[#111114] rounded-[3rem] border-2 border-dashed border-gray-200 dark:border-white/5 p-24 flex flex-col items-center justify-center space-y-6 shadow-xl text-center">
                    <div className="p-6 bg-gray-100 dark:bg-white/5 rounded-full ring-8 ring-gray-50 dark:ring-white/0">
                        {activeTab === 'my-blogs' ? <FileText className="w-12 h-12 text-gray-300" /> : <Users className="w-12 h-12 text-gray-300" />}
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase">
                            {activeTab === 'my-blogs' ? 'Chưa có bài viết nào' : 'Chưa có cảm nhận nào từ khán giả'}
                        </h3>
                        <p className="text-gray-500 font-bold text-xs">
                            {activeTab === 'my-blogs' 
                                ? 'Hãy bắt đầu viết bài Blog đầu tiên của bạn để kết nối với khán giả.' 
                                : 'Các bài review từ người mua vé cho các sự kiện của bạn sẽ xuất hiện tại đây.'}
                        </p>
                        {activeTab === 'my-blogs' && (
                            <button 
                                onClick={() => navigate('/organizer/blog/create')}
                                className="mt-6 px-8 py-3 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase shadow-xl hover:scale-105 transition-all mx-auto flex items-center"
                            >
                                <PlusCircle className="w-4 h-4 mr-2" />
                                Tạo bài viết ngay
                            </button>
                        )}
                    </div>
                </div>
            )}
            {/* Modals */}
            <AnimatePresence>
                {selectedBlogStats && (
                    <BlogStatsModal 
                        blog={selectedBlogStats} 
                        onClose={() => setSelectedBlogStats(null)} 
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

const BlogStatsModal = ({ blog, onClose }) => {
    const [activeTab, setActiveTab] = useState('likers'); // 'likers', 'comments'
    const [data, setData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, [activeTab]);

    const fetchStats = async () => {
        try {
            setIsLoading(true);
            if (activeTab === 'likers') {
                const res = await communityService.getLikers(blog.id);
                setData(res.data || []);
            } else {
                const res = await communityService.getComments(blog.id);
                setData(res.data || []);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative bg-white dark:bg-[#111114] w-full max-w-lg rounded-3xl border border-gray-200 dark:border-white/5 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
                {/* Header */}
                <div className="px-5 py-3.5 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
                    <div className="space-y-0.5">
                        <h2 className="text-base font-black text-gray-900 dark:text-white uppercase truncate max-w-[280px]">
                            {blog.title}
                        </h2>
                        <p className="text-[10px] font-bold text-blue-600 tracking-wider flex items-center gap-1.5">
                            <Eye className="w-3 h-3" /> {blog.views || 0} lượt xem
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-white/5 rounded-xl hover:scale-110 transition-all active:scale-90">
                        <X className="w-4.5 h-4.5 text-gray-400" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="px-5 py-2.5 flex items-center gap-2 bg-gray-50/50 dark:bg-white/[0.02]">
                    <button 
                        onClick={() => setActiveTab('likers')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[11px] font-black transition-all ${
                            activeTab === 'likers' 
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                                : 'bg-white dark:bg-white/5 text-gray-500 hover:bg-gray-100'
                        }`}
                    >
                        <Heart className="w-3 h-3" /> {blog._count?.likes || 0} Lượt thích
                    </button>
                    <button 
                        onClick={() => setActiveTab('comments')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[11px] font-black transition-all ${
                            activeTab === 'comments' 
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                                : 'bg-white dark:bg-white/5 text-gray-500 hover:bg-gray-100'
                        }`}
                    >
                        <MessageSquare className="w-3 h-3" /> {blog._count?.comments || 0} Bình luận
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar min-h-[300px]">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-3">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-600/20" />
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Đang tải...</p>
                        </div>
                    ) : data.length > 0 ? (
                        <div className="space-y-2">
                            {activeTab === 'likers' ? (
                                data.map((user) => (
                                    <div key={user.id} className="flex items-center gap-3 p-2.5 bg-gray-50 dark:bg-white/5 rounded-2xl border border-transparent hover:border-blue-600/20 transition-all group">
                                        <div className="w-9 h-9 rounded-full overflow-hidden border border-white dark:border-white/10 shadow-sm transition-transform group-hover:scale-105 shrink-0">
                                            <img 
                                                src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.full_name}`} 
                                                className="w-full h-full object-cover" 
                                                alt=""
                                            />
                                        </div>
                                        <div>
                                            <h4 className="text-[13px] font-black text-gray-900 dark:text-white leading-none">{user.full_name}</h4>
                                            <p className="text-[9px] font-bold text-gray-400 mt-1 tracking-tight">
                                                Đã thích • {user.liked_at ? format(new Date(user.liked_at), 'HH:mm dd/MM/yyyy', { locale: vi }) : 'Vừa xong'}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                data.map((comment) => (
                                    <div key={comment.id} className="space-y-2 p-3 bg-gray-50 dark:bg-white/5 rounded-2xl">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-7 h-7 rounded-full overflow-hidden border border-white dark:border-white/10 shrink-0">
                                                <img 
                                                    src={comment.user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.user?.full_name}`} 
                                                    className="w-full h-full object-cover" 
                                                    alt=""
                                                />
                                            </div>
                                            <div>
                                                <h4 className="text-[11px] font-black text-gray-900 dark:text-white leading-none">{comment.user?.full_name}</h4>
                                                <p className="text-[8px] font-bold text-gray-400 uppercase mt-0.5">
                                                    {new Date(comment.created_at).toLocaleDateString('vi-VN')}
                                                </p>
                                            </div>
                                        </div>
                                        <p className="text-[11px] font-medium text-gray-700 dark:text-gray-300 leading-snug pl-9">
                                            {comment.content}
                                        </p>
                                        {comment.image_url && (
                                            <div className="pl-9 mt-1">
                                                <img src={comment.image_url} className="w-24 h-auto rounded-lg border border-gray-100 dark:border-white/10" alt="comment" />
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                            <div className="w-16 h-16 bg-gray-100 dark:bg-white/5 rounded-3xl flex items-center justify-center text-gray-300">
                                {activeTab === 'likers' ? <Heart className="w-8 h-8" /> : <MessageSquare className="w-8 h-8" />}
                            </div>
                            <div>
                                <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase">Trống</h4>
                                <p className="text-[10px] font-bold text-gray-400">Chưa có {activeTab === 'likers' ? 'lượt thích' : 'bình luận'} nào cho bài viết này.</p>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default BlogManagement;

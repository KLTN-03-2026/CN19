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
    Users
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { organizerService } from '../../services/organizer.service';

const BlogManagement = () => {
    const [blogs, setBlogs] = useState([]);
    const [customerReviews, setCustomerReviews] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('my-blogs'); // 'my-blogs', 'customer-reviews'
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [viewMode, setViewMode] = useState('grid');
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
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight uppercase underline decoration-blue-600 decoration-4 underline-offset-8">
                        Quản lý Blog & Cộng đồng
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-4 font-medium italic text-xs">
                        {activeTab === 'my-blogs' 
                            ? 'Chia sẻ tin tức, thông báo chính thức về các sự kiện của bạn.' 
                            : 'Theo dõi và quản lý những cảm nhận từ khán giả về các sự kiện của bạn.'}
                    </p>
                </div>
                {activeTab === 'my-blogs' && (
                    <button 
                        onClick={() => navigate('/organizer/blog/create')}
                        className="bg-blue-600 text-white px-6 py-3 rounded-2xl text-xs font-black shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30px_rgba(37,99,235,0.6)] transition-all flex items-center uppercase group w-fit"
                    >
                        <PlusCircle className="w-4 h-4 mr-3 group-hover:rotate-90 transition-transform duration-300" />
                        Viết bài mới
                    </button>
                )}
            </div>

            {/* Main Tabs */}
            <div className="flex items-center p-1 bg-gray-100 dark:bg-white/5 rounded-2xl w-fit">
                <button
                    onClick={() => setActiveTab('my-blogs')}
                    className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                        activeTab === 'my-blogs'
                        ? 'bg-white dark:bg-blue-600 text-blue-600 dark:text-white shadow-xl'
                        : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                    }`}
                >
                    <FileText className="w-4 h-4" />
                    Bài viết của tôi ({stats.total})
                </button>
                <button
                    onClick={() => setActiveTab('customer-reviews')}
                    className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                        activeTab === 'customer-reviews'
                        ? 'bg-white dark:bg-blue-600 text-blue-600 dark:text-white shadow-xl'
                        : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                    }`}
                >
                    <Users className="w-4 h-4" />
                    Cảm nhận khách hàng ({stats.reviews})
                </button>
            </div>

            {/* Stats Bar (Only for My Blogs) */}
            {activeTab === 'my-blogs' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-[#111114] p-5 rounded-2xl border border-gray-100 dark:border-white/5 flex items-center gap-4">
                        <div className="p-3 bg-blue-600/10 text-blue-600 rounded-xl">
                            <FileText className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tổng bài viết</p>
                            <p className="text-lg font-black text-gray-900 dark:text-white">{stats.total}</p>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-[#111114] p-5 rounded-2xl border border-gray-100 dark:border-white/5 flex items-center gap-4">
                        <div className="p-3 bg-green-600/10 text-green-600 rounded-xl">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Đã xuất bản</p>
                            <p className="text-lg font-black text-gray-900 dark:text-white">{stats.published}</p>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-[#111114] p-5 rounded-2xl border border-gray-100 dark:border-white/5 flex items-center gap-4">
                        <div className="p-3 bg-blue-600/10 text-blue-600 rounded-xl">
                            <Users className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Reviews mới</p>
                            <p className="text-lg font-black text-gray-900 dark:text-white">{stats.reviews}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Controls */}
            <div className="bg-white dark:bg-[#111114] p-4 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm space-y-4">
                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex-1 relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                        <input 
                            type="text"
                            placeholder={activeTab === 'my-blogs' ? "Tìm kiếm bài viết..." : "Tìm kiếm cảm nhận khách hàng..."}
                            className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-white/5 border border-transparent focus:bg-white dark:focus:bg-[#111114] border-gray-100 dark:border-white/5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all font-medium text-sm text-gray-900 dark:text-white"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    
                    <div className="flex items-center gap-2">
                        {['all', 'published', 'hidden'].map((s) => (
                            <button
                                key={s}
                                onClick={() => setFilterStatus(s)}
                                className={`px-5 py-3 rounded-xl text-[10px] font-black tracking-widest transition-all uppercase ${
                                    filterStatus === s 
                                    ? 'bg-blue-600 text-white shadow-lg' 
                                    : 'bg-gray-50 dark:bg-white/5 text-gray-500 hover:text-gray-900 dark:hover:text-white'
                                }`}
                            >
                                {s === 'all' ? 'Tất cả' : s === 'published' ? 'Đã hiển thị' : 'Đã ẩn'}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center bg-gray-50 dark:bg-white/5 p-1 rounded-xl border border-gray-100 dark:border-white/5">
                        <button 
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-blue-600 text-blue-600 dark:text-white shadow-sm' : 'text-gray-400'}`}
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-blue-600 text-blue-600 dark:text-white shadow-sm' : 'text-gray-400'}`}
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
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-xs text-gray-900 dark:text-white">Đang tải dữ liệu...</p>
                </div>
            ) : filteredData.length > 0 ? (
                <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
                    {filteredData.map((item) => {
                        const statusInfo = getStatusInfo(item.status);
                        const isMyBlog = item.type === 'ORGANIZER_NEWS';
                        
                        return (
                            <div key={item.id} className={`bg-white dark:bg-[#111114] border border-gray-100 dark:border-white/5 group hover:shadow-xl transition-all duration-500 overflow-hidden ${viewMode === 'grid' ? 'rounded-[2rem] flex flex-col' : 'rounded-2xl p-4 flex flex-row items-center gap-6'}`}>
                                {/* Thumbnail / Author Info */}
                                <div className={`${viewMode === 'grid' ? 'aspect-video w-full' : 'w-24 h-24 rounded-xl shrink-0'} bg-gray-100 dark:bg-white/5 relative overflow-hidden`}>
                                    {item.image_url ? (
                                        <img src={item.image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                                            <FileText className="w-10 h-10" />
                                        </div>
                                    )}
                                    <div className="absolute top-3 right-3">
                                        <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-wider backdrop-blur-md shadow-xl ${statusInfo.color}`}>
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
                                <div className="p-5 flex-1 flex flex-col gap-4">
                                    <div className="space-y-1 flex-1">
                                        <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold mb-2">
                                            <Calendar className="w-3 h-3 text-blue-600" />
                                            {new Date(item.created_at).toLocaleDateString('vi-VN')}
                                            {item.event && (
                                                <>
                                                    <span className="opacity-30">•</span>
                                                    <span className="text-blue-600 truncate max-w-[150px] uppercase">@{item.event.title}</span>
                                                </>
                                            )}
                                        </div>
                                        <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase line-clamp-2 group-hover:text-blue-600 transition-colors leading-relaxed">
                                            {item.title}
                                        </h3>
                                        {!isMyBlog && (
                                            <div className="mt-2 text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2 italic leading-relaxed" dangerouslySetInnerHTML={{ __html: item.content }} />
                                        )}
                                    </div>

                                    {/* Footer / Stats */}
                                    <div className="pt-4 border-t border-gray-100 dark:border-white/5 flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-3 text-[10px] font-black text-gray-400">
                                            <div className="flex items-center gap-1"><Eye className="w-3 h-3 text-blue-500" /> {item.views || 0}</div>
                                            <div className="flex items-center gap-1"><Heart className="w-3 h-3 text-red-500" /> {item._count?.likes || 0}</div>
                                            <div className="flex items-center gap-1"><MessageSquare className="w-3 h-3 text-green-500" /> {item._count?.comments || 0}</div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {isMyBlog ? (
                                                <>
                                                    <button 
                                                        onClick={() => navigate(`/organizer/blog/${item.id}/edit`)}
                                                        className="p-2.5 bg-blue-600/10 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl transition-all shadow-sm"
                                                    >
                                                        <Edit className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(item.id)}
                                                        className="p-2.5 bg-red-600/10 text-red-600 hover:bg-red-600 hover:text-white rounded-xl transition-all shadow-sm"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </>
                                            ) : (
                                                <button 
                                                    onClick={() => handleModerate(item.id, item.status)}
                                                    className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                                                        item.status === 'published'
                                                        ? 'bg-red-600/10 text-red-600 hover:bg-red-600 hover:text-white'
                                                        : 'bg-green-600/10 text-green-600 hover:bg-green-600 hover:text-white'
                                                    }`}
                                                >
                                                    {item.status === 'published' ? 'Ẩn review' : 'Hiện review'}
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
                        <p className="text-gray-500 font-medium italic text-xs">
                            {activeTab === 'my-blogs' 
                                ? 'Hãy bắt đầu viết bài Blog đầu tiên của bạn để kết nối với khán giả.' 
                                : 'Các bài review từ người mua vé cho các sự kiện của bạn sẽ xuất hiện tại đây.'}
                        </p>
                        {activeTab === 'my-blogs' && (
                            <button 
                                onClick={() => navigate('/organizer/blog/create')}
                                className="mt-6 px-8 py-3 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-all mx-auto flex items-center"
                            >
                                <PlusCircle className="w-4 h-4 mr-2" />
                                Tạo bài viết ngay
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default BlogManagement;

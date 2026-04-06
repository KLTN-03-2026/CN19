import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  Search, 
  Calendar, 
  User, 
  ChevronRight, 
  Tag, 
  TrendingUp,
  MessageSquare,
  Heart,
  LayoutGrid,
  List,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import blogService from '../../services/blog.service';
import { useTranslation } from 'react-i18next';

const BlogList = () => {
    const { t } = useTranslation();
    const [searchParams, setSearchParams] = useSearchParams();
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

    const page = parseInt(searchParams.get('page') || '1');
    const type = searchParams.get('type') || 'all';
    const search = searchParams.get('search') || '';

    useEffect(() => {
        fetchBlogs();
    }, [page, type, search]);

    const fetchBlogs = async () => {
        try {
            setLoading(true);
            const res = await blogService.getPublicBlogs({
                page,
                type,
                search,
                limit: 10
            });
            if (res.success) {
                setBlogs(res.data);
                setTotal(res.pagination.total);
            }
        } catch (error) {
            console.error('Fetch Blogs Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const categories = [
        { id: 'all', name: 'Tất cả', icon: Sparkles },
        { id: 'SYSTEM_NEWS', name: 'Tin hệ thống', icon: Tag },
        { id: 'ORGANIZER_NEWS', name: 'Thông báo BTC', icon: TrendingUp },
        { id: 'CUSTOMER_REVIEW', name: 'Cảm nhận k.hàng', icon: MessageSquare },
    ];

    const featuredBlog = blogs.find(b => b.type === 'SYSTEM_NEWS');
    const regularBlogs = blogs.filter(b => b.id !== featuredBlog?.id);

    return (
        <div className="min-h-screen bg-transparent pt-32 pb-20 px-4 md:px-8 selection:bg-neon-green/30">
            <div className="max-w-7xl mx-auto">
                
                {/* 🌟 Header Section */}
                <div className="mb-16 text-center md:text-left flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div className="space-y-4">
                        <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-neon-green/10 border border-neon-green/20 rounded-full"
                        >
                            <Sparkles className="w-4 h-4 text-neon-green" />
                            <span className="text-[10px] font-black text-neon-green uppercase tracking-widest">Tin tức & Sự kiện</span>
                        </motion.div>
                        <motion.h1 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white uppercase tracking-tighter"
                        >
                            BASTICKET <span className="text-neon-green">BLOG</span>
                        </motion.h1>
                        <p className="text-gray-500 dark:text-gray-400 font-medium max-w-xl">
                            Khám phá những tin tức mới nhất, hướng dẫn sử dụng và cảm nhận từ cộng đồng yêu âm nhạc tại BASTICKET.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        <div className="relative group w-full sm:w-64">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-neon-green transition-colors" />
                            <input 
                                type="text"
                                placeholder="Tìm kiếm bài viết..."
                                defaultValue={search}
                                onKeyDown={(e) => e.key === 'Enter' && setSearchParams({ ...Object.fromEntries(searchParams), search: e.target.value, page: '1' })}
                                className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl pl-12 pr-6 py-4 text-sm font-medium focus:border-neon-green outline-none transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* 🌟 Filters Section */}
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-12">
                    {categories.map((cat) => {
                        const Icon = cat.icon;
                        const isActive = type === cat.id;
                        return (
                            <button
                                key={cat.id}
                                onClick={() => setSearchParams({ ...Object.fromEntries(searchParams), type: cat.id, page: '1' })}
                                className={`flex items-center gap-3 px-6 py-3 rounded-2xl border transition-all duration-300 font-bold text-sm ${
                                    isActive 
                                    ? 'bg-neon-green text-black border-neon-green shadow-lg shadow-neon-green/20' 
                                    : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/5 text-gray-500 dark:text-gray-400 hover:border-neon-green/50'
                                }`}
                            >
                                <Icon className="w-4 h-4" />
                                {cat.name}
                            </button>
                        );
                    })}
                    <div className="hidden md:flex ml-auto items-center gap-2 bg-white dark:bg-white/5 p-1 rounded-xl border border-gray-200 dark:border-white/10">
                        <button 
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-neon-green text-black' : 'text-gray-400 hover:text-white'}`}
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-neon-green text-black' : 'text-gray-400 hover:text-white'}`}
                        >
                            <List className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* 🌟 Featured Article (Only if on page 1 and no search/filter or specifically SYSTEM_NEWS) */}
                {page === 1 && !search && featuredBlog && (
                    <motion.div 
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mb-12 group"
                    >
                        <Link to={`/blog/${featuredBlog.slug}`} className="block relative aspect-[21/9] rounded-[3rem] overflow-hidden border border-gray-200 dark:border-white/10 shadow-2xl">
                             <img 
                                src={featuredBlog.image_url || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1600&auto=format&fit=crop'} 
                                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" 
                                alt="featured" 
                             />
                             <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
                             
                             <div className="absolute bottom-0 left-0 p-8 md:p-12 w-full max-w-3xl space-y-6">
                                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-neon-green text-black rounded-full text-[10px] font-black uppercase tracking-widest">
                                    <Sparkles className="w-3 h-3" /> Nổi bật nhất
                                </div>
                                <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter leading-none group-hover:text-neon-green transition-colors">
                                    {featuredBlog.title}
                                </h2>
                                <p className="text-gray-300 font-medium line-clamp-2 md:text-lg">
                                    {featuredBlog.content.replace(/<[^>]*>/g, '').slice(0, 200)}...
                                </p>
                                <div className="flex items-center gap-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full border-2 border-neon-green overflow-hidden">
                                            <img src={featuredBlog.author.avatar_url} className="w-full h-full object-cover" alt="" />
                                        </div>
                                        <span className="text-sm font-bold text-white">{featuredBlog.author.full_name}</span>
                                    </div>
                                    <span className="text-sm font-bold text-gray-400">
                                        {new Date(featuredBlog.created_at).toLocaleDateString('vi-VN')}
                                    </span>
                                </div>
                             </div>
                        </Link>
                    </motion.div>
                )}

                {/* 🌟 Articles Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1,2,3,4,5,6].map(i => (
                            <div key={i} className="h-[450px] bg-white dark:bg-white/5 rounded-[2.5rem] animate-pulse border border-gray-200 dark:border-white/10" />
                        ))}
                    </div>
                ) : blogs.length > 0 ? (
                    <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" : "space-y-6"}>
                        {regularBlogs.map((blog, idx) => (
                            <motion.div
                                key={blog.id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                viewport={{ once: true }}
                                className="group"
                            >
                                <Link to={`/blog/${blog.slug}`} className={`block h-full bg-white dark:bg-white/5 rounded-[2.5rem] border border-gray-200 dark:border-white/5 overflow-hidden hover:border-neon-green/50 hover:shadow-2xl hover:shadow-neon-green/5 transition-all duration-500 ${viewMode === 'list' ? 'flex flex-col md:flex-row items-center p-4 gap-6' : ''}`}>
                                    <div className={`relative overflow-hidden ${viewMode === 'grid' ? 'aspect-[16/10]' : 'w-full md:w-64 h-48 rounded-[2rem] shrink-0'}`}>
                                        <img 
                                            src={blog.image_url || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=800&auto=format&fit=crop'} 
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                                            alt="" 
                                        />
                                        <div className="absolute top-4 left-4 pt-1">
                                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                                blog.type === 'SYSTEM_NEWS' ? 'bg-orange-500 text-white' : 
                                                blog.type === 'ORGANIZER_NEWS' ? 'bg-blue-500 text-white' : 
                                                'bg-neon-green text-black'
                                            }`}>
                                                {blog.type === 'SYSTEM_NEWS' ? 'Tin hệ thống' : 
                                                 blog.type === 'ORGANIZER_NEWS' ? 'Thông báo BTC' : 'Trải nghiệm'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className={`p-6 flex flex-col justify-between ${viewMode === 'grid' ? 'flex-1' : 'flex-1'}`}>
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(blog.created_at).toLocaleDateString('vi-VN')}
                                            </div>
                                            <h3 className={`font-black text-gray-900 dark:text-white uppercase leading-tight tracking-tight group-hover:text-neon-green transition-colors ${viewMode === 'grid' ? 'text-xl' : 'text-2xl'}`}>
                                                {blog.title}
                                            </h3>
                                            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium line-clamp-3 leading-relaxed">
                                                {blog.content.replace(/<[^>]*>/g, '')}
                                            </p>
                                        </div>

                                        <div className="mt-8 flex items-center justify-between pt-6 border-t border-gray-100 dark:border-white/5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full border border-neon-green/30 overflow-hidden">
                                                    <img src={blog.author.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg'} className="w-full h-full object-cover" alt="" />
                                                </div>
                                                <span className="text-[11px] font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider">{blog.author.full_name}</span>
                                            </div>
                                            <div className="flex items-center gap-4 text-gray-400">
                                                <div className="flex items-center gap-1.5">
                                                    <Heart className="w-4 h-4" />
                                                    <span className="text-xs font-bold">{blog._count?.likes || 0}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <MessageSquare className="w-4 h-4" />
                                                    <span className="text-xs font-bold">{blog._count?.comments || 0}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-32 bg-white dark:bg-white/5 rounded-[3rem] border border-dashed border-gray-200 dark:border-white/10">
                        <Sparkles className="w-16 h-16 text-gray-300 dark:text-white/10 mx-auto mb-6" />
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Không tìm thấy bài viết</h2>
                        <p className="text-gray-500 mt-2">Vui lòng thử lại với từ khóa khác hoặc danh mục khác.</p>
                        <button 
                            onClick={() => setSearchParams({})}
                            className="mt-8 px-8 py-3 bg-neon-green text-black font-black uppercase text-xs rounded-full"
                        >
                            Xem tất cả bài viết
                        </button>
                    </div>
                )}

                {/* 🌟 Pagination */}
                {total > 10 && (
                    <div className="mt-16 flex justify-center gap-4">
                        <button 
                            disabled={page === 1}
                            onClick={() => setSearchParams({ ...Object.fromEntries(searchParams), page: (page - 1).toString() })}
                            className="px-6 py-3 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl font-bold disabled:opacity-50 hover:border-neon-green transition-all"
                        >
                            Quay lại
                        </button>
                        <div className="flex gap-2">
                            {[...Array(Math.ceil(total / 10))].map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setSearchParams({ ...Object.fromEntries(searchParams), page: (i + 1).toString() })}
                                    className={`w-12 h-12 rounded-2xl font-black transition-all ${
                                        page === i + 1 
                                        ? 'bg-neon-green text-black' 
                                        : 'bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-500'
                                    }`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>
                        <button 
                            disabled={page === Math.ceil(total / 10)}
                            onClick={() => setSearchParams({ ...Object.fromEntries(searchParams), page: (page + 1).toString() })}
                            className="px-6 py-3 bg-neon-green text-black rounded-2xl font-black uppercase text-xs"
                        >
                            Tiếp theo
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BlogList;

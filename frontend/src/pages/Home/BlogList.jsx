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
  ArrowRight,
  MapPin,
  Ticket,
  Copy,
  CheckCircle2
} from 'lucide-react';
import blogService from '../../services/blog.service';
import eventService from '../../services/event.service';
import couponService from '../../services/coupon.service';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';

const BlogList = () => {
    const { t } = useTranslation();
    const [searchParams, setSearchParams] = useSearchParams();
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
    const [recommendedEvents, setRecommendedEvents] = useState([]);
    const [loadingEvents, setLoadingEvents] = useState(false);
    const [featuredCoupons, setFeaturedCoupons] = useState([]);
    const [loadingCoupons, setLoadingCoupons] = useState(false);
    const [copiedCode, setCopiedCode] = useState('');

    const page = parseInt(searchParams.get('page') || '1');
    const type = searchParams.get('type') || 'all';
    const search = searchParams.get('search') || '';

    useEffect(() => {
        fetchBlogs();
        fetchRecommendedEvents();
        fetchFeaturedCoupons();
    }, [page, type, search]);

    const fetchFeaturedCoupons = async () => {
        try {
            setLoadingCoupons(true);
            const res = await couponService.getFeaturedCoupons();
            if (res.success) {
                setFeaturedCoupons(res.data);
            }
        } catch (error) {
            console.error('Fetch Coupons Error:', error);
        } finally {
            setLoadingCoupons(false);
        }
    };

    const fetchRecommendedEvents = async () => {
        try {
            setLoadingEvents(true);
            const res = await eventService.getRecommendations();
            if (res.success) {
                // Lấy tối đa 8 sự kiện
                setRecommendedEvents(res.data.slice(0, 8));
            }
        } catch (error) {
            console.error('Fetch Recommendations Error:', error);
        } finally {
            setLoadingEvents(false);
        }
    };

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
        { id: 'SYSTEM_NEWS', name: 'Cộng đồng', icon: Tag },
        { id: 'ORGANIZER_NEWS', name: 'Ban Tổ Chức', icon: TrendingUp },
    ];

    const featuredBlog = blogs.find(b => b.type === 'SYSTEM_NEWS');
    const recentBlogs = blogs.filter(b => b.id !== featuredBlog?.id);

    return (
        <div className="min-h-screen bg-white dark:bg-dark-bg pt-20 pb-20 px-4 md:px-8 selection:bg-neon-green/30 transition-colors duration-500">
            {/* 🌌 Hệ thống Grid Background nhẹ nhàng */}
            <div className="fixed inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none"></div>

            <div className="max-w-7xl mx-auto relative z-10">
                
                {/* 🌟 1. Header Section - Phong cách Tạp chí cao cấp */}
                <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-10">
                    <div className="space-y-6 max-w-2xl">
                        <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-neon-green/10 border border-neon-green/20 rounded-full"
                        >
                            <Sparkles className="w-4 h-4 text-neon-green" />
                            <span className="text-[10px] font-black text-neon-green uppercase tracking-[0.2em]">Bản tin BASTICKET</span>
                        </motion.div>
                        <motion.h1 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white uppercase tracking-tighter"
                        >
                            THE <span className="text-neon-green italic">SPOTLIGHT</span>
                        </motion.h1>
                        <p className="text-gray-500 dark:text-gray-400 font-medium text-lg leading-relaxed">
                            Cập nhật những thông báo chính thức, sự kiện độc quyền và tâm điểm âm nhạc từ BASTICKET.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        <div className="relative group w-full sm:w-80">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-neon-green transition-all" />
                            <input 
                                type="text"
                                placeholder="Tìm kiếm tâm điểm..."
                                defaultValue={search}
                                onKeyDown={(e) => e.key === 'Enter' && setSearchParams({ ...Object.fromEntries(searchParams), search: e.target.value, page: '1' })}
                                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-[2rem] pl-14 pr-6 py-5 text-sm font-bold focus:border-neon-green/50 focus:ring-4 focus:ring-neon-green/5 outline-none transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* 🌟 2. Featured Spotlight Section (Giao diện ngang lớn) */}
                {page === 1 && !search && featuredBlog && (
                    <motion.div 
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-16 group"
                    >
                        <Link to={`/blog/${featuredBlog.slug}`} className="block relative aspect-[21/10] md:aspect-[21/8] rounded-[3rem] overflow-hidden border border-gray-200 dark:border-white/10 shadow-2xl overflow-hidden shadow-neon-green/5">
                             <img 
                                src={featuredBlog.image_url || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1600&auto=format&fit=crop'} 
                                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" 
                                alt="featured" 
                             />
                             <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
                             
                             <div className="absolute bottom-0 left-0 p-8 md:p-16 w-full max-w-4xl space-y-6">
                                <div className="flex items-center gap-3">
                                    <span className="px-4 py-1.5 bg-neon-green text-black rounded-full text-[10px] font-black uppercase tracking-widest">
                                        Tin Hệ Thống
                                    </span>
                                    <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">
                                        • {new Date(featuredBlog.created_at).toLocaleDateString('vi-VN')}
                                    </span>
                                </div>
                                <h2 className="text-2xl md:text-4xl font-black text-white uppercase tracking-tighter leading-none group-hover:text-neon-green transition-colors">
                                    {featuredBlog.title}
                                </h2>
                                <p className="text-gray-300 font-medium line-clamp-2 text-sm md:text-base max-w-2xl">
                                    {featuredBlog.content.replace(/<[^>]*>/g, '').slice(0, 250)}...
                                </p>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full border-2 border-neon-green p-0.5">
                                        <img src={featuredBlog.author.avatar_url} className="w-full h-full rounded-full object-cover" alt="" />
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-black text-neon-green uppercase tracking-widest">Đăng bởi</div>
                                        <div className="text-sm font-bold text-white uppercase tracking-tight">
                                            {featuredBlog.author.role === 'organizer' && featuredBlog.author.organizer_profile?.organization_name 
                                                ? featuredBlog.author.organizer_profile.organization_name 
                                                : (featuredBlog.author.full_name || 'BASTICKET Staff')}
                                        </div>
                                    </div>
                                </div>
                             </div>
                        </Link>
                    </motion.div>
                )}

                {/* 🌟 3. Filter & Category Stream */}
                <div className="sticky top-24 z-30 bg-white/80 dark:bg-dark-bg/80 backdrop-blur-xl py-6 mb-12 border-b border-gray-100 dark:border-white/5">
                    <div className="flex flex-wrap items-center gap-3">
                        {categories.map((cat) => {
                            const Icon = cat.icon;
                            const isActive = type === cat.id;
                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => setSearchParams({ ...Object.fromEntries(searchParams), type: cat.id, page: '1' })}
                                    className={`flex items-center gap-3 px-6 py-2.5 rounded-full border transition-all duration-500 text-[9px] font-black uppercase tracking-widest ${
                                        isActive 
                                        ? 'bg-neon-green text-black border-neon-green shadow-xl shadow-neon-green/20 scale-105' 
                                        : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:border-neon-green/50 opacity-70 hover:opacity-100'
                                    }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {cat.name}
                                </button>
                            );
                        })}
                        
                        <div className="ml-auto flex items-center gap-3">
                            <button 
                                onClick={() => setViewMode('grid')}
                                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${viewMode === 'grid' ? 'bg-neon-green text-black' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'}`}
                            >
                                <LayoutGrid className="w-5 h-5" />
                            </button>
                            <button 
                                onClick={() => setViewMode('list')}
                                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${viewMode === 'list' ? 'bg-neon-green text-black' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'}`}
                            >
                                <List className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* 🌟 4. Main News Stream */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        {[1,2,3,4,5,6].map(i => (
                            <div key={i} className="h-[500px] bg-gray-50 dark:bg-white/5 rounded-[3rem] animate-pulse border border-gray-100 dark:border-white/5" />
                        ))}
                    </div>
                ) : blogs.length > 0 ? (
                    <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" : "max-w-4xl mx-auto space-y-10"}>
                        {recentBlogs.map((blog, idx) => (
                            <motion.div
                                key={blog.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.05 }}
                                viewport={{ once: true }}
                                className="group"
                            >
                                <Link to={`/blog/${blog.slug}`} className={`block h-full bg-white dark:bg-[#111114] rounded-[3rem] border border-gray-100 dark:border-white/5 overflow-hidden hover:border-neon-green/30 hover:shadow-[0_20px_80px_-20px_rgba(82,196,45,0.15)] transition-all duration-700 ${viewMode === 'list' ? 'flex flex-col md:flex-row items-center p-6 gap-8' : ''}`}>
                                    <div className={`relative overflow-hidden ${viewMode === 'grid' ? 'aspect-[16/11]' : 'w-full md:w-80 h-56 rounded-[2.5rem] shrink-0'}`}>
                                        <img 
                                            src={blog.image_url || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=800&auto=format&fit=crop'} 
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                                            alt="" 
                                        />
                                        <div className="absolute top-4 left-4">
                                            <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                                                blog.type === 'SYSTEM_NEWS' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 
                                                'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                            }`}>
                                                {blog.type === 'SYSTEM_NEWS' ? 'System' : 'Organizer'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="p-6 flex flex-col h-full bg-gradient-to-b from-transparent to-gray-50/30 dark:to-white/[0.02]">
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 text-[9px] font-black text-gray-400 uppercase tracking-widest opacity-60">
                                                <Calendar className="w-3 h-3 text-neon-green" />
                                                {new Date(blog.created_at).toLocaleDateString('vi-VN')}
                                            </div>
                                            <h3 className={`font-black text-gray-900 dark:text-white uppercase leading-[1.1] tracking-tight group-hover:text-neon-green transition-colors ${viewMode === 'grid' ? 'text-xl' : 'text-2xl'}`}>
                                                {blog.title}
                                            </h3>
                                            <p className="text-gray-500 dark:text-gray-400 text-[13px] font-medium line-clamp-3 leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity">
                                                {blog.content.replace(/<[^>]*>/g, '')}
                                            </p>
                                        </div>

                                        <div className="mt-6 flex items-center justify-between pt-4 border-t border-gray-100 dark:border-white/5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-full border border-neon-green/30 p-0.5">
                                                    <img src={blog.author.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg'} className="w-full h-full rounded-full object-cover" alt="" />
                                                </div>
                                                <span className="text-[11px] font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest">
                                                    {blog.author.role === 'organizer' && blog.author.organizer_profile?.organization_name 
                                                        ? blog.author.organizer_profile.organization_name 
                                                        : 'BASTICKET'}
                                                </span>
                                            </div>
                                            <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-neon-green group-hover:translate-x-2 transition-all" />
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-40 bg-gray-50 dark:bg-white/[0.02] rounded-[4rem] border border-dashed border-gray-200 dark:border-white/10">
                        <Sparkles className="w-20 h-20 text-gray-300 dark:text-white/10 mx-auto mb-8" />
                        <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Bản tin đang trống</h2>
                        <p className="text-gray-500 mt-3 font-medium">Hãy thử quay lại sau hoặc tìm kiếm từ khóa khác.</p>
                        <button 
                            onClick={() => setSearchParams({})}
                            className="mt-10 px-10 py-5 bg-neon-green text-black font-black uppercase text-xs rounded-full shadow-xl shadow-neon-green/20 hover:scale-105 transition-all"
                        >
                            Tải lại bản tin
                        </button>
                    </div>
                )}

                {/* 🌟 5. Pagination */}
                {total > 10 && (
                    <div className="mt-20 flex justify-center items-center gap-4">
                        <button 
                            disabled={page === 1}
                            onClick={() => setSearchParams({ ...Object.fromEntries(searchParams), page: (page - 1).toString() })}
                            className="flex items-center gap-3 px-8 py-4 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest disabled:opacity-30 hover:border-neon-green transition-all"
                        >
                            <ChevronRight className="w-4 h-4 rotate-180" /> Trước
                        </button>
                        <div className="flex gap-2">
                            {[...Array(Math.ceil(total / 10))].map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setSearchParams({ ...Object.fromEntries(searchParams), page: (i + 1).toString() })}
                                    className={`w-14 h-14 rounded-2xl text-sm font-black transition-all ${
                                        page === i + 1 
                                        ? 'bg-neon-green text-black shadow-lg shadow-neon-green/20' 
                                        : 'bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-500 hover:border-neon-green/50'
                                    }`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>
                        <button 
                            disabled={page === Math.ceil(total / 10)}
                            onClick={() => setSearchParams({ ...Object.fromEntries(searchParams), page: (page + 1).toString() })}
                            className="flex items-center gap-3 px-8 py-4 bg-neon-green text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-neon-green/20"
                        >
                            Tiếp <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* 🌟 6. FEATURED COUPONS SECTION (MỚI) */}
                {(featuredCoupons.length > 0 || loadingCoupons) && (
                    <motion.div 
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mt-40"
                    >
                        <div className="flex items-center justify-between mb-12">
                            <div className="space-y-4">
                                <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-neon-green/10 border border-neon-green/20 rounded-full">
                                    <Tag className="w-4 h-4 text-neon-green" />
                                    <span className="text-[9px] font-black text-neon-green uppercase tracking-[0.2em]">Ưu đãi độc quyền</span>
                                </div>
                                <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter transition-all duration-300">
                                    SĂN DEAL <span className="text-neon-green">CỰC HỜI</span>
                                </h2>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {loadingCoupons ? (
                                Array(3).fill(0).map((_, i) => (
                                    <div key={i} className="h-40 bg-gray-50 dark:bg-white/5 rounded-3xl animate-pulse" />
                                ))
                            ) : (
                                featuredCoupons.map((coupon, idx) => (
                                    <motion.div
                                        key={coupon.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        viewport={{ once: true }}
                                        className="relative group bg-white dark:bg-[#1a1a1c] border border-gray-100 dark:border-white/10 rounded-3xl p-6 flex items-center gap-6 overflow-hidden shadow-xl hover:border-neon-green/50 transition-all duration-500"
                                    >
                                        {/* Hiệu ứng Ticket Cut */}
                                        <div className="absolute top-1/2 -left-4 -translate-y-1/2 w-8 h-8 bg-white dark:bg-dark-bg rounded-full border border-gray-100 dark:border-white/10 z-10" />
                                        <div className="absolute top-1/2 -right-4 -translate-y-1/2 w-8 h-8 bg-white dark:bg-dark-bg rounded-full border border-gray-100 dark:border-white/10 z-10" />

                                        <div className="w-20 h-20 bg-neon-green/10 rounded-2xl flex items-center justify-center shrink-0 border border-neon-green/20 relative">
                                            <Tag className="w-10 h-10 text-neon-green" />
                                        </div>

                                        <div className="flex-1 space-y-2">
                                            <div className="text-[10px] font-black text-neon-green uppercase tracking-widest">{coupon.discount_type === 'percentage' ? `${coupon.discount_value}% OFF` : `${coupon.discount_value.toLocaleString()} VND OFF`}</div>
                                            <h4 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight line-clamp-1">{coupon.code}</h4>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium line-clamp-1">HSD: {new Date(coupon.end_date).toLocaleDateString('vi-VN')}</p>
                                        </div>

                                        <button 
                                            onClick={() => handleCopy(coupon.code)}
                                            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${copiedCode === coupon.code ? 'bg-green-500 text-white' : 'bg-gray-100 dark:bg-white/5 text-gray-500 hover:bg-neon-green hover:text-black'}`}
                                        >
                                            {copiedCode === coupon.code ? <CheckCircle2 className="w-6 h-6" /> : <Copy className="w-6 h-6" />}
                                        </button>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}

                {/* 🌟 7. FEATURED EVENTS SECTION (The Big Finale) */}
                <motion.div 
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-50px' }}
                    className="mt-24 pt-16 border-t-2 border-gray-100 dark:border-white/10"
                >
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                        <div className="space-y-3">
                            <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-orange-500/10 border border-orange-500/20 rounded-full">
                                <TrendingUp className="w-4 h-4 text-orange-500" />
                                <span className="text-[9px] font-black text-orange-500 uppercase tracking-[0.2em]">Hot Events</span>
                            </div>
                            <h2 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none">
                                KHÁM PHÁ <br/> <span className="text-neon-green">SỰ KIỆN NỔI BẬT</span>
                            </h2>
                            <p className="text-gray-500 dark:text-gray-400 font-medium text-base max-w-xl">
                                Những sự kiện cháy vé nhất đang chờ đón bạn. Chớp lấy cơ hội ngay!
                            </p>
                        </div>
                        <Link to="/events" className="group flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 hover:text-neon-green transition-all whitespace-nowrap">
                            Tất cả sự kiện <div className="w-12 h-px bg-gray-300 dark:bg-white/20 group-hover:bg-neon-green group-hover:w-20 transition-all duration-500"></div>
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {loadingEvents ? (
                            Array(4).fill(0).map((_, i) => (
                                <div key={i} className="aspect-[3/4.5] bg-gray-100 dark:bg-white/5 rounded-[3rem] animate-pulse" />
                            ))
                        ) : recommendedEvents.length > 0 ? (
                            recommendedEvents.map((event, idx) => (
                                <motion.div
                                    key={event.id}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    viewport={{ once: true }}
                                    className="group relative aspect-[3/4.5] rounded-[3rem] overflow-hidden bg-gray-900 border-2 border-transparent hover:border-neon-green/30 transition-all duration-700 shadow-2xl"
                                >
                                    <img src={event.image_url} className="w-full h-full object-cover opacity-70 group-hover:scale-110 group-hover:opacity-100 transition-all duration-1000" alt="" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80 group-hover:opacity-40 transition-opacity"></div>
                                    
                                    <div className="absolute bottom-0 left-0 p-8 w-full space-y-4">
                                        <div className="flex items-center gap-2 text-[9px] font-black text-neon-green uppercase tracking-widest bg-neon-green/10 w-fit px-4 py-1.5 rounded-full border border-neon-green/20 backdrop-blur-md">
                                            <Calendar className="w-4 h-4" />
                                            {new Date(event.event_date).toLocaleDateString('vi-VN')}
                                        </div>
                                        <h4 className="text-2xl font-black text-white uppercase tracking-tighter line-clamp-2 leading-none group-hover:text-neon-green transition-colors">
                                            {event.title}
                                        </h4>
                                        <div className="flex items-center gap-2 text-[10px] text-gray-300 font-bold uppercase tracking-wider">
                                            <MapPin className="w-4 h-4 text-neon-green" />
                                            {event.location_address?.split(',').slice(-1)[0] || 'Việt Nam'}
                                        </div>
                                        <Link 
                                            to={`/event/${event.id}`}
                                            className="w-full py-4 mt-4 bg-neon-green text-black text-[10px] font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-3 hover:bg-white hover:scale-105 active:scale-95 transition-all transform translate-y-8 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 shadow-xl shadow-neon-green/20"
                                        >
                                            <Ticket className="w-4 h-4" /> Đặt Vé Ngay
                                        </Link>
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <div className="col-span-full py-20 text-center text-gray-500 font-black uppercase tracking-widest opacity-40 italic">Đang tải Spotlight Events...</div>
                        )}
                    </div>
                </motion.div>

                {/* 🌟 7. Newsletter Subscription (Bonus) */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    className="mt-40 p-12 md:p-20 bg-neon-green rounded-[4rem] flex flex-col md:flex-row items-center justify-between gap-12 overflow-hidden relative shadow-2xl shadow-neon-green/30"
                >
                    <div className="absolute top-0 right-0 w-96 h-96 bg-white/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
                    <div className="relative z-10 space-y-4 text-center md:text-left">
                        <h2 className="text-3xl md:text-5xl font-black text-black uppercase tracking-tighter leading-none">
                            KHÔNG BỎ LỠ <br/> BẤT KỲ NHỊP ĐẬP NÀO
                        </h2>
                        <p className="text-black/70 font-bold text-base">Đăng ký nhận thông báo về những sự kiện hot nhất tuần.</p>
                    </div>
                    <div className="relative z-10 w-full max-w-md flex flex-col items-end gap-4">
                         <div className="w-full relative">
                            <input 
                                type="email" 
                                placeholder="Email của bạn..." 
                                className="w-full bg-white/20 border-2 border-black/10 rounded-2xl px-8 py-5 text-black placeholder:text-black/40 font-bold focus:bg-white focus:outline-none transition-all shadow-inner"
                            />
                            <button className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 bg-black text-neon-green rounded-xl flex items-center justify-center hover:scale-110 active:scale-90 transition-all">
                                <ArrowRight className="w-6 h-6" />
                            </button>
                         </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default BlogList;

import React from 'react';
import { ArrowRight, Sparkles, Calendar, Clock, User, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Blog = () => {
    const { t } = useTranslation();
    const k = 'support.blog';

    const posts = [
        {
            id: 1,
            title: 'Tương lai của Vé Sự kiện: Tại sao NFT là chìa khóa?',
            excerpt: 'Khám phá cách công nghệ Blockchain đang thay đổi hoàn toàn cách chúng ta mua, sở hữu và sử dụng vé sự kiện với tính minh bạch tuyệt đối...',
            category: 'Công nghệ',
            date: '01 Th4, 2026',
            author: 'BASTICKET Team',
            image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800'
        },
        {
            id: 2,
            title: 'Hướng dẫn bảo mật ví BASTICKET của bạn',
            excerpt: 'Những quy tắc vàng để bảo vệ tài sản số và vé NFT của bạn khỏi các cuộc tấn công lừa đảo trực tuyến và bảo vệ quyền sở hữu...',
            category: 'Bảo mật',
            date: '28 Th3, 2026',
            author: 'Security Lab',
            image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=800'
        },
        {
            id: 3,
            title: 'Top 5 sự kiện âm nhạc đáng chú ý nhất mùa hè này',
            excerpt: 'Điểm qua những đại nhạc hội sắp tới được ứng dụng hệ thống soát vé AI thông minh từ BASTICKET mang lại trải nghiệm không giới hạn...',
            category: 'Sự kiện',
            date: '25 Th3, 2026',
            author: 'Event Insider',
            image: 'https://images.unsplash.com/photo-1459749411177-042180ce673c?auto=format&fit=crop&q=80&w=800'
        },
        {
            id: 4,
            title: 'Cách Blockchain loại bỏ vấn nạn vé giả một cách triệt để',
            excerpt: 'Phân tích cơ chế Smart Contract trong việc xác thực quyền sở hữu vé và ngăn chặn hành vi đầu cơ tích trữ của Bot...',
            category: 'Cơ sở dữ liệu',
            date: '20 Th3, 2026',
            author: 'Tech Analyst',
            image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&q=80&w=800'
        }
    ];

    const { i18n } = useTranslation();
    // Logic for language selection can be added here if posts are from API
    // For now using Vietnamese as main content as requested

    return (
        <div className="min-h-screen bg-white dark:bg-[#0a0a0c] transition-colors duration-500 font-sans selection:bg-neon-green/30">
            
            {/* 🧭 NAVIGATION & TITLE AREA (Strict Profile Header Style) */}
            <header className="max-w-[1400px] mx-auto px-4 sm:px-6 pt-12 pb-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-50 dark:bg-white/5 rounded-full mb-4">
                    <Sparkles className="w-3.5 h-3.5 text-neon-green" />
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                        {t(`${k}.badge`)}
                    </span>
                </div>
                
                <h1 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white uppercase leading-tight mb-4 tracking-tight">
                    {t(`${k}.title`)} <span className="text-neon-green">{t(`${k}.titleHighlight`)}</span>
                </h1>
                
                <p className="max-w-2xl text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                    {t(`${k}.subtitle`)}
                </p>
            </header>

            {/* 📜 MAIN LAYOUT */}
            <main className="max-w-[1400px] mx-auto px-4 sm:px-6 pb-24">
                
                {/* 🌟 FEATURED POST (Compact & High-Density) */}
                <div className="mb-12 group cursor-pointer relative rounded-3xl overflow-hidden border border-gray-100 dark:border-white/5 bg-white dark:bg-[#111114] shadow-sm">
                    <div className="flex flex-col lg:flex-row h-full">
                        <div className="lg:w-7/12 aspect-[16/10] lg:aspect-auto overflow-hidden">
                            <img 
                                src={posts[0].image} 
                                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" 
                                alt={posts[0].title} 
                            />
                        </div>
                        <div className="lg:w-5/12 p-6 sm:p-10 flex flex-col justify-center">
                            <div className="flex items-center gap-4 mb-6">
                                <span className="px-3 py-1 bg-neon-green/10 text-neon-green text-[10px] font-black uppercase tracking-widest rounded-lg border border-neon-green/20">
                                    {posts[0].category}
                                </span>
                                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                    <Clock className="w-3.5 h-3.5" /> 5 phút đọc
                                </div>
                            </div>
                            <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white leading-tight mb-4 group-hover:text-neon-green transition-colors">
                                {posts[0].title}
                            </h2>
                            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-medium mb-8 line-clamp-3">
                                {posts[0].excerpt}
                            </p>
                            <div className="flex items-center justify-between mt-auto pt-6 border-t border-gray-50 dark:border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center">
                                        <User className="w-4 h-4 text-gray-400" />
                                    </div>
                                    <span className="text-[11px] font-black text-gray-900 dark:text-white uppercase">{posts[0].author}</span>
                                </div>
                                <Link to={`/blog/${posts[0].id}`} className="flex items-center gap-2 text-neon-green font-black uppercase text-[10px] tracking-widest group/link">
                                    {t(`${k}.readMore`)} <ArrowRight className="w-4 h-4 transform group-hover/link:translate-x-1 transition-transform" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 🌟 POST GRID (High Density 3-Column) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {posts.slice(1).map((post) => (
                        <article 
                            key={post.id} 
                            className="group bg-white dark:bg-[#111114] rounded-3xl border border-gray-100 dark:border-white/5 overflow-hidden flex flex-col transition-all hover:shadow-xl hover:-translate-y-1"
                        >
                            <div className="aspect-[16/9] overflow-hidden relative">
                                <img 
                                    src={post.image} 
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                                    alt={post.title} 
                                />
                                <div className="absolute top-4 left-4">
                                    <span className="px-2.5 py-1 bg-black/60 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest rounded-lg border border-white/10">
                                        {post.category}
                                    </span>
                                </div>
                            </div>
                            <div className="p-6 flex-1 flex flex-col">
                                <div className="flex items-center gap-3 mb-4 text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                                    <Calendar className="w-3.5 h-3.5 text-neon-green" /> {post.date}
                                </div>
                                <h3 className="text-base font-black text-gray-900 dark:text-white leading-snug mb-3 line-clamp-2 group-hover:text-neon-green transition-colors">
                                    {post.title}
                                </h3>
                                <p className="text-[11px] sm:text-[12px] font-medium text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2 mb-6">
                                    {post.excerpt}
                                </p>
                                <div className="mt-auto pt-4 flex items-center justify-between border-t border-gray-50 dark:border-white/5">
                                    <div className="flex items-center gap-2">
                                        <TrendingUp className="w-3.5 h-3.5 text-neon-green" />
                                        <span className="text-[9px] font-black text-gray-400 uppercase">Xu hướng</span>
                                    </div>
                                    <Link 
                                        to={`/blog/${post.id}`} 
                                        className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-400 hover:bg-neon-green hover:text-black transition-all"
                                    >
                                        <ArrowRight className="w-5 h-5" />
                                    </Link>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>

                {/* 📍 NEWSLETTER SECTION (Standard Card Style) */}
                <div className="mt-24 bg-gray-900 dark:bg-[#111114] rounded-3xl border border-gray-800 dark:border-white/10 p-12 overflow-hidden relative group text-center">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-neon-green/5 rounded-full blur-[100px] pointer-events-none"></div>
                    <div className="relative z-10 max-w-xl mx-auto space-y-8">
                        <div className="space-y-3">
                            <h2 className="text-2xl font-black text-white uppercase tracking-tight">Đăng ký nhận tin mới nhất</h2>
                            <p className="text-xs text-gray-400 font-medium leading-relaxed">Cập nhập những xu hướng NFT và sự kiện âm nhạc hot nhất ngay qua Email.</p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <input 
                                type="email" 
                                placeholder="Email của bạn..." 
                                className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-xs font-bold text-white outline-none focus:border-neon-green transition-all"
                            />
                            <button className="px-8 py-4 bg-neon-green text-black rounded-2xl font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-transform active:scale-95">
                                Đăng ký ngay
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Blog;

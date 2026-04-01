import React from 'react';
import { Newspaper, Calendar, User, ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

const Blog = () => {
    const posts = [
        {
            id: 1,
            title: 'Tương lai của Vé Sự kiện: Tại sao NFT là chìa khóa?',
            excerpt: 'Khám phá cách công nghệ Blockchain đang thay đổi hoàn toàn cách chúng ta mua, sở hữu và sử dụng vé sự kiện...',
            category: 'Công nghệ',
            date: '01 Th04, 2026',
            author: 'Admin',
            image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800'
        },
        {
            id: 2,
            title: 'Hướng dẫn bảo mật ví BASTICKET của bạn',
            excerpt: 'Những quy tắc vàng để bảo vệ tài sản số và vé NFT của bạn khỏi các cuộc tấn công lừa đảo trực tuyến...',
            category: 'Bảo mật',
            date: '28 Th03, 2026',
            author: 'Security Team',
            image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=800'
        },
        {
            id: 3,
            title: 'Top 5 sự kiện âm nhạc đáng chú ý nhất mùa hè này',
            excerpt: 'Điểm qua những đại nhạc hội sắp tới được ứng dụng hệ thống soát vé AI thông minh từ BASTICKET...',
            category: 'Sự kiện',
            date: '25 Th03, 2026',
            author: 'Event Editor',
            image: 'https://images.unsplash.com/photo-1459749411177-042180ce673c?auto=format&fit=crop&q=80&w=800'
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-bg pt-20 pb-20 transition-colors duration-500">
            {/* Header */}
            <div className="max-w-[1400px] mx-auto px-6 py-20 text-center space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-neon-green/10 border border-neon-green/20 rounded-full text-neon-green text-[10px] font-black uppercase tracking-widest animate-pulse">
                    <Sparkles className="w-3 h-3" />
                    Bản tin BASTICKET
                </div>
                <h1 className="text-5xl md:text-7xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none">
                    Khám phá <span className="text-neon-green italic">Thế giới NFT</span>
                </h1>
                <p className="max-w-2xl mx-auto text-gray-500 dark:text-gray-400 font-medium text-sm md:text-base">
                    Cập nhật những xu hướng mới nhất về công nghệ Blockchain, bảo mật và các sự kiện âm nhạc đỉnh cao.
                </p>
            </div>

            {/* Featured Post */}
            <div className="max-w-[1400px] mx-auto px-6 mb-20">
                <div className="group relative h-[500px] md:h-[600px] rounded-[4rem] overflow-hidden shadow-2xl border border-white/5">
                    <img 
                        src={posts[0].image} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                        alt="" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16 space-y-6">
                        <span className="px-4 py-1.5 bg-neon-green text-black text-[10px] font-black uppercase tracking-widest rounded-full">
                            {posts[0].category}
                        </span>
                        <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter max-w-3xl leading-tight">
                            {posts[0].title}
                        </h2>
                        <p className="text-gray-300 font-medium max-w-2xl text-sm md:text-base line-clamp-2">
                            {posts[0].excerpt}
                        </p>
                        <div className="flex items-center gap-8 pt-4">
                            <div className="flex items-center gap-3">
                                <Calendar className="w-4 h-4 text-neon-green" />
                                <span className="text-[11px] font-bold text-white uppercase tracking-widest">{posts[0].date}</span>
                            </div>
                            <Link to="#" className="flex items-center gap-2 text-neon-green font-black uppercase text-xs tracking-widest border-b-2 border-neon-green pb-1 hover:gap-4 transition-all group/btn">
                                Đọc bài viết
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Post Grid */}
            <div className="max-w-[1400px] mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {posts.slice(1).map((post) => (
                    <article key={post.id} className="group flex flex-col bg-white dark:bg-dark-card border border-gray-100 dark:border-white/5 rounded-[3rem] overflow-hidden shadow-xl hover:border-neon-green/20 transition-all duration-500">
                        <div className="h-64 overflow-hidden relative">
                            <img 
                                src={post.image} 
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                                alt="" 
                            />
                            <div className="absolute top-6 left-6">
                                <span className="px-3 py-1 bg-black/60 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest rounded-full border border-white/10">
                                    {post.category}
                                </span>
                            </div>
                        </div>
                        <div className="p-8 flex-1 flex flex-col justify-between space-y-6">
                            <div className="space-y-4">
                                <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight line-clamp-2 group-hover:text-neon-green transition-colors leading-tight">
                                    {post.title}
                                </h3>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 line-clamp-3">
                                    {post.excerpt}
                                </p>
                            </div>
                            <div className="flex items-center justify-between pt-4 border-t border-gray-50 dark:border-white/5">
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-3.5 h-3.5 text-neon-green" />
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{post.date}</span>
                                </div>
                                <Link to="#" className="w-10 h-10 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-400 group-hover:bg-neon-green group-hover:text-black transition-all">
                                    <ArrowRight className="w-5 h-5" />
                                </Link>
                            </div>
                        </div>
                    </article>
                ))}
            </div>
        </div>
    );
};

export default Blog;

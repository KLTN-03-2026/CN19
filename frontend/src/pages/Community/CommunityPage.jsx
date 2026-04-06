import React, { useState, useEffect, useRef } from 'react';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Image as ImageIcon, 
  Plus, 
  Search,
  Sparkles,
  TrendingUp,
  Users,
  Calendar,
  MoreHorizontal,
  MapPin,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import { communityService } from '../../services/community.service';
import { useAuthStore } from '../../store/useAuthStore';
import { AnimatePresence, motion } from 'framer-motion';

// --- Thêm Component PostCard & CreatePostModal sau ---
import PostCard from '../../components/community/PostCard';
import CreatePostModal from '../../components/community/CreatePostModal';

const CommunityPage = () => {
    const { isAuthenticated, user } = useAuthStore();
    const [posts, setPosts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    
    // Pagination & Filter
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'reviews', 'vlogs'

    useEffect(() => {
        fetchFeed();
    }, [activeFilter]);

    const fetchFeed = async (isLoadMore = false) => {
        try {
            if (!isLoadMore) setIsLoading(true);
            const currentPage = isLoadMore ? page + 1 : 1;
            
            const response = await communityService.getFeed({ 
                page: currentPage, 
                limit: 10 
            });

            if (response.success) {
                if (isLoadMore) {
                    setPosts(prev => [...prev, ...response.data]);
                    setPage(currentPage);
                } else {
                    setPosts(response.data);
                    setPage(1);
                }
                setHasMore(response.data.length === 10);
            }
        } catch (error) {
            console.error('Fetch Feed Error:', error);
            toast.error('Không thể tải bản tin cộng đồng.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleLike = async (postId) => {
        if (!isAuthenticated) {
            toast.error('Vui lòng đăng nhập để tương tác!');
            return;
        }

        try {
            const res = await communityService.toggleLike(postId);
            if (res.liked !== undefined) {
                setPosts(prev => prev.map(p => 
                    p.id === postId 
                        ? { ...p, is_liked: res.liked, _count: { ...p._count, likes: p._count.likes + (res.liked ? 1 : -1) } }
                        : p
                ));
            }
        } catch (error) {
            toast.error('Lỗi tương tác.');
        }
    };

    const handlePostCreated = (newPost) => {
        setPosts(prev => [newPost, ...prev]);
        setIsCreateModalOpen(false);
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-bg pt-24 pb-20 transition-colors duration-500">
            <div className="max-w-[1200px] mx-auto px-4 md:px-6 grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8">
                
                {/* --- CHÍNH: FEED --- */}
                <div className="space-y-6">
                    {/* Ô Đăng bài (Giống Facebook) */}
                    <div className="bg-white dark:bg-[#111114] rounded-[2rem] p-6 shadow-xl border border-gray-100 dark:border-white/5">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-neon-green/20">
                                <img 
                                    src={user?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'} 
                                    className="w-full h-full object-cover"
                                    alt="avatar"
                                />
                            </div>
                            <button 
                                onClick={() => isAuthenticated ? setIsCreateModalOpen(true) : toast.error('Vui lòng đăng nhập!')}
                                className="flex-1 h-12 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full px-6 text-left text-gray-500 dark:text-gray-400 text-sm font-medium transition-all"
                            >
                                {isAuthenticated ? `Ơi ${user?.full_name?.split(' ').pop()} ơi, đang nghĩ gì thế?` : 'Đăng nhập để chia sẻ cùng cộng đồng...'}
                            </button>
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t border-gray-50 dark:border-white/5">
                            <button className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl transition-all text-sm font-bold text-gray-600 dark:text-gray-300">
                                <ImageIcon className="w-5 h-5 text-neon-green" />
                                Ảnh/Video
                            </button>
                            <button className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl transition-all text-sm font-bold text-gray-600 dark:text-gray-300">
                                <Calendar className="w-5 h-5 text-blue-500" />
                                Sự kiện đã đi
                            </button>
                            <button className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl transition-all text-sm font-bold text-gray-600 dark:text-gray-300">
                                <Sparkles className="w-5 h-5 text-orange-500" />
                                Cảm xúc
                            </button>
                        </div>
                    </div>

                    {/* Bộ lọc bản tin */}
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
                        {['all', 'reviews', 'vlogs'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setActiveFilter(f)}
                                className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                                    activeFilter === f 
                                    ? 'bg-neon-green text-black shadow-lg shadow-neon-green/20' 
                                    : 'bg-white dark:bg-white/5 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10'
                                }`}
                            >
                                {f === 'all' ? 'Tất cả' : f === 'reviews' ? 'Cảm nhận' : 'Vlog cá nhân'}
                            </button>
                        ))}
                    </div>

                    {/* Danh sách Post */}
                    <div className="space-y-6">
                        {isLoading ? (
                            Array(3).fill(0).map((_, i) => (
                                <div key={i} className="bg-white dark:bg-[#111114] h-[400px] rounded-[2rem] animate-pulse" />
                            ))
                        ) : posts.length > 0 ? (
                            posts.map((post) => (
                                <PostCard 
                                    key={post.id} 
                                    post={post} 
                                    onLike={() => handleToggleLike(post.id)}
                                />
                            ))
                        ) : (
                            <div className="bg-white dark:bg-[#111114] rounded-[2rem] p-12 text-center border border-dashed border-gray-200 dark:border-white/10">
                                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase">Chưa có bài viết nào</h3>
                                <p className="text-gray-500 text-sm mt-2">Hãy là người đầu tiên chia sẻ khoảnh khắc của bạn!</p>
                            </div>
                        )}

                        {hasMore && !isLoading && (
                            <button 
                                onClick={() => fetchFeed(true)}
                                className="w-full py-4 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-2xl text-xs font-black uppercase tracking-widest text-gray-400 hover:text-neon-green transition-all"
                            >
                                Xem thêm bài viết
                            </button>
                        )}
                    </div>
                </div>

                {/* --- PHỤ: SIDEBAR (Coming Soon / Stat) --- */}
                <div className="hidden lg:block space-y-6">
                    <div className="bg-white dark:bg-[#111114] rounded-[2rem] p-8 shadow-xl border border-gray-100 dark:border-white/5 sticky top-24">
                        <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-neon-green" />
                            Xu hướng cộng đồng
                        </h3>
                        
                        <div className="space-y-4">
                            <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl">
                                <div className="text-[10px] font-black text-neon-green uppercase tracking-widest mb-1">Thịnh hành</div>
                                <div className="text-sm font-bold text-gray-900 dark:text-white">#Lanyconcert2026</div>
                                <div className="text-[9px] text-gray-500 mt-1">1.2k bài viết • 5k lượt thích</div>
                            </div>
                            <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl">
                                <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">Tìm vé</div>
                                <div className="text-sm font-bold text-gray-900 dark:text-white">#PassVeconcert</div>
                                <div className="text-[9px] text-gray-500 mt-1">800 bài viết • 12k quan tâm</div>
                            </div>
                        </div>

                        <div className="mt-8 pt-8 border-t border-gray-50 dark:border-white/5">
                            <p className="text-[10px] text-gray-400 leading-relaxed italic">
                                Đây là không gian giao lưu tự do của cộng đồng BASTICKET. Vui lòng tuân thủ nội quy cộng đồng để xây dựng môi trường lành mạnh!
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Đăng bài */}
            {isCreateModalOpen && (
                <CreatePostModal 
                    onClose={() => setIsCreateModalOpen(false)}
                    onSuccess={handlePostCreated}
                />
            )}
        </div>
    );
};

export default CommunityPage;

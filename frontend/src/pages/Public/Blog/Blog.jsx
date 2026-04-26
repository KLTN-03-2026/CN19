import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  TrendingUp, 
  MessageSquare, 
  LayoutDashboard, 
  Bookmark, 
  Users, 
  User,
  Bell,
  Sparkles,
  ArrowRight,
  Loader2,
  Calendar
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';

import blogService from '../../../services/blog.service';
import { communityService } from '../../../services/community.service';
import { userService } from '../../../services/user.service';
import eventService from '../../../services/event.service';
import { useAuthStore } from '../../../store/useAuthStore';
import UnifiedPostCard from '../../../components/blog/UnifiedPostCard';
import CreatePostModal from '../../../components/blog/CreatePostModal';
import NotificationsModal from '../../../components/blog/NotificationsModal';
import { Link, useLocation } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';
import { vi, enUS } from 'date-fns/locale';

const Blog = () => {
    const { t, i18n } = useTranslation();
    const { isAuthenticated, user } = useAuthStore();
    const location = useLocation();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [postToEdit, setPostToEdit] = useState(null);
    const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('explorer');

    const [mergedFeed, setMergedFeed] = useState([]);
    const [isLoadingFeed, setIsLoadingFeed] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            if (searchQuery) setPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);
 
    // Handle deep links from navigation
    useEffect(() => {
        if (location.state?.activeTab) {
            setActiveTab(location.state.activeTab);
        }
        if (location.state?.searchQuery) {
            setSearchQuery(location.state.searchQuery);
        }
    }, [location.state]);

    // Fetch User Stats (Total posts count) - Always fetch this regardless of activeTab
    const { data: userStatsData, refetch: refetchUserStats } = useQuery({
        queryKey: ['user-stats', user?.id],
        queryFn: () => blogService.getPublicBlogs({
            authorId: user?.id,
            limit: 1
        }),
        enabled: !!isAuthenticated && !!user?.id,
    });

    // Fetch Notifications (to show unread count in sidebar)
    const { data: notifData } = useQuery({
        queryKey: ['notifications'],
        queryFn: () => userService.getNotifications(),
        enabled: !!isAuthenticated,
        refetchInterval: 60000 
    });

    // Fetch Event Recommendations (Hot discussions)
    const { data: trendingEventsData, isLoading: trendingLoading } = useQuery({
        queryKey: ['trending-events'],
        queryFn: () => blogService.getTrendingEvents(),
    });

    const notifications = notifData?.data || [];
    const unreadCount = notifications.filter(n => !n.is_read).length;
    const trendingEvents = trendingEventsData?.data || [];

    // Fetch Official Blogs (Admin) - Using a higher limit for "pins"
    const { data: blogData, isLoading: blogLoading, refetch: refetchBlogs } = useQuery({
        queryKey: ['blogs', activeTab, page, debouncedSearch],
        queryFn: () => {
            if (activeTab === 'saved') {
                return blogService.getSavedBlogs();
            }
            return blogService.getPublicBlogs({
                type: (activeTab === 'explorer' || activeTab === 'profile') ? 'all' : activeTab,
                authorId: activeTab === 'profile' ? user?.id : undefined,
                search: debouncedSearch,
                page,
                limit: 10
            });
        },
        keepPreviousData: true
    });

    // Fetch Community Posts (Legacy support or secondary source)
    const { data: communityData, isLoading: communityLoading } = useQuery({
        queryKey: ['community-posts', page],
        queryFn: () => communityService.getFeed({ page, limit: 10 }),
        enabled: activeTab === 'explorer',
        keepPreviousData: true
    });

    useEffect(() => {
        setPage(1);
        setMergedFeed([]);
        setIsLoadingFeed(true);
    }, [activeTab]);

    useEffect(() => {
        if (!blogLoading && (activeTab !== 'explorer' || !communityLoading)) {
            mergeAndSortPosts();
        }
    }, [blogData, communityData, blogLoading, communityLoading, activeTab]);

    const mergeAndSortPosts = () => {
        if (activeTab === 'saved' || activeTab === 'profile') {
            setMergedFeed(blogData?.data || []);
            setIsLoadingFeed(false);
            setHasMore(false);
            return;
        }

        const blogs = (blogData?.data || []).map(p => ({ ...p, type: p.type === 'SYSTEM_NEWS' ? 'official' : 'community' }));
        const feeds = activeTab === 'explorer' ? (communityData?.data || []).map(p => ({ ...p, type: 'community' })) : [];

        // Merge logic
        let combined = [...blogs, ...feeds];

        // Unique by ID
        const uniquePosts = Array.from(new Map(combined.map(item => [item.id, item])).values());

        // Sort Strategy
        uniquePosts.sort((a, b) => {
            if (a.type === 'official' && b.type !== 'official') return -1;
            if (b.type === 'official' && a.type !== 'official') return 1;
            
            const dateA = new Date(a.created_at || a.date);
            const dateB = new Date(b.created_at || b.date);
            return dateB - dateA;
        });

        if (page > 1) {
            setMergedFeed(prev => {
                const existingIds = new Set(prev.map(p => p.id));
                const filteredNew = uniquePosts.filter(p => !existingIds.has(p.id));
                return [...prev, ...filteredNew];
            });
        } else {
            setMergedFeed(uniquePosts);
        }
        
        setIsLoadingFeed(false);
        
        // Handle pagination state
        const currentLimit = activeTab === 'explorer' ? 20 : 10;
        if ((blogData?.data?.length || 0) < currentLimit) {
            setHasMore(false);
        } else {
            setHasMore(true);
        }
    };

    const handlePostSaved = (savedPost) => {
        setMergedFeed(prev => {
            const index = prev.findIndex(p => p.id === savedPost.id);
            if (index !== -1) {
                // Update existing post
                const newFeed = [...prev];
                newFeed[index] = { 
                    ...prev[index], // Keep metadata like type
                    ...savedPost 
                };
                return newFeed;
            } else {
                // Add new post
                return [{ ...savedPost, type: 'community' }, ...prev];
            }
        });
        refetchUserStats();
        setIsCreateModalOpen(false);
        setPostToEdit(null);
    };

    const handleEditPost = (post) => {
        setPostToEdit(post);
        setIsCreateModalOpen(true);
    };

    const handleDeletePost = async (postId) => {
        if (!window.confirm(t('blog.post.confirm_delete') || 'Bạn có chắc chắn muốn xóa bài viết này?')) return;
        try {
            const res = await communityService.deletePost(postId);
            if (res.success) {
                toast.success(res.message || 'Đã xóa bài viết thành công!');
                setMergedFeed(prev => prev.filter(p => p.id !== postId));
                refetchUserStats();
            }
        } catch (error) {
            toast.error(error.message || t('common.error'));
        }
    };

    const handleLike = async (postId) => {
        if (!isAuthenticated) return toast.error(t('reviews.loginToDiscuss'));
        setMergedFeed(prev => prev.map(post => {
            if (post.id === postId) {
                const wasLiked = post.is_liked;
                return {
                    ...post,
                    is_liked: !wasLiked,
                    _count: {
                        ...post._count,
                        likes: Math.max(0, (post._count?.likes || 0) + (wasLiked ? -1 : 1))
                    }
                };
            }
            return post;
        }));
        try {
            await blogService.toggleLike(postId);
        } catch (error) {
            setMergedFeed(prev => prev.map(post => {
                if (post.id === postId) {
                    const wasLiked = post.is_liked;
                    return {
                        ...post,
                        is_liked: !wasLiked,
                        _count: {
                            ...post._count,
                            likes: (post._count?.likes || 0) + (wasLiked ? -1 : 1)
                        }
                    };
                }
                return post;
            }));
            toast.error(t('common.error'));
        }
    };

    const handleComment = async (postId, content, image_url, parentId = null) => {
        if (!isAuthenticated) return toast.error(t('reviews.loginToDiscuss'));
        if (!content.trim() && !image_url) return;
        try {
            const res = await communityService.addComment(postId, content, image_url, parentId);
            if (res.data) {
                if (!parentId) {
                    setMergedFeed(prev => prev.map(post => {
                        if (post.id === postId) {
                            return {
                                ...post,
                                _count: {
                                    ...post._count,
                                    comments: (post._count?.comments || 0) + 1
                                }
                            };
                        }
                        return post;
                    }));
                }
                toast.success(t('blog.create_post.comment_success') || 'Đã gửi bình luận!');
                return res.data;
            }
        } catch (error) {
            toast.error(t('common.error'));
        }
    };

    const handleToggleHide = async (postId) => {
        if (!isAuthenticated) return toast.error(t('reviews.loginToInteract'));
        try {
            const res = await blogService.toggleHide(postId);
            if (res.success) {
                toast.success(res.message);
                refetchBlogs();
                refetchUserStats();
            }
        } catch (error) {
            toast.error(error.response?.data?.error || t('common.error'));
        }
    };

    return (
        <div className="min-h-screen bg-transparent pt-6 md:pt-8 pb-16 animate-in fade-in duration-700 font-sans selection:bg-neon-green/30">
            <div className="max-w-[1300px] mx-auto px-6 md:px-12 xl:px-20">
                
                {/* Main 3-Column Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 relative">
                    
                    {/* LEFT SIDEBAR (25%) */}
                    <div className="hidden lg:block space-y-6 sticky top-24 h-fit">
                        {isAuthenticated && (
                            <div className="bg-white dark:bg-[#111114] rounded-[1.75rem] p-6 border border-gray-100 dark:border-white/5 shadow-sm text-center relative overflow-hidden group">
                                <div className="absolute top-0 left-0 w-full h-1.5 bg-neon-green"></div>
                                <div className="w-16 h-16 mx-auto mb-4 rounded-full overflow-hidden border-2 border-neon-green/20 group-hover:scale-110 transition-transform duration-500">
                                    <img 
                                        src={user?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'} 
                                        className="w-full h-full object-cover" 
                                        alt="profile"
                                    />
                                </div>
                                <h3 className="text-[14px] font-black text-gray-900 dark:text-white uppercase truncate px-2">{user?.full_name}</h3>
                                
                                <div className="mt-6 flex items-center justify-around border-t border-gray-50 dark:border-white/5 pt-6">
                                     <div className="text-center">
                                         <div className="text-[9px] font-black text-gray-400 uppercase mb-1">{t('blog.profile.posts')}</div>
                                         <div className="text-sm font-black text-gray-900 dark:text-white">
                                             {userStatsData?.pagination?.total || 0}
                                         </div>
                                     </div>
                                    <div className="h-6 w-px bg-gray-100 dark:bg-white/5"></div>
                                     <div className="text-center">
                                         <div className="text-[9px] font-black text-gray-400 uppercase mb-1">{t('blog.profile.joined')}</div>
                                         <div className="text-sm font-black text-neon-green">
                                             {user?.created_at ? `${(new Date(user.created_at).getMonth() + 1).toString().padStart(2, '0')}/${new Date(user.created_at).getFullYear()}` : '--/--'}
                                         </div>
                                     </div>
                                </div>
                            </div>
                        )}

                        <div className="bg-white dark:bg-[#111114] rounded-[1.75rem] p-3 border border-gray-100 dark:border-white/5 shadow-sm flex flex-col gap-0.5">
                            {[
                                { id: 'explorer', icon: LayoutDashboard, label: t('blog.nav.feed_explorer') },
                                { id: 'profile', icon: User, label: t('blog.nav.my_posts'), auth: true },
                                { id: 'saved', icon: Bookmark, label: t('blog.nav.saved'), auth: true },
                                { id: 'notif', icon: Bell, label: t('blog.nav.notifications'), auth: true }
                            ].map((item, idx) => (
                                <button 
                                    key={item.id} 
                                    onClick={() => {
                                        if (item.auth && !isAuthenticated) return toast.error(t('reviews.loginToInteract'));
                                        if (item.id === 'notif') {
                                            setIsNotifModalOpen(true);
                                        } else {
                                            setActiveTab(item.id);
                                        }
                                    }}
                                    className={`flex items-center gap-3.5 px-5 py-3 rounded-xl transition-all font-black text-[11px] uppercase ${
                                        activeTab === item.id 
                                        ? 'bg-neon-green text-black shadow-lg shadow-neon-green/10' 
                                        : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-neon-green'
                                    }`}
                                >
                                    <div className="flex items-center gap-3.5 flex-1">
                                        <item.icon className="w-4 h-4" />
                                        {item.label}
                                    </div>
                                    {item.id === 'notif' && unreadCount > 0 && (
                                        <span className="flex items-center justify-center min-w-[18px] h-[18px] bg-red-500 text-white rounded-full text-[9px] font-black px-1.5 animate-pulse shadow-lg shadow-red-500/50">
                                            {unreadCount > 9 ? '9+' : unreadCount}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* CENTER FEED (50%) */}
                    <div className="lg:col-span-2 space-y-4 md:space-y-6">
                        {/* Mobile Navigation (Categories) */}
                        <div className="lg:hidden flex items-center gap-2 overflow-x-auto pb-4 no-scrollbar px-1">
                            {[
                                { id: 'explorer', icon: LayoutDashboard, label: t('blog.nav.feed_explorer') },
                                { id: 'profile', icon: User, label: t('blog.nav.my_posts'), auth: true },
                                { id: 'saved', icon: Bookmark, label: t('blog.nav.saved'), auth: true },
                                { id: 'notif', icon: Bell, label: t('blog.nav.notifications'), auth: true }
                            ].filter(item => !item.auth || isAuthenticated).map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => {
                                        if (item.id === 'notif') setIsNotifModalOpen(true);
                                        else setActiveTab(item.id);
                                    }}
                                    className={`shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-full text-[11px] font-black uppercase transition-all ${
                                        activeTab === item.id 
                                        ? 'bg-neon-green text-black shadow-lg shadow-neon-green/20' 
                                        : 'bg-white dark:bg-[#111114] text-gray-500 border border-gray-100 dark:border-white/5 shadow-sm'
                                    }`}
                                >
                                    <item.icon className="w-3.5 h-3.5" />
                                    {item.label}
                                </button>
                            ))}
                        </div>

                        {/* Mobile Trending Events (Slider) */}
                        <div className="lg:hidden space-y-3">
                             <div className="flex items-center justify-between px-1">
                                <h3 className="text-[10px] md:text-[11px] font-black text-gray-900 dark:text-white uppercase flex items-center gap-2">
                                    <TrendingUp className="w-3.5 h-3.5 text-neon-green" />
                                    {t('blog.nav.trending_title') || 'Sự kiện thảo luận sôi nổi'}
                                </h3>
                             </div>
                             <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar px-1">
                                {trendingLoading ? (
                                    Array(3).fill(0).map((_, i) => (
                                        <div key={i} className="min-w-[180px] h-16 bg-white dark:bg-[#111114] rounded-2xl animate-pulse"></div>
                                    ))
                                ) : trendingEvents.length > 0 ? (
                                    trendingEvents.map(ev => (
                                        <Link 
                                            key={ev.id} 
                                            to={`/events/${ev.id}`}
                                            className="shrink-0 w-[200px] bg-white dark:bg-[#111114] p-2.5 rounded-2xl border border-gray-100 dark:border-white/5 flex items-center gap-3 shadow-sm hover:shadow-md transition-all"
                                        >
                                            <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0">
                                                <img src={ev.image_url} className="w-full h-full object-cover" alt="" />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-[11px] font-bold text-gray-900 dark:text-white truncate leading-tight">{ev.title}</div>
                                                <div className="text-[9px] font-bold text-neon-green mt-1 flex items-center gap-1.5">
                                                    <MessageSquare className="w-2.5 h-2.5" />
                                                    {ev.total_discussion} {t('blog.post.comments_count') || 'thảo luận'}
                                                </div>
                                            </div>
                                        </Link>
                                    ))
                                ) : (
                                    <div className="text-[11px] text-gray-500 italic px-1">Chưa có sự kiện sôi nổi</div>
                                )}
                             </div>
                        </div>

                        {/* Mobile Search Box */}
                        <div className="lg:hidden bg-white dark:bg-[#111114] rounded-2xl p-3 md:p-4 border border-gray-100 dark:border-white/5">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input 
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder={t('blog.quick_post.placeholder_search') || 'Tìm kiếm bài viết...'}
                                    className="w-full pl-11 pr-4 py-2.5 md:py-3 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl text-[12px] focus:ring-1 focus:ring-neon-green outline-none transition-all"
                                />
                            </div>
                        </div>

                        {/* Quick Post Box */}
                        <div className="bg-white dark:bg-[#111114] rounded-2xl md:rounded-[1.75rem] p-4 md:p-6 shadow-sm border border-gray-100 dark:border-white/5 transition-all">
                            <div className="flex items-center gap-3 md:gap-4">
                                <div className="w-9 h-9 md:w-11 md:h-11 rounded-full overflow-hidden border border-gray-100 dark:border-white/10 flex-shrink-0">
                                    <img 
                                        src={user?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'} 
                                        className="w-full h-full object-cover"
                                        alt="avatar"
                                    />
                                </div>
                                <button 
                                    onClick={() => isAuthenticated ? setIsCreateModalOpen(true) : toast.error(t('reviews.loginToDiscuss'))}
                                    className="flex-1 h-9 md:h-11 border border-gray-300 dark:border-white/10 bg-gray-100 dark:bg-white/[0.03] hover:bg-gray-100 dark:hover:bg-white/[0.06] rounded-xl px-4 md:px-5 text-left text-gray-500 text-[12px] md:text-[13px] font-medium transition-all"
                                >
                                    {isAuthenticated 
                                        ? t('blog.quick_post.placeholder', { name: user?.full_name?.split(' ').pop() }) 
                                        : t('blog.quick_post.login_required')}
                                </button>
                            </div>
                        </div>

                        {/* Feed List Container */}
                        <div className="space-y-6 min-h-[400px]">
                            {(blogLoading && page === 1) || (communityLoading && page === 1) ? (
                                <div className="space-y-6">
                                    {Array(3).fill(0).map((_, i) => (
                                        <div key={i} className="h-60 bg-white dark:bg-[#111114] rounded-[1.75rem] animate-pulse"></div>
                                    ))}
                                </div>
                            ) : mergedFeed.length > 0 ? (
                                <>
                                    <div className="space-y-6">
                                        {mergedFeed.map((post) => (
                                            <UnifiedPostCard 
                                                key={`${post.type}-${post.id}-${post.created_at}`} 
                                                post={post} 
                                                isOfficial={post.type === 'official'}
                                                isAuthenticated={isAuthenticated}
                                                currentUser={user}
                                                onLike={() => handleLike(post.id)}
                                                onComment={(content, imageUrl, parentId) => handleComment(post.id, content, imageUrl, parentId)}
                                                onStatusChange={() => handleToggleHide(post.id)}
                                                onEdit={handleEditPost}
                                                onDelete={handleDeletePost}
                                                variant={activeTab === 'discussion' ? 'discussion' : 'standard'}
                                            />
                                        ))}
                                    </div>

                                    {hasMore && !blogLoading && !communityLoading && (
                                        <button 
                                            onClick={() => setPage(p => p + 1)}
                                            className="w-full py-4 mt-6 bg-white dark:bg-[#111114] border border-gray-100 dark:border-white/5 rounded-2xl text-[11px] font-black uppercase text-gray-400 hover:text-neon-green transition-all"
                                        >
                                            {t('common.loadMore') || 'Xem thêm bảng tin'} <ArrowRight className="inline-block w-4 h-4 ml-2" />
                                        </button>
                                    )}
                                </>
                            ) : (
                                <div className="text-center py-24 bg-white dark:bg-[#111114] rounded-[1.75rem] border border-dashed border-gray-100 dark:border-white/10">
                                    <Users className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                                    <h4 className="text-[12px] font-black text-gray-400 uppercase">{t('blog.nav.no_posts_yet') || 'Chưa có bài viết nào'}</h4>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT SIDEBAR (25%) */}
                    <div className="hidden lg:block space-y-6 sticky top-24 h-fit">
                        {/* Custom Search Box */}
                        <div className="bg-white dark:bg-[#111114] rounded-[1.75rem] p-5 border border-gray-100 dark:border-white/5 shadow-sm">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input 
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder={t('blog.quick_post.placeholder_search') || 'Tìm kiếm bài viết...'}
                                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl text-[12px] font-medium focus:ring-2 focus:ring-neon-green/20 focus:border-neon-green/50 outline-none transition-all"
                                />
                            </div>
                        </div>

                        {/* Trending/Recommended Events Section */}
                        <div className="bg-white dark:bg-[#111114] rounded-[1.75rem] p-6 border border-gray-100 dark:border-white/5 shadow-sm">
                            <h3 className="text-[11px] font-black text-gray-900 dark:text-white uppercase mb-6 flex items-center gap-2.5">
                                <TrendingUp className="w-4 h-4 text-neon-green" />
                                {t('blog.nav.trending_title') || 'Sự kiện đang thảo luận'}
                            </h3>
                            <div className="space-y-5">
                                {trendingLoading ? (
                                    <div className="space-y-4">
                                        {[1,2,3].map(n => (
                                            <div key={n} className="animate-pulse flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gray-100 dark:bg-white/5 rounded-lg"></div>
                                                <div className="flex-1 space-y-2">
                                                    <div className="h-3 bg-gray-100 dark:bg-white/5 rounded w-3/4"></div>
                                                    <div className="h-2 bg-gray-100 dark:bg-white/5 rounded w-1/2"></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : trendingEvents.length > 0 ? (
                                    trendingEvents.map((ev) => (
                                        <Link 
                                            key={ev.id} 
                                            to={`/events/${ev.id}`}
                                            className="flex items-center gap-3 group cursor-pointer"
                                        >
                                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 shrink-0">
                                                <img src={ev.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="event" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-[12px] font-bold text-gray-900 dark:text-white group-hover:text-neon-green transition-colors truncate">
                                                    {ev.title}
                                                </div>
                                                <div className="text-[9px] font-bold text-gray-400 uppercase mt-0.5 flex items-center gap-2">
                                                    <MessageSquare className="w-2.5 h-2.5 text-neon-green" />
                                                    <span className="text-neon-green">{ev.total_discussion} {t('blog.post.comments_count') || 'thảo luận'}</span>
                                                    <span className="opacity-50">•</span>
                                                    <span>{ev.blog_count} {t('blog.profile.posts') || 'bài viết'}</span>
                                                </div>
                                            </div>
                                            <ArrowRight className="w-3 h-3 text-gray-300 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                                        </Link>
                                    ))
                                ) : (
                                    <div className="text-[11px] font-medium text-gray-400 italic">
                                        Chưa có sự kiện nổi bật
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer Links */}
                        <div className="px-6 flex flex-wrap gap-x-4 gap-y-2 opacity-60">
                            {['Điều khoản', 'Bảo mật', 'Cookies', 'BASTICKET © 2026'].map((link, idx) => (
                                <span key={idx} className="text-[9px] font-black text-gray-400 uppercase cursor-pointer hover:text-neon-green">
                                    {link}
                                </span>
                            ))}
                        </div>
                    </div>

                </div>
            </div>

            {/* Modals */}
            {isCreateModalOpen && (
                <CreatePostModal 
                    onClose={() => {
                        setIsCreateModalOpen(false);
                        setPostToEdit(null);
                    }}
                    onSuccess={handlePostSaved}
                    postToEdit={postToEdit}
                />
            )}
            <NotificationsModal 
                isOpen={isNotifModalOpen}
                onClose={() => setIsNotifModalOpen(false)}
            />
        </div>
    );
};

export default Blog;

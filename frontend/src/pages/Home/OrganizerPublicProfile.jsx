import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { 
  ArrowLeft, 
  Calendar, 
  Ticket, 
  CheckCircle2, 
  Mail, 
  Phone, 
  Globe, 
  Sparkles, 
  ChevronRight, 
  MessageSquare, 
  History 
} from 'lucide-react';
import { organizerService } from '../../services/organizer.service';
import blogService from '../../services/blog.service';
import { format } from 'date-fns';
import { vi, enUS } from 'date-fns/locale';

const OrganizerPublicProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'vi' ? vi : enUS;
  const [activeTab, setActiveTab] = useState('upcoming');

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['organizer-public-profile', id],
    queryFn: () => organizerService.getPublicProfile(id),
  });

  const organizer = profile?.data;

  const { data: allBlogs, isLoading: isBlogsLoading } = useQuery({
    queryKey: ['public-blogs'],
    queryFn: () => blogService.getPublicBlogs(),
  });

  const organizerBlogs = useMemo(() => {
    if (!allBlogs?.data || !organizer?.user_id) return [];
    return allBlogs.data.filter(b => b.author_id === organizer.user_id);
  }, [allBlogs?.data, organizer?.user_id]);

  const formattedJoinDate = useMemo(() => {
    if (!organizer?.user?.created_at) return '---';
    return format(new Date(organizer.user.created_at), 'MMMM yyyy', { locale });
  }, [organizer?.user?.created_at, locale]);

  const { upcomingEvents, pastEvents } = useMemo(() => {
    const all = organizer?.events || [];
    const now = new Date();
    // Reset hours to compare only dates for a "today is still upcoming" feel
    now.setHours(0, 0, 0, 0);

    return {
      upcomingEvents: all.filter(e => {
        if (!e.event_date) return false;
        const eDate = new Date(e.event_date);
        return eDate >= now && e.status !== 'cancelled';
      }),
      pastEvents: all.filter(e => {
        if (!e.event_date) return true; // If no date, assume past for safety or filter out
        const eDate = new Date(e.event_date);
        return eDate < now;
      })
    };
  }, [organizer?.events]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0a0a0c] flex items-center justify-center">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-neon-green/20 border-t-neon-green rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 bg-neon-green/10 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !organizer) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0a0a0c] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
          <History className="w-12 h-12 text-red-500" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 uppercase">
          {t('publicOrganizer.notFound', 'Organizer not found')}
        </h2>
        <button 
          onClick={() => navigate('/')} 
          className="px-8 py-4 bg-neon-green text-black font-bold uppercase text-sm rounded-2xl hover:scale-105 transition-transform"
        >
          {t('common.backHome', 'Về trang chủ')}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0c] transition-colors duration-500">
      {/* 🧭 NAVIGATION BREADCRUMB */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 pt-8 pb-6 flex items-center justify-between">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:hover:text-white font-medium text-xs sm:text-[15px] transition-all group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> {t('common.back', 'Back')}
        </button>
      </div>

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 pb-20">
        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* 📋 SIDEBAR: ORGANIZER PROFILE CARD */}
          <aside className="w-full lg:w-[350px] shrink-0 space-y-6">
            <div className="bg-white dark:bg-[#111114] rounded-3xl border border-gray-100 dark:border-white/5 p-6 shadow-sm">
              <div className="flex flex-col items-center text-center">
                {/* Avatar area */}
                <div className="relative mb-6">
                  <div className="p-1 rounded-full bg-gradient-to-tr from-neon-green/40 to-blue-500/40">
                    <img 
                      src={organizer.user?.avatar_url || `https://ui-avatars.com/api/?name=${organizer.organization_name}&background=111&color=fff&size=200`}
                      className="w-32 h-32 rounded-full object-cover border-4 border-white dark:border-[#111114]"
                      alt={organizer.organization_name}
                    />
                  </div>
                  {organizer.is_verified && (
                    <div className="absolute bottom-1 right-1 w-8 h-8 bg-blue-500 rounded-full border-2 border-white dark:border-[#111114] flex items-center justify-center shadow-lg" title="Verified Organizer">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>

                <h1 className="text-xl font-black text-gray-900 dark:text-white mb-2 leading-tight">
                  {organizer.organization_name}
                </h1>

                {formattedJoinDate !== '---' && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 dark:bg-white/5 rounded-full mb-6">
                    <span className="text-[10px] font-bold text-gray-400 leading-none">
                      {t('publicOrganizer.joinedSince', 'Since')} {formattedJoinDate}
                    </span>
                  </div>
                )}

                <button className="w-full py-3.5 bg-neon-green hover:bg-neon-hover text-black font-black uppercase text-[11px] rounded-2xl transition-all shadow-lg shadow-neon-green/10 active:scale-95 mb-4">
                  {t('publicOrganizer.follow', 'Follow Organizer')}
                </button>

                {/* Compact Stats */}
                <div className="w-full grid grid-cols-2 gap-px bg-gray-100 dark:bg-white/10 border border-gray-100 dark:border-white/10 rounded-2xl overflow-hidden">
                  <div className="bg-white dark:bg-[#111114] p-3">
                    <p className="text-[9px] font-black text-gray-400 uppercase mb-0.5">{t('publicOrganizer.totalEvents', 'Events')}</p>
                    <p className="text-base font-bold text-gray-900 dark:text-white">{organizer.events?.length || 0}</p>
                  </div>
                  <div className="bg-white dark:bg-[#111114] p-3 text-center">
                    <p className="text-[9px] font-black text-gray-400 uppercase mb-0.5">{t('publicOrganizer.status', 'Status')}</p>
                    <p className="text-[10px] font-bold text-neon-green ">{t('publicOrganizer.activeStatus', 'Active')}</p>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="mt-6 pt-6 border-t border-gray-50 dark:border-white/5 space-y-4">
                <h3 className="text-[10px] font-black text-gray-400 uppercase">{t('publicOrganizer.contactInfo', 'Contact Information')}</h3>
                <div className="space-y-3">
                   {organizer.user?.email && (
                     <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                        <Mail className="w-4 h-4 text-neon-green shrink-0" />
                        <span className="text-xs font-semibold truncate" title={organizer.user.email}>{organizer.user.email}</span>
                     </div>
                   )}
                   {organizer.user?.phone_number && (
                     <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                        <Phone className="w-4 h-4 text-neon-green shrink-0" />
                        <span className="text-xs font-semibold">{organizer.user.phone_number}</span>
                     </div>
                   )}
                   <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                      <Globe className="w-4 h-4 text-neon-green shrink-0" />
                      <span className="text-xs font-semibold">{organizer.website_url || 'basticket.vn'}</span>
                   </div>
                </div>
              </div>

              {/* About Bio */}
              <div className="mt-6 pt-6 border-t border-gray-50 dark:border-white/5">
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-[10px] font-black text-gray-400 uppercase">{t('publicOrganizer.about', 'About Us')}</h3>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                  {organizer.description || t('publicOrganizer.noDescription', "No detailed description provided.")}
                </p>
              </div>
            </div>
          </aside>

          {/* 📅 MAIN CONTENT: EVENT FEED */}
          <div className="flex-1 space-y-6">
            <div className="bg-white dark:bg-[#111114] rounded-3xl border border-gray-100 dark:border-white/5 p-4 sm:p-6 shadow-sm">
              {/* Tab Navigation */}
              <nav className="flex items-center gap-1 sm:gap-4 border-b border-gray-50 dark:border-white/5 mb-8">
                 <button 
                   onClick={() => setActiveTab('upcoming')}
                   className={`relative pb-4 px-2 text-xs font-bold uppercase transition-all ${activeTab === 'upcoming' ? 'text-neon-green' : 'text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                 >
                   {t('publicOrganizer.upcomingEvents', 'Upcoming')}
                   {activeTab === 'upcoming' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-neon-green rounded-full"></div>}
                 </button>
                 <button 
                   onClick={() => setActiveTab('past')}
                   className={`relative pb-4 px-2 text-xs font-bold uppercase transition-all ${activeTab === 'past' ? 'text-neon-green' : 'text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                 >
                   {t('publicOrganizer.pastEvents', 'Past')}
                   {activeTab === 'past' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-neon-green rounded-full"></div>}
                 </button>
                 <button 
                   onClick={() => setActiveTab('blog')}
                   className={`relative pb-4 px-2 text-xs font-bold uppercase transition-all ${activeTab === 'blog' ? 'text-neon-green' : 'text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                 >
                   {t('publicOrganizer.blog', 'Connect')}
                   {activeTab === 'blog' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-neon-green rounded-full"></div>}
                 </button>
              </nav>

              {/* Grid Content */}
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {activeTab === 'upcoming' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                    {upcomingEvents.length > 0 ? (
                      upcomingEvents.map(event => (
                        <EventCard key={event.id} event={event} t={t} />
                      ))
                    ) : (
                      <EmptyState icon={Ticket} message={t('publicOrganizer.noUpcomingEvents', 'No active events')} />
                    )}
                  </div>
                )}

                {activeTab === 'past' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                    {pastEvents.length > 0 ? (
                      pastEvents.map(event => (
                        <EventCard key={event.id} event={event} t={t} isPast />
                      ))
                    ) : (
                      <EmptyState icon={History} message={t('publicOrganizer.noPastEvents', 'No past events found')} />
                    )}
                  </div>
                )}

                {activeTab === 'blog' && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {organizerBlogs.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {organizerBlogs.map(blog => (
                          <BlogCard key={blog.id} blog={blog} t={t} />
                        ))}
                      </div>
                    ) : (
                      <div className="py-20 text-center px-4 bg-gray-50/50 dark:bg-white/[0.01] rounded-3xl border border-dashed border-gray-100 dark:border-white/5">
                        <MessageSquare className="w-12 h-12 text-gray-200 dark:text-white/10 mx-auto mb-4" />
                        <h4 className="text-base font-bold text-gray-900 dark:text-white uppercase mb-2">
                           {t('publicOrganizer.noContentTitle', 'No Posts Yet')}
                        </h4>
                        <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
                          {t('publicOrganizer.noBlogContent', 'This organizer has not posted any blogs or community updates yet. Check back soon for future announcements!')}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const EventCard = ({ event, t, isPast = false }) => (
  <Link 
    to={`/events/${event.id}`}
    className="flex flex-col bg-white dark:bg-[#111114] rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 hover:border-neon-green/30"
  >
     <div className="h-40 relative">
        <img 
          src={event.image_url || 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?q=80&w=800'} 
          className="w-full h-full object-cover"
          alt={event.title}
        />
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
           <span className="px-2 py-0.5 bg-neon-green text-black text-[8px] font-black rounded shadow-sm">
             {event.category?.name}
           </span>
           {isPast && (
             <span className="px-2 py-0.5 bg-black/60 text-white text-[8px] font-black rounded backdrop-blur-sm border border-white/20">
               {t('common.ended', 'Ended')}
             </span>
           )}
        </div>
     </div>
     
     <div className="p-4 flex-1 flex flex-col">
        <h4 className="text-sm font-bold text-gray-900 dark:text-white leading-tight mb-2 line-clamp-2 uppercase">
          {event.title}
        </h4>
        <div className="mt-auto flex items-center gap-2 text-gray-500">
          <Calendar className="w-3.5 h-3.5 text-neon-green" />
          <span className="text-[10px] font-bold uppercase">
            {event.event_date ? format(new Date(event.event_date), 'dd/MM/yyyy') : '---'}
          </span>
        </div>
        <div className="mt-4 pt-3 border-t dark:border-gray-50 border-gray-200 dark:border-white/5 flex items-center justify-between">
           <span className="text-[12px] font-bold dark:text-gray-400 text-black">{t('common.viewDetails', 'View More')}</span>
           <ChevronRight className="w-3.5 h-3.5 text-neon-green" />
        </div>
     </div>
  </Link>
);

const BlogCard = ({ blog, t }) => (
  <Link 
    to={`/blog/${blog.slug}`}
    className="group flex flex-col bg-white dark:bg-[#111114] rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden shadow-sm hover:shadow-md transition-all h-full"
  >
    <div className="h-48 overflow-hidden relative">
      <img 
        src={blog.image_url || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30'} 
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        alt={blog.title}
      />
      <div className="absolute top-4 left-4">
        <span className="px-2 py-0.5 bg-black/60 text-white text-[9px] font-black rounded backdrop-blur-sm border border-white/20">
          {blog.category || 'Announcement'}
        </span>
      </div>
    </div>
    <div className="p-5 flex-1 flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] text-gray-400 font-bold uppercase">
          {blog.created_at ? format(new Date(blog.created_at), 'dd MMM yyyy') : '---'}
        </span>
      </div>
      <h3 className="text-sm font-black text-gray-900 dark:text-white mb-3 line-clamp-2 uppercase leading-tight group-hover:text-neon-green transition-colors">
        {blog.title}
      </h3>
      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-3 mb-6 leading-relaxed">
        {blog.excerpt || (blog.content && blog.content.substring(0, 120) + '...')}
      </p>
      <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-100 dark:border-white/10">
        <span className="text-[12px] font-bold dark:text-gray-400 group-hover:text-neon-green transition-colors text-black">
          {t('publicOrganizer.viewPost', 'Read More')}
        </span>
        <ChevronRight className="w-4 h-4 text-neon-green group-hover:translate-x-1 transition-transform" />
      </div>
    </div>
  </Link>
);

const EmptyState = ({ icon: Icon, message }) => (
  <div className="col-span-full py-20 text-center bg-gray-50/50 dark:bg-white/[0.01] border-2 border-dashed border-gray-100 dark:border-white/5 rounded-3xl">
     <Icon className="w-10 h-10 text-gray-200 dark:text-white/10 mx-auto mb-4" />
     <p className="text-gray-400 font-bold uppercase text-[10px] px-4">
       {message}
     </p>
  </div>
);

export default OrganizerPublicProfile;

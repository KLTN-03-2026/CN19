import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  Users, 
  Ticket, 
  CheckCircle2, 
  ExternalLink,
  Mail,
  Phone,
  Globe,
  Verified,
  Sparkles,
  TrendingUp,
  ChevronRight,
  Clock,
  MessageSquare,
  History
} from 'lucide-react';
import { organizerService } from '../../services/organizer.service';
import { format } from 'date-fns';
import { vi, enUS } from 'date-fns/locale';

const OrganizerPublicProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'vi' ? vi : enUS;
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' | 'past' | 'blog'

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['organizer-public-profile', id],
    queryFn: () => organizerService.getPublicProfile(id),
  });

  const organizer = profile?.data;

  const formattedJoinDate = useMemo(() => {
    if (!organizer?.user?.created_at) return '---';
    return format(new Date(organizer.user.created_at), 'MMMM yyyy', { locale });
  }, [organizer?.user?.created_at, locale]);

  const { upcomingEvents, pastEvents } = useMemo(() => {
    const all = organizer?.events || [];
    return {
      upcomingEvents: all.filter(e => e.status === 'active'),
      pastEvents: all.filter(e => e.status === 'completed')
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
          <Users className="w-12 h-12 text-red-500" />
        </div>
        <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-4 uppercase tracking-tighter">
          {t('publicOrganizer.notFound', 'Organizer not found')}
        </h2>
        <button 
          onClick={() => navigate('/')} 
          className="px-8 py-4 bg-neon-green text-black font-black uppercase text-sm tracking-widest rounded-2xl hover:scale-105 transition-transform"
        >
          {t('common.backHome', 'Về trang chủ')}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0c] transition-colors duration-500">
      {/* 🎭 HERO HEADER */}
      <section className="relative h-[40vh] min-h-[400px] overflow-hidden">
        {/* Background Ambient Effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-gray-900/90 to-white dark:to-[#0a0a0c]">
           <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
           <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-neon-green/20 rounded-full blur-[120px] animate-pulse-slow"></div>
           <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px]"></div>
        </div>

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
           <h1 className="text-[15vw] font-black text-white/[0.03] uppercase tracking-tighter select-none whitespace-nowrap">
             {organizer.organization_name}
           </h1>
        </div>

        {/* Navigation Overlays */}
        <div className="absolute top-8 left-8 z-20">
           <button 
             onClick={() => navigate(-1)}
             className="flex items-center gap-3 px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/10 rounded-2xl text-white font-bold text-xs uppercase tracking-widest transition-all group"
           >
             <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> {t('common.back', 'Quay lại')}
           </button>
        </div>
      </section>

      {/* 👤 ORGANIZER CONTENT */}
      <section className="max-w-[1200px] mx-auto px-6 -mt-32 relative z-10 pb-32">
        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* Top Section: Profile Card */}
          <div className="flex-1">
             <div className="bg-white dark:bg-[#111114] rounded-[2.5rem] border border-gray-200 dark:border-white/10 p-8 md:p-10 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-neon-green/5 rounded-full blur-[80px] group-hover:bg-neon-green/10 transition-colors"></div>
                
                <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-center md:items-start relative z-10">
                  <div className="shrink-0">
                     <div className="inline-block p-2 rounded-full border-2 border-dashed border-neon-green/30 relative">
                       <img 
                         src={organizer.user?.avatar_url || `https://ui-avatars.com/api/?name=${organizer.organization_name}&background=111&color=fff&size=200`}
                         className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover shadow-2xl transition-transform duration-500 group-hover:scale-105"
                         alt={organizer.organization_name}
                       />
                       {organizer.is_verified && (
                         <div className="absolute bottom-2 right-2 w-8 h-8 md:w-10 md:h-10 bg-blue-500 rounded-full border-4 border-white dark:border-[#111114] flex items-center justify-center shadow-lg">
                           <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-white" />
                         </div>
                       )}
                     </div>
                  </div>

                  <div className="flex-1 text-center md:text-left pt-2">
                     <div className="mb-6">
                        <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">
                          {organizer.organization_name}
                        </h2>
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 dark:bg-white/5 rounded-full mt-3">
                           <Calendar className="w-3 h-3 text-neon-green" />
                           <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-none pt-0.5">
                             {t('publicOrganizer.joinedSince', 'Joined since')} {formattedJoinDate}
                           </span>
                        </div>
                     </div>

                     <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <div className="bg-gray-50 dark:bg-white/[0.04] p-4 rounded-2xl">
                           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t('publicOrganizer.totalEvents', 'EVENTS')}</p>
                           <p className="text-xl font-black text-gray-900 dark:text-white">
                             {organizer.events?.length || 0}
                           </p>
                        </div>
                        <div className="bg-gray-50 dark:bg-white/[0.04] p-4 rounded-2xl">
                           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t('publicOrganizer.status', 'STATUS')}</p>
                           <p className="text-[11px] font-black text-neon-green uppercase">
                             {t('publicOrganizer.activeStatus', 'Active')}
                           </p>
                        </div>
                        {organizer.user?.email && (
                          <div className="col-span-1 lg:col-span-2 bg-gray-50 dark:bg-white/[0.04] p-4 rounded-2xl flex items-center gap-3 overflow-hidden">
                             <Mail className="w-4 h-4 text-neon-green shrink-0" />
                             <span className="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase truncate tracking-tight">{organizer.user.email}</span>
                          </div>
                        )}
                     </div>

                     <div className="flex flex-col sm:flex-row items-center gap-4">
                        <button className="w-full sm:w-auto px-8 py-4 bg-neon-green text-black font-black uppercase text-xs tracking-widest rounded-2xl transition-all shadow-[0_10px_30px_rgba(82,196,45,0.3)] hover:scale-105 active:scale-95">
                           {t('publicOrganizer.follow', 'Follow Now')}
                        </button>
                        {organizer.user?.phone_number && (
                           <div className="flex items-center gap-3 px-6 py-4 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl">
                              <Phone className="w-4 h-4 text-neon-green" />
                              <span className="text-sm font-bold text-gray-900 dark:text-white">{organizer.user.phone_number}</span>
                           </div>
                        )}
                     </div>
                  </div>
                </div>
             </div>
          </div>

          {/* About Section */}
          <div className="w-full lg:w-[400px] shrink-0">
             <div className="bg-white dark:bg-[#111114] rounded-[2.5rem] border border-gray-200 dark:border-white/10 p-10 shadow-xl overflow-hidden relative group h-full"> 
                <div className="absolute top-0 right-12 w-24 h-1 bg-neon-green opacity-50"></div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-8 flex items-center gap-3">
                   <Sparkles className="w-6 h-6 text-neon-green" /> {t('publicOrganizer.about', 'About the organizer')}
                </h3>
                <div className="text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
                   {organizer.description || t('publicOrganizer.noDescription', "This organizer hasn't updated their detailed introduction yet.")}
                </div>
             </div>
          </div>
        </div>

        {/* 📅 Tabbed Content Section */}
        <div className="mt-16 pt-12 border-t border-gray-100 dark:border-white/5">
           
           {/* Tab Navigation */}
           <div className="flex flex-wrap items-center justify-center gap-2 mb-16 p-2 bg-gray-100/50 dark:bg-white/[0.03] backdrop-blur-md rounded-[2rem] max-w-2xl mx-auto border border-gray-200 dark:border-white/5">
              <button 
                onClick={() => setActiveTab('upcoming')}
                className={`flex items-center gap-3 px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${activeTab === 'upcoming' ? 'bg-neon-green text-black shadow-lg shadow-neon-green/20 scale-105' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/5'}`}
              >
                 <TrendingUp className="w-4 h-4" /> {t('publicOrganizer.upcomingEvents', 'Upcoming Events')}
              </button>
              <button 
                onClick={() => setActiveTab('past')}
                className={`flex items-center gap-3 px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${activeTab === 'past' ? 'bg-neon-green text-black shadow-lg shadow-neon-green/20 scale-105' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/5'}`}
              >
                 <History className="w-4 h-4" /> {t('publicOrganizer.pastEvents', 'Past Events')}
              </button>
              <button 
                onClick={() => setActiveTab('blog')}
                className={`flex items-center gap-3 px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${activeTab === 'blog' ? 'bg-neon-green text-black shadow-lg shadow-neon-green/20 scale-105' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/5'}`}
              >
                 <MessageSquare className="w-4 h-4" /> {t('publicOrganizer.blog', 'Blog')}
              </button>
           </div>

           {/* Tab Content Rendering */}
           <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
              {activeTab === 'upcoming' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                   {upcomingEvents.length > 0 ? (
                     upcomingEvents.map(event => (
                       <EventCard key={event.id} event={event} t={t} />
                     ))
                   ) : (
                     <EmptyState 
                       icon={Ticket} 
                       message={t('publicOrganizer.noUpcomingEvents', 'No upcoming events from this organizer')} 
                     />
                   )}
                </div>
              )}

              {activeTab === 'past' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                   {pastEvents.length > 0 ? (
                     pastEvents.map(event => (
                       <EventCard key={event.id} event={event} t={t} isPast />
                     ))
                   ) : (
                     <EmptyState 
                       icon={History} 
                       message={t('publicOrganizer.noPastEvents', 'No past events from this organizer')} 
                     />
                   )}
                </div>
              )}

              {activeTab === 'blog' && (
                <div className="max-w-4xl mx-auto py-20 text-center bg-gray-50/50 dark:bg-white/[0.02] border-2 border-dashed border-gray-200 dark:border-white/10 rounded-[3rem] px-10">
                   <div className="w-24 h-24 bg-neon-green/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-neon-green/20">
                      <MessageSquare className="w-10 h-10 text-neon-green" />
                   </div>
                   <h4 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-4">
                      {t('publicOrganizer.blogTitle', 'Experience Journal & Reviews')}
                   </h4>
                   <p className="text-gray-500 dark:text-gray-400 max-w-lg mx-auto leading-relaxed font-medium">
                      {t('publicOrganizer.blogPlaceholder', 'Blog is where customers share moments and reviews after attending events. This feature will be launched soon to connect the event-loving community!')}
                   </p>
                </div>
              )}
           </div>
        </div>
      </section>
    </div>
  );
};

const EventCard = ({ event, t, isPast = false }) => (
  <Link 
    to={`/events/${event.id}`}
    className={`group bg-white dark:bg-[#111114] rounded-[2rem] border border-gray-200 dark:border-white/5 overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 flex flex-col ${isPast ? 'opacity-80 hover:opacity-100' : ''}`}
  >
     <div className="h-48 relative overflow-hidden">
        <img 
          src={event.image_url || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=800&auto=format&fit=crop'} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          alt={event.title}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        <div className="absolute top-4 left-4 flex flex-col gap-2">
           <div className="px-3 py-1 bg-neon-green/90 backdrop-blur-md rounded-lg text-black text-[9px] font-black uppercase tracking-widest">
             {event.category?.name}
           </div>
           {isPast && (
             <div className="px-3 py-1 bg-black/60 backdrop-blur-md rounded-lg text-white text-[9px] font-black uppercase tracking-widest border border-white/20">
               {t('common.ended', 'Đã kết thúc')}
             </div>
           )}
        </div>
     </div>
     
     <div className="p-6 flex-1 flex flex-col justify-between">
        <div>
           <h4 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight group-hover:text-neon-green transition-colors mb-4 line-clamp-1">
             {event.title}
           </h4>
           <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
              <Calendar className="w-4 h-4 text-neon-green" />
              <span className="text-xs font-bold uppercase tracking-widest">
                {event.event_date ? format(new Date(event.event_date), 'dd/MM/yyyy') : '---'}
              </span>
           </div>
        </div>
        
        <div className="mt-6 pt-6 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
           <button className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-1 group-hover:gap-2 transition-all">
              {t('common.viewDetails', 'Xem chi tiết')} <ChevronRight className="w-3 h-3 text-neon-green" />
           </button>
           <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-white/5 flex items-center justify-center">
              <Ticket className="w-4 h-4 text-gray-400 group-hover:text-neon-green transition-colors" />
           </div>
        </div>
     </div>
  </Link>
);

const EmptyState = ({ icon: Icon, message }) => (
  <div className="col-span-full py-24 text-center bg-gray-50 dark:bg-white/[0.02] border-2 border-dashed border-gray-200 dark:border-white/10 rounded-[2.5rem]">
     <Icon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
     <p className="text-gray-400 font-bold uppercase tracking-widest text-sm text-balance px-4">
       {message}
     </p>
  </div>
);

export default OrganizerPublicProfile;

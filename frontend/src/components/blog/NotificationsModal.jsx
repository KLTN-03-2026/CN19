import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, MessageCircle, Heart, Star, Info, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow } from 'date-fns';
import { vi, enUS } from 'date-fns/locale';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '../../services/user.service';
import { useNavigate } from 'react-router-dom';

const NotificationsModal = ({ isOpen, onClose }) => {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: notifData, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => userService.getNotifications(),
    enabled: isOpen
  });

  const markReadMutation = useMutation({
    mutationFn: (id) => userService.markNotificationAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
    }
  });

  // Cơ chế trích xuất dữ liệu linh hoạt: kiểm tra cả notifData.data và notifData là mảng
  const notifications = Array.isArray(notifData) 
    ? notifData 
    : (notifData?.data && Array.isArray(notifData.data) ? notifData.data : []);

  const getIcon = (type) => {
    switch (type) {
      case 'comment': return <MessageCircle className="w-4 h-4 text-blue-500" />;
      case 'like': return <Heart className="w-4 h-4 text-red-500" />;
      case 'review': return <Star className="w-4 h-4 text-yellow-500" />;
      case 'system': return <Info className="w-4 h-4 text-neon-green" />;
      default: return <Bell className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] transition-opacity"
            onClick={onClose}
          />
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md bg-white dark:bg-[#111114] rounded-[2rem] shadow-2xl overflow-hidden border border-gray-100 dark:border-white/10 pointer-events-auto"
            >
              <div className="p-6 border-b border-gray-50 dark:border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-neon-green/10 flex items-center justify-center">
                    <Bell className="w-5 h-5 text-neon-green" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">
                      {t('blog.nav.notifications')}
                    </h3>
                    <div className="flex items-center gap-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        {notifications.length} {t('common.updates') || 'Cập nhật'}
                        </p>
                        <button 
                            onClick={() => queryClient.invalidateQueries(['notifications'])}
                            className="text-[9px] font-black text-neon-green hover:underline uppercase tracking-tighter"
                        >
                            [ Làm mới ]
                        </button>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={onClose}
                  className="w-10 h-10 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 flex items-center justify-center text-gray-400 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="max-h-[60vh] overflow-y-auto p-4 space-y-2 custom-scrollbar">
                {isLoading ? (
                  <div className="py-20 flex flex-col items-center justify-center gap-4">
                    <div className="w-8 h-8 border-4 border-neon-green/30 border-t-neon-green rounded-full animate-spin"></div>
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest animate-pulse">
                      {t('common.loading')}
                    </span>
                  </div>
                ) : notifications.length > 0 ? (
                  notifications.map((notif) => (
                    <div 
                      key={notif.id}
                      onClick={() => {
                        if (!notif.is_read) markReadMutation.mutate(notif.id);
                        console.log('[DEBUG NOTIF] Clicked Notification:', notif);
                        const targetSlug = notif.blog?.slug || notif.target_id;
                        console.log('[DEBUG NOTIF] Calculated Slug:', targetSlug);
                        if (targetSlug) {
                          navigate(`/blog/${targetSlug}`);
                          onClose();
                        } else {
                          console.warn('[DEBUG NOTIF] No target slug found for navigation.');
                        }
                      }}
                      className={`group p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                        notif.is_read 
                        ? 'bg-transparent border-gray-50 dark:border-white/5 opacity-70' 
                        : 'bg-neon-green/[0.02] border-neon-green/10 shadow-sm'
                      }`}
                    >
                      {!notif.is_read && (
                        <div className="absolute top-0 left-0 w-1 h-full bg-neon-green"></div>
                      )}
                      
                      <div className="flex gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                          notif.is_read ? 'bg-gray-100 dark:bg-white/5' : 'bg-white dark:bg-white/10'
                        }`}>
                          {getIcon(notif.type)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-black text-gray-900 dark:text-white uppercase mb-1 flex items-center justify-between">
                            {notif.title}
                            <span className="text-[9px] font-bold text-gray-400 normal-case">
                              {formatDistanceToNow(new Date(notif.created_at), { 
                                addSuffix: true, 
                                locale: i18n.language === 'en' ? enUS : vi 
                              })}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium leading-normal">
                            {notif.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-20 flex flex-col items-center justify-center text-center px-10">
                    <div className="w-16 h-16 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center mb-4">
                      <Bell className="w-8 h-8 text-gray-300" />
                    </div>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-tight">
                      {t('common.no_data') || 'Không có thông báo'}
                    </p>
                  </div>
                )}
              </div>

              <div className="p-4 bg-gray-50/50 dark:bg-white/[0.02] border-t border-gray-50 dark:border-white/5">
                <button 
                  className="w-full py-3 rounded-xl border border-neon-green/20 text-neon-green font-black text-[11px] uppercase tracking-widest hover:bg-neon-green hover:text-black transition-all duration-500"
                  onClick={onClose}
                >
                  {t('common.close') || 'Đóng'}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NotificationsModal;

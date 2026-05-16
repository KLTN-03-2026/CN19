import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Clock, ExternalLink, Trash2, MailOpen } from 'lucide-react';
import notificationService from '../../services/notification.service';
import { format, formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const NotificationDropdown = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
    // Tự động làm mới mỗi 1 phút
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const data = await notificationService.getNotifications();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleMarkRead = async (id, e) => {
    e.stopPropagation();
    try {
      await notificationService.markRead(id);
      fetchNotifications();
    } catch (error) {
      toast.error('Không thể cập nhật trạng thái thông báo');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllRead();
      fetchNotifications();
      toast.success('Đã đánh dấu tất cả là đã đọc');
    } catch (error) {
      toast.error('Thao tác thất bại');
    }
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.is_read) {
      await notificationService.markRead(notif.id);
      fetchNotifications();
    }
    
    setIsOpen(false);

    const isAdmin = window.location.pathname.startsWith('/admin');
    
    // Chuyển hướng dựa trên loại thông báo
    switch (notif.type) {
      case 'NEW_EVENT_REQUEST':
      case 'EMERGENCY_REQUEST':
        if (isAdmin) {
          navigate(`/admin/events/${notif.target_id || ''}`);
        } else {
          navigate(`/organizer/events/${notif.target_id || ''}`);
        }
        break;
      case 'WITHDRAWAL_REQUEST':
        navigate('/admin/withdrawals');
        break;
      case 'EVENT_APPROVED':
      case 'EVENT_REJECTED':
        navigate(`/organizer/events/${notif.target_id || ''}`);
        break;
      case 'NEW_TICKET_SALE':
      case 'TICKET_SOLD_MKT':
      case 'TICKET_RECEIVED_MKT':
      case 'NEW_MKT_TRANSACTION':
      case 'TICKET_RECEIVED_TRANSFER':
      case 'TICKET_SENT_TRANSFER':
        if (isAdmin) {
          navigate(`/admin/transactions/order/${notif.target_id || ''}`);
        } else {
          navigate(`/organizer/orders/${notif.target_id || ''}`);
        }
        break;
      case 'WITHDRAWAL_APPROVED':
      case 'WITHDRAWAL_REJECTED':
        navigate('/organizer/revenue');
        break;
      default:
        break;
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'NEW_EVENT_REQUEST': return '📅';
      case 'WITHDRAWAL_REQUEST': return '💰';
      case 'EMERGENCY_REQUEST': return '🚨';
      case 'EVENT_APPROVED': return '✅';
      case 'EVENT_REJECTED': return '❌';
      case 'WITHDRAWAL_APPROVED': return '💸';
      case 'WITHDRAWAL_REJECTED': return '⚠️';
      case 'NEW_TICKET_SALE': return '🎟️';
      default: return '🔔';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 rounded-full transition-all border ${
          isOpen 
            ? 'bg-neon-green/10 border-neon-green/50 text-neon-green' 
            : 'bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/5 text-gray-500 dark:text-gray-400 hover:text-neon-green'
        }`}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-red-500 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white dark:border-[#111114] animate-bounce">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-[380px] bg-white dark:bg-[#111114] border border-gray-200 dark:border-white/10 rounded-3xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
          <div className="p-5 border-b border-gray-100 dark:border-white/5 flex items-center justify-between bg-gray-50/50 dark:bg-white/[0.02]">
            <h3 className="font-black text-sm uppercase tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
              <Bell className="w-4 h-4 text-neon-green" />
              Thông báo hệ thống
            </h3>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllRead}
                className="text-[10px] font-black uppercase text-neon-green hover:underline flex items-center gap-1"
              >
                <Check className="w-3 h-3" />
                Đọc tất cả
              </button>
            )}
          </div>

          <div className="max-h-[450px] overflow-y-auto no-scrollbar">
            {notifications.length > 0 ? (
              <div className="divide-y divide-gray-100 dark:divide-white/5">
                {notifications.map((notif) => (
                  <div 
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-all cursor-pointer relative group ${!notif.is_read ? 'bg-neon-green/[0.03]' : ''}`}
                  >
                    {!notif.is_read && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-neon-green"></div>
                    )}
                    
                    <div className="flex gap-4">
                      <div className="w-12 h-12 shrink-0 bg-gray-100 dark:bg-white/5 rounded-2xl flex items-center justify-center text-xl border border-gray-200 dark:border-white/10 group-hover:scale-110 transition-transform">
                        {getTypeIcon(notif.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className={`text-xs font-bold truncate pr-4 ${!notif.is_read ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>
                            {notif.title}
                          </h4>
                          {!notif.is_read && (
                            <button 
                              onClick={(e) => handleMarkRead(notif.id, e)}
                              className="text-gray-400 hover:text-neon-green transition-colors"
                              title="Đánh dấu đã đọc"
                            >
                              <MailOpen className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed mb-2">
                          {notif.message}
                        </p>
                        <div className="flex items-center gap-1.5 text-[9px] font-bold text-gray-400 uppercase tracking-tighter">
                          <Clock className="w-3 h-3" />
                          {format(new Date(notif.created_at), 'dd/MM/yyyy HH:mm', { locale: vi })}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 dark:bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-4 opacity-50">
                  <Bell className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-xs font-medium">Bạn chưa có thông báo nào</p>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-gray-100 dark:border-white/5 text-center bg-gray-50/50 dark:bg-white/[0.02]">
            <button 
              className="text-[10px] font-black uppercase text-gray-400 hover:text-neon-green transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Đóng cửa sổ
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;

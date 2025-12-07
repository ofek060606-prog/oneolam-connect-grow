
import React, { useState, useEffect } from 'react';
import { Notification, User } from '@/entities/all';
import { ArrowLeft, Heart, MessageCircle, UserPlus, Flag } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { enUS, he, es, fr } from 'date-fns/locale';
import { useTranslation } from '../components/utils/i18n';

export default function NotificationsPage({ onBack }) {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { t, currentLanguage } = useTranslation();

  const locales = {
    en: enUS,
    he: he,
    es: es,
    fr: fr
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const user = await User.me();
      const userNotifications = await Notification.filter(
        { recipient_email: user.email },
        '-created_date'
      );
      setNotifications(userNotifications);

      // Mark notifications as read
      const unreadIds = userNotifications.filter(n => !n.is_read).map(n => n.id);
      if (unreadIds.length > 0) {
        await Promise.all(unreadIds.map(id => Notification.update(id, { is_read: true })));
      }

    } catch (error) {
      console.error("Failed to fetch notifications", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleNotificationClick = (note) => {
    if ((note.type === 'like' || note.type === 'comment' || note.type === 'report_post') && note.post_id) {
      window.dispatchEvent(new CustomEvent('navigateTo', { detail: { page: 'post-detail', postId: note.post_id } }));
    } else if (note.type === 'follow' && note.sender_email) { // Preserved sender_email check
      window.dispatchEvent(new CustomEvent('navigateTo', { detail: { page: 'user-profile', email: note.sender_email } }));
    } else if (note.type === 'report_user' && note.reported_user_email) {
      window.dispatchEvent(new CustomEvent('navigateTo', { detail: { page: 'user-profile', email: note.reported_user_email } }));
    }
  };

  const getNotificationText = (notification) => {
    const senderName = notification.sender_name;
    switch (notification.type) {
      case 'like':
        return `${senderName} ${t('likedYourPost')}`;
      case 'comment':
        return `${senderName} ${t('commentedOnYourPost')}`;
      case 'follow':
        return `${senderName} ${t('startedFollowingYou')}`;
      case 'report_post':
      case 'report_user':
        return notification.content;
      default:
        return notification.content;
    }
  };

  const NotificationIcon = ({ type }) => {
    const icons = {
      like: <Heart className="w-5 h-5 text-white" />,
      comment: <MessageCircle className="w-5 h-5 text-white" />,
      follow: <UserPlus className="w-5 h-5 text-white" />,
      report_post: <Flag className="w-5 h-5 text-white" />,
      report_user: <Flag className="w-5 h-5 text-white" />,
    };
    const colors = {
      like: 'bg-red-500',
      comment: 'bg-blue-500',
      follow: 'bg-green-500',
      report_post: 'bg-orange-500',
      report_user: 'bg-orange-500',
    };
    return (
      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${colors[type] || 'bg-slate-500'}`}>
        {icons[type] || null}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-blue-50">
      <div className="bg-white/80 backdrop-blur-lg sticky top-0 z-40 p-4 border-b border-blue-100 flex items-center">
        <button onClick={onBack} className="p-2 hover:bg-blue-100 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6 text-blue-600" />
        </button>
        <h1 className="text-xl font-bold text-slate-900 ml-4">{t('notifications')}</h1>
      </div>
      
      <div className="p-4 space-y-3">
        {isLoading ? (
          <p>{t('loading')}</p>
        ) : notifications.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <p>{t('noNotifications')}</p>
          </div>
        ) : (
          notifications.map(note => (
            <button 
              key={note.id} 
              onClick={() => handleNotificationClick(note)}
              className="w-full bg-white p-4 rounded-xl shadow-sm flex items-center space-x-4 text-left hover:bg-slate-50 transition-colors"
            >
              <NotificationIcon type={note.type} />
              <div>
                <p className="text-slate-800">{getNotificationText(note)}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {formatDistanceToNow(new Date(note.created_date), { 
                    addSuffix: true, 
                    locale: locales[currentLanguage] || locales.en 
                  })}
                </p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

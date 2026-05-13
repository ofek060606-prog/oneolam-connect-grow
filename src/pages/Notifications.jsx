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
      case 'match':
        return `${senderName} matched with you! 🎉`;
      case 'matchmaker_like':
        return `${senderName} liked you in AI Matchmaker! ❤️`;
      case 'report_post':
      case 'report_user':
        return notification.content;
      default:
        return notification.content;
    }
  };

  const NotificationAvatar = ({ notification }) => {
    const { type, sender_name } = notification;
    const avatar = notification.sender_avatar;

    const typeColors = {
      like: 'bg-red-500',
      comment: 'bg-blue-500',
      follow: 'bg-green-500',
      match: 'bg-pink-500',
      matchmaker_like: 'bg-purple-500',
      report_post: 'bg-orange-500',
      report_user: 'bg-orange-500',
    };

    const typeIcons = {
      like: <Heart className="w-4 h-4 text-white" />,
      comment: <MessageCircle className="w-4 h-4 text-white" />,
      follow: <UserPlus className="w-4 h-4 text-white" />,
      match: <Heart className="w-4 h-4 text-white fill-white" />,
      matchmaker_like: <Heart className="w-4 h-4 text-white" />,
      report_post: <Flag className="w-4 h-4 text-white" />,
      report_user: <Flag className="w-4 h-4 text-white" />,
    };

    if (avatar) {
      return (
        <div className="relative shrink-0">
          <img
            src={avatar}
            alt={sender_name}
            className="w-12 h-12 rounded-full object-cover"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center ${typeColors[type] || 'bg-slate-500'}`}>
            {typeIcons[type] || null}
          </div>
        </div>
      );
    }

    // Fallback: colored circle with initials + icon badge
    const initials = sender_name ? sender_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?';
    return (
      <div className="relative shrink-0">
        <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-semibold text-sm">
          {initials}
        </div>
        <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center ${typeColors[type] || 'bg-slate-500'}`}>
          {typeIcons[type] || null}
        </div>
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
              <NotificationAvatar notification={note} />
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
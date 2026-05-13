import React, { useState, useEffect } from 'react';
import { Post, Notification, User } from '@/entities/all';

import { PostCard } from '../components/shared/PostCard';
import { OneOlamIcon } from '../components/icons/OneOlamIcon';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { useTranslation, LanguageProvider } from '../components/utils/i18n';
import { Bell, Search, MessageSquare } from 'lucide-react';
import { CreatePost } from '../components/feed/CreatePost';


function FeedInner({ onChatClick }) {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const { t } = useTranslation();

  useEffect(() => {
    loadFeedData();
    loadNotifications();
  }, []);



  const loadFeedData = async () => {
    setIsLoading(true);
    try {
      // Fetch only posts created by real users (with an email)
      const postsData = await Post.list('-created_date', 50);
      const realPosts = postsData.filter((p) => p.created_by && p.created_by.includes('@'));

      setPosts(realPosts);
    } catch (error) {
      console.error('Error loading feed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadNotifications = async () => {
    try {
      const user = await User.me();
      const notifications = await Notification.filter(
        { recipient_email: user.email, is_read: false }
      );
      setUnreadNotifications(notifications.length);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const handlePostDeleted = () => {
    loadFeedData(); // Refresh feed after a post is deleted
  };

  const handleNavigateToChats = () => {
    window.dispatchEvent(new CustomEvent('navigateTo', { detail: { page: 'chats' } }));
  };

  const handleNavigateToNotifications = () => {
    window.dispatchEvent(new CustomEvent('navigateTo', { detail: { page: 'notifications' } }));
  };



  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="animate-pulse">
          <OneOlamIcon className="w-12 h-12 text-blue-500" />
        </div>
      </div>);

  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 pb-20">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-lg sticky top-0 z-40 border-b border-blue-100">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-3">
              <OneOlamIcon className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent">
                {t('appName')}
              </h1>
            </div>
            <div className="flex items-center space-x-2">
              

              
               <button onClick={handleNavigateToChats} className="p-2 hover:bg-blue-100 rounded-full transition-colors">
                <MessageSquare className="w-6 h-6 text-blue-600" />
              </button>
              <button onClick={handleNavigateToNotifications} className="relative p-2 hover:bg-blue-100 rounded-full transition-colors">
                <Bell className="w-6 h-6 text-blue-600" />
                {unreadNotifications > 0 &&
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white flex items-center justify-center text-xs">
                    {unreadNotifications}
                  </div>
                }
              </button>
              <LanguageSwitcher />
            </div>
          </div>
        </div>

        {/* Main content area */}
        <div className="px-4 pt-4">
          {/* Create Post */}
          <CreatePost onPostCreated={loadFeedData} />

          {/* Posts */}
          <div>
            {posts.length === 0 && !isLoading ?
            <div className="text-center py-16 text-slate-500">
                <p className="font-semibold text-lg mb-2">{t('feed.noPosts.title')}</p>
                <p>{t('feed.noPosts.subtitle')}</p>
              </div> :

            posts.filter((post) => post && post.id).map((post) =>
            <PostCard
              key={post.id}
              post={post}
              onChatClick={post?.created_by && post?.author_name ? () => onChatClick(post.created_by, post.author_name) : undefined}
              onDelete={handlePostDeleted} />

            )
            }
          </div>
        </div>
      </div>


    </>);

}

export default function Feed(props) {
  return (
    <LanguageProvider>
      <FeedInner {...props} />
    </LanguageProvider>
  );
}
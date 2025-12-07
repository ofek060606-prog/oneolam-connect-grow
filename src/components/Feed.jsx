
import React, { useState, useEffect, useCallback } from 'react';
import { Post, Story, Notification, User, CommunityMember } from '@/entities/all';
import { StoryCircle } from './shared/StoryCircle';
import { PostCard } from './shared/PostCard';
import { OneOlamIcon } from './icons/OneOlamIcon';
import { LanguageSwitcher } from './LanguageSwitcher';
import { SearchModal } from './shared/SearchModal';
import { useTranslation } from './utils/i18n';
import { Bell, Search, MessageSquare } from 'lucide-react';
import { CreatePost } from './feed/CreatePost';
import { StoryViewer } from './shared/StoryViewer';
import { toast } from 'sonner';

// Cache management helpers for Feed
const FEED_CACHE_KEYS = {
  POSTS: 'feed_posts',
  STORIES: 'feed_stories',
  LAST_FETCH: 'feed_last_fetch'
};

const getFromCache = (key) => {
  try {
    const item = localStorage.getItem(key);
    if (item) {
      const parsed = JSON.parse(item);
      // Check if data is from today
      const today = new Date().toISOString().split('T')[0];
      if (parsed.date === today) {
        return parsed.data;
      }
    }
  } catch (error) {
    console.error('Cache read error:', error);
  }
  return null;
};

const setToCache = (key, data) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(key, JSON.stringify({ date: today, data }));
  } catch (error) {
    console.error('Cache write error:', error);
  }
};

// Helper function to add delay between API calls
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Enhanced retry function with longer backoff delays
const retryWithBackoff = async (fn, maxRetries = 2, baseDelay = 3000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.message?.includes('429') || error.message?.includes('Rate limit')) {
        const delayTime = baseDelay * Math.pow(2, i);
        console.log(`Rate limit hit, waiting ${delayTime}ms... (attempt ${i + 1}/${maxRetries})`);
        await delay(delayTime);
        continue;
      }
      throw error;
    }
  }
  throw new Error('Rate limit exceeded - please try again in a few minutes');
};

export const Feed = ({ onChatClick }) => {
  const [posts, setPosts] = useState([]);
  const [stories, setStories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewingStory, setViewingStory] = useState(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const { t } = useTranslation();

  const loadInitialData = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh) {
      setIsLoading(true);
    }

    try {
      // Load cached data immediately for better UX
      if (!forceRefresh) {
        const cachedPosts = getFromCache(FEED_CACHE_KEYS.POSTS);
        const cachedStories = getFromCache(FEED_CACHE_KEYS.STORIES);
        
        if (cachedPosts && cachedPosts.length > 0) {
          setPosts(cachedPosts);
          console.log('Loaded cached posts');
        }
        if (cachedStories && cachedStories.length > 0) {
          setStories(cachedStories);
          console.log('Loaded cached stories');
        }
      }

      // Check if we need to refresh data
      const lastFetch = getFromCache(FEED_CACHE_KEYS.LAST_FETCH);
      const needsRefresh = forceRefresh || !lastFetch || (Date.now() - lastFetch > 30 * 60 * 1000); // 30 minutes
      
      if (!needsRefresh && !forceRefresh) {
        console.log('Using cached feed data (no refresh needed)');
        setIsLoading(false);
        return;
      }

      console.log('Fetching fresh feed data...');

      let userResult = null;
      try {
        userResult = await User.me();
      } catch (error) {
        console.log('User not logged in');
      }

      // Fetch posts with retry logic
      try {
        console.log('Fetching posts...');
        
        let allPosts = [];
        
        // Get general posts
        const generalPosts = await retryWithBackoff(() => 
          Post.list('-created_date', 20)
        );
        allPosts = [...generalPosts];
        
        // If user is logged in, get posts from their communities
        if (userResult) {
          const userCommunities = await retryWithBackoff(() =>
            CommunityMember.filter({ member_email: userResult.email })
          );
          
          if (userCommunities.length > 0) {
            // Get posts from each community
            for (const membership of userCommunities) {
              try {
                await delay(1000); // Small delay between requests
                const communityPosts = await retryWithBackoff(() =>
                  Post.filter({ community_name: membership.community_id }, '-created_date', 10)
                );
                allPosts = [...allPosts, ...communityPosts];
              } catch (error) {
                console.log('Error fetching community posts:', error);
              }
            }
          }
        }
        
        // Remove duplicates and sort by date
        const uniquePosts = Array.from(new Map(allPosts.map(post => [post.id, post])).values())
          .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
          .slice(0, 30);
        
        setPosts(uniquePosts);
        setToCache(FEED_CACHE_KEYS.POSTS, uniquePosts);
        console.log(`Fetched ${uniquePosts.length} posts`);
      } catch (error) {
        console.log('Error fetching posts, using cached data:', error);
        if (error.message?.includes('Rate limit') || error.message?.includes('429')) {
          toast.error("Server is busy. Using cached posts.");
        }
      }

      await delay(2000); // 2 second delay between API calls

      // Fetch stories with retry logic
      try {
        console.log('Fetching stories...');
        const storiesData = await retryWithBackoff(() => 
          Story.list('-created_date', 20)
        );
        setStories(storiesData);
        setToCache(FEED_CACHE_KEYS.STORIES, storiesData);
        console.log(`Fetched ${storiesData.length} stories`);
      } catch (error) {
        console.log('Error fetching stories, using cached data:', error);
        if (error.message?.includes('Rate limit') || error.message?.includes('429')) {
          toast.error("Server is busy. Using cached stories.");
        }
      }

      // Get notifications count if user is logged in
      if (userResult) {
        try {
          await delay(1500); // Another delay
          const notifications = await retryWithBackoff(() => 
            Notification.filter({ recipient_email: userResult.email, is_read: false })
          );
          setUnreadNotifications(notifications.length);
        } catch (error) {
          console.log('Error fetching notifications:', error);
          // Don't show error for notifications
        }
      }

      // Update last fetch time
      setToCache(FEED_CACHE_KEYS.LAST_FETCH, Date.now());

    } catch (error) {
      console.error('Error loading feed:', error);
      if (error.message?.includes('Rate limit') || error.message?.includes('429')) {
        toast.error("Server is very busy. Using cached data.");
      } else {
        toast.error("Could not load the feed. Please try again later.");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const handleNavigateToChats = () => {
    window.dispatchEvent(new CustomEvent('navigateTo', { detail: { page: 'chats' } }));
  };
  
  const handleNavigateToNotifications = () => {
    window.dispatchEvent(new CustomEvent('navigateTo', { detail: { page: 'notifications' } }));
  };

  const handleStoryClick = (story) => {
    setViewingStory(story);
  };

  const handleSearchClick = () => {
    setShowSearchModal(true);
  };

  if (isLoading && posts.length === 0 && stories.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="animate-pulse text-center">
          <OneOlamIcon className="w-12 h-12 text-blue-500 mx-auto mb-2" />
          <p className="text-slate-600">{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 pb-20">
        <div className="bg-white/80 backdrop-blur-lg sticky top-0 z-40 border-b border-blue-100">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-3">
              <OneOlamIcon className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent">
                {t('appName')}
              </h1>
            </div>
            <div className="flex items-center space-x-2">
              <button 
                onClick={handleSearchClick}
                className="p-2 hover:bg-blue-100 rounded-full transition-colors"
              >
                <Search className="w-6 h-6 text-blue-600" />
              </button>
              <button onClick={handleNavigateToChats} className="p-2 hover:bg-blue-100 rounded-full transition-colors">
                <MessageSquare className="w-6 h-6 text-blue-600" />
              </button>
              <button onClick={handleNavigateToNotifications} className="relative p-2 hover:bg-blue-100 rounded-full transition-colors">
                <Bell className="w-6 h-6 text-blue-600" />
                {unreadNotifications > 0 && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">
                      {unreadNotifications > 9 ? '9+' : unreadNotifications}
                    </span>
                  </div>
                )}
              </button>
              <LanguageSwitcher />
            </div>
          </div>
        </div>

        <div className="px-4 pt-4">
          <div className="mb-6">
            <div className="flex space-x-4 overflow-x-auto scrollbar-hide pb-2">
              <StoryCircle
                story={{ author_name: t('yourStory'), author_avatar: null }}
                isOwn={true}
                onClick={() => window.dispatchEvent(new CustomEvent('navigateTo', { detail: { page: 'create-story' } }))}
              />
              {stories.map((story) => (
                <StoryCircle
                  key={story.id}
                  story={story}
                  onClick={handleStoryClick}
                />
              ))}
            </div>
          </div>
          
          <CreatePost onPostCreated={() => loadInitialData(true)} />

          {isLoading && posts.length === 0 ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-2xl p-4 shadow-sm animate-pulse">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-slate-200 rounded-full"></div>
                    <div>
                      <div className="w-24 h-4 bg-slate-200 rounded mb-2"></div>
                      <div className="w-16 h-3 bg-slate-200 rounded"></div>
                    </div>
                  </div>
                  <div className="w-full h-4 bg-slate-200 rounded mb-2"></div>
                  <div className="w-3/4 h-4 bg-slate-200 rounded mb-4"></div>
                  <div className="w-full h-40 bg-slate-200 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : (
            <div>
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onChatClick={() => onChatClick(post.created_by, post.author_name)}
                  onDelete={() => loadInitialData(true)}
                />
              ))}
            </div>
          )}

          {posts.length === 0 && !isLoading && (
              <div className="text-center py-12">
                <OneOlamIcon className="w-16 h-16 text-blue-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-700 mb-2">Welcome to OneOlam!</h3>
                <p className="text-slate-500">Be the first to share something with the community!</p>
              </div>
          )}
        </div>
      </div>

      <SearchModal 
        isOpen={showSearchModal} 
        onClose={() => setShowSearchModal(false)} 
      />

      {viewingStory && (
        <StoryViewer 
          story={viewingStory} 
          onClose={() => setViewingStory(null)} 
        />
      )}
    </>
  );
};

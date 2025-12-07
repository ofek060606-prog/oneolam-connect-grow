import React, { useState, useEffect } from 'react';
import { User, Community, Post } from '@/entities/all';
import { Search, RefreshCw, Sparkles, Plus, Users } from 'lucide-react';
import { useTranslation } from './utils/i18n';
import { CommunityHorizontalCard } from './explore/CommunityHorizontalCard';
import { TrendingPostCard } from './explore/TrendingPostCard';
import { UserCard } from './explore/UserCard';
import { toast } from 'sonner';

// Cache management helpers
const EXPLORE_CACHE_KEYS = {
  COMMUNITIES: 'explore_communities',
  POSTS: 'explore_trending_posts',
  USERS: 'explore_suggested_users',
  LAST_FETCH: 'explore_last_fetch'
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

export default function Explore() {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [communities, setCommunities] = useState([]);
  const [trendingPosts, setTrendingPosts] = useState([]);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { t } = useTranslation();

  // The original popular interests section that you loved
  const popularInterests = [
    { name: 'Torah Study', color: 'bg-blue-100 text-blue-800', users: '2.3k' },
    { name: 'Technology', color: 'bg-purple-100 text-purple-800', users: '1.8k' },
    { name: 'Travel', color: 'bg-green-100 text-green-800', users: '1.5k' },
    { name: 'Cooking', color: 'bg-orange-100 text-orange-800', users: '1.2k' },
  ];
  
  // Popular hashtags with different design
  const popularHashtags = [
    { name: 'Torah', color: 'bg-gradient-to-r from-blue-400 to-blue-600' },
    { name: 'Technology', color: 'bg-gradient-to-r from-purple-400 to-purple-600' },
    { name: 'Travel', color: 'bg-gradient-to-r from-green-400 to-green-600' },
    { name: 'Cooking', color: 'bg-gradient-to-r from-orange-400 to-orange-600' },
    { name: 'Music', color: 'bg-gradient-to-r from-pink-400 to-pink-600' },
    { name: 'Business', color: 'bg-gradient-to-r from-indigo-400 to-indigo-600' }
  ];

  useEffect(() => {
    loadCachedData();
    fetchData();
  }, []);

  const loadCachedData = () => {
    // Load cached data immediately for better UX
    const cachedCommunities = getFromCache(EXPLORE_CACHE_KEYS.COMMUNITIES);
    const cachedPosts = getFromCache(EXPLORE_CACHE_KEYS.POSTS);
    const cachedUsers = getFromCache(EXPLORE_CACHE_KEYS.USERS);
    
    if (cachedCommunities) {
      setCommunities(cachedCommunities);
      console.log('Loaded cached communities');
    }
    if (cachedPosts) {
      setTrendingPosts(cachedPosts);
      console.log('Loaded cached posts');
    }
    if (cachedUsers) {
      setSuggestedUsers(cachedUsers);
      console.log('Loaded cached users');
    }
  };

  const fetchData = async (forceRefresh = false) => {
    if (!forceRefresh) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }
    
    let user = null;
    
    try {
      // Fetch user data (lightweight operation)
      try {
        user = await User.me();
        setCurrentUser(user);
      } catch (error) {
        console.log('User not logged in or error fetching user:', error);
        setCurrentUser(null);
      }

      // Check if we need to refresh data (only if cache is old or force refresh)
      const lastFetch = getFromCache(EXPLORE_CACHE_KEYS.LAST_FETCH);
      const needsRefresh = forceRefresh || !lastFetch || (Date.now() - lastFetch > 60 * 60 * 1000); // 1 hour
      
      if (!needsRefresh && !forceRefresh) {
        console.log('Using cached data (no refresh needed)');
        setIsLoading(false);
        return;
      }

      console.log('Fetching fresh data from API...');

      // Fetch data with delays and retries
      try {
        console.log('Fetching communities...');
        const approvedCommunities = await retryWithBackoff(() => 
          Community.filter({ is_approved: true }, '-member_count')
        );
        setCommunities(approvedCommunities);
        setToCache(EXPLORE_CACHE_KEYS.COMMUNITIES, approvedCommunities);
        console.log(`Fetched ${approvedCommunities.length} communities`);
      } catch (error) {
        console.log('Error fetching communities, using cached data:', error);
        if (error.message?.includes('Rate limit') || error.message?.includes('429')) {
          toast.error("Server is busy. Using cached data.");
        }
      }

      await delay(2000); // 2 second delay between API calls

      try {
        console.log('Fetching posts...');
        const postsData = await retryWithBackoff(() => 
          Post.list('-likes_count', 5)
        );
        setTrendingPosts(postsData);
        setToCache(EXPLORE_CACHE_KEYS.POSTS, postsData);
        console.log(`Fetched ${postsData.length} posts`);
      } catch (error) {
        console.log('Error fetching posts, using cached data:', error);
        if (error.message?.includes('Rate limit') || error.message?.includes('429')) {
          toast.error("Server is busy. Using cached data.");
        }
      }

      await delay(2000); // Another 2 second delay

      try {
        console.log('Fetching users...');
        const usersData = await retryWithBackoff(() => 
          User.list(undefined, 10)
        );
        if (user) {
          const filtered = usersData.filter(u => u.email !== user.email).slice(0, 4);
          setSuggestedUsers(filtered);
          setToCache(EXPLORE_CACHE_KEYS.USERS, filtered);
        } else {
          const sliced = usersData.slice(0, 4);
          setSuggestedUsers(sliced);
          setToCache(EXPLORE_CACHE_KEYS.USERS, sliced);
        }
        console.log('Fetched users');
      } catch (error) {
        console.log('Error fetching users, using cached data:', error);
        if (error.message?.includes('Rate limit') || error.message?.includes('429')) {
          toast.error("Server is busy. Using cached data.");
        }
      }

      // Update last fetch time
      setToCache(EXPLORE_CACHE_KEYS.LAST_FETCH, Date.now());

    } catch (error) {
      console.error('Error in fetchData:', error);
      if (error.message?.includes('Rate limit') || error.message?.includes('429')) {
        toast.error("Server is very busy. Please wait a few minutes.");
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleAiConnectClick = () => {
    window.dispatchEvent(new CustomEvent('navigateTo', { detail: { page: 'ai-matchmaker' } }));
  };

  const handleCommunityClick = (community) => {
    window.dispatchEvent(new CustomEvent('navigateTo', { detail: { page: 'community', communityId: community.id, communityName: community.name } }));
  };
  
  const isPremium = currentUser?.subscription_tier === 'premium';

  const handleCreateCommunityClick = () => {
    if (!isPremium) {
      toast.error(t('premiumFeature'), {
        description: t('upgradeToCreateCommunities'),
        action: {
          label: t('upgrade'),
          onClick: () => window.dispatchEvent(new CustomEvent('navigateTo', { detail: { page: 'payment' } }))
        }
      });
      return;
    }
    window.dispatchEvent(new CustomEvent('navigateTo', { detail: { page: 'create-community' } }));
  };

  const handleInterestClick = (interest) => {
    window.dispatchEvent(new CustomEvent('navigateTo', { 
      detail: { 
        page: 'interest-community', 
        interestName: interest.name,
        interestColor: interest.color
      } 
    }));
  };

  const handleHashtagClick = (hashtag) => {
    window.dispatchEvent(new CustomEvent('navigateTo', { 
      detail: { 
        page: 'hashtag-posts', 
        hashtagName: hashtag.name,
        hashtagColor: hashtag.color
      } 
    }));
  };

  const handlePostClick = (post) => {
    window.dispatchEvent(new CustomEvent('navigateTo', { detail: { page: 'post-detail', postId: post.id } }));
  };

  const handleRefreshClick = () => {
    fetchData(true); // Force refresh
  };
  
  // Improved age calculation function
  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return null;
    
    try {
      const birthDate = new Date(dateOfBirth);
      const today = new Date();
      
      // Check if the date is valid
      if (isNaN(birthDate.getTime())) {
        return null;
      }
      
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      // Adjust if birthday hasn't occurred this year
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      return age;
    } catch (error) {
      return null;
    }
  };

  // Check if user can access AI Matchmaker
  const canUseAiMatchmaker = () => {
    if (!currentUser) return false;
    
    // First check if user has age field
    if (currentUser.age && typeof currentUser.age === 'number') {
      return currentUser.age >= 18;
    }
    
    // If no age, try to calculate from date_of_birth
    if (currentUser.date_of_birth) {
      const calculatedAge = calculateAge(currentUser.date_of_birth);
      return calculatedAge !== null && calculatedAge >= 18;
    }
    
    // No age data available - assume they're 18+ if they don't have date_of_birth
    // This handles legacy users who signed up before we required date_of_birth
    return true;
  };

  const userAge = currentUser?.age || calculateAge(currentUser?.date_of_birth);
  const showAiFeature = canUseAiMatchmaker();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 pb-20">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-lg sticky top-0 z-40 border-b border-blue-100 p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-slate-900">{t('exploreTitle')}</h1>
          <button 
            onClick={handleRefreshClick} 
            disabled={isRefreshing}
            className="p-2 text-blue-500 hover:bg-blue-100 rounded-full transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder={t('searchCommunities')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-100 rounded-xl border-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      <div className="px-4 pt-6 space-y-8">
        {/* AI Matchmaker */}
        {showAiFeature && (
          <section>
              <div 
                onClick={handleAiConnectClick}
                className="bg-gradient-to-r from-purple-500 to-indigo-600 p-6 rounded-2xl shadow-xl cursor-pointer flex items-center justify-between text-white hover:shadow-2xl hover:scale-105 transition-all duration-300"
              >
                <div>
                  <h2 className="font-bold text-2xl">{t('aiMatchmaker')}</h2>
                  <p className="opacity-90">{t('findYourPeople')}</p>
                  {!isPremium && <p className="text-sm mt-1 bg-yellow-400/20 px-2 py-1 rounded-full inline-block">{t('premiumFeature')}</p>}
                </div>
                <Sparkles className="w-10 h-10" />
              </div>
          </section>
        )}

        {/* Popular Communities - Combined Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-800">{t('popularCommunities')}</h2>
            <button className="text-blue-600 font-medium text-sm hover:text-blue-700">
              {t('viewAll')}
            </button>
          </div>

          {/* Popular Interests */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {popularInterests.map((interest) => (
              <button 
                key={interest.name}
                onClick={() => handleInterestClick(interest)}
                className={`p-4 rounded-xl text-left transition-all hover:scale-105 shadow-sm hover:shadow-md ${interest.color}`}
              >
                <h3 className="font-bold text-sm">{interest.name}</h3>
                <p className="text-xs opacity-80 mt-1">{interest.users} {t('members')}</p>
              </button>
            ))}
          </div>
          
          {/* Communities List */}
          {isLoading && communities.length === 0 ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white p-4 rounded-xl shadow-sm animate-pulse">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-slate-200 rounded-lg"></div>
                    <div className="flex-1">
                      <div className="w-32 h-4 bg-slate-200 rounded mb-2"></div>
                      <div className="w-20 h-3 bg-slate-200 rounded"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="space-y-3 mb-4">
                {communities.slice(0, 3).map((community) => (
                    <CommunityHorizontalCard key={community.id} community={community} onClick={() => handleCommunityClick(community)} />
                ))}
              </div>
              
              {/* Create Community */}
              <div 
                onClick={handleCreateCommunityClick}
                className="bg-white p-4 rounded-xl shadow-sm text-center border border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-all relative"
              >
                {!isPremium && (
                  <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold">
                    👑 {t('premium')}
                  </div>
                )}
                <Plus className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <h3 className="text-lg font-bold text-slate-900 mb-1">{t('createYourOwnCommunity')}</h3>
                <p className="text-slate-600 text-sm">{t('bringPeopleTogether')}</p>
              </div>
            </>
          )}
        </section>

        {/* Popular Hashtags */}
        <section>
          <h2 className="text-lg font-bold text-slate-800 mb-4">{t('popularHashtags')}</h2>
          <div className="flex flex-wrap gap-3">
            {popularHashtags.map((hashtag, index) => (
              <button
                key={index}
                onClick={() => handleHashtagClick(hashtag)}
                className={`${hashtag.color} text-white px-6 py-3 rounded-full text-sm font-bold transition-all hover:scale-105 shadow-lg hover:shadow-xl flex items-center space-x-2`}
              >
                <span>#</span>
                <span>{hashtag.name}</span>
              </button>
            ))}
          </div>
        </section>
        
        {/* Trending Now */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-800">{t('trendingNow')}</h2>
            <button className="text-blue-600 font-medium text-sm hover:text-blue-700">
              {t('viewAll')}
            </button>
          </div>
          
          {isLoading && trendingPosts.length === 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white p-4 rounded-xl shadow-sm animate-pulse">
                  <div className="w-full h-24 bg-slate-200 rounded-lg mb-3"></div>
                  <div className="w-3/4 h-4 bg-slate-200 rounded mb-2"></div>
                  <div className="w-1/2 h-3 bg-slate-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {trendingPosts.slice(0, 4).map(post => (
                <TrendingPostCard 
                  key={post.id} 
                  post={post} 
                  onClick={() => handlePostClick(post)}
                />
              ))}
            </div>
          )}
        </section>

        {/* People You Might Know */}
        <section>
          <h2 className="text-lg font-bold text-slate-800 mb-4">{t('peopleYouMightKnow')}</h2>
          
          {isLoading && suggestedUsers.length === 0 ? (
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white p-3 rounded-xl shadow-sm animate-pulse">
                  <div className="w-12 h-12 bg-slate-200 rounded-full mx-auto mb-2"></div>
                  <div className="w-full h-3 bg-slate-200 rounded mb-1"></div>
                  <div className="w-3/4 h-2 bg-slate-200 rounded mx-auto"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {suggestedUsers.slice(0, 3).map(user => (
                <div key={user.id} className="bg-white p-3 rounded-xl shadow-sm text-center">
                  <img
                    src={user.avatar || `https://ui-avatars.com/api/?name=${user.full_name}`}
                    alt={user.full_name}
                    className="w-12 h-12 rounded-full mx-auto mb-2 object-cover"
                  />
                  <h3 className="font-semibold text-sm text-slate-900 truncate">{user.full_name}</h3>
                  <p className="text-xs text-slate-500 mb-2 truncate">{user.location || t('member')}</p>
                  <button className="w-full bg-blue-500 text-white text-xs px-3 py-1 rounded-lg hover:bg-blue-600 transition-colors">
                    {t('connect')}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { User, Community, Post } from '@/entities/all'; // Added Post entity import
import { Search, RefreshCw, Users, Sparkles } from 'lucide-react';
import { useTranslation } from '../components/utils/i18n';
import { toast } from 'sonner';

// New component for displaying individual trending posts
const TrendingPostCard = ({ post, onClick }) => {
  // Extract username from email, or default to 'Anonymous'
  const creatorName = post.created_by && typeof post.created_by === 'string'
    ? post.created_by.split('@')[0]
    : 'Anonymous';

  return (
    <div onClick={onClick} className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 hover:shadow-md hover:border-blue-200 cursor-pointer transition-all text-sm">
      <p className="font-semibold text-slate-800 line-clamp-2">{post.content}</p>
      <p className="text-xs text-slate-500 mt-1">by {creatorName}</p>
      {post.image_url && (
        <img src={post.image_url} alt="Post image" className="w-full h-24 object-cover rounded-md mt-2"/>
      )}
    </div>
  );
};

const CommunityCard = ({ community, onClick }) => {
  return (
    <div onClick={onClick} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:shadow-md hover:border-blue-200 cursor-pointer transition-all">
      <div className="flex items-start space-x-4">
        <img src={community.image_url || `https://ui-avatars.com/api/?name=${community.name}&background=random`} alt={community.name} className="w-16 h-16 rounded-lg object-cover"/>
        <div>
          <h3 className="font-bold text-slate-800">{community.name}</h3>
          <p className="text-sm text-slate-600 line-clamp-2">{community.description}</p>
          <div className="flex items-center space-x-2 mt-2 text-xs text-slate-500">
            <Users className="w-3 h-3"/>
            <span>{community.member_count || 1} Members</span>
          </div>
        </div>
      </div>
    </div>
  )
};

export default function Explore({ onChatClick }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [communities, setCommunities] = useState([]);
  const [trendingPosts, setTrendingPosts] = useState([]); // State to hold trending posts
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch user, communities, and trending posts concurrently
      const [user, approvedCommunities, trendPosts] = await Promise.all([
        User.me(),
        Community.filter({ is_approved: true }, '-member_count'),
        // Safely attempt to fetch trending posts from the Post entity
        // If Post or Post.trending() is not available, it defaults to an empty array
        Post && typeof Post.trending === 'function' ? Post.trending() : Promise.resolve([])
      ]);
      setCurrentUser(user);
      setCommunities(approvedCommunities);
      setTrendingPosts(trendPosts); // Update state with fetched trending posts
    } catch (error) {
      console.error('Error fetching explore data:', error);
      toast.error('Could not load explore data.');
      setCurrentUser({ subscription_tier: 'free' });
      setTrendingPosts([]); // Ensure trendingPosts is reset on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleAiConnectClick = () => {
    window.dispatchEvent(new CustomEvent('navigateTo', { detail: { page: 'ai-matchmaker' } }));
  };

  const handleCommunityClick = (community) => {
    window.dispatchEvent(new CustomEvent('navigateTo', { detail: { page: 'community', communityId: community.id } }));
  };

  const handleCreateCommunityClick = () => {
    window.dispatchEvent(new CustomEvent('navigateTo', { detail: { page: 'create-community' } }));
  };

  const handlePostClick = (post) => {
    // Navigate to a specific post page
    window.dispatchEvent(new CustomEvent('navigateTo', { detail: { page: 'post', postId: post.id } }));
  };

  const isPremium = currentUser?.subscription_tier === 'premium';
  
  const filteredCommunities = communities.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter trending posts based on the provided criteria (e.g., exclude dummy content)
  const visibleTrendingPosts = trendingPosts.filter(post => 
    post.created_by && 
    typeof post.created_by === 'string' && // Ensure created_by is a string
    post.created_by.includes('@') && 
    !post.content?.includes('Demo') && 
    !post.content?.includes('Sample')
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 pb-20">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-lg sticky top-0 z-40 border-b border-blue-100 p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-slate-900">{t('exploreTitle')}</h1>
          <button onClick={fetchData} className="p-2 text-blue-500 hover:bg-blue-100 rounded-full transition-colors">
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        
        {/* Search Bar */}
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

      {/* Content */}
      <div className="px-4 pt-6 space-y-8">
      
        {/* Create Community CTA */}
        <section>
          <button
            onClick={handleCreateCommunityClick}
            className="w-full bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center justify-center space-x-3 hover:bg-slate-50 transition-colors"
          >
            <Users className="w-6 h-6 text-blue-600" />
            <span className="font-bold text-slate-800">Create a Community</span>
          </button>
        </section>

        {/* AI Connect */}
        <section>
            <div 
              onClick={handleAiConnectClick}
              className="bg-gradient-to-r from-purple-500 to-indigo-600 p-6 rounded-2xl shadow-xl cursor-pointer flex items-center justify-between text-white hover:shadow-2xl hover:scale-105 transition-all duration-300"
            >
              <div>
                <h2 className="font-bold text-2xl">AI Matchmaker</h2>
                <p className="opacity-90">Find your people with AI-powered matching</p>
                {!isPremium && (
                  <p className="text-sm mt-1 bg-yellow-400/20 px-2 py-1 rounded-full inline-block">Premium Feature</p>
                )}
              </div>
              <Sparkles className="w-10 h-10" />
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
          {isLoading ? (
            <div className="text-center py-8">
              <p>Loading trending posts...</p>
            </div>
          ) : visibleTrendingPosts.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {visibleTrendingPosts.slice(0, 4).map(post => (
                <TrendingPostCard 
                  key={post.id} 
                  post={post} 
                  onClick={() => handlePostClick(post)}
                />
              ))}
            </div>
          ) : (
            <div className="col-span-2 text-center text-slate-500 py-8">
              <p>No posts yet. Be the first to create content!</p>
            </div>
          )}
        </section>

        {/* Popular Communities */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-800">Popular Communities</h2>
          </div>
          {isLoading ? (
            <div className="text-center py-8">
              <p>Loading communities...</p>
            </div>
          ) : filteredCommunities.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCommunities.map((community) => (
                <CommunityCard key={community.id} community={community} onClick={() => handleCommunityClick(community)} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <p>No communities found for your search.</p>
              <p className="text-sm">Why not create the first one?</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
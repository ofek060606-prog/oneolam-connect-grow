import React, { useState, useEffect, useCallback } from 'react';
import { Search, X, Hash, User as UserIcon, Loader2 } from 'lucide-react';
import { User, Post } from '@/entities/all';
import { useTranslation } from '../utils/i18n';

export const SearchModal = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ users: [], hashtags: [] });
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation();

  const performSearch = useCallback(async () => {
    setIsLoading(true);
    try {
      // Search users by name
      const allUsers = await User.list(undefined, 100);
      const filteredUsers = allUsers.filter(user => 
        user.full_name.toLowerCase().includes(searchQuery.toLowerCase())
      );

      // Search hashtags in posts
      const allPosts = await Post.list(undefined, 500);
      const hashtagsSet = new Set();
      
      allPosts.forEach(post => {
        if (post.content) {
          const hashtags = post.content.match(/#[\w\u0590-\u05ff]+/g);
          if (hashtags) {
            hashtags.forEach(tag => {
              if (tag.toLowerCase().includes(searchQuery.toLowerCase())) {
                hashtagsSet.add(tag);
              }
            });
          }
        }
      });

      setSearchResults({
        users: filteredUsers.slice(0, 10),
        hashtags: Array.from(hashtagsSet).slice(0, 10)
      });
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (searchQuery.length > 2) {
      performSearch();
    } else {
      setSearchResults({ users: [], hashtags: [] });
    }
  }, [searchQuery, performSearch]);

  const handleUserClick = (userEmail) => {
    onClose();
    window.dispatchEvent(new CustomEvent('navigateTo', { 
      detail: { page: 'user-profile', email: userEmail } 
    }));
  };

  const handleHashtagClick = (hashtag) => {
    onClose();
    // Navigate to feed with hashtag filter
    window.dispatchEvent(new CustomEvent('navigateTo', { 
      detail: { page: 'feed' } 
    }));
    // You could add hashtag filtering logic here
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20">
      <div className="bg-white w-full max-w-md mx-4 rounded-2xl shadow-xl max-h-96 overflow-hidden">
        {/* Search Header */}
        <div className="p-4 border-b border-slate-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search people or hashtags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-3 bg-slate-100 rounded-xl border-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              autoFocus
            />
            <button
              onClick={onClose}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search Results */}
        <div className="overflow-y-auto max-h-80">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            </div>
          ) : (
            <>
              {/* Users Section */}
              {searchResults.users.length > 0 && (
                <div className="p-2">
                  <h3 className="text-sm font-semibold text-slate-500 px-3 py-2">People</h3>
                  {searchResults.users.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => handleUserClick(user.email)}
                      className="flex items-center space-x-3 p-3 hover:bg-slate-50 rounded-xl cursor-pointer"
                    >
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <UserIcon className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{user.full_name}</p>
                        <p className="text-sm text-slate-500">{user.bio?.substring(0, 50) || 'Community member'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Hashtags Section */}
              {searchResults.hashtags.length > 0 && (
                <div className="p-2 border-t border-slate-100">
                  <h3 className="text-sm font-semibold text-slate-500 px-3 py-2">Hashtags</h3>
                  {searchResults.hashtags.map((hashtag, index) => (
                    <div
                      key={index}
                      onClick={() => handleHashtagClick(hashtag)}
                      className="flex items-center space-x-3 p-3 hover:bg-slate-50 rounded-xl cursor-pointer"
                    >
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <Hash className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{hashtag}</p>
                        <p className="text-sm text-slate-500">Search posts with this hashtag</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* No Results */}
              {searchQuery.length > 2 && searchResults.users.length === 0 && searchResults.hashtags.length === 0 && !isLoading && (
                <div className="text-center py-8">
                  <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">No results found for "{searchQuery}"</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
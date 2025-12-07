import React, { useState, useEffect } from 'react';
import { SavedPost, User } from '@/entities/all';
import { ArrowLeft, Bookmark, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SavedPostsPage({ onBack }) {
  const [savedPosts, setSavedPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSavedPosts();
  }, []);

  const loadSavedPosts = async () => {
    setIsLoading(true);
    try {
      const user = await User.me();
      const posts = await SavedPost.filter({ created_by: user.email }, '-created_date');
      setSavedPosts(posts);
    } catch (error) {
      console.error('Error loading saved posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnsave = async (postId) => {
    try {
      await SavedPost.delete(postId);
      setSavedPosts(prev => prev.filter(p => p.id !== postId));
      toast.success('Post removed from saved');
    } catch (error) {
      console.error('Error removing saved post:', error);
      toast.error('Could not remove post');
    }
  };

  return (
    <div className="min-h-screen bg-blue-50">
      <div className="bg-white/80 backdrop-blur-lg sticky top-0 z-40 p-4 border-b border-blue-100">
        <div className="flex items-center">
          <button onClick={onBack} className="p-2 hover:bg-blue-100 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6 text-blue-600" />
          </button>
          <h1 className="text-xl font-bold text-slate-900 ml-4 flex items-center">
            <Bookmark className="w-5 h-5 mr-2" />
            Saved Posts
          </h1>
        </div>
      </div>

      <div className="p-4">
        {isLoading ? (
          <p className="text-center py-8">Loading saved posts...</p>
        ) : savedPosts.length === 0 ? (
          <div className="text-center py-20">
            <Bookmark className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">No saved posts yet</h3>
            <p className="text-slate-500">Posts you bookmark will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {savedPosts.map(post => (
              <div key={post.id} className="bg-white p-4 rounded-xl shadow-sm flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    {post.post_image && (
                      <img src={post.post_image} alt="" className="w-12 h-12 rounded-lg object-cover" />
                    )}
                    <div>
                      <h3 className="font-medium text-slate-900">{post.post_title}</h3>
                      <p className="text-sm text-slate-500">by {post.post_author}</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleUnsave(post.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
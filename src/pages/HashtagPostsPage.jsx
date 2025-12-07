import React, { useState, useEffect } from 'react';
import { Post } from '@/entities/all';
import { PostCard } from '../components/shared/PostCard';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from '../components/utils/i18n';

export default function HashtagPostsPage({ hashtagName, hashtagColor, onBack }) {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchPosts = async () => {
      setIsLoading(true);
      try {
        const allPosts = await Post.list('-created_date', 100);
        const filteredPosts = allPosts.filter(p => p.tags && p.tags.includes(hashtagName));
        setPosts(filteredPosts);
      } catch (error) {
        console.error(`Error fetching posts for #${hashtagName}:`, error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPosts();
  }, [hashtagName]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-lg sticky top-0 z-40 border-b border-blue-100 p-4">
        <div className="flex items-center">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors mr-2">
            <ArrowLeft className="w-6 h-6 text-slate-700" />
          </button>
          <span className={`px-4 py-2 rounded-full text-white font-bold text-lg ${hashtagColor}`}>
            #{hashtagName}
          </span>
        </div>
      </div>

      {/* Posts */}
      <div className="p-4 space-y-4">
        {isLoading ? (
          <p className="text-center text-slate-500 py-8">{t('loading')}...</p>
        ) : posts.length > 0 ? (
          posts.map(post => <PostCard key={post.id} post={post} />)
        ) : (
          <div className="text-center py-20">
            <p className="text-lg text-slate-700 font-semibold">{t('no_posts_found_for_hashtag', { hashtag: hashtagName })}</p>
            <p className="text-slate-500">{t('be_the_first_to_post_hashtag')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
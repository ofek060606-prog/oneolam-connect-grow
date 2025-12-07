import React, { useState, useEffect } from 'react';
import { Post } from '@/entities/all';
import { ArrowLeft } from 'lucide-react';
import { toast } from "sonner";
import { CommentSection } from '../components/shared/CommentSection';
import { useTranslation } from '../components/utils/i18n'; // Fixed import
import { PostCard } from '../components/shared/PostCard';

export default function PostDetailPage({ postId, onBack, onChatClick }) {
  const [post, setPost] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchPost = async () => {
      setIsLoading(true);
      try {
        const postData = await Post.get(postId);
        setPost(postData);
      } catch (error) {
        console.error("Failed to fetch post:", error);
        toast.error("Could not load post. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    if (postId) {
      fetchPost();
    }
  }, [postId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div>{t('loading')}...</div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div>Post not found.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-white/80 backdrop-blur-lg sticky top-0 z-40 p-4 border-b border-blue-100 flex items-center">
        <button onClick={onBack} className="p-2 hover:bg-blue-100 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6 text-blue-600" />
        </button>
        <h1 className="text-xl font-bold text-slate-900 ml-4">{t('posts')}</h1>
      </div>

      <div className="p-0">
        <PostCard post={post} onChatClick={onChatClick} isDetailView={true} />
        <div className="px-4 py-2">
            <CommentSection postId={post.id} />
        </div>
      </div>
    </div>
  );
}
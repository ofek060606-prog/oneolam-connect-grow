import React from 'react';
import { Heart, MessageCircle } from 'lucide-react';

export const TrendingPostCard = ({ post, onClick }) => {
  // Don't display posts that look fake or demo-like
  if (!post.created_by || 
      !post.created_by.includes('@') || 
      post.content?.includes('Demo') || 
      post.content?.includes('Sample') ||
      post.author_name?.includes('Demo')) {
    return null;
  }

  return (
    <div
      onClick={() => onClick(post)}
      className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
    >
      {post.image_url && (
        <img
          src={post.image_url}
          alt="Post"
          className="w-full h-24 object-cover rounded-lg mb-3"
        />
      )}
      <p className="text-sm font-medium text-slate-900 line-clamp-2 mb-2">
        {post.content}
      </p>
      <div className="flex items-center text-xs text-slate-500 space-x-3">
        <div className="flex items-center space-x-1">
          <Heart className="w-3 h-3" />
          <span>{post.likes_count || 0}</span>
        </div>
        <div className="flex items-center space-x-1">
          <MessageCircle className="w-3 h-3" />
          <span>{post.comments_count || 0}</span>
        </div>
      </div>
    </div>
  );
};
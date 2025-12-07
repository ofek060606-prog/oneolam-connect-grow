import React, { useState, useEffect } from 'react';
import { Comment, User } from '@/entities/all';
import { toast } from 'sonner';
import { useTranslation } from '../utils/i18n';
import { MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export const CommentSection = ({ postId, onCommentAdded }) => {
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [comments, setComments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  const { t } = useTranslation();

  useEffect(() => {
    const fetchCommentsForPost = async () => {
      setIsLoading(true);
      try {
        const user = await User.me();
        setCurrentUser(user);

        const fetchedComments = await Comment.filter({ post_id: postId });
        setComments(fetchedComments);

      } catch (error) {
        console.error("Failed to fetch comments:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (postId) {
      fetchCommentsForPost();
    } else {
      setIsLoading(false);
    }
  }, [postId]);

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !currentUser || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const newCommentData = {
        post_id: postId,
        content: newComment.trim(),
        author_name: currentUser.full_name,
        author_avatar: currentUser.avatar
      };

      const createdComment = await Comment.create(newCommentData);
      setComments(prevComments => [createdComment, ...prevComments]);

      if (onCommentAdded) {
        onCommentAdded(createdComment);
      }
      
      setNewComment('');
      toast.success("Comment posted successfully");
    } catch (error) {
      console.error("Failed to post comment:", error);
      toast.error("Failed to post comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmitComment();
    }
  };

  return (
    <div className="border-t border-slate-100 bg-slate-50">
      <div className="p-4">
        {/* Comment Input Section */}
        <div className="flex space-x-3 mb-4">
          <img
            src={currentUser?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.full_name || 'A')}&background=random&size=32`}
            alt="Your avatar"
            className="w-8 h-8 rounded-full object-cover"
          />
          <div className="flex-1 flex space-x-2">
            <input
              type="text"
              placeholder={t('writeComment')}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 px-4 py-2 bg-white rounded-full border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
            <button
              onClick={handleSubmitComment}
              disabled={!newComment.trim() || isSubmitting}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                newComment.trim() && !isSubmitting
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : 'bg-slate-200 text-slate-400'
              }`}
            >
              {isSubmitting ? '...' : t('addComment')}
            </button>
          </div>
        </div>

        {/* Comments List Section */}
        <div className="space-y-3">
          {isLoading ? (
            <p className="text-slate-500 text-sm text-center py-4">{t('loading')}</p>
          ) : comments.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">{t('noComments')}</p>
              <p className="text-slate-400 text-sm">{t('beFirstToComment')}</p>
            </div>
          ) : (
            comments.map(comment => (
              <div key={comment.id} className="flex space-x-3">
                <img
                  src={comment.author_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.author_name)}&background=random&size=32`}
                  alt={comment.author_name}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div className="flex-1 bg-white rounded-lg px-3 py-2">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium text-slate-900 text-sm">{comment.author_name}</span>
                    <span className="text-slate-400 text-xs">
                      {comment.created_date
                        ? formatDistanceToNow(new Date(comment.created_date), { addSuffix: true })
                        : t('justNow')
                      }
                    </span>
                  </div>
                  <p className="text-slate-700 text-sm">{comment.content}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
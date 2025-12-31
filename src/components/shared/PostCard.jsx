import React, { useState, useEffect, useCallback } from 'react';
import { Heart, MessageCircle, Share, Bookmark, MoreHorizontal, Trash2, Flag } from 'lucide-react';
import { Like, SavedPost, Comment, User, Post } from '@/entities/all';
import { CommentSection } from './CommentSection';
import { formatDistanceToNowStrict } from 'date-fns';
import { toast } from 'sonner';
import { useTranslation } from '../utils/i18n';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { moderateContent, checkRateLimit } from '../utils/contentModeration';
import { sendSecurityAlert } from '../utils/adminAlerts';

// Utility function for delays to avoid rate limiting
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Add random delay to spread out API calls
const randomDelay = () => Math.random() * 1000; // 0-1 second random delay

export const PostCard = ({ post, onChatClick, onDelete }) => {
  const [showComments, setShowComments] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [commentsCount, setCommentsCount] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState({ like: false, save: false });
  const [hasLoadedInteractions, setHasLoadedInteractions] = useState(false);
  const { t } = useTranslation();

  // Utility function for formatting relative time
  const formatRelativeTime = useCallback((dateString) => {
    if (!dateString) return t('justNow'); // Use translation for "Just now"
    const date = new Date(dateString);
    const now = new Date();

    // If the post was created less than a minute ago, show "Just now"
    if (Math.abs(now.getTime() - date.getTime()) < 60 * 1000) {
      return t('justNow');
    }

    // Otherwise, format relatively (e.g., "5 minutes ago", "2 days ago")
    // Note: For full multilingual support, you would pass a `locale` object here
    // based on the current i18n language (e.g., locale: enUS or he).
    return formatDistanceToNowStrict(date, { addSuffix: true });
  }, [t]);


  const loadUserInteractionsWithRetry = useCallback(async (user, retryCount = 0) => {
    if (hasLoadedInteractions) return;
    
    try {
      // Load user interactions with delays between calls
      const [likes, savedPosts, comments] = await Promise.all([
        Like.filter({ post_id: post.id, user_email: user.email }).catch(() => []),
        delay(200).then(() => SavedPost.filter({ post_id: post.id, created_by: user.email }).catch(() => [])),
        delay(400).then(() => Comment.filter({ post_id: post.id }).catch(() => []))
      ]);

      setIsLiked(likes.length > 0);
      setIsSaved(savedPosts.length > 0);
      setCommentsCount(comments.length);
      
      // Count total likes for this post
      const allLikes = await Like.filter({ post_id: post.id }).catch(() => []);
      setLikesCount(allLikes.length);
      
      setHasLoadedInteractions(true);

    } catch (error) {
      if (error.message.includes('429') || error.message.includes('Rate limit')) {
        if (retryCount < 3) {
          // Exponential backoff: wait longer each retry
          const waitTime = (retryCount + 1) * 2000;
          await delay(waitTime);
          return loadUserInteractionsWithRetry(user, retryCount + 1);
        }
      }
      // Silently fail if we can't load interactions
      console.log('Could not load post interactions:', error.message);
    }
  }, [post.id, hasLoadedInteractions]);

  useEffect(() => {
    const loadUserAndInteractions = async () => {
      try {
        const user = await User.me();
        setCurrentUser(user);
        
        // Add random delay to spread out API calls across different PostCards
        await delay(randomDelay());
        
        // Load interactions with error handling and retries
        await loadUserInteractionsWithRetry(user);
        
      } catch (error) {
        // User not logged in - this is expected
      }
    };

    loadUserAndInteractions();
  }, [loadUserInteractionsWithRetry]);

  const handleLike = async () => {
    if (!currentUser || isLoading.like) return;

    setIsLoading(prev => ({ ...prev, like: true }));
    
    try {
      if (isLiked) {
        // Unlike
        const existingLikes = await Like.filter({ post_id: post.id, user_email: currentUser.email });
        if (existingLikes.length > 0) {
          await Like.delete(existingLikes[0].id);
          setIsLiked(false);
          setLikesCount(prev => Math.max(0, prev - 1));
        }
      } else {
        // Like
        await Like.create({
          post_id: post.id,
          user_email: currentUser.email
        });
        setIsLiked(true);
        setLikesCount(prev => prev + 1);
      }
    } catch (error) {
      if (error.message.includes('429')) {
        toast.error("Please wait a moment before liking again");
      } else {
        toast.error("Could not update like");
      }
    } finally {
      setIsLoading(prev => ({ ...prev, like: false }));
    }
  };

  const handleSave = async () => {
    if (!currentUser || isLoading.save) return;

    setIsLoading(prev => ({ ...prev, save: true }));
    
    try {
      if (isSaved) {
        // Unsave
        const existingSaves = await SavedPost.filter({ post_id: post.id, created_by: currentUser.email });
        if (existingSaves.length > 0) {
          await SavedPost.delete(existingSaves[0].id);
          setIsSaved(false);
          toast.success(t('saved') + " removed");
        }
      } else {
        // Save
        await SavedPost.create({
          post_id: post.id,
          post_title: (post.content || '').substring(0, 50) + ((post.content?.length || 0) > 50 ? '...' : ''),
          post_author: post.author_name || 'Unknown',
          post_image: post.image_url
        });
        setIsSaved(true);
        toast.success(t('saved'));
      }
    } catch (error) {
      if (error.message.includes('429')) {
        toast.error("Please wait a moment before saving again");
      } else {
        toast.error("Could not save post");
      }
    } finally {
      setIsLoading(prev => ({ ...prev, save: false }));
    }
  };

  const handleDelete = async () => {
    if (!currentUser) return;
    if (!window.confirm(t('areYouSureDelete'))) return;

    try {
      await Post.delete(post.id);
      toast.success(t('postDeleted'));
      if (onDelete) onDelete();
    } catch (error) {
      console.error("Failed to delete post:", error);
      toast.error(t('couldNotDeletePost'));
    }
  };
  
  const handleReportPost = async () => {
    if (!currentUser) {
        toast.info(t('mustBeLoggedIn'));
        return;
    }

    // בדיקת rate limiting לדיווחים
    const rateLimitCheck = checkRateLimit(currentUser?.email || 'anonymous', 'report', 3, 60);
    if (!rateLimitCheck.allowed) {
      toast.error(`Too many reports! Please wait ${rateLimitCheck.resetIn} minutes.`);
      return;
    }

    const reason = window.prompt("Please specify the reason for reporting this post:");
    if (!reason) return;

    // בדיקת תוכן הדיווח עצמו
    const moderationResult = await moderateContent(reason);
    if (!moderationResult.safe) {
      toast.error("Your report contains inappropriate language. Please rephrase.");
      return;
    }

    if (!window.confirm(t('areYouSureReportPost'))) return;

    try {
      // דיווח מתקדם יותר עם פרטים
      const reportDetails = {
        post_id: post.id,
        post_content: (post.content || '').substring(0, 100),
        post_author: post.author_name || 'Unknown',
        reason: reason,
        reporter_ip: 'hidden_for_privacy',
        timestamp: new Date().toISOString()
      };

      await sendSecurityAlert('content_report', post.created_by, post.author_name || 'Unknown', 
        `Post reported by ${currentUser.full_name}. Reason: ${reason}. Post content: "${(post.content || '').substring(0, 100)}..."`);

      toast.success(t('postReported'));
    } catch (error) {
      console.error('Error reporting post:', error);
      toast.error(t('reportFailed'));
    }
  };

  const handleShare = async () => {
    // Construct a shareable text and URL based on the post
    const shareText = `Check out this post by ${post.author_name || 'someone'}: ${post.content?.substring(0, 100) || 'this content'}${post.content?.length > 100 ? '...' : ''}`;
    // Assuming the current page URL might be relevant, or construct a specific post URL if available
    const shareUrl = window.location.href; // Or a more specific URL like `${window.location.origin}/post/${post.id}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'OneOlam Post', // A title for the share dialog
          text: shareText, // The main text to share
          url: shareUrl, // The URL to share
        });
        toast.success('Post shared!');
      } catch (error) {
        // The user cancelled the share, or there was another error
        if (error.name !== 'AbortError') { // AbortError means user cancelled, no need to show error
          fallbackShare(shareText, shareUrl); // Fallback for other errors or if the share dialog isn't supported for some reason
        }
      }
    } else {
      // Fallback for browsers that don't support navigator.share
      fallbackShare(shareText, shareUrl);
    }
  };

  const fallbackShare = (shareText, shareUrl) => {
    if (navigator.clipboard) {
      // Use Clipboard API if available
      navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      toast.success('Post link copied to clipboard!');
    } else {
      // Fallback for older browsers: create a temporary textarea to copy text
      const textArea = document.createElement('textarea');
      textArea.value = `${shareText}\n${shareUrl}`;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy'); // Deprecated but widely supported
        toast.success('Post link copied to clipboard!');
      } catch (err) {
        toast.error('Could not share post');
      } finally {
        document.body.removeChild(textArea);
      }
    }
  };

  const handlePostClick = () => {
    window.dispatchEvent(new CustomEvent('navigateTo', { 
      detail: { page: 'post-detail', postId: post.id } 
    }));
  };

  const handleAuthorClick = () => {
    window.dispatchEvent(new CustomEvent('navigateTo', { 
      detail: { page: 'user-profile', email: post.created_by } 
    }));
  };

  const handleChatClick = () => {
    if (onChatClick && post.created_by && post.author_name) {
      onChatClick(post.created_by, post.author_name);
    }
  };

  const canDelete = currentUser && (currentUser.email === post.created_by || currentUser.role === 'admin');

  return (
    <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-lg mb-6 overflow-hidden border border-blue-100">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div onClick={handleAuthorClick} className="flex items-center space-x-3 cursor-pointer">
          <img
            src={post.author_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author_name || 'User')}&background=random&size=40`}
            alt={post.author_name || 'User'}
            className="w-10 h-10 rounded-full object-cover border-2 border-blue-100"
          />
          <div>
            <h3 className="font-semibold text-slate-900">{post.author_name || 'Unknown User'}</h3>
            <p className="text-xs text-slate-500">
              {post.community_name && <span className="text-blue-600">{post.community_name} • </span>}
              {formatRelativeTime(post.created_date)}
            </p>
          </div>
        </div>
        {/* DropdownMenu moved to actions bar */}
      </div>

      {/* Content */}
      <div onClick={handlePostClick} className="px-4 pb-3 cursor-pointer">
        <p className="text-slate-800 leading-relaxed">{post.content || ''}</p>
        {/* Retaining hashtags display as per the request title */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {post.tags.map((tag, index) => (
              <span key={index} className="text-blue-600 text-sm">#{tag}</span>
            ))}
          </div>
        )}
      </div>

      {/* Image/Video */}
      {(post.image_url || post.video_url) && (
        <div onClick={handlePostClick} className="cursor-pointer">
          {post.image_url && (
            <img
              src={post.image_url}
              alt="Post content"
              className="w-full h-64 sm:h-80 object-cover"
            />
          )}
          {post.video_url && (
            <video
              controls
              className="w-full h-64 sm:h-80 object-cover"
            >
              <source src={post.video_url} type="video/mp4" />
            </video>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
        <div className="flex items-center space-x-6">
          <button 
            onClick={handleLike}
            disabled={isLoading.like || !hasLoadedInteractions}
            className={`flex items-center space-x-2 transition-colors ${
              isLiked ? 'text-red-500' : 'text-slate-500 hover:text-red-500'
            } ${isLoading.like ? 'opacity-50' : ''}`}
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
            <span className="text-sm font-medium">{likesCount}</span>
          </button>
          
          <button 
            onClick={() => setShowComments(!showComments)}
            className="flex items-center space-x-2 text-slate-500 hover:text-blue-500 transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm font-medium">{commentsCount}</span>
          </button>
          
          <button 
            onClick={handleShare}
            className="flex items-center space-x-2 text-slate-500 hover:text-green-500 transition-colors"
          >
            <Share className="w-5 h-5" />
            <span className="text-sm font-medium">{t('share')}</span>
          </button>
        </div>
        
        <div className="flex items-center space-x-2">
          <button 
            onClick={handleSave}
            disabled={isLoading.save || !hasLoadedInteractions}
            className={`p-2 rounded-full transition-colors ${
              isSaved ? 'text-blue-500' : 'text-slate-500 hover:text-blue-500'
            } ${isLoading.save ? 'opacity-50' : ''}`}
          >
            <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
          </button>
          
          <DropdownMenu>
            <DropdownMenuTrigger className="p-2 text-slate-500 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors">
              <MoreHorizontal className="w-5 h-5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canDelete && (
                <DropdownMenuItem onClick={handleDelete} className="text-red-600 hover:text-red-700">
                  <Trash2 className="w-4 h-4 mr-2" />
                  {t('delete')}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handleReportPost}>
                <Flag className="w-4 h-4 mr-2" />
                {t('report')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Comments */}
      {showComments && (
        <div className="border-t border-blue-50">
          <CommentSection postId={post.id} currentUser={currentUser} onCommentAdded={loadUserInteractionsWithRetry} />
        </div>
      )}
    </div>
  );
};

// Make sure we have a default export
export default PostCard;
import React, { useState, useEffect } from 'react';
import { User, Post, Notification } from '@/entities/all';
import { UploadFile } from '@/integrations/Core';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Image, X, Loader2 } from 'lucide-react';
import { useTranslation } from '../utils/i18n';
import { moderateContent, checkRateLimit } from '../utils/contentModeration';

export const CreatePost = ({ onPostCreated, communityId = null, communityName = null }) => {
  const [content, setContent] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [isPosting, setIsPosting] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const { t } = useTranslation();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await User.me();
        setCurrentUser(user);
      } catch (error) {
        console.error("Failed to load current user:", error);
        toast.error("Failed to load user data. Please refresh.");
      }
    };
    loadUser();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type.startsWith('image/')) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error("Image must be smaller than 10MB");
        return;
      }
      setSelectedImage(file);
      setSelectedVideo(null);
      setPreviewUrl(URL.createObjectURL(file));
    } else if (file.type.startsWith('video/')) {
      if (file.size > 50 * 1024 * 1024) { // 50MB limit
        toast.error("Video must be smaller than 50MB");
        return;
      }
      setSelectedVideo(file);
      setSelectedImage(null);
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      toast.error("Unsupported file type. Please select an image or video.");
    }
  };

  const removeMedia = () => {
    setSelectedImage(null);
    setSelectedVideo(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && !selectedImage && !selectedVideo) {
      toast.error("Please write something or add media to post.");
      return;
    }

    if (!currentUser) {
        toast.error("User data not loaded. Please try again.");
        return;
    }
    
    // בדיקת rate limiting
    const rateLimitCheck = checkRateLimit(currentUser.email || 'anonymous', 'create_post', 5, 15);
    if (!rateLimitCheck.allowed) {
      toast.error(`Too many posts! Please wait ${rateLimitCheck.resetIn} minutes.`);
      return;
    }

    setIsPosting(true);
    try {
      // בדיקת תוכן מסוכן
      if (content.trim()) {
        const moderationResult = await moderateContent(content);
        if (!moderationResult.safe) {
          toast.error("Content blocked: This post contains inappropriate content that violates our community guidelines.");
          
          // דיווח למנהלים על תוכן מסוכן
          if (moderationResult.severity === 'high') {
            try {
              await Notification.create({
                recipient_email: 'admin@oneolam.com', // כתובת מנהל
                sender_email: currentUser.email,
                sender_name: currentUser.full_name,
                type: 'dangerous_content',
                content: `SECURITY ALERT: User ${currentUser.full_name} attempted to post dangerous content. Reason: ${moderationResult.reason}. Content: "${content.substring(0, 100)}..."`
              });
            } catch (notificationError) {
              console.error('Failed to send security alert:', notificationError);
            }
          }
          
          setIsPosting(false);
          return;
        }
      }

      let imageUrl = null;
      let videoUrl = null;

      if (selectedImage) {
        const { file_url } = await UploadFile({ file: selectedImage });
        imageUrl = file_url;
      }

      if (selectedVideo) {
        const { file_url } = await UploadFile({ file: selectedVideo });
        videoUrl = file_url;
      }

      // איסוף hashtags
      const hashtags = content.match(/#[א-תa-zA-Z0-9_]+/g) || [];

      // Create post with community association
      await Post.create({
        content: content.trim(),
        image_url: imageUrl,
        video_url: videoUrl,
        author_name: currentUser.full_name, // Changed from 'user.full_name' to 'currentUser.full_name'
        author_avatar: currentUser.avatar, // Changed from 'user.avatar' to 'currentUser.avatar'
        tags: hashtags, // Changed from 'extractHashtags(content)' to 'hashtags'
        community_id: communityId || null, // Added communityId
        community_name: communityName || null // Added communityName
      });

      toast.success(t('posted'));
      setContent('');
      setSelectedImage(null);
      setSelectedVideo(null);
      setPreviewUrl(null);
      
      if (onPostCreated) onPostCreated();
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Could not create post');
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="bg-white p-4 rounded-2xl shadow-md mb-6">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={t('whatsOnYourMind')}
        className="border-none focus:ring-0 text-base"
      />
      
      {previewUrl && (
        <div className="mt-4 relative">
          {selectedImage && (
            <img src={previewUrl} alt="Preview" className="rounded-lg max-h-80 w-full object-cover" />
          )}
          {selectedVideo && (
            <video src={previewUrl} controls className="rounded-lg max-h-80 w-full" />
          )}
          <button onClick={removeMedia} className="absolute top-2 right-2 bg-black/50 p-1.5 rounded-full text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      <div className="flex justify-between items-center mt-4">
        <div className="flex space-x-2">
          <label htmlFor="media-upload" className="cursor-pointer p-2 hover:bg-blue-50 rounded-full text-blue-600">
            <Image className="w-6 h-6" />
          </label>
          <input
            id="media-upload"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
        <Button onClick={handleSubmit} disabled={isPosting}>
          {isPosting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          {isPosting ? t('posting') : t('post')}
        </Button>
      </div>
    </div>
  );
};
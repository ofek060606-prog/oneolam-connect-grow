import React, { useState, useEffect } from 'react';
import { User } from '@/entities/all';
import { UploadFile } from '@/integrations/Core';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Image, X, Loader2 } from 'lucide-react';
import { useTranslation } from '../utils/i18n';
import { createPost } from "@/functions/createPost";

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
    
    setIsPosting(true);
    try {
      // Upload media only; all content moderation, rate-limiting and post
      // creation happen server-side in the createPost backend function, so
      // they cannot be bypassed by calling the SDK directly from the browser.
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

      const res = await createPost({
        content: content.trim(),
        image_url: imageUrl,
        video_url: videoUrl,
        community_name: communityName || null
      });

      const data = res?.data;
      if (data && data.success) {
        toast.success(t('posted'));
        setContent('');
        setSelectedImage(null);
        setSelectedVideo(null);
        setPreviewUrl(null);
        if (onPostCreated) onPostCreated();
      } else {
        throw new Error((data && data.error) || 'Could not create post');
      }
    } catch (error) {
      const errData = error?.response?.data || {};
      if (errData.error === 'rate_limited') {
        toast.error(`Too many posts! Please wait ${errData.resetIn || 15} minutes.`);
      } else if (errData.error === 'content_blocked') {
        toast.error("Content blocked: This post contains inappropriate content that violates our community guidelines.");
      } else {
        toast.error(error?.message || 'Could not create post');
      }
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
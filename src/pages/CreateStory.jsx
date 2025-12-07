
import React, { useState, useRef } from 'react';
import { User, Story } from '@/entities/all';
import { UploadFile } from '@/integrations/Core';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, CheckCircle, Image, Camera, FileVideo, Sparkles } from 'lucide-react';
import { toast } from "sonner";
import { add } from 'date-fns';
import { useTranslation } from '../components/utils/i18n';

export default function CreateStoryPage({ onBack }) {
  const [mediaFile, setMediaFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showOptions, setShowOptions] = useState(true);
  const { t } = useTranslation();
  
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const videoInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMediaFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setShowOptions(false);
      
      if (file.type.startsWith('image/')) {
        setMediaType('image');
      } else if (file.type.startsWith('video/')) {
        setMediaType('video');
      }
    }
  };

  const handleCameraCapture = () => {
    cameraInputRef.current.click();
  };

  const handleGallerySelect = () => {
    fileInputRef.current.click();
  };

  const handleVideoCapture = () => {
    videoInputRef.current.click();
  };

  const handlePostStory = async () => {
    if (!mediaFile) {
      toast.error(t('createStory_selectError'));
      return;
    }

    const maxSize = mediaType === 'video' ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
    if (mediaFile.size > maxSize) {
      toast.error(`${t('createStory_sizeError')} ${mediaType === 'video' ? '50MB' : '5MB'}`);
      return;
    }

    setIsLoading(true);
    try {
      const user = await User.me();
      const { file_url } = await UploadFile({ file: mediaFile });
      
      const expiresAt = add(new Date(), { hours: 24 });

      const storyData = {
        author_name: user.full_name,
        author_avatar: user.avatar,
        expires_at: expiresAt.toISOString(),
      };

      if (mediaType === 'video') {
        storyData.video_url = file_url;
      } else {
        storyData.image_url = file_url;
      }

      await Story.create(storyData);
      toast.success(t('createStory_success'));
      onBack();

    } catch (error) {
      console.error("Error posting story:", error);
      toast.error(t('createStory_postError'));
    } finally {
      setIsLoading(false);
    }
  };

  const resetSelection = () => {
    setMediaFile(null);
    setPreviewUrl(null);
    setMediaType(null);
    setShowOptions(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-6 bg-black/20 backdrop-blur-lg">
        <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold">{t('createStory_title')}</h1>
        <div className="w-10"></div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col p-6">
        {showOptions && (
          <div className="flex-1 flex flex-col justify-center space-y-6">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Sparkles className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold mb-2">{t('createStory_shareMoment')}</h2>
              <p className="text-slate-300">{t('createStory_howTo')}</p>
            </div>

            {/* אופציות יפות */}
            <div className="space-y-4">
              {/* צלם תמונה */}
              <button
                onClick={handleCameraCapture}
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 p-6 rounded-2xl flex items-center justify-between hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 transform hover:scale-105 shadow-xl"
              >
                <div className="flex items-center space-x-4">
                  <div className="bg-white/20 p-3 rounded-xl">
                    <Camera className="w-6 h-6" />
                  </div>
                  <div className="text-left rtl:text-right">
                    <h3 className="font-bold text-lg">{t('createStory_takePicture')}</h3>
                    <p className="text-blue-100">{t('createStory_takePicture_desc')}</p>
                  </div>
                </div>
                <div className="bg-white/10 p-2 rounded-full">
                  <ArrowLeft className="w-5 h-5 rtl:rotate-180" />
                </div>
              </button>

              {/* צלם סרטון */}
              <button
                onClick={handleVideoCapture}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 p-6 rounded-2xl flex items-center justify-between hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 shadow-xl"
              >
                <div className="flex items-center space-x-4">
                  <div className="bg-white/20 p-3 rounded-xl">
                    <FileVideo className="w-6 h-6" />
                  </div>
                  <div className="text-left rtl:text-right">
                    <h3 className="font-bold text-lg">{t('createStory_recordVideo')}</h3>
                    <p className="text-purple-100">{t('createStory_recordVideo_desc')}</p>
                  </div>
                </div>
                <div className="bg-white/10 p-2 rounded-full">
                  <ArrowLeft className="w-5 h-5 rtl:rotate-180" />
                </div>
              </button>

              {/* גלריה */}
              <button
                onClick={handleGallerySelect}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 p-6 rounded-2xl flex items-center justify-between hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 transform hover:scale-105 shadow-xl"
              >
                <div className="flex items-center space-x-4">
                  <div className="bg-white/20 p-3 rounded-xl">
                    <Image className="w-6 h-6" />
                  </div>
                  <div className="text-left rtl:text-right">
                    <h3 className="font-bold text-lg">{t('createStory_fromGallery')}</h3>
                    <p className="text-emerald-100">{t('createStory_fromGallery_desc')}</p>
                  </div>
                </div>
                <div className="bg-white/10 p-2 rounded-full">
                  <ArrowLeft className="w-5 h-5 rtl:rotate-180" />
                </div>
              </button>
            </div>
          </div>
        )}

        {/* תצוגה מקדימה */}
        {!showOptions && previewUrl && (
          <div className="flex-1 flex flex-col">
            <div className="flex-1 bg-black/20 rounded-2xl mb-6 overflow-hidden">
              {mediaType === 'video' ? (
                <video
                  src={previewUrl}
                  controls
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            {/* כפתורים */}
            <div className="space-y-3">
              <Button
                onClick={handlePostStory}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white py-4 rounded-xl text-lg font-bold shadow-xl"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{t('createStory_posting')}</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <CheckCircle className="w-5 h-5" />
                    <span>{t('createStory_postButton')}</span>
                  </div>
                )}
              </Button>

              <Button
                onClick={resetSelection}
                variant="outline"
                className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20 py-3 rounded-xl"
              >
                {t('createStory_selectAnother')}
              </Button>
            </div>
          </div>
        )}

        {/* Inputs נסתרים */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          onChange={handleFileChange}
          className="hidden"
        />
        
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />
        
        <input
          ref={videoInputRef}
          type="file"
          accept="video/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  );
}

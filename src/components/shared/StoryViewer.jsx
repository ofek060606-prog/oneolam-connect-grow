import React, { useState, useEffect } from 'react';
import { X, Heart, MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export const StoryViewer = ({ story, onClose }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          onClose();
          return 100;
        }
        return prev + 2; // 5 second story (100/2 = 50 intervals of 100ms)
      });
    }, 100);

    return () => clearInterval(timer);
  }, [onClose]);

  const handleStoryClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const midpoint = rect.width / 2;
    
    if (clickX < midpoint) {
      // Clicked left side - go to previous (for now just close)
      onClose();
    } else {
      // Clicked right side - go to next (for now just close)
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Progress bar */}
      <div className="h-1 bg-gray-600">
        <div 
          className="h-full bg-white transition-all duration-100 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between p-4 text-white">
        <div className="flex items-center space-x-3">
          <img 
            src={story.author_avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face'}
            alt={story.author_name}
            className="w-8 h-8 rounded-full object-cover"
          />
          <div>
            <p className="font-semibold text-sm">{story.author_name}</p>
            <p className="text-xs opacity-70">
              {formatDistanceToNow(new Date(story.created_date), { addSuffix: true })}
            </p>
          </div>
        </div>
        <button onClick={onClose} className="p-2">
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Story Content */}
      <div className="flex-1 relative" onClick={handleStoryClick}>
        <img 
          src={story.image_url}
          alt="Story"
          className="w-full h-full object-cover"
        />
        {story.text_overlay && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-white text-lg font-bold text-center px-4 py-2 bg-black/50 rounded-lg">
              {story.text_overlay}
            </p>
          </div>
        )}
      </div>

      {/* Story Actions */}
      <div className="p-4 flex items-center justify-center space-x-6">
        <button className="p-3 bg-white/20 rounded-full text-white">
          <Heart className="w-6 h-6" />
        </button>
        <button className="p-3 bg-white/20 rounded-full text-white">
          <MessageCircle className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};
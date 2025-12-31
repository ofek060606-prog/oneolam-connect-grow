import React from 'react';
import { Plus } from 'lucide-react';

export const StoryCircle = ({ story, isOwn = false, isCreate = false, onClick }) => {
  const gradientColors = [
    'from-pink-500 to-orange-500',
    'from-purple-500 to-pink-500', 
    'from-blue-500 to-purple-500',
    'from-green-500 to-blue-500',
    'from-yellow-500 to-red-500',
    'from-indigo-500 to-purple-500',
    'from-teal-500 to-green-500',
    'from-red-500 to-pink-500'
  ];
  
  // יצירת צבע קבוע לכל משתמש על בסיס השם שלו
  const getGradientColor = (authorName) => {
    if (!authorName) return gradientColors[0];
    const hash = authorName.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return gradientColors[Math.abs(hash) % gradientColors.length];
  };

  if (isCreate) {
    return (
      <div 
        onClick={onClick}
        className="flex flex-col items-center space-y-2 cursor-pointer"
      >
        <div className="w-16 h-16 bg-gradient-to-tr from-gray-300 to-gray-400 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
          <Plus className="w-8 h-8 text-white" />
        </div>
        <span className="text-xs font-medium text-slate-700 text-center leading-tight max-w-16">
          Your Story
        </span>
      </div>
    );
  }

  if (!story || !story.author_name) {
    return null; // Don't render if story is invalid
  }

  const gradientClass = getGradientColor(story.author_name);

  return (
    <div 
      onClick={onClick}
      className="flex flex-col items-center space-y-2 cursor-pointer"
    >
      <div className={`w-16 h-16 bg-gradient-to-tr ${gradientClass} rounded-full p-0.5 shadow-lg`}>
        <div className="w-full h-full bg-white rounded-full p-0.5">
          <img 
            src={story.author_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(story.author_name || 'User')}&background=random&size=60`}
            alt={story.author_name} 
            className="w-full h-full rounded-full object-cover"
          />
        </div>
      </div>
      <span className="text-xs font-medium text-slate-700 text-center leading-tight max-w-16">
        {story.author_name}
      </span>
    </div>
  );
};
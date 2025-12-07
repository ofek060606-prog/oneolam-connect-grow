import React from 'react';
import { Users } from 'lucide-react';

export const CommunityHorizontalCard = ({ community, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl shadow-sm border border-slate-100 p-3 hover:shadow-md hover:border-blue-200 cursor-pointer transition-all w-48 flex-shrink-0"
    >
      <img
        src={community.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(community.name)}&background=random&size=128`}
        alt={community.name}
        className="w-full h-24 object-cover rounded-lg mb-3"
      />
      <h3 className="font-semibold text-sm text-slate-800 line-clamp-1">{community.name}</h3>
      <div className="flex items-center space-x-1 mt-1 text-xs text-slate-500">
        <Users className="w-3 h-3" />
        <span>{community.member_count || 1} Members</span>
      </div>
    </div>
  );
};
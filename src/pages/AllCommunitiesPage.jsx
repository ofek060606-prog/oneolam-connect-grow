import React, { useState, useEffect } from 'react';
import { Community } from '@/entities/all';
import { ArrowLeft, Search, Users } from 'lucide-react';
import { CommunityHorizontalCard } from '../components/explore/CommunityHorizontalCard';
import { LanguageProvider, useTranslation } from '../components/utils/i18n';

function AllCommunitiesContent({ onBack }) {
  const { t } = useTranslation();
  const [communities, setCommunities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      const data = await Community.filter({ is_approved: true }, '-member_count');
      setCommunities(data);
      setIsLoading(false);
    };
    load();
  }, []);

  const filtered = communities.filter(c =>
    c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCommunityClick = (community) => {
    window.dispatchEvent(new CustomEvent('navigateTo', {
      detail: { page: 'community', communityId: community.id, communityName: community.name }
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 pb-20">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-lg sticky top-0 z-40 border-b border-blue-100 p-4">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </button>
          <h1 className="text-xl font-bold text-slate-900">{t('popularCommunities')}</h1>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search communities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-100 rounded-xl border-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm"
          />
        </div>
      </div>

      <div className="px-4 pt-4 space-y-3">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white p-4 rounded-xl shadow-sm animate-pulse">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-slate-200 rounded-lg" />
                <div className="flex-1">
                  <div className="w-32 h-4 bg-slate-200 rounded mb-2" />
                  <div className="w-20 h-3 bg-slate-200 rounded" />
                </div>
              </div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="font-medium">No communities found</p>
          </div>
        ) : (
          filtered.map(community => (
            <CommunityHorizontalCard
              key={community.id}
              community={community}
              onClick={() => handleCommunityClick(community)}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default function AllCommunitiesPage({ onBack }) {
  return (
    <LanguageProvider>
      <AllCommunitiesContent onBack={onBack} />
    </LanguageProvider>
  );
}
import React, { useState, useEffect } from 'react';
import { Community, CommunityMember, User, Post } from '@/entities/all';
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, Users, Loader2, UserPlus, UserCheck } from 'lucide-react';
import { useTranslation } from '../components/utils/i18n';
import { PostCard } from '../components/shared/PostCard';

export default function CommunityPage({ communityId, communityName, onBack }) {
  const [community, setCommunity] = useState(null);
  const [posts, setPosts] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    loadCommunityData();
  }, [communityId]);

  const loadCommunityData = async () => {
    setIsLoading(true);
    try {
      const user = await User.me();
      setCurrentUser(user);
      
      // Get community details
      const communityData = await Community.get(communityId);
      setCommunity(communityData);
      
      // Check if user is a member
      const memberCheck = await CommunityMember.filter({
        community_id: communityId,
        member_email: user.email
      });
      setIsMember(memberCheck.length > 0);
      
      // Get posts from this community
      const communityPosts = await Post.filter({ community_name: communityId }, '-created_date', 20);
      setPosts(communityPosts);
      
    } catch (error) {
      console.error('Error loading community:', error);
      toast.error('לא ניתן לטעון את הקהילה');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinCommunity = async () => {
    if (!currentUser) {
      toast.error(t('mustBeLoggedIn'));
      return;
    }

    setIsJoining(true);
    try {
      await CommunityMember.create({
        community_id: communityId,
        member_email: currentUser.email,
        member_name: currentUser.full_name,
        member_avatar: currentUser.avatar
      });
      
      // Update member count
      const updatedMemberCount = (community.member_count || 1) + 1;
      await Community.update(communityId, {
        member_count: updatedMemberCount
      });
      
      setIsMember(true);
      setCommunity({ ...community, member_count: updatedMemberCount });
      toast.success('הצטרפת לקהילה בהצלחה! 🎉');
      
      // Reload to show posts
      loadCommunityData();
    } catch (error) {
      console.error('Error joining community:', error);
      toast.error('לא ניתן להצטרף לקהילה');
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeaveCommunity = async () => {
    if (!currentUser) return;

    setIsJoining(true);
    try {
      const memberRecords = await CommunityMember.filter({
        community_id: communityId,
        member_email: currentUser.email
      });
      
      if (memberRecords.length > 0) {
        await CommunityMember.delete(memberRecords[0].id);
        
        // Update member count
        const updatedMemberCount = Math.max((community.member_count || 1) - 1, 1);
        await Community.update(communityId, {
          member_count: updatedMemberCount
        });
        
        setIsMember(false);
        setCommunity({ ...community, member_count: updatedMemberCount });
        setPosts([]); // Clear posts when leaving
        toast.success('עזבת את הקהילה');
      }
    } catch (error) {
      console.error('Error leaving community:', error);
      toast.error('לא ניתן לעזוב את הקהילה');
    } finally {
      setIsJoining(false);
    }
  };

  const handleChatClick = (email, name) => {
    window.dispatchEvent(new CustomEvent('navigateToChat', { detail: { email, name } }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!community) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-slate-700 mb-4">קהילה לא נמצאה</p>
          <Button onClick={onBack}>חזור</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 pb-20">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-lg sticky top-0 z-40 border-b border-blue-100">
        <div className="flex items-center p-4">
          <button onClick={onBack} className="p-2 hover:bg-blue-100 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6 text-blue-600" />
          </button>
          <h1 className="text-xl font-bold text-slate-900 ml-4">{community.name}</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Community Info Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {community.image_url && (
            <img src={community.image_url} alt={community.name} className="w-full h-48 object-cover" />
          )}
          <div className="p-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">{community.name}</h2>
            <p className="text-slate-600 mb-4">{community.description}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-sm text-slate-500">
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4" />
                  <span>{community.member_count || 1} {t('members')}</span>
                </div>
                {community.category && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                    {community.category}
                  </span>
                )}
              </div>
              
              {/* Join/Leave Button */}
              {currentUser && (
                <Button
                  onClick={isMember ? handleLeaveCommunity : handleJoinCommunity}
                  disabled={isJoining}
                  size="lg"
                  className={isMember 
                    ? "bg-slate-200 text-slate-700 hover:bg-slate-300" 
                    : "bg-blue-500 hover:bg-blue-600 text-white"
                  }
                >
                  {isJoining ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : isMember ? (
                    <>
                      <UserCheck className="w-4 h-4 mr-2" />
                      חבר
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      הצטרף
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Posts Section */}
        {isMember ? (
          posts.length > 0 ? (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900">פוסטים בקהילה</h3>
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onChatClick={handleChatClick}
                  onDelete={loadCommunityData}
                />
              ))}
            </div>
          ) : (
            <div className="text-center p-8 bg-white rounded-2xl shadow-sm">
              <p className="text-lg font-semibold text-slate-700 mb-2">אין פוסטים עדיין</p>
              <p className="text-slate-500">היה הראשון לפרסם בקהילה!</p>
            </div>
          )
        ) : (
          <div className="text-center p-8 bg-white rounded-2xl shadow-sm">
            <UserPlus className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-lg font-semibold text-slate-700 mb-2">הצטרף כדי לראות פוסטים</p>
            <p className="text-slate-500 mb-4">רק חברי הקהילה יכולים לראות ולפרסם פוסטים</p>
            <Button onClick={handleJoinCommunity} disabled={isJoining} className="bg-blue-500 hover:bg-blue-600">
              {isJoining ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <UserPlus className="w-4 h-4 mr-2" />
              )}
              הצטרף עכשיו
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
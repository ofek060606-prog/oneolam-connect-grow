
import React, { useState, useEffect, useRef } from 'react';
import { CommunityMessage, DailyMessageCount, User, Post } from '@/entities/all';
import { ArrowLeft, Send, Users, Crown, Lock, Plus, MessageCircle, Camera } from 'lucide-react';
import { useTranslation } from '../components/utils/i18n';
import { PostCard } from '../components/shared/PostCard';
import { UploadFile } from '@/integrations/Core';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function InterestCommunityPage({ interestName, interestColor, onBack }) {
  const [activeTab, setActiveTab] = useState('posts');
  const [messages, setMessages] = useState([]);
  const [posts, setPosts] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [newPost, setNewPost] = useState('');
  const [postImage, setPostImage] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [todayMessageCount, setTodayMessageCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const messagesEndRef = useRef(null);
  const { t } = useTranslation();

  const MAX_FREE_MESSAGES = 10;

  useEffect(() => {
    loadData();
  }, [interestName]);

  useEffect(() => {
    if (activeTab === 'chat') {
      scrollToBottom();
    }
  }, [messages, activeTab]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const user = await User.me();
      setCurrentUser(user);

      // Load posts for this community
      const communityPosts = await Post.filter(
        { community_name: interestName },
        '-created_date',
        20
      );
      setPosts(communityPosts);

      // Load messages for this community
      const communityMessages = await CommunityMessage.filter(
        { community_name: interestName },
        '-created_date',
        50
      );
      setMessages(communityMessages);

      // Load today's message count for user IN THIS SPECIFIC COMMUNITY
      const today = format(new Date(), 'yyyy-MM-dd');
      const counts = await DailyMessageCount.filter({
        user_email: user.email,
        community_name: interestName,
        date: today
      });
      setTodayMessageCount(counts.length > 0 ? counts[0].message_count : 0);

    } catch (error) {
      console.error('Error loading community data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const canSendMessage = () => {
    if (!currentUser) return false;
    if (currentUser.subscription_tier === 'premium') return true;
    return todayMessageCount < MAX_FREE_MESSAGES;
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5MB");
      return;
    }

    setIsUploadingImage(true);
    try {
      const { file_url } = await UploadFile({ file });
      setPostImage(file_url);
      toast.success("Image uploaded!");
    } catch (error) {
      console.error("Failed to upload image", error);
      toast.error("Could not upload image. Please try again.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const createPost = async () => {
    if (!newPost.trim() || !currentUser) return;
    
    setIsPosting(true);
    try {
      const postData = {
        content: newPost,
        author_name: currentUser.full_name,
        author_avatar: currentUser.avatar,
        community_name: interestName,
        likes_count: 0,
        comments_count: 0
      };

      if (postImage) {
        postData.image_url = postImage;
      }

      await Post.create(postData);
      setNewPost('');
      setPostImage(null);
      loadData(); // Refresh posts
      toast.success("Post shared with the community!");

    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Could not create post. Please try again.');
    } finally {
      setIsPosting(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUser) return;

    if (!canSendMessage()) {
      toast.error(`You've reached your daily limit of 10 messages in ${interestName}. Upgrade to Premium for unlimited messaging!`);
      return;
    }

    try {
      const message = await CommunityMessage.create({
        community_name: interestName,
        sender_name: currentUser.full_name,
        sender_avatar: currentUser.avatar,
        content: newMessage
      });

      setMessages(prev => [...prev, message]);
      setNewMessage('');

      // Update daily message count for free users IN THIS SPECIFIC COMMUNITY
      if (currentUser.subscription_tier !== 'premium') {
        const today = format(new Date(), 'yyyy-MM-dd');
        const newCount = todayMessageCount + 1;
        
        try {
          const existingCounts = await DailyMessageCount.filter({
            user_email: currentUser.email,
            community_name: interestName,
            date: today
          });

          if (existingCounts.length > 0) {
            await DailyMessageCount.update(existingCounts[0].id, {
              message_count: newCount
            });
          } else {
            await DailyMessageCount.create({
              user_email: currentUser.email,
              community_name: interestName,
              date: today,
              message_count: newCount
            });
          }
          setTodayMessageCount(newCount);
        } catch (countError) {
          console.error('Error updating message count:', countError);
        }
      }

    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Could not send message. Please try again.');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (activeTab === 'chat') {
        sendMessage();
      } else {
        createPost();
      }
    }
  };

  const isPremium = currentUser?.subscription_tier === 'premium';
  const remainingMessages = isPremium ? '∞' : Math.max(0, MAX_FREE_MESSAGES - todayMessageCount);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <p className="text-lg text-slate-700">Loading community...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col pb-20">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-lg sticky top-0 z-40 p-4 border-b border-blue-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <button onClick={onBack} className="p-2 hover:bg-blue-100 rounded-full transition-colors">
              <ArrowLeft className="w-6 h-6 text-blue-600" />
            </button>
            <div className="ml-4">
              <h1 className="text-xl font-bold text-slate-900">{interestName}</h1>
              <div className="flex items-center space-x-2 text-sm text-slate-600">
                <Users className="w-4 h-4" />
                <span>Community</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center space-x-2">
              {isPremium ? (
                <div className="flex items-center text-yellow-600">
                  <Crown className="w-4 h-4 mr-1" />
                  <span className="text-xs font-bold">Premium</span>
                </div>
              ) : (
                <div className="text-xs text-slate-600">
                  {remainingMessages}/10 messages left in {interestName}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-slate-100 rounded-xl p-1">
          <button
            onClick={() => setActiveTab('posts')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
              activeTab === 'posts'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600'
            }`}
          >
            Posts
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
              activeTab === 'chat'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600'
            }`}
          >
            <MessageCircle className="w-4 h-4 inline mr-2" />
            Chat
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1">
        {activeTab === 'posts' ? (
          <div className="p-4">
            {/* Create Post */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 mb-6">
              <div className="flex items-start space-x-3">
                <img
                  src={currentUser?.avatar || `https://ui-avatars.com/api/?name=${currentUser?.full_name || 'User'}&background=random&size=40`}
                  alt="Your avatar"
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="flex-1">
                  <textarea
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={`Share something with the ${interestName} community...`}
                    rows={3}
                    className="w-full p-3 bg-slate-50 rounded-xl border-none resize-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  />
                  
                  {postImage && (
                    <div className="mt-3 relative">
                      <img src={postImage} alt="Post" className="w-full h-48 object-cover rounded-xl" />
                      <button
                        onClick={() => setPostImage(null)}
                        className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70"
                      >
                        ×
                      </button>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center space-x-2">
                      <label className="p-2 text-slate-500 hover:bg-slate-100 rounded-full cursor-pointer transition-colors">
                        <Camera className="w-5 h-5" />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          disabled={isUploadingImage}
                        />
                      </label>
                      {isUploadingImage && <span className="text-xs text-slate-500">Uploading...</span>}
                    </div>
                    <button
                      onClick={createPost}
                      disabled={!newPost.trim() || isPosting}
                      className={`px-6 py-2 rounded-xl font-medium transition-all ${
                        newPost.trim() && !isPosting
                          ? 'bg-blue-500 text-white hover:bg-blue-600'
                          : 'bg-slate-200 text-slate-400'
                      }`}
                    >
                      {isPosting ? 'Posting...' : 'Post'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Posts Feed */}
            <div className="space-y-4">
              {posts.length === 0 ? (
                <div className="text-center py-12">
                  <div className={`w-16 h-16 ${interestColor} rounded-full flex items-center justify-center mx-auto mb-4`}>
                    <Plus className="w-8 h-8 text-current" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-700 mb-2">No posts yet in {interestName}</h3>
                  <p className="text-slate-500">Be the first to share something with this community!</p>
                </div>
              ) : (
                posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onLike={() => {}}
                    onComment={() => {}}
                    onDelete={loadData}
                  />
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <div className={`w-16 h-16 ${interestColor} rounded-full flex items-center justify-center mx-auto mb-4`}>
                    <MessageCircle className="w-8 h-8 text-current" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-700 mb-2">Welcome to {interestName} Chat</h3>
                  <p className="text-slate-500">Start the conversation! Chat with others in real-time.</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div key={message.id} className="flex space-x-3">
                    <img
                      src={message.sender_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(message.sender_name)}&background=random&size=40`}
                      alt={message.sender_name}
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-semibold text-slate-900">{message.sender_name}</span>
                        <span className="text-xs text-slate-500">
                          {format(new Date(message.created_date), 'HH:mm')}
                        </span>
                      </div>
                      <div className="bg-white rounded-2xl rounded-tl-md px-4 py-2 shadow-sm">
                        <p className="text-slate-700">{message.content}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="border-t border-blue-100 p-4 bg-white/80 backdrop-blur-lg">
              {!canSendMessage() && (
                <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center justify-between">
                  <div className="flex items-center">
                    <Lock className="w-4 h-4 text-yellow-600 mr-2" />
                    <span className="text-sm text-yellow-800">You've reached your daily limit in {interestName} (10 messages)</span>
                  </div>
                  <button
                    onClick={() => window.dispatchEvent(new CustomEvent('navigateTo', { detail: { page: 'payment' } }))}
                    className="text-xs bg-yellow-500 text-white px-3 py-1 rounded-full font-bold hover:bg-yellow-600"
                  >
                    Upgrade
                  </button>
                </div>
              )}
              
              <div className="flex items-center space-x-2">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={canSendMessage() ? `Message ${interestName} community...` : "Upgrade to continue messaging"}
                  disabled={!canSendMessage()}
                  rows={1}
                  className={`flex-1 px-4 py-3 bg-slate-100 rounded-2xl border-none resize-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all ${!canSendMessage() ? 'opacity-50' : ''}`}
                  style={{ minHeight: '48px', maxHeight: '120px' }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || !canSendMessage()}
                  className={`p-3 rounded-full transition-all ${
                    newMessage.trim() && canSendMessage()
                      ? 'bg-blue-500 text-white hover:bg-blue-600'
                      : 'bg-slate-200 text-slate-400'
                  }`}
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

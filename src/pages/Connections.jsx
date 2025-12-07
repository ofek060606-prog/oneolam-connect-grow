import React, { useState, useEffect } from 'react';
import { User, Follow } from '@/entities/all';
import { ArrowLeft, Check, X, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from '../components/utils/i18n';
import { Button } from '@/components/ui/button';

export default function ConnectionsPage({ onBack, onChatClick }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('following');
  const { t } = useTranslation();

  useEffect(() => {
    const loadConnections = async () => {
      setIsLoading(true);
      try {
        const user = await User.me();
        setCurrentUser(user);

        const [
          followersData,
          followingData,
          pendingData,
          sentData
        ] = await Promise.all([
          Follow.filter({ following_email: user.email, status: 'approved' }),
          Follow.filter({ follower_email: user.email, status: 'approved' }),
          Follow.filter({ following_email: user.email, status: 'pending' }),
          Follow.filter({ follower_email: user.email, status: 'pending' })
        ]);

        setFollowers(followersData);
        setFollowing(followingData);
        setPendingRequests(pendingData);
        setSentRequests(sentData);

      } catch (error) {
        console.error("Error loading connections:", error);
        toast.error(t('toast_load_connections_error'));
      } finally {
        setIsLoading(false);
      }
    };
    loadConnections();
  }, [t]);

  const handleApprove = async (request) => {
    try {
      await Follow.update(request.id, { status: 'approved' });
      toast.success(t('requestApproved'));
      setPendingRequests(prev => prev.filter(r => r.id !== request.id));
      setFollowers(prev => [...prev, request]);
    } catch (error) {
      console.error("Error approving request:", error);
      toast.error(t('failedToApprove'));
    }
  };

  const handleReject = async (request) => {
    try {
      await Follow.delete(request.id);
      toast.success(t('requestRejected'));
      setPendingRequests(prev => prev.filter(r => r.id !== request.id));
    } catch (error) {
      console.error("Error rejecting request:", error);
      toast.error(t('failedToReject'));
    }
  };
  
  const handleRemoveConnection = async (userEmail, type) => {
    if (!window.confirm(t('removeConnection'))) return;
    
    try {
        let connectionToDelete;
        if (type === 'following') {
            connectionToDelete = following.find(f => f.following_email === userEmail);
        } else { // followers
            connectionToDelete = followers.find(f => f.follower_email === userEmail);
        }

        if (connectionToDelete) {
            await Follow.delete(connectionToDelete.id);
            toast.success(t('connectionRemoved'));
            if (type === 'following') {
                setFollowing(prev => prev.filter(f => f.following_email !== userEmail));
            } else {
                setFollowers(prev => prev.filter(f => f.follower_email !== userEmail));
            }
        }
    } catch (error) {
        console.error("Error removing connection:", error);
        toast.error(t('failedToRemove'));
    }
  };

  const UserCard = ({ user, type }) => (
    <div className="bg-white p-3 rounded-lg shadow-sm flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <img src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}`} alt={user.name} className="w-12 h-12 rounded-full" />
        <div>
          <p className="font-semibold text-slate-800">{user.name}</p>
          <p className="text-sm text-slate-500">{user.bio || t('member')}</p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        {type === 'pending' ? (
          <>
            <Button size="icon" className="bg-green-500 hover:bg-green-600" onClick={() => handleApprove(user.request)}>
              <Check className="w-4 h-4" />
            </Button>
            <Button size="icon" variant="destructive" onClick={() => handleReject(user.request)}>
              <X className="w-4 h-4" />
            </Button>
          </>
        ) : type === 'sent' ? (
            <Button variant="outline" disabled>
              <Clock className="w-4 h-4 mr-2" />
              {t('pending')}
            </Button>
        ) : (
          <Button variant="outline" onClick={() => handleRemoveConnection(user.email, type)}>
            {t(type === 'following' ? 'following' : 'followers')}
          </Button>
        )}
      </div>
    </div>
  );

  const renderList = (users, type) => {
    if (users.length === 0) {
      return <p className="text-center text-slate-500 py-8">{t('no_users_in_list')}</p>;
    }
    return (
      <div className="space-y-3">
        {users.map((user, index) => <UserCard key={index} user={user} type={type} />)}
      </div>
    );
  };

  const tabs = [
    { id: 'following', label: t('following'), count: following.length },
    { id: 'followers', label: t('followers'), count: followers.length },
    { id: 'pending', label: t('pendingRequests'), count: pendingRequests.length, highlight: true },
    { id: 'sent', label: t('sentRequests'), count: sentRequests.length },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white/80 backdrop-blur-lg sticky top-0 z-40 p-4 border-b border-blue-100">
        <div className="flex items-center">
          <button onClick={onBack} className="p-2 hover:bg-blue-100 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6 text-blue-600" />
          </button>
          <h1 className="text-xl font-bold text-slate-900 ml-4">{t('connections')}</h1>
        </div>
      </div>
      
      <div className="p-4">
        {/* Tabs */}
        <div className="flex space-x-1 bg-slate-200 p-1 rounded-lg mb-4">
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 py-2 px-1 text-sm font-medium rounded-md transition-colors relative ${
                        activeTab === tab.id ? 'bg-white text-blue-600 shadow' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                >
                    {tab.label}
                    {tab.count > 0 && (
                        <span className={`absolute -top-2 -right-2 text-xs font-bold text-white rounded-full h-5 w-5 flex items-center justify-center ${tab.highlight ? 'bg-red-500' : 'bg-blue-400'}`}>
                            {tab.count}
                        </span>
                    )}
                </button>
            ))}
        </div>

        {/* Content */}
        {isLoading ? (
          <p className="text-center text-slate-500 py-8">{t('loading')}...</p>
        ) : (
          <div>
            {activeTab === 'following' && renderList(following.map(f => ({ name: f.following_name, email: f.following_email })), 'following')}
            {activeTab === 'followers' && renderList(followers.map(f => ({ name: f.follower_name, email: f.follower_email })), 'followers')}
            {activeTab === 'pending' && renderList(pendingRequests.map(r => ({ name: r.follower_name, email: r.follower_email, request: r })), 'pending')}
            {activeTab === 'sent' && renderList(sentRequests.map(r => ({ name: r.following_name, email: r.following_email })), 'sent')}
          </div>
        )}
      </div>
    </div>
  );
}
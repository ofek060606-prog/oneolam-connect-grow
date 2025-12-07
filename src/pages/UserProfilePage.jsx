
import React, { useState, useEffect, useCallback } from 'react';
import { User, Post, Follow } from '@/entities/all';
import { ArrowLeft, UserPlus, MessageSquare, Check, MoreHorizontal, Clock, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from '../components/utils/i18n';
import { Button } from '@/components/ui/button';
import { ProfilePostGridItem } from '../components/profile/ProfilePostGridItem';

export default function UserProfilePage({ userEmail, onBack, onChatClick }) {
    const [profileUser, setProfileUser] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [posts, setPosts] = useState([]);
    const [connectionStatus, setConnectionStatus] = useState('none'); // none, pending, connected
    const [followRecord, setFollowRecord] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const { t } = useTranslation();

    const fetchProfileData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [pUser, cUser] = await Promise.all([
                User.filter({ email: userEmail }).then(res => res[0]),
                User.me()
            ]);

            if (!pUser) {
                toast.error(t('toast_user_not_found'));
                onBack();
                return;
            }
            
            setProfileUser(pUser);
            setCurrentUser(cUser);

            const userPosts = await Post.filter({ created_by: pUser.email }, '-created_date');
            setPosts(userPosts);

            // Check connection status
            const existingFollow = await Follow.filter({
                follower_email: cUser.email,
                following_email: pUser.email
            });

            if (existingFollow.length > 0) {
                setFollowRecord(existingFollow[0]);
                setConnectionStatus(existingFollow[0].status === 'approved' ? 'connected' : 'pending');
            } else {
                setConnectionStatus('none');
                setFollowRecord(null);
            }

        } catch (error) {
            console.error("Error loading user profile:", error);
            toast.error(t('toast_load_profile_error'));
        } finally {
            setIsLoading(false);
        }
    }, [userEmail, onBack, t]);

    useEffect(() => {
        fetchProfileData();
    }, [fetchProfileData]);

    const handleConnect = async () => {
        if (!currentUser || !profileUser) return;
        
        try {
            if (connectionStatus === 'none') {
                const newFollow = await Follow.create({
                    follower_email: currentUser.email,
                    following_email: profileUser.email,
                    follower_name: currentUser.full_name,
                    following_name: profileUser.full_name,
                    status: profileUser.account_privacy === 'private' ? 'pending' : 'approved',
                });
                setFollowRecord(newFollow);
                setConnectionStatus(newFollow.status === 'approved' ? 'connected' : 'pending');
                toast.success(newFollow.status === 'approved' ? t('toast_now_following', { name: profileUser.full_name }) : t('toast_follow_request_sent'));
            } else if (connectionStatus === 'pending' || connectionStatus === 'connected') {
                if (followRecord) {
                    await Follow.delete(followRecord.id);
                    setConnectionStatus('none');
                    setFollowRecord(null);
                    toast.success(t('toast_unfollowed', { name: profileUser.full_name }));
                }
            }
        } catch (error) {
            console.error("Error handling connection:", error);
            toast.error(t('toast_connection_error'));
        }
    };
    
    const renderConnectionButton = () => {
        switch(connectionStatus) {
            case 'none':
                return <Button onClick={handleConnect}><UserPlus className="w-4 h-4 mr-2" />{t('connect')}</Button>;
            case 'pending':
                return <Button variant="outline" onClick={handleConnect}><Clock className="w-4 h-4 mr-2" />{t('pending')}</Button>;
            case 'connected':
                return <Button variant="outline" onClick={handleConnect}><Check className="w-4 h-4 mr-2" />{t('connected')}</Button>;
            default:
                return null;
        }
    };

    if (isLoading) {
        return <div className="flex items-center justify-center h-screen">{t('loading')}...</div>;
    }

    if (!profileUser) {
        return (
            <div className="flex flex-col items-center justify-center h-screen">
                <p>{t('toast_user_not_found')}</p>
                <Button onClick={onBack} className="mt-4">{t('back')}</Button>
            </div>
        );
    }
    
    const canViewPosts = profileUser.account_privacy === 'public' || connectionStatus === 'connected';

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-lg sticky top-0 z-40 p-4 border-b border-blue-100 flex items-center justify-between">
                <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <ArrowLeft className="w-6 h-6 text-slate-700" />
                </button>
                <h1 className="text-xl font-bold text-slate-900">{profileUser.full_name}</h1>
                <button className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <MoreHorizontal className="w-6 h-6 text-slate-700" />
                </button>
            </div>

            {/* Profile Info */}
            <div className="p-4 flex flex-col items-center text-center">
                <img
                    src={profileUser.avatar || `https://ui-avatars.com/api/?name=${profileUser.full_name}`}
                    alt={profileUser.full_name}
                    className="w-24 h-24 rounded-full border-4 border-white shadow-lg mb-3"
                />
                <h2 className="text-2xl font-bold text-slate-900">{profileUser.full_name}</h2>
                <p className="text-slate-600 mt-1 max-w-md">{profileUser.bio || t('member')}</p>
                
                <div className="flex items-center space-x-2 mt-4">
                    {renderConnectionButton()}
                    <Button onClick={() => onChatClick(profileUser.email, profileUser.full_name)} variant="outline" className="bg-white">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        {t('message')}
                    </Button>
                </div>
            </div>
            
            {/* Posts */}
            <div className="p-4">
                {canViewPosts ? (
                    posts.length > 0 ? (
                        <div className="grid grid-cols-3 gap-1">
                            {posts.map(post => (
                                <ProfilePostGridItem key={post.id} post={post} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-slate-500">
                            <p>{t('no_posts_yet_title')}</p>
                        </div>
                    )
                ) : (
                    <div className="text-center py-12 text-slate-500 border-2 border-dashed border-slate-300 rounded-lg">
                        <Lock className="w-10 h-10 mx-auto text-slate-400 mb-2" />
                        <h3 className="font-semibold text-lg text-slate-700">{t('this_account_is_private')}</h3>
                        <p>{t('follow_to_see_posts', { name: profileUser.full_name })}</p>
                    </div>
                )}
            </div>
        </div>
    );
}

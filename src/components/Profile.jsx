
import React, { useState, useEffect, useCallback } from 'react';
import { User, Post, SavedPost, Follow } from '@/entities/all';
import { Crown, LogOut, Edit3, Share2, Camera, Users, Star, Bookmark, Lock, Globe } from 'lucide-react';
import { useTranslation } from './utils/i18n';
import { EditProfileForm } from './profile/EditProfileForm';
import { ProfilePostGridItem } from './profile/ProfilePostGridItem';
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';

const StatCard = ({ icon: Icon, value, label, highlight = false, onClick }) => (
    <div
        onClick={onClick}
        className={`flex-1 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-lg text-center cursor-pointer hover:shadow-xl transition-all ${highlight ? 'border-2 border-yellow-400' : ''}`}
    >
        <Icon className="w-6 h-6 text-blue-600 mx-auto mb-2" />
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <p className="text-sm text-slate-600 font-medium">{label}</p>
    </div>
);

const AchievementItem = ({ icon: Icon, text }) => (
    <div className="flex items-center space-x-3">
        <div className="bg-yellow-100 p-2 rounded-full">
            <Icon className="w-5 h-5 text-yellow-600" />
        </div>
        <span className="font-semibold text-slate-700">{text}</span>
    </div>
);

export const Profile = ({ onChatClick }) => {
    const [user, setUser] = useState(null);
    const [stats, setStats] = useState({ posts: 0, connections: 0, savedPosts: 0 });
    const [userPosts, setUserPosts] = useState([]);
    const [savedPosts, setSavedPosts] = useState([]);
    const [showEditForm, setShowEditForm] = useState(false);
    const [activeTab, setActiveTab] = useState('posts');
    const [savedPostsVisibility, setSavedPostsVisibility] = useState('private'); // private/public
    const { t } = useTranslation();

    const fetchProfileData = useCallback(async () => {
        try {
            const currentUser = await User.me();
            setUser(currentUser);

            // Fetch ONLY the user's posts, connections, and saved posts
            const [myPosts, following, mySavedPosts] = await Promise.all([
                Post.filter({ created_by: currentUser.email }, '-created_date'),
                Follow.filter({ follower_email: currentUser.email }),
                SavedPost.filter({ created_by: currentUser.email })
            ]);

            setStats({
                posts: myPosts.length,
                connections: following.length,
                savedPosts: mySavedPosts.length
            });

            setUserPosts(myPosts);
            
            // Load saved posts with actual post data
            const savedPostsWithData = await Promise.all(
                mySavedPosts.map(async (savedPost) => {
                    try {
                        const actualPost = await Post.get(savedPost.post_id);
                        return actualPost;
                    } catch (error) {
                        return null; // Post might be deleted
                    }
                })
            );
            
            setSavedPosts(savedPostsWithData.filter(Boolean));
            
            // Load saved posts visibility setting
            setSavedPostsVisibility(currentUser.saved_posts_visibility || 'private');

        } catch (error) { // Corrected syntax: `catch (error) =>` changed to `catch (error)`
            console.error('Error fetching profile data:', error);
            toast.error(t("toast_load_profile_error"));
        }
    }, [t]); // Add t to dependency array since it's used inside

    useEffect(() => {
        fetchProfileData();
    }, [fetchProfileData]); // Add fetchProfileData to dependency array

    const handleLogout = async () => {
        await User.logout();
        window.location.reload();
    };

    const handleNavigate = (page) => {
        window.dispatchEvent(new CustomEvent('navigateTo', { detail: { page } }));
    };

    const handleChatClick = () => {
        if (onChatClick && user) {
            onChatClick(user.email, user.full_name);
        }
    };

    const toggleSavedPostsVisibility = async () => {
        const newVisibility = savedPostsVisibility === 'private' ? 'public' : 'private';
        try {
            await User.updateMyUserData({ saved_posts_visibility: newVisibility });
            setSavedPostsVisibility(newVisibility);
            toast.success(t('toast_saved_visibility_success', { status: t(newVisibility) }));
        } catch (error) {
            toast.error(t("toast_update_visibility_error"));
        }
    };

    const handleShareProfile = async () => {
        const shareText = t('share_profile_text', { userName: user.full_name });
        const shareUrl = window.location.href; // Assuming profile URL is the current URL

        if (navigator.share) {
            try {
                await navigator.share({
                    title: t('share_profile_title', { userName: user.full_name }),
                    text: shareText,
                    url: shareUrl,
                });
                toast.success(t('toast_profile_shared_success'));
            } catch (error) {
                if (error.name !== 'AbortError') { // User cancelled share
                    fallbackShareProfile(shareText, shareUrl);
                }
            }
        } else {
            fallbackShareProfile(shareText, shareUrl);
        }
    };

    const fallbackShareProfile = (shareText, shareUrl) => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
            toast.success(t('toast_profile_link_copied'));
        } else {
            // Fallback for browsers without Clipboard API
            const textArea = document.createElement('textarea');
            textArea.value = `${shareText}\n${shareUrl}`;
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                toast.success(t('toast_profile_link_copied'));
            } catch (err) {
                toast.error(t('toast_share_profile_error'));
            } finally {
                document.body.removeChild(textArea);
            }
        }
    };

    if (showEditForm) {
        return <EditProfileForm user={user} onBack={() => setShowEditForm(false)} onSave={() => { setShowEditForm(false); fetchProfileData(); }} />;
    }

    if (!user) {
        return <div className="flex items-center justify-center h-screen bg-blue-50">{t('loading')}</div>;
    }

    const isAdmin = user.role === 'admin';
    const isPremium = user.subscription_tier === 'premium';

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header Section */}
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white pt-8 pb-24 relative">
                <button onClick={handleLogout} className="absolute top-4 right-4 p-2 bg-white/20 rounded-full">
                    <LogOut className="w-5 h-5" />
                </button>
                <div className="flex flex-col items-center justify-center px-4 cursor-pointer" onClick={handleChatClick}>
                    <img
                        src={user.avatar || `https://ui-avatars.com/api/?name=${user.full_name}`}
                        alt={user.full_name}
                        className="w-24 h-24 rounded-full border-4 border-white/50 shadow-xl mb-3"
                    />
                    <div className="flex items-center space-x-2">
                        <h1 className="text-2xl font-bold">{user.full_name}</h1>
                        {isAdmin && <Crown className="w-6 h-6 text-yellow-300" />}
                    </div>
                    <p className="text-sm opacity-80 mt-1">{user.bio || t('member')}</p>
                    {user.location && <p className="text-sm opacity-70 mt-1">{user.location}</p>}
                    {isPremium && (
                        <div className="mt-3 bg-yellow-400 text-slate-900 px-3 py-1 rounded-full text-sm font-bold">
                            {t('premium_member')}
                        </div>
                    )}
                </div>
            </div>

            {/* Stats Cards - Overlapping */}
            <div className="px-4 -mt-16">
                <div className="flex items-center justify-center space-x-3">
                    <StatCard
                        icon={Camera}
                        value={stats.posts}
                        label={t('posts')}
                        onClick={() => setActiveTab('posts')}
                    />
                    <StatCard
                        icon={Users}
                        value={stats.connections}
                        label={t('connections')}
                        highlight={true}
                        onClick={() => handleNavigate('connections')}
                    />
                    <StatCard
                        icon={Bookmark}
                        value={stats.savedPosts}
                        label={t('saved')}
                        onClick={() => setActiveTab('savedPosts')}
                    />
                </div>
            </div>

            {/* Main Content */}
            <div className="p-4 space-y-6 mt-6">
                {/* Interests & Achievements */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Interests */}
                    {user.interests && user.interests.length > 0 && (
                        <div className="bg-white p-4 rounded-xl shadow-md">
                            <h2 className="font-bold text-slate-800 mb-4">{t('interests')}</h2>
                            <div className="flex flex-wrap gap-2">
                                {user.interests.map((interest, index) => (
                                    <span key={index} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                                        {interest}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Achievements */}
                    <div className="bg-white p-4 rounded-xl shadow-md">
                        <h2 className="font-bold text-slate-800 mb-4">{t('achievements')}</h2>
                        <div className="space-y-3">
                            <AchievementItem icon={Star} text={t('achievement_community_leader')} />
                            <AchievementItem icon={Camera} text={t('achievement_active_poster')} />
                            <AchievementItem icon={Users} text={t('achievement_connected_member')} />
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3">
                    <Button onClick={() => setShowEditForm(true)} className="col-span-2 sm:col-span-1">
                        <Edit3 className="w-4 h-4 mr-2" />
                        {t('edit')}
                    </Button>
                    <Button onClick={handleShareProfile} variant="outline" className="bg-white col-span-2 sm:col-span-1">
                        <Share2 className="w-4 h-4 mr-2" />
                        {t('share')}
                    </Button>
                </div>

                {/* Content Tabs */}
                <div className="bg-white rounded-xl shadow-md">
                    <div className="flex border-b border-slate-200">
                        <button
                            onClick={() => setActiveTab('posts')}
                            className={`flex-1 py-3 px-4 font-medium transition-colors ${
                                activeTab === 'posts'
                                    ? 'text-blue-600 border-b-2 border-blue-600'
                                    : 'text-slate-600 hover:text-slate-800'
                            }`}
                        >
                            {t('posts')} ({stats.posts})
                        </button>
                        <button
                            onClick={() => setActiveTab('savedPosts')}
                            className={`flex-1 py-3 px-4 font-medium transition-colors ${
                                activeTab === 'savedPosts'
                                    ? 'text-blue-600 border-b-2 border-blue-600'
                                    : 'text-slate-600 hover:text-slate-800'
                            }`}
                        >
                            {t('saved')} ({stats.savedPosts})
                        </button>
                    </div>

                    <div className="p-2 sm:p-4">
                        {activeTab === 'posts' && (
                            <div>
                                {userPosts.length === 0 ? (
                                    <div className="text-center py-12">
                                        <Camera className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                        <h3 className="text-lg font-semibold text-slate-700">{t('no_posts_yet_title')}</h3>
                                        <p className="text-slate-500">{t('no_posts_yet_description')}</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-3 gap-1">
                                        {userPosts.map((post) => (
                                            <ProfilePostGridItem key={post.id} post={post} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'savedPosts' && (
                            <div>
                                {/* Visibility Toggle */}
                                <div className="flex items-center justify-between mb-4 p-3 bg-slate-50 rounded-lg">
                                    <div className="flex items-center space-x-2">
                                        {savedPostsVisibility === 'private' ? (
                                            <Lock className="w-5 h-5 text-slate-600" />
                                        ) : (
                                            <Globe className="w-5 h-5 text-slate-600" />
                                        )}
                                        <span className="text-sm font-medium text-slate-700">
                                            {t(savedPostsVisibility)}
                                        </span>
                                    </div>
                                    <button
                                        onClick={toggleSavedPostsVisibility}
                                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                                    >
                                        {t(savedPostsVisibility === 'private' ? 'make_public' : 'make_private')}
                                    </button>
                                </div>
                                
                                {savedPosts.length === 0 ? (
                                    <div className="text-center py-12">
                                        <Bookmark className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                        <h3 className="text-lg font-semibold text-slate-700">{t('no_saved_posts_yet_title')}</h3>
                                        <p className="text-slate-500">{t('no_saved_posts_yet_description')}</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-3 gap-1">
                                        {savedPosts.map((post) => (
                                            <ProfilePostGridItem key={post.id} post={post} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

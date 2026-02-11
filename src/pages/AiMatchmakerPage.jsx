import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, Filter, Heart, X, Zap, Sparkles, Clock, Info, Star, Crown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, MatchmakerLike, DailySwipeCount, DailySuperSwipeCount, Notification } from '@/entities/all';
import { useTranslation } from '../components/utils/i18n';
import { FilterPanel } from '../components/matchmaker/FilterPanel';
import { ProfileCard } from '../components/matchmaker/ProfileCard';
import { MatchModal } from '../components/matchmaker/MatchModal';
import { toast } from 'sonner';
import { Button } from "@/components/ui/button";

const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) return null;
  
  try {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    
    if (isNaN(birthDate.getTime())) {
      return null;
    }
    
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  } catch (error) {
    return null;
  }
};

const INITIAL_FILTERS = {
  lookingFor: 'anyConnection',
  ageRange: [18, 60],
  location: '',
  gender: 'any',
  observanceLevel: 'any'
};

const SWIPE_LIMIT_FREE = 10;
const SWIPE_LIMIT_PREMIUM = 50;
const SUPERSWIPE_LIMIT_FREE = 2;
const SUPERSWIPE_LIMIT_PREMIUM = 5;

// Enhanced local storage helpers
const CACHE_KEYS = {
  DAILY_SWIPES: 'ai_matchmaker_daily_swipes',
  DAILY_SUPER_SWIPES: 'ai_matchmaker_daily_super_swipes',
  PROFILES_CACHE: 'ai_matchmaker_profiles',
  SWIPED_USERS: 'ai_matchmaker_swiped_users',
  LAST_FETCH: 'ai_matchmaker_last_fetch'
};

const getFromCache = (key) => {
  try {
    const item = localStorage.getItem(key);
    if (item) {
      const parsed = JSON.parse(item);
      // Check if data is from today
      const today = new Date().toISOString().split('T')[0];
      if (parsed.date === today) {
        return parsed.data;
      }
    }
  } catch (error) {
    console.error('Cache read error:', error);
  }
  return null;
};

const setToCache = (key, data) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(key, JSON.stringify({ date: today, data }));
  } catch (error) {
    console.error('Cache write error:', error);
  }
};

const clearTodayCache = () => {
  Object.values(CACHE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
};

// Helper function to add longer delays between API calls
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Enhanced retry function with longer backoff delays
const retryWithBackoff = async (fn, maxRetries = 2, baseDelay = 3000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.message?.includes('429') || error.message?.includes('Rate limit')) {
        const delayTime = baseDelay * Math.pow(2, i);
        console.warn(`Rate limit hit, waiting ${delayTime}ms... (attempt ${i + 1}/${maxRetries})`);
        await delay(delayTime);
        continue;
      }
      throw error;
    }
  }
  throw new Error('Rate limit exceeded - please try again in a few minutes');
};

export default function AiMatchmakerPage({ onBack, onChatClick }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [profiles, setProfiles] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [swipeCount, setSwipeCount] = useState(0);
    const [superSwipeCount, setSuperSwipeCount] = useState(0);
    const [hasReachedLimit, setHasReachedLimit] = useState(false);
    const [showMatch, setShowMatch] = useState(false);
    const [matchedUser, setMatchedUser] = useState(null);
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState(INITIAL_FILTERS);
    const [appliedFilters, setAppliedFilters] = useState(INITIAL_FILTERS);
    const [isProcessing, setIsProcessing] = useState(false);
    const [swipedUsers, setSwipedUsers] = useState(new Set());
    const [loadError, setLoadError] = useState(false); // New state for loading errors
    const { t } = useTranslation();
    const cardRef = useRef(null);

    const isPremium = currentUser?.subscription_tier === 'premium';
    const dailySwipeLimit = isPremium ? SWIPE_LIMIT_PREMIUM : SWIPE_LIMIT_FREE;
    const dailySuperSwipeLimit = isPremium ? SUPERSWIPE_LIMIT_PREMIUM : SUPERSWIPE_LIMIT_FREE;

    // Load cached swipe counts on startup
    const loadCachedCounts = useCallback(() => {
        const cachedSwipes = getFromCache(CACHE_KEYS.DAILY_SWIPES) || 0;
        const cachedSuperSwipes = getFromCache(CACHE_KEYS.DAILY_SUPER_SWIPES) || 0;
        const cachedSwipedUsers = getFromCache(CACHE_KEYS.SWIPED_USERS) || [];
        
        setSwipeCount(cachedSwipes);
        setSuperSwipeCount(cachedSuperSwipes);
        setSwipedUsers(new Set(cachedSwipedUsers));
    }, []);

    const fetchAndSetProfiles = useCallback(async (user, currentAppliedFilters) => {
        console.log('Starting to fetch profiles...');
        
        try {
            // Try to get from cache first
            const cachedProfiles = getFromCache(CACHE_KEYS.PROFILES_CACHE);
            const cachedSwipedUsers = getFromCache(CACHE_KEYS.SWIPED_USERS);
            
            if (cachedProfiles && cachedProfiles.length > 0) {
                console.log('Using cached profiles:', cachedProfiles.length);
                setProfiles(cachedProfiles);
                if (cachedSwipedUsers) {
                    setSwipedUsers(new Set(cachedSwipedUsers));
                }
                return true; // Success with cache
            }

            // If no cache, try to fetch from API with heavy retry logic
            try {
                await delay(2000); // Wait 2 seconds before starting API calls for profiles
                
                const [swipedLikes, allUsers] = await Promise.all([
                    retryWithBackoff(() => MatchmakerLike.filter({ liker_email: user.email }), 2, 4000),
                    retryWithBackoff(() => User.list(undefined, 50), 2, 4000) // Reduced from 100 to 50
                ]);

                await delay(1000); // Delay before processing

                const swipedUserEmails = new Set(swipedLikes.map(like => like.liked_email));
                swipedUserEmails.add(user.email); // Don't show current user

                let potentialProfiles = allUsers.filter(p => !swipedUserEmails.has(p.email));

                // Client-side filtering
                potentialProfiles = potentialProfiles.filter(p => {
                    const age = p.age || calculateAge(p.date_of_birth);
                    if (age === null || age < currentAppliedFilters.ageRange[0] || age > currentAppliedFilters.ageRange[1]) return false;
                    if (currentAppliedFilters.gender !== 'any' && p.gender !== currentAppliedFilters.gender) return false;
                    if (currentAppliedFilters.location && p.location && !p.location.toLowerCase().includes(currentAppliedFilters.location.toLowerCase())) return false;
                    if (currentAppliedFilters.observanceLevel !== 'any' && p.religious_observance !== currentAppliedFilters.observanceLevel) return false;
                    return true;
                });

                // Shuffle profiles and take a limited amount
                const shuffled = potentialProfiles.sort(() => Math.random() - 0.5);
                const finalProfiles = shuffled.slice(0, Math.min(20, shuffled.length));

                console.log('Fetched profiles successfully:', finalProfiles.length);
                setProfiles(finalProfiles);
                setSwipedUsers(swipedUserEmails);
                
                // Cache the results
                setToCache(CACHE_KEYS.PROFILES_CACHE, finalProfiles);
                setToCache(CACHE_KEYS.SWIPED_USERS, Array.from(swipedUserEmails));
                
                return true; // Success
            } catch (apiError) {
                console.error('API fetch for profiles failed:', apiError);
                // If API fails, show error message but don't crash
                return false;
            }
        } catch (error) {
            console.error('Error in fetchAndSetProfiles:', error);
            return false;
        } finally {
            setCurrentIndex(0); // Reset index whenever profiles are refreshed
        }
    }, [setToCache]);

    const fetchInitialData = useCallback(async () => {
        console.log('fetchInitialData started');
        setIsLoading(true);
        setLoadError(false);

        try {
            // Step 1: Get current user
            let user;
            try {
                user = await User.me();
                setCurrentUser(user);
                console.log('Current user fetched:', user.email);
            } catch (error) {
                console.error('Failed to get current user:', error);
                setLoadError(true);
                setIsLoading(false);
                toast.error("Failed to load user data. Please check your connection.");
                return;
            }

            const userAge = user.age || calculateAge(user.date_of_birth);
            if (userAge === null || userAge < 18) {
                setHasReachedLimit(true); // Indicate age restriction
                setProfiles([]);
                setIsLoading(false);
                return;
            }

            // Step 2: Load swipe counts from cache immediately
            const cachedSwipeCount = getFromCache(CACHE_KEYS.DAILY_SWIPES) || 0;
            const cachedSuperSwipeCount = getFromCache(CACHE_KEYS.DAILY_SUPER_SWIPES) || 0;
            const cachedSwipedUsers = getFromCache(CACHE_KEYS.SWIPED_USERS) || [];
            
            setSwipeCount(cachedSwipeCount);
            setSuperSwipeCount(cachedSuperSwipeCount);
            setSwipedUsers(new Set(cachedSwipedUsers));
            console.log(`Loaded cached swipe counts: ${cachedSwipeCount} swipes, ${cachedSuperSwipeCount} superswipes`);

            // Check if user has reached limit based on cached counts
            const currentDailySwipeLimit = user.subscription_tier === 'premium' ? SWIPE_LIMIT_PREMIUM : SWIPE_LIMIT_FREE;
            
            if (cachedSwipeCount >= currentDailySwipeLimit) {
                console.log('User has reached daily swipe limit based on cache.');
                setHasReachedLimit(true);
                setProfiles([]);
                setIsLoading(false);
                return;
            }

            // Step 3: Try to fetch profiles (with fallback to cache logic inside fetchAndSetProfiles)
            const profilesFetchedSuccessfully = await fetchAndSetProfiles(user, appliedFilters);
            
            if (!profilesFetchedSuccessfully) {
                const cachedProfiles = getFromCache(CACHE_KEYS.PROFILES_CACHE);
                if (!cachedProfiles || cachedProfiles.length === 0) {
                    console.log('No profiles available, and API fetch failed. Setting loadError.');
                    setLoadError(true);
                    toast.error('Could not load profiles. Please try again.');
                }
            }
            
            // Background update of daily counts
            const today = new Date().toISOString().split('T')[0];
            setTimeout(async () => {
                try {
                    const swipeData = await retryWithBackoff(() => 
                        DailySwipeCount.filter({ user_email: user.email, date: today })
                    );
                    await delay(1500);
                    const superSwipeData = await retryWithBackoff(() => 
                        DailySuperSwipeCount.filter({ user_email: user.email, date: today })
                    );

                    const currentApiSwipes = swipeData[0]?.swipe_count || 0;
                    const currentApiSuperSwipes = superSwipeData[0]?.superswipe_count || 0;
                    
                    // Update cache and state with fresh API data if different
                    if (cachedSwipeCount !== currentApiSwipes) {
                        setToCache(CACHE_KEYS.DAILY_SWIPES, currentApiSwipes);
                        setSwipeCount(currentApiSwipes);
                    }
                    if (cachedSuperSwipeCount !== currentApiSuperSwipes) {
                        setToCache(CACHE_KEYS.DAILY_SUPER_SWIPES, currentApiSuperSwipes);
                        setSuperSwipeCount(currentApiSuperSwipes);
                    }
                    console.log('Background API count refresh complete.');

                } catch (countError) {
                    console.warn('Background count update failed, will rely on cached counts:', countError);
                }
            }, 3000); // Delay background refresh by 3 seconds

        } catch (error) {
            console.error('Error in fetchInitialData:', error);
            setLoadError(true);
            toast.error('Could not load AI Matchmaker. Please try again later.');
        } finally {
            setIsLoading(false);
            console.log('fetchInitialData completed');
        }
    }, [fetchAndSetProfiles, appliedFilters, dailySwipeLimit, setToCache]);

    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

    const updateSwipeCount = useCallback(async (isSuperSwipe = false) => {
        if (!currentUser) return;

        try {
            // Update local state and cache immediately
            if (isSuperSwipe) {
                const newCount = superSwipeCount + 1;
                setSuperSwipeCount(newCount);
                setToCache(CACHE_KEYS.DAILY_SUPER_SWIPES, newCount);
            } else {
                const newCount = swipeCount + 1;
                setSwipeCount(newCount);
                setToCache(CACHE_KEYS.DAILY_SWIPES, newCount);
            }

            // Background API update with retry and long delays
            const today = new Date().toISOString().split('T')[0];
            
            setTimeout(async () => {
                try {
                    if (isSuperSwipe) {
                        const existing = await retryWithBackoff(() => 
                            DailySuperSwipeCount.filter({ user_email: currentUser.email, date: today })
                        );
                        
                        await delay(1500);
                        
                        if (existing.length > 0) {
                            await retryWithBackoff(() => 
                                DailySuperSwipeCount.update(existing[0].id, { 
                                    superswipe_count: existing[0].superswipe_count + 1 
                                })
                            );
                        } else {
                            await retryWithBackoff(() => 
                                DailySuperSwipeCount.create({
                                    user_email: currentUser.email,
                                    date: today,
                                    superswipe_count: 1
                                })
                            );
                        }
                    } else {
                        const existing = await retryWithBackoff(() => 
                            DailySwipeCount.filter({ user_email: currentUser.email, date: today })
                        );
                        
                        await delay(1500);
                        
                        if (existing.length > 0) {
                            await retryWithBackoff(() => 
                                DailySwipeCount.update(existing[0].id, { 
                                    swipe_count: existing[0].swipe_count + 1 
                                })
                            );
                        } else {
                            await retryWithBackoff(() => 
                                DailySwipeCount.create({
                                    user_email: currentUser.email,
                                    date: today,
                                    swipe_count: 1
                                })
                            );
                        }
                    }
                } catch (error) {
                    console.log("Background count update failed:", error);
                    // Don't show error to user - the local count is still updated
                }
            }, 3000); // 3 second delay for background update
            
        } catch (error) {
            console.error("Failed to update swipe count:", error);
        }
    }, [currentUser, superSwipeCount, swipeCount, setToCache]);

    const handleVote = useCallback(async (direction) => {
        if (isProcessing || !currentUser) return;
        
        const profile = profiles[currentIndex];
        if (!profile) return;

        setIsProcessing(true);
        const liked = direction === 'right';

        try {
            await delay(300);

            const newSwipedUsers = new Set(swipedUsers);
            newSwipedUsers.add(profile.email);
            setSwipedUsers(newSwipedUsers);
            setToCache(CACHE_KEYS.SWIPED_USERS, Array.from(newSwipedUsers));

            if (liked) {
                await retryWithBackoff(async () => {
                    await MatchmakerLike.create({
                        liker_email: currentUser.email,
                        liker_name: currentUser.full_name,
                        liked_email: profile.email,
                        is_super_like: false
                    });
                });

                await delay(500);

                const existingLike = await retryWithBackoff(async () => {
                    return await MatchmakerLike.filter({
                        liker_email: profile.email,
                        liked_email: currentUser.email
                    });
                });

                if (existingLike && existingLike.length > 0) {
                    setMatchedUser(profile);
                    setShowMatch(true);

                    try {
                        await retryWithBackoff(async () => {
                            await Notification.create({
                                recipient_email: profile.email,
                                sender_email: currentUser.email,
                                sender_name: currentUser.full_name,
                                type: 'match',
                                content: t('youAndUserLiked', { name: currentUser.full_name })
                            });
                        });
                        await retryWithBackoff(async () => { // Notification for current user
                            await Notification.create({
                                recipient_email: currentUser.email,
                                sender_email: profile.email,
                                sender_name: profile.full_name,
                                type: 'match',
                                content: t('youAndUserLiked', { name: profile.full_name })
                            });
                        });
                    } catch (error) {
                        console.log('Could not send match notification:', error);
                    }
                } else {
                    try {
                        await retryWithBackoff(async () => {
                            await Notification.create({
                                recipient_email: profile.email,
                                sender_email: currentUser.email,
                                sender_name: currentUser.full_name,
                                type: 'matchmaker_like',
                                content: t('matchmakerLikeNotification', { name: currentUser.full_name })
                            });
                        });
                    } catch (error) {
                        console.log('Could not send like notification:', error);
                    }
                    toast.success(t('liked'));
                }
            }

            await updateSwipeCount(false);

            // Always move to next profile if not showing match
            if (!showMatch) {
                if (currentIndex < profiles.length - 1) {
                    setCurrentIndex(prev => prev + 1);
                } else {
                    setHasReachedLimit(true);
                }
            }

        } catch (error) {
            console.error('Error processing vote:', error);
            if (error.message?.includes('Rate limit')) {
                toast.error(t('tooManyAttempts'));
            } else {
                toast.error('Something went wrong. Please try again.');
            }
        } finally {
            setIsProcessing(false);
        }
    }, [isProcessing, currentUser, profiles, currentIndex, swipedUsers, setSwipedUsers, setToCache, updateSwipeCount, t, setShowMatch, setMatchedUser]);

    const handleSuperSwipe = useCallback(async () => {
        if (isProcessing || !currentUser) return;
        
        const profile = profiles[currentIndex];
        if (!profile) return;

        if (superSwipeCount >= dailySuperSwipeLimit) {
            if (isPremium) {
                toast.info(t('noSuperSwipesLeft'));
            } else {
                toast.info(t('noSuperSwipesLeft'));
            }
            return;
        }

        setIsProcessing(true);

        try {
            await delay(300);

            const newSwipedUsers = new Set(swipedUsers);
            newSwipedUsers.add(profile.email);
            setSwipedUsers(newSwipedUsers);
            setToCache(CACHE_KEYS.SWIPED_USERS, Array.from(newSwipedUsers));

            await retryWithBackoff(async () => {
                await MatchmakerLike.create({
                    liker_email: currentUser.email,
                    liker_name: currentUser.full_name,
                    liked_email: profile.email,
                    is_super_like: true
                });
            });

            try {
                await retryWithBackoff(async () => {
                    await Notification.create({
                        recipient_email: profile.email,
                        sender_email: currentUser.email,
                        sender_name: currentUser.full_name,
                        type: 'matchmaker_like',
                        content: `${currentUser.full_name} sent you a SuperSwipe! ⚡`
                    });
                });
            } catch (error) {
                console.log('Could not send superswipe notification:', error);
            }

            await updateSwipeCount(true);
            toast.success(t('superSwipeSent'));

            if (currentIndex < profiles.length - 1) {
                setCurrentIndex(prev => prev + 1);
            } else {
                setHasReachedLimit(true);
            }

        } catch (error) {
            console.error('Error processing super swipe:', error);
            if (error.message?.includes('Rate limit')) {
                toast.error(t('tooManyAttempts'));
            } else {
                toast.error('Something went wrong. Please try again.');
            }
        } finally {
            setIsProcessing(false);
        }
    }, [isProcessing, currentUser, profiles, currentIndex, superSwipeCount, dailySuperSwipeLimit, isPremium, swipedUsers, setSwipedUsers, setToCache, updateSwipeCount, t]);

    const handleApplyFilters = () => {
        setAppliedFilters(filters);
        setShowFilters(false);
        if (currentUser) {
            fetchAndSetProfiles(currentUser, filters);
        }
    };

    const handleFilterReset = useCallback(async () => {
        setFilters(INITIAL_FILTERS);
        setAppliedFilters(INITIAL_FILTERS);
        setShowFilters(false);
        if (currentUser) {
            await delay(500);
            // fetchAndSetProfiles now handles its own cache logic
            await fetchAndSetProfiles(currentUser, INITIAL_FILTERS);
        }
    }, [currentUser, fetchAndSetProfiles]);

    // NOW define currentProfile, remainingSwipes, and remainingSuperSwipes after all functions
    const currentProfile = profiles[currentIndex];
    const remainingSwipes = dailySwipeLimit - swipeCount;
    const remainingSuperSwipes = dailySuperSwipeLimit - superSwipeCount;

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 flex flex-col items-center justify-center p-4">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                    <Sparkles className="w-16 h-16 text-purple-500" />
                </motion.div>
                <p className="mt-4 text-lg font-medium text-slate-700">{t('loading')}</p>
                <p className="mt-2 text-sm text-slate-500">Finding your perfect matches...</p>
            </div>
        );
    }

    // Error state - server is busy or failed to load
    if (loadError) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50">
                <div className="bg-white/90 backdrop-blur-lg border-b border-purple-100 p-4">
                    <div className="flex items-center justify-between max-w-md mx-auto">
                        <button onClick={onBack} className="p-2 hover:bg-purple-100 rounded-full transition-colors">
                            <ArrowLeft className="w-6 h-6 text-purple-600" />
                        </button>
                        <h1 className="text-xl font-bold text-slate-900">{t('aiMatchmaker')}</h1>
                        <div className="w-10"></div>
                    </div>
                </div>
                
                <div className="flex items-center justify-center p-8 min-h-[80vh]">
                    <div className="text-center max-w-md bg-white rounded-3xl shadow-2xl p-8">
                        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Info className="w-10 h-10 text-red-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-3">Server is Busy</h2>
                        <p className="text-slate-600 mb-6">
                            We're experiencing high traffic or connection issues. Please try again in a few minutes.
                        </p>
                        <Button 
                            onClick={() => {
                                setLoadError(false);
                                fetchInitialData();
                            }} 
                            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 mb-3"
                        >
                            Try Again
                        </Button>
                        <Button onClick={onBack} variant="outline" className="w-full">
                            {t('back')}
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // Age restriction or under 18
    const userAge = currentUser?.age || calculateAge(currentUser?.date_of_birth);
    if (userAge === null || userAge < 18) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50">
                <div className="bg-white/90 backdrop-blur-lg border-b border-purple-100 p-4">
                    <div className="flex items-center justify-between max-w-md mx-auto">
                        <button onClick={onBack} className="p-2 hover:bg-purple-100 rounded-full transition-colors">
                            <ArrowLeft className="w-6 h-6 text-purple-600" />
                        </button>
                        <h1 className="text-xl font-bold text-slate-900">{t('aiMatchmaker')}</h1>
                        <div className="w-10"></div>
                    </div>
                </div>
                
                <div className="flex items-center justify-center p-8 min-h-[80vh]">
                    <div className="text-center max-w-md bg-white rounded-3xl shadow-2xl p-8">
                        <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Info className="w-10 h-10 text-purple-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-3">{t('ageRestriction')}</h2>
                        <p className="text-slate-600 mb-6">This feature is available for users 18 and older. Please verify your age in your profile settings.</p>
                        <Button onClick={onBack} className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                            {t('back')}
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // Daily limit reached (after age check)
    if (hasReachedLimit && (swipeCount >= dailySwipeLimit || currentIndex >= profiles.length)) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50">
                <div className="bg-white/90 backdrop-blur-lg border-b border-purple-100 p-4">
                    <div className="flex items-center justify-between max-w-md mx-auto">
                        <button onClick={onBack} className="p-2 hover:bg-purple-100 rounded-full transition-colors">
                            <ArrowLeft className="w-6 h-6 text-purple-600" />
                        </button>
                        <h1 className="text-xl font-bold text-slate-900">{t('aiMatchmaker')}</h1>
                        <div className="w-10"></div>
                    </div>
                </div>
                
                <div className="flex items-center justify-center p-6 min-h-[80vh]">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-center max-w-md bg-white rounded-3xl shadow-2xl p-8"
                    >
                        <div className="relative mb-6">
                            <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto">
                                <Clock className="w-12 h-12 text-purple-600" />
                            </div>
                            {!isPremium && (
                                <div className="absolute -top-2 -right-2">
                                    <Crown className="w-8 h-8 text-yellow-500" />
                                </div>
                            )}
                        </div>
                        
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">{t('dailyLimitReached')}</h2>
                        <p className="text-slate-600 mb-6">
                            {t('dailyLimitMessage', { count: dailySwipeLimit })}
                        </p>
                        
                        {!isPremium && (
                            <>
                                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 mb-6">
                                    <h3 className="font-bold text-lg text-slate-900 mb-3">{t('upgradeForMore')}</h3>
                                    <ul className="text-left space-y-2 mb-4">
                                        <li className="flex items-center text-slate-700">
                                            <Star className="w-5 h-5 text-purple-500 mr-2 flex-shrink-0" />
                                            <span>{t('unlimitedConnections')}</span>
                                        </li>
                                        <li className="flex items-center text-slate-700">
                                            <Star className="w-5 h-5 text-purple-500 mr-2 flex-shrink-0" />
                                            <span>{t('dailySuperSwipes', {count: dailySuperSwipeLimit})}</span>
                                        </li>
                                        <li className="flex items-center text-slate-700">
                                            <Star className="w-5 h-5 text-purple-500 mr-2 flex-shrink-0" />
                                            <span>{t('priorityVisibility')}</span>
                                        </li>
                                    </ul>
                                    <Button
                                        onClick={() => window.dispatchEvent(new CustomEvent('navigateTo', { detail: { page: 'payment' } }))}
                                        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3"
                                    >
                                        {t('upgradeNowPrice')}
                                    </Button>
                                </div>
                                <p className="text-sm text-slate-500">
                                    {t('comeBackTomorrow', { count: dailySwipeLimit })}
                                </p>
                            </>
                        )}
                        
                        <Button onClick={onBack} variant="outline" className="w-full mt-4">
                            {t('back')}
                        </Button>
                    </motion.div>
                </div>
            </div>
        );
    }
    
    // No more profiles for today
    if (!currentProfile || currentIndex >= profiles.length) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50">
                <div className="bg-white/90 backdrop-blur-lg border-b border-purple-100 p-4">
                    <div className="flex items-center justify-between max-w-md mx-auto">
                        <button onClick={onBack} className="p-2 hover:bg-purple-100 rounded-full transition-colors">
                            <ArrowLeft className="w-6 h-6 text-purple-600" />
                        </button>
                        <h1 className="text-xl font-bold text-slate-900">{t('aiMatchmaker')}</h1>
                        <div className="w-10"></div>
                    </div>
                </div>
                
                <div className="flex items-center justify-center p-8 min-h-[80vh]">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-center max-w-md bg-white rounded-3xl shadow-2xl p-8"
                    >
                        <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Sparkles className="w-12 h-12 text-purple-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-3">{t('noMoreProfiles')}</h2>
                        <p className="text-slate-600 mb-6">{t('comeBackTomorrowForMore')}</p>
                        <Button onClick={onBack} className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                            {t('back')}
                        </Button>
                    </motion.div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 pb-20">
            {/* Header */}
            <div className="bg-white/90 backdrop-blur-lg border-b border-purple-100 p-4 sticky top-0 z-40">
                <div className="flex items-center justify-between max-w-md mx-auto">
                    <button onClick={onBack} className="p-2 hover:bg-purple-100 rounded-full transition-colors">
                        <ArrowLeft className="w-6 h-6 text-purple-600" />
                    </button>
                    
                    <div className="flex items-center space-x-2">
                        <Sparkles className="w-5 h-5 text-purple-600" />
                        <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                            {t('aiMatchmaker')}
                        </h1>
                    </div>
                    
                    <button
                        onClick={() => setShowFilters(true)}
                        className="p-2 hover:bg-purple-100 rounded-full transition-colors relative"
                        disabled={isProcessing}
                    >
                        <Filter className="w-6 h-6 text-purple-600" />
                        {(appliedFilters.lookingFor !== INITIAL_FILTERS.lookingFor || 
                          appliedFilters.ageRange[0] !== INITIAL_FILTERS.ageRange[0] ||
                          appliedFilters.ageRange[1] !== INITIAL_FILTERS.ageRange[1] ||
                          appliedFilters.location !== INITIAL_FILTERS.location || 
                          appliedFilters.gender !== INITIAL_FILTERS.gender || 
                          appliedFilters.observanceLevel !== INITIAL_FILTERS.observanceLevel) && (
                            <div className="absolute top-1 right-1 w-2 h-2 bg-pink-500 rounded-full"></div>
                        )}
                    </button>
                </div>

                {/* Stats Bar */}
                <div className="flex items-center justify-center space-x-6 mt-3 max-w-md mx-auto">
                    <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-1">
                            <Heart className="w-4 h-4 text-pink-500" />
                            <span className="text-sm font-medium text-slate-700">
                                {remainingSwipes}/{dailySwipeLimit}
                            </span>
                        </div>
                    </div>
                    
                    <div className="w-px h-4 bg-slate-300"></div>
                    
                    <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-1">
                            <Zap className="w-4 h-4 text-purple-500" />
                            <span className="text-sm font-medium text-slate-700">
                                {remainingSuperSwipes}/{dailySuperSwipeLimit}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Card Container */}
            <div className="max-w-md mx-auto px-4 pt-8">
                <div className="relative h-[500px]" ref={cardRef}>
                    <AnimatePresence mode="wait">
                        {currentProfile && (
                            <ProfileCard
                                key={currentProfile.id}
                                user={currentProfile}
                                onVote={handleVote}
                                onSuperSwipe={handleSuperSwipe}
                                isProcessing={isProcessing}
                            />
                        )}
                    </AnimatePresence>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-center space-x-4 mt-8">
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleVote('left')} // Explicitly passing 'left' for pass
                        disabled={isProcessing}
                        className="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                        <X className="w-8 h-8 text-red-500" />
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleSuperSwipe}
                        disabled={isProcessing || remainingSuperSwipes <= 0}
                        className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg flex items-center justify-center hover:from-purple-600 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:grayscale relative"
                    >
                        <Zap className="w-6 h-6 text-white fill-white" />
                        {remainingSuperSwipes > 0 && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center text-xs font-bold text-purple-900">
                                {remainingSuperSwipes}
                            </div>
                        )}
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleVote('right')} // Explicitly passing 'right' for like
                        disabled={isProcessing}
                        className="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-green-50 transition-colors disabled:opacity-50"
                    >
                        <Heart className="w-8 h-8 text-green-500 fill-green-500" />
                    </motion.button>
                </div>

                {/* Info Text */}
                <p className="text-center text-sm text-slate-500 mt-6 px-4">
                    {remainingSuperSwipes > 0 ? t('superSwipeBoost') : t('noSuperSwipesLeft')}
                </p>
            </div>

            {/* Filter Panel */}
            {showFilters && (
                <FilterPanel
                    filters={filters}
                    onFilterChange={setFilters}
                    onApply={handleApplyFilters}
                    onClose={() => setShowFilters(false)}
                />
            )}

            {/* Match Modal */}
            {showMatch && matchedUser && (
                <MatchModal
                    currentUser={currentUser}
                    matchedUser={matchedUser}
                    onClose={() => {
                        setShowMatch(false);
                        // Move to next profile after closing match modal
                        if (currentIndex < profiles.length - 1) {
                            setCurrentIndex(prev => prev + 1);
                        } else {
                            setHasReachedLimit(true);
                        }
                    }}
                    onSendMessage={(email, name) => {
                        setShowMatch(false);
                        if (onChatClick) {
                            onChatClick(email, name);
                        }
                    }}
                />
            )}
        </div>
    );
}
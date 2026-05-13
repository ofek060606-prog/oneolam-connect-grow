import React, { useState, useEffect, useCallback } from "react";
import { BottomNavigation } from "../components/BottomNavigation";
import Feed from "./Feed";
import Explore from "../components/Explore";
import { Chat } from "../components/Chat";
import { Profile } from "../components/Profile";
import { QnA } from "../components/QnA";
import LearnPage from "./Learn";
import TriviaPage from "./Trivia";
import PaymentPage from "./PaymentPage";
import ChatsPage from "./Chats";
import CreateStoryPage from "./CreateStory";
import NotificationsPage from './Notifications';
import QuestionDetailPage from './QuestionDetail';
import PostDetailPage from './PostDetailPage';
import AiMatchmakerPage from './AiMatchmakerPage';
import ConnectionsPage from './Connections';
import SavedPostsPage from './SavedPosts';
import UserProfilePage from './UserProfilePage';
import AdminDashboard from './AdminDashboard';
import CommunityPage from './CommunityPage';
import CreateCommunityPage from './CreateCommunity';
import InterestCommunityPage from './InterestCommunityPage';
import HashtagPostsPage from './HashtagPostsPage';
import DailyWordsQuizPage from './DailyWordsQuizPage'; // Import the new page
import SearchResultsPage from './SearchResults';
import { EditProfileForm } from '../components/profile/EditProfileForm';
import { User, Post, Story } from '@/entities/all';
import { LanguageProvider } from '../components/utils/i18n';
import { toast } from 'sonner';
import { motion, AnimatePresence } from "framer-motion";

// A definitive, standalone function to identify and filter all fake content.
const isDemoContent = (item) => {
  const fakeNames = [
    'Sarah Co', 'Sarah Cohen', 'שרה כהן', 'שרה כה',
    'David Levy', 'David', 'דוד לוי', 'דוד',
    'Michael', 'מיכאל', 'משה לוי', 'משה',
    'John Doe', 'Jane Smith', 'Demo', 'Sample',
    'Test User', 'מבחן', 'דוגמה'
  ];
  const fakeEmails = ['demo@', 'test@', 'sample@', 'fake@', 'example@'];
  if (item.author_name && fakeNames.some(name => item.author_name.toLowerCase().includes(name.toLowerCase()))) return true;
  if (item.created_by) {
    if (fakeEmails.some(email => item.created_by.toLowerCase().includes(email))) return true;
    if (!item.created_by.includes('@')) return true; // Assuming real emails contain '@'
  } else {
    // If created_by is missing, and it's a content item, consider it demo if it has no proper attribution
    // This is a heuristic, adjust as needed. For now, if no creator is specified, it might be an old demo.
    return true;
  }
  if (item.content && (item.content.toLowerCase().includes('demo') || item.content.toLowerCase().includes('sample'))) return true;
  return false;
};


// Main App Router Component
function AppRouter() {
  const [activeTab, setActiveTab] = useState("feed");
  const [showChat, setShowChat] = useState(false);
  const [chatRecipient, setChatRecipient] = useState({ email: '', name: '' });
  const [showCreateStory, setShowCreateStory] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showQuestionDetail, setShowQuestionDetail] = useState(null);
  const [showPostDetail, setShowPostDetail] = useState(null);
  const [showAiMatchmaker, setShowAiMatchmaker] = useState(false);
  const [showConnections, setShowConnections] = useState(false);
  const [showSavedPosts, setShowSavedPosts] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(null);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isUserChecked, setIsUserChecked] = useState(false);
  const [showCommunityPage, setShowCommunityPage] = useState(null); // Now can be null or { id: string, name: string }
  const [showCreateCommunity, setShowCreateCommunity] = useState(false);
  const [showInterestCommunity, setShowInterestCommunity] = useState(null);
  const [showHashtagPosts, setShowHashtagPosts] = useState(null);
  const [showDailyWordsQuiz, setShowDailyWordsQuiz] = useState(false); // Add new state for the quiz page
  const [showSearchResults, setShowSearchResults] = useState(null); // query string or null

  // Cleanup script disabled to prevent blocking
  useEffect(() => {
    // Mark as run so it doesn't try again
    localStorage.setItem('hasRunV1Cleanup', 'true');
  }, []);

  // Scroll to top when navigating
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const closeAllModals = useCallback(() => {
    setShowCreateStory(false);
    setShowNotifications(false);
    setShowQuestionDetail(null);
    setShowPostDetail(null);
    setShowAiMatchmaker(false);
    setShowConnections(false);
    setShowSavedPosts(false);
    setShowChat(false);
    setShowPayment(false);
    setShowUserProfile(null);
    setShowAdminDashboard(false);
    setShowCommunityPage(null);
    setShowCreateCommunity(false);
    setShowInterestCommunity(null);
    setShowHashtagPosts(null);
    setShowDailyWordsQuiz(false); // Add to closeAllModals
    setShowSearchResults(null);
  }, []);

  // Handle browser back button
  useEffect(() => {
    const handlePopState = (event) => {
      // Check if any modal/page is open
      if (showChat || showCreateStory || showNotifications || showQuestionDetail || 
          showPostDetail || showAiMatchmaker || showConnections || showSavedPosts || 
          showPayment || showUserProfile || showAdminDashboard || showCommunityPage || 
          showCreateCommunity || showInterestCommunity || showHashtagPosts || 
          showDailyWordsQuiz || showSearchResults || showOnboarding) {
        
        // Close all modals and prevent default back navigation
        event.preventDefault();
        closeAllModals();
        
        // Push state back so we stay on the same URL
        window.history.pushState(null, '', window.location.href);
      }
    };

    // Add initial state to history stack to enable consistent back navigation handling
    // This ensures there's always a state to "go back" to within our app's control.
    window.history.pushState(null, '', window.location.href);
    
    // Listen to popstate (back button)
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [showChat, showCreateStory, showNotifications, showQuestionDetail, showPostDetail, 
      showAiMatchmaker, showConnections, showSavedPosts, showPayment, showUserProfile, 
      showAdminDashboard, showCommunityPage, showCreateCommunity, showInterestCommunity, 
      showHashtagPosts, showDailyWordsQuiz, showSearchResults, showOnboarding, closeAllModals]);

  const handleChatClick = useCallback((recipientEmail, recipientName) => {
    closeAllModals(); // סוגר את כל החלונות האחרים
    setChatRecipient({ email: recipientEmail, name: recipientName });
    setShowChat(true); // פותח את הצ'אט
    // Push state for back button handling
    window.history.pushState({ page: 'chat' }, '', window.location.href);
  }, [closeAllModals]);

  const handleChatClose = () => {
    setShowChat(false);
    setChatRecipient({ email: '', name: '' }); // Reset recipient
    setActiveTab('chats'); // Navigate back to chats tab after closing chat
  };
  
  const handleCreateStoryClose = () => {
    setShowCreateStory(false);
  };
  
  const handleNotificationsClose = () => {
    setShowNotifications(false);
  };

  const handleQuestionDetailClose = () => {
    setShowQuestionDetail(null);
    setActiveTab('qna'); // Navigate back to qna tab
  };
  
  const handlePostDetailClose = () => {
      setShowPostDetail(null);
      setActiveTab('feed'); // Navigate back to feed tab
  };

  const handleAiMatchmakerClose = () => {
    setShowAiMatchmaker(false);
    setActiveTab('explore'); // Navigate back to explore tab
  };

  const handleConnectionsClose = () => {
    setShowConnections(false);
    setActiveTab('profile'); // Navigate back to profile tab
  };
  
  const handleSavedPostsClose = () => {
      setShowSavedPosts(false);
      setActiveTab('profile'); // Navigate back to profile tab
  };
  
  const handlePaymentClose = () => {
      setShowPayment(false);
      setActiveTab('profile'); // Navigate back to profile tab
  };

  const handleUserProfileClose = useCallback(() => {
    setShowUserProfile(null);
    setActiveTab('feed'); // Navigate back to feed tab
  }, []);
  
  const handleAdminDashboardClose = () => {
      setShowAdminDashboard(false);
      setActiveTab('profile'); // Navigate back to profile tab
  };
  
  const handleCommunityPageClose = () => {
      setShowCommunityPage(null);
      setActiveTab('explore'); // Navigate back to explore tab
  };
  
  const handleCreateCommunityClose = () => {
      setShowCreateCommunity(false);
      setActiveTab('explore'); // Navigate back to explore tab
  };
  
  const handleInterestCommunityClose = () => {
      setShowInterestCommunity(null);
      setActiveTab('explore');
  };

  const handleHashtagPostsClose = () => {
      setShowHashtagPosts(null);
      setActiveTab('explore');
  };

  const handleDailyWordsQuizClose = () => { // Add new close handler
    setShowDailyWordsQuiz(false);
    setActiveTab('learn');
  };

  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        const user = await User.me();
        // A user is "new" if they haven't set their date of birth.
        if (!user.date_of_birth) {
          setShowOnboarding(true);
        }
      } catch (e) {
        // Not logged in, do nothing.
      } finally {
        setIsUserChecked(true);
      }
    };
    checkUserStatus();

    const handleNavigate = (event) => {
      const { page, email, name, questionId, communityId, communityName, interestName, interestColor, postId, hashtagName, hashtagColor } = event.detail;

      // Always scroll to top when navigating
      scrollToTop();

      // Close all specific overlay pages when navigating via global event
      closeAllModals();

      // Push state for back button
      window.history.pushState({ page }, '', window.location.href);

      if (page === 'chat') {
        // handleChatClick already pushes state, so skip here if called directly.
        // If navigateTo 'chat' is handled here, then handleChatClick will push state.
        // For consistency, let's just set the state and let handleChatClick be responsible for pushState.
        // No, actually the outline says pushState here. So let's follow the outline for simplicity.
        handleChatClick(email, name); // This already calls pushState, so no need for a duplicate here if handleChatClick is called.
                                     // However, if direct logic for other pages, then pushState should be added.
                                     // Re-reading: the outline adds pushState here for all cases where a page is opened,
                                     // except chat which is handled by handleChatClick. Let's make it explicit for all.
      } else if (page === 'create-story') {
        setShowCreateStory(true);
      } else if (page === 'notifications') {
        setShowNotifications(true);
      } else if (page === 'question-detail') {
        setShowQuestionDetail(questionId);
      } else if (page === 'post-detail') {
        setShowPostDetail(postId);
      } else if (page === 'ai-matchmaker') {
        setShowAiMatchmaker(true);
      } else if (page === 'connections') {
        setShowConnections(true);
      } else if (page === 'saved-posts') {
        setShowSavedPosts(true);
      } else if (page === 'payment' || page === 'subscription') {
        setShowPayment(true);
      } else if (page === 'user-profile') {
        setShowUserProfile(email);
      } else if (page === 'admin') {
        setShowAdminDashboard(true);
      } else if (page === 'community') {
        setShowCommunityPage({ id: communityId, name: communityName });
      } else if (page === 'create-community') {
        setShowCreateCommunity(true);
      } else if (page === 'interest-community') {
        setShowInterestCommunity({ name: interestName, color: interestColor });
      } else if (page === 'hashtag-posts') {
        setShowHashtagPosts({ name: hashtagName, color: hashtagColor });
      } else if (page === 'daily-words-quiz') { // Add new navigation condition
        setShowDailyWordsQuiz(true);
      } else if (page === 'search-results') {
        setShowSearchResults(event.detail.query || '');
      } else if (page) {
        setActiveTab(page);
      }
    };

    const handleNavigateToChat = (event) => {
      const { email, name } = event.detail;
      closeAllModals();
      setChatRecipient({ email, name });
      setShowChat(true);
      window.history.pushState({ page: 'chat' }, '', window.location.href);
    };

    window.addEventListener('navigateTo', handleNavigate);
    window.addEventListener('navigateToChat', handleNavigateToChat);

    return () => {
      window.removeEventListener('navigateTo', handleNavigate);
      window.removeEventListener('navigateToChat', handleNavigateToChat);
    };
  }, [handleChatClick, closeAllModals]);

  // Also scroll to top and close all modals when changing tabs
  const handleTabChange = (newTab) => {
    closeAllModals(); // Critical fix: Ensure all specific full-page views are closed when switching to a main tab
    scrollToTop();
    setActiveTab(newTab);
    window.history.pushState({ tab: newTab }, '', window.location.href);
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    setActiveTab('feed');
  };

  if (!isUserChecked) {
    return (
      <div className="flex items-center justify-center h-screen bg-blue-50">
        <p>Loading...</p>
      </div>
    );
  }

  const renderActiveComponent = () => {
    switch (activeTab) {
      case "feed":
        return <Feed onChatClick={handleChatClick} />;
      case "explore":
        return <Explore onChatClick={handleChatClick} />;
      case "qna":
        return <QnA />;
      case "learn":
        return <LearnPage />;
      case "trivia":
        return <TriviaPage />;
      case "chats":
        return <ChatsPage />;
      case "profile":
        return <Profile onChatClick={handleChatClick} />;
      default:
        return <Feed onChatClick={handleChatClick} />;
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className={`transition-transform duration-300 ease-in-out ${showChat || showCreateStory || showNotifications || showQuestionDetail || showPostDetail || showAiMatchmaker || showConnections || showSavedPosts || showPayment || showUserProfile || showAdminDashboard || showCommunityPage || showCreateCommunity || showInterestCommunity || showHashtagPosts || showOnboarding || showDailyWordsQuiz || showSearchResults ? 'transform -translate-x-full md:!transform-none' : ''}`}>
        <div className="md:max-w-md md:mx-auto md:shadow-lg md:rounded-lg md:overflow-hidden min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
          {renderActiveComponent()}
          <BottomNavigation activeTab={activeTab} onTabChange={handleTabChange} />
        </div>
      </div>

      {/* Sliding Modals / Pages */}
      <AnimatePresence>
        {showChat && (
          <motion.div
            key="chat"
            className="absolute top-0 left-0 w-full h-full bg-white z-50 md:max-w-md md:mx-auto"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <Chat recipient={chatRecipient} onBack={handleChatClose} />
          </motion.div>
        )}

        {showCreateStory && (
          <motion.div
            key="create-story"
            className="absolute top-0 left-0 w-full h-full bg-white z-50 md:max-w-md md:mx-auto"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <CreateStoryPage onBack={handleCreateStoryClose} />
          </motion.div>
        )}

        {showNotifications && (
            <motion.div
                key="notifications"
                className="absolute top-0 left-0 w-full h-full bg-white z-50 md:max-w-md md:mx-auto"
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
                <NotificationsPage onBack={handleNotificationsClose} />
            </motion.div>
        )}
        
        {showQuestionDetail && (
            <motion.div
                key="question-detail"
                className="absolute top-0 left-0 w-full h-full bg-white z-50 md:max-w-md md:mx-auto"
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
                <QuestionDetailPage questionId={showQuestionDetail} onBack={handleQuestionDetailClose} onChatClick={handleChatClick}/>
            </motion.div>
        )}

        {showPostDetail && (
            <motion.div
                key="post-detail"
                className="absolute top-0 left-0 w-full h-full bg-white z-50 md:max-w-md md:mx-auto"
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
                <PostDetailPage postId={showPostDetail} onBack={handlePostDetailClose} onChatClick={handleChatClick} />
            </motion.div>
        )}

        {showAiMatchmaker && (
            <motion.div
                key="ai-matchmaker"
                className="absolute top-0 left-0 w-full h-full bg-white z-50 md:max-w-md md:mx-auto"
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
                <AiMatchmakerPage onBack={handleAiMatchmakerClose} onChatClick={handleChatClick}/>
            </motion.div>
        )}

        {showConnections && (
            <motion.div
                key="connections"
                className="absolute top-0 left-0 w-full h-full bg-white z-50 md:max-w-md md:mx-auto"
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
                <ConnectionsPage onBack={handleConnectionsClose} onChatClick={handleChatClick} />
            </motion.div>
        )}
        
        {showSavedPosts && (
            <motion.div
                key="saved-posts"
                className="absolute top-0 left-0 w-full h-full bg-white z-50 md:max-w-md md:mx-auto"
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
                <SavedPostsPage onBack={handleSavedPostsClose} onChatClick={handleChatClick} />
            </motion.div>
        )}
        
        {showPayment && (
            <motion.div
                key="payment"
                className="absolute top-0 left-0 w-full h-full bg-white z-50 md:max-w-md md:mx-auto"
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
                <PaymentPage onBack={handlePaymentClose} />
            </motion.div>
        )}

        {showUserProfile && (
          <motion.div
            key="user-profile"
            className="absolute top-0 left-0 w-full h-full bg-white z-50 md:max-w-md md:mx-auto"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <UserProfilePage
              userEmail={showUserProfile}
              onBack={handleUserProfileClose}
              onChatClick={handleChatClick}
            />
          </motion.div>
        )}
        
        {showAdminDashboard && (
            <motion.div
                key="admin-dashboard"
                className="absolute top-0 left-0 w-full h-full bg-white z-50 md:max-w-md md:mx-auto"
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
                <AdminDashboard onBack={handleAdminDashboardClose} />
            </motion.div>
        )}

        {showOnboarding && (
          <motion.div
            key="onboarding"
            className="absolute top-0 left-0 w-full h-full bg-white z-[100] md:max-w-md md:mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <EditProfileForm user={{}} onSave={() => {
              setShowOnboarding(false);
              setActiveTab('feed');
            }} isOnboarding={true} />
          </motion.div>
        )}

        {showCommunityPage && (
          <motion.div
            key="community-page"
            className="absolute top-0 left-0 w-full h-full bg-white z-50 md:max-w-md md:mx-auto"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <CommunityPage
              communityId={showCommunityPage.id}
              communityName={showCommunityPage.name}
              onBack={handleCommunityPageClose}
            />
          </motion.div>
        )}
        
        {showCreateCommunity && (
          <motion.div
            key="create-community"
            className="absolute top-0 left-0 w-full h-full bg-white z-50 md:max-w-md md:mx-auto"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <CreateCommunityPage onBack={handleCreateCommunityClose} />
          </motion.div>
        )}

        {showInterestCommunity && (
          <motion.div
            key="interest-community"
            className="absolute top-0 left-0 w-full h-full bg-white z-50 md:max-w-md md:mx-auto"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <InterestCommunityPage
              interestName={showInterestCommunity.name}
              interestColor={showInterestCommunity.color}
              onBack={handleInterestCommunityClose}
            />
          </motion.div>
        )}

        {showHashtagPosts && (
          <motion.div
            key="hashtag-posts"
            className="absolute top-0 left-0 w-full h-full bg-white z-50 md:max-w-md md:mx-auto"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <HashtagPostsPage
              hashtagName={showHashtagPosts.name}
              hashtagColor={showHashtagPosts.color}
              onBack={handleHashtagPostsClose}
            />
          </motion.div>
        )}

        {showSearchResults !== null && (
          <motion.div
            key="search-results"
            className="absolute top-0 left-0 w-full h-full bg-white z-50 md:max-w-md md:mx-auto"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <SearchResultsPage
              query={showSearchResults}
              onBack={() => { setShowSearchResults(null); setActiveTab('explore'); }}
            />
          </motion.div>
        )}

        {showDailyWordsQuiz && ( // Add new AnimatePresence block for DailyWordsQuizPage
          <motion.div
            key="daily-words-quiz"
            className="absolute top-0 left-0 w-full h-full bg-white z-50 md:max-w-md md:mx-auto"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <DailyWordsQuizPage onBack={handleDailyWordsQuizClose} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Top-level App component that provides the language context
export default function App() {
  return (
    <LanguageProvider>
      <AppRouter />
    </LanguageProvider>
  )
}
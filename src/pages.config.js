/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AdminDashboard from './pages/AdminDashboard';
import AiMatchmakerPage from './pages/AiMatchmakerPage';
import App from './pages/App';
import Chats from './pages/Chats';
import CommunityPage from './pages/CommunityPage';
import Connections from './pages/Connections';
import CreateCommunity from './pages/CreateCommunity';
import CreateStory from './pages/CreateStory';
import DailyWordsQuizPage from './pages/DailyWordsQuizPage';
import Explore from './pages/Explore';
import Feed from './pages/Feed';
import HashtagPostsPage from './pages/HashtagPostsPage';
import Home from './pages/Home';
import InterestCommunityPage from './pages/InterestCommunityPage';
import Learn from './pages/Learn';
import Notifications from './pages/Notifications';
import PaymentPage from './pages/PaymentPage';
import PostDetailPage from './pages/PostDetailPage';
import QuestionDetail from './pages/QuestionDetail';
import SavedPosts from './pages/SavedPosts';
import Trivia from './pages/Trivia';
import UserProfilePage from './pages/UserProfilePage';


export const PAGES = {
    "AdminDashboard": AdminDashboard,
    "AiMatchmakerPage": AiMatchmakerPage,
    "App": App,
    "Chats": Chats,
    "CommunityPage": CommunityPage,
    "Connections": Connections,
    "CreateCommunity": CreateCommunity,
    "CreateStory": CreateStory,
    "DailyWordsQuizPage": DailyWordsQuizPage,
    "Explore": Explore,
    "Feed": Feed,
    "HashtagPostsPage": HashtagPostsPage,
    "Home": Home,
    "InterestCommunityPage": InterestCommunityPage,
    "Learn": Learn,
    "Notifications": Notifications,
    "PaymentPage": PaymentPage,
    "PostDetailPage": PostDetailPage,
    "QuestionDetail": QuestionDetail,
    "SavedPosts": SavedPosts,
    "Trivia": Trivia,
    "UserProfilePage": UserProfilePage,
}

export const pagesConfig = {
    mainPage: "App",
    Pages: PAGES,
};
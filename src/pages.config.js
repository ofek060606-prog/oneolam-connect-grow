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
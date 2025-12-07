import App from './pages/App';
import Learn from './pages/Learn';
import Trivia from './pages/Trivia';
import Chats from './pages/Chats';
import CreateStory from './pages/CreateStory';
import Notifications from './pages/Notifications';
import QuestionDetail from './pages/QuestionDetail';
import AiMatchmakerPage from './pages/AiMatchmakerPage';
import Connections from './pages/Connections';
import PaymentPage from './pages/PaymentPage';
import SavedPosts from './pages/SavedPosts';
import UserProfilePage from './pages/UserProfilePage';
import AdminDashboard from './pages/AdminDashboard';
import CommunityPage from './pages/CommunityPage';
import CreateCommunity from './pages/CreateCommunity';
import Explore from './pages/Explore';
import InterestCommunityPage from './pages/InterestCommunityPage';
import PostDetailPage from './pages/PostDetailPage';
import Feed from './pages/Feed';
import HashtagPostsPage from './pages/HashtagPostsPage';
import DailyWordsQuizPage from './pages/DailyWordsQuizPage';


export const PAGES = {
    "App": App,
    "Learn": Learn,
    "Trivia": Trivia,
    "Chats": Chats,
    "CreateStory": CreateStory,
    "Notifications": Notifications,
    "QuestionDetail": QuestionDetail,
    "AiMatchmakerPage": AiMatchmakerPage,
    "Connections": Connections,
    "PaymentPage": PaymentPage,
    "SavedPosts": SavedPosts,
    "UserProfilePage": UserProfilePage,
    "AdminDashboard": AdminDashboard,
    "CommunityPage": CommunityPage,
    "CreateCommunity": CreateCommunity,
    "Explore": Explore,
    "InterestCommunityPage": InterestCommunityPage,
    "PostDetailPage": PostDetailPage,
    "Feed": Feed,
    "HashtagPostsPage": HashtagPostsPage,
    "DailyWordsQuizPage": DailyWordsQuizPage,
}

export const pagesConfig = {
    mainPage: "App",
    Pages: PAGES,
};
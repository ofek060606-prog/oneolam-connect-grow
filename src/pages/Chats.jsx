import React, { useState, useEffect } from 'react';
import { User, Message, Follow } from '@/entities/all';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Search, Inbox, MailQuestion } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { enUS } from 'date-fns/locale';

export default function ChatsPage() {
  const [conversations, setConversations] = useState([]);
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('inbox');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchConversations = async () => {
      setIsLoading(true);
      try {
        const user = await User.me();
        setCurrentUser(user);
        
        const [allMessages, followingList] = await Promise.all([
            Message.list(),
            Follow.filter({ follower_email: user.email })
        ]);

        const followingEmails = new Set(followingList.map(f => f.following_email));
        
        const convos = allMessages.reduce((acc, msg) => {
          const otherUserEmail = msg.created_by === user.email ? msg.recipient_email : msg.created_by;
          const otherUserName = msg.created_by === user.email ? msg.recipient_name : msg.sender_name;

          if (!otherUserEmail) return acc;

          if (!acc[otherUserEmail]) {
            acc[otherUserEmail] = {
              email: otherUserEmail,
              name: otherUserName,
              lastMessage: msg,
              hasNewMessage: !msg.is_read && msg.created_by !== user.email,
            };
          } else if (new Date(msg.created_date) > new Date(acc[otherUserEmail].lastMessage.created_date)) {
            acc[otherUserEmail].lastMessage = msg;
            if (!msg.is_read && msg.created_by !== user.email) {
                acc[otherUserEmail].hasNewMessage = true;
            }
          }
          return acc;
        }, {});
        
        const allConvos = Object.values(convos);
        const mainConvos = allConvos.filter(c => followingEmails.has(c.email) || c.lastMessage.created_by === user.email);
        const requestConvos = allConvos.filter(c => !followingEmails.has(c.email) && c.lastMessage.created_by !== user.email);

        setConversations(mainConvos.sort((a,b) => new Date(b.lastMessage.created_date) - new Date(a.lastMessage.created_date)));
        setRequests(requestConvos.sort((a,b) => new Date(b.lastMessage.created_date) - new Date(a.lastMessage.created_date)));

      } catch (error) {
        console.error("Failed to fetch conversations", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConversations();
  }, []);

  const handleChatSelect = async (email, name) => {
    // When a chat is selected, we can assume its messages are read
    // A more robust system would mark on message receipt, but this is a good UI-driven approach
    const event = new CustomEvent('navigateToChat', { detail: { email, name } });
    window.dispatchEvent(event);
  };
  
  const ChatListItem = ({ convo }) => (
    <div 
      key={convo.email}
      onClick={() => handleChatSelect(convo.email, convo.name)}
      className="flex items-center space-x-4 p-3 rounded-xl hover:bg-white cursor-pointer relative"
    >
      <div className="relative">
        <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center">
          <span className="text-blue-600 font-bold text-lg">{convo.name[0]}</span>
        </div>
        {convo.hasNewMessage && (
          <div className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-blue-50"></div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center">
          <h3 className={`font-semibold text-slate-800 truncate ${convo.hasNewMessage ? 'font-bold' : ''}`}>
            {convo.name}
          </h3>
          <p 
            className="text-xs text-slate-500 shrink-0"
            title={format(new Date(convo.lastMessage.created_date), 'PPpp')}
          >
            {formatDistanceToNow(new Date(convo.lastMessage.created_date), { addSuffix: true, locale: enUS })}
          </p>
        </div>
        <p className={`text-sm text-slate-500 truncate ${convo.hasNewMessage ? 'font-semibold text-slate-700' : ''}`}>
          {convo.lastMessage.created_by === currentUser?.email && "You: "}{convo.lastMessage.content}
        </p>
      </div>
    </div>
  );

  if (isLoading) {
    return <div className="text-center p-8">Loading chats...</div>;
  }

  return (
    <div className="min-h-screen bg-blue-50 pb-20">
      <div className="bg-white/80 backdrop-blur-lg sticky top-0 z-40 p-4 border-b border-blue-100">
        <h1 className="text-2xl font-bold text-slate-900">Chats</h1>
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            className="w-full pl-10 pr-4 py-2 bg-slate-100 rounded-xl border-none"
          />
        </div>
      </div>
      
      <div className="p-2 bg-white border-b border-blue-100">
        <div className="flex bg-slate-100 rounded-xl p-1">
          <button 
            onClick={() => setActiveTab('inbox')}
            className={`w-1/2 p-2 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-all ${activeTab === 'inbox' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600'}`}
          >
            <Inbox className="w-5 h-5" />
            <span>Inbox</span>
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`w-1/2 p-2 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-all relative ${activeTab === 'requests' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600'}`}
          >
            <MailQuestion className="w-5 h-5" />
            <span>Requests</span>
            {requests.length > 0 && <div className="absolute top-1 right-2 w-2 h-2 rounded-full bg-red-500"></div>}
          </button>
        </div>
      </div>
      
      <div className="p-2">
        {activeTab === 'inbox' && (
          <>
            {conversations.length > 0 ? (
              conversations.map(convo => <ChatListItem key={convo.email} convo={convo} />)
            ) : (
              <div className="text-center py-20 text-slate-500">
                <MessageSquare className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                <h3 className="text-lg font-semibold">Your inbox is empty</h3>
                <p>Start a conversation from the feed or explore page.</p>
              </div>
            )}
          </>
        )}
        {activeTab === 'requests' && (
           <>
            {requests.length > 0 ? (
              requests.map(convo => <ChatListItem key={convo.email} convo={convo} />)
            ) : (
              <div className="text-center py-20 text-slate-500">
                <MailQuestion className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                <h3 className="text-lg font-semibold">No message requests</h3>
                <p>When someone you don't follow messages you, it'll appear here.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
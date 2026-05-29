import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Follow } from '@/entities/all';
import { MessageSquare, Search, Inbox, MailQuestion } from 'lucide-react';
import { formatDistanceToNow, format, isToday, isYesterday, isThisWeek } from 'date-fns';
import { enUS } from 'date-fns/locale';

// Returns a human-friendly timestamp: "Just now", "5 min ago", "Yesterday", "Mon", or "12 Jan"
function formatConvoTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (isToday(date)) return format(date, 'HH:mm');
  if (isYesterday(date)) return 'Yesterday';
  if (isThisWeek(date, { weekStartsOn: 0 })) return format(date, 'EEE');
  return format(date, 'd MMM');
}

export default function ChatsPage() {
  const [conversations, setConversations] = useState([]);
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('inbox');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchConversations = async () => {
      setIsLoading(true);
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);

        // Fetch only messages relevant to current user
        const [sentMessages, receivedMessages, followingList, followerList] = await Promise.all([
          base44.entities.Message.filter({ created_by: user.email }),
          base44.entities.Message.filter({ recipient_email: user.email }),
          Follow.filter({ follower_email: user.email, status: 'approved' }),
          Follow.filter({ following_email: user.email, status: 'approved' }),
        ]);

        const allMyMessages = [...sentMessages, ...receivedMessages];

        // Build set of people I have a mutual follow with (connections)
        const followingEmails = new Set(followingList.map(f => f.following_email));
        const followerEmails = new Set(followerList.map(f => f.follower_email));
        const connectedEmails = new Set([...followingEmails].filter(e => followerEmails.has(e)));
        // Also include people I follow (one-way) — they're in inbox too
        followingList.forEach(f => connectedEmails.add(f.following_email));

        // Group messages into conversations keyed by the other user's email
        const convosMap = {};
        allMyMessages.forEach(msg => {
          const isSender = msg.created_by === user.email;
          const otherEmail = isSender ? msg.recipient_email : msg.created_by;
          const otherName = isSender ? msg.recipient_name : msg.sender_name;

          if (!otherEmail) return;

          if (!convosMap[otherEmail]) {
            convosMap[otherEmail] = {
              email: otherEmail,
              name: otherName || otherEmail,
              lastMessage: msg,
              hasUnread: !msg.is_read && !isSender,
            };
          } else {
            const existing = convosMap[otherEmail];
            if (new Date(msg.created_date) > new Date(existing.lastMessage.created_date)) {
              existing.lastMessage = msg;
            }
            if (!msg.is_read && !isSender) {
              existing.hasUnread = true;
            }
          }
        });

        const allConvos = Object.values(convosMap).sort(
          (a, b) => new Date(b.lastMessage.created_date) - new Date(a.lastMessage.created_date)
        );

        // Inbox: conversations with connected users OR chats I initiated
        const inbox = allConvos.filter(c => {
          const iAmSender = c.lastMessage.created_by === user.email || sentMessages.some(m => {
            const other = m.recipient_email;
            return other === c.email;
          });
          return connectedEmails.has(c.email) || iAmSender;
        });

        // Requests: messages received from people NOT in my connections and I haven't replied
        const requestEmails = new Set(inbox.map(c => c.email));
        const requestConvos = allConvos.filter(c => !requestEmails.has(c.email));

        setConversations(inbox);
        setRequests(requestConvos);
      } catch (error) {
        console.error("Failed to fetch conversations", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConversations();
  }, []);

  const handleChatSelect = (email, name) => {
    const event = new CustomEvent('navigateToChat', { detail: { email, name } });
    window.dispatchEvent(event);
  };

  const filteredConversations = conversations.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredRequests = requests.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const ChatListItem = ({ convo }) => (
    <div
      onClick={() => handleChatSelect(convo.email, convo.name)}
      className="flex items-center space-x-4 p-3 rounded-xl hover:bg-white cursor-pointer transition-colors"
    >
      <div className="relative shrink-0">
        <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center">
          <span className="text-blue-600 font-bold text-lg">
            {(convo.name || '?')[0].toUpperCase()}
          </span>
        </div>
        {convo.hasUnread && (
          <div className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-blue-50" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center">
          <h3 className={`font-semibold text-slate-800 truncate ${convo.hasUnread ? 'font-bold' : ''}`}>
            {convo.name}
          </h3>
          <p className="text-xs text-slate-500 shrink-0 ml-2">
            {formatConvoTime(convo.lastMessage.created_date)}
          </p>
        </div>
        <p className={`text-sm truncate ${convo.hasUnread ? 'font-semibold text-slate-700' : 'text-slate-500'}`}>
          {convo.lastMessage.created_by === currentUser?.email && <span className="text-slate-400">You: </span>}
          {convo.lastMessage.content}
        </p>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="animate-pulse text-slate-500">Loading chats...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50 pb-20">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-lg sticky top-0 z-40 p-4 border-b border-blue-100">
        <h1 className="text-2xl font-bold text-slate-900">Chats</h1>
        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-100 rounded-xl border-none outline-none text-sm"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="p-2 bg-white border-b border-blue-100">
        <div className="flex bg-slate-100 rounded-xl p-1">
          <button
            onClick={() => setActiveTab('inbox')}
            className={`w-1/2 p-2 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-all ${activeTab === 'inbox' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600'}`}
          >
            <Inbox className="w-5 h-5" />
            <span>Inbox</span>
            {conversations.some(c => c.hasUnread) && (
              <div className="w-2 h-2 rounded-full bg-red-500" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`w-1/2 p-2 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-all relative ${activeTab === 'requests' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600'}`}
          >
            <MailQuestion className="w-5 h-5" />
            <span>Requests</span>
            {requests.length > 0 && (
              <div className="w-2 h-2 rounded-full bg-red-500" />
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-2">
        {activeTab === 'inbox' && (
          filteredConversations.length > 0 ? (
            filteredConversations.map(convo => <ChatListItem key={convo.email} convo={convo} />)
          ) : (
            <div className="text-center py-20 text-slate-500">
              <MessageSquare className="w-16 h-16 mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-semibold">Your inbox is empty</h3>
              <p>Start a conversation from the feed or explore page.</p>
            </div>
          )
        )}
        {activeTab === 'requests' && (
          filteredRequests.length > 0 ? (
            <div>
              <p className="text-xs text-slate-500 px-3 py-2">
                These are messages from people you don't follow yet. You can reply to accept the conversation.
              </p>
              {filteredRequests.map(convo => <ChatListItem key={convo.email} convo={convo} />)}
            </div>
          ) : (
            <div className="text-center py-20 text-slate-500">
              <MailQuestion className="w-16 h-16 mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-semibold">No message requests</h3>
              <p>When someone you don't follow messages you, it'll appear here.</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Follow } from '@/entities/all';
import { ArrowLeft, Send, Lock, User as UserIcon } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';

function formatMsgTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isToday(date)) return format(date, 'HH:mm');
  if (isYesterday(date)) return `Yesterday ${format(date, 'HH:mm')}`;
  return format(date, 'd MMM HH:mm');
}

// Returns a date separator label for grouping messages
function dateSeparator(dateStr) {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'EEEE, d MMMM');
}

export const Chat = ({ onBack, recipient }) => {
  const recipientEmail = recipient?.email;
  const recipientName = recipient?.name;

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(true);
  const [hasAlreadySentRequest, setHasAlreadySentRequest] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);
  // Ref-based guard to prevent race conditions on rapid sends
  const requestSentRef = useRef(false);

  useEffect(() => {
    loadChatData();
  }, [recipientEmail]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadChatData = async () => {
    if (!recipientEmail) return;
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);

      const conversationId = [user.email, recipientEmail].sort().join('-');

      const [sentMessages, receivedMessages, followRecords] = await Promise.all([
        base44.entities.Message.filter({ created_by: user.email, conversation_id: conversationId }),
        base44.entities.Message.filter({ recipient_email: user.email, conversation_id: conversationId }),
        Follow.filter({ follower_email: user.email, following_email: recipientEmail }),
      ]);

      const allMessages = [...sentMessages, ...receivedMessages].sort(
        (a, b) => new Date(a.created_date) - new Date(b.created_date)
      );
      setMessages(allMessages);

      // Check if I follow them (or they accepted my follow request)
      const isFollowing = followRecords.some(f => f.status === 'approved');
      setIsConnected(isFollowing);

      // If not connected, check if I already sent at least one message (request already sent)
      if (!isFollowing) {
        const mySentMessages = allMessages.filter(m => m.created_by === user.email);
        const alreadySent = mySentMessages.length > 0;
        setHasAlreadySentRequest(alreadySent);
        requestSentRef.current = alreadySent;
      }
    } catch (error) {
      console.error('Error loading chat:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUser || !recipientEmail) return;
    // Use ref for instant blocking (prevents race conditions on rapid taps)
    if (!isConnected && requestSentRef.current) return;
    if (isSending) return;

    // If this is a request message, block immediately via ref before any async work
    if (!isConnected) {
      requestSentRef.current = true;
    }

    setIsSending(true);
    const conversationId = [currentUser.email, recipientEmail].sort().join('-');

    try {
      const message = await base44.entities.Message.create({
        recipient_email: recipientEmail,
        sender_name: currentUser.full_name,
        recipient_name: recipientName,
        content: newMessage,
        conversation_id: conversationId,
        created_by: currentUser.email,
      });

      setMessages(prev => [...prev, message]);
      setNewMessage('');

      if (!isConnected) {
        setHasAlreadySentRequest(true);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Revert the ref guard if send failed
      if (!isConnected) {
        requestSentRef.current = false;
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const canSend = isConnected || (!isConnected && !hasAlreadySentRequest);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-pulse w-8 h-8 bg-blue-200 rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-blue-100 p-4 flex items-center space-x-4 sticky top-0 z-10">
        <button onClick={onBack} className="p-2 hover:bg-blue-100 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6 text-blue-600" />
        </button>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 font-bold text-lg">
              {(recipientName || '?')[0].toUpperCase()}
            </span>
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">{recipientName || 'Chat'}</h2>
            {!isConnected && (
              <p className="text-xs text-amber-500">Message Request</p>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserIcon className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">Start a conversation</h3>
            <p className="text-slate-500 text-sm">Send your first message to {recipientName}</p>
          </div>
        ) : (
          messages.map((message, idx) => {
            const isMine = message.created_by === currentUser?.email;
            const prevMessage = messages[idx - 1];
            const prevDay = prevMessage?.created_date
              ? format(new Date(prevMessage.created_date), 'yyyy-MM-dd')
              : null;
            const thisDay = message.created_date
              ? format(new Date(message.created_date), 'yyyy-MM-dd')
              : null;
            const showSeparator = thisDay && thisDay !== prevDay;

            return (
              <React.Fragment key={message.id || idx}>
                {showSeparator && (
                  <div className="flex items-center justify-center my-3">
                    <span className="text-xs text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                      {dateSeparator(message.created_date)}
                    </span>
                  </div>
                )}
                <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                    isMine
                      ? 'bg-blue-500 text-white rounded-br-md'
                      : 'bg-slate-100 text-slate-900 rounded-bl-md'
                  }`}>
                    {!isMine && (
                      <p className="text-xs font-medium text-blue-600 mb-1">{message.sender_name}</p>
                    )}
                    <p className="text-sm">{message.content}</p>
                    <p className={`text-xs mt-1 ${isMine ? 'text-blue-200' : 'text-slate-400'}`}>
                      {formatMsgTime(message.created_date)}
                    </p>
                  </div>
                </div>
              </React.Fragment>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      {!isConnected && hasAlreadySentRequest ? (
        <div className="border-t border-blue-100 p-4 bg-amber-50 flex items-center space-x-3">
          <Lock className="w-5 h-5 text-amber-500 shrink-0" />
          <p className="text-sm text-amber-700">
            Message request sent. You can continue chatting once {recipientName} accepts your request.
          </p>
        </div>
      ) : (
        <div className="border-t border-blue-100 p-4">
          {!isConnected && (
            <p className="text-xs text-amber-600 mb-2 text-center">
              ⚠️ You can only send one message until {recipientName} accepts your request.
            </p>
          )}
          <div className="flex items-end space-x-2">
            <div className="flex-1 relative">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={`Message ${recipientName}...`}
                rows={1}
                className="w-full px-4 py-3 bg-slate-100 rounded-2xl border-none resize-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                style={{ minHeight: '48px', maxHeight: '120px' }}
              />
            </div>
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim() || isSending}
              className={`p-3 rounded-full transition-all ${
                newMessage.trim() && !isSending
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : 'bg-slate-200 text-slate-400'
              }`}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
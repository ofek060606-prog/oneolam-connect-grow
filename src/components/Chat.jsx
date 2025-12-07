import React, { useState, useEffect, useRef } from 'react';
import { Message, User } from '@/entities/all';
import { ArrowLeft, Send, Camera, User as UserIcon } from 'lucide-react';

export const Chat = ({ onBack, recipientEmail, recipientName }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadChatData();
  }, [recipientEmail]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadChatData = async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);
      
      if (recipientEmail) {
        const conversationId = [user.email, recipientEmail].sort().join('-');
        const messagesData = await Message.filter(
          { conversation_id: conversationId },
          '-created_date',
          50
        );
        setMessages(messagesData.reverse());
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

    const conversationId = [currentUser.email, recipientEmail].sort().join('-');

    try {
      const message = await Message.create({
        recipient_email: recipientEmail,
        sender_name: currentUser.full_name,
        recipient_name: recipientName,
        content: newMessage,
        conversation_id: conversationId
      });

      setMessages(prev => [...prev, message]);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-pulse">
          <div className="w-8 h-8 bg-blue-200 rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-blue-100 p-4 flex items-center space-x-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-blue-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-blue-600" />
        </button>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <UserIcon className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">{recipientName || 'Chat'}</h2>
            <p className="text-sm text-slate-500">Active in Shorashim</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserIcon className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">Start a conversation</h3>
            <p className="text-slate-500">Send your first message to {recipientName}</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.created_by === currentUser?.email ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                  message.created_by === currentUser?.email
                    ? 'bg-blue-500 text-white rounded-br-md'
                    : 'bg-slate-100 text-slate-900 rounded-bl-md'
                }`}
              >
                {message.created_by !== currentUser?.email && (
                  <p className="text-xs font-medium text-blue-600 mb-1">
                    {message.sender_name}
                  </p>
                )}
                <p className="text-sm">{message.content}</p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-blue-100 p-4">
        <div className="flex items-end space-x-2">
          <button className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition-colors">
            <Camera className="w-6 h-6" />
          </button>
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
            disabled={!newMessage.trim()}
            className={`p-3 rounded-full transition-all ${
              newMessage.trim()
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-slate-200 text-slate-400'
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
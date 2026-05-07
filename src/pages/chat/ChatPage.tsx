import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { chatApi } from '../../api/services';
import { formatDate, timeAgo } from '../../utils/helpers';
import type { Message, Conversation } from '../../types';
import {
  Search, Send, Image, MapPin, Phone, Video,
  MoreVertical, ArrowLeft, CheckCheck, Smile
} from 'lucide-react';
import './ChatPage.css';

export default function ChatPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchConv, setSearchConv] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (user) {
      loadConversations();
    }
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [user]);

  useEffect(() => {
    if (selectedChat) {
      loadMessages(selectedChat);
      // Poll for new messages every 5 seconds
      if (pollingRef.current) clearInterval(pollingRef.current);
      pollingRef.current = setInterval(() => {
        loadMessages(selectedChat, true);
      }, 5000);
    }
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [selectedChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    setIsLoading(true);
    try {
      const res: any = await chatApi.listConversations();
      if (res && res.data) {
        // Enrich conversations with "other user" info
        const enriched = res.data.map((conv: any) => {
          const isLandlord = user?.role === 'landlord';
          return {
            ...conv,
            other_user_name: isLandlord ? conv.tenant_name : conv.landlord_name,
            other_user_avatar: isLandlord ? conv.tenant_avatar : conv.landlord_avatar,
            other_user_id: isLandlord ? conv.tenant_id : conv.landlord_id,
          };
        });
        setConversations(enriched);
        if (enriched.length > 0 && !selectedChat) {
          setSelectedChat(enriched[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to load conversations', error);
    }
    setIsLoading(false);
  };

  const loadMessages = async (conversationId: string, silent = false) => {
    if (!silent) setMessagesLoading(true);
    try {
      const res: any = await chatApi.getMessages(conversationId);
      if (res && res.data) {
        setMessages(res.data);
      }
    } catch (error) {
      console.error('Failed to load messages', error);
    }
    if (!silent) setMessagesLoading(false);
  };

  const handleSend = async () => {
    if (!message.trim() || !selectedChat || sending) return;
    
    const content = message.trim();
    setSending(true);
    setMessage('');
    
    // Optimistic update
    const optimisticMsg: Message = {
      id: 'temp-' + Date.now(),
      sender_id: user!.id,
      content,
      is_read: false,
      created_at: new Date().toISOString(),
      sender_name: user!.fullName,
      sender_avatar: user!.avatar,
    };
    setMessages(prev => [...prev, optimisticMsg]);
    
    try {
      await chatApi.sendMessage(selectedChat, content);
      // Reload messages to get the real message with proper ID
      await loadMessages(selectedChat, true);
      // Refresh conversations to update last message
      loadConversations();
    } catch (error) {
      console.error('Failed to send message', error);
      // Remove optimistic message on failure
      setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
      setMessage(content); // Restore message input
      alert('Gửi tin nhắn thất bại. Vui lòng thử lại.');
    } finally {
      setSending(false);
    }
  };

  const handleSelectChat = (convId: string) => {
    setSelectedChat(convId);
    setMessages([]);
  };

  if (!user) {
    return (
      <div className="chat-page">
        <div style={{ padding: '120px var(--space-6)', textAlign: 'center' }}>
          <h2>Vui lòng đăng nhập để sử dụng tin nhắn</h2>
          <button className="btn btn-primary" onClick={() => navigate('/login')}>Đăng nhập</button>
        </div>
      </div>
    );
  }

  const selectedConversation = conversations.find(c => c.id === selectedChat);
  const filteredConversations = conversations.filter(c => {
    if (!searchConv) return true;
    const name = (c as any).other_user_name || '';
    return name.toLowerCase().includes(searchConv.toLowerCase());
  });

  const quickReplies = [
    'Phòng còn trống không ạ?',
    'Giá phòng bao nhiêu ạ?',
    'Có thể xem phòng được không ạ?',
    'Cảm ơn anh/chị!'
  ];

  const formatMessageTime = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) {
      return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) + ' ' + 
           date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="chat-page">
      <div className="chat-container">
        {/* Chat List */}
        <div className={`chat-sidebar ${selectedChat ? 'chat-sidebar-hidden-mobile' : ''}`}>
          <div className="chat-sidebar-header">
            <h2>Tin nhắn</h2>
            <div className="chat-search">
              <Search size={16} />
              <input 
                type="text" 
                placeholder="Tìm cuộc trò chuyện..." 
                value={searchConv}
                onChange={(e) => setSearchConv(e.target.value)}
              />
            </div>
          </div>

          <div className="chat-list">
            {isLoading ? (
              <div style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--text-secondary)' }}>
                Đang tải...
              </div>
            ) : filteredConversations.length === 0 ? (
              <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <p>Chưa có cuộc trò chuyện nào</p>
              </div>
            ) : (
              filteredConversations.map(conv => (
                <div
                  key={conv.id}
                  className={`chat-list-item ${selectedChat === conv.id ? 'active' : ''}`}
                  onClick={() => handleSelectChat(conv.id)}
                >
                  <div className="chat-list-avatar-wrapper">
                    <img
                      src={(conv as any).other_user_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${conv.id}`}
                      alt={(conv as any).other_user_name || 'User'}
                      className="chat-list-avatar"
                    />
                    <span className="chat-list-online"></span>
                  </div>
                  <div className="chat-list-info">
                    <div className="chat-list-name-row">
                      <h4>{(conv as any).other_user_name || 'Người dùng'}</h4>
                      <span className="chat-list-time">
                        {conv.last_message_at ? timeAgo(conv.last_message_at) : ''}
                      </span>
                    </div>
                    <p className="chat-list-preview">
                      {conv.room_title ? `📍 ${conv.room_title}` : ''}
                      {conv.last_message ? (conv.room_title ? ' · ' : '') + conv.last_message : ''}
                    </p>
                  </div>
                  {(conv.unread_count || 0) > 0 && (
                    <span className="chat-list-unread">{conv.unread_count}</span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Window */}
        {selectedChat && selectedConversation ? (
          <div className="chat-main">
            {/* Chat Header */}
            <div className="chat-header">
              <button className="chat-back-btn" onClick={() => setSelectedChat(null)}>
                <ArrowLeft size={20} />
              </button>
              <div className="chat-header-user">
                <img
                  src={(selectedConversation as any).other_user_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedChat}`}
                  alt=""
                  className="chat-header-avatar"
                />
                <div>
                  <h3>{(selectedConversation as any).other_user_name || 'Người dùng'}</h3>
                  {selectedConversation.room_title && (
                    <span className="chat-header-status">📍 {selectedConversation.room_title}</span>
                  )}
                </div>
              </div>
              <div className="chat-header-actions">
                <button className="btn btn-ghost btn-icon-sm">
                  <Phone size={18} />
                </button>
                <button className="btn btn-ghost btn-icon-sm">
                  <Video size={18} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="chat-messages">
              {messagesLoading ? (
                <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-secondary)' }}>
                  <p>Đang tải tin nhắn...</p>
                </div>
              ) : messages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-secondary)' }}>
                  <p>Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMine = msg.sender_id === user!.id;
                  return (
                    <div
                      key={msg.id}
                      className={`chat-message ${isMine ? 'chat-message-mine' : 'chat-message-other'}`}
                    >
                      {!isMine && (
                        <img
                          src={msg.sender_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.sender_id}`}
                          alt={msg.sender_name}
                          className="chat-message-avatar"
                        />
                      )}
                      <div className="chat-message-content">
                        <div className={`chat-message-bubble ${isMine ? 'chat-bubble-mine' : 'chat-bubble-other'}`}>
                          {msg.content}
                        </div>
                        <span className="chat-message-time">
                          {formatMessageTime(msg.created_at)}
                          {isMine && msg.is_read && (
                            <CheckCheck size={14} style={{ marginLeft: '4px', color: 'var(--primary-500)' }} />
                          )}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Replies */}
            {messages.length === 0 && (
              <div className="chat-quick-replies">
                {quickReplies.map((reply, i) => (
                  <button key={i} className="chat-quick-reply" onClick={() => setMessage(reply)}>
                    {reply}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="chat-input-area">
              <div className="chat-input-wrapper">
                <input
                  type="text"
                  placeholder="Nhập tin nhắn..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  disabled={sending}
                />
              </div>
              <button
                className="chat-send-btn"
                onClick={handleSend}
                disabled={!message.trim() || sending}
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        ) : (
          <div className="chat-empty">
            <MessageCircleIcon />
            <h3>Chọn một cuộc trò chuyện</h3>
            <p>Nhấn vào cuộc trò chuyện để bắt đầu nhắn tin</p>
          </div>
        )}
      </div>
    </div>
  );
}

function MessageCircleIcon() {
  return (
    <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--primary-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-500)', marginBottom: 'var(--space-4)' }}>
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    </div>
  );
}

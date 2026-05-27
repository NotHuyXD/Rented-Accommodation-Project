import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { chatApi } from '../../api/services';
import { timeAgo } from '../../utils/helpers';
import type { Message, Conversation } from '../../types';
import {
  Search, Send, Phone, Video,
  ArrowLeft, CheckCheck, Smile, X, MessageSquarePlus
} from 'lucide-react';
import './ChatPage.css';

// Emoji nhanh phổ biến
const QUICK_EMOJIS = ['😊','😄','👍','❤️','🙏','😂','🎉','😍','🤔','👋','💪','✅','🏠','📞','💰','🔑'];

const QUICK_REPLIES = [
  'Phòng còn trống không ạ?',
  'Giá phòng bao nhiêu ạ?',
  'Có thể hẹn xem phòng được không ạ?',
  'Cho tôi xin số điện thoại để liên hệ.',
  'Cảm ơn anh/chị!',
  'Phòng có điều hòa không ạ?',
];

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
  const [showEmoji, setShowEmoji] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastMessageCountRef = useRef(0);

  useEffect(() => {
    if (user) loadConversations();
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [user]);

  useEffect(() => {
    if (selectedChat) {
      setMessages([]);
      loadMessages(selectedChat);
      if (pollingRef.current) clearInterval(pollingRef.current);
      pollingRef.current = setInterval(() => loadMessages(selectedChat, true), 4000);
    }
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [selectedChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const loadConversations = async () => {
    setIsLoading(true);
    try {
      const res: any = await chatApi.listConversations();
      if (res?.data) {
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
        if (enriched.length > 0 && !selectedChat) setSelectedChat(enriched[0].id);
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
      if (res?.data) {
        const newCount = res.data.length;
        if (silent && newCount !== lastMessageCountRef.current) {
          setMessages(res.data);
          lastMessageCountRef.current = newCount;
          loadConversations();
        } else if (!silent) {
          setMessages(res.data);
          lastMessageCountRef.current = res.data.length;
        }
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
    setShowEmoji(false);
    setShowQuickReplies(false);

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
      await loadMessages(selectedChat, false);
      loadConversations();
    } catch {
      setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
      setMessage(content);
      alert('Gửi tin nhắn thất bại. Vui lòng thử lại.');
    } finally {
      setSending(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleSelectChat = (convId: string) => {
    setSelectedChat(convId);
    setShowEmoji(false);
    setShowQuickReplies(false);
  };

  const insertEmoji = (emoji: string) => {
    setMessage(prev => prev + emoji);
    setShowEmoji(false);
    inputRef.current?.focus();
  };

  const insertQuickReply = (text: string) => {
    setMessage(text);
    setShowQuickReplies(false);
    inputRef.current?.focus();
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

  const formatMsgTime = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
      + ' ' + date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  // Group messages by date
  const groupedMessages: { date: string; msgs: Message[] }[] = [];
  messages.forEach(msg => {
    const d = new Date(msg.created_at).toDateString();
    const last = groupedMessages[groupedMessages.length - 1];
    if (last && last.date === d) last.msgs.push(msg);
    else groupedMessages.push({ date: d, msgs: [msg] });
  });

  const formatDateLabel = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return 'Hôm nay';
    const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Hôm qua';
    return d.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <div className="chat-page">
      <div className="chat-container">
        {/* ===== SIDEBAR ===== */}
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
              <div className="chat-loading-state">
                {[1, 2, 3].map(i => (
                  <div key={i} className="chat-skeleton-item">
                    <div className="chat-skeleton-avatar" />
                    <div className="chat-skeleton-lines">
                      <div className="chat-skeleton-line chat-skeleton-line-name" />
                      <div className="chat-skeleton-line chat-skeleton-line-msg" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="chat-empty-list">
                <MessageSquarePlus size={40} />
                <p>Chưa có cuộc trò chuyện nào</p>
                <span>Nhắn tin từ trang chi tiết phòng</span>
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
                    <span className="chat-list-online" />
                  </div>
                  <div className="chat-list-info">
                    <div className="chat-list-name-row">
                      <h4>{(conv as any).other_user_name || 'Người dùng'}</h4>
                      <span className="chat-list-time">
                        {conv.last_message_at ? timeAgo(conv.last_message_at) : ''}
                      </span>
                    </div>
                    <p className="chat-list-preview">
                      {conv.room_title ? `🏠 ${conv.room_title}` : ''}
                      {conv.last_message
                        ? (conv.room_title ? ' · ' : '') + conv.last_message.substring(0, 40)
                        : ' · Chưa có tin nhắn'}
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

        {/* ===== CHAT WINDOW ===== */}
        {selectedChat && selectedConversation ? (
          <div className="chat-main">
            {/* Header */}
            <div className="chat-header">
              <button className="chat-back-btn" onClick={() => setSelectedChat(null)}>
                <ArrowLeft size={20} />
              </button>
              <div className="chat-header-user">
                <div className="chat-header-avatar-wrap">
                  <img
                    src={(selectedConversation as any).other_user_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedChat}`}
                    alt=""
                    className="chat-header-avatar"
                  />
                  <span className="chat-header-online-dot" />
                </div>
                <div>
                  <h3>{(selectedConversation as any).other_user_name || 'Người dùng'}</h3>
                  {selectedConversation.room_title && (
                    <span className="chat-header-status">🏠 {selectedConversation.room_title}</span>
                  )}
                </div>
              </div>
              <div className="chat-header-actions">
                <button className="chat-header-btn" title="Gọi điện">
                  <Phone size={18} />
                </button>
                <button className="chat-header-btn" title="Video call">
                  <Video size={18} />
                </button>
              </div>
            </div>

            {/* Messages area */}
            <div className="chat-messages" onClick={() => { setShowEmoji(false); setShowQuickReplies(false); }}>
              {messagesLoading ? (
                <div className="chat-msgs-loading">
                  <div className="chat-spinner" />
                  <p>Đang tải tin nhắn...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="chat-msgs-empty">
                  <div className="chat-msgs-empty-icon">💬</div>
                  <p>Chưa có tin nhắn nào</p>
                  <span>Hãy bắt đầu cuộc trò chuyện!</span>
                </div>
              ) : (
                groupedMessages.map(group => (
                  <div key={group.date}>
                    <div className="chat-date-divider">
                      <span>{formatDateLabel(group.date)}</span>
                    </div>
                    {group.msgs.map((msg) => {
                      const isMine = msg.sender_id === user!.id;
                      const isTemp = msg.id.startsWith('temp-');
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
                            <div className={`chat-message-bubble ${isMine ? 'chat-bubble-mine' : 'chat-bubble-other'} ${isTemp ? 'chat-bubble-sending' : ''}`}>
                              {msg.content}
                            </div>
                            <span className="chat-message-time">
                              {formatMsgTime(msg.created_at)}
                              {isMine && (
                                <span className="chat-read-status">
                                  {isTemp
                                    ? <span style={{ opacity: 0.5 }}>✓</span>
                                    : msg.is_read
                                      ? <CheckCheck size={13} style={{ color: 'var(--primary-500)' }} />
                                      : <CheckCheck size={13} style={{ opacity: 0.4 }} />
                                  }
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick replies popup */}
            {showQuickReplies && (
              <div className="chat-quickreply-popup">
                <div className="chat-quickreply-header">
                  <span>Trả lời nhanh</span>
                  <button onClick={() => setShowQuickReplies(false)}><X size={14} /></button>
                </div>
                {QUICK_REPLIES.map((r, i) => (
                  <button key={i} className="chat-quickreply-item" onClick={() => insertQuickReply(r)}>
                    {r}
                  </button>
                ))}
              </div>
            )}

            {/* Emoji picker popup */}
            {showEmoji && (
              <div className="chat-emoji-picker">
                {QUICK_EMOJIS.map((e, i) => (
                  <button key={i} className="chat-emoji-btn" onClick={() => insertEmoji(e)}>{e}</button>
                ))}
              </div>
            )}

            {/* Input area */}
            <div className="chat-input-area">
              <button
                className={`chat-input-btn ${showQuickReplies ? 'active' : ''}`}
                onClick={() => { setShowQuickReplies(p => !p); setShowEmoji(false); }}
                title="Trả lời nhanh"
              >
                <MessageSquarePlus size={20} />
              </button>
              <button
                className={`chat-input-btn ${showEmoji ? 'active' : ''}`}
                onClick={() => { setShowEmoji(p => !p); setShowQuickReplies(false); }}
                title="Emoji"
              >
                <Smile size={20} />
              </button>
              <div className="chat-input-wrapper">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Nhập tin nhắn..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  disabled={sending}
                  autoComplete="off"
                />
              </div>
              <button
                className={`chat-send-btn ${message.trim() ? 'chat-send-btn-active' : ''}`}
                onClick={handleSend}
                disabled={!message.trim() || sending}
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        ) : (
          <div className="chat-empty">
            <div className="chat-empty-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <h3>Chọn một cuộc trò chuyện</h3>
            <p>Nhấn vào cuộc trò chuyện bên trái để bắt đầu nhắn tin</p>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useRoomStore } from '../../stores/roomStore';
import { notificationApi } from '../../api/services';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { chatApi } from '../../api/services';
import { adminApi } from '../../api/services';
import {
  Search, Send, Image, MapPin, Phone, Video,
  MoreVertical, ArrowLeft, CheckCheck, Smile
} from 'lucide-react';
import './ChatPage.css';

export default function ChatPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  const loadConversations = async () => {
    setIsLoading(true);
    try {
      const res: any = await chatApi.listConversations();
      if (res && res.data) {
        setConversations(res.data);
        if (res.data.length > 0) {
          setSelectedChat(res.data[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to load conversations', error);
    }
    setIsLoading(false);
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

  const handleSend = () => {
    if (!message.trim()) return;
    // In a real implementation, this would send via WebSocket or API
    setMessage('');
  };

  const quickReplies = [
    'Phòng còn trống không ạ?',
    'Giá phòng bao nhiêu ạ?',
    'Có thể xem phòng được không ạ?',
    'Cảm ơn anh/chị!'
  ];

  return (
    <div className="chat-page">
      <div className="chat-container">
        {/* Chat List */}
        <div className={`chat-sidebar ${selectedChat ? 'chat-sidebar-hidden-mobile' : ''}`}>
          <div className="chat-sidebar-header">
            <h2>Tin nhắn</h2>
            <div className="chat-search">
              <Search size={16} />
              <input type="text" placeholder="Tìm cuộc trò chuyện..." />
            </div>
          </div>

          <div className="chat-list">
            {isLoading ? (
              <div style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--text-secondary)' }}>
                Đang tải...
              </div>
            ) : conversations.length === 0 ? (
              <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <p>Chưa có cuộc trò chuyện nào</p>
              </div>
            ) : (
              conversations.map(conv => (
                <div
                  key={conv.id}
                  className={`chat-list-item ${selectedChat === conv.id ? 'active' : ''}`}
                  onClick={() => setSelectedChat(conv.id)}
                >
                  <div className="chat-list-avatar-wrapper">
                    <img
                      src={conv.other_user_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${conv.id}`}
                      alt={conv.other_user_name || 'User'}
                      className="chat-list-avatar"
                    />
                    <span className="chat-list-online"></span>
                  </div>
                  <div className="chat-list-info">
                    <div className="chat-list-name-row">
                      <h4>{conv.other_user_name || 'Người dùng'}</h4>
                      <span className="chat-list-time">
                        {conv.last_message_at ? formatDate(conv.last_message_at) : ''}
                      </span>
                    </div>
                    <p className="chat-list-preview">
                      {conv.last_message || ''}
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
                  src={selectedConversation.other_user_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedChat}`}
                  alt=""
                  className="chat-header-avatar"
                />
                <div>
                  <h3>{selectedConversation.other_user_name || 'Người dùng'}</h3>
                  <span className="chat-header-status">Đang hoạt động</span>
                </div>
              </div>
              <div className="chat-header-actions">
                <button className="btn btn-ghost btn-icon-sm">
                  <Phone size={18} />
                </button>
                <button className="btn btn-ghost btn-icon-sm">
                  <Video size={18} />
                </button>
                <button className="btn btn-ghost btn-icon-sm">
                  <MoreVertical size={18} />
                </button>
              </div>
            </div>

            {/* Messages - placeholder for real-time messages */}
            <div className="chat-messages">
              <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-secondary)' }}>
                <p>Tin nhắn sẽ hiển thị ở đây</p>
                <p style={{ fontSize: 'var(--font-size-sm)' }}>Tính năng nhắn tin real-time đang được phát triển</p>
              </div>
            </div>

            {/* Quick Replies */}
            <div className="chat-quick-replies">
              {quickReplies.map((reply, i) => (
                <button key={i} className="chat-quick-reply" onClick={() => setMessage(reply)}>
                  {reply}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="chat-input-area">
              <button className="chat-input-btn">
                <Image size={20} />
              </button>
              <button className="chat-input-btn">
                <MapPin size={20} />
              </button>
              <div className="chat-input-wrapper">
                <input
                  type="text"
                  placeholder="Nhập tin nhắn..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                />
                <button className="chat-input-btn">
                  <Smile size={20} />
                </button>
              </div>
              <button
                className="chat-send-btn"
                onClick={handleSend}
                disabled={!message.trim()}
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

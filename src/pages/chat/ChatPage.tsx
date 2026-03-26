import { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useNavigate } from 'react-router-dom';
import { mockChatRooms, mockMessages, mockUsers } from '../../data/mockData';
import { timeAgo } from '../../utils/helpers';
import {
  Search, Send, Image, MapPin, Phone, Video,
  MoreVertical, ArrowLeft, CheckCheck, Smile
} from 'lucide-react';
import './ChatPage.css';

export default function ChatPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [selectedChat, setSelectedChat] = useState<string | null>('chat-1');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState(mockMessages);

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

  const getOtherUser = (chatRoom: typeof mockChatRooms[0]) => {
    const otherId = chatRoom.participants.find(id => id !== user.id);
    return mockUsers.find(u => u.id === otherId);
  };

  const handleSend = () => {
    if (!message.trim()) return;
    const newMsg = {
      id: `msg-${Date.now()}`,
      senderId: user.id,
      receiverId: selectedChat === 'chat-1' ? 'user-2' : 'user-4',
      content: message,
      type: 'text' as const,
      createdAt: new Date().toISOString(),
      read: false
    };
    setMessages([...messages, newMsg]);
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
            {mockChatRooms.map(chatRoom => {
              const otherUser = getOtherUser(chatRoom);
              if (!otherUser) return null;
              return (
                <div
                  key={chatRoom.id}
                  className={`chat-list-item ${selectedChat === chatRoom.id ? 'active' : ''}`}
                  onClick={() => setSelectedChat(chatRoom.id)}
                >
                  <div className="chat-list-avatar-wrapper">
                    <img src={otherUser.avatar} alt={otherUser.fullName} className="chat-list-avatar" />
                    <span className="chat-list-online"></span>
                  </div>
                  <div className="chat-list-info">
                    <div className="chat-list-name-row">
                      <h4>{otherUser.fullName}</h4>
                      <span className="chat-list-time">
                        {chatRoom.lastMessage ? timeAgo(chatRoom.lastMessage.createdAt) : ''}
                      </span>
                    </div>
                    <p className="chat-list-preview">
                      {chatRoom.lastMessage?.content || ''}
                    </p>
                  </div>
                  {chatRoom.unreadCount > 0 && (
                    <span className="chat-list-unread">{chatRoom.unreadCount}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Chat Window */}
        {selectedChat ? (
          <div className="chat-main">
            {/* Chat Header */}
            <div className="chat-header">
              <button className="chat-back-btn" onClick={() => setSelectedChat(null)}>
                <ArrowLeft size={20} />
              </button>
              <div className="chat-header-user">
                <img
                  src={getOtherUser(mockChatRooms.find(c => c.id === selectedChat)!)?.avatar}
                  alt=""
                  className="chat-header-avatar"
                />
                <div>
                  <h3>{getOtherUser(mockChatRooms.find(c => c.id === selectedChat)!)?.fullName}</h3>
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

            {/* Messages */}
            <div className="chat-messages">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`chat-message ${msg.senderId === user.id ? 'chat-message-sent' : 'chat-message-received'}`}
                >
                  <div className="chat-bubble">
                    <p>{msg.content}</p>
                    <span className="chat-message-time">
                      {new Date(msg.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      {msg.senderId === user.id && <CheckCheck size={14} />}
                    </span>
                  </div>
                </div>
              ))}
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

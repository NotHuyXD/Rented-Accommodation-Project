import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import HomePage from './pages/home/HomePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import RoomListPage from './pages/rooms/RoomListPage';
import RoomDetailPage from './pages/rooms/RoomDetailPage';
import LandlordDashboard from './pages/landlord/LandlordDashboard';
import TenantDashboard from './pages/tenant/TenantDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import ChatPage from './pages/chat/ChatPage';
import FavoritesPage from './pages/favorites/FavoritesPage';
import ProfilePage from './pages/profile/ProfilePage';
import ContractsPage from './pages/contracts/ContractsPage';
import PaymentsPage from './pages/payments/PaymentsPage';
import PostRoomPage from './pages/landlord/PostRoomPage';
import GlobalModal from './components/common/GlobalModal';

function App() {
  return (
    <Router>
      <GlobalModal />
      <div className="app">
        <Header />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/rooms" element={<RoomListPage />} />
            <Route path="/rooms/:id" element={<RoomDetailPage />} />
            <Route path="/landlord" element={<LandlordDashboard />} />
            <Route path="/landlord/*" element={<LandlordDashboard />} />
            <Route path="/tenant" element={<TenantDashboard />} />
            <Route path="/tenant/*" element={<TenantDashboard />} />
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/*" element={<AdminDashboard />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/favorites" element={<FavoritesPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/contracts" element={<ContractsPage />} />
            <Route path="/payments" element={<PaymentsPage />} />
            <Route path="/landlord/rooms/new" element={<PostRoomPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
        <Routes>
          <Route path="/chat" element={null} />
          <Route path="/login" element={null} />
          <Route path="/forgot-password" element={null} />
          <Route path="/register" element={null} />
          <Route path="/admin/*" element={null} />
          <Route path="*" element={<Footer />} />
        </Routes>
      </div>
    </Router>
  );
}

function NotFoundPage() {
  return (
    <div style={{
      paddingTop: '120px',
      minHeight: '60vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      gap: '16px'
    }}>
      <h1 style={{ fontSize: '6rem', fontWeight: 900, color: 'var(--primary-500)', lineHeight: 1 }}>404</h1>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Trang không tồn tại</h2>
      <p style={{ color: 'var(--text-secondary)' }}>Trang bạn tìm kiếm không có hoặc đã bị xóa.</p>
      <a href="/" className="btn btn-primary">Về trang chủ</a>
    </div>
  );
}

export default App;

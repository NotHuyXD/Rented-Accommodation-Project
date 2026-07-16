import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { adminApi, userApi, roomApi, reportApi, reviewApi } from '../../api/services';
import { formatCurrency, formatDate, getImageUrl } from '../../utils/helpers';
import {
  Users, Building2, DollarSign, AlertTriangle, Shield,
  Eye, Ban, CheckCircle2, Search, BarChart3, LogOut,
  Flag, Check, X, Star, Trash2, ShieldAlert, FileText, ChevronRight,
  Edit
} from 'lucide-react';
import './AdminDashboard.css';
import { alertQuick, confirmAsync } from '../../stores/modalStore';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);

  // Stats State
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [recentRooms, setRecentRooms] = useState<any[]>([]);

  // Users Tab State
  const [usersList, setUsersList] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [userKycFilter, setUserKycFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [selectedUserKYC, setSelectedUserKYC] = useState<any | null>(null);

  // Rooms Tab State
  const [roomsList, setRoomsList] = useState<any[]>([]);
  const [roomSearch, setRoomSearch] = useState('');
  const [roomStatusFilter, setRoomStatusFilter] = useState('all');
  const [selectedRoom, setSelectedRoom] = useState<any | null>(null);
  const [editRoomData, setEditRoomData] = useState<any | null>(null);

  // Reports Tab State
  const [reportsList, setReportsList] = useState<any[]>([]);
  const [reportStatusFilter, setReportStatusFilter] = useState('all');
  const [reportTypeFilter, setReportTypeFilter] = useState('all');
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [selectedReportTarget, setSelectedReportTarget] = useState<any | null>(null);

  // Pagination states
  const [userPage, setUserPage] = useState(1);
  const [userTotalPages, setUserTotalPages] = useState(1);
  const [roomPage, setRoomPage] = useState(1);
  const [roomTotalPages, setRoomTotalPages] = useState(1);

  // Auth Protection Redirect
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/admin/login');
    }
  }, [user, navigate]);

  // Load Dashboard Data
  useEffect(() => {
    if (user && user.role === 'admin') {
      loadDashboard();
    }
  }, [user]);

  // Load active tab data
  useEffect(() => {
    if (user && user.role === 'admin') {
      if (activeTab === 'users') {
        fetchUsers();
      } else if (activeTab === 'rooms') {
        fetchRooms();
      } else if (activeTab === 'reports') {
        fetchReports();
      }
    }
  }, [activeTab, userSearch, userRoleFilter, userKycFilter, userPage, roomSearch, roomStatusFilter, roomPage, reportStatusFilter, reportTypeFilter]);

  const loadDashboard = async () => {
    setIsLoading(true);
    try {
      const statsRes: any = await adminApi.getStats();
      if (statsRes?.data) {
        setDashboardStats(statsRes.data);
        if (statsRes.data.recentUsers) setRecentUsers(statsRes.data.recentUsers);
        if (statsRes.data.recentRooms) setRecentRooms(statsRes.data.recentRooms);
      }
    } catch (error) {
      console.error('Failed to load admin stats', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const params: any = {
        page: userPage,
        limit: 10,
        search: userSearch || undefined,
        role: userRoleFilter !== 'all' ? userRoleFilter : undefined,
        kycStatus: userKycFilter !== 'all' ? userKycFilter : undefined
      };
      const res: any = await adminApi.listAllUsers(params);
      if (res?.data) {
        setUsersList(res.data);
        if (res.pagination) {
          setUserTotalPages(res.pagination.totalPages || 1);
        }
      }
    } catch (error) {
      console.error('Failed to fetch users', error);
    }
  };

  const fetchRooms = async () => {
    try {
      const params: any = {
        page: roomPage,
        limit: 10,
        search: roomSearch || undefined,
        status: roomStatusFilter !== 'all' ? roomStatusFilter : undefined
      };
      const res: any = await adminApi.listAllRooms(params);
      if (res?.data) {
        setRoomsList(res.data);
        if (res.pagination) {
          setRoomTotalPages(res.pagination.totalPages || 1);
        }
      }
    } catch (error) {
      console.error('Failed to fetch rooms', error);
    }
  };

  const fetchReports = async () => {
    try {
      const params: any = {
        status: reportStatusFilter !== 'all' ? reportStatusFilter : undefined,
        targetType: reportTypeFilter !== 'all' ? reportTypeFilter : undefined
      };
      const res: any = await reportApi.list(params);
      if (res?.data) {
        setReportsList(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch reports', error);
    }
  };

  // AD02 - View User & KYC detail
  const handleViewUser = async (usr: any) => {
    setSelectedUser(usr);
    setSelectedUserKYC(null);
    if (usr.kycStatus !== 'none') {
      try {
        const res: any = await adminApi.getUserVerification(usr.id);
        if (res?.data) {
          setSelectedUserKYC(res.data);
        }
      } catch (error) {
        console.error('Failed to load user KYC verification data', error);
      }
    }
  };

  // AD02 - Change User Role
  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    try {
      await adminApi.updateUserRole(userId, newRole);
      alertQuick('success', 'Cập nhật vai trò thành công');
      setUsersList(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser((prev: any) => ({ ...prev, role: newRole }));
      }
      loadDashboard();
    } catch (error) {
      console.error('Failed to update role', error);
      alertQuick('error', 'Không thể cập nhật vai trò');
    }
  };

  // AD02 - Approve/Reject KYC
  const handleReviewKYC = async (verificationId: string, status: 'approved' | 'rejected') => {
    try {
      await userApi.reviewKYC(verificationId, status);
      alertQuick('success', `Đã ${status === 'approved' ? 'phê duyệt' : 'từ chối'} hồ sơ xác thực`);
      
      // Update local state
      if (selectedUser) {
        const updatedStatus = status === 'approved' ? 'approved' : 'rejected';
        setUsersList(prev => prev.map(u => u.id === selectedUser.id ? { ...u, kycStatus: updatedStatus, isVerified: status === 'approved' } : u));
        setSelectedUser((prev: any) => ({ ...prev, kycStatus: updatedStatus, isVerified: status === 'approved' }));
      }
      
      // Reload KYC info
      if (selectedUser) {
        const res: any = await adminApi.getUserVerification(selectedUser.id);
        if (res?.data) {
          setSelectedUserKYC(res.data);
        }
      }
      loadDashboard();
    } catch (error) {
      console.error('Failed to review KYC', error);
      alertQuick('error', 'Thao tác duyệt KYC thất bại');
    }
  };

  // AD03 - Open Edit Room Modal
  const handleOpenEditRoom = async (roomId: string) => {
    try {
      const res: any = await roomApi.getById(roomId);
      if (res?.data) {
        const room = res.data;
        setEditRoomData({
          id: room.id,
          title: room.title,
          description: room.description || '',
          price: room.price,
          deposit: room.deposit || 0,
          area: room.area,
          maxOccupants: room.maxOccupants || room.max_occupants || 1,
          status: room.status,
          address: room.address
        });
      }
    } catch (error) {
      console.error('Failed to load room for editing', error);
      alertQuick('error', 'Không thể tải thông tin phòng trọ để sửa');
    }
  };

  // AD03 - Save Edited Room
  const handleSaveEditRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editRoomData) return;
    try {
      await roomApi.update(editRoomData.id, {
        title: editRoomData.title,
        description: editRoomData.description,
        price: Number(editRoomData.price),
        deposit: Number(editRoomData.deposit),
        area: Number(editRoomData.area),
        maxOccupants: Number(editRoomData.maxOccupants),
        status: editRoomData.status,
        address: editRoomData.address
      });
      alertQuick('success', 'Cập nhật thông tin phòng trọ thành công!');
      setEditRoomData(null);
      
      // Refresh details if open
      if (selectedRoom && selectedRoom.id === editRoomData.id) {
        handleViewRoom(editRoomData.id);
      }
      fetchRooms();
      loadDashboard();
    } catch (error) {
      console.error('Failed to update room', error);
      alertQuick('error', 'Không thể cập nhật thông tin phòng trọ');
    }
  };

  // AD03 - Physical/Logical Delete Room
  const handleDeleteRoom = async (roomId: string) => {
    if (!(await confirmAsync('Xác nhận', 'Bạn có chắc chắn muốn xóa vĩnh viễn phòng trọ này khỏi hệ thống?'))) return;
    try {
      await roomApi.delete(roomId);
      alertQuick('success', 'Đã xóa phòng trọ thành công!');
      setSelectedRoom(null);
      fetchRooms();
      loadDashboard();
    } catch (error) {
      console.error('Failed to delete room', error);
      alertQuick('error', 'Không thể xóa phòng trọ');
    }
  };

  // AD03 - View Room Details (admin mode, fetches full details)
  const handleViewRoom = async (roomId: string) => {
    try {
      const res: any = await roomApi.getById(roomId);
      if (res?.data) {
        setSelectedRoom(res.data);
      }
    } catch (error) {
      console.error('Failed to load room details', error);
      alertQuick('error', 'Không thể tải chi tiết phòng trọ');
    }
  };

  // AD03 - Hide / Reject Room
  const handleHideRoom = async (roomId: string) => {
    if (!(await confirmAsync('Xác nhận', 'Bạn có chắc chắn muốn ẩn phòng trọ này khỏi hệ thống?'))) return;
    try {
      await roomApi.updateStatus(roomId, 'hidden');
      alertQuick('success', 'Đã ẩn phòng trọ thành công');
      fetchRooms();
      if (selectedRoom && selectedRoom.id === roomId) {
        setSelectedRoom((prev: any) => ({ ...prev, status: 'hidden' }));
      }
      loadDashboard();
    } catch (error) {
      console.error('Failed to hide room', error);
      alertQuick('error', 'Ẩn phòng trọ thất bại');
    }
  };

  const handleApproveRoomQuick = async (roomId: string) => {
    try {
      await roomApi.updateStatus(roomId, 'available');
      alertQuick('success', 'Phê duyệt phòng trọ thành công');
      loadDashboard();
      fetchRooms();
    } catch (error) {
      console.error('Approve room failed', error);
    }
  };

  const handleRejectRoomQuick = async (roomId: string) => {
    try {
      await roomApi.updateStatus(roomId, 'hidden');
      alertQuick('success', 'Đã ẩn/từ chối phòng trọ');
      loadDashboard();
      fetchRooms();
    } catch (error) {
      console.error('Reject room failed', error);
    }
  };

  // AD03 - Delete inappropriate review
  const handleDeleteReview = async (reviewId: string, roomId: string) => {
    if (!(await confirmAsync('Xác nhận', 'Bạn có chắc chắn muốn xóa vĩnh viễn đánh giá này?'))) return;
    try {
      await reviewApi.delete(reviewId);
      alertQuick('success', 'Xóa đánh giá thành công');
      // Reload room details to reflect deletion
      const res: any = await roomApi.getById(roomId);
      if (res?.data) {
        setSelectedRoom(res.data);
      }
    } catch (error) {
      console.error('Failed to delete review', error);
      alertQuick('error', 'Xóa đánh giá thất bại');
    }
  };

  // AD03 - View Report & details of the violation target
  const handleViewReport = async (report: any) => {
    setSelectedReport(report);
    setSelectedReportTarget(null);
    try {
      const res: any = await adminApi.getReportTarget(report.target_type || report.targetType, report.target_id || report.targetId);
      if (res?.data) {
        setSelectedReportTarget(res.data);
      }
    } catch (error) {
      console.error('Failed to load report target details', error);
    }
  };

  // AD03 - Dismiss / Resolve Report
  const handleReviewReport = async (reportId: string, status: 'resolved' | 'dismissed') => {
    try {
      await reportApi.updateStatus(reportId, status);
      alertQuick('success', `Đã xử lý báo cáo: ${status === 'resolved' ? 'Chấp nhận vi phạm' : 'Bác bỏ báo cáo'}`);
      setReportsList(prev => prev.map(r => r.id === reportId ? { ...r, status } : r));
      if (selectedReport && selectedReport.id === reportId) {
        setSelectedReport((prev: any) => ({ ...prev, status }));
      }
      loadDashboard();
    } catch (error) {
      console.error('Failed to update report status', error);
      alertQuick('error', 'Không thể xử lý báo cáo');
    }
  };

  // AD03 - Resolve report by hiding target room
  const handleHideRoomFromReport = async (roomId: string, reportId: string) => {
    if (!(await confirmAsync('Xác nhận', 'Bạn có chắc chắn muốn ẩn phòng này và đánh dấu báo cáo đã xử lý?'))) return;
    try {
      await roomApi.updateStatus(roomId, 'hidden');
      await reportApi.updateStatus(reportId, 'resolved');
      alertQuick('success', 'Đã ẩn phòng và giải quyết báo cáo');
      setSelectedReport(null);
      fetchReports();
      loadDashboard();
    } catch (error) {
      console.error('Action failed', error);
    }
  };

  // AD03 - Resolve report by deleting target review
  const handleDeleteReviewFromReport = async (reviewId: string, reportId: string) => {
    if (!(await confirmAsync('Xác nhận', 'Bạn có chắc chắn muốn xóa đánh giá này và đánh dấu báo cáo đã xử lý?'))) return;
    try {
      await reviewApi.delete(reviewId);
      await reportApi.updateStatus(reportId, 'resolved');
      alertQuick('success', 'Đã xóa đánh giá và giải quyết báo cáo');
      setSelectedReport(null);
      fetchReports();
      loadDashboard();
    } catch (error) {
      console.error('Action failed', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  if (!user || user.role !== 'admin') {
    return null; // Let protection handle redirect
  }

  return (
    <div className="admin-layout">
      {/* Sidebar Layout */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-logo">
          <div className="admin-sidebar-logo-icon">
            <Shield size={22} />
          </div>
          <span className="admin-sidebar-logo-text">
            PhòngTrọ<span className="admin-sidebar-logo-dot">.vn</span>
          </span>
        </div>

        <nav className="admin-sidebar-menu">
          <button
            className={`admin-sidebar-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <BarChart3 size={18} />
            <span>Tổng quan</span>
          </button>
          <button
            className={`admin-sidebar-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <Users size={18} />
            <span>Người dùng & KYC</span>
          </button>
          <button
            className={`admin-sidebar-btn ${activeTab === 'rooms' ? 'active' : ''}`}
            onClick={() => setActiveTab('rooms')}
          >
            <Building2 size={18} />
            <span>Phòng trọ</span>
          </button>
          <button
            className={`admin-sidebar-btn ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveTab('reports')}
          >
            <Flag size={18} />
            <span>Báo cáo vi phạm</span>
          </button>
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-sidebar-user">
            <img src={getImageUrl(user.avatar) || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=6366f1&color=fff`} alt="" />
            <div className="admin-sidebar-user-info">
              <span className="admin-sidebar-user-name">{user.fullName}</span>
              <span className="admin-sidebar-user-role">Quản trị viên</span>
            </div>
          </div>
          <button className="admin-sidebar-logout" onClick={handleLogout} title="Đăng xuất">
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Main Panel Content */}
      <main className="admin-content">
        <header className="admin-navbar">
          <div className="admin-navbar-title">
            <h1>
              {activeTab === 'overview' && 'Bảng điều khiển quản trị'}
              {activeTab === 'users' && 'Quản lý Người dùng & Xác thực KYC'}
              {activeTab === 'rooms' && 'Quản lý Danh sách Phòng trọ'}
              {activeTab === 'reports' && 'Quản lý Báo cáo Vi phạm'}
            </h1>
            <p>Hệ thống vận hành trực tuyến PhongTro.vn</p>
          </div>
        </header>

        <div className="admin-body">
          {/* TAB 1: OVERVIEW (AD01) */}
          {activeTab === 'overview' && (
            <>
              {isLoading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>Đang tải dữ liệu...</div>
              ) : (
                <>
                  {/* Stats Cards */}
                  <div className="admin-stat-grid">
                    <div className="admin-stat-card">
                      <div className="admin-stat-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
                        <Users size={22} />
                      </div>
                      <div className="admin-stat-info">
                        <span className="admin-stat-value">{dashboardStats?.totalUsers || 0}</span>
                        <span className="admin-stat-label">Tổng người dùng</span>
                      </div>
                    </div>

                    <div className="admin-stat-card">
                      <div className="admin-stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
                        <Building2 size={22} />
                      </div>
                      <div className="admin-stat-info">
                        <span className="admin-stat-value">{dashboardStats?.totalRooms || 0}</span>
                        <span className="admin-stat-label">Phòng trọ</span>
                      </div>
                    </div>

                    <div className="admin-stat-card">
                      <div className="admin-stat-icon" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>
                        <FileText size={22} />
                      </div>
                      <div className="admin-stat-info">
                        <span className="admin-stat-value">{dashboardStats?.activeContracts || 0}</span>
                        <span className="admin-stat-label">Hợp đồng active</span>
                      </div>
                    </div>

                    <div className="admin-stat-card">
                      <div className="admin-stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
                        <ShieldAlert size={22} />
                      </div>
                      <div className="admin-stat-info">
                        <span className="admin-stat-value">{dashboardStats?.pendingKyc || 0}</span>
                        <span className="admin-stat-label font-semibold">Chờ xác thực KYC</span>
                      </div>
                    </div>

                    <div className="admin-stat-card">
                      <div className="admin-stat-icon" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171' }}>
                        <AlertTriangle size={22} />
                      </div>
                      <div className="admin-stat-info">
                        <span className="admin-stat-value">{dashboardStats?.pendingReports || 0}</span>
                        <span className="admin-stat-label">Báo cáo chưa xử lý</span>
                      </div>
                    </div>

                    <div className="admin-stat-card" style={{ gridColumn: 'span 2' }}>
                      <div className="admin-stat-icon" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#a78bfa' }}>
                        <DollarSign size={22} />
                      </div>
                      <div className="admin-stat-info">
                        <span className="admin-stat-value" style={{ color: '#a78bfa' }}>{formatCurrency(dashboardStats?.totalRevenue || 0)}</span>
                        <span className="admin-stat-label">Tổng doanh thu thành toán</span>
                      </div>
                    </div>
                  </div>

                  {/* Chart and Recent items */}
                  <div className="admin-grid-two">
                    <div className="admin-card">
                      <div className="admin-card-header">
                        <h2>Tình trạng vận hành hệ thống</h2>
                      </div>
                      <div className="admin-card-body" style={{ display: 'flex', flexDirection: 'column', height: '300px', justifyContent: 'flex-end' }}>
                        {/* CSS Chart */}
                        <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', height: '200px', borderBottom: '2px solid rgba(255, 255, 255, 0.05)', paddingBottom: '10px' }}>
                          {[35, 50, 42, 68, 55, 80, 65, 78, 70, 85, 75, 95].map((val, idx) => (
                            <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '6%' }}>
                              <div style={{ height: `${val * 1.8}px`, width: '100%', background: 'linear-gradient(180deg, #6366f1 0%, rgba(99, 102, 241, 0.2) 100%)', borderRadius: '4px 4px 0 0', position: 'relative' }} title={`${val}%`}></div>
                              <span style={{ fontSize: '0.7rem', color: 'var(--admin-text-secondary)', marginTop: '8px' }}>T{idx + 1}</span>
                            </div>
                          ))}
                        </div>
                        <div style={{ display: 'flex', gap: '16px', marginTop: '20px', fontSize: '0.8rem', color: 'var(--admin-text-secondary)' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '10px', height: '10px', backgroundColor: '#6366f1', borderRadius: '2px' }}></span>Tăng trưởng hoạt động chung</span>
                          <span>(Mô phỏng dữ liệu năm 2026)</span>
                        </div>
                      </div>
                    </div>

                    <div className="admin-card">
                      <div className="admin-card-header">
                        <h2>Phòng mới đăng chờ duyệt</h2>
                      </div>
                      <div className="admin-card-body" style={{ padding: '0 20px' }}>
                        {recentRooms.length === 0 ? (
                          <p style={{ padding: '24px', textAlign: 'center', color: 'var(--admin-text-secondary)', fontSize: '0.875rem' }}>Không có phòng chờ duyệt.</p>
                        ) : (
                          <div className="admin-activity-list" style={{ padding: '16px 0' }}>
                            {recentRooms.map((room) => (
                              <div key={room.id} className="admin-activity-item">
                                <div className="admin-activity-info">
                                  <h4 className="admin-activity-title">{room.title}</h4>
                                  <p className="admin-activity-desc">{formatCurrency(room.price)} / tháng</p>
                                </div>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                  <button onClick={() => handleApproveRoomQuick(room.id)} className="admin-btn-icon" style={{ color: 'var(--admin-success)' }} title="Phê duyệt">
                                    <Check size={16} />
                                  </button>
                                  <button onClick={() => handleRejectRoomQuick(room.id)} className="admin-btn-icon" style={{ color: 'var(--admin-error)' }} title="Ẩn/Từ chối">
                                    <X size={16} />
                                  </button>
                                  <button onClick={() => handleViewRoom(room.id)} className="admin-btn-icon" title="Xem chi tiết">
                                    <Eye size={16} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="admin-card">
                    <div className="admin-card-header">
                      <h2>Người dùng đăng ký mới gần đây</h2>
                    </div>
                    <div className="admin-table-wrapper">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Họ và tên</th>
                            <th>Email</th>
                            <th>Vai trò</th>
                            <th>KYC Status</th>
                            <th>Ngày đăng ký</th>
                            <th>Thao tác</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentUsers.map(u => (
                            <tr key={u.id}>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <img src={getImageUrl(u.avatarUrl) || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.fullName)}&background=6366f1&color=fff`} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                                  <span style={{ fontWeight: 600 }}>{u.fullName}</span>
                                </div>
                              </td>
                              <td>{u.email}</td>
                              <td>
                                <span className={`admin-badge admin-badge-${u.role}`}>
                                  {u.role === 'admin' ? 'Admin' : u.role === 'landlord' ? 'Chủ trọ' : 'Khách thuê'}
                                </span>
                              </td>
                              <td>
                                <span className={`admin-badge admin-badge-${u.kycStatus || 'none'}`}>
                                  {u.kycStatus === 'approved' ? 'Đã duyệt' : u.kycStatus === 'pending' ? 'Chờ duyệt' : u.kycStatus === 'rejected' ? 'Từ chối' : 'Chưa KYC'}
                                </span>
                              </td>
                              <td>{formatDate(u.createdAt)}</td>
                              <td>
                                <button onClick={() => handleViewUser(u)} className="admin-btn-icon" title="Chi tiết">
                                  <Eye size={16} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {/* TAB 2: USERS & KYC (AD02) */}
          {activeTab === 'users' && (
            <div className="admin-card">
              <div className="admin-card-header">
                <h2>Danh sách tài khoản hệ thống</h2>
              </div>
              <div className="admin-card-body">
                {/* Search & filters */}
                <div className="admin-filters-bar">
                  <div className="admin-search-wrapper">
                    <Search size={18} className="admin-search-icon" />
                    <input
                      type="text"
                      className="admin-search-input"
                      placeholder="Tìm theo tên, email, SĐT..."
                      value={userSearch}
                      onChange={(e) => { setUserSearch(e.target.value); setUserPage(1); }}
                    />
                  </div>
                  <select
                    className="admin-select-filter"
                    value={userRoleFilter}
                    onChange={(e) => { setUserRoleFilter(e.target.value); setUserPage(1); }}
                  >
                    <option value="all">Tất cả vai trò</option>
                    <option value="tenant">Khách thuê (Tenant)</option>
                    <option value="landlord">Chủ trọ (Landlord)</option>
                    <option value="admin">Quản trị (Admin)</option>
                  </select>
                  <select
                    className="admin-select-filter"
                    value={userKycFilter}
                    onChange={(e) => { setUserKycFilter(e.target.value); setUserPage(1); }}
                  >
                    <option value="all">Tất cả trạng thái KYC</option>
                    <option value="none">Chưa xác thực</option>
                    <option value="pending">Chờ xác thực</option>
                    <option value="approved">Đã xác thực</option>
                    <option value="rejected">Bị từ chối</option>
                  </select>
                </div>

                {/* Table */}
                <div className="admin-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Người dùng</th>
                        <th>Email</th>
                        <th>Số điện thoại</th>
                        <th>Vai trò</th>
                        <th>Xác minh KYC</th>
                        <th>Ngày tạo</th>
                        <th>Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usersList.length === 0 ? (
                        <tr>
                          <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: 'var(--admin-text-secondary)' }}>Không tìm thấy người dùng phù hợp.</td>
                        </tr>
                      ) : (
                        usersList.map((usr) => (
                          <tr key={usr.id}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <img src={getImageUrl(usr.avatar) || `https://ui-avatars.com/api/?name=${encodeURIComponent(usr.fullName)}&background=6366f1&color=fff`} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                                <span style={{ fontWeight: 600 }}>{usr.fullName}</span>
                              </div>
                            </td>
                            <td>{usr.email}</td>
                            <td>{usr.phone}</td>
                            <td>
                              <span className={`admin-badge admin-badge-${usr.role}`}>
                                {usr.role === 'admin' ? 'Admin' : usr.role === 'landlord' ? 'Chủ trọ' : 'Khách thuê'}
                              </span>
                            </td>
                            <td>
                              <span className={`admin-badge admin-badge-${usr.kycStatus || 'none'}`}>
                                {usr.kycStatus === 'approved' ? 'Đã duyệt' : usr.kycStatus === 'pending' ? 'Chờ duyệt' : usr.kycStatus === 'rejected' ? 'Từ chối' : 'Chưa KYC'}
                              </span>
                            </td>
                            <td>{formatDate(usr.createdAt)}</td>
                            <td>
                              <button onClick={() => handleViewUser(usr)} className="admin-btn-icon" title="Xem Chi tiết & KYC">
                                <Eye size={16} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {userTotalPages > 1 && (
                  <div className="admin-pagination">
                    <span>Trang {userPage} / {userTotalPages}</span>
                    <div className="admin-pagination-pages">
                      <button
                        className="admin-pagination-btn"
                        disabled={userPage <= 1}
                        onClick={() => setUserPage(p => p - 1)}
                      >
                        Trước
                      </button>
                      <button
                        className="admin-pagination-btn"
                        disabled={userPage >= userTotalPages}
                        onClick={() => setUserPage(p => p + 1)}
                      >
                        Sau
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: ROOMS (AD03) */}
          {activeTab === 'rooms' && (
            <div className="admin-card">
              <div className="admin-card-header">
                <h2>Quản lý phòng trọ đăng tuyển</h2>
              </div>
              <div className="admin-card-body">
                {/* Search & filters */}
                <div className="admin-filters-bar">
                  <div className="admin-search-wrapper">
                    <Search size={18} className="admin-search-icon" />
                    <input
                      type="text"
                      className="admin-search-input"
                      placeholder="Tìm phòng theo tên, địa chỉ..."
                      value={roomSearch}
                      onChange={(e) => { setRoomSearch(e.target.value); setRoomPage(1); }}
                    />
                  </div>
                  <select
                    className="admin-select-filter"
                    value={roomStatusFilter}
                    onChange={(e) => { setRoomStatusFilter(e.target.value); setRoomPage(1); }}
                  >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="available">Sẵn sàng (Available)</option>
                    <option value="rented">Đã thuê (Rented)</option>
                    <option value="maintenance">Bảo trì (Maintenance)</option>
                    <option value="hidden">Đã ẩn (Hidden)</option>
                  </select>
                </div>

                {/* Table */}
                <div className="admin-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Phòng</th>
                        <th>Chủ nhà</th>
                        <th>Giá thuê</th>
                        <th>Diện tích</th>
                        <th>Địa chỉ</th>
                        <th>Trạng thái</th>
                        <th>Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {roomsList.length === 0 ? (
                        <tr>
                          <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: 'var(--admin-text-secondary)' }}>Không tìm thấy phòng trọ nào.</td>
                        </tr>
                      ) : (
                        roomsList.map((room) => (
                          <tr key={room.id}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <img
                                  src={getImageUrl(room.cover_image || room.coverImage || (room.images && room.images[0])) || 'https://via.placeholder.com/60x45'}
                                  alt=""
                                  style={{ width: '48px', height: '36px', borderRadius: '4px', objectFit: 'cover' }}
                                />
                                <span style={{ fontWeight: 600, maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={room.title}>
                                  {room.title}
                                </span>
                              </div>
                            </td>
                            <td>{room.landlord_name || room.landlordName || 'N/A'}</td>
                            <td>{formatCurrency(room.price)}</td>
                            <td>{room.area} m²</td>
                            <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={room.address}>
                              {room.address}
                            </td>
                            <td>
                              <span className={`admin-badge admin-badge-${room.status}`}>
                                {room.status === 'available' ? 'Sẵn sàng' : room.status === 'rented' ? 'Đã thuê' : room.status === 'maintenance' ? 'Bảo trì' : 'Đã ẩn'}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '4px' }}>
                                <button onClick={() => handleViewRoom(room.id)} className="admin-btn-icon" title="Xem Chi tiết & Đánh giá">
                                  <Eye size={16} />
                                </button>
                                <button onClick={() => handleOpenEditRoom(room.id)} className="admin-btn-icon" title="Chỉnh sửa thông tin phòng">
                                  <Edit size={16} />
                                </button>
                                <button onClick={() => handleDeleteRoom(room.id)} className="admin-btn-icon admin-btn-icon-danger" title="Xóa phòng trọ">
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {roomTotalPages > 1 && (
                  <div className="admin-pagination">
                    <span>Trang {roomPage} / {roomTotalPages}</span>
                    <div className="admin-pagination-pages">
                      <button
                        className="admin-pagination-btn"
                        disabled={roomPage <= 1}
                        onClick={() => setRoomPage(p => p - 1)}
                      >
                        Trước
                      </button>
                      <button
                        className="admin-pagination-btn"
                        disabled={roomPage >= roomTotalPages}
                        onClick={() => setRoomPage(p => p + 1)}
                      >
                        Sau
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: VIOLATION REPORTS (AD03) */}
          {activeTab === 'reports' && (
            <div className="admin-card">
              <div className="admin-card-header">
                <h2>Danh sách báo cáo vi phạm từ người dùng</h2>
              </div>
              <div className="admin-card-body">
                {/* Filters */}
                <div className="admin-filters-bar">
                  <select
                    className="admin-select-filter"
                    value={reportStatusFilter}
                    onChange={(e) => setReportStatusFilter(e.target.value)}
                  >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="pending">Chờ xử lý (Pending)</option>
                    <option value="resolved">Đã giải quyết (Resolved)</option>
                    <option value="dismissed">Đã bác bỏ (Dismissed)</option>
                  </select>
                  <select
                    className="admin-select-filter"
                    value={reportTypeFilter}
                    onChange={(e) => setReportTypeFilter(e.target.value)}
                  >
                    <option value="all">Tất cả đối tượng vi phạm</option>
                    <option value="room">Phòng trọ (Room)</option>
                    <option value="user">Người dùng (User)</option>
                    <option value="review">Đánh giá (Review)</option>
                  </select>
                </div>

                {/* Table */}
                <div className="admin-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Người báo cáo</th>
                        <th>Đối tượng báo cáo</th>
                        <th>Lý do vi phạm</th>
                        <th>Chi tiết</th>
                        <th>Trạng thái</th>
                        <th>Ngày tạo</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportsList.length === 0 ? (
                        <tr>
                          <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: 'var(--admin-text-secondary)' }}>Không có báo cáo vi phạm nào.</td>
                        </tr>
                      ) : (
                        reportsList.map((rpt) => (
                          <tr key={rpt.id}>
                            <td>{rpt.reporter_name || rpt.reporter_email}</td>
                            <td>
                              <span className="admin-badge admin-badge-tenant" style={{ textTransform: 'capitalize' }}>
                                {rpt.target_type === 'room' ? 'Phòng trọ' : rpt.target_type === 'user' ? 'Người dùng' : 'Đánh giá'}
                              </span>
                            </td>
                            <td style={{ fontWeight: 600 }}>{rpt.reason}</td>
                            <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={rpt.description}>
                              {rpt.description || 'Không có mô tả chi tiết'}
                            </td>
                            <td>
                              <span className={`admin-badge admin-badge-${rpt.status}`}>
                                {rpt.status === 'pending' ? 'Chờ xử lý' : rpt.status === 'resolved' ? 'Đã xử lý' : 'Đã bác bỏ'}
                              </span>
                            </td>
                            <td>{formatDate(rpt.created_at)}</td>
                            <td>
                              <button onClick={() => handleViewReport(rpt)} className="admin-btn-icon" title="Chi tiết & Xử lý">
                                <Eye size={16} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* MODAL 1: USER DETAIL & KYC REVIEW (AD02) */}
      {selectedUser && (
        <div className="admin-modal-backdrop" onClick={() => setSelectedUser(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Hồ sơ người dùng & Xác thực</h3>
              <button className="admin-modal-close" onClick={() => setSelectedUser(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="admin-modal-body">
              {/* Profile Card */}
              <div className="admin-user-profile-section">
                <img
                  className="admin-user-large-avatar"
                  src={getImageUrl(selectedUser.avatar) || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedUser.fullName)}&background=6366f1&color=fff`}
                  alt=""
                />
                <div className="admin-user-large-info">
                  <h4>{selectedUser.fullName}</h4>
                  <p>Mã định danh: {selectedUser.id}</p>
                </div>
              </div>

              {/* Info Grid */}
              <div className="admin-info-grid">
                <div className="admin-info-item">
                  <label>Email liên hệ</label>
                  <span>{selectedUser.email}</span>
                </div>
                <div className="admin-info-item">
                  <label>Số điện thoại</label>
                  <span>{selectedUser.phone || 'Chưa cung cấp'}</span>
                </div>
                <div className="admin-info-item">
                  <label>Ngày gia nhập</label>
                  <span>{formatDate(selectedUser.createdAt)}</span>
                </div>
                <div className="admin-info-item">
                  <label>Trạng thái KYC</label>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className={`admin-badge admin-badge-${selectedUser.kycStatus || 'none'}`}>
                      {selectedUser.kycStatus === 'approved' ? 'Đã xác thực' : selectedUser.kycStatus === 'pending' ? 'Chờ duyệt' : selectedUser.kycStatus === 'rejected' ? 'Bị từ chối' : 'Chưa KYC'}
                    </span>
                  </span>
                </div>
              </div>

              {/* Role Management */}
              <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--admin-border)', marginBottom: '24px' }}>
                <h5 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', fontWeight: 600 }}>Quản lý vai trò (Role Management)</h5>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <select
                    className="admin-select-filter"
                    style={{ margin: 0, flex: 1 }}
                    value={selectedUser.role}
                    onChange={(e) => handleUpdateUserRole(selectedUser.id, e.target.value)}
                  >
                    <option value="tenant">Khách thuê (Tenant)</option>
                    <option value="landlord">Chủ trọ (Landlord)</option>
                    <option value="admin">Quản trị viên (Admin)</option>
                  </select>
                </div>
              </div>

              {/* KYC Profile Details */}
              {selectedUser.kycStatus !== 'none' && (
                <div className="admin-kyc-docs">
                  <h5>Hồ sơ giấy tờ xác minh danh tính (CCCD)</h5>
                  {selectedUserKYC ? (
                    <>
                      <div className="admin-kyc-images-grid">
                        <div className="admin-kyc-img-container">
                          <label>Ảnh mặt trước CCCD</label>
                          <img
                            className="admin-kyc-img"
                            src={getImageUrl(selectedUserKYC.id_card_front || selectedUserKYC.idCardFront)}
                            alt="Mặt trước CCCD"
                            onClick={() => window.open(getImageUrl(selectedUserKYC.id_card_front || selectedUserKYC.idCardFront), '_blank')}
                          />
                        </div>
                        <div className="admin-kyc-img-container">
                          <label>Ảnh mặt sau CCCD</label>
                          <img
                            className="admin-kyc-img"
                            src={getImageUrl(selectedUserKYC.id_card_back || selectedUserKYC.idCardBack)}
                            alt="Mặt sau CCCD"
                            onClick={() => window.open(getImageUrl(selectedUserKYC.id_card_back || selectedUserKYC.idCardBack), '_blank')}
                          />
                        </div>
                      </div>

                      {selectedUserKYC.selfie_url && (
                        <div className="admin-kyc-img-container" style={{ marginBottom: '24px' }}>
                          <label>Ảnh chụp chân dung tự sướng (Selfie)</label>
                          <img
                            className="admin-kyc-selfie-img"
                            src={getImageUrl(selectedUserKYC.selfie_url || selectedUserKYC.selfieUrl)}
                            alt="Ảnh chân dung"
                          />
                        </div>
                      )}

                      {/* Pending KYC Action Buttons */}
                      {selectedUserKYC.status === 'pending' && (
                        <div style={{ display: 'flex', gap: '12px', marginTop: '20px', borderTop: '1px solid var(--admin-border)', paddingTop: '20px' }}>
                          <button
                            className="admin-btn admin-btn-success"
                            style={{ flex: 1 }}
                            onClick={() => handleReviewKYC(selectedUserKYC.id, 'approved')}
                          >
                            <Check size={18} /> Phê duyệt hồ sơ
                          </button>
                          <button
                            className="admin-btn admin-btn-danger"
                            style={{ flex: 1 }}
                            onClick={() => handleReviewKYC(selectedUserKYC.id, 'rejected')}
                          >
                            <X size={18} /> Từ chối hồ sơ
                          </button>
                        </div>
                      )}
                      {selectedUserKYC.status !== 'pending' && (
                        <div style={{ marginTop: '16px', padding: '12px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--admin-border)', borderRadius: '8px', fontSize: '0.875rem' }}>
                          Trạng thái kiểm duyệt hồ sơ: <strong>{selectedUserKYC.status === 'approved' ? 'Đã chấp thuận' : 'Bị từ chối'}</strong>
                        </div>
                      )}
                    </>
                  ) : (
                    <p style={{ color: 'var(--admin-text-secondary)', fontSize: '0.875rem' }}>Đang tải thông tin giấy tờ KYC...</p>
                  )}
                </div>
              )}
            </div>
            <div className="admin-modal-footer">
              <button className="admin-btn admin-btn-secondary" onClick={() => setSelectedUser(null)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: ROOM DETAIL & REVIEWS MODERATION (AD03) */}
      {selectedRoom && (
        <div className="admin-modal-backdrop" onClick={() => setSelectedRoom(null)}>
          <div className="admin-modal" style={{ maxWidth: '800px' }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Chi tiết phòng trọ tuyển dụng</h3>
              <button className="admin-modal-close" onClick={() => setSelectedRoom(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="admin-modal-body">
              {/* Room details header */}
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--admin-text-primary)' }}>{selectedRoom.title}</h4>
                <p style={{ margin: 0, color: 'var(--admin-text-secondary)', fontSize: '0.85rem' }}>Địa chỉ: {selectedRoom.address}</p>
              </div>

              {/* Photos Gallery */}
              {selectedRoom.images && selectedRoom.images.length > 0 && (
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '20px' }}>
                  {selectedRoom.images.map((img: any, idx: number) => (
                    <img
                      key={idx}
                      src={getImageUrl(typeof img === 'string' ? img : img.url)}
                      alt=""
                      style={{ height: '110px', width: '150px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--admin-border)', flexShrink: 0 }}
                    />
                  ))}
                </div>
              )}

              {/* Core Parameters */}
              <div className="admin-info-grid">
                <div className="admin-info-item">
                  <label>Giá thuê</label>
                  <span style={{ color: '#818cf8', fontWeight: 700 }}>{formatCurrency(selectedRoom.price)} / tháng</span>
                </div>
                <div className="admin-info-item">
                  <label>Tiền đặt cọc</label>
                  <span>{formatCurrency(selectedRoom.deposit || 0)}</span>
                </div>
                <div className="admin-info-item">
                  <label>Diện tích</label>
                  <span>{selectedRoom.area} m²</span>
                </div>
                <div className="admin-info-item">
                  <label>Số người tối đa</label>
                  <span>{selectedRoom.maxOccupants} người</span>
                </div>
                <div className="admin-info-item">
                  <label>Chủ phòng trọ</label>
                  <span>{selectedRoom.landlord?.fullName || 'Không rõ'}</span>
                </div>
                <div className="admin-info-item">
                  <label>Trạng thái</label>
                  <span className={`admin-badge admin-badge-${selectedRoom.status}`}>
                    {selectedRoom.status === 'available' ? 'Sẵn sàng' : selectedRoom.status === 'rented' ? 'Đã thuê' : selectedRoom.status === 'maintenance' ? 'Bảo trì' : 'Đã ẩn'}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Mô tả chi tiết</label>
                <div style={{ fontSize: '0.9rem', color: 'var(--admin-text-secondary)', lineHeight: 1.5, background: 'rgba(255,255,255,0.02)', padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--admin-border)' }}>
                  {selectedRoom.description || 'Không có mô tả chi tiết'}
                </div>
              </div>

              {/* Reviews Moderation (AD03) */}
              <div style={{ marginTop: '28px', borderTop: '1px solid var(--admin-border)', paddingTop: '20px' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Star size={18} style={{ color: '#fbbf24' }} />
                  Đánh giá từ khách thuê ({selectedRoom.reviews?.length || 0})
                </h4>

                {(!selectedRoom.reviews || selectedRoom.reviews.length === 0) ? (
                  <p style={{ color: 'var(--admin-text-secondary)', fontSize: '0.875rem', textAlign: 'center', padding: '16px' }}>Chưa có đánh giá nào cho phòng này.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {selectedRoom.reviews.map((rev: any) => (
                      <div key={rev.id} style={{ display: 'flex', gap: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--admin-border)', padding: '16px', borderRadius: '12px', position: 'relative' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                            <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{rev.tenant_name || rev.tenantName}</span>
                            <div style={{ display: 'flex', color: '#fbbf24' }}>
                              {Array.from({ length: rev.rating || 5 }).map((_, i) => (
                                <Star key={i} size={12} fill="#fbbf24" />
                              ))}
                            </div>
                          </div>
                          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--admin-text-secondary)', fontStyle: 'italic' }}>
                            "{rev.comment}"
                          </p>
                          <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', display: 'block', marginTop: '6px' }}>{formatDate(rev.created_at || rev.createdAt)}</span>
                        </div>
                        
                        {/* Admin Action: Delete inappropriate review */}
                        <button
                          onClick={() => handleDeleteReview(rev.id, selectedRoom.id)}
                          className="admin-btn-icon admin-btn-icon-danger"
                          style={{ position: 'absolute', right: '16px', top: '16px' }}
                          title="Xóa đánh giá không phù hợp"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="admin-modal-footer">
              <button className="admin-btn admin-btn-danger" style={{ marginRight: 'auto' }} onClick={() => handleDeleteRoom(selectedRoom.id)}>
                Xóa phòng
              </button>
              <button className="admin-btn admin-btn-primary" onClick={() => handleOpenEditRoom(selectedRoom.id)}>
                Sửa thông tin
              </button>
              <button className="admin-btn admin-btn-secondary" onClick={() => setSelectedRoom(null)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: REPORT DETAIL & PROCESS VIOLATION (AD03) */}
      {selectedReport && (
        <div className="admin-modal-backdrop" onClick={() => setSelectedReport(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Xử lý báo cáo vi phạm</h3>
              <button className="admin-modal-close" onClick={() => setSelectedReport(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="admin-modal-body">
              {/* Report Information */}
              <div style={{ padding: '16px 20px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.15)', borderRadius: '12px', marginBottom: '24px' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--admin-text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertTriangle size={16} style={{ color: 'var(--admin-error)' }} />
                  Nội dung báo cáo
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.85rem', color: 'var(--admin-text-secondary)', marginBottom: '10px' }}>
                  <span>Người báo cáo: <strong>{selectedReport.reporter_name}</strong></span>
                  <span>Ngày báo cáo: <strong>{formatDate(selectedReport.created_at)}</strong></span>
                </div>
                <p style={{ margin: '8px 0 0 0', fontSize: '0.9rem', color: 'var(--admin-text-primary)' }}>
                  Lý do: <strong>{selectedReport.reason}</strong>
                </p>
                {selectedReport.description && (
                  <p style={{ margin: '8px 0 0 0', fontSize: '0.85rem', color: 'var(--admin-text-secondary)', background: 'rgba(0,0,0,0.15)', padding: '8px 12px', borderRadius: '8px' }}>
                    Chi tiết: {selectedReport.description}
                  </p>
                )}
              </div>

              {/* Target Details Loaded from Backend */}
              <div className="admin-report-target-details">
                <h6>Đối tượng bị báo cáo ({selectedReport.target_type === 'room' ? 'Phòng trọ' : selectedReport.target_type === 'user' ? 'Người dùng' : 'Đánh giá'})</h6>
                
                {selectedReportTarget ? (
                  <div className="admin-report-target-content">
                    {/* Render Room Target */}
                    {selectedReport.target_type === 'room' && (
                      <div>
                        <div className="admin-report-target-title">{selectedReportTarget.title}</div>
                        <div className="admin-report-target-meta">
                          Chủ trọ: {selectedReportTarget.landlord_name} | Giá: {formatCurrency(selectedReportTarget.price)}
                        </div>
                        <div className="admin-report-target-meta">Địa chỉ: {selectedReportTarget.address}</div>
                        
                        {/* Violating Action for room */}
                        {selectedReport.status === 'pending' && (
                          <button
                            onClick={() => handleHideRoomFromReport(selectedReportTarget.id, selectedReport.id)}
                            className="admin-btn admin-btn-danger"
                            style={{ marginTop: '12px', padding: '6px 12px', fontSize: '0.8rem' }}
                          >
                            Ẩn phòng vi phạm này
                          </button>
                        )}
                      </div>
                    )}

                    {/* Render User Target */}
                    {selectedReport.target_type === 'user' && (
                      <div>
                        <div className="admin-report-target-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <img src={getImageUrl(selectedReportTarget.avatar) || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedReportTarget.fullName)}`} alt="" style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
                          {selectedReportTarget.fullName}
                        </div>
                        <div className="admin-report-target-meta">
                          Email: {selectedReportTarget.email} | Vai trò: {selectedReportTarget.role}
                        </div>
                        <div className="admin-report-target-meta">SĐT: {selectedReportTarget.phone || 'Chưa cung cấp'}</div>
                        
                        {/* Violating Action for user */}
                        {selectedReport.status === 'pending' && (
                          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                            <button
                              onClick={() => {
                                handleUpdateUserRole(selectedReportTarget.id, 'tenant');
                                handleReviewReport(selectedReport.id, 'resolved');
                              }}
                              className="admin-btn admin-btn-secondary"
                              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                            >
                              Hạ quyền xuống Tenant
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Render Review Target */}
                    {selectedReport.target_type === 'review' && (
                      <div>
                        <div className="admin-report-target-meta">
                          Người đánh giá: <strong>{selectedReportTarget.tenant_name}</strong> tại phòng <strong>{selectedReportTarget.room_title}</strong>
                        </div>
                        <div className="admin-report-target-text">
                          "{selectedReportTarget.comment}"
                        </div>
                        <div className="admin-report-target-meta" style={{ marginTop: '6px' }}>Rating: {selectedReportTarget.rating} / 5 sao</div>
                        
                        {/* Violating Action for review */}
                        {selectedReport.status === 'pending' && (
                          <button
                            onClick={() => handleDeleteReviewFromReport(selectedReportTarget.id, selectedReport.id)}
                            className="admin-btn admin-btn-danger"
                            style={{ marginTop: '12px', padding: '6px 12px', fontSize: '0.8rem' }}
                          >
                            Xóa đánh giá vi phạm này
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <p style={{ color: 'var(--admin-text-secondary)', fontSize: '0.85rem', margin: 0 }}>Đang tải thông tin chi tiết đối tượng bị báo cáo...</p>
                )}
              </div>
            </div>
            <div className="admin-modal-footer">
              {/* Report process buttons */}
              {selectedReport.status === 'pending' && (
                <>
                  <button className="admin-btn admin-btn-secondary" style={{ marginRight: 'auto' }} onClick={() => handleReviewReport(selectedReport.id, 'dismissed')}>
                    Bác bỏ báo cáo
                  </button>
                  <button className="admin-btn admin-btn-primary" onClick={() => handleReviewReport(selectedReport.id, 'resolved')}>
                    Giải quyết báo cáo
                  </button>
                </>
              )}
              <button className="admin-btn admin-btn-secondary" onClick={() => setSelectedReport(null)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL 4: EDIT ROOM FORM MODAL */}
      {editRoomData && (
        <div className="admin-modal-backdrop" onClick={() => setEditRoomData(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Chỉnh sửa thông tin phòng trọ</h3>
              <button className="admin-modal-close" onClick={() => setEditRoomData(null)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveEditRoom}>
              <div className="admin-modal-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="admin-info-item" style={{ display: 'flex', flexDirection: 'column' }}>
                    <label style={{ color: '#cbd5e1', marginBottom: '6px' }}>Tiêu đề phòng</label>
                    <input
                      type="text"
                      className="admin-search-input"
                      style={{ paddingLeft: '16px' }}
                      value={editRoomData.title}
                      onChange={(e) => setEditRoomData({ ...editRoomData, title: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="admin-info-item" style={{ display: 'flex', flexDirection: 'column' }}>
                    <label style={{ color: '#cbd5e1', marginBottom: '6px' }}>Địa chỉ</label>
                    <input
                      type="text"
                      className="admin-search-input"
                      style={{ paddingLeft: '16px' }}
                      value={editRoomData.address}
                      onChange={(e) => setEditRoomData({ ...editRoomData, address: e.target.value })}
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="admin-info-item" style={{ display: 'flex', flexDirection: 'column' }}>
                      <label style={{ color: '#cbd5e1', marginBottom: '6px' }}>Giá thuê (VND)</label>
                      <input
                        type="number"
                        className="admin-search-input"
                        style={{ paddingLeft: '16px' }}
                        value={editRoomData.price}
                        onChange={(e) => setEditRoomData({ ...editRoomData, price: e.target.value })}
                        required
                      />
                    </div>
                    <div className="admin-info-item" style={{ display: 'flex', flexDirection: 'column' }}>
                      <label style={{ color: '#cbd5e1', marginBottom: '6px' }}>Tiền cọc (VND)</label>
                      <input
                        type="number"
                        className="admin-search-input"
                        style={{ paddingLeft: '16px' }}
                        value={editRoomData.deposit}
                        onChange={(e) => setEditRoomData({ ...editRoomData, deposit: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="admin-info-item" style={{ display: 'flex', flexDirection: 'column' }}>
                      <label style={{ color: '#cbd5e1', marginBottom: '6px' }}>Diện tích (m²)</label>
                      <input
                        type="number"
                        className="admin-search-input"
                        style={{ paddingLeft: '16px' }}
                        value={editRoomData.area}
                        onChange={(e) => setEditRoomData({ ...editRoomData, area: e.target.value })}
                        required
                      />
                    </div>
                    <div className="admin-info-item" style={{ display: 'flex', flexDirection: 'column' }}>
                      <label style={{ color: '#cbd5e1', marginBottom: '6px' }}>Số người ở tối đa</label>
                      <input
                        type="number"
                        className="admin-search-input"
                        style={{ paddingLeft: '16px' }}
                        value={editRoomData.maxOccupants}
                        onChange={(e) => setEditRoomData({ ...editRoomData, maxOccupants: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="admin-info-item" style={{ display: 'flex', flexDirection: 'column' }}>
                    <label style={{ color: '#cbd5e1', marginBottom: '6px' }}>Trạng thái vận hành</label>
                    <select
                      className="admin-select-filter"
                      style={{ width: '100%' }}
                      value={editRoomData.status}
                      onChange={(e) => setEditRoomData({ ...editRoomData, status: e.target.value })}
                    >
                      <option value="available">Sẵn sàng (Available)</option>
                      <option value="rented">Đã thuê (Rented)</option>
                      <option value="maintenance">Bảo trì (Maintenance)</option>
                      <option value="hidden">Đã ẩn/Khóa (Hidden)</option>
                    </select>
                  </div>

                  <div className="admin-info-item" style={{ display: 'flex', flexDirection: 'column' }}>
                    <label style={{ color: '#cbd5e1', marginBottom: '6px' }}>Mô tả chi tiết</label>
                    <textarea
                      className="admin-search-input"
                      style={{ paddingLeft: '16px', minHeight: '100px', resize: 'vertical', paddingTop: '10px' }}
                      value={editRoomData.description}
                      onChange={(e) => setEditRoomData({ ...editRoomData, description: e.target.value })}
                      rows={4}
                    />
                  </div>
                </div>
              </div>
              <div className="admin-modal-footer">
                <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setEditRoomData(null)}>
                  Hủy
                </button>
                <button type="submit" className="admin-btn admin-btn-primary">
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

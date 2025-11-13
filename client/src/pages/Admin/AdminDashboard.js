import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Users, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  UserCheck, 
  Clock,
  Download,
  Plus,
  Settings,
  BarChart3,
  Eye,
  Edit,
  Trash2,
  Activity,
  MapPin,
  QrCode,
  Shield,
  CheckCircle
} from 'lucide-react';
import api from '../../utils/axiosConfig';
import useCustomToast from '../../utils/customToast';
import AdminQRScanner from '../../components/Admin/AdminQRScanner';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const toast = useCustomToast();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalEvents: 0,
    totalRevenue: 0,
    totalBookings: 0,
    monthlyUsers: 0,
    monthlyRevenue: 0,
    monthlyBookings: 0
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qrScannerOpen, setQrScannerOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [attendanceStats, setAttendanceStats] = useState({});

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/admin/dashboard');
      const data = response.data;
      
      setStats({
        totalUsers: data.overview.totalUsers,
        totalEvents: data.overview.totalEvents,
        totalRevenue: data.overview.totalRevenue,
        totalBookings: data.overview.totalBookings,
        monthlyUsers: data.monthly.newUsers,
        monthlyRevenue: data.monthly.monthlyRevenue,
        monthlyBookings: data.monthly.newBookings
      });
      
      setRecentUsers(data.recent.users || []);
      setUpcomingEvents(data.recent.events || []);
      setRecentBookings(data.recent.bookings || []);
    } catch (error) {
      toast.fetchError('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-700 rounded w-64 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-gray-800 p-6 rounded-xl">
                  <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-700 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-gray-400">Welcome back, Admin! Here's what's happening with your workspace.</p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gray-800 p-6 rounded-xl border border-gray-700 hover:border-gray-600 transition-all duration-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Users</p>
                <p className="text-3xl font-bold text-white">{stats.totalUsers}</p>
                <p className="text-green-400 text-sm">+{stats.monthlyUsers} this month</p>
              </div>
              <Users className="h-12 w-12 text-cyan-400" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-800 p-6 rounded-xl border border-gray-700 hover:border-gray-600 transition-all duration-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Events</p>
                <p className="text-3xl font-bold text-white">{stats.totalEvents}</p>
                <p className="text-gray-400 text-sm">Active events</p>
              </div>
              <Calendar className="h-12 w-12 text-blue-400" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gray-800 p-6 rounded-xl border border-gray-700 hover:border-gray-600 transition-all duration-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Revenue</p>
                <p className="text-3xl font-bold text-white">{formatCurrency(stats.totalRevenue)}</p>
                <p className="text-green-400 text-sm">+{formatCurrency(stats.monthlyRevenue)} this month</p>
              </div>
              <DollarSign className="h-12 w-12 text-green-400" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gray-800 p-6 rounded-xl border border-gray-700 hover:border-gray-600 transition-all duration-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Bookings</p>
                <p className="text-3xl font-bold text-white">{stats.totalBookings}</p>
                <p className="text-green-400 text-sm">+{stats.monthlyBookings} this month</p>
              </div>
              <TrendingUp className="h-12 w-12 text-purple-400" />
            </div>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gray-800 p-6 rounded-xl border border-gray-700 mb-8"
        >
          <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <Link
              to="/admin/events/create"
              className="flex items-center space-x-3 p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              <Plus className="h-5 w-5 text-cyan-400" />
              <span className="text-white">Create Event</span>
            </Link>
            <Link
              to="/admin/users"
              className="flex items-center space-x-3 p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              <Users className="h-5 w-5 text-blue-400" />
              <span className="text-white">Manage Users</span>
            </Link>
            <Link
              to="/admin/analytics"
              className="flex items-center space-x-3 p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              <Activity className="h-5 w-5 text-orange-400" />
              <span className="text-white">Analytics</span>
            </Link>
            <Link
              to="/admin/reports"
              className="flex items-center space-x-3 p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              <Download className="h-5 w-5 text-green-400" />
              <span className="text-white">Export Reports</span>
            </Link>
            <button
              onClick={() => {
                if (upcomingEvents.length > 0) {
                  setSelectedEvent(upcomingEvents[0]);
                  setQrScannerOpen(true);
                } else {
                  toast.warning('No upcoming events available for attendance scanning');
                }
              }}
              className="flex items-center space-x-3 p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              <QrCode className="h-5 w-5 text-yellow-400" />
              <span className="text-white">Scan Attendance</span>
            </button>
            <Link
              to="/settings"
              className="flex items-center space-x-3 p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              <Settings className="h-5 w-5 text-purple-400" />
              <span className="text-white">Settings</span>
            </Link>
          </div>
        </motion.div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Users */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-gray-800 p-6 rounded-xl border border-gray-700"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Recent Users</h3>
              <Link to="/admin/users" className="text-cyan-400 hover:text-cyan-300 text-sm">View All</Link>
            </div>
            <div className="space-y-3">
              {recentUsers.slice(0, 5).map((user, index) => (
                <div key={user._id} className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">
                      {user.name.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium">{user.name}</p>
                    <p className="text-gray-400 text-xs">{user.email}</p>
                  </div>
                  <div className="text-gray-400 text-xs">
                    {formatDate(user.createdAt)}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Upcoming Events */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-gray-800 p-6 rounded-xl border border-gray-700"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Upcoming Events</h3>
              <Link to="/admin/events" className="text-cyan-400 hover:text-cyan-300 text-sm">View All</Link>
            </div>
            <div className="space-y-3">
              {upcomingEvents.length > 0 ? (
                upcomingEvents.slice(0, 5).map((event, index) => (
                  <div key={event._id} className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-emerald-500 rounded-lg flex items-center justify-center">
                      <Calendar className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white text-sm font-medium">{event.title}</p>
                    </div>
                    <div className="text-gray-400 text-xs">
                      {formatDate(event.dateTime.start)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-500 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">No upcoming events</p>
                  <p className="text-gray-500 text-xs mt-1">Create your first event to get started</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Recent Bookings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-gray-800 p-6 rounded-xl border border-gray-700"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Recent Bookings</h3>
              <Link to="/admin/reports" className="text-cyan-400 hover:text-cyan-300 text-sm">View All</Link>
            </div>
            <div className="space-y-3">
              {recentBookings.length > 0 ? (
                recentBookings.slice(0, 5).map((booking, index) => (
                  <div key={booking._id} className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-500 rounded-lg flex items-center justify-center">
                      <TrendingUp className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white text-sm font-medium">{booking.user?.name || 'Unknown User'}</p>
                      <p className="text-gray-400 text-xs">{booking.event?.title || 'Unknown Event'}</p>
                    </div>
                    <div className="text-gray-400 text-xs">
                      {formatCurrency(booking.totalAmount || 0)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <TrendingUp className="h-12 w-12 text-gray-500 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">No recent bookings</p>
                  <p className="text-gray-500 text-xs mt-1">Bookings will appear here once users start booking events</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Admin QR Scanner Modal */}
        {qrScannerOpen && selectedEvent && (
          <AdminQRScanner
            onClose={() => {
              setQrScannerOpen(false);
              setSelectedEvent(null);
            }}
            onSuccess={(result) => {
              const studentName = result.attendance?.user?.name || 'Student';
              const eventTitle = result.event?.title || selectedEvent?.title || 'Event';
              toast.success(`${studentName}'s attendance marked successfully for ${eventTitle}!`, { 
                title: 'Attendance Confirmed',
                description: `Status: ${result.attendance?.status || 'present'}`
              });
              
              fetchDashboardData();
            }}
            eventId={selectedEvent._id}
            eventTitle={selectedEvent.title}
          />
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;

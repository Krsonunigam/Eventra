import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  BookOpen, 
  User, 
  BarChart3, 
  Clock, 
  MapPin, 
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Download,
  ExternalLink,
  Star,
  Users,
  DollarSign,
  Activity,
  Eye,
  Plus,
  QrCode,
  Camera,
  Award,
  MapPin as LocationIcon
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../utils/axiosConfig';
import QRScanner from '../../components/Attendance/QRScanner';
import FaceRecognition from '../../components/FaceRecognition/FaceVerification';
// import faceRecognitionAPI from '../../utils/faceRecognitionAPI';
import useCustomToast from '../../utils/customToast';
import { formatDateIST, formatTimeIST, formatDateTimeIST, getTimeDifferenceIST, isEventHappeningNow } from '../../utils/timezoneUtils';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useCustomToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalBookings: 0,
    confirmedBookings: 0,
    totalSpent: 0,
    attendanceRate: 0
  });
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [currentEvents, setCurrentEvents] = useState([]);
  const [userActivity, setUserActivity] = useState([]);
  const [happeningNowEvents, setHappeningNowEvents] = useState([]);
  const [attendanceMode, setAttendanceMode] = useState(null); // 'qr' or 'face'
  const [isScanning, setIsScanning] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [showFaceTraining, setShowFaceTraining] = useState(false);
  const [faceRecognitionStatus, setFaceRecognitionStatus] = useState({
    isSetup: false,
    isVerified: false,
    lastTraining: null
  });

  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
    fetchDashboardData();
  }, []);
  useEffect(() => {
  if (user) {
    const hasCompletedFaceTraining =
      user.faceTrainingCompleted === true && user.faceDataCollected === true;

    setFaceRecognitionStatus({
      isSetup: hasCompletedFaceTraining,
      isVerified: hasCompletedFaceTraining,
      lastTraining: user?.faceTrainingDate || null
    });
  }
}, [user]);
useEffect(() => {
  if (user) {
    fetchDashboardData();
  }
  
}, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Check if user is authenticated
      if (!user) {
        
        return;
      }
      
      // Fetch data from working endpoints only
      const [
        bookingsResponse,
        upcomingResponse,
        happeningNowResponse
      ] = await Promise.allSettled([
        api.get('/api/bookings'),
        api.get('/api/events/upcoming/events'),
        api.get('/api/events/upcoming')
      ]);

      const bookings = bookingsResponse.status === 'fulfilled' ? (bookingsResponse.value.data.bookings || []) : [];
      const upcoming = upcomingResponse.status === 'fulfilled' ? (upcomingResponse.value.data.events || []) : [];
      const happeningNow = happeningNowResponse.status === 'fulfilled' ? (happeningNowResponse.value.data || []) : [];

      // Calculate user statistics
      const totalBookings = bookings.length;
      const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length;
      const totalSpent = bookings
        .filter(b => b.status === 'confirmed')
        .reduce((sum, b) => sum + (b.totalAmount || 0), 0);
      
      const attendedBookings = bookings.filter(b => b.attendanceMarked).length;
      const attendanceRate = confirmedBookings > 0 ? Math.round((attendedBookings / confirmedBookings) * 100) : 0;

      setStats({
        totalBookings,
        confirmedBookings,
        totalSpent,
        attendanceRate
      });

      // Set upcoming events (limit to 6)
      setUpcomingEvents(upcoming.slice(0, 6));

      // Set current events (empty for now since endpoint has issues)
      setCurrentEvents([]);

      // Set happening now events
      setHappeningNowEvents(happeningNow);

      // Set recent bookings (limit to 5)
      setRecentBookings(bookings.slice(0, 5));

      // Create user activity from recent bookings
      const activities = bookings.slice(0, 10).map(booking => ({
        id: booking._id,
        type: booking.status === 'confirmed' ? 'booking_confirmed' : 'booking_pending',
        title: booking.event?.title || 'Event',
        time: new Date(booking.createdAt),
        amount: booking.totalAmount,
        status: booking.status
      }));
      setUserActivity(activities);

      // Check face recognition status
      if (user) {
        try {
          // Check face recognition status from the new API
         const hasCompletedFaceTraining =
           user.faceTrainingCompleted === true && user.faceDataCollected === true;

         setFaceRecognitionStatus({
  isSetup: hasCompletedFaceTraining,
  isVerified: hasCompletedFaceTraining,
  lastTraining: user?.faceTrainingDate || null
});
        } catch (error) {
          
          // Fallback to user data if face API not available
          setFaceRecognitionStatus({
            isSetup: user.faceDataCollected || false,
            isVerified: user.isFaceVerified || false,
            lastTraining: user.faceTrainingDate || null
          });
        }
      }

    } catch (error) {
      
      
      // Set fallback data
      setStats({
        totalBookings: 0,
        confirmedBookings: 0,
        totalSpent: 0,
        attendanceRate: 0
      });
      setUpcomingEvents([]);
      setCurrentEvents([]);
      setHappeningNowEvents([]);
      setRecentBookings([]);
      setUserActivity([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return formatDateIST(dateString);
  };

  const formatTime = (dateString) => {
    return formatTimeIST(dateString);
  };

  const getTimeAgo = (date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now - new Date(date)) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'text-green-400 bg-green-400/10';
      case 'pending': return 'text-yellow-400 bg-yellow-400/10';
      case 'cancelled': return 'text-red-400 bg-red-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  // Attendance handlers
  const handleQRScan = (eventId) => {
    setSelectedEventId(eventId);
    setAttendanceMode('qr');
    setIsScanning(true);
  };

 const handleFaceRecognition = (eventId) => {

  // 🚫 WAIT until user loads
  if (!user) return;


  if (!user.faceTrainingCompleted || !user.faceDataCollected) {
    toast.error("Please complete face training first");
    navigate('/face-test');
    return;
  }

  // ✅ allow
  setSelectedEventId(eventId);
  setAttendanceMode('face');
};

  const handleAttendanceSuccess = (attendanceData = null) => {
    // Show success message with more details if available
    if (attendanceData) {
      const statusText = attendanceData.status === 'present' ? 'on time' : attendanceData.status;
      toast.success(`Attendance marked successfully! Status: ${statusText}`, { 
        title: 'Attendance Confirmed',
        description: `Event: ${attendanceData.event?.title || 'Unknown Event'}`
      });
    } else {
      toast.success('Attendance marked successfully!', { title: 'Attendance' });
    }
    
    setAttendanceMode(null);
    setIsScanning(false);
    setSelectedEventId(null);
    
    // Refresh all dashboard data to reflect attendance changes
    fetchDashboardData();
  };

  const handleAttendanceClose = () => {
    setAttendanceMode(null);
    setIsScanning(false);
    setSelectedEventId(null);
  };

  const formatHappeningTime = (dateString) => {
    return getTimeDifferenceIST(dateString);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-8"
        >
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  Hey, {user?.name || 'there'}! 👋
                </h1>
                <p className="text-gray-400">
                  Here's what's happening with your events and bookings.
                </p>
              </div>
              <button
                onClick={fetchDashboardData}
                className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link to="/bookings">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 p-6 rounded-xl border border-blue-500/20 hover:border-blue-400/40 hover:bg-blue-500/15 transition-all duration-200 cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-300 text-sm font-medium group-hover:text-blue-200 transition-colors">Total Bookings</p>
                    <p className="text-2xl font-bold text-white group-hover:text-blue-100 transition-colors">{stats.totalBookings}</p>
                    <p className="text-blue-400 text-xs mt-1 group-hover:text-blue-300 transition-colors">All time</p>
                  </div>
                  <BookOpen className="h-8 w-8 text-blue-400 group-hover:text-blue-300 transition-colors" />
                </div>
              </motion.div>
            </Link>

            <Link to="/bookings?filter=confirmed">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-green-500/10 to-green-600/10 p-6 rounded-xl border border-green-500/20 hover:border-green-400/40 hover:bg-green-500/15 transition-all duration-200 cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-300 text-sm font-medium group-hover:text-green-200 transition-colors">Confirmed</p>
                    <p className="text-2xl font-bold text-white group-hover:text-green-100 transition-colors">{stats.confirmedBookings}</p>
                    <p className="text-green-400 text-xs mt-1 group-hover:text-green-300 transition-colors">Active bookings</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-400 group-hover:text-green-300 transition-colors" />
                </div>
              </motion.div>
            </Link>

            <Link to="/bookings">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 p-6 rounded-xl border border-purple-500/20 hover:border-purple-400/40 hover:bg-purple-500/15 transition-all duration-200 cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-300 text-sm font-medium group-hover:text-purple-200 transition-colors">Total Spent</p>
                    <p className="text-2xl font-bold text-white group-hover:text-purple-100 transition-colors">₹{stats.totalSpent}</p>
                    <p className="text-purple-400 text-xs mt-1 group-hover:text-purple-300 transition-colors">On events</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-purple-400 group-hover:text-purple-300 transition-colors" />
                </div>
              </motion.div>
            </Link>

            <Link to="/attendance">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/10 p-6 rounded-xl border border-cyan-500/20 hover:border-cyan-400/40 hover:bg-cyan-500/15 transition-all duration-200 cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-cyan-300 text-sm font-medium group-hover:text-cyan-200 transition-colors">Attendance</p>
                    <p className="text-2xl font-bold text-white group-hover:text-cyan-100 transition-colors">{stats.attendanceRate}%</p>
                    <p className="text-cyan-400 text-xs mt-1 group-hover:text-cyan-300 transition-colors">Success rate</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-cyan-400 group-hover:text-cyan-300 transition-colors" />
                </div>
              </motion.div>
            </Link>
          </div>

          {/* Face Recognition Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-6 rounded-xl border border-blue-500/20 mb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Camera className="h-5 w-5 text-blue-400 mr-2" />
                <h2 className="text-xl font-bold text-white">Face Recognition Status</h2>
              </div>
              {faceRecognitionStatus.isSetup ? (
                <div className="flex items-center bg-green-500/20 px-3 py-1 rounded-full">
                  <CheckCircle className="h-4 w-4 text-green-400 mr-1" />
                  <span className="text-green-300 text-sm font-medium">Ready</span>
                </div>
              ) : (
                <div className="flex items-center bg-yellow-500/20 px-3 py-1 rounded-full">
                  <AlertCircle className="h-4 w-4 text-yellow-400 mr-1" />
                  <span className="text-yellow-300 text-sm font-medium">Setup Required</span>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                <div className="flex items-center mb-2">
                  <div className={`w-3 h-3 rounded-full mr-2 ${faceRecognitionStatus.isSetup ? 'bg-green-400' : 'bg-red-400'}`}></div>
                  <span className="text-white font-medium">Face Data</span>
                </div>
                <p className="text-gray-400 text-sm">
                  {faceRecognitionStatus.isSetup ? 'Face data collected and ready' : 'Face data not collected yet'}
                </p>
              </div>
              
              <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                <div className="flex items-center mb-2">
                  <div className={`w-3 h-3 rounded-full mr-2 ${faceRecognitionStatus.isVerified ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
                  <span className="text-white font-medium">Verification</span>
                </div>
                <p className="text-gray-400 text-sm">
                  {faceRecognitionStatus.isVerified ? 'Face recognition verified' : 'Face recognition pending verification'}
                </p>
              </div>
              
              <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                <div className="flex items-center mb-2">
                  <Star className="h-4 w-4 text-purple-400 mr-2" />
                  <span className="text-white font-medium">Training</span>
                </div>
                <p className="text-gray-400 text-sm">
                  {faceRecognitionStatus.lastTraining 
                    ? `Last trained: ${new Date(faceRecognitionStatus.lastTraining).toLocaleDateString()}`
                    : 'No training completed'
                  }
                </p>
              </div>
            </div>
            
            {!faceRecognitionStatus.isSetup && (
              <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-yellow-400 mr-2" />
                  <div>
                    <h3 className="text-yellow-300 font-medium">Face Recognition Setup Required</h3>
                    <p className="text-yellow-200 text-sm mt-1">
                      Complete your face recognition setup to use the fastest and most secure attendance method.
                    </p>
                    <button 
                      onClick={() => navigate('/face-test')}
                      className="mt-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors text-sm font-medium"
                    >
                      Setup Face Recognition
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>

          {/* Current Events */}
          {currentEvents.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-gradient-to-r from-orange-500/10 to-red-500/10 p-6 rounded-xl border border-orange-500/20"
            >
              <div className="flex items-center mb-4">
                <Activity className="h-5 w-5 text-orange-400 mr-2" />
                <h2 className="text-xl font-bold text-white">Events Happening Now</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentEvents.map((event) => (
                  <div key={event._id} className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                    <h3 className="font-semibold text-white mb-2">{event.title}</h3>
                    <div className="flex items-center text-sm text-gray-400 mb-2">
                      <MapPin className="h-4 w-4 mr-1" />
                      {event.venue?.name}
                    </div>
                    <div className="flex items-center text-sm text-gray-400">
                      <Clock className="h-4 w-4 mr-1" />
                      Until {formatTime(event.dateTime.end)}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Face Recognition Info Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-6 rounded-xl border border-blue-500/20 mb-8"
          >
            <div className="flex items-center mb-4">
              <Camera className="h-5 w-5 text-blue-400 mr-2" />
              <h2 className="text-xl font-bold text-white">Face Recognition Attendance</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                    <Camera className="h-4 w-4 text-white" />
                  </div>
                  <h3 className="text-blue-300 font-medium">Quick & Secure</h3>
                </div>
                <p className="text-blue-200 text-sm">Mark attendance instantly with your face - no need for QR codes or manual entry.</p>
              </div>
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center mr-3">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                  <h3 className="text-green-300 font-medium">15 Min Early Access</h3>
                </div>
                <p className="text-green-200 text-sm">Attendance opens 15 minutes before event starts for your convenience.</p>
              </div>
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center mr-3">
                    <Star className="h-4 w-4 text-white" />
                  </div>
                  <h3 className="text-purple-300 font-medium">Recommended Method</h3>
                </div>
                <p className="text-purple-200 text-sm">Most secure and convenient way to mark your attendance at events.</p>
              </div>
            </div>
          </motion.div>

          {/* Happening Now Section - Full Width */}
          {happeningNowEvents.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 p-6 rounded-xl border border-cyan-500/20 mb-8"
            >
              <div className="flex items-center mb-4">
                <Clock className="h-5 w-5 text-cyan-400 mr-2" />
                <h2 className="text-xl font-bold text-white">Events Happening Now</h2>
                <div className="ml-auto bg-cyan-500/20 px-3 py-1 rounded-full">
                  <span className="text-cyan-300 text-sm font-medium">Face Recognition Available</span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {happeningNowEvents.map((event) => (
                  <div key={event._id} className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                    <h3 className="font-semibold text-white mb-2">{event.title}</h3>
                    <div className="flex items-center text-sm text-gray-400 mb-2">
                      <LocationIcon className="h-4 w-4 mr-1" />
                      {event.venue?.name || event.venue?.address || 'Location TBD'}
                    </div>
                    <div className="flex items-center text-sm text-cyan-400 mb-3">
                      <Clock className="h-4 w-4 mr-1" />
                      {formatHappeningTime(event.dateTime?.start)}
                    </div>
                    
                    {/* Attendance Options */}
                    <div className="space-y-2">
                      {/* Primary Method - Face Recognition */}
                      <button
                        onClick={() => handleFaceRecognition(event._id)}
                        className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-lg transition-all duration-200 text-sm font-medium shadow-lg"
                      >
                        <Camera className="h-4 w-4" />
                        <span>Face Recognition - RECOMMENDED</span>
                      </button>
                      
                      {/* Alternative Method - QR Code */}
                      <button
                        onClick={() => handleQRScan(event._id)}
                        className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors text-sm"
                      >
                        <QrCode className="h-4 w-4" />
                        <span>Scan QR Code (Alternative)</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Upcoming Events */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-gray-800 p-6 rounded-xl border border-gray-700"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Upcoming Events</h2>
                <Calendar className="h-5 w-5 text-cyan-400" />
              </div>
              
              {upcomingEvents.length > 0 ? (
                <div className="space-y-4">
                  {upcomingEvents.map((event) => (
                    <div key={event._id} className="bg-gray-700/50 p-4 rounded-lg border border-gray-600 hover:border-gray-500 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-white mb-1">{event.title}</h3>
                          <div className="flex items-center text-sm text-gray-400 mb-2">
                            <MapPin className="h-4 w-4 mr-1" />
                            {event.venue?.name}
                          </div>
                          <div className="flex items-center text-sm text-gray-400">
                            <Clock className="h-4 w-4 mr-1" />
                            {formatDate(event.dateTime.start)} at {formatTime(event.dateTime.start)}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-cyan-400 font-semibold">₹{event.price}</p>
                          <span className="text-xs text-gray-400">{event.category}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400">No upcoming events</p>
                </div>
              )}
            </motion.div>

            {/* Recent Bookings */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-gray-800 p-6 rounded-xl border border-gray-700"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Recent Bookings</h2>
                <BookOpen className="h-5 w-5 text-green-400" />
              </div>
              
              {recentBookings.length > 0 ? (
                <div className="space-y-4">
                  {recentBookings.map((booking) => (
                    <div key={booking._id} className="bg-gray-700/50 p-4 rounded-lg border border-gray-600 hover:border-gray-500 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-white mb-1">{booking.event?.title}</h3>
                          <div className="flex items-center text-sm text-gray-400 mb-2">
                            <Clock className="h-4 w-4 mr-1" />
                            {getTimeAgo(booking.createdAt)}
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                              {booking.status}
                            </span>
                            {booking.attendanceMarked && (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                Attendance Marked
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-green-400 font-semibold">₹{booking.totalAmount}</p>
                          <p className="text-xs text-gray-400">Qty: {booking.quantity}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400">No recent bookings</p>
                </div>
              )}
            </motion.div>
          </div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-gray-800 p-6 rounded-xl border border-gray-700"
          >
            <h2 className="text-xl font-bold text-white mb-6">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <button 
                onClick={() => navigate('/events')}
                className="flex items-center justify-center p-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all duration-200"
              >
                <Calendar className="h-5 w-5 mr-2" />
                Browse Events
              </button>
              <button 
                onClick={() => navigate('/profile')}
                className="flex items-center justify-center p-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-200"
              >
                <User className="h-5 w-5 mr-2" />
                View Profile
              </button>
              <button 
                onClick={() => navigate('/bookings')}
                className="flex items-center justify-center p-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200"
              >
                <BookOpen className="h-5 w-5 mr-2" />
                My Bookings
              </button>
              <button 
                onClick={() => navigate('/attendance')}
                className="flex items-center justify-center p-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-200"
              >
                <Camera className="h-5 w-5 mr-2" />
                Face Recognition
              </button>
              <button 
                onClick={() => navigate('/my-certificates')}
                className="flex items-center justify-center p-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-all duration-200"
              >
                <Award className="h-5 w-5 mr-2" />
                My Certificates
              </button>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Attendance Modals */}
      {attendanceMode === 'qr' && (
        <QRScanner
          onClose={handleAttendanceClose}
          onSuccess={handleAttendanceSuccess}
          eventId={selectedEventId}
        />
      )}

      {attendanceMode === 'face' && (
        <FaceRecognition
          isOpen={attendanceMode === 'face'}
          onClose={handleAttendanceClose}
          onSuccess={handleAttendanceSuccess}
          eventId={selectedEventId}
        />
      )}
    </div>
  );
};

export default Dashboard;

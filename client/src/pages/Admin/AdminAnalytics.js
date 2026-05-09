import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Calendar, 
  TrendingUp, 
  DollarSign, 
  Eye, 
  Star, 
  Download,
  Filter,
  RefreshCw,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import api from '../../utils/axiosConfig';
import useCustomToast from '../../utils/customToast';

const AdminAnalytics = () => {
  const toast = useCustomToast();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7d');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [analyticsData, setAnalyticsData] = useState({
    overview: {
      totalUsers: 0,
      activeUsers: 0,
      totalEvents: 0,
      totalRevenue: 0,
      attendanceRate: 0,
      averageRating: 0
    },
    userGrowth: [],
    eventStats: [],
    revenueData: [],
    attendanceData: [],
    popularEvents: [],
    recentActivity: []
  });

  const dateRanges = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' },
    { value: '1y', label: 'Last year' }
  ];

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'workshop', label: 'Workshop' },
    { value: 'seminar', label: 'Seminar' },
    { value: 'competition', label: 'Competition' },
    { value: 'conference', label: 'Conference' }
  ];

  const COLORS = ['#06b6d4', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'];

  // Fetch real analytics data
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      setLoading(true);
      try {
        
        
        const [
          overviewResponse,
          userGrowthResponse,
          eventCategoriesResponse,
          revenueTrendsResponse,
          attendanceResponse,
          popularEventsResponse,
          recentActivityResponse
        ] = await Promise.all([
          api.get('/api/analytics/overview', {
            params: { dateRange, category: selectedCategory }
          }),
          api.get('/api/analytics/user-growth', {
            params: { dateRange }
          }),
          api.get('/api/analytics/event-categories', {
            params: { dateRange }
          }),
          api.get('/api/analytics/revenue-trends', {
            params: { dateRange }
          }),
          api.get('/api/analytics/attendance', {
            params: { dateRange }
          }),
          api.get('/api/analytics/popular-events', {
            params: { dateRange }
          }),
          api.get('/api/analytics/recent-activity')
        ]);

        

        setAnalyticsData({
          overview: overviewResponse.data,
          userGrowth: userGrowthResponse.data,
          eventStats: eventCategoriesResponse.data,
          revenueData: revenueTrendsResponse.data,
          attendanceData: attendanceResponse.data,
          popularEvents: popularEventsResponse.data,
          recentActivity: recentActivityResponse.data
        });
      } catch (error) {
        
        
        toast.error('Failed to fetch analytics data');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [dateRange, selectedCategory]);

  const handleExportData = async (type) => {
    try {
      
      
      let exportData = [];
      let filename = '';
      
      switch (type) {
        case 'overview':
          exportData = [analyticsData.overview];
          filename = 'analytics-overview';
          break;
        case 'events':
          exportData = analyticsData.popularEvents;
          filename = 'popular-events';
          break;
        case 'revenue':
          exportData = analyticsData.revenueData;
          filename = 'revenue-trends';
          break;
        case 'attendance':
          exportData = analyticsData.attendanceData;
          filename = 'attendance-data';
          break;
        case 'all':
          exportData = {
            overview: analyticsData.overview,
            userGrowth: analyticsData.userGrowth,
            eventCategories: analyticsData.eventStats,
            revenueTrends: analyticsData.revenueData,
            attendance: analyticsData.attendanceData,
            popularEvents: analyticsData.popularEvents,
            recentActivity: analyticsData.recentActivity
          };
          filename = 'analytics-complete';
          break;
        default:
          exportData = analyticsData;
          filename = 'analytics-data';
      }
      
      // Create and download JSON file
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success(`${type} data exported successfully`);
    } catch (error) {
      
      toast.error('Failed to export data');
    }
  };

  const StatCard = ({ title, value, icon: Icon, change, color = 'cyan' }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800 rounded-xl border border-gray-700 p-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
          {change && (
            <p className={`text-sm mt-1 ${change > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {change > 0 ? '+' : ''}{change}% from last period
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg bg-${color}-500/10`}>
          <Icon className={`h-6 w-6 text-${color}-400`} />
        </div>
      </div>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 text-cyan-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading analytics data...</p>
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Analytics Dashboard</h1>
              <p className="text-gray-400">Comprehensive insights into your platform performance</p>
            </div>
            <div className="flex items-center space-x-4 mt-4 sm:mt-0">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                {dateRanges.map(range => (
                  <option key={range.value} value={range.value}>{range.label}</option>
                ))}
              </select>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                {categories.map(category => (
                  <option key={category.value} value={category.value}>{category.label}</option>
                ))}
              </select>
              <button
                onClick={() => {
                  setDateRange('7d');
                  setSelectedCategory('all');
                  toast.success('Filters reset');
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Refresh</span>
              </button>
              <button
                onClick={() => handleExportData('all')}
                className="flex items-center space-x-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
          <StatCard
            title="Total Users"
            value={analyticsData.overview?.totalUsers?.toLocaleString() || '0'}
            icon={Users}
            color="cyan"
          />
          <StatCard
            title="Active Users"
            value={analyticsData.overview?.activeUsers?.toLocaleString() || '0'}
            icon={Activity}
            color="blue"
          />
          <StatCard
            title="Total Events"
            value={analyticsData.overview?.totalEvents?.toLocaleString() || '0'}
            icon={Calendar}
            color="purple"
          />
          <StatCard
            title="Revenue"
            value={`₹${analyticsData.overview?.totalRevenue?.toLocaleString() || '0'}`}
            // icon={DollarSign}
            color="yellow"
          />
          <StatCard
            title="Attendance Rate"
            value={`${analyticsData.overview?.attendanceRate || 0}%`}
            icon={TrendingUp}
            color="green"
          />
          <StatCard
            title="Avg Rating"
            value={analyticsData.overview?.averageRating || '0.0'}
            icon={Star}
            color="red"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* User Growth Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800 rounded-xl border border-gray-700 p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">User Growth</h3>
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-cyan-400" />
                <span className="text-sm text-gray-400">Monthly</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analyticsData.userGrowth || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#ffffff'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="users"
                  stroke="#06b6d4"
                  fill="#06b6d4"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Event Categories */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800 rounded-xl border border-gray-700 p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Event Categories</h3>
              <div className="flex items-center space-x-2">
                <PieChart className="h-5 w-5 text-cyan-400" />
                <span className="text-sm text-gray-400">Distribution</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={analyticsData.eventStats || []}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {(analyticsData.eventStats || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Revenue and Attendance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Revenue Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800 rounded-xl border border-gray-700 p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Revenue Trends</h3>
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-green-400" />
                <span className="text-sm text-green-400">+22.1%</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analyticsData.revenueData || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#ffffff'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Attendance Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800 rounded-xl border border-gray-700 p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Attendance Breakdown</h3>
              <div className="flex items-center space-x-2">
                <Eye className="h-5 w-5 text-cyan-400" />
                <span className="text-sm text-gray-400">By Event</span>
              </div>
            </div>
            <div className="space-y-4">
              {(analyticsData.attendanceData || []).length > 0 ? (
                analyticsData.attendanceData.map((event, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                    <div className="flex-1">
                      <p className="text-white font-medium">{event.event}</p>
                      <p className="text-sm text-gray-400">
                        {event.attended}/{event.registered} attendees
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-20 bg-gray-600 rounded-full h-2">
                        <div
                          className="bg-cyan-500 h-2 rounded-full"
                          style={{ width: `${event.rate}%` }}
                        />
                      </div>
                      <span className="text-sm text-white font-medium">{event.rate}%</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-400">No attendance data available</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Popular Events and Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Popular Events */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800 rounded-xl border border-gray-700 p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Most Popular Events</h3>
              <button
                onClick={() => handleExportData('events')}
                className="flex items-center space-x-2 px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
              >
                <Download className="h-4 w-4" />
                <span className="text-sm">Export</span>
              </button>
            </div>
            <div className="space-y-4">
              {(analyticsData.popularEvents || []).length > 0 ? (
                analyticsData.popularEvents.map((event, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                    <div className="flex-1">
                      <p className="text-white font-medium">{event.name}</p>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-sm text-gray-400">
                          {event.registrations} registrations
                        </span>
                        <span className="text-sm text-green-400">
                          ₹{event.revenue.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-cyan-400">#{index + 1}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-400">No popular events data available</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800 rounded-xl border border-gray-700 p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
              <div className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-cyan-400" />
                <span className="text-sm text-gray-400">Live</span>
              </div>
            </div>
            <div className="space-y-4">
              {(analyticsData.recentActivity || []).length > 0 ? (
                analyticsData.recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-gray-700 rounded-lg">
                    <div className={`w-2 h-2 rounded-full ${
                      activity.type === 'registration' ? 'bg-green-400' :
                      activity.type === 'payment' ? 'bg-blue-400' :
                      activity.type === 'attendance' ? 'bg-cyan-400' : 'bg-red-400'
                    }`} />
                    <div className="flex-1">
                      <p className="text-white text-sm">
                        <span className="font-medium">{activity.user}</span> {activity.type} for{' '}
                        <span className="text-cyan-400">{activity.event}</span>
                      </p>
                      <p className="text-gray-400 text-xs">{activity.time}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-400">No recent activity available</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;

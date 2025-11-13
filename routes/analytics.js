const express = require('express');
const User = require('../models/User');
const Event = require('../models/Event');
const Booking = require('../models/Booking');
const Attendance = require('../models/Attendance');
const { adminAuth } = require('../middleware/auth');

const router = express.Router();

// Get analytics overview
router.get('/overview', adminAuth, async (req, res) => {
  try {
    const { dateRange = '30d', category = 'all' } = req.query;
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (dateRange) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }

    console.log('Analytics overview request:', { dateRange, category, startDate, endDate });

    // Build category filter
    const categoryFilter = category !== 'all' ? { category } : {};

    const [
      totalUsers,
      activeUsers,
      totalEvents,
      totalBookings,
      totalRevenue,
      attendanceRate,
      averageRating
    ] = await Promise.all([
      // Total users
      User.countDocuments({ role: 'user' }),
      
      // Active users (users with bookings in date range)
      User.countDocuments({
        role: 'user',
        _id: {
          $in: await Booking.distinct('user', {
            createdAt: { $gte: startDate, $lte: endDate }
          })
        }
      }),
      
      // Total events
      Event.countDocuments({
        ...categoryFilter,
        createdAt: { $gte: startDate, $lte: endDate }
      }),
      
      // Total bookings
      Booking.countDocuments({
        createdAt: { $gte: startDate, $lte: endDate }
      }),
      
      // Total revenue
      Booking.aggregate([
        {
          $match: {
            status: 'confirmed',
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$totalAmount' }
          }
        }
      ]),
      
      // Attendance rate
      calculateAttendanceRate(startDate, endDate),
      
      // Average rating (placeholder - would need rating system)
      4.3
    ]);

    const revenue = totalRevenue.length > 0 ? totalRevenue[0].total : 0;

    console.log('Analytics overview results:', {
      totalUsers,
      activeUsers,
      totalEvents,
      totalBookings,
      revenue,
      attendanceRate
    });

    res.json({
      totalUsers,
      activeUsers,
      totalEvents,
      totalBookings,
      totalRevenue: revenue,
      attendanceRate,
      averageRating
    });

  } catch (error) {
    console.error('Analytics overview error:', error);
    res.status(500).json({ message: 'Failed to fetch analytics overview', error: error.message });
  }
});

// Get user growth data
router.get('/user-growth', adminAuth, async (req, res) => {
  try {
    const { dateRange = '30d' } = req.query;
    
    const endDate = new Date();
    const startDate = new Date();
    
    switch (dateRange) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
    }

    // Get user growth by month
    const userGrowth = await User.aggregate([
      {
        $match: {
          role: 'user',
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          users: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Get event growth by month
    const eventGrowth = await Event.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          events: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Format data for charts
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const growthData = [];

    // Create a map for easy lookup
    const userMap = new Map();
    const eventMap = new Map();

    userGrowth.forEach(item => {
      const key = `${item._id.year}-${item._id.month}`;
      userMap.set(key, item.users);
    });

    eventGrowth.forEach(item => {
      const key = `${item._id.year}-${item._id.month}`;
      eventMap.set(key, item.events);
    });

    // Generate data for each month in range
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const key = `${year}-${month}`;
      
      growthData.push({
        month: months[currentDate.getMonth()],
        users: userMap.get(key) || 0,
        events: eventMap.get(key) || 0
      });
      
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    res.json(growthData);

  } catch (error) {
    console.error('User growth analytics error:', error);
    res.status(500).json({ message: 'Failed to fetch user growth data', error: error.message });
  }
});

// Get event categories distribution
router.get('/event-categories', adminAuth, async (req, res) => {
  try {
    const { dateRange = '30d' } = req.query;
    
    const endDate = new Date();
    const startDate = new Date();
    
    switch (dateRange) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
    }

    const categories = await Event.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    const colors = ['#06b6d4', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'];
    
    const formattedData = categories.map((category, index) => ({
      name: category._id || 'Uncategorized',
      value: category.count,
      color: colors[index % colors.length]
    }));

    res.json(formattedData);

  } catch (error) {
    console.error('Event categories analytics error:', error);
    res.status(500).json({ message: 'Failed to fetch event categories', error: error.message });
  }
});

// Get revenue trends
router.get('/revenue-trends', adminAuth, async (req, res) => {
  try {
    const { dateRange = '30d' } = req.query;
    
    const endDate = new Date();
    const startDate = new Date();
    
    switch (dateRange) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
    }

    const revenueData = await Booking.aggregate([
      {
        $match: {
          status: 'confirmed',
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: { $sum: '$totalAmount' },
          bookings: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formattedData = revenueData.map(item => ({
      month: months[item._id.month - 1],
      revenue: item.revenue,
      bookings: item.bookings
    }));

    res.json(formattedData);

  } catch (error) {
    console.error('Revenue trends analytics error:', error);
    res.status(500).json({ message: 'Failed to fetch revenue trends', error: error.message });
  }
});

// Get attendance data
router.get('/attendance', adminAuth, async (req, res) => {
  try {
    const { dateRange = '30d' } = req.query;
    
    const endDate = new Date();
    const startDate = new Date();
    
    switch (dateRange) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
    }

    const attendanceData = await Booking.aggregate([
      {
        $match: {
          status: 'confirmed',
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $lookup: {
          from: 'events',
          localField: 'event',
          foreignField: '_id',
          as: 'eventData'
        }
      },
      {
        $unwind: '$eventData'
      },
      {
        $lookup: {
          from: 'attendances',
          localField: '_id',
          foreignField: 'booking',
          as: 'attendance'
        }
      },
      {
        $group: {
          _id: '$eventData.title',
          registered: { $sum: 1 },
          attended: { $sum: { $cond: [{ $gt: [{ $size: '$attendance' }, 0] }, 1, 0] } }
        }
      },
      {
        $addFields: {
          rate: { $multiply: [{ $divide: ['$attended', '$registered'] }, 100] }
        }
      },
      {
        $sort: { registered: -1 }
      },
      {
        $limit: 10
      }
    ]);

    const formattedData = attendanceData.map(item => ({
      event: item._id,
      registered: item.registered,
      attended: item.attended,
      rate: Math.round(item.rate * 10) / 10
    }));

    res.json(formattedData);

  } catch (error) {
    console.error('Attendance analytics error:', error);
    res.status(500).json({ message: 'Failed to fetch attendance data', error: error.message });
  }
});

// Get popular events
router.get('/popular-events', adminAuth, async (req, res) => {
  try {
    const { dateRange = '30d' } = req.query;
    
    const endDate = new Date();
    const startDate = new Date();
    
    switch (dateRange) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
    }

    const popularEvents = await Booking.aggregate([
      {
        $match: {
          status: 'confirmed',
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $lookup: {
          from: 'events',
          localField: 'event',
          foreignField: '_id',
          as: 'eventData'
        }
      },
      {
        $unwind: '$eventData'
      },
      {
        $group: {
          _id: '$eventData.title',
          registrations: { $sum: 1 },
          revenue: { $sum: '$totalAmount' }
        }
      },
      {
        $sort: { registrations: -1 }
      },
      {
        $limit: 10
      }
    ]);

    const formattedData = popularEvents.map(event => ({
      name: event._id,
      registrations: event.registrations,
      revenue: event.revenue
    }));

    res.json(formattedData);

  } catch (error) {
    console.error('Popular events analytics error:', error);
    res.status(500).json({ message: 'Failed to fetch popular events', error: error.message });
  }
});

// Get recent activity
router.get('/recent-activity', adminAuth, async (req, res) => {
  try {
    const recentBookings = await Booking.find()
      .populate('user', 'name email')
      .populate('event', 'title')
      .sort({ createdAt: -1 })
      .limit(20);

    const activities = recentBookings.map(booking => {
      const timeAgo = getTimeAgo(booking.createdAt);
      return {
        type: booking.status === 'confirmed' ? 'payment' : 'registration',
        user: booking.user?.name || 'Unknown User',
        event: booking.event?.title || 'Unknown Event',
        time: timeAgo,
        amount: booking.totalAmount
      };
    });

    res.json(activities);

  } catch (error) {
    console.error('Recent activity analytics error:', error);
    res.status(500).json({ message: 'Failed to fetch recent activity', error: error.message });
  }
});

// Helper function to calculate attendance rate
async function calculateAttendanceRate(startDate, endDate) {
  try {
    const totalBookings = await Booking.countDocuments({
      status: 'confirmed',
      createdAt: { $gte: startDate, $lte: endDate }
    });

    const attendedBookings = await Booking.countDocuments({
      status: 'confirmed',
      createdAt: { $gte: startDate, $lte: endDate },
      attendanceMarked: true
    });

    return totalBookings > 0 ? Math.round((attendedBookings / totalBookings) * 100 * 10) / 10 : 0;
  } catch (error) {
    console.error('Error calculating attendance rate:', error);
    return 0;
  }
}

// Helper function to get time ago
function getTimeAgo(date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  return `${Math.floor(diffInSeconds / 2592000)} months ago`;
}

module.exports = router;

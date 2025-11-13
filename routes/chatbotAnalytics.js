const express = require('express');
const { auth } = require('../middleware/auth');
const Booking = require('../models/Booking');
const Event = require('../models/Event');
const User = require('../models/User');
const Attendance = require('../models/Attendance');

const router = express.Router();

// Get user's upcoming events for chatbot
router.get('/user/upcoming-events', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Get user's confirmed bookings for upcoming events
    const bookings = await Booking.find({
      user: userId,
      status: 'confirmed',
      'event.dateTime.start': { $gt: new Date() }
    })
    .populate('event', 'title dateTime venue image category price')
    .sort({ 'event.dateTime.start': 1 })
    .limit(5);

    const upcomingEvents = bookings.map(booking => ({
      id: booking.event._id,
      title: booking.event.title,
      date: booking.event.dateTime.start,
      venue: booking.event.venue?.name,
      category: booking.event.category,
      price: booking.event.price,
      bookingStatus: booking.status,
      bookingId: booking._id
    }));

    res.json({
      success: true,
      upcomingEvents,
      count: upcomingEvents.length
    });

  } catch (error) {
    console.error('Get upcoming events error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch upcoming events',
      error: error.message 
    });
  }
});

// Get user's current events (happening now)
router.get('/user/current-events', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const now = new Date();
    
    // Get user's confirmed bookings for current events
    const bookings = await Booking.find({
      user: userId,
      status: 'confirmed',
      'event.dateTime.start': { $lte: now },
      'event.dateTime.end': { $gte: now }
    })
    .populate('event', 'title dateTime venue image category')
    .sort({ 'event.dateTime.start': 1 });

    const currentEvents = bookings.map(booking => ({
      id: booking.event._id,
      title: booking.event.title,
      startTime: booking.event.dateTime.start,
      endTime: booking.event.dateTime.end,
      venue: booking.event.venue?.name,
      category: booking.event.category,
      bookingId: booking._id,
      attendanceMarked: booking.attendanceMarked
    }));

    res.json({
      success: true,
      currentEvents,
      count: currentEvents.length
    });

  } catch (error) {
    console.error('Get current events error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch current events',
      error: error.message 
    });
  }
});

// Get user's booking history
router.get('/user/booking-history', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { limit = 10, status } = req.query;
    
    let query = { user: userId };
    if (status) {
      query.status = status;
    }
    
    const bookings = await Booking.find(query)
      .populate('event', 'title dateTime venue image category')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    const bookingHistory = bookings.map(booking => ({
      id: booking._id,
      eventTitle: booking.event.title,
      eventDate: booking.event.dateTime.start,
      venue: booking.event.venue?.name,
      category: booking.event.category,
      status: booking.status,
      totalAmount: booking.totalAmount,
      quantity: booking.quantity,
      bookingDate: booking.createdAt,
      attendanceMarked: booking.attendanceMarked
    }));

    res.json({
      success: true,
      bookingHistory,
      count: bookingHistory.length
    });

  } catch (error) {
    console.error('Get booking history error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch booking history',
      error: error.message 
    });
  }
});

// Get user's payment history
router.get('/user/payment-history', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { limit = 10 } = req.query;
    
    const bookings = await Booking.find({
      user: userId,
      status: { $in: ['confirmed', 'completed'] }
    })
    .populate('event', 'title dateTime venue')
    .sort({ paymentDate: -1 })
    .limit(parseInt(limit));

    const paymentHistory = bookings.map(booking => ({
      id: booking._id,
      eventTitle: booking.event.title,
      amount: booking.totalAmount,
      paymentDate: booking.paymentDate,
      paymentStatus: booking.paymentStatus,
      razorpayPaymentId: booking.razorpayPaymentId
    }));

    const totalSpent = bookings.reduce((sum, booking) => sum + booking.totalAmount, 0);

    res.json({
      success: true,
      paymentHistory,
      totalSpent,
      count: paymentHistory.length
    });

  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch payment history',
      error: error.message 
    });
  }
});

// Get user's attendance statistics
router.get('/user/attendance-stats', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const [totalBookings, confirmedBookings, attendedBookings, attendanceRate] = await Promise.all([
      Booking.countDocuments({ user: userId }),
      Booking.countDocuments({ user: userId, status: 'confirmed' }),
      Booking.countDocuments({ user: userId, attendanceMarked: true }),
      Booking.aggregate([
        { $match: { user: userId, status: 'confirmed' } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            attended: { $sum: { $cond: ['$attendanceMarked', 1, 0] } }
          }
        }
      ])
    ]);

    const rate = attendanceRate.length > 0 ? 
      Math.round((attendanceRate[0].attended / attendanceRate[0].total) * 100) : 0;

    res.json({
      success: true,
      stats: {
        totalBookings,
        confirmedBookings,
        attendedBookings,
        attendanceRate: rate
      }
    });

  } catch (error) {
    console.error('Get attendance stats error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch attendance statistics',
      error: error.message 
    });
  }
});

// Get user's favorite categories
router.get('/user/favorite-categories', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const categoryStats = await Booking.aggregate([
      { $match: { user: userId, status: { $in: ['confirmed', 'completed'] } } },
      { $lookup: { from: 'events', localField: 'event', foreignField: '_id', as: 'event' } },
      { $unwind: '$event' },
      { $group: { _id: '$event.category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    res.json({
      success: true,
      favoriteCategories: categoryStats
    });

  } catch (error) {
    console.error('Get favorite categories error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch favorite categories',
      error: error.message 
    });
  }
});

// Get event availability for specific event
router.get('/event/:eventId/availability', auth, async (req, res) => {
  try {
    const { eventId } = req.params;
    
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const bookedSeats = await Booking.countDocuments({
      event: eventId,
      status: { $in: ['confirmed', 'completed'] }
    });

    const availableSeats = event.capacity - bookedSeats;
    const isAvailable = availableSeats > 0;

    res.json({
      success: true,
      event: {
        title: event.title,
        capacity: event.capacity,
        bookedSeats,
        availableSeats,
        isAvailable,
        price: event.price
      }
    });

  } catch (error) {
    console.error('Get event availability error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch event availability',
      error: error.message 
    });
  }
});

// Get user's recent activity
router.get('/user/recent-activity', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { limit = 10 } = req.query;
    
    const recentBookings = await Booking.find({ user: userId })
      .populate('event', 'title dateTime venue category')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    const activities = recentBookings.map(booking => ({
      id: booking._id,
      type: 'booking',
      title: `Booked ${booking.event.title}`,
      date: booking.createdAt,
      status: booking.status,
      amount: booking.totalAmount
    }));

    res.json({
      success: true,
      activities,
      count: activities.length
    });

  } catch (error) {
    console.error('Get recent activity error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch recent activity',
      error: error.message 
    });
  }
});

// Get personalized event recommendations
router.get('/user/recommendations', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Get user's interests
    const user = await User.findById(userId);
    const userInterests = user.interests || [];
    
    // Get user's booking history to understand preferences
    const userBookings = await Booking.find({ user: userId })
      .populate('event', 'category')
      .limit(20);
    
    const bookedCategories = userBookings.map(booking => booking.event.category);
    const categoryCounts = bookedCategories.reduce((acc, category) => {
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});
    
    // Get upcoming events in user's preferred categories
    const preferredCategories = Object.keys(categoryCounts)
      .sort((a, b) => categoryCounts[b] - categoryCounts[a])
      .slice(0, 3);
    
    let query = {
      status: 'published',
      isActive: true,
      'dateTime.start': { $gt: new Date() }
    };
    
    if (preferredCategories.length > 0) {
      query.category = { $in: preferredCategories };
    }
    
    const recommendations = await Event.find(query)
      .populate('organizer', 'name')
      .sort({ 'dateTime.start': 1 })
      .limit(5);

    const eventRecommendations = recommendations.map(event => ({
      id: event._id,
      title: event.title,
      date: event.dateTime.start,
      venue: event.venue?.name,
      category: event.category,
      price: event.price,
      organizer: event.organizer.name
    }));

    res.json({
      success: true,
      recommendations: eventRecommendations,
      basedOn: preferredCategories,
      userInterests
    });

  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch recommendations',
      error: error.message 
    });
  }
});

module.exports = router;

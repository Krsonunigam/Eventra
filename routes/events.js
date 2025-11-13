const express = require('express');
const Event = require('../models/Event');
const Booking = require('../models/Booking');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get all published events
router.get('/', async (req, res) => {
  try {
    const { category, search, date, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    let query = { status: 'published', isActive: true };
    
    if (category) {
      query.category = category;
    }
    
    // Search only in event titles for better indexing
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    // Date filtering - filter events by specific date
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      query['dateTime.start'] = {
        $gte: startOfDay,
        $lte: endOfDay
      };
    }

    const events = await Event.find(query)
      .populate('organizer', 'name email')
      .sort({ 'dateTime.start': 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Event.countDocuments(query);

    res.json({
      events,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ message: 'Failed to fetch events', error: error.message });
  }
});

// Get upcoming events (within 15 minutes) - MUST be before /:id route
router.get('/upcoming', auth, async (req, res) => {
  try {
    // Get current time in IST
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
    const nowIST = new Date(now.getTime() + istOffset);
    const fifteenMinutesFromNow = new Date(nowIST.getTime() + 15 * 60 * 1000);
    
    const events = await Event.find({
      isActive: true,
      'dateTime.start': {
        $gte: now,
        $lte: fifteenMinutesFromNow
      }
    })
    .populate('organizer', 'name email')
    .sort({ 'dateTime.start': 1 });

    res.json(events);
  } catch (error) {
    console.error('Get upcoming events error:', error);
    res.status(500).json({ message: 'Failed to fetch upcoming events', error: error.message });
  }
});

// Get single event
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizer', 'name email');

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.status !== 'published') {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json(event);

  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({ message: 'Failed to fetch event', error: error.message });
  }
});

// Get upcoming events
router.get('/upcoming/events', async (req, res) => {
  try {
    const now = new Date();
    const events = await Event.find({
      status: 'published',
      isActive: true,
      'dateTime.start': { $gt: now }
    })
    .populate('organizer', 'name email')
    .sort({ 'dateTime.start': 1 })
    .limit(6);

    res.json({ events });

  } catch (error) {
    console.error('Get upcoming events error:', error);
    res.status(500).json({ message: 'Failed to fetch upcoming events', error: error.message });
  }
});

// Get current events (happening now)
router.get('/current', auth, async (req, res) => {
  try {
    const now = new Date();
    const events = await Event.find({
      status: 'published',
      isActive: true,
      'dateTime.start': { $lte: now },
      'dateTime.end': { $gte: now }
    })
    .populate('organizer', 'name email')
    .sort({ 'dateTime.start': 1 });

    // Add user booking status if user is authenticated
    if (req.user) {
      const Booking = require('../models/Booking');
      for (let event of events) {
        const userBooking = await Booking.findOne({
          user: req.user.userId,
          event: event._id,
          status: 'confirmed'
        });
        event.userBooking = userBooking;
      }
    }

    res.json({ events });

  } catch (error) {
    console.error('Get current events error:', error);
    res.status(500).json({ message: 'Failed to fetch current events', error: error.message });
  }
});

// Get events by category
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const events = await Event.find({
      category,
      status: 'published',
      isActive: true
    })
    .populate('organizer', 'name email')
    .sort({ 'dateTime.start': 1 })
    .skip(skip)
    .limit(parseInt(limit));

    const total = await Event.countDocuments({
      category,
      status: 'published',
      isActive: true
    });

    res.json({
      events,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('Get events by category error:', error);
    res.status(500).json({ message: 'Failed to fetch events by category', error: error.message });
  }
});

// Get user's booked events
router.get('/user/bookings', auth, async (req, res) => {
  try {
    const bookings = await Booking.find({ 
      user: req.user.userId,
      status: { $in: ['active', 'completed'] }
    })
    .populate('event', 'title dateTime venue image category')
    .sort({ bookingDate: -1 });

    res.json({ bookings });

  } catch (error) {
    console.error('Get user bookings error:', error);
    res.status(500).json({ message: 'Failed to fetch user bookings', error: error.message });
  }
});

// Check seat availability
router.get('/:id/availability', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const bookedSeats = await Booking.countDocuments({
      event: req.params.id,
      status: { $in: ['active', 'completed'] }
    });

    const availableSeats = event.capacity - bookedSeats;

    res.json({
      totalCapacity: event.capacity,
      bookedSeats,
      availableSeats,
      isAvailable: availableSeats > 0
    });

  } catch (error) {
    console.error('Check availability error:', error);
    res.status(500).json({ message: 'Failed to check seat availability', error: error.message });
  }
});

// Get event statistics
router.get('/:id/stats', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const stats = await Booking.aggregate([
      { $match: { event: event._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' }
        }
      }
    ]);

    const attendanceStats = await Booking.aggregate([
      { $match: { event: event._id, status: 'active' } },
      {
        $group: {
          _id: '$attendance.checkedIn',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      event: {
        title: event.title,
        capacity: event.capacity,
        price: event.price
      },
      bookingStats: stats,
      attendanceStats
    });

  } catch (error) {
    console.error('Get event stats error:', error);
    res.status(500).json({ message: 'Failed to fetch event statistics', error: error.message });
  }
});

// Search events
router.get('/search/query', async (req, res) => {
  try {
    const { q, category, dateFrom, dateTo, priceMin, priceMax } = req.query;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    let query = { status: 'published', isActive: true };

    if (q) {
      // Search only in event titles for better indexing
      query.title = { $regex: q, $options: 'i' };
    }

    if (category) {
      query.category = category;
    }

    if (dateFrom || dateTo) {
      query['dateTime.start'] = {};
      if (dateFrom) query['dateTime.start'].$gte = new Date(dateFrom);
      if (dateTo) query['dateTime.start'].$lte = new Date(dateTo);
    }

    if (priceMin || priceMax) {
      query.price = {};
      if (priceMin) query.price.$gte = parseFloat(priceMin);
      if (priceMax) query.price.$lte = parseFloat(priceMax);
    }

    const events = await Event.find(query)
      .populate('organizer', 'name email')
      .sort({ 'dateTime.start': 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Event.countDocuments(query);

    res.json({
      events,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('Search events error:', error);
    res.status(500).json({ message: 'Failed to search events', error: error.message });
  }
});


module.exports = router;

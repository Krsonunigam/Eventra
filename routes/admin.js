const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const Event = require('../models/Event');
const Booking = require('../models/Booking');
const Attendance = require('../models/Attendance');
const { adminAuth } = require('../middleware/auth');
const { checkSubscription } = require('../middleware/subscription');
const { generateUserReport, generateEventReport } = require('../utils/excelService');
const { sendEventNotification } = require('../utils/emailService');

const router = express.Router();

// Get dashboard statistics
router.get('/dashboard', async (req, res) => {
  try {
    const [
      totalUsers,
      totalEvents,
      totalBookings,
      totalRevenue,
      recentUsers,
      upcomingEvents,
      recentBookings
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }).catch(() => 0),
      Event.countDocuments().catch(() => 0),
      Booking.countDocuments({ status: { $in: ['confirmed'] } }).catch(() => 0),
      Booking.aggregate([
        { $match: { status: 'confirmed' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]).catch(() => []),
      User.find({ role: 'user' }).sort({ createdAt: -1 }).limit(5).catch(() => []),
      Event.find({ status: 'published', 'dateTime.start': { $gt: new Date() } })
        .sort({ 'dateTime.start': 1 }).limit(5).catch(() => []),
      Booking.find({ status: { $in: ['confirmed'] } })
        .populate('user', 'name email')
        .populate('event', 'title')
        .sort({ createdAt: -1 }).limit(10).catch(() => [])
    ]);

    const revenue = totalRevenue.length > 0 ? totalRevenue[0].total : 0;

    // Get monthly statistics
    const currentMonth = new Date();
    currentMonth.setDate(1);
    const nextMonth = new Date(currentMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const monthlyStats = await Promise.all([
      User.countDocuments({ 
        role: 'user', 
        createdAt: { $gte: currentMonth, $lt: nextMonth } 
      }).catch(() => 0),
      Booking.countDocuments({ 
        status: { $in: ['confirmed'] },
        createdAt: { $gte: currentMonth, $lt: nextMonth }
      }).catch(() => 0),
      Booking.aggregate([
        { 
          $match: { 
            status: 'confirmed',
            createdAt: { $gte: currentMonth, $lt: nextMonth }
          }
        },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]).catch(() => [])
    ]);

    res.json({
      success: true,
      overview: {
        totalUsers,
        totalEvents,
        totalBookings,
        totalRevenue: revenue
      },
      monthly: {
        newUsers: monthlyStats[0],
        newBookings: monthlyStats[1],
        monthlyRevenue: monthlyStats[2].length > 0 ? monthlyStats[2][0].total : 0
      },
      recent: {
        users: recentUsers,
        events: upcomingEvents,
        bookings: recentBookings
      }
    });

  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch dashboard statistics', 
      error: error.message 
    });
  }
});

// Get user statistics
router.get('/users/stats', adminAuth, async (req, res) => {
  try {
    const [
      total,
      active,
      verified,
      newThisMonth
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'user', isActive: true }),
      User.countDocuments({ 
        role: 'user', 
        isEmailVerified: true, 
        isFaceVerified: true 
      }),
      User.countDocuments({
        role: 'user',
        createdAt: {
          $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      })
    ]);

    res.json({
      total,
      active,
      verified,
      newThisMonth
    });

  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ message: 'Failed to fetch user statistics', error: error.message });
  }
});

// Get all users
router.get('/users', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status, role } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    
    // Filter by role if specified
    if (role) {
      query.role = role;
    } else {
      query.role = 'user'; // Default to users only
    }
    
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    if (status) {
      if (status === 'verified') {
        query.isEmailVerified = true;
        query.isFaceVerified = true;
      } else if (status === 'email_verified') {
        query.isEmailVerified = true;
        query.isFaceVerified = false;
      } else if (status === 'unverified') {
        query.isEmailVerified = false;
      }
    }

    const users = await User.find(query)
      .select('-password -faceData')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Failed to fetch users', error: error.message });
  }
});

// Get user details
router.get('/users/:id', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -faceData');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user's bookings
    const bookings = await Booking.find({ user: req.params.id })
      .populate('event', 'title dateTime venue')
      .sort({ bookingDate: -1 });

    // Get user's attendance history
    const attendanceHistory = await Attendance.find({ user: req.params.id })
      .populate('event', 'title dateTime')
      .sort({ checkInTime: -1 });

    res.json({
      user,
      bookings,
      attendanceHistory
    });

  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({ message: 'Failed to fetch user details', error: error.message });
  }
});

// Update user status
router.put('/users/:id/status', adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isActive = status === 'active';
    await user.save();

    res.json({ 
      message: 'User status updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isActive: user.isActive
      }
    });

  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ message: 'Failed to update user status', error: error.message });
  }
});

// Update user verification
router.put('/users/:id/verify', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isEmailVerified = true;
    user.isFaceVerified = true;
    await user.save();

    res.json({ 
      message: 'User verified successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        isFaceVerified: user.isFaceVerified
      }
    });

  } catch (error) {
    console.error('Update user verification error:', error);
    res.status(500).json({ message: 'Failed to update user verification', error: error.message });
  }
});

// Update user
router.put('/users/:id', adminAuth, async (req, res) => {
  try {
    const { name, email, studentId, institute, phoneNumber, department, gender, role } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update user fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (studentId) user.studentId = studentId;
    if (institute) user.institute = institute;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (department) user.department = department;
    if (gender) user.gender = gender;
    if (role) user.role = role;

    await user.save();

    res.json({ 
      message: 'User updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        studentId: user.studentId,
        institute: user.institute,
        phoneNumber: user.phoneNumber,
        department: user.department,
        gender: user.gender,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Failed to update user', error: error.message });
  }
});

// Delete user
router.delete('/users/:id', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete user's bookings and attendance records
    await Booking.deleteMany({ user: req.params.id });
    await Attendance.deleteMany({ user: req.params.id });

    // Delete the user
    await User.findByIdAndDelete(req.params.id);

    res.json({ 
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Failed to delete user', error: error.message });
  }
});

// Bulk actions for users
router.post('/users/bulk-action', adminAuth, async (req, res) => {
  try {
    const { userIds, action } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: 'User IDs are required' });
    }

    let updateQuery = {};
    let message = '';

    switch (action) {
      case 'activate':
        updateQuery = { isActive: true };
        message = 'Users activated successfully';
        break;
      case 'deactivate':
        updateQuery = { isActive: false };
        message = 'Users deactivated successfully';
        break;
      case 'verify':
        updateQuery = { isEmailVerified: true, isFaceVerified: true };
        message = 'Users verified successfully';
        break;
      default:
        return res.status(400).json({ message: 'Invalid action' });
    }

    const result = await User.updateMany(
      { _id: { $in: userIds } },
      updateQuery
    );

    res.json({ 
      message,
      modifiedCount: result.modifiedCount
    });

  } catch (error) {
    console.error('Bulk action error:', error);
    res.status(500).json({ message: 'Failed to perform bulk action', error: error.message });
  }
});

// Export users
router.get('/users/export', adminAuth, async (req, res) => {
  try {
    const users = await User.find({ role: 'user' })
      .select('-password -faceData')
      .sort({ createdAt: -1 });

    // Create Excel file
    const { generateUserReport } = require('../utils/excelService');
    const buffer = await generateUserReport(users);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=users-export.xlsx');
    res.send(buffer);

  } catch (error) {
    console.error('Export users error:', error);
    res.status(500).json({ message: 'Failed to export users', error: error.message });
  }
});

// Get all events
router.get('/events', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    
    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'venue.name': { $regex: search, $options: 'i' } }
      ];
    }

    const events = await Event.find(query)
      .populate('organizer', 'name email')
      .sort({ createdAt: -1 })
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

// Create new event
router.post('/events', adminAuth, async (req, res) => {
  try {
    console.log('Creating event with data:', JSON.stringify(req.body, null, 2));
    console.log('User ID:', req.user.userId);
    
    const eventData = {
      ...req.body,
      organizer: req.user.userId
    };

    console.log('Event data after adding organizer:', JSON.stringify(eventData, null, 2));

    const event = new Event(eventData);
    await event.save();

    console.log('Event created successfully:', event._id);

    res.status(201).json({
      message: 'Event created successfully',
      event
    });

  } catch (error) {
    console.error('Create event error:', error);
    console.error('Error details:', error.message);
    console.error('Validation errors:', error.errors);
    res.status(500).json({ message: 'Failed to create event', error: error.message });
  }
});

// Get single event
router.get('/events/:id', adminAuth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('organizer', 'name email');
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json(event);
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({ message: 'Failed to fetch event', error: error.message });
  }
});

// Update event
router.put('/events/:id', adminAuth, async (req, res) => {
  try {
    console.log('Update event request body:', JSON.stringify(req.body, null, 2));
    
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Update event fields
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        if (key === 'venue') {
          // Ensure coordinates is properly formatted
          event.venue.name = req.body[key].name;
          event.venue.address = req.body[key].address || '';
          event.venue.city = req.body[key].city;
          event.venue.coordinates = req.body[key].coordinates || { latitude: null, longitude: null };
        } else if (key === 'organizer') {
          // Handle organizer field - could be string or object
          if (typeof req.body[key] === 'string') {
            event[key] = new mongoose.Types.ObjectId(req.body[key]);
          } else if (req.body[key] && req.body[key]._id) {
            event[key] = new mongoose.Types.ObjectId(req.body[key]._id);
          } else {
            event[key] = req.body[key];
          }
        } else if (key === 'dateTime' && req.body[key]) {
          // Ensure dateTime is properly formatted
          event[key] = {
            start: new Date(req.body[key].start),
            end: new Date(req.body[key].end)
          };
        } else if (key === 'registrationDeadline' && req.body[key]) {
          // Ensure registrationDeadline is properly formatted
          event[key] = new Date(req.body[key]);
        } else if (key === 'cancellationPolicy' && req.body[key]) {
          // Ensure cancellationPolicy is properly formatted
          event[key] = {
            allowCancellation: req.body[key].allowCancellation || true,
            cancellationDeadline: req.body[key].cancellationDeadline ? new Date(req.body[key].cancellationDeadline) : null,
            refundPercentage: req.body[key].refundPercentage || 100
          };
        } else {
          event[key] = req.body[key];
        }
      }
    });

    console.log('Event before save:', JSON.stringify(event, null, 2));
    
    await event.save();

    console.log('Event updated successfully:', event._id);

    res.json({
      message: 'Event updated successfully',
      event
    });

  } catch (error) {
    console.error('Update event error:', error);
    console.error('Error details:', error.message);
    console.error('Validation errors:', error.errors);
    res.status(500).json({ message: 'Failed to update event', error: error.message });
  }
});

// Delete event
router.delete('/events/:id', adminAuth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if there are any bookings for this event
    const bookingsCount = await Booking.countDocuments({ event: req.params.id });
    if (bookingsCount > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete event with existing bookings. Please cancel the event instead.' 
      });
    }

    await Event.findByIdAndDelete(req.params.id);

    res.json({ message: 'Event deleted successfully' });

  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ message: 'Failed to delete event', error: error.message });
  }
});

// Get all bookings
router.get('/bookings', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, eventId } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    
    if (status) {
      query.status = status;
    }

    if (eventId) {
      query.event = eventId;
    }

    const bookings = await Booking.find(query)
      .populate('user', 'name email studentId')
      .populate('event', 'title dateTime venue')
      .sort({ bookingDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Booking.countDocuments(query);

    res.json({
      bookings,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ message: 'Failed to fetch bookings', error: error.message });
  }
});

// Export users to Excel
router.get('/export/users', adminAuth, async (req, res) => {
  try {
    const users = await User.find({ role: 'user' })
      .select('-password -faceData')
      .sort({ createdAt: -1 });

    const excelBuffer = await generateUserReport(users);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="users_${new Date().toISOString().split('T')[0]}.xlsx"`);
    res.send(excelBuffer);

  } catch (error) {
    console.error('Export users error:', error);
    res.status(500).json({ message: 'Failed to export users', error: error.message });
  }
});

// Export events to Excel
router.get('/export/events', adminAuth, async (req, res) => {
  try {
    const events = await Event.find()
      .populate('organizer', 'name email')
      .sort({ createdAt: -1 });

    const excelBuffer = await generateEventReport(events);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="events_${new Date().toISOString().split('T')[0]}.xlsx"`);
    res.send(excelBuffer);

  } catch (error) {
    console.error('Export events error:', error);
    res.status(500).json({ message: 'Failed to export events', error: error.message });
  }
});

// Send event notifications
router.post('/notifications/send', adminAuth, async (req, res) => {
  try {
    const { eventId, type, message } = req.body;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Get all users who have booked this event
    const bookings = await Booking.find({ 
      event: eventId, 
      status: 'active' 
    }).populate('user', 'name email phoneNumber');

    let sentCount = 0;
    const errors = [];

    for (const booking of bookings) {
      try {
        if (type === 'email') {
          await sendEventNotification(
            booking.user.email,
            booking.user.name,
            event.title,
            event.dateTime.start,
            event.venue.name
          );
        } else if (type === 'whatsapp') {
          // WhatsApp notification logic would go here
          console.log(`WhatsApp notification sent to ${booking.user.phoneNumber}`);
        }
        sentCount++;
      } catch (error) {
        errors.push({
          user: booking.user.email,
          error: error.message
        });
      }
    }

    res.json({
      message: `Notifications sent successfully`,
      sentCount,
      totalRecipients: bookings.length,
      errors
    });

  } catch (error) {
    console.error('Send notifications error:', error);
    res.status(500).json({ message: 'Failed to send notifications', error: error.message });
  }
});

module.exports = router;

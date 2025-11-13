const express = require('express');
const User = require('../models/User');
const Booking = require('../models/Booking');
const Attendance = require('../models/Attendance');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        studentId: user.studentId,
        institute: user.institute,
        dateOfBirth: user.dateOfBirth,
        profilePicture: user.profilePicture,
        phoneNumber: user.phoneNumber,
        isEmailVerified: user.isEmailVerified,
        isFaceVerified: user.isFaceVerified,
        interests: user.interests,
        role: user.role,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }
    });
    
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ message: 'Failed to fetch user profile', error: error.message });
  }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, phoneNumber, interests, profilePicture } = req.body;
    
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update allowed fields
    if (name) user.name = name;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (interests) user.interests = interests;
    if (profilePicture) user.profilePicture = profilePicture;
    
    await user.save();
    
    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        studentId: user.studentId,
        institute: user.institute,
        phoneNumber: user.phoneNumber,
        interests: user.interests,
        profilePicture: user.profilePicture
      }
    });
    
  } catch (error) {
    console.error('Update user profile error:', error);
    res.status(500).json({ message: 'Failed to update profile', error: error.message });
  }
});

// Get user's bookings
router.get('/bookings', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;
    
    let query = { user: req.user.userId };
    if (status) {
      query.status = status;
    }
    
    const bookings = await Booking.find(query)
      .populate('event', 'title dateTime venue image category')
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
    console.error('Get user bookings error:', error);
    res.status(500).json({ message: 'Failed to fetch bookings', error: error.message });
  }
});

// Get user's attendance history
router.get('/attendance', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    
    const attendanceHistory = await Attendance.find({ user: req.user.userId })
      .populate('event', 'title dateTime venue')
      .populate('booking', 'seatNumber hall')
      .sort({ checkInTime: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Attendance.countDocuments({ user: req.user.userId });
    
    res.json({
      attendanceHistory,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
    
  } catch (error) {
    console.error('Get user attendance error:', error);
    res.status(500).json({ message: 'Failed to fetch attendance history', error: error.message });
  }
});

// Get user statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const [
      totalBookings,
      activeBookings,
      completedBookings,
      cancelledBookings,
      totalAttendance,
      totalSpent
    ] = await Promise.all([
      Booking.countDocuments({ user: req.user.userId }),
      Booking.countDocuments({ user: req.user.userId, status: 'active' }),
      Booking.countDocuments({ user: req.user.userId, status: 'completed' }),
      Booking.countDocuments({ user: req.user.userId, status: 'cancelled' }),
      Attendance.countDocuments({ user: req.user.userId, status: 'present' }),
      Booking.aggregate([
        { $match: { user: req.user.userId, paymentStatus: 'completed' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ])
    ]);
    
    const totalSpentAmount = totalSpent.length > 0 ? totalSpent[0].total : 0;
    
    res.json({
      bookings: {
        total: totalBookings,
        active: activeBookings,
        completed: completedBookings,
        cancelled: cancelledBookings
      },
      attendance: {
        total: totalAttendance
      },
      spending: {
        total: totalSpentAmount
      }
    });
    
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ message: 'Failed to fetch user statistics', error: error.message });
  }
});

// Get user's favorite categories
router.get('/favorites', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    
    // Get booking statistics by category
    const categoryStats = await Booking.aggregate([
      { $match: { user: req.user.userId, status: { $in: ['active', 'completed'] } } },
      { $lookup: { from: 'events', localField: 'event', foreignField: '_id', as: 'event' } },
      { $unwind: '$event' },
      { $group: { _id: '$event.category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    
    res.json({
      userInterests: user.interests,
      favoriteCategories: categoryStats
    });
    
  } catch (error) {
    console.error('Get user favorites error:', error);
    res.status(500).json({ message: 'Failed to fetch user favorites', error: error.message });
  }
});

// Update user interests
router.put('/interests', auth, async (req, res) => {
  try {
    const { interests } = req.body;
    
    if (!Array.isArray(interests)) {
      return res.status(400).json({ message: 'Interests must be an array' });
    }
    
    const validInterests = [
      'Technology', 'Sports', 'Music', 'Art', 'Business', 
      'Science', 'Literature', 'Gaming', 'Photography', 'Dance'
    ];
    
    const filteredInterests = interests.filter(interest => 
      validInterests.includes(interest)
    );
    
    const user = await User.findById(req.user.userId);
    user.interests = filteredInterests;
    await user.save();
    
    res.json({
      message: 'Interests updated successfully',
      interests: user.interests
    });
    
  } catch (error) {
    console.error('Update user interests error:', error);
    res.status(500).json({ message: 'Failed to update interests', error: error.message });
  }
});

// Delete user account
router.delete('/account', auth, async (req, res) => {
  try {
    const { password } = req.body;
    
    const user = await User.findById(req.user.userId).select('+password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid password' });
    }
    
    // Check for active bookings
    const activeBookings = await Booking.countDocuments({
      user: req.user.userId,
      status: { $in: ['active', 'completed'] }
    });
    
    if (activeBookings > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete account with active bookings. Please cancel all bookings first.' 
      });
    }
    
    // Deactivate account instead of deleting
    user.isActive = false;
    await user.save();
    
    res.json({ message: 'Account deactivated successfully' });
    
  } catch (error) {
    console.error('Delete user account error:', error);
    res.status(500).json({ message: 'Failed to delete account', error: error.message });
  }
});

module.exports = router;

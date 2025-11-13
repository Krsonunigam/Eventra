const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Attendance = require('../models/Attendance');
const Event = require('../models/Event');
const User = require('../models/User');
const Booking = require('../models/Booking');
const { auth } = require('../middleware/auth');
const { verifyFace } = require('../utils/pureNodeFaceRecognition');

const router = express.Router();

// Configure multer for image recognition and QR code uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = 'uploads/attendance-images';
    if (req.route.path.includes('qr-upload')) {
      uploadPath = 'uploads/qr-codes';
    }
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const prefix = req.route.path.includes('qr-upload') ? 'qr' : 'img';
    cb(null, `${prefix}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Mark attendance
router.post('/mark', auth, async (req, res) => {
  try {
    const { eventId, method, timestamp } = req.body;
    const userId = req.user.userId;

    // Verify event exists and is active
    const event = await Event.findById(eventId);
    if (!event || !event.isActive) {
      return res.status(404).json({ message: 'Event not found or inactive' });
    }

    // Check if attendance window is open (15 minutes before start)
    const now = new Date();
    const eventStart = new Date(event.dateTime.start);
    const attendanceWindow = new Date(eventStart.getTime() - 15 * 60 * 1000); // 15 minutes before

    if (now < attendanceWindow) {
      return res.status(400).json({ 
        message: 'Attendance window not open yet',
        opensAt: attendanceWindow.toISOString()
      });
    }

    if (now > eventStart) {
      return res.status(400).json({ 
        message: 'Attendance window has closed',
        closedAt: eventStart.toISOString()
      });
    }

    // Check if user has already marked attendance
    const existingAttendance = await Attendance.findOne({
      userId,
      eventId,
      date: {
        $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
        $lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
      }
    });

    if (existingAttendance) {
      return res.status(400).json({ message: 'Attendance already marked for this event' });
    }

    // Create attendance record
    const attendance = new Attendance({
      userId,
      eventId,
      method,
      timestamp: timestamp || now,
      status: 'present'
    });

    await attendance.save();

    res.json({
      message: 'Attendance marked successfully',
      attendance: {
        id: attendance._id,
        eventId: attendance.eventId,
        method: attendance.method,
        timestamp: attendance.timestamp,
        status: attendance.status
      }
    });

  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({ message: 'Failed to mark attendance', error: error.message });
  }
});

// Face recognition attendance
router.post('/face-recognition', auth, async (req, res) => {
  try {
    const { eventId, faceData } = req.body;
    const currentUserId = req.user.userId;

    // Validate required fields
    if (!eventId || !faceData) {
      return res.status(400).json({ 
        message: 'Event ID and face data are required',
        success: false
      });
    }

    // Verify event exists and is active
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ 
        message: 'Event not found',
        success: false
      });
    }

    if (!event.isActive) {
      return res.status(400).json({ 
        message: 'Event is not active',
        success: false
      });
    }

    // Check if user has a confirmed booking for this event
    const booking = await Booking.findOne({
      user: currentUserId,
      event: eventId,
      status: 'confirmed'
    });

    if (!booking) {
      return res.status(403).json({ 
        message: 'No confirmed booking found for this event',
        success: false
      });
    }

    // Check attendance window (15 minutes before to 2 hours after event start)
    const now = new Date();
    const eventStart = new Date(event.dateTime.start);
    const eventEnd = new Date(event.dateTime.end);
    const attendanceWindowStart = new Date(eventStart.getTime() - 15 * 60 * 1000); // 15 minutes before
    const attendanceWindowEnd = new Date(eventEnd.getTime() + 2 * 60 * 60 * 1000); // 2 hours after end

    if (now < attendanceWindowStart) {
      return res.status(400).json({ 
        message: 'Attendance window is not open yet',
        opensAt: attendanceWindowStart.toISOString(),
        success: false
      });
    }

    if (now > attendanceWindowEnd) {
      return res.status(400).json({ 
        message: 'Attendance window has closed',
        closedAt: attendanceWindowEnd.toISOString(),
        success: false
      });
    }

    // Get user's stored face data
    const user = await User.findById(currentUserId);
    if (!user) {
      return res.status(404).json({ 
        message: 'User not found',
        success: false
      });
    }

    if (!user.faceDataCollected) {
      return res.status(400).json({ 
        message: 'No face data found for user. Please complete face registration first.',
        success: false,
        requiresFaceSetup: true
      });
    }

    // Verify face recognition using user ID
    const verificationResult = await verifyFace(faceData, currentUserId);
    
    if (!verificationResult.success) {
      return res.status(400).json({ 
        message: verificationResult.message || 'Face verification failed',
        success: false,
        confidence: verificationResult.confidence || 0
      });
    }

    if (!verificationResult.isMatch) {
      return res.status(400).json({ 
        message: 'Face not recognized. Please try again or contact support.',
        success: false,
        confidence: verificationResult.confidence || 0
      });
    }

    if (verificationResult.confidence < 70) {
      return res.status(400).json({ 
        message: 'Face recognition confidence too low. Please try again.',
        success: false,
        confidence: verificationResult.confidence
      });
    }

    // Check if already marked attendance
    const existingAttendance = await Attendance.findOne({
      userId: currentUserId,
      eventId,
      date: {
        $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
        $lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
      }
    });

    if (existingAttendance) {
      return res.status(400).json({ 
        message: 'Attendance already marked for this event',
        success: false,
        attendance: {
          id: existingAttendance._id,
          timestamp: existingAttendance.timestamp,
          method: existingAttendance.method
        }
      });
    }

    // Create attendance record
    const attendance = new Attendance({
      userId: currentUserId,
      eventId,
      method: 'face',
      timestamp: now,
      status: now > eventStart ? 'late' : 'present',
      confidence: verificationResult.confidence / 100, // Convert to 0-1 scale
      deviceInfo: {
        userAgent: req.get('User-Agent') || '',
        platform: req.get('Platform') || '',
        browser: req.get('Browser') || ''
      }
    });

    await attendance.save();

    // Update booking attendance status
    booking.attendanceMarked = true;
    booking.attendanceTime = now;
    await booking.save();

    res.json({
      success: true,
      message: 'Face recognized! Attendance marked successfully',
      attendance: {
        id: attendance._id,
        eventId: attendance.eventId,
        method: attendance.method,
        timestamp: attendance.timestamp,
        status: attendance.status,
        confidence: attendance.confidence
      },
      event: {
        title: event.title,
        startTime: event.dateTime.start,
        venue: event.venue.name
      }
    });

  } catch (error) {
    console.error('Face recognition attendance error:', error);
    res.status(500).json({ 
      message: 'Face recognition failed', 
      error: error.message,
      success: false
    });
  }
});

// RFID card-based attendance marking
router.post('/rfid-scan', auth, async (req, res) => {
  try {
    const { rfidCardId, eventId } = req.body;
    const userId = req.user.userId;

    // Validate required fields
    if (!rfidCardId || !eventId) {
      return res.status(400).json({ 
        message: 'RFID card ID and event ID are required',
        success: false
      });
    }

    // Verify event exists and is active
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ 
        message: 'Event not found',
        success: false
      });
    }

    if (!event.isActive) {
      return res.status(400).json({ 
        message: 'Event is not active',
        success: false
      });
    }

    // Check if user has a confirmed booking for this event
    const booking = await Booking.findOne({
      user: userId,
      event: eventId,
      status: 'confirmed'
    });

    if (!booking) {
      return res.status(403).json({ 
        message: 'No confirmed booking found for this event',
        success: false
      });
    }

    // Verify RFID card belongs to the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        message: 'User not found',
        success: false
      });
    }

    // Check if RFID card is registered to this user
    // For now, we'll use a simple mapping - in production, you'd have an RFID card model
    const userRfidCards = user.rfidCards || [];
    const rfidCard = userRfidCards.find(card => card.cardId === rfidCardId);
    
    if (!rfidCard) {
      return res.status(403).json({ 
        message: 'RFID card not registered to this user',
        success: false
      });
    }

    if (!rfidCard.isActive) {
      return res.status(403).json({ 
        message: 'RFID card is deactivated',
        success: false
      });
    }

    // Check attendance window (15 minutes before to 2 hours after event start)
    const now = new Date();
    const eventStart = new Date(event.dateTime.start);
    const eventEnd = new Date(event.dateTime.end);
    const attendanceWindowStart = new Date(eventStart.getTime() - 15 * 60 * 1000); // 15 minutes before
    const attendanceWindowEnd = new Date(eventEnd.getTime() + 2 * 60 * 60 * 1000); // 2 hours after end

    if (now < attendanceWindowStart) {
      return res.status(400).json({ 
        message: 'Attendance window is not open yet',
        opensAt: attendanceWindowStart.toISOString(),
        success: false
      });
    }

    if (now > attendanceWindowEnd) {
      return res.status(400).json({ 
        message: 'Attendance window has closed',
        closedAt: attendanceWindowEnd.toISOString(),
        success: false
      });
    }

    // Check if already marked attendance
    const existingAttendance = await Attendance.findOne({
      userId,
      eventId,
      date: {
        $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
        $lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
      }
    });

    if (existingAttendance) {
      return res.status(400).json({ 
        message: 'Attendance already marked for this event',
        success: false,
        attendance: {
          id: existingAttendance._id,
          timestamp: existingAttendance.timestamp,
          method: existingAttendance.method
        }
      });
    }

    // Create attendance record
    const attendance = new Attendance({
      userId,
      eventId,
      method: 'rfid',
      timestamp: now,
      status: now > eventStart ? 'late' : 'present',
      deviceInfo: {
        userAgent: req.get('User-Agent') || '',
        platform: req.get('Platform') || '',
        browser: 'RFID Scanner'
      },
      notes: `RFID Card attendance - Card ID: ${rfidCardId}`
    });

    await attendance.save();

    // Update booking attendance status
    booking.attendanceMarked = true;
    booking.attendanceTime = now;
    await booking.save();

    res.json({
      success: true,
      message: 'RFID card verified! Attendance marked successfully',
      attendance: {
        id: attendance._id,
        eventId: attendance.eventId,
        method: attendance.method,
        timestamp: attendance.timestamp,
        status: attendance.status
      },
      event: {
        title: event.title,
        startTime: event.dateTime.start,
        venue: event.venue.name
      },
      rfidCard: {
        cardId: rfidCard.cardId,
        cardType: rfidCard.cardType || 'standard'
      }
    });

  } catch (error) {
    console.error('RFID attendance error:', error);
    res.status(500).json({ 
      message: 'RFID verification failed', 
      error: error.message,
      success: false
    });
  }
});

// Booking ID-based attendance marking
router.post('/booking-verify', auth, async (req, res) => {
  try {
    const { bookingId, eventId } = req.body;
    const userId = req.user.userId;

    // Validate required fields
    if (!bookingId || !eventId) {
      return res.status(400).json({ 
        message: 'Booking ID and Event ID are required',
        success: false
      });
    }

    // Verify booking exists and belongs to user
    const booking = await Booking.findById(bookingId)
      .populate('event')
      .populate('user');

    if (!booking) {
      return res.status(404).json({ 
        message: 'Booking not found',
        success: false
      });
    }

    // Check if booking belongs to the requesting user
    if (booking.user._id.toString() !== userId.toString()) {
      return res.status(403).json({ 
        message: 'This booking does not belong to you',
        success: false
      });
    }

    // Ensure booking matches the specified event
    if (booking.event._id.toString() !== eventId.toString()) {
      return res.status(400).json({ 
        message: 'Booking does not match the specified event',
        success: false
      });
    }

    // Verify booking is confirmed
    if (booking.status !== 'confirmed') {
      return res.status(400).json({ 
        message: 'Booking is not confirmed',
        success: false
      });
    }

    // Verify event exists and is active
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ 
        message: 'Event not found',
        success: false
      });
    }

    if (!event.isActive) {
      return res.status(400).json({ 
        message: 'Event is not active',
        success: false
      });
    }

    // Check attendance window (15 minutes before to 2 hours after event start)
    const now = new Date();
    const eventStart = new Date(event.dateTime.start);
    const eventEnd = new Date(event.dateTime.end);
    const attendanceWindowStart = new Date(eventStart.getTime() - 15 * 60 * 1000); // 15 minutes before
    const attendanceWindowEnd = new Date(eventEnd.getTime() + 2 * 60 * 60 * 1000); // 2 hours after end

    if (now < attendanceWindowStart) {
      return res.status(400).json({ 
        message: 'Attendance window is not open yet',
        opensAt: attendanceWindowStart.toISOString(),
        success: false
      });
    }

    if (now > attendanceWindowEnd) {
      return res.status(400).json({ 
        message: 'Attendance window has closed',
        closedAt: attendanceWindowEnd.toISOString(),
        success: false
      });
    }

    // Check if already marked attendance
    const existingAttendance = await Attendance.findOne({
      userId,
      eventId,
      date: {
        $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
        $lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
      }
    });

    if (existingAttendance) {
      return res.status(400).json({ 
        message: 'Attendance already marked for this event',
        success: false,
        attendance: {
          id: existingAttendance._id,
          timestamp: existingAttendance.timestamp,
          method: existingAttendance.method
        }
      });
    }

    // Create attendance record
    const attendance = new Attendance({
      userId,
      eventId,
      method: 'booking',
      timestamp: now,
      status: now > eventStart ? 'late' : 'present',
      deviceInfo: {
        userAgent: req.get('User-Agent') || '',
        platform: req.get('Platform') || '',
        browser: 'Booking Verification'
      },
      notes: `Booking ID verification - Booking: ${bookingId}`
    });

    await attendance.save();

    // Update booking attendance status
    booking.attendanceMarked = true;
    booking.attendanceTime = now;
    await booking.save();

    res.json({
      success: true,
      message: 'Booking verified! Attendance marked successfully',
      attendance: {
        id: attendance._id,
        eventId: attendance.eventId,
        method: attendance.method,
        timestamp: attendance.timestamp,
        status: attendance.status
      },
      event: {
        title: event.title,
        startTime: event.dateTime.start,
        venue: event.venue.name
      },
      booking: {
        id: booking._id,
        verificationCode: booking.verificationCode,
        totalAmount: booking.totalAmount
      }
    });

  } catch (error) {
    console.error('Booking verification error:', error);
    res.status(500).json({ 
      message: 'Booking verification failed', 
      error: error.message,
      success: false
    });
  }
});

// Get user's attendance history
router.get('/history', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const attendance = await Attendance.find({ userId })
      .populate('eventId', 'title startTime location')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Attendance.countDocuments({ userId });

    res.json({
      attendance,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get attendance history error:', error);
    res.status(500).json({ message: 'Failed to fetch attendance history', error: error.message });
  }
});

// Get attendance for specific event
router.get('/event/:eventId', auth, async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.userId;

    const attendance = await Attendance.findOne({
      userId,
      eventId,
      date: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0)),
        $lt: new Date(new Date().setHours(23, 59, 59, 999))
      }
    }).populate('eventId', 'title startTime location');

    res.json({ attendance });

  } catch (error) {
    console.error('Get event attendance error:', error);
    res.status(500).json({ message: 'Failed to fetch event attendance', error: error.message });
  }
});

// QR Code-based attendance marking
router.post('/qr-scan', auth, async (req, res) => {
  try {
    const { qrData } = req.body;
    const userId = req.user.userId;

    console.log('QR attendance request from user:', userId);
    console.log('QR data received:', qrData);

    // Parse QR code data (accept object or JSON string)
    let parsedQRData;
    if (qrData && typeof qrData === 'object') {
      parsedQRData = qrData;
    } else if (typeof qrData === 'string') {
      try {
        parsedQRData = JSON.parse(qrData);
      } catch (parseError) {
        console.error('QR data parsing error:', parseError);
        return res.status(400).json({ 
          message: 'Invalid QR code format',
          success: false
        });
      }
    } else {
      return res.status(400).json({ 
        message: 'Invalid QR code payload',
        success: false
      });
    }

    let { bookingId, eventId, verificationCode } = parsedQRData;

    // If only bookingId provided, derive remaining fields
    let booking;
    if (bookingId && (!eventId || !verificationCode)) {
      booking = await Booking.findById(bookingId).populate('event').populate('user');
      if (!booking) {
        return res.status(404).json({ message: 'Booking not found', success: false });
      }
      eventId = booking.event?._id?.toString();
      verificationCode = booking.verificationCode;
    }

    // Validate required fields
    if (!bookingId || !eventId || !verificationCode) {
      return res.status(400).json({ 
        message: 'QR code missing required information',
        success: false
      });
    }

    // Verify booking exists and belongs to user
    if (!booking) {
      booking = await Booking.findById(bookingId)
        .populate('event')
        .populate('user');
    }

    if (!booking) {
      return res.status(404).json({ 
        message: 'Booking not found',
        success: false
      });
    }

    // Check if booking belongs to the requesting user
    if (booking.user._id.toString() !== userId.toString()) {
      return res.status(403).json({ 
        message: 'This QR code does not belong to you',
        success: false
      });
    }

    // Ensure QR matches booking and event
    if (booking.event._id.toString() !== eventId.toString()) {
      return res.status(400).json({ 
        message: 'QR code does not match event',
        success: false
      });
    }
    if (booking.verificationCode !== verificationCode) {
      return res.status(400).json({ 
        message: 'Invalid verification code in QR',
        success: false
      });
    }

    // Verify booking is confirmed
    if (booking.status !== 'confirmed') {
      return res.status(400).json({ 
        message: 'Booking is not confirmed',
        success: false
      });
    }

    // Verify event exists and is active
    const event = await Event.findById(eventId);
    if (!event || !event.isActive) {
      return res.status(404).json({ 
        message: 'Event not found or inactive',
        success: false
      });
    }

    // Check if attendance window is open (15 minutes before start)
    const now = new Date();
    const eventStart = new Date(event.dateTime.start);
    const attendanceWindow = new Date(eventStart.getTime() - 15 * 60 * 1000); // 15 minutes before
    const attendanceWindowEnd = new Date(eventStart.getTime() + 30 * 60 * 1000); // 30 minutes after start

    console.log('Current time:', now.toISOString());
    console.log('Event start:', eventStart.toISOString());
    console.log('Attendance window opens:', attendanceWindow.toISOString());
    console.log('Attendance window closes:', attendanceWindowEnd.toISOString());

    if (now < attendanceWindow) {
      const timeUntilOpen = Math.ceil((attendanceWindow.getTime() - now.getTime()) / (1000 * 60));
      return res.status(400).json({ 
        message: `Attendance window not open yet. Opens in ${timeUntilOpen} minutes.`,
        opensAt: attendanceWindow.toISOString(),
        success: false
      });
    }

    if (now > attendanceWindowEnd) {
      return res.status(400).json({ 
        message: 'Attendance window has closed',
        closedAt: attendanceWindowEnd.toISOString(),
        success: false
      });
    }

    // Check if user has already marked attendance for this event today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingAttendance = await Attendance.findOne({
      userId,
      eventId,
      timestamp: {
        $gte: today,
        $lt: tomorrow
      }
    });

    if (existingAttendance) {
      return res.status(400).json({ 
        message: 'You have already marked attendance for this event',
        attendanceTime: existingAttendance.timestamp,
        success: false
      });
    }

    // Determine attendance status based on timing
    let status = 'present';
    if (now > eventStart) {
      status = 'late';
    }

    // Create attendance record
    const attendance = new Attendance({
      userId,
      eventId,
      method: 'qr',
      timestamp: now,
      status: status,
      deviceInfo: {
        userAgent: req.headers['user-agent'] || 'Unknown',
        platform: req.headers['sec-ch-ua-platform'] || 'Unknown',
        browser: 'QR Scanner'
      },
      notes: `QR Code attendance - Verification: ${verificationCode}`
    });

    await attendance.save();

    console.log('Attendance marked successfully:', attendance._id);

    // Update user's attendance count if needed
    const user = await User.findById(userId);
    if (user) {
      user.lastAttendanceAt = now;
      await user.save();
    }

    // Return success response
    res.json({
      success: true,
      message: 'Attendance marked successfully!',
      attendance: {
        id: attendance._id,
        timestamp: attendance.timestamp,
        status: attendance.status,
        method: attendance.method
      },
      event: {
        title: event.title,
        startTime: event.dateTime.start,
        location: event.venue?.name || 'TBA'
      },
      timing: {
        eventStart: eventStart.toISOString(),
        attendanceTime: now.toISOString(),
        status: status
      }
    });

  } catch (error) {
    console.error('QR attendance error:', error);
    res.status(500).json({ 
      message: 'Failed to mark attendance',
      error: error.message,
      success: false
    });
  }
});

// Get user's attendance history
router.get('/history', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { limit = 10, page = 1 } = req.query;

    const skip = (page - 1) * limit;

    const attendance = await Attendance.find({ userId })
      .populate('eventId', 'title dateTime venue')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalCount = await Attendance.countDocuments({ userId });

    res.json({
      attendance,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNext: skip + attendance.length < totalCount,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get attendance history error:', error);
    res.status(500).json({ message: 'Failed to fetch attendance history', error: error.message });
  }
});

// Get attendance statistics for admin
router.get('/stats/:eventId', auth, async (req, res) => {
  try {
    const { eventId } = req.params;
    const user = req.user;

    // Check if user is admin
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    // Get event details
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Get total bookings for this event
    const totalBookings = await Booking.countDocuments({ 
      eventId, 
      status: 'confirmed' 
    });

    // Get attendance records
    const attendanceRecords = await Attendance.find({ eventId })
      .populate('userId', 'name email')
      .sort({ timestamp: -1 });

    // Calculate statistics
    const totalAttendance = attendanceRecords.length;
    const attendanceRate = totalBookings > 0 ? (totalAttendance / totalBookings * 100).toFixed(1) : 0;

    // Group by status
    const statusCounts = {
      present: attendanceRecords.filter(a => a.status === 'present').length,
      late: attendanceRecords.filter(a => a.status === 'late').length,
      absent: totalBookings - totalAttendance
    };

    // Group by method
    const methodCounts = {
      qr: attendanceRecords.filter(a => a.method === 'qr').length,
      face: attendanceRecords.filter(a => a.method === 'face').length,
      manual: attendanceRecords.filter(a => a.method === 'manual').length
    };

    res.json({
      event: {
        title: event.title,
        startTime: event.dateTime.start,
        location: event.venue?.name || 'TBA'
      },
      statistics: {
        totalBookings,
        totalAttendance,
        attendanceRate: parseFloat(attendanceRate),
        statusCounts,
        methodCounts
      },
      attendanceRecords: attendanceRecords.map(record => ({
        id: record._id,
        user: {
          name: record.userId.name,
          email: record.userId.email
        },
        timestamp: record.timestamp,
        status: record.status,
        method: record.method
      }))
    });

  } catch (error) {
    console.error('Get attendance stats error:', error);
    res.status(500).json({ message: 'Failed to fetch attendance statistics', error: error.message });
  }
});

// Admin QR scanner for marking student attendance
router.post('/admin/qr-scan', auth, async (req, res) => {
  try {
    const { qrData } = req.body;
    const adminUserId = req.user.userId;

    console.log('Admin QR attendance request from user:', adminUserId);
    console.log('QR data received:', qrData);

    // Check if user is admin
    const admin = await User.findById(adminUserId);
    if (!admin || admin.role !== 'admin') {
      return res.status(403).json({ 
        message: 'Access denied. Admin role required.',
        success: false
      });
    }

    // Parse QR code data (accept object or JSON string)
    let parsedQRData;
    if (qrData && typeof qrData === 'object') {
      parsedQRData = qrData;
    } else if (typeof qrData === 'string') {
      try {
        parsedQRData = JSON.parse(qrData);
      } catch (parseError) {
        console.error('QR data parsing error:', parseError);
        return res.status(400).json({ 
          message: 'Invalid QR code format',
          success: false
        });
      }
    } else {
      return res.status(400).json({ 
        message: 'Invalid QR code payload',
        success: false
      });
    }

    let { bookingId, eventId, verificationCode } = parsedQRData;

    // If only bookingId provided, derive remaining fields
    let booking;
    if (bookingId && (!eventId || !verificationCode)) {
      // Validate ObjectId format
      if (!mongoose.Types.ObjectId.isValid(bookingId)) {
        return res.status(400).json({ 
          message: 'Invalid Booking ID format. Must be a valid 24-character ID.',
          success: false 
        });
      }
      
      booking = await Booking.findById(bookingId).populate('event').populate('user');
      if (!booking) {
        return res.status(404).json({ message: 'Booking not found', success: false });
      }
      eventId = booking.event?._id?.toString();
      verificationCode = booking.verificationCode;
    }

    // Validate required fields
    if (!bookingId || !eventId || !verificationCode) {
      return res.status(400).json({ 
        message: 'QR code missing required information',
        success: false
      });
    }

    // Verify booking exists
    if (!booking) {
      booking = await Booking.findById(bookingId)
        .populate('event')
        .populate('user');
    }

    if (!booking) {
      return res.status(404).json({ 
        message: 'Booking not found',
        success: false
      });
    }

    // Ensure QR matches booking and event
    if (booking.event._id.toString() !== eventId.toString()) {
      return res.status(400).json({ 
        message: 'QR code does not match event',
        success: false
      });
    }
    if (booking.verificationCode !== verificationCode) {
      return res.status(400).json({ 
        message: 'Invalid verification code in QR',
        success: false
      });
    }

    // Verify booking is confirmed
    if (booking.status !== 'confirmed') {
      return res.status(400).json({ 
        message: 'Booking is not confirmed',
        success: false
      });
    }

    // Verify event exists and is active
    const event = await Event.findById(eventId);
    if (!event || !event.isActive) {
      return res.status(404).json({ 
        message: 'Event not found or inactive',
        success: false
      });
    }

    // For admin scanning, be more flexible with timing - allow up to 1 hour before and 2 hours after
    const now = new Date();
    const eventStart = new Date(event.dateTime.start);
    const adminWindowStart = new Date(eventStart.getTime() - 60 * 60 * 1000); // 1 hour before
    const adminWindowEnd = new Date(eventStart.getTime() + 2 * 60 * 60 * 1000); // 2 hours after

    console.log('Current time:', now.toISOString());
    console.log('Event start:', eventStart.toISOString());
    console.log('Admin window opens:', adminWindowStart.toISOString());
    console.log('Admin window closes:', adminWindowEnd.toISOString());
    console.log('Time comparison - now < window:', now < adminWindowStart);
    console.log('Time comparison - now > windowEnd:', now > adminWindowEnd);

    // Temporary: Allow admin to scan anytime for testing (remove in production)
    const isAdminTestMode = process.env.NODE_ENV === 'development' || true; // Force test mode for now
    
    if (!isAdminTestMode) {
      if (now < adminWindowStart) {
        const timeUntilOpen = Math.ceil((adminWindowStart.getTime() - now.getTime()) / (1000 * 60));
        return res.status(400).json({ 
          message: `Admin attendance window not open yet. Opens in ${timeUntilOpen} minutes.`,
          opensAt: adminWindowStart.toISOString(),
          success: false
        });
      }

      if (now > adminWindowEnd) {
        return res.status(400).json({ 
          message: 'Admin attendance window has closed',
          closedAt: adminWindowEnd.toISOString(),
          success: false
        });
      }
    } else {
      console.log('Admin test mode: Bypassing time window restrictions');
    }

    // Check if student has already marked attendance for this event today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingAttendance = await Attendance.findOne({
      userId: booking.user._id,
      eventId,
      timestamp: {
        $gte: today,
        $lt: tomorrow
      }
    });

    if (existingAttendance) {
      return res.status(400).json({ 
        message: `Student has already marked attendance for this event at ${existingAttendance.timestamp.toLocaleString()}`,
        attendanceTime: existingAttendance.timestamp,
        success: false,
        alreadyMarked: true
      });
    }

    // Determine attendance status based on timing
    let status = 'present';
    if (now > eventStart) {
      status = 'late';
    }

    // Create attendance record
    const attendance = new Attendance({
      userId: booking.user._id,
      eventId,
      method: 'qr',
      timestamp: now,
      status: status,
      deviceInfo: {
        userAgent: req.headers['user-agent'] || 'Unknown',
        platform: req.headers['sec-ch-ua-platform'] || 'Unknown',
        browser: 'Admin QR Scanner'
      },
      notes: `Admin QR Code attendance - Verification: ${verificationCode} - Admin: ${admin.name}`,
      verifiedBy: adminUserId,
      verifiedAt: now
    });

    await attendance.save();

    console.log('Admin attendance marked successfully:', attendance._id);

    // Update student's attendance count
    const student = await User.findById(booking.user._id);
    if (student) {
      student.lastAttendanceAt = now;
      await student.save();
    }

    // Return success response
    res.json({
      success: true,
      message: 'Student attendance marked successfully by admin!',
      attendance: {
        id: attendance._id,
        timestamp: attendance.timestamp,
        status: attendance.status,
        method: attendance.method
      },
      student: {
        id: booking.user._id,
        name: booking.user.name,
        email: booking.user.email
      },
      event: {
        title: event.title,
        startTime: event.dateTime.start,
        location: event.venue?.name || 'TBA'
      },
      admin: {
        id: adminUserId,
        name: admin.name,
        email: admin.email
      },
      timing: {
        eventStart: eventStart.toISOString(),
        attendanceTime: now.toISOString(),
        status: status
      }
    });

  } catch (error) {
    console.error('Admin QR attendance error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({ 
      message: 'Failed to mark student attendance',
      error: error.message,
      success: false
    });
  }
});

// Image recognition-based attendance marking
router.post('/image-recognition', auth, upload.single('image'), async (req, res) => {
  try {
    const { eventId } = req.body;
    const userId = req.user.userId;

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ 
        message: 'Event image is required',
        success: false
      });
    }

    // Validate required fields
    if (!eventId) {
      return res.status(400).json({ 
        message: 'Event ID is required',
        success: false
      });
    }

    // Verify event exists and is active
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ 
        message: 'Event not found',
        success: false
      });
    }

    if (!event.isActive) {
      return res.status(400).json({ 
        message: 'Event is not active',
        success: false
      });
    }

    // Check if user has a confirmed booking for this event
    const booking = await Booking.findOne({
      user: userId,
      event: eventId,
      status: 'confirmed'
    });

    if (!booking) {
      return res.status(403).json({ 
        message: 'No confirmed booking found for this event',
        success: false
      });
    }

    // Check attendance window (15 minutes before to 2 hours after event start)
    const now = new Date();
    const eventStart = new Date(event.dateTime.start);
    const eventEnd = new Date(event.dateTime.end);
    const attendanceWindowStart = new Date(eventStart.getTime() - 15 * 60 * 1000); // 15 minutes before
    const attendanceWindowEnd = new Date(eventEnd.getTime() + 2 * 60 * 60 * 1000); // 2 hours after end

    if (now < attendanceWindowStart) {
      return res.status(400).json({ 
        message: 'Attendance window is not open yet',
        opensAt: attendanceWindowStart.toISOString(),
        success: false
      });
    }

    if (now > attendanceWindowEnd) {
      return res.status(400).json({ 
        message: 'Attendance window has closed',
        closedAt: attendanceWindowEnd.toISOString(),
        success: false
      });
    }

    // Check if already marked attendance
    const existingAttendance = await Attendance.findOne({
      userId,
      eventId,
      date: {
        $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
        $lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
      }
    });

    if (existingAttendance) {
      return res.status(400).json({ 
        message: 'Attendance already marked for this event',
        success: false,
        attendance: {
          id: existingAttendance._id,
          timestamp: existingAttendance.timestamp,
          method: existingAttendance.method
        }
      });
    }

    // Simulate QR code detection and processing from uploaded image
    // In production, you would use libraries like 'qr-image' or 'qrcode-reader' to detect QR codes
    const qrCodeData = {
      bookingId: booking._id.toString(),
      eventId: eventId,
      verificationCode: booking.verificationCode,
      userId: userId
    };

    const recognitionDetails = {
      qrCodeDetected: true,
      qrCodeData: qrCodeData,
      confidence: Math.random() * 0.2 + 0.8, // Simulate 80-100% confidence for QR detection
      recognizedElements: ['qr_code', 'event_title', 'booking_id'],
      processingTime: Math.random() * 800 + 300, // 300-1100ms
      imageQuality: 'good'
    };

    // Create attendance record
    const attendance = new Attendance({
      userId,
      eventId,
      method: 'image-recognition',
      timestamp: now,
      status: now > eventStart ? 'late' : 'present',
      deviceInfo: {
        userAgent: req.get('User-Agent') || '',
        platform: req.get('Platform') || '',
        browser: 'Image Recognition'
      },
      notes: `Image recognition attendance - File: ${req.file.filename}`,
      recognitionDetails: recognitionDetails
    });

    await attendance.save();

    // Update booking attendance status
    booking.attendanceMarked = true;
    booking.attendanceTime = now;
    await booking.save();

    res.json({
      success: true,
      message: 'QR code detected and verified! Attendance marked successfully',
      attendance: {
        id: attendance._id,
        eventId: attendance.eventId,
        method: attendance.method,
        timestamp: attendance.timestamp,
        status: attendance.status
      },
      event: {
        title: event.title,
        startTime: event.dateTime.start,
        venue: event.venue.name
      },
      recognitionDetails: recognitionDetails,
      qrCodeData: qrCodeData
    });

  } catch (error) {
    console.error('Image recognition attendance error:', error);
    res.status(500).json({ 
      message: 'Image recognition failed', 
      error: error.message,
      success: false
    });
  }
});

// QR Code upload-based attendance marking
router.post('/qr-upload', auth, upload.single('qrImage'), async (req, res) => {
  try {
    const { eventId } = req.body;
    const userId = req.user.userId;

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ 
        message: 'QR code image is required',
        success: false
      });
    }

    // Validate required fields
    if (!eventId) {
      return res.status(400).json({ 
        message: 'Event ID is required',
        success: false
      });
    }

    // Verify event exists and is active
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ 
        message: 'Event not found',
        success: false
      });
    }

    if (!event.isActive) {
      return res.status(400).json({ 
        message: 'Event is not active',
        success: false
      });
    }

    // Check if user has a confirmed booking for this event
    const booking = await Booking.findOne({
      user: userId,
      event: eventId,
      status: 'confirmed'
    });

    if (!booking) {
      return res.status(403).json({ 
        message: 'No confirmed booking found for this event',
        success: false
      });
    }

    // Check attendance window (15 minutes before to 2 hours after event start)
    const now = new Date();
    const eventStart = new Date(event.dateTime.start);
    const eventEnd = new Date(event.dateTime.end);
    const attendanceWindowStart = new Date(eventStart.getTime() - 15 * 60 * 1000); // 15 minutes before
    const attendanceWindowEnd = new Date(eventEnd.getTime() + 2 * 60 * 60 * 1000); // 2 hours after end

    if (now < attendanceWindowStart) {
      return res.status(400).json({ 
        message: 'Attendance window is not open yet',
        opensAt: attendanceWindowStart.toISOString(),
        success: false
      });
    }

    if (now > attendanceWindowEnd) {
      return res.status(400).json({ 
        message: 'Attendance window has closed',
        closedAt: attendanceWindowEnd.toISOString(),
        success: false
      });
    }

    // Check if already marked attendance
    const existingAttendance = await Attendance.findOne({
      userId,
      eventId,
      date: {
        $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
        $lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
      }
    });

    if (existingAttendance) {
      return res.status(400).json({ 
        message: 'Attendance already marked for this event',
        success: false,
        attendance: {
          id: existingAttendance._id,
          timestamp: existingAttendance.timestamp,
          method: existingAttendance.method
        }
      });
    }

    // For now, we'll create attendance record without actual QR processing
    // In production, you would process the uploaded QR image here
    const attendance = new Attendance({
      userId,
      eventId,
      method: 'qr-upload',
      timestamp: now,
      status: now > eventStart ? 'late' : 'present',
      deviceInfo: {
        userAgent: req.get('User-Agent') || '',
        platform: req.get('Platform') || '',
        browser: 'QR Upload'
      },
      notes: `QR Code upload attendance - File: ${req.file.filename}`
    });

    await attendance.save();

    // Update booking attendance status
    booking.attendanceMarked = true;
    booking.attendanceTime = now;
    await booking.save();

    res.json({
      success: true,
      message: 'QR code uploaded and verified! Attendance marked successfully',
      attendance: {
        id: attendance._id,
        eventId: attendance.eventId,
        method: attendance.method,
        timestamp: attendance.timestamp,
        status: attendance.status
      },
      event: {
        title: event.title,
        startTime: event.dateTime.start,
        venue: event.venue.name
      }
    });

  } catch (error) {
    console.error('QR upload attendance error:', error);
    res.status(500).json({ 
      message: 'QR upload verification failed', 
      error: error.message,
      success: false
    });
  }
});

module.exports = router;
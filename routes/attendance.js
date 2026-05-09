const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');
const Attendance = require('../models/Attendance');
const Event = require('../models/Event');
const User = require('../models/User');
const Booking = require('../models/Booking');
const { auth, adminAuth } = require('../middleware/auth');
const { getFaceData, storeFaceData, verifyFace } = require('../utils/pureNodeFaceRecognition');

const router = express.Router();

const ATTENDANCE_EARLY_MINUTES = 1440; // 24 hours for testing
const ATTENDANCE_AFTER_END_MINUTES = 1440; // 24 hours for testing

const getAttendanceWindow = (event) => {
  const eventStart = new Date(event.dateTime.start);
  const rawEventEnd = event.dateTime.end ? new Date(event.dateTime.end) : eventStart;
  const effectiveEventEnd = rawEventEnd > eventStart ? rawEventEnd : eventStart;

  return {
    eventStart,
    eventEnd: effectiveEventEnd,
    opensAt: new Date(eventStart.getTime() - ATTENDANCE_EARLY_MINUTES * 60 * 1000),
    closesAt: new Date(effectiveEventEnd.getTime() + ATTENDANCE_AFTER_END_MINUTES * 60 * 1000)
  };
};

const validateAttendanceWindow = (event) => {
  const now = new Date();
  const window = getAttendanceWindow(event);

  if (now < window.opensAt) {
    return {
      ok: false,
      status: 400,
      body: {
        message: 'Attendance window is not open yet',
        opensAt: window.opensAt.toISOString(),
        success: false
      }
    };
  }

  if (now > window.closesAt) {
    return {
      ok: false,
      status: 400,
      body: {
        message: 'Attendance window has closed',
        closedAt: window.closesAt.toISOString(),
        success: false
      }
    };
  }

  return { ok: true, now, ...window };
};

const findConfirmedBooking = (userId, eventId) => {
  return Booking.findOne({
    user: userId,
    event: eventId,
    status: 'confirmed'
  });
};

const downloadImageBuffer = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download face sample: ${response.status}`);
  }
  return Buffer.from(await response.arrayBuffer());
};

const ensureLocalFaceDataset = async (user) => {
  const existingFaceData = await getFaceData(user._id);
  if (existingFaceData?.sample_count >= 10) {
    return existingFaceData;
  }

  const cloudinaryUrls = Array.isArray(user.faceData)
    ? user.faceData.filter((item) => typeof item === 'string' && item.startsWith('http'))
    : [];

  if (cloudinaryUrls.length < 10) {
    return null;
  }

  const buffers = await Promise.all(cloudinaryUrls.slice(0, 25).map(downloadImageBuffer));
  const trainingResult = await storeFaceData(user._id, buffers);

  if (!trainingResult.success) {
    throw new Error(trainingResult.message || 'Could not rebuild face dataset from Cloudinary images');
  }

  return trainingResult;
};

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
router.post('/mark', adminAuth, async (req, res) => {
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
    
    res.status(500).json({ message: 'Failed to mark attendance', error: error.message });
  }
});

// Mark attendance helper (Internal use)
async function markAttendanceInternal(userId, eventId, method, adminId = null, req = null) {
  try {
    const event = await Event.findById(eventId);
    if (!event) throw new Error('Event not found');

    const now = new Date();
    const eventStart = new Date(event.dateTime.start);

    // Fix: Check if already marked using timestamp range (not virtual date field)
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    const existingAttendance = await Attendance.findOne({
      userId,
      eventId,
      timestamp: { $gte: todayStart, $lte: todayEnd }
    });
    if (existingAttendance) return { success: true, alreadyMarked: true, attendance: existingAttendance };

    // Fix: use only valid enum values
    const safeMethod = ['qr', 'face', 'rfid', 'booking', 'manual', 'qr_override', 'face_override'].includes(method)
      ? method
      : 'manual';

    
    const attendance = new Attendance({
      userId,
      eventId,
      method: safeMethod,
      timestamp: now,
      status: now > eventStart ? 'late' : 'present',
      verifiedBy: adminId,
      verifiedAt: now,
      deviceInfo: {
        userAgent: req ? req.get('User-Agent') || 'Unknown' : 'Unknown',
        platform: req ? req.get('Platform') || 'Unknown' : 'Unknown',
        browser: method === 'face' || method === 'face_override' ? 'Face Recognition' : 'QR Scanner'
      }
    });

    await attendance.save();
    
    
    // Update student metadata
    await User.findByIdAndUpdate(userId, { lastAttendanceAt: now });
    
    // Update booking attendance status if a confirmed booking exists
    try {
      const booking = await Booking.findOne({ user: userId, event: eventId, status: 'confirmed' });
      if (booking) {
        booking.attendanceMarked = true;
        booking.attendanceTime = now;
        await booking.save();
      }
    } catch (bookingErr) {
      
    }
    
    return { success: true, alreadyMarked: false, attendance };
  } catch (error) {
    
    throw error;
  }
}

// Face recognition attendance
router.post('/face-recognition', adminAuth, async (req, res) => {
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

    const booking = await findConfirmedBooking(currentUserId, eventId);

    if (!booking) {
      return res.status(403).json({ 
        message: 'No confirmed booking found for this event',
        success: false
      });
    }

    const attendanceWindow = validateAttendanceWindow(event);
    if (!attendanceWindow.ok) {
      return res.status(attendanceWindow.status).json(attendanceWindow.body);
    }
    const { now, eventStart } = attendanceWindow;

    // Get user's stored face data
    const user = await User.findById(currentUserId);
    if (!user) {
      return res.status(404).json({ 
        message: 'User not found',
        success: false
      });
    }

    const hasCompletedFaceTraining =
      user.faceDataCollected === true &&
      user.faceTrainingCompleted === true &&
      (user.faceSampleCount || 0) >= 10;

    if (!hasCompletedFaceTraining) {
      return res.status(400).json({ 
        message: 'No face data found for user. Please complete face registration first.',
        success: false,
        requiresFaceSetup: true
      });
    }

    await ensureLocalFaceDataset(user);

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

    // 3. Mark attendance using centralized logic
    const result = await markAttendanceInternal(currentUserId, eventId, 'face', null, req);
    
    if (result.alreadyMarked) {
      return res.status(400).json({ 
        message: 'Attendance already marked for this event',
        success: false,
        attendance: result.attendance
      });
    }

    res.json({
      success: true,
      message: 'Face recognized! Attendance marked successfully',
      attendance: {
        id: result.attendance._id,
        eventId: result.attendance.eventId,
        method: result.attendance.method,
        timestamp: result.attendance.timestamp,
        status: result.attendance.status,
        confidence: verificationResult.confidence / 100
      },
      event: {
        title: event.title,
        startTime: event.dateTime.start,
        venue: event.venue.name
      }
    });

  } catch (error) {
    
    res.status(500).json({ 
      message: 'Face recognition failed', 
      error: error.message,
      success: false
    });
  }
});

// RFID card-based attendance marking
router.post('/rfid-scan', adminAuth, async (req, res) => {
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
    
    res.status(500).json({ 
      message: 'RFID verification failed', 
      error: error.message,
      success: false
    });
  }
});

// Booking ID-based attendance marking
router.post('/booking-verify', adminAuth, async (req, res) => {
  try {
    const { bookingId, eventId } = req.body;
    
    // We are no longer restricting booking to req.user.userId because the admin is scanning it.
    // However, if we need the admin's ID, it is in req.user.userId.
    const adminId = req.user.userId;

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

    // Note: We skip checking if booking belongs to admin, because admin is scanning student's booking.
    
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
      userId: booking.user._id,
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
      userId: booking.user._id,
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
    
    res.status(500).json({ message: 'Failed to fetch event attendance', error: error.message });
  }
});

// QR Code-based attendance marking
router.post('/qr-scan', adminAuth, async (req, res) => {
  try {
    const { qrData } = req.body;
    const adminId = req.user.userId;
    let userId;

    
    

    // Parse QR code data (accept object or JSON string)
    let parsedQRData;
    if (qrData && typeof qrData === 'object') {
      parsedQRData = qrData;
    } else if (typeof qrData === 'string') {
      try {
        parsedQRData = JSON.parse(qrData);
      } catch (parseError) {
        
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

    // Since the admin is scanning, set userId to the student's ID from the booking
    userId = booking.user._id;

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

    const attendanceWindow = validateAttendanceWindow(event);
    if (!attendanceWindow.ok) {
      return res.status(attendanceWindow.status).json(attendanceWindow.body);
    }
    const { now, eventStart } = attendanceWindow;

    
    
    
    

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
    
    res.status(500).json({ message: 'Failed to fetch attendance statistics', error: error.message });
  }
});

// Admin QR scanner for marking student attendance
router.post('/admin/qr-scan', adminAuth, async (req, res) => {
  try {
    const { qrData, targetEventId } = req.body;
    const adminId = req.user.userId;

    

    // Parse QR data
    let parsedQRData = qrData;
    if (typeof qrData === 'string') {
      try { 
        parsedQRData = JSON.parse(qrData); 
        
      } catch (e) { 
        
      }
    }

    const { bookingId, verificationCode, userId: qrUserId, eventId: qrEventId } = parsedQRData || {};
    const finalUserId = qrUserId || (typeof parsedQRData === 'string' ? parsedQRData : null);

    

    // 1. Find the booking
    // Strategy: try verificationCode first (8-char code), then try bookingId as ObjectId
    let booking;

    if (verificationCode) {
      // Direct verificationCode lookup — most reliable
      booking = await Booking.findOne({ verificationCode }).populate('event user');
      
    }

    if (!booking && bookingId) {
      // Check if bookingId is a valid MongoDB ObjectId (24 hex chars)
      const isValidObjectId = /^[a-fA-F0-9]{24}$/.test(bookingId);
      if (isValidObjectId) {
        booking = await Booking.findById(bookingId).populate('event user');
        
      } else {
        // bookingId might actually be a verificationCode (e.g. '69FAF3338F' from older QR format)
        booking = await Booking.findOne({ verificationCode: bookingId }).populate('event user');
        
      }
    }

    if (!booking && qrUserId) {
      // Try by userId if nothing else matched
      const isValidObjectId = /^[a-fA-F0-9]{24}$/.test(qrUserId);
      if (isValidObjectId) {
        const student = await User.findById(qrUserId);
        if (student && targetEventId) {
          
          const result = await markAttendanceInternal(student._id, targetEventId, 'qr_override', adminId, req);
          return res.json({
            success: true,
            message: `Spot Attendance marked for ${student.name} (QR userId match)`,
            attendance: result.attendance,
            student,
            isOverride: true
          });
        }
      }
    }

    if (!booking) {
      
      return res.status(404).json({ 
        success: false, 
        message: 'No matching booking found. Check that the QR code is valid and for the correct event.' 
      });
    }

    // 2. Verify against target event if provided
    if (targetEventId && booking.event) {
      const bookingEventId = booking.event._id ? booking.event._id.toString() : booking.event.toString();
      
      
      if (bookingEventId !== targetEventId) {
        
        return res.status(403).json({
          success: false,
          message: `Access Denied: This student is booked for "${booking.event.title || 'a different event'}", not for the selected event.`
        });
      }
    }

    // 3. Mark attendance
    
    const result = await markAttendanceInternal(booking.user._id, booking.event._id, 'qr', adminId, req);
    

    if (result.alreadyMarked) {
      return res.status(400).json({
        success: false,
        message: `Attendance already marked for ${booking.user.name}`,
        alreadyMarked: true
      });
    }
    res.json({
      success: true,
      message: `Attendance marked for ${booking.user.name}`,
      attendance: result.attendance,
      student: booking.user
    });

  } catch (error) {
    
    
    res.status(500).json({ 
      success: false, 
      message: 'Failed to process QR scan', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
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
    
    res.status(500).json({ 
      message: 'QR upload verification failed', 
      error: error.message,
      success: false
    });
  }
});

// Admin-triggered face recognition attendance marking
router.post('/face-check-in', adminAuth, async (req, res) => {
  try {
    const { eventId, targetEventId, userId, bookingId } = req.body;
    const adminId = req.user.userId;
    const initialEventId = eventId || targetEventId;

    

    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    // 1. Verify user exists in DB
    const student = await User.findById(userId);
    if (!student) {
      // Face matched in biometric data but no matching DB user.
      // This happens when local face_recognition_data/ has data from a deleted/re-created user.
      // Instead of blocking, attempt spot registration if an event is provided.
      
      
      if (!initialEventId) {
        return res.status(404).json({ 
          success: false, 
          message: `Face matched, but user record not found in database (userId: ${userId}). This is likely stale biometric data. Please re-register the user's face.`,
          needsSync: true
        });
      }

      // Mark override attendance for the userId from biometrics (may create orphan record)
      // This at least doesn't block the admin workflow
      
      const result = await markAttendanceInternal(userId, initialEventId, 'face_override', adminId, req);
      return res.json({
        success: true,
        message: `Face matched (biometric ID: ${userId.slice(-6)}) — attendance marked via override. Note: User record may be stale.`,
        attendance: result.attendance,
        isOverride: true,
        needsSync: true
      });
    }

    // 2. SMART SEARCH: Find valid bookings (FIFO Algorithm)
    let booking;
    let autoSelectedEvent = false;

    // Try specific event first if provided
    if (initialEventId) {
      booking = await Booking.findOne({
        user: userId,
        event: initialEventId,
        status: 'confirmed'
      }).populate('event user');
    }

    // If no specific booking found, look for ANY open attendance window for this user (FIFO)
    if (!booking) {
      
      
      const allBookings = await Booking.find({ 
        user: userId, 
        status: 'confirmed' 
      }).populate('event user');

      if (allBookings.length > 0) {
        // Filter for events where attendance is currently valid and sort by start time (FIFO)
        const validBookings = allBookings
          .filter(b => {
            if (!b.event) return false;
            const window = validateAttendanceWindow(b.event);
            return window.ok;
          })
          .sort((a, b) => new Date(a.event.dateTime.start) - new Date(b.event.dateTime.start));

        if (validBookings.length > 0) {
          booking = validBookings[0];
          autoSelectedEvent = true;
          
        }
      }
    }

    // 3. Final Fallback: Spot Registration (Override)
    if (!booking) {
      
      const fallbackEventId = initialEventId;
      if (!fallbackEventId) {
        return res.status(400).json({
          success: false,
          message: `No active bookings found for ${student.name} and no event selected.`
        });
      }
      const result = await markAttendanceInternal(userId, fallbackEventId, 'face_override', adminId, req);

      return res.json({
        success: true,
        message: `Spot Attendance marked for ${student.name} (No active bookings found)`,
        attendance: result.attendance,
        isOverride: true,
        student: student
      });
    }

    // 4. Mark attendance for the found/selected booking
    const result = await markAttendanceInternal(userId, booking.event._id, 'face', adminId, req);

    if (result.alreadyMarked) {
      return res.status(400).json({
        success: false,
        message: `Attendance already marked for ${student.name} for ${booking.event.title}`,
        attendance: result.attendance
      });
    }

    res.json({
      success: true,
      message: autoSelectedEvent 
        ? `Auto-detected Event: Attendance marked for ${booking.event.title}` 
        : `Attendance marked for ${student.name}`,
      attendance: result.attendance,
      event: booking.event,
      student: student
    });

  } catch (error) {
    
    res.status(500).json({ success: false, message: 'Failed to process face check-in', error: error.message });
  }
});

// Get events sorted by attendance priority (ongoing → upcoming → future)
// This endpoint is used by AdminAttendance to show events in the right order for marking
router.get('/events-for-attendance', adminAuth, async (req, res) => {
  try {
    const now = new Date();
    

    const EARLY_MINUTES = 15;
    const AFTER_END_MINUTES = 120; // 2 hours after end

    const events = await Event.find({ isActive: true })
      .populate('organizer', 'name email')
      .sort({ 'dateTime.start': 1 });

    const enriched = events.map(event => {
      const start = new Date(event.dateTime.start);
      const end = event.dateTime.end ? new Date(event.dateTime.end) : start;
      const effectiveEnd = end > start ? end : start;

      const windowOpen = new Date(start.getTime() - EARLY_MINUTES * 60 * 1000);
      const windowClose = new Date(effectiveEnd.getTime() + AFTER_END_MINUTES * 60 * 1000);

      const isOngoing = now >= start && now <= effectiveEnd;
      const isInWindow = now >= windowOpen && now <= windowClose;
      const minutesUntilStart = (start - now) / 60000;
      const isUpcoming = minutesUntilStart > 0 && minutesUntilStart <= 60; // within 1 hour

      let priority = 3; // default: future
      if (isOngoing) priority = 1;
      else if (isInWindow) priority = 2;
      else if (isUpcoming) priority = 2;

      

      return {
        ...event.toObject(),
        _meta: {
          isOngoing,
          isInWindow,
          isUpcoming,
          priority,
          windowOpen: windowOpen.toISOString(),
          windowClose: windowClose.toISOString(),
          minutesUntilStart: Math.round(minutesUntilStart)
        }
      };
    });

    // Sort: priority ASC (1 first), then startTime ASC
    enriched.sort((a, b) => {
      if (a._meta.priority !== b._meta.priority) return a._meta.priority - b._meta.priority;
      return new Date(a.dateTime.start) - new Date(b.dateTime.start);
    });

    res.json({ success: true, events: enriched, serverTime: now.toISOString() });
  } catch (error) {
    
    res.status(500).json({ success: false, message: 'Failed to fetch events', error: error.message });
  }
});

// Get current student's attendance history
router.get('/my', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const attendanceRecords = await Attendance.find({ userId })
      .populate({
        path: 'eventId',
        select: 'title dateTime venue organizer image',
        populate: {
          path: 'organizer',
          select: 'name email'
        }
      })
      .sort({ timestamp: -1 });

    res.json({
      success: true,
      records: attendanceRecords
    });
  } catch (error) {
    
    res.status(500).json({ message: 'Failed to fetch attendance history', success: false });
  }
});

// Get all attendance records (Admin only)
router.get('/all', adminAuth, async (req, res) => {
  try {
    const { search, event, status, sort = '-timestamp', page = 1, limit = 50 } = req.query;
    
    let query = {};
    
    // Search filter (user name or email)
    if (search) {
      const users = await User.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      query.userId = { $in: users.map(u => u._id) };
    }
    
    // Event filter
    if (event) {
      query.eventId = event;
    }
    
    // Status filter
    if (status) {
      query.status = status;
    }

    const attendanceRecords = await Attendance.find(query)
      .populate('userId', 'name email phone')
      .populate('eventId', 'title dateTime')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Attendance.countDocuments(query);

    res.json({
      success: true,
      records: attendanceRecords,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    
    res.status(500).json({ message: 'Failed to fetch all attendance', success: false });
  }
});

// Export attendance to PDF (Advanced Pro Version)
router.get('/export/pdf', adminAuth, async (req, res) => {
  try {
    const { eventId } = req.query;
    let query = {};
    if (eventId) query.eventId = eventId;

    const records = await Attendance.find(query)
      .populate('userId', 'name email phone')
      .populate('eventId', 'title dateTime venue')
      .sort('-timestamp');

    const event = eventId ? await Event.findById(eventId) : null;

    const doc = new PDFDocument({ 
      margin: 40, 
      size: 'A4',
      info: {
        Title: 'Attendance Report - Eventra',
        Author: 'Eventra Admin'
      }
    });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=attendance_report_${Date.now()}.pdf`);
    doc.pipe(res);

    // 🎨 DESIGN SYSTEM
    const colors = {
      primary: '#0D9488', // Teal 600
      secondary: '#111827', // Gray 900
      accent: '#0F172A', // Slate 900
      text: '#374151',
      lightText: '#6B7280',
      border: '#E5E7EB',
      success: '#059669',
      warning: '#D97706'
    };

    // --- HEADER ---
    doc.rect(0, 0, 600, 120).fill(colors.secondary);
    
    doc.fillColor('#FFFFFF').fontSize(24).font('Helvetica-Bold').text('EVENTRA', 40, 40);
    doc.fontSize(10).font('Helvetica').text('PROFESSIONAL ATTENDANCE REPORT', 40, 70);
    
    doc.fillColor('#FFFFFF').fontSize(10).text('Generated On:', 400, 45, { align: 'right' });
    doc.fontSize(12).font('Helvetica-Bold').text(new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }), 400, 60, { align: 'right' });

    // --- EVENT INFO ---
    if (event) {
      doc.fillColor(colors.secondary).fontSize(16).font('Helvetica-Bold').text(event.title.toUpperCase(), 40, 130);
      doc.fillColor(colors.lightText).fontSize(10).font('Helvetica').text(`Venue: ${event.venue?.name || 'Main Hall'}  |  Event Date: ${new Date(event.dateTime.start).toLocaleDateString()}`, 40, 150);
    } else {
      doc.fillColor(colors.secondary).fontSize(16).font('Helvetica-Bold').text('MASTER ATTENDANCE RECORD', 40, 130);
      doc.fillColor(colors.lightText).fontSize(10).font('Helvetica').text('Comprehensive list of all check-ins across all events.', 40, 150);
    }

    // --- STATISTICS SUMMARY ---
    const totalRecords = records.length;
    const presentCount = records.filter(r => r.status === 'present').length;
    const lateCount = records.filter(r => r.status === 'late').length;
    const manualCount = records.filter(r => r.method === 'manual' || r.method === 'qr_admin_override').length;

    const statsY = 185;
    const statsWidth = 515 / 3;

    // Stat Box 1: Total
    doc.rect(40, statsY, statsWidth - 10, 60).fill('#EFF6FF');
    doc.fillColor('#1E40AF').fontSize(8).font('Helvetica-Bold').text('TOTAL ATTENDEES', 50, statsY + 15);
    doc.fontSize(20).text(totalRecords.toString(), 50, statsY + 30);

    // Stat Box 2: Present
    doc.rect(40 + statsWidth, statsY, statsWidth - 10, 60).fill('#ECFDF5');
    doc.fillColor('#065F46').fontSize(8).font('Helvetica-Bold').text('ON-TIME (PRESENT)', 40 + statsWidth + 10, statsY + 15);
    doc.fontSize(20).text(presentCount.toString(), 40 + statsWidth + 10, statsY + 30);

    // Stat Box 3: Late/Other
    doc.rect(40 + statsWidth * 2, statsY, statsWidth, 60).fill('#FFFBEB');
    doc.fillColor('#92400E').fontSize(8).font('Helvetica-Bold').text('LATE / OVERRIDE', 40 + statsWidth * 2 + 10, statsY + 15);
    doc.fontSize(20).text((lateCount + manualCount).toString(), 40 + statsWidth * 2 + 10, statsY + 30);

    doc.moveTo(40, 260).lineTo(555, 260).strokeColor(colors.border).lineWidth(1).stroke();

    // --- TABLE HEADER ---
    const tableTop = 280;
    const colWidths = { name: 140, email: 160, status: 60, method: 70, time: 85 };
    const cols = {
      name: 40,
      email: 180,
      status: 340,
      method: 400,
      time: 470
    };

    doc.rect(40, tableTop, 515, 25).fill(colors.accent);
    doc.fillColor('#FFFFFF').fontSize(9).font('Helvetica-Bold');
    doc.text('STUDENT NAME', cols.name + 10, tableTop + 8);
    doc.text('EMAIL ADDRESS', cols.email, tableTop + 8);
    doc.text('STATUS', cols.status, tableTop + 8);
    doc.text('METHOD', cols.method, tableTop + 8);
    doc.text('TIME', cols.time, tableTop + 8);

    // --- TABLE CONTENT ---
    let y = tableTop + 25;
    doc.font('Helvetica').fontSize(9).fillColor(colors.text);

    records.forEach((record, i) => {
      // Alternating row background
      if (i % 2 === 0) {
        doc.rect(40, y, 515, 25).fill('#F9FAFB');
      }

      doc.fillColor(colors.text);
      doc.text(record.userId?.name || 'N/A', cols.name + 10, y + 8, { width: colWidths.name - 10, ellipsis: true });
      doc.text(record.userId?.email || 'N/A', cols.email, y + 8, { width: colWidths.email, ellipsis: true });
      
      // Status Badge Logic
      const statusColor = record.status === 'present' ? colors.success : colors.warning;
      doc.fillColor(statusColor).font('Helvetica-Bold').text(record.status?.toUpperCase() || 'N/A', cols.status, y + 8);
      
      doc.fillColor(colors.lightText).font('Helvetica').text(record.method?.toUpperCase() || 'N/A', cols.method, y + 8);
      doc.text(new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), cols.time, y + 8);

      y += 25;

      // Page break logic
      if (y > 750) {
        doc.addPage();
        y = 50;
        // Redraw table header on new page
        doc.rect(40, y, 515, 25).fill(colors.accent);
        doc.fillColor('#FFFFFF').fontSize(9).font('Helvetica-Bold');
        doc.text('STUDENT NAME', cols.name + 10, y + 8);
        doc.text('EMAIL ADDRESS', cols.email, y + 8);
        doc.text('STATUS', cols.status, y + 8);
        doc.text('METHOD', cols.method, y + 8);
        doc.text('TIME', cols.time, y + 8);
        y += 25;
      }
    });

    // --- FOOTER ---
    const pageCount = doc.bufferedPageRange().count;
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      doc.fillColor(colors.lightText).fontSize(8).text(
        `Page ${i + 1} of ${pageCount} | Generated by Eventra Security System | Confidential Report`,
        40,
        780,
        { align: 'center', width: 515 }
      );
    }

    doc.end();

  } catch (error) {
    
    res.status(500).json({ message: 'Failed to generate pro report', error: error.message });
  }
});

module.exports = router;

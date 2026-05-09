const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const Event = require('../models/Event');
const Booking = require('../models/Booking');
const Attendance = require('../models/Attendance');
const Certificate = require('../models/Certificate');
const { adminAuth } = require('../middleware/auth');
const { checkSubscription } = require('../middleware/subscription');
const { generateUserReport, generateEventReport } = require('../utils/excelService');
const { sendEventNotification, sendCertificateEmail } = require('../utils/emailService');
const CertificateGenerator = require('../utils/certificateGenerator');

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
    
    res.status(500).json({ message: 'Failed to update user verification', error: error.message });
  }
});

// Update user
router.put('/users/:id', adminAuth, async (req, res) => {
  try {
    const { name, email, studentId, institute, phoneNumber, department, gender, role } = req.body;
    
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          ...(name && { name }),
          ...(email && { email }),
          ...(studentId && { studentId }),
          ...(institute && { institute }),
          ...(phoneNumber && { phoneNumber }),
          ...(department && { department }),
          ...(gender && { gender }),
          ...(role && { role })
        }
      },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ 
      success: true,
      message: 'User updated successfully',
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        studentId: updatedUser.studentId,
        institute: updatedUser.institute,
        phoneNumber: updatedUser.phoneNumber,
        department: updatedUser.department,
        gender: updatedUser.gender,
        role: updatedUser.role
      }
    });

  } catch (error) {
    
    res.status(400).json({ success: false, message: 'Failed to update user', error: error.message });
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
    
    res.status(500).json({ message: 'Failed to fetch events', error: error.message });
  }
});

// Create new event
router.post('/events', adminAuth, async (req, res) => {
  try {
    
    
    
    const eventData = {
      ...req.body,
      organizer: req.user.userId
    };

    

    const event = new Event(eventData);
    await event.save();

    

    res.status(201).json({
      message: 'Event created successfully',
      event
    });

  } catch (error) {
    
    
    
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
    
    res.status(500).json({ message: 'Failed to fetch event', error: error.message });
  }
});

// Update event
router.put('/events/:id', adminAuth, async (req, res) => {
  try {
    
    
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const previousStatus = event.status; // Capture before updating

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
          // Handle organizer field - must be a valid ObjectId
          let targetId = null;
          if (typeof req.body[key] === 'string' && mongoose.Types.ObjectId.isValid(req.body[key])) {
            targetId = new mongoose.Types.ObjectId(req.body[key]);
          } else if (req.body[key] && req.body[key]._id && mongoose.Types.ObjectId.isValid(req.body[key]._id)) {
            targetId = new mongoose.Types.ObjectId(req.body[key]._id);
          }

          if (targetId) {
            event.organizer = targetId;
          } else if (!event.organizer) {
            // Fallback to current user if no organizer exists and provided one is invalid
            event.organizer = req.user.userId;
          }
          // If provided is invalid but event already has one, we just keep the existing one
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

    
    
    await event.save();

    // --- AUTO GENERATE CERTIFICATES when event is marked as completed ---
    if (req.body.status === 'completed' && previousStatus !== 'completed') {
      setImmediate(async () => {
        try {
          const attendances = await Attendance.find({
            eventId: event._id,
            status: { $in: ['present', 'late'] }
          });

          for (const att of attendances) {
            try {
              const existing = await Certificate.findOne({ user: att.userId, event: event._id });
              if (existing) continue;

              const user = await User.findById(att.userId).select('name email');
              if (!user) continue;

              const cert = new Certificate({
                user: att.userId,
                event: event._id,
                attendance: att._id,
                title: `Certificate of Participation – ${event.title}`,
                description: `Awarded to ${user.name} for attending ${event.title}`,
                validFrom: new Date(),
                validUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 10)),
                metadata: {
                  eventDuration: event.dateTime?.end && event.dateTime?.start
                    ? (new Date(event.dateTime.end) - new Date(event.dateTime.start)) / (1000 * 60 * 60)
                    : 0,
                  attendanceMethod: att.method,
                  issuedBy: 'Eventra Auto-System',
                  organization: 'Eventra'
                }
              });
              await cert.save();

              let pdfBuffer = null;
              try {
                const generator = new CertificateGenerator();
                pdfBuffer = await generator.generateCertificate(cert, user, event, att);
              } catch (e) {
                console.error('Failed to generate PDF for auto-email:', e.message);
              }

              // Send certificate email
              sendCertificateEmail(
                user.email, user.name, event.title,
                cert.certificateId, cert.verificationCode,
                pdfBuffer
              ).catch(e => console.error('Cert email err:', e.message));

              console.log(`✅ Certificate auto-generated for ${user.email} - ${event.title}`);
            } catch (certErr) {
              console.error('Auto-cert error for one user:', certErr.message);
            }
          }
          console.log(`🏆 Auto-certificate generation complete for event: ${event.title}`);
        } catch (autoErr) {
          console.error('Auto-certificate generation failed:', autoErr.message);
        }
      });
    }
    // -----------------------------------------------------------------------

    

    res.json({
      message: 'Event updated successfully',
      event
    });

  } catch (error) {
    
    
    
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
    
    res.status(500).json({ message: 'Failed to send notifications', error: error.message });
  }
});

const JSZip = require('jszip');
const Contact = require('../models/Contact');

// Get all contact messages
router.get('/contacts', adminAuth, async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    console.log(`🔍 Admin fetching contacts: status=${status || 'all'}, search=${search || 'none'}`);
    
    let query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } }
      ];
    }

    const contacts = await Contact.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Contact.countDocuments(query);

    res.json({
      success: true,
      contacts,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalMessages: total
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch contacts', error: error.message });
  }
});

// Update contact status
router.put('/contacts/:id/status', adminAuth, async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    const updateData = { status };
    if (adminNotes !== undefined) updateData.adminNotes = adminNotes;
    if (status === 'resolved') updateData.resolvedAt = new Date();

    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!contact) {
      return res.status(404).json({ message: 'Message not found' });
    }

    res.json({ success: true, contact });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update status', error: error.message });
  }
});

// Bulk download certificates for an event
router.get('/events/:id/bulk-certificates', adminAuth, async (req, res) => {
  try {
    const eventId = req.params.id;
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    // Find all confirmed bookings
    const bookings = await Booking.find({ event: eventId, status: 'confirmed' }).populate('user');
    
    if (bookings.length === 0) {
      return res.status(400).json({ message: 'No confirmed bookings found for this event' });
    }

    const zip = new JSZip();
    const generator = new CertificateGenerator();
    let generatedCount = 0;

    for (const booking of bookings) {
      // Check for attendance
      const attendance = await Attendance.findOne({ event: eventId, user: booking.user._id, status: 'present' });
      
      // We only generate for those who were present if the event is strictly attendance-based
      // But for bulk, let's include anyone who has a certificate record or was present
      let certificate = await Certificate.findOne({ event: eventId, user: booking.user._id });
      
      if (!certificate && !attendance) continue;

      if (!certificate) {
          // Create temporary certificate data if not in DB but attended
          certificate = {
              certificateId: `CERT-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
              verificationCode: Math.random().toString(36).substr(2, 12).toUpperCase(),
              issuedDate: new Date()
          };
      }

      try {
        const pdfBuffer = await generator.generateCertificate(certificate, booking.user, event, attendance);
        zip.file(`${booking.user.name.replace(/[^a-z0-9]/gi, '_')}_Certificate.pdf`, pdfBuffer);
        generatedCount++;
      } catch (err) {
        console.error(`Error generating certificate for ${booking.user.name}:`, err.message);
      }
    }

    if (generatedCount === 0) {
      return res.status(400).json({ message: 'No certificates could be generated (none present or no certificate records)' });
    }

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
    
    res.set({
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename=Certificates_${event.title.replace(/[^a-z0-9]/gi, '_')}.zip`,
      'Content-Length': zipBuffer.length
    });

    res.send(zipBuffer);
  } catch (error) {
    console.error('Bulk certificate generation error:', error);
    res.status(500).json({ message: 'Failed to generate bulk certificates', error: error.message });
  }
});

module.exports = router;

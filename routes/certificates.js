const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Certificate = require('../models/Certificate');
const User = require('../models/User');
const Event = require('../models/Event');
const Attendance = require('../models/Attendance');
const CertificateGenerator = require('../utils/certificateGenerator');

// Generate certificate for completed event
router.post('/generate', auth, async (req, res) => {
  try {
    const { eventId, attendanceId } = req.body;
    const userId = req.user.userId;

    // Validate required fields
    if (!eventId || !attendanceId) {
      return res.status(400).json({
        message: 'Event ID and Attendance ID are required',
        success: false
      });
    }

    // Verify attendance exists and belongs to user
    const attendance = await Attendance.findById(attendanceId)
      .populate('eventId')
      .populate('userId');

    if (!attendance) {
      return res.status(404).json({
        message: 'Attendance record not found',
        success: false
      });
    }

    if (attendance.userId._id.toString() !== userId.toString()) {
      return res.status(403).json({
        message: 'Access denied. This attendance does not belong to you.',
        success: false
      });
    }

    if (attendance.eventId._id.toString() !== eventId.toString()) {
      return res.status(400).json({
        message: 'Attendance does not match the specified event',
        success: false
      });
    }

    // Check if event is completed
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        message: 'Event not found',
        success: false
      });
    }

    const now = new Date();
    const eventEnd = new Date(event.dateTime.end);
    
    if (now < eventEnd) {
      return res.status(400).json({
        message: 'Event has not completed yet. Certificate can only be generated after event completion.',
        success: false,
        eventEndsAt: eventEnd.toISOString()
      });
    }

    // Check if certificate already exists
    const existingCertificate = await Certificate.findOne({
      user: userId,
      event: eventId,
      attendance: attendanceId
    });

    if (existingCertificate) {
      return res.status(400).json({
        message: 'Certificate already exists for this attendance',
        success: false,
        certificate: {
          id: existingCertificate._id,
          certificateId: existingCertificate.certificateId,
          certificateNumber: existingCertificate.certificateNumber
        }
      });
    }

    // Create certificate
    const certificate = new Certificate({
      user: userId,
      event: eventId,
      attendance: attendanceId,
      title: `Certificate of Completion - ${event.title}`,
      description: `This certificate is awarded to ${attendance.userId.name} for successful completion of ${event.title} held on ${new Date(event.dateTime.start).toLocaleDateString()}.`,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Valid for 1 year
      metadata: {
        eventDuration: (new Date(event.dateTime.end) - new Date(event.dateTime.start)) / (1000 * 60 * 60),
        attendanceMethod: attendance.method,
        confidence: attendance.confidence || 1.0,
        issuedBy: 'Eventra Platform',
        organization: 'Eventra'
      }
    });

    await certificate.save();

    // Generate PDF
    const certificateGenerator = new CertificateGenerator();
    const pdfBuffer = await certificateGenerator.generateCertificate(
      certificate,
      attendance.userId,
      event,
      attendance
    );

    // Save PDF to file system (optional)
    const fs = require('fs');
    const path = require('path');
    const uploadsDir = path.join(__dirname, '..', 'uploads', 'certificates');
    
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const pdfFileName = `certificate-${certificate.certificateId}.pdf`;
    const pdfPath = path.join(uploadsDir, pdfFileName);
    
    fs.writeFileSync(pdfPath, pdfBuffer);
    certificate.pdfPath = pdfPath;
    await certificate.save();

    res.json({
      success: true,
      message: 'Certificate generated successfully',
      certificate: {
        id: certificate._id,
        certificateId: certificate.certificateId,
        certificateNumber: certificate.certificateNumber,
        title: certificate.title,
        issuedDate: certificate.issuedDate,
        validUntil: certificate.validUntil,
        verificationCode: certificate.verificationCode,
        pdfPath: `/api/certificates/${certificate._id}/download`
      }
    });

  } catch (error) {
    
    res.status(500).json({
      message: 'Certificate generation failed',
      error: error.message,
      success: false
    });
  }
});

// Download certificate PDF
router.get('/:id/download', auth, async (req, res) => {
  try {
    const certificateId = req.params.id;
    const userId = req.user.userId;

    const certificate = await Certificate.findById(certificateId)
      .populate('user')
      .populate('event')
      .populate('attendance');

    if (!certificate) {
      return res.status(404).json({
        message: 'Certificate not found',
        success: false
      });
    }

    // Check if user owns this certificate
    if (certificate.user._id.toString() !== userId.toString()) {
      return res.status(403).json({
        message: 'Access denied. This certificate does not belong to you.',
        success: false
      });
    }

    // Generate PDF if not exists
    if (!certificate.pdfPath || !require('fs').existsSync(certificate.pdfPath)) {
      const certificateGenerator = new CertificateGenerator();
      const pdfBuffer = await certificateGenerator.generateCertificate(
        certificate,
        certificate.user,
        certificate.event,
        certificate.attendance
      );

      // Save PDF
      const fs = require('fs');
      const path = require('path');
      const uploadsDir = path.join(__dirname, '..', 'uploads', 'certificates');
      
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const pdfFileName = `certificate-${certificate.certificateId}.pdf`;
      const pdfPath = path.join(uploadsDir, pdfFileName);
      
      fs.writeFileSync(pdfPath, pdfBuffer);
      certificate.pdfPath = pdfPath;
      await certificate.save();

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="certificate-${certificate.certificateId}.pdf"`);
      res.send(pdfBuffer);
    } else {
      // Send existing PDF
      res.download(certificate.pdfPath, `certificate-${certificate.certificateId}.pdf`);
    }

  } catch (error) {
    
    res.status(500).json({
      message: 'Certificate download failed',
      error: error.message,
      success: false
    });
  }
});

// Get user's certificates
router.get('/my-certificates', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;

    const query = { user: userId };
    if (status) {
      query.status = status;
    }

    const certificates = await Certificate.find(query)
      .populate('event', 'title dateTime venue')
      .populate('attendance', 'method timestamp')
      .sort({ issuedDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Certificate.countDocuments(query);

    res.json({
      success: true,
      certificates,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    
    res.status(500).json({
      message: 'Failed to fetch certificates',
      error: error.message,
      success: false
    });
  }
});

// Verify certificate
router.get('/verify/:verificationCode', async (req, res) => {
  try {
    const { verificationCode } = req.params;

    const certificate = await Certificate.findOne({ verificationCode })
      .populate('user', 'name email')
      .populate('event', 'title dateTime venue')
      .populate('attendance', 'method timestamp');

    if (!certificate) {
      return res.status(404).json({
        message: 'Certificate not found or invalid verification code',
        success: false
      });
    }

    // Check if certificate is valid
    const now = new Date();
    const isValid = certificate.status === 'active' && 
                   certificate.validFrom <= now && 
                   certificate.validUntil >= now;

    res.json({
      success: true,
      certificate: {
        id: certificate._id,
        certificateId: certificate.certificateId,
        certificateNumber: certificate.certificateNumber,
        title: certificate.title,
        recipient: certificate.user.name,
        event: {
          title: certificate.event.title,
          date: certificate.event.dateTime.start,
          venue: certificate.event.venue.name
        },
        attendance: {
          method: certificate.attendance.method,
          timestamp: certificate.attendance.timestamp
        },
        issuedDate: certificate.issuedDate,
        validFrom: certificate.validFrom,
        validUntil: certificate.validUntil,
        status: certificate.status,
        isValid: isValid,
        isVerified: certificate.isVerified
      }
    });

  } catch (error) {
    
    res.status(500).json({
      message: 'Certificate verification failed',
      error: error.message,
      success: false
    });
  }
});

// Get certificate by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const certificateId = req.params.id;
    const userId = req.user.userId;

    const certificate = await Certificate.findById(certificateId)
      .populate('user', 'name email')
      .populate('event', 'title dateTime venue')
      .populate('attendance', 'method timestamp');

    if (!certificate) {
      return res.status(404).json({
        message: 'Certificate not found',
        success: false
      });
    }

    // Check if user owns this certificate
    if (certificate.user._id.toString() !== userId.toString()) {
      return res.status(403).json({
        message: 'Access denied. This certificate does not belong to you.',
        success: false
      });
    }

    res.json({
      success: true,
      certificate: {
        id: certificate._id,
        certificateId: certificate.certificateId,
        certificateNumber: certificate.certificateNumber,
        title: certificate.title,
        description: certificate.description,
        event: certificate.event,
        attendance: certificate.attendance,
        issuedDate: certificate.issuedDate,
        validFrom: certificate.validFrom,
        validUntil: certificate.validUntil,
        status: certificate.status,
        verificationCode: certificate.verificationCode,
        metadata: certificate.metadata,
        isVerified: certificate.isVerified,
        verifiedAt: certificate.verifiedAt,
        downloadUrl: `/api/certificates/${certificate._id}/download`
      }
    });

  } catch (error) {
    
    res.status(500).json({
      message: 'Failed to fetch certificate',
      error: error.message,
      success: false
    });
  }
});

module.exports = router;

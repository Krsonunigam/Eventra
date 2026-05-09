const express = require('express');
const router = express.Router();
const { auth, adminAuth } = require('../middleware/auth');
const Certificate = require('../models/Certificate');
const User = require('../models/User');
const Event = require('../models/Event');
const Attendance = require('../models/Attendance');
const Booking = require('../models/Booking');
const CertificateGenerator = require('../utils/certificateGenerator');
const { sendCertificateEmail } = require('../utils/emailService');
const JSZip = require('jszip');

// ─── HELPER: Core certificate generation logic (reused across routes) ──────────
async function generateCertificateForUser(userId, eventId, sendEmail = true) {
  const event = await Event.findById(eventId);
  if (!event) throw new Error('Event not found');

  const user = await User.findById(userId).select('name email');
  if (!user) throw new Error('User not found');

  // Check for any verified attendance (present or late)
  const attendance = await Attendance.findOne({
    userId,
    eventId,
    status: { $in: ['present', 'late'] }
  });
  if (!attendance) throw new Error(`No verified attendance found for user ${user.email}`);

  // Skip if already issued
  const existing = await Certificate.findOne({ user: userId, event: eventId });
  if (existing) return { certificate: existing, alreadyExisted: true };

  // Create certificate
  const certificate = new Certificate({
    user: userId,
    event: eventId,
    attendance: attendance._id,
    title: `Certificate of Participation – ${event.title}`,
    description: `Awarded to ${user.name} for attending ${event.title}`,
    validFrom: new Date(),
    validUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 10)),
    metadata: {
      eventDuration: event.dateTime?.end && event.dateTime?.start
        ? (new Date(event.dateTime.end) - new Date(event.dateTime.start)) / (1000 * 60 * 60)
        : 0,
      attendanceMethod: attendance.method,
      issuedBy: 'Eventra Auto-System',
      organization: 'Eventra'
    }
  });

  await certificate.save();

  // Send email asynchronously (don't block response)
  if (sendEmail) {
    let pdfBuffer = null;
    try {
      const generator = new CertificateGenerator();
      pdfBuffer = await generator.generateCertificate(certificate, user, event, attendance);
    } catch (e) {
      console.error('Failed to generate PDF for email:', e.message);
    }

    sendCertificateEmail(
      user.email,
      user.name,
      event.title,
      certificate.certificateId,
      certificate.verificationCode,
      pdfBuffer
    ).catch(err => console.error('Certificate email error:', err.message));
  }

  return { certificate, alreadyExisted: false };
}

// ─── USER: Generate my certificate for an event ───────────────────────────────
router.post('/generate', auth, async (req, res) => {
  try {
    const { eventId } = req.body;
    if (!eventId) return res.status(400).json({ success: false, message: 'eventId is required' });

    const { certificate, alreadyExisted } = await generateCertificateForUser(req.user.userId, eventId);

    res.json({
      success: true,
      message: alreadyExisted ? 'Certificate already exists' : 'Certificate generated successfully! Check your email.',
      certificate
    });
  } catch (error) {
    console.error('Certificate generate error:', error.message);
    res.status(400).json({ success: false, message: error.message });
  }
});

// ─── USER: Get my certificates ────────────────────────────────────────────────
router.get('/my-certificates', auth, async (req, res) => {
  try {
    const certificates = await Certificate.find({ user: req.user.userId })
      .populate('event', 'title dateTime venue image category')
      .populate('attendance', 'method timestamp status')
      .sort({ createdAt: -1 });

    res.json({ success: true, certificates });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch certificates' });
  }
});

// ─── USER / ADMIN: Download certificate PDF ───────────────────────────────────
router.get('/download/:id', auth, async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id)
      .populate('user', 'name email')
      .populate('event')
      .populate('attendance');

    if (!certificate) return res.status(404).json({ message: 'Certificate not found' });

    if (
      certificate.user._id.toString() !== req.user.userId.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const generator = new CertificateGenerator();
    const pdfBuffer = await generator.generateCertificate(
      certificate,
      certificate.user,
      certificate.event,
      certificate.attendance
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=Certificate_${certificate.certificateId}.pdf`
    );
    res.send(pdfBuffer);
  } catch (error) {
    console.error('PDF download error:', error.message);
    res.status(500).json({ message: 'Failed to generate PDF' });
  }
});

// ─── PUBLIC: Verify certificate by ID (Manual Input) ────────────────────────
router.get('/verify-id/:id', async (req, res) => {
  try {
    const certificate = await Certificate.findOne({ 
      $or: [
        { certificateId: req.params.id },
        { verificationCode: req.params.id }
      ]
    })
    .populate('user', 'name email studentId institute')
    .populate('event', 'title dateTime venue category');

    if (!certificate) {
      return res.status(404).json({ success: false, message: 'Certificate not found' });
    }

    // Optional authentication check for masking
    let isOwnerOrAdmin = false;
    const authHeader = req.headers.authorization;
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET);
        if (decoded.role === 'admin' || decoded.userId === certificate.user._id.toString()) {
          isOwnerOrAdmin = true;
        }
      } catch (err) {
        // Token invalid, treat as public
      }
    }

    const maskName = (name) => {
      if (isOwnerOrAdmin) return name;
      const parts = name.split(' ');
      return parts.map(p => p[0] + '*'.repeat(p.length - 1)).join(' ');
    };

    res.json({
      success: true,
      data: {
        certificateId: certificate.certificateId,
        recipient: maskName(certificate.user.name),
        event: certificate.event.title,
        eventDate: certificate.event.dateTime?.start,
        venue: certificate.event.venue?.name,
        category: certificate.event.category,
        issuedAt: certificate.createdAt,
        status: certificate.status,
        isValid: certificate.status === 'active',
        // Full details only if authenticated owner/admin
        fullDetails: isOwnerOrAdmin ? {
          email: certificate.user.email,
          studentId: certificate.user.studentId,
          institute: certificate.user.institute,
          verificationCode: certificate.verificationCode
        } : null
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Verification error' });
  }
});

// ─── PUBLIC: Verify certificate by code (QR Scan) ─────────────────────────────
router.get('/verify/:code', async (req, res) => {
  try {
    const certificate = await Certificate.findOne({ verificationCode: req.params.code })
      .populate('user', 'name email')
      .populate('event', 'title dateTime venue category');

    if (!certificate) {
      return res.status(404).json({ success: false, message: 'Invalid or expired verification code' });
    }

    res.json({
      success: true,
      data: {
        certificateId: certificate.certificateId,
        recipient: certificate.user.name,
        event: certificate.event.title,
        eventDate: certificate.event.dateTime?.start,
        venue: certificate.event.venue?.name,
        issuedAt: certificate.createdAt,
        status: certificate.status,
        isValid: certificate.status === 'active'
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Verification error' });
  }
});

// ─── ADMIN: Get all certificates ──────────────────────────────────────────────
router.get('/admin/all', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });

    const { search, eventId } = req.query;
    let query = {};
    if (eventId) query.event = eventId;

    let certificates = await Certificate.find(query)
      .populate('user', 'name email institute studentId')
      .populate('event', 'title dateTime venue')
      .sort({ createdAt: -1 });

    // Apply search filter after population
    if (search) {
      const s = search.toLowerCase();
      certificates = certificates.filter(c =>
        c.user?.name?.toLowerCase().includes(s) ||
        c.user?.email?.toLowerCase().includes(s) ||
        c.event?.title?.toLowerCase().includes(s) ||
        c.certificateId?.toLowerCase().includes(s)
      );
    }

    res.json({ success: true, certificates });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Admin fetch error' });
  }
});

// ─── ADMIN: Bulk generate certificates for all attendees of an event ──────────
router.post('/admin/generate-for-event/:eventId', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });

    const { eventId } = req.params;
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    // Find all attendees with present/late status
    const attendances = await Attendance.find({
      eventId,
      status: { $in: ['present', 'late'] }
    });

    if (attendances.length === 0) {
      return res.status(400).json({ success: false, message: 'No verified attendees found for this event.' });
    }

    const results = { generated: [], alreadyExisted: [], failed: [] };

    for (const att of attendances) {
      try {
        const { certificate, alreadyExisted } = await generateCertificateForUser(att.userId, eventId, true);
        if (alreadyExisted) {
          results.alreadyExisted.push(att.userId.toString());
        } else {
          results.generated.push(certificate.certificateId);
        }
      } catch (err) {
        results.failed.push({ userId: att.userId.toString(), reason: err.message });
      }
    }

    // Mark event as completed
    if (event.status !== 'completed') {
      event.status = 'completed';
      await event.save();
    }

    res.json({
      success: true,
      message: `Certificates processed. New: ${results.generated.length}, Already existed: ${results.alreadyExisted.length}, Failed: ${results.failed.length}`,
      results
    });
  } catch (error) {
    console.error('Bulk generate error:', error.message);
    res.status(500).json({ message: 'Bulk generation failed', error: error.message });
  }
});

// ─── ADMIN: Resend certificate email ──────────────────────────────────────────
router.post('/admin/resend-email/:certId', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });

    const certificate = await Certificate.findById(req.params.certId)
      .populate('user', 'name email')
      .populate('event')
      .populate('attendance');

    if (!certificate) return res.status(404).json({ message: 'Certificate not found' });

    let pdfBuffer = null;
    try {
      const generator = new CertificateGenerator();
      pdfBuffer = await generator.generateCertificate(
        certificate,
        certificate.user,
        certificate.event,
        certificate.attendance
      );
    } catch (e) {
      console.error('Failed to generate PDF for resend:', e.message);
    }

    await sendCertificateEmail(
      certificate.user.email,
      certificate.user.name,
      certificate.event.title,
      certificate.certificateId,
      certificate.verificationCode,
      pdfBuffer
    );

    res.json({ success: true, message: `Certificate email resent to ${certificate.user.email}` });
  } catch (error) {
    res.status(500).json({ message: 'Failed to resend email', error: error.message });
  }
});

// ─── ADMIN: Bulk download ALL ZIP ─────────────────────────────────────────────
router.get('/admin/bulk-download-all', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });

    const certificates = await Certificate.find()
      .populate('user', 'name email')
      .populate('event')
      .populate('attendance');

    if (certificates.length === 0) {
      return res.status(404).json({ message: 'No certificates found in the system' });
    }

    const zip = new JSZip();
    const generator = new CertificateGenerator();

    for (const cert of certificates) {
      try {
        const pdfBuffer = await generator.generateCertificate(cert, cert.user, cert.event, cert.attendance);
        const folderName = cert.event?.title.replace(/\s+/g, '_') || 'General';
        const fileName = `${cert.user.name.replace(/\s+/g, '_')}_${cert.certificateId}.pdf`;
        zip.folder(folderName).file(fileName, pdfBuffer);
      } catch (err) {
        console.error(`PDF gen failed for ${cert.user?.name}:`, err.message);
      }
    }

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename=All_Eventra_Certificates.zip');
    res.send(zipBuffer);
  } catch (error) {
    console.error('Bulk download all error:', error.message);
    res.status(500).json({ message: 'Global bulk download failed' });
  }
});

// ─── ADMIN: Bulk download ZIP ─────────────────────────────────────────────────
router.get('/admin/bulk-download/:eventId', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });

    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const certificates = await Certificate.find({ event: req.params.eventId })
      .populate('user', 'name email')
      .populate('event')
      .populate('attendance');

    if (certificates.length === 0) {
      return res.status(404).json({ message: 'No certificates found for this event' });
    }

    const zip = new JSZip();
    const generator = new CertificateGenerator();

    for (const cert of certificates) {
      try {
        const pdfBuffer = await generator.generateCertificate(cert, cert.user, cert.event, cert.attendance);
        zip.file(`${cert.user.name.replace(/\s+/g, '_')}_${cert.certificateId}.pdf`, pdfBuffer);
      } catch (err) {
        console.error(`PDF gen failed for ${cert.user?.name}:`, err.message);
      }
    }

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename=Certificates_${event.title.replace(/\s+/g, '_')}.zip`);
    res.send(zipBuffer);
  } catch (error) {
    console.error('Bulk download error:', error.message);
    res.status(500).json({ message: 'Bulk download failed' });
  }
});

// ─── ADMIN: Revoke a certificate ──────────────────────────────────────────────
router.put('/admin/revoke/:certId', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });

    const certificate = await Certificate.findByIdAndUpdate(
      req.params.certId,
      { status: 'revoked' },
      { new: true }
    );

    if (!certificate) return res.status(404).json({ message: 'Certificate not found' });

    res.json({ success: true, message: 'Certificate revoked', certificate });
  } catch (error) {
    res.status(500).json({ message: 'Failed to revoke certificate' });
  }
});

// ─── ADMIN: Bulk download USER ZIP ─────────────────────────────────────────────
router.get('/admin/bulk-download-user/:userId', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });

    const certificates = await Certificate.find({ user: req.params.userId })
      .populate('user', 'name email')
      .populate('event')
      .populate('attendance');

    if (certificates.length === 0) {
      return res.status(404).json({ message: 'No certificates found for this user' });
    }

    const zip = new JSZip();
    const generator = new CertificateGenerator();

    for (const cert of certificates) {
      try {
        const pdfBuffer = await generator.generateCertificate(cert, cert.user, cert.event, cert.attendance);
        zip.file(`${cert.event?.title.replace(/\s+/g, '_')}_${cert.certificateId}.pdf`, pdfBuffer);
      } catch (err) {
        console.error(`PDF gen failed for ${cert.event?.title}:`, err.message);
      }
    }

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename=Certificates_${certificates[0].user.name.replace(/\s+/g, '_')}.zip`);
    res.send(zipBuffer);
  } catch (error) {
    console.error('User bulk download error:', error.message);
    res.status(500).json({ message: 'User bulk download failed' });
  }
});

module.exports = router;

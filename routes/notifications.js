const express = require('express');
const { auth } = require('../middleware/auth');
const { sendEventNotification } = require('../utils/emailService');

const router = express.Router();

// Send WhatsApp message (placeholder - would need WhatsApp Business API)
const sendWhatsAppMessage = async (phoneNumber, message) => {
  try {
    // This would integrate with WhatsApp Business API
    // For now, we'll just log the message
    
    return { success: true, messageId: `wa_${Date.now()}` };
  } catch (error) {
    
    throw error;
  }
};

// Send event reminder
router.post('/event-reminder', auth, async (req, res) => {
  try {
    const { eventId, type = 'email' } = req.body;
    
    const Event = require('../models/Event');
    const Booking = require('../models/Booking');
    
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Get user's booking for this event
    const booking = await Booking.findOne({
      user: req.user.userId,
      event: eventId,
      status: 'active'
    });
    
    if (!booking) {
      return res.status(404).json({ message: 'No active booking found for this event' });
    }
    
    const user = await require('../models/User').findById(req.user.userId);
    
    if (type === 'email') {
      await sendEventNotification(
        user.email,
        user.name,
        event.title,
        event.dateTime.start,
        event.venue.name
      );
    } else if (type === 'whatsapp') {
      const message = `Hi ${user.name}! Reminder: ${event.title} is tomorrow at ${event.venue.name}. Don't forget to check in!`;
      await sendWhatsAppMessage(user.phoneNumber, message);
    }
    
    res.json({ 
      message: 'Reminder sent successfully',
      type 
    });
    
  } catch (error) {
    
    res.status(500).json({ 
      message: 'Failed to send reminder',
      error: error.message 
    });
  }
});

// Send booking confirmation
router.post('/booking-confirmation', auth, async (req, res) => {
  try {
    const { bookingId, type = 'email' } = req.body;
    
    const Booking = require('../models/Booking');
    const booking = await Booking.findById(bookingId)
      .populate('event', 'title dateTime venue')
      .populate('user', 'name email phoneNumber');
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    if (booking.user._id.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }
    
    if (type === 'email') {
      await sendEventNotification(
        booking.user.email,
        booking.user.name,
        booking.event.title,
        booking.event.dateTime.start,
        booking.event.venue.name
      );
    } else if (type === 'whatsapp') {
      const message = `Booking confirmed! ${booking.event.title} on ${new Date(booking.event.dateTime.start).toLocaleDateString()} at ${booking.event.venue.name}. Seat: ${booking.seatNumber}`;
      await sendWhatsAppMessage(booking.user.phoneNumber, message);
    }
    
    res.json({ 
      message: 'Confirmation sent successfully',
      type 
    });
    
  } catch (error) {
    
    res.status(500).json({ 
      message: 'Failed to send confirmation',
      error: error.message 
    });
  }
});

// Send cancellation notification
router.post('/cancellation-notification', auth, async (req, res) => {
  try {
    const { bookingId, type = 'email' } = req.body;
    
    const Booking = require('../models/Booking');
    const booking = await Booking.findById(bookingId)
      .populate('event', 'title dateTime venue')
      .populate('user', 'name email phoneNumber');
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    if (booking.user._id.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }
    
    if (type === 'email') {
      // Send cancellation email
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransporter({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
      
      await transporter.sendMail({
        from: `"Eventra" <${process.env.EMAIL_USER}>`,
        to: booking.user.email,
        subject: '⚠️ Booking Cancelled - Eventra',
        html: `
          <!DOCTYPE html>
          <html>
          <body style="margin: 0; padding: 0; background-color: #050b18; font-family: sans-serif; color: #ffffff;">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 40px auto; background-color: #0f172a; border-radius: 24px; overflow: hidden; border: 1px solid rgba(255,255,255,0.05);">
              <tr>
                <td style="padding: 40px; text-align: center; background: #dc2626;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 900;">BOOKING CANCELLED</h1>
                </td>
              </tr>
              <tr>
                <td style="padding: 40px 30px;">
                  <p style="font-size: 16px; color: #94a3b8; line-height: 1.6;">Your booking for <strong>${booking.event.title}</strong> has been cancelled as requested.</p>
                  
                  <div style="background: rgba(220, 38, 38, 0.05); border: 1px solid rgba(220, 38, 38, 0.2); border-radius: 16px; padding: 25px; margin: 30px 0;">
                    <p style="margin: 0; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #ef4444; font-weight: 800;">Refund Status</p>
                    <p style="margin: 10px 0 0; font-size: 24px; font-weight: 900; color: #ffffff;">₹${booking.refundAmount || booking.totalAmount}</p>
                    <p style="margin: 5px 0 0; font-size: 13px; color: #64748b;">To be processed within 5-7 business days.</p>
                  </div>
                  
                  <p style="font-size: 13px; color: #475569; text-align: center;">If you didn't request this cancellation, please contact our support team immediately.</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 30px; background: #020617; text-align: center;">
                  <p style="margin: 0; font-size: 12px; color: #475569; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">© 2024 EVENTRA TEAM</p>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `
      });
    } else if (type === 'whatsapp') {
      const message = `Your booking for ${booking.event.title} has been cancelled. Refund amount: ₹${booking.refundAmount}`;
      await sendWhatsAppMessage(booking.user.phoneNumber, message);
    }
    
    res.json({ 
      message: 'Cancellation notification sent successfully',
      type 
    });
    
  } catch (error) {
    
    res.status(500).json({ 
      message: 'Failed to send cancellation notification',
      error: error.message 
    });
  }
});

// Get notification preferences
router.get('/preferences', auth, async (req, res) => {
  try {
    const user = await require('../models/User').findById(req.user.userId);
    
    res.json({
      email: user.email,
      phoneNumber: user.phoneNumber,
      preferences: {
        emailNotifications: true,
        whatsappNotifications: true,
        eventReminders: true,
        bookingConfirmations: true,
        cancellationAlerts: true
      }
    });
    
  } catch (error) {
    
    res.status(500).json({ 
      message: 'Failed to get notification preferences',
      error: error.message 
    });
  }
});

// Update notification preferences
router.put('/preferences', auth, async (req, res) => {
  try {
    const { preferences } = req.body;
    
    // In a real application, you would store these preferences in the user model
    // For now, we'll just return success
    
    res.json({ 
      message: 'Notification preferences updated successfully',
      preferences 
    });
    
  } catch (error) {
    
    res.status(500).json({ 
      message: 'Failed to update notification preferences',
      error: error.message 
    });
  }
});

module.exports = router;

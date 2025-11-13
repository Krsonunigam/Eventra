const express = require('express');
const Booking = require('../models/Booking');
const Event = require('../models/Event');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const PDFGenerator = require('../utils/pdfGenerator');

const router = express.Router();

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_RLZEezKE8Hb6gt',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '9fwzs7VqV2UIRdYcAvQ9jvWV'
});

// Create booking
router.post('/', auth, async (req, res) => {
  try {
    console.log('Booking creation request:', req.body);
    console.log('User ID:', req.user.userId);
    console.log('User ID type:', typeof req.user.userId);
    console.log('User role:', req.user.role);
    const { eventId, quantity = 1 } = req.body;
    const userId = req.user.userId;

    // Check if event exists and is available
    const event = await Event.findById(eventId);
    console.log('Event found:', event ? 'Yes' : 'No', event?.title, event?.status);
    if (!event) {
      console.log('Event not found for ID:', eventId);
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.status !== 'published') {
      console.log('Event not published, status:', event.status);
      return res.status(400).json({ message: 'Event is not available for booking' });
    }

    console.log('Available seats:', event.availableSeats, 'Requested quantity:', quantity);
    if (event.availableSeats < quantity) {
      console.log('Not enough seats available');
      return res.status(400).json({ message: 'Not enough seats available' });
    }

    // Check if user already has a booking for this event
    const existingBooking = await Booking.findOne({
      user: userId,
      event: eventId,
      status: { $in: ['confirmed', 'pending'] }
    });

    console.log('Existing booking check:', existingBooking ? 'Found' : 'None');
    if (existingBooking) {
      console.log('User already has a booking for this event');
      return res.status(400).json({ message: 'You already have a booking for this event' });
    }

    // Handle free events (price = 0) differently
    if (event.price === 0) {
      // For free events, create confirmed booking directly
      const booking = new Booking({
        user: userId,
        event: eventId,
        quantity: quantity,
        totalAmount: 0,
        status: 'confirmed',
        razorpayOrderId: null,
        razorpayPaymentId: 'free_event',
        paymentDate: new Date(),
        verificationCode: generateVerificationCode()
      });

      console.log('Creating booking with user ID:', userId);
      console.log('User ID type in booking:', typeof userId);
      await booking.save();
      console.log('Booking created with ID:', booking._id);
      console.log('Booking user field:', booking.user);

      // Update event available seats
      await Event.findByIdAndUpdate(eventId, {
        $inc: { availableSeats: -quantity }
      });

      res.json({
        success: true,
        booking: booking,
        razorpayOrder: null,
        isFreeEvent: true
      });
    } else {
      // For paid events, create Razorpay order
      console.log('Event price:', event.price, 'Type:', typeof event.price);
      console.log('Calculated amount:', event.price * 100);
      
      const orderOptions = {
        amount: event.price * 100, // Convert to paise
        currency: 'INR',
        receipt: `receipt_${Date.now()}`,
        notes: {
          eventId: eventId,
          userId: userId,
          quantity: quantity
        }
      };

      console.log('Order options:', orderOptions);
      console.log('Razorpay instance key_id:', razorpay.key_id);
      console.log('Creating Razorpay order...');
      
      let razorpayOrder;
      try {
        razorpayOrder = await razorpay.orders.create(orderOptions);
        console.log('✅ Razorpay order created successfully:', razorpayOrder.id);
      } catch (rzpError) {
        console.error('❌ Razorpay order creation failed:', rzpError);
        throw rzpError;
      }

      // Create booking
      const booking = new Booking({
        user: userId,
        event: eventId,
        quantity: quantity,
        totalAmount: event.price * quantity,
        status: 'pending',
        razorpayOrderId: razorpayOrder.id,
        verificationCode: generateVerificationCode()
      });

      await booking.save();

      res.json({
        success: true,
        booking: booking,
        razorpayOrder: razorpayOrder,
        isFreeEvent: false
      });
    }

  } catch (error) {
    console.error('Create booking error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Failed to create booking', error: error.message });
  }
});

// Verify payment
router.post('/verify-payment', auth, async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, bookingId } = req.body;

    // Verify payment signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '9fwzs7VqV2UIRdYcAvQ9jvWV')
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: 'Invalid payment signature' });
    }

    // Update booking status
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    booking.status = 'confirmed';
    booking.razorpayPaymentId = razorpay_payment_id;
    booking.paymentDate = new Date();
    await booking.save();

    // Update event available seats
    await Event.findByIdAndUpdate(booking.event, {
      $inc: { availableSeats: -booking.quantity }
    });

    res.json({
      success: true,
      message: 'Payment verified successfully',
      booking: booking
    });

  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ message: 'Payment verification failed', error: error.message });
  }
});

// Get user bookings
router.get('/', auth, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.userId })
      .populate('event', 'title dateTime venue price image')
      .sort({ createdAt: -1 });

    res.json({ bookings });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ message: 'Failed to fetch bookings', error: error.message });
  }
});

// Get booking details
router.get('/:id', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('event')
      .populate('user', 'name email studentId institute phoneNumber');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user owns this booking
    if (booking.user._id.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ booking });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({ message: 'Failed to fetch booking', error: error.message });
  }
});

// Generate event pass PDF
router.get('/:id/pass', auth, async (req, res) => {
  try {
    console.log('PDF generation request for booking ID:', req.params.id);
    const booking = await Booking.findById(req.params.id)
      .populate('event')
      .populate('user', 'name email studentId institute phoneNumber');

    if (!booking) {
      console.log('Booking not found for ID:', req.params.id);
      return res.status(404).json({ message: 'Booking not found' });
    }

    console.log('Booking found:', booking._id, 'Status:', booking.status);
    console.log('Booking user ID (raw):', booking.user._id);
    console.log('Booking user ID (string):', booking.user._id.toString());
    console.log('Request user ID (raw):', req.user.userId);
    console.log('Request user ID (string):', req.user.userId.toString());
    console.log('User ID types - Booking:', typeof booking.user._id, 'Request:', typeof req.user.userId);
    console.log('User ID comparison:', booking.user._id.toString() === req.user.userId.toString());

    // Check if user owns this booking
    if (booking.user._id.toString() !== req.user.userId.toString()) {
      console.log('Access denied for user:', req.user.userId);
      console.log('Booking belongs to user:', booking.user._id.toString());
      console.log('Comparison failed - IDs do not match');
      return res.status(403).json({ message: 'Access denied' });
    }

    if (booking.status !== 'confirmed') {
      console.log('Booking not confirmed, status:', booking.status);
      return res.status(400).json({ message: 'Booking is not confirmed' });
    }

    console.log('Generating PDF for booking:', booking._id);
    // Generate PDF
    const pdfGenerator = new PDFGenerator();
    const pdfBuffer = await pdfGenerator.generateEventPass(booking, booking.event, booking.user);

    console.log('PDF generated successfully, size:', pdfBuffer.length);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="event-pass-${booking.event.title.replace(/\s+/g, '-').toLowerCase()}.pdf"`);
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Generate pass error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Failed to generate event pass', error: error.message });
  }
});


// Cancel booking
router.put('/:id/cancel', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.user.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({ message: 'Booking is already cancelled' });
    }

    if (booking.status === 'confirmed') {
      // Refund logic would go here
      // For now, just update the status
    }

    booking.status = 'cancelled';
    booking.cancelledAt = new Date();
    await booking.save();

    // Update event available seats
    await Event.findByIdAndUpdate(booking.event, {
      $inc: { availableSeats: booking.quantity }
    });

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      booking: booking
    });

  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ message: 'Failed to cancel booking', error: error.message });
  }
});

// QR Code verification for attendance
router.post('/verify-qr', auth, async (req, res) => {
  try {
    const { qrData } = req.body;
    
    let qrInfo;
    try {
      qrInfo = JSON.parse(qrData);
    } catch (error) {
      return res.status(400).json({ message: 'Invalid QR code data' });
    }

    // Verify booking exists and is confirmed
    const booking = await Booking.findOne({
      _id: qrInfo.bookingId,
      status: 'confirmed'
    }).populate('event').populate('user');

    if (!booking) {
      return res.status(404).json({ message: 'Invalid or cancelled booking' });
    }

    // Verify the data matches
    if (booking.event._id.toString() !== qrInfo.eventId ||
        booking.user._id.toString() !== qrInfo.userId ||
        booking.verificationCode !== qrInfo.verificationCode) {
      return res.status(400).json({ message: 'QR code data mismatch' });
    }

    // Check if event is currently happening
    const now = new Date();
    const eventStart = new Date(booking.event.dateTime.start);
    const eventEnd = new Date(booking.event.dateTime.end);
    
    if (now < eventStart) {
      return res.status(400).json({ message: 'Event has not started yet' });
    }
    
    if (now > eventEnd) {
      return res.status(400).json({ message: 'Event has ended' });
    }

    // Mark attendance
    if (!booking.attendanceMarked) {
      booking.attendanceMarked = true;
      booking.attendanceTime = new Date();
      await booking.save();
    }

    res.json({
      success: true,
      message: 'Attendance verified successfully',
      booking: {
        eventTitle: booking.event.title,
        attendeeName: booking.user.name,
        attendanceTime: booking.attendanceTime
      }
    });

  } catch (error) {
    console.error('QR verification error:', error);
    res.status(500).json({ message: 'QR verification failed', error: error.message });
  }
});

// Helper function to generate verification code
function generateVerificationCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

module.exports = router;

const express = require('express');
const Booking = require('../models/Booking');
const Event = require('../models/Event');
const { auth } = require('../middleware/auth');
const { createOrder, verifyPayment, refundPayment } = require('../utils/paymentService');
const { sendBookingConfirmation } = require('../utils/emailService');

const router = express.Router();

// Create payment order
router.post('/create-order', auth, async (req, res) => {
  try {
    const { eventId, seatNumber, hall, quantity = 1 } = req.body;

    // Get event details
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.status !== 'published') {
      return res.status(400).json({ message: 'Event is not available for booking' });
    }

    // Check if event is still open for registration
    if (new Date() > new Date(event.registrationDeadline)) {
      return res.status(400).json({ message: 'Registration deadline has passed' });
    }

    // Check seat availability
    const bookedSeats = await Booking.countDocuments({
      event: eventId,
      status: { $in: ['active', 'completed'] }
    });

    if (bookedSeats + quantity > event.capacity) {
      return res.status(400).json({ message: 'Not enough seats available' });
    }

    // Check if user already has a booking for this event
    const existingBooking = await Booking.findOne({
      user: req.user.userId,
      event: eventId,
      status: { $in: ['active', 'completed'] }
    });

    if (existingBooking) {
      return res.status(400).json({ message: 'You already have a booking for this event' });
    }

    const totalAmount = event.price * quantity;
    const receipt = `EVT_${Date.now()}_${req.user.userId}`;

    // Create Razorpay order
    const order = await createOrder(totalAmount, 'INR', receipt);

    // Create booking record
    const booking = new Booking({
      user: req.user.userId,
      event: eventId,
      seatNumber,
      hall,
      quantity,
      totalAmount,
      razorpayOrderId: order.id,
      paymentStatus: 'pending'
    });

    await booking.save();

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      bookingId: booking._id
    });

  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Failed to create payment order', error: error.message });
  }
});

// Verify payment
router.post('/verify', auth, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body;

    // Verify payment signature
    const verification = verifyPayment(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    
    if (!verification.isAuthentic) {
      return res.status(400).json({ message: 'Payment verification failed' });
    }

    // Update booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.user.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    booking.paymentStatus = 'completed';
    booking.status = 'active';
    booking.razorpayPaymentId = razorpay_payment_id;
    booking.razorpaySignature = razorpay_signature;
    booking.paymentId = razorpay_payment_id;

    await booking.save();

    // Update event available seats
    const event = await Event.findById(booking.event);
    event.availableSeats -= booking.quantity;
    await event.save();

    // Send confirmation email
    const user = await require('../models/User').findById(req.user.userId);
    await sendBookingConfirmation(
      user.email,
      user.name,
      event.title,
      booking.bookingReference,
      booking.seatNumber,
      booking.totalAmount
    );

    res.json({
      message: 'Payment successful',
      booking: {
        id: booking._id,
        reference: booking.bookingReference,
        event: event.title,
        seatNumber: booking.seatNumber,
        totalAmount: booking.totalAmount
      }
    });

  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ message: 'Payment verification failed', error: error.message });
  }
});

// Cancel booking and process refund
router.post('/cancel-booking', auth, async (req, res) => {
  try {
    const { bookingId, reason } = req.body;

    const booking = await Booking.findById(bookingId)
      .populate('event');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.user.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    if (booking.status !== 'active') {
      return res.status(400).json({ message: 'Booking cannot be cancelled' });
    }

    // Check if cancellation is allowed
    if (!booking.canBeCancelled()) {
      return res.status(400).json({ 
        message: 'Cancellation deadline has passed or cancellation is not allowed' 
      });
    }

    // Calculate refund amount
    const refundAmount = booking.calculateRefund();

    // Process refund if payment was made
    let refundResult = null;
    if (booking.paymentStatus === 'completed' && booking.razorpayPaymentId) {
      try {
        refundResult = await refundPayment(
          booking.razorpayPaymentId,
          refundAmount,
          `Booking cancellation - ${reason}`
        );
      } catch (refundError) {
        console.error('Refund processing error:', refundError);
        // Continue with cancellation even if refund fails
      }
    }

    // Update booking status
    booking.status = 'cancelled';
    booking.cancellationReason = reason;
    booking.refundAmount = refundAmount;
    booking.refundDate = new Date();

    if (refundResult) {
      booking.paymentStatus = 'refunded';
    }

    await booking.save();

    // Update event available seats
    const event = booking.event;
    event.availableSeats += booking.quantity;
    await event.save();

    res.json({
      message: 'Booking cancelled successfully',
      refundAmount,
      refundId: refundResult?.id
    });

  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ message: 'Failed to cancel booking', error: error.message });
  }
});

// Get payment history
router.get('/history', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const bookings = await Booking.find({ user: req.user.userId })
      .populate('event', 'title dateTime venue image')
      .sort({ bookingDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Booking.countDocuments({ user: req.user.userId });

    res.json({
      bookings,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({ message: 'Failed to fetch payment history', error: error.message });
  }
});

// Get booking details
router.get('/booking/:id', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('event', 'title dateTime venue image category')
      .populate('user', 'name email phoneNumber');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.user._id.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    res.json({ booking });

  } catch (error) {
    console.error('Get booking details error:', error);
    res.status(500).json({ message: 'Failed to fetch booking details', error: error.message });
  }
});

// Webhook for Razorpay notifications
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const body = req.body;

    // Verify webhook signature
    const isValid = require('../utils/paymentService').validateWebhookSignature(
      body,
      signature,
      process.env.RAZORPAY_WEBHOOK_SECRET
    );

    if (!isValid) {
      return res.status(400).json({ message: 'Invalid webhook signature' });
    }

    const event = JSON.parse(body);

    // Handle different webhook events
    switch (event.event) {
      case 'payment.captured':
        console.log('Payment captured:', event.payload.payment.entity.id);
        break;
      
      case 'payment.failed':
        console.log('Payment failed:', event.payload.payment.entity.id);
        break;
      
      case 'refund.created':
        console.log('Refund created:', event.payload.refund.entity.id);
        break;
      
      default:
        console.log('Unhandled webhook event:', event.event);
    }

    res.json({ message: 'Webhook processed successfully' });

  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ message: 'Webhook processing failed', error: error.message });
  }
});

module.exports = router;

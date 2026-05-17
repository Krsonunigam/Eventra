const Razorpay = require("razorpay");
const crypto = require("crypto");
const Event = require("../models/Event");
const Booking = require("../models/Booking");
const User = require("../models/User");
const Payment = require("../models/Payment");
const PDFGenerator = require("../utils/pdfGenerator");
const { sendBookingConfirmation } = require("../utils/emailService");

let razorpay;

const getRazorpay = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay credentials are not configured');
  }

  if (!razorpay) {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID.trim(),
      key_secret: process.env.RAZORPAY_KEY_SECRET.trim()
    });
  }

  return razorpay;
};

// CREATE ORDER
exports.createOrder = async (req, res) => {
  try {
    const { eventId, quantity } = req.body;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const booking = await Booking.create({
      user: req.user.userId,
      event: eventId,
      quantity,
      totalAmount: event.price * quantity,
      verificationCode: Math.floor(100000 + Math.random() * 900000).toString(),
      status: "pending"
    });

    let order;
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      // Mock order creation for local server/development!
      order = {
        id: "order_mock_" + Math.random().toString(36).substring(2, 9),
        amount: event.price * quantity * 100,
        currency: "INR",
        mock: true
      };
    } else {
      order = await getRazorpay().orders.create({
        amount: event.price * quantity * 100,
        currency: "INR"
      });
    }

    res.json({
      success: true,
      order,
      bookingId: booking._id
    });

  } catch (err) {
    
    console.error("Booking Error Trace:", err); res.status(500).json({ message: err.message });
  }
};

// VERIFY PAYMENT
exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      bookingId
    } = req.body;

    const isMock = 
      (razorpay_order_id && razorpay_order_id.startsWith("order_mock_")) ||
      razorpay_signature === "signature_mock" ||
      (razorpay_payment_id && razorpay_payment_id.startsWith("pay_mock_"));

    if (!isMock) {
      if (!process.env.RAZORPAY_KEY_SECRET) {
        return res.status(400).json({ message: "Razorpay secret key not configured" });
      }
      const sign = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET.trim())
        .update(razorpay_order_id + "|" + razorpay_payment_id)
        .digest("hex");

      if (sign !== razorpay_signature) {
        return res.status(400).json({ message: "Invalid payment" });
      }
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const finalPaymentId = razorpay_payment_id || "pay_mock_" + Math.random().toString(36).substring(2, 9);

    booking.paymentId = finalPaymentId;
    booking.razorpayPaymentId = finalPaymentId;
    booking.razorpayOrderId = razorpay_order_id;
    booking.paymentDate = new Date();
    booking.status = "confirmed";
    await booking.save();

    await Payment.create({
      user: booking.user,
      event: booking.event,
      booking: booking._id,
      amount: booking.totalAmount,
      status: 'success',
      provider: isMock ? 'mock_razorpay' : 'razorpay',
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: finalPaymentId,
      paidAt: new Date()
    });

    const user = await User.findById(booking.user);
    const event = await Event.findById(booking.event);

    let pdf = null;

    try {
      const pdfGenerator = new PDFGenerator();
      pdf = await pdfGenerator.generateEventPass(booking, event, user);
    } catch (pdfError) {
      console.error("PDF Pass Generation failed:", pdfError.message);
    }

    try {
      if (pdf) {
        await sendBookingConfirmation(
          user.email,
          user.name,
          event,
          booking,
          pdf
        );
      }
    } catch (emailError) {
      console.error("Email Confirmation failed:", emailError.message);
    }

    res.json({
      success: true,
      message: "Payment successful",
      booking
    });

  } catch (err) {
    console.error("Payment Verification Error Trace:", err);
    res.status(500).json({ message: err.message });
  }
};

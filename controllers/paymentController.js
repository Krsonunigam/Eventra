const Razorpay = require("razorpay");
const crypto = require("crypto");
const Event = require("../models/Event");
const Booking = require("../models/Booking");
const User = require("../models/User");
const PDFGenerator = require("../utils/pdfGenerator");
const { sendBookingConfirmation } = require("../utils/emailService");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

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

    const order = await razorpay.orders.create({
      amount: event.price * quantity * 100,
      currency: "INR"
    });

    res.json({
      success: true,
      order,
      bookingId: booking._id
    });

  } catch (err) {
    
    res.status(500).json({ message: err.message });
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

    const sign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (sign !== razorpay_signature) {
      return res.status(400).json({ message: "Invalid payment" });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    booking.paymentId = razorpay_payment_id;
    booking.status = "confirmed";
    await booking.save();

    const user = await User.findById(booking.user);
    const event = await Event.findById(booking.event);

    let pdf = null;

    try {
      const pdfGenerator = new PDFGenerator();
      pdf = await pdfGenerator.generateEventPass(booking, event, user);
    } catch (pdfError) {
      
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
      
    }

    res.json({
      success: true,
      message: "Payment successful",
      booking
    });

  } catch (err) {
    
    res.status(500).json({ message: err.message });
  }
};
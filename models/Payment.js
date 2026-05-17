const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  status: { type: String, enum: ['pending', 'completed', 'failed', 'success'], default: 'pending' },
  provider: { type: String, default: 'razorpay' },
  currency: { type: String, default: 'INR' },
  amount: { type: Number, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  paidAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);

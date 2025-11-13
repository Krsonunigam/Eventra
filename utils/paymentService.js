const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay only if environment variables are available
let razorpay = null;

const initializeRazorpay = () => {
  if (!razorpay && process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
  }
  return razorpay;
};

// Create order
const createOrder = async (amount, currency = 'INR', receipt) => {
  try {
    const rzp = initializeRazorpay();
    if (!rzp) {
      throw new Error('Razorpay not initialized. Please check environment variables.');
    }

    const options = {
      amount: amount * 100, // Razorpay expects amount in paise
      currency,
      receipt,
      payment_capture: 1
    };

    const order = await rzp.orders.create(options);
    return order;
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    throw error;
  }
};

// Verify payment signature
const verifyPayment = (razorpay_order_id, razorpay_payment_id, razorpay_signature) => {
  try {
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;
    
    return {
      isAuthentic,
      expectedSignature,
      receivedSignature: razorpay_signature
    };
  } catch (error) {
    console.error('Error verifying payment:', error);
    throw error;
  }
};

// Capture payment
const capturePayment = async (paymentId, amount) => {
  try {
    const rzp = initializeRazorpay();
    if (!rzp) {
      throw new Error('Razorpay not initialized. Please check environment variables.');
    }

    const payment = await rzp.payments.capture(paymentId, amount * 100);
    return payment;
  } catch (error) {
    console.error('Error capturing payment:', error);
    throw error;
  }
};

// Get payment details
const getPaymentDetails = async (paymentId) => {
  try {
    const rzp = initializeRazorpay();
    if (!rzp) {
      throw new Error('Razorpay not initialized. Please check environment variables.');
    }

    const payment = await rzp.payments.fetch(paymentId);
    return payment;
  } catch (error) {
    console.error('Error fetching payment details:', error);
    throw error;
  }
};

// Refund payment
const refundPayment = async (paymentId, amount, notes = '') => {
  try {
    const rzp = initializeRazorpay();
    if (!rzp) {
      throw new Error('Razorpay not initialized. Please check environment variables.');
    }

    const refund = await rzp.payments.refund(paymentId, {
      amount: amount * 100, // Amount in paise
      notes: {
        reason: notes
      }
    });
    return refund;
  } catch (error) {
    console.error('Error processing refund:', error);
    throw error;
  }
};

// Get refund details
const getRefundDetails = async (refundId) => {
  try {
    const rzp = initializeRazorpay();
    if (!rzp) {
      throw new Error('Razorpay not initialized. Please check environment variables.');
    }

    const refund = await rzp.payments.fetchRefund(refundId);
    return refund;
  } catch (error) {
    console.error('Error fetching refund details:', error);
    throw error;
  }
};

// Generate payment link
const generatePaymentLink = async (amount, description, customer) => {
  try {
    const rzp = initializeRazorpay();
    if (!rzp) {
      throw new Error('Razorpay not initialized. Please check environment variables.');
    }

    const paymentLink = await rzp.paymentLink.create({
      amount: amount * 100,
      currency: 'INR',
      description,
      customer: {
        name: customer.name,
        email: customer.email,
        contact: customer.phone
      },
      notify: {
        sms: true,
        email: true
      },
      reminder_enable: true,
      callback_url: `${process.env.CLIENT_URL}/payment/callback`,
      callback_method: 'get'
    });
    
    return paymentLink;
  } catch (error) {
    console.error('Error generating payment link:', error);
    throw error;
  }
};

// Validate webhook signature
const validateWebhookSignature = (body, signature, secret) => {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');
    
    return expectedSignature === signature;
  } catch (error) {
    console.error('Error validating webhook signature:', error);
    return false;
  }
};

module.exports = {
  createOrder,
  verifyPayment,
  capturePayment,
  getPaymentDetails,
  refundPayment,
  getRefundDetails,
  generatePaymentLink,
  validateWebhookSignature
};

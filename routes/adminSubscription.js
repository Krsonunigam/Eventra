const express = require('express');
const mongoose = require('mongoose');
const AdminSubscription = require('../models/AdminSubscription');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const Razorpay = require('razorpay');

const router = express.Router();

// Initialize Razorpay only if environment variables are available
let razorpay = null;

const initializeRazorpay = () => {
  if (!razorpay) {
    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
      razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
      });
      console.log('Razorpay initialized with environment variables');
    } else {
      console.warn('Razorpay environment variables not set. Payment features will be disabled.');
      console.warn('RAZORPAY_KEY_ID:', process.env.RAZORPAY_KEY_ID ? 'Set' : 'Missing');
      console.warn('RAZORPAY_KEY_SECRET:', process.env.RAZORPAY_KEY_SECRET ? 'Set' : 'Missing');
    }
  }
  return razorpay;
};

// Create Razorpay order
router.post('/order', auth, async (req, res) => {
  try {
    const { plan } = req.body; // 'monthly' or 'yearly'
    const userId = req.user.userId;

    // Validate required fields
    if (!plan) {
      return res.status(400).json({ 
        message: 'Plan is required',
        success: false
      });
    }

    // Validate plan type
    if (!['basic', 'professional', 'enterprise'].includes(plan)) {
      return res.status(400).json({ 
        message: 'Invalid plan selected. Must be basic, professional, or enterprise',
        success: false
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        message: 'User not found',
        success: false
      });
    }

    // Check if user already has an active subscription
    const existingSubscription = await AdminSubscription.findOne({
      admin: userId,
      status: 'active',
      endDate: { $gt: new Date() }
    });

    if (existingSubscription) {
      return res.status(400).json({
        message: 'You already have an active subscription',
        success: false,
        existingSubscription: {
          id: existingSubscription._id,
          plan: existingSubscription.plan,
          endDate: existingSubscription.endDate,
          daysRemaining: existingSubscription.daysRemaining
        }
      });
    }

    // Initialize Razorpay
    const razorpay = initializeRazorpay();
    if (!razorpay) {
      return res.status(500).json({
        message: 'Payment service not available. Please contact support.',
        success: false
      });
    }

    let amount;
    let durationMonths = 1; // All plans are monthly
    let planName;
    
    switch(plan) {
      case 'basic':
        amount = 49900; // ₹499 in paisa
        planName = 'Basic Admin Subscription';
        break;
      case 'professional':
        amount = 149900; // ₹1499 in paisa
        planName = 'Professional Admin Subscription';
        break;
      case 'enterprise':
        amount = 499900; // ₹4999 in paisa
        planName = 'Enterprise Admin Subscription';
        break;
      default:
        return res.status(400).json({ 
          message: 'Invalid plan selected',
          success: false
        });
    }

    const options = {
      amount: amount,
      currency: 'INR',
      receipt: `sub_${userId.toString().slice(-8)}_${Date.now().toString().slice(-8)}`,
      payment_capture: 1 // 1 for automatic capture
    };

    const rzp = initializeRazorpay();
    if (!rzp) {
      return res.status(500).json({ 
        message: 'Payment service not available. Please contact support.',
        error: 'Razorpay not configured'
      });
    }

    console.log('Creating Razorpay order with options:', {
      amount: options.amount,
      currency: options.currency,
      receipt: options.receipt
    });

    let order;
    try {
      order = await rzp.orders.create(options);
      console.log('Razorpay order created successfully:', order.id);
    } catch (razorpayError) {
      console.error('Razorpay order creation failed:', razorpayError);
      return res.status(500).json({
        message: 'Failed to create payment order',
        error: razorpayError.message,
        details: razorpayError.error || 'Unknown Razorpay error'
      });
    }

    // Create a pending subscription record
    try {
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + durationMonths);

      let subscription = await AdminSubscription.findOne({ admin: userId });

      if (subscription) {
        subscription.plan = plan;
        subscription.subscriptionType = plan;
        subscription.amount = amount / 100;
        subscription.endDate = endDate;
        subscription.nextBillingDate = endDate; // Set next billing date
        subscription.status = 'inactive';
        subscription.paymentHistory.push({
          amount: amount / 100,
          paymentDate: new Date(),
          razorpayOrderId: order.id,
          status: 'pending'
        });
      } else {
        subscription = new AdminSubscription({
          admin: userId,
          plan: plan,
          subscriptionType: plan,
          amount: amount / 100,
          endDate,
          nextBillingDate: endDate, // Set next billing date
          status: 'inactive',
          paymentHistory: [{
            amount: amount / 100,
            paymentDate: new Date(),
            razorpayOrderId: order.id,
            status: 'pending'
          }]
        });
      }
      await subscription.save();
      console.log('Subscription record created/updated successfully');
    } catch (dbError) {
      console.error('Database error creating subscription:', dbError);
      console.error('Error details:', {
        name: dbError.name,
        message: dbError.message,
        code: dbError.code,
        errors: dbError.errors
      });
      return res.status(500).json({
        message: 'Failed to create subscription record',
        error: dbError.message,
        details: dbError.errors || dbError.code
      });
    }

    res.json({
      orderId: order.id,
      currency: order.currency,
      amount: order.amount,
      key: process.env.RAZORPAY_KEY_ID
    });

  } catch (error) {
    console.error('Error creating Razorpay order for admin subscription:', error);
    console.error('Error details:', {
      message: error.message,
      statusCode: error.statusCode,
      error: error.error,
      stack: error.stack
    });
    res.status(500).json({ 
      message: 'Failed to create order', 
      error: error.message,
      details: error.error || error.message
    });
  }
});

// Verify Razorpay payment
router.post('/verify', auth, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const userId = req.user.userId;

    const crypto = require('crypto');
    const shasum = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
    shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const digest = shasum.digest('hex');

    if (digest !== razorpay_signature) {
      return res.status(400).json({ message: 'Payment verification failed: Invalid signature' });
    }

    const subscription = await AdminSubscription.findOne({
      admin: userId,
      'paymentHistory.razorpayOrderId': razorpay_order_id,
      status: 'inactive'
    });

    if (!subscription) {
      return res.status(404).json({ message: 'Pending subscription not found for this order' });
    }

    // Update the payment history entry
    const paymentEntry = subscription.paymentHistory.find(p => p.razorpayOrderId === razorpay_order_id);
    if (paymentEntry) {
      paymentEntry.razorpayPaymentId = razorpay_payment_id;
      paymentEntry.status = 'success';
    }

    subscription.status = 'active';
    subscription.startDate = new Date();
    await subscription.save();

    // Update user role to admin if not already
    const user = await User.findById(userId);
    if (user && user.role === 'user') {
      user.role = 'admin';
      await user.save();
    }

    res.json({ message: 'Payment successful and subscription activated', subscription });

  } catch (error) {
    console.error('Error verifying Razorpay payment for admin subscription:', error);
    res.status(500).json({ message: 'Payment verification failed', error: error.message });
  }
});

// Get subscription status for dashboard
router.get('/dashboard-status', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const subscription = await AdminSubscription.findOne({
      admin: userId,
      status: 'active'
    });

    if (!subscription) {
      return res.json({
        success: true,
        hasActiveSubscription: false,
        status: 'none',
        message: 'No active subscription found'
      });
    }

    const now = new Date();
    const endDate = new Date(subscription.endDate);
    const daysRemaining = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));

    res.json({
      success: true,
      hasActiveSubscription: daysRemaining > 0,
      status: daysRemaining > 0 ? 'active' : 'expired',
      subscription: {
        id: subscription._id,
        plan: subscription.plan,
        amount: subscription.amount,
        status: subscription.status,
        endDate: subscription.endDate,
        nextBillingDate: subscription.nextBillingDate,
        daysRemaining: Math.max(0, daysRemaining),
        isExpiringSoon: daysRemaining <= 7 && daysRemaining > 0
      }
    });

  } catch (error) {
    console.error('Get subscription dashboard status error:', error);
    res.status(500).json({ 
      message: 'Failed to get subscription status',
      error: error.message,
      success: false
    });
  }
});

// Get admin subscription status
router.get('/status', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        message: 'User not found',
        success: false
      });
    }

    const subscription = await AdminSubscription.findOne({ admin: userId });
    
    if (!subscription) {
      return res.json({
        success: true,
        status: 'inactive',
        message: 'No subscription found'
      });
    }

    res.json({
      success: true,
      status: subscription.status,
      subscription: {
        id: subscription._id,
        plan: subscription.subscriptionType,
        status: subscription.status,
        amount: subscription.amount,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        nextBillingDate: subscription.nextBillingDate,
        daysRemaining: subscription.daysRemaining,
        subscriptionStatus: subscription.subscriptionStatus,
        features: subscription.features,
        autoRenew: subscription.autoRenew,
        isActive: subscription.isValid()
      }
    });
  } catch (error) {
    console.error('Get subscription status error:', error);
    res.status(500).json({ 
      message: 'Failed to get subscription status',
      error: error.message,
      success: false
    });
  }
});

// Create subscription payment order
router.post('/create-payment', auth, async (req, res) => {
  try {
    const adminId = req.user.userId;
    const { subscriptionType = 'monthly' } = req.body;
    
    // Check if user is admin
    const admin = await User.findById(adminId);
    if (!admin || admin.role !== 'admin') {
      return res.status(403).json({ 
        message: 'Access denied. Admin role required.',
        success: false
      });
    }

    // Check if admin already has active subscription
    const existingSubscription = await AdminSubscription.findOne({ 
      admin: adminId, 
      status: 'active',
      endDate: { $gt: new Date() }
    });

    if (existingSubscription) {
      return res.status(400).json({
        message: 'You already have an active subscription',
        success: false,
        existingSubscription: {
          endDate: existingSubscription.endDate,
          daysRemaining: existingSubscription.daysRemaining
        }
      });
    }

    // Calculate amount based on subscription type
    let amount;
    switch(subscriptionType) {
      case 'basic':
        amount = 499;
        break;
      case 'professional':
        amount = 1499;
        break;
      case 'enterprise':
        amount = 4999;
        break;
      default:
        amount = 1499; // Default to professional
    }
    const amountInPaise = amount * 100; // Razorpay expects amount in paise

    // Create Razorpay order
    const orderOptions = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: `sub_${adminId.toString().slice(-8)}_${Date.now().toString().slice(-8)}`,
      notes: {
        adminId: adminId.toString(),
        subscriptionType: subscriptionType,
        plan: 'premium'
      }
    };

    // Initialize Razorpay
    const razorpay = initializeRazorpay();
    if (!razorpay) {
      return res.status(500).json({
        message: 'Payment service not available. Please contact support.',
        success: false
      });
    }

    const razorpayOrder = await razorpay.orders.create(orderOptions);

    // Set features based on plan type
    let features = {};
    switch(subscriptionType) {
      case 'basic':
        features = {
          userManagement: true,
          eventManagement: true,
          analytics: false,
          attendanceManagement: false,
          customBranding: false,
          apiAccess: false,
          prioritySupport: false
        };
        break;
      case 'professional':
        features = {
          userManagement: true,
          eventManagement: true,
          analytics: true,
          attendanceManagement: true,
          customBranding: true,
          apiAccess: false,
          prioritySupport: true
        };
        break;
      case 'enterprise':
        features = {
          userManagement: true,
          eventManagement: true,
          analytics: true,
          attendanceManagement: true,
          customBranding: true,
          apiAccess: true,
          prioritySupport: true
        };
        break;
      default:
        features = {
          userManagement: true,
          eventManagement: true,
          analytics: true,
          attendanceManagement: true,
          customBranding: true,
          apiAccess: true,
          prioritySupport: true
        };
    }

    // Create subscription record
    const subscription = new AdminSubscription({
      admin: adminId,
      plan: subscriptionType,
      status: 'inactive', // Will be activated after payment
      subscriptionType: subscriptionType,
      amount: amount,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // All plans are monthly now
      nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      features: features
    });

    await subscription.save();

    res.json({
      success: true,
      message: 'Payment order created successfully',
      order: {
        id: razorpayOrder.id,
        amount: amount,
        currency: 'INR',
        subscriptionId: subscription._id
      },
      subscription: {
        id: subscription._id,
        plan: subscription.plan,
        amount: subscription.amount,
        subscriptionType: subscription.subscriptionType,
        features: subscription.features
      }
    });
  } catch (error) {
    console.error('Create payment order error:', error);
    res.status(500).json({ 
      message: 'Failed to create payment order',
      error: error.message,
      success: false
    });
  }
});

// Verify payment and activate subscription
router.post('/verify-payment', auth, async (req, res) => {
  try {
    const { orderId, paymentId, signature, subscriptionId } = req.body;
    const adminId = req.user.userId;

    // Verify payment signature
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
    hmac.update(`${orderId}|${paymentId}`);
    const generatedSignature = hmac.digest('hex');

    if (generatedSignature !== signature) {
      return res.status(400).json({
        message: 'Invalid payment signature',
        success: false
      });
    }

    // Find subscription
    const subscription = await AdminSubscription.findById(subscriptionId);
    if (!subscription || subscription.admin.toString() !== adminId.toString()) {
      return res.status(404).json({
        message: 'Subscription not found',
        success: false
      });
    }

    // Update subscription with payment details
    subscription.status = 'active';
    subscription.paymentHistory.push({
      amount: subscription.amount,
      paymentDate: new Date(),
      razorpayPaymentId: paymentId,
      razorpayOrderId: orderId,
      status: 'success'
    });

    await subscription.save();

    // Update admin role to premium if needed
    const admin = await User.findById(adminId);
    if (admin.role === 'admin') {
      admin.role = 'premium_admin';
      await admin.save();
    }

    res.json({
      success: true,
      message: 'Payment verified and subscription activated successfully!',
      subscription: {
        id: subscription._id,
        status: subscription.status,
        endDate: subscription.endDate,
        daysRemaining: subscription.daysRemaining,
        features: subscription.features
      }
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ 
      message: 'Failed to verify payment',
      error: error.message,
      success: false
    });
  }
});

// Cancel subscription
router.post('/cancel', auth, async (req, res) => {
  try {
    const adminId = req.user.userId;
    const { reason } = req.body;

    const subscription = await AdminSubscription.findOne({ 
      admin: adminId,
      status: 'active'
    });

    if (!subscription) {
      return res.status(404).json({
        message: 'No active subscription found',
        success: false
      });
    }

    await subscription.cancel();

    // Update admin role to user when subscription is cancelled
    const admin = await User.findById(adminId);
    if (admin.role === 'admin' || admin.role === 'premium_admin') {
      admin.role = 'user';
      await admin.save();
      console.log('User role changed from admin to user after subscription cancellation');
    }

    res.json({
      success: true,
      message: 'Subscription cancelled successfully',
      cancellationDate: subscription.cancellationDate
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ 
      message: 'Failed to cancel subscription',
      error: error.message,
      success: false
    });
  }
});

// Get subscription analytics for super admin
router.get('/analytics', auth, async (req, res) => {
  try {
    const adminId = req.user.userId;
    
    // Check if user is super admin
    const admin = await User.findById(adminId);
    if (!admin || admin.role !== 'super_admin') {
      return res.status(403).json({ 
        message: 'Access denied. Super admin role required.',
        success: false
      });
    }

    const totalSubscriptions = await AdminSubscription.countDocuments();
    const activeSubscriptions = await AdminSubscription.countDocuments({ 
      status: 'active',
      endDate: { $gt: new Date() }
    });
    const expiredSubscriptions = await AdminSubscription.countDocuments({ 
      status: 'expired'
    });
    const cancelledSubscriptions = await AdminSubscription.countDocuments({ 
      status: 'cancelled'
    });

    const totalRevenue = await AdminSubscription.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const monthlyRevenue = await AdminSubscription.aggregate([
      {
        $match: {
          status: 'active',
          'paymentHistory.status': 'success'
        }
      },
      {
        $unwind: '$paymentHistory'
      },
      {
        $match: {
          'paymentHistory.status': 'success',
          'paymentHistory.paymentDate': {
            $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$paymentHistory.amount' }
        }
      }
    ]);

    res.json({
      success: true,
      analytics: {
        totalSubscriptions,
        activeSubscriptions,
        expiredSubscriptions,
        cancelledSubscriptions,
        totalRevenue: totalRevenue[0]?.total || 0,
        monthlyRevenue: monthlyRevenue[0]?.total || 0
      }
    });
  } catch (error) {
    console.error('Get subscription analytics error:', error);
    res.status(500).json({ 
      message: 'Failed to get subscription analytics',
      error: error.message,
      success: false
    });
  }
});

// Reactivate subscription
router.post('/reactivate', auth, async (req, res) => {
  try {
    const adminId = req.user.userId;
    console.log('Reactivate request for admin:', adminId);

    const subscription = await AdminSubscription.findOne({ 
      admin: adminId,
      status: 'cancelled'
    });

    console.log('Found subscription:', subscription ? 'Yes' : 'No');

    if (!subscription) {
      return res.status(404).json({
        message: 'No cancelled subscription found',
        success: false
      });
    }

    // Reactivate the subscription
    try {
      subscription.status = 'active';
      subscription.cancellationDate = null;
      subscription.autoRenew = true;
      await subscription.save();
      console.log('Subscription reactivated successfully');
    } catch (saveError) {
      console.error('Error saving subscription:', saveError);
      return res.status(500).json({
        message: 'Failed to save subscription changes',
        error: saveError.message,
        success: false
      });
    }

    // Update user role to admin when subscription is reactivated
    try {
      const admin = await User.findById(adminId);
      if (admin && admin.role === 'user') {
        admin.role = 'admin';
        await admin.save();
        console.log('User role changed from user to admin after subscription reactivation');
      }
    } catch (userError) {
      console.error('Error updating user role:', userError);
      // Don't fail the request if user update fails
    }

    res.json({
      success: true,
      message: 'Subscription reactivated successfully',
      subscription: {
        id: subscription._id,
        status: subscription.status,
        endDate: subscription.endDate,
        daysRemaining: subscription.daysRemaining
      }
    });
  } catch (error) {
    console.error('Reactivate subscription error:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      errors: error.errors
    });
    res.status(500).json({ 
      message: 'Failed to reactivate subscription',
      error: error.message,
      details: error.errors || error.code,
      success: false
    });
  }
});

// Create renewal order
router.post('/renewal', auth, async (req, res) => {
  try {
    const { plan } = req.body;
    const adminId = req.user.userId;

    console.log('Renewal request for admin:', adminId, 'plan:', plan);

    // Validate plan
    const validPlans = ['basic', 'professional', 'enterprise'];
    if (!validPlans.includes(plan)) {
      return res.status(400).json({
        message: 'Invalid plan selected. Must be basic, professional, or enterprise',
        success: false
      });
    }

    // Calculate amount based on plan
    const planAmounts = {
      basic: 49900,      // ₹499 in paisa
      professional: 99900, // ₹999 in paisa
      enterprise: 199900  // ₹1999 in paisa
    };

    // Initialize Razorpay
    const razorpay = initializeRazorpay();
    if (!razorpay) {
      console.error('Razorpay not initialized for renewal. Check environment variables.');
      console.error('RAZORPAY_KEY_ID:', process.env.RAZORPAY_KEY_ID ? 'Set' : 'Missing');
      console.error('RAZORPAY_KEY_SECRET:', process.env.RAZORPAY_KEY_SECRET ? 'Set' : 'Missing');
      
      // Mock mode for development
      console.log('Using mock mode for renewal order creation');
      const mockOrderId = `mock_renewal_${adminId}_${Date.now()}`;
      const amount = planAmounts[plan] || 99900;
      
      return res.json({
        success: true,
        orderId: mockOrderId,
        amount: amount,
        currency: 'INR',
        message: 'Mock renewal order created (development mode)'
      });
    }

    const amount = planAmounts[plan];
    if (!amount) {
      return res.status(400).json({
        message: 'Invalid plan amount',
        success: false
      });
    }

    // Create Razorpay order
    const orderOptions = {
      amount: amount,
      currency: 'INR',
      receipt: `renewal_${adminId}_${Date.now()}`,
      notes: {
        adminId: adminId,
        plan: plan,
        type: 'renewal'
      }
    };

    try {
      console.log('Creating Razorpay order with options:', orderOptions);
      const order = await razorpay.orders.create(orderOptions);
      console.log('Renewal order created successfully:', order.id);

      res.json({
        success: true,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        message: 'Renewal order created successfully'
      });
    } catch (razorpayError) {
      console.error('Razorpay order creation error:', razorpayError);
      console.error('Error details:', {
        name: razorpayError.name,
        message: razorpayError.message,
        code: razorpayError.code,
        statusCode: razorpayError.statusCode
      });
      res.status(500).json({
        message: 'Failed to create renewal order',
        error: razorpayError.message,
        details: razorpayError.code || razorpayError.statusCode,
        success: false
      });
    }
  } catch (error) {
    console.error('Renewal order error:', error);
    res.status(500).json({
      message: 'Failed to create renewal order',
      error: error.message,
      success: false
    });
  }
});

// Verify renewal payment
router.post('/verify-renewal', auth, async (req, res) => {
  try {
    const { orderId, paymentId, signature } = req.body;
    const adminId = req.user.userId;

    console.log('Renewal verification for admin:', adminId);

    // Initialize Razorpay
    const razorpay = initializeRazorpay();
    if (!razorpay) {
      return res.status(500).json({
        message: 'Payment service not available',
        success: false
      });
    }

    // Handle mock payments (development mode)
    if (orderId.startsWith('mock_') && paymentId.startsWith('mock_payment_') && signature === 'mock_signature') {
      console.log('Mock payment verification for renewal');
      
      // Get plan from existing subscription
      const existingSubscription = await AdminSubscription.findOne({
        admin: adminId,
        status: 'active'
      });

      if (!existingSubscription) {
        return res.status(404).json({
          message: 'No active subscription found',
          success: false
        });
      }

      const plan = existingSubscription.plan || 'professional';
      
      // Extend subscription by 1 month
      const currentEndDate = new Date(existingSubscription.endDate);
      const newEndDate = new Date(currentEndDate);
      newEndDate.setMonth(newEndDate.getMonth() + 1);

      const newNextBillingDate = new Date(newEndDate);

      // Update subscription
      existingSubscription.endDate = newEndDate;
      existingSubscription.nextBillingDate = newNextBillingDate;
      existingSubscription.plan = plan;
      existingSubscription.autoRenew = true;
      existingSubscription.lastPaymentDate = new Date();
      existingSubscription.paymentId = paymentId;
      existingSubscription.orderId = orderId;

      await existingSubscription.save();

      console.log('Mock subscription renewed successfully for admin:', adminId);

      return res.json({
        success: true,
        message: 'Subscription renewed successfully (mock payment)',
        subscription: {
          id: existingSubscription._id,
          plan: existingSubscription.plan,
          endDate: existingSubscription.endDate,
          nextBillingDate: existingSubscription.nextBillingDate,
          daysRemaining: existingSubscription.daysRemaining
        }
      });
    }

    // Verify payment signature for real payments
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    if (expectedSignature !== signature) {
      return res.status(400).json({
        message: 'Invalid payment signature',
        success: false
      });
    }

    // Get order details from Razorpay
    const order = await razorpay.orders.fetch(orderId);
    const plan = order.notes.plan;

    // Find existing subscription
    const existingSubscription = await AdminSubscription.findOne({
      admin: adminId,
      status: 'active'
    });

    if (!existingSubscription) {
      return res.status(404).json({
        message: 'No active subscription found',
        success: false
      });
    }

    // Extend subscription by 1 month
    const currentEndDate = new Date(existingSubscription.endDate);
    const newEndDate = new Date(currentEndDate);
    newEndDate.setMonth(newEndDate.getMonth() + 1);

    const newNextBillingDate = new Date(newEndDate);

    // Update subscription
    existingSubscription.endDate = newEndDate;
    existingSubscription.nextBillingDate = newNextBillingDate;
    existingSubscription.plan = plan;
    existingSubscription.autoRenew = true;
    existingSubscription.lastPaymentDate = new Date();
    existingSubscription.paymentId = paymentId;
    existingSubscription.orderId = orderId;

    await existingSubscription.save();

    console.log('Subscription renewed successfully for admin:', adminId);

    res.json({
      success: true,
      message: 'Subscription renewed successfully',
      subscription: {
        id: existingSubscription._id,
        plan: existingSubscription.plan,
        endDate: existingSubscription.endDate,
        nextBillingDate: existingSubscription.nextBillingDate,
        daysRemaining: existingSubscription.daysRemaining
      }
    });
  } catch (error) {
    console.error('Renewal verification error:', error);
    res.status(500).json({
      message: 'Failed to verify renewal payment',
      error: error.message,
      success: false
    });
  }
});

module.exports = router;

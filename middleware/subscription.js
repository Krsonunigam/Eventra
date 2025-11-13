const AdminSubscription = require('../models/AdminSubscription');
const User = require('../models/User');

// Middleware to check if admin has active subscription
const checkSubscription = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({ 
        message: 'Authentication required',
        success: false 
      });
    }

    // Check if user is admin
    const user = await User.findById(userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ 
        message: 'Admin access required',
        success: false 
      });
    }

    // Check for active subscription
    const subscription = await AdminSubscription.findOne({
      admin: userId,
      status: 'active',
      endDate: { $gt: new Date() }
    });

    if (!subscription) {
      // Check if subscription exists but is expired
      const expiredSubscription = await AdminSubscription.findOne({
        admin: userId,
        status: 'active',
        endDate: { $lte: new Date() }
      });

      if (expiredSubscription) {
        // Mark subscription as expired
        expiredSubscription.status = 'expired';
        await expiredSubscription.save();

        // Remove admin role
        user.role = 'user';
        await user.save();
      }

      return res.status(403).json({ 
        message: 'Active subscription required for admin access',
        success: false,
        subscriptionRequired: true,
        redirectTo: '/admin/subscription'
      });
    }

    // Add subscription info to request
    req.subscription = subscription;
    next();

  } catch (error) {
    console.error('Subscription check error:', error);
    res.status(500).json({ 
      message: 'Failed to verify subscription',
      success: false,
      error: error.message 
    });
  }
};

// Middleware to check subscription status without blocking access
const checkSubscriptionStatus = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    
    if (userId) {
      const subscription = await AdminSubscription.findOne({
        admin: userId,
        status: 'active',
        endDate: { $gt: new Date() }
      });

      if (subscription) {
        req.subscription = subscription;
      }
    }

    next();
  } catch (error) {
    console.error('Subscription status check error:', error);
    next(); // Continue even if subscription check fails
  }
};

// Function to check if subscription is expiring soon
const isSubscriptionExpiringSoon = (subscription, daysThreshold = 7) => {
  if (!subscription || subscription.status !== 'active') {
    return false;
  }

  const now = new Date();
  const endDate = new Date(subscription.endDate);
  const daysUntilExpiry = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
  
  return daysUntilExpiry <= daysThreshold && daysUntilExpiry > 0;
};

// Function to get subscription status for dashboard
const getSubscriptionStatus = async (userId) => {
  try {
    const subscription = await AdminSubscription.findOne({
      admin: userId,
      status: 'active'
    });

    if (!subscription) {
      return {
        hasActiveSubscription: false,
        status: 'none'
      };
    }

    const now = new Date();
    const endDate = new Date(subscription.endDate);
    const daysRemaining = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));

    return {
      hasActiveSubscription: daysRemaining > 0,
      status: daysRemaining > 0 ? 'active' : 'expired',
      subscription,
      daysRemaining: Math.max(0, daysRemaining),
      isExpiringSoon: isSubscriptionExpiringSoon(subscription)
    };
  } catch (error) {
    console.error('Get subscription status error:', error);
    return {
      hasActiveSubscription: false,
      status: 'error'
    };
  }
};

module.exports = {
  checkSubscription,
  checkSubscriptionStatus,
  isSubscriptionExpiringSoon,
  getSubscriptionStatus
};


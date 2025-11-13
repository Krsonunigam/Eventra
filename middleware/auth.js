const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AdminSubscription = require('../models/AdminSubscription');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    console.log('Auth middleware - Token received:', token ? 'Yes' : 'No');

    if (!token) {
      console.log('Auth middleware - No token provided');
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Auth middleware - Token decoded successfully for user:', decoded.userId);
    console.log('Auth middleware - Decoded user ID type:', typeof decoded.userId);
    const user = await User.findById(decoded.userId);

    if (!user) {
      console.log('Auth middleware - User not found for ID:', decoded.userId);
      return res.status(401).json({ message: 'Invalid token' });
    }

    if (!user.isActive) {
      console.log('Auth middleware - User account is deactivated');
      return res.status(401).json({ message: 'Account is deactivated' });
    }

    req.user = {
      userId: user._id,
      role: user.role,
      email: user.email
    };

    console.log('Auth middleware - User authenticated successfully:', user.email);
    console.log('Auth middleware - Set req.user.userId to:', user._id);
    console.log('Auth middleware - User ID type:', typeof user._id);
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    console.error('JWT_SECRET available:', process.env.JWT_SECRET ? 'Yes' : 'No');
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Admin only middleware
const adminAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    if (user.role !== 'admin' && user.role !== 'premium_admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    req.user = {
      userId: user._id,
      role: user.role,
      email: user.email
    };

    next();
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Premium admin middleware (requires active subscription)
const premiumAdminAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    if (user.role !== 'admin' && user.role !== 'premium_admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    // Check for active subscription
    const subscription = await AdminSubscription.findOne({ 
      admin: user._id,
      status: 'active',
      endDate: { $gt: new Date() }
    });

    if (!subscription && user.role !== 'super_admin') {
      return res.status(403).json({ 
        message: 'Premium subscription required for this feature',
        requiresSubscription: true,
        subscriptionUrl: '/admin/subscription'
      });
    }

    req.user = {
      userId: user._id,
      role: user.role,
      email: user.email,
      subscription: subscription
    };

    next();
  } catch (error) {
    console.error('Premium admin auth middleware error:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = { auth, adminAuth, premiumAdminAuth };

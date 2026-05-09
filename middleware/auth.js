const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AdminSubscription = require('../models/AdminSubscription');

const auth = async (req, res, next) => {
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

    if (!user.isActive) {
      
      return res.status(401).json({ message: 'Account is deactivated' });
    }

    req.user = {
      userId: user._id,
      role: user.role,
      email: user.email
    };

    
    
    
    next();
  } catch (error) {
    
    
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
    
    res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = { auth, adminAuth, premiumAdminAuth };

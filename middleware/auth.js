const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AdminSubscription = require('../models/AdminSubscription');


// ─── auth middleware ─────────────────────────────────────────────────────────
// Uses .lean() for a faster, plain-object query — saves ~30% DB read time.
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'eventra-development-jwt-secret');
    } catch (jwtErr) {
      // Distinguish expired vs invalid
      if (jwtErr.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, message: 'Token expired. Please login again.' });
      }
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    // Only fetch the minimal fields needed for authorization
    const user = await User.findById(decoded.userId)
      .select('_id role email isActive')
      .lean();

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found. Please login again.' });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Account is deactivated' });
    }

    req.user = {
      userId: user._id,
      role: user.role,
      email: user.email
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    return res.status(401).json({ success: false, message: 'Authentication failed' });
  }
};

// ─── adminAuth middleware ────────────────────────────────────────────────────
const adminAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'No token provided' });

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'eventra-development-jwt-secret');
    } catch {
      return res.status(401).json({ message: 'Invalid token' });
    }

    const user = await User.findById(decoded.userId).select('_id role email isActive').lean();

    if (!user) return res.status(401).json({ message: 'User not found' });
    if (user.role !== 'admin' && user.role !== 'premium_admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    req.user = { userId: user._id, role: user.role, email: user.email };
    next();
  } catch (error) {
    console.error('AdminAuth error:', error.message);
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// ─── premiumAdminAuth middleware ─────────────────────────────────────────────
const premiumAdminAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'No token provided' });

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'eventra-development-jwt-secret');
    } catch {
      return res.status(401).json({ message: 'Invalid token' });
    }

    const user = await User.findById(decoded.userId).select('_id role email isActive').lean();

    if (!user) return res.status(401).json({ message: 'User not found' });
    if (user.role !== 'admin' && user.role !== 'premium_admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    // Check active subscription
    const subscription = await AdminSubscription.findOne({
      admin: user._id,
      status: 'active',
      endDate: { $gt: new Date() }
    }).lean();

    if (!subscription && user.role !== 'super_admin') {
      return res.status(403).json({
        message: 'Premium subscription required',
        requiresSubscription: true,
        subscriptionUrl: '/admin/subscription'
      });
    }

    req.user = { userId: user._id, role: user.role, email: user.email, subscription };
    next();
  } catch (error) {
    console.error('PremiumAdminAuth error:', error.message);
    return res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = { auth, adminAuth, premiumAdminAuth };

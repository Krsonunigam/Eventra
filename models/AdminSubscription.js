const mongoose = require('mongoose');

const adminSubscriptionSchema = new mongoose.Schema({
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  plan: {
    type: String,
    enum: ['basic', 'professional', 'enterprise'],
    default: 'basic'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'expired', 'cancelled'],
    default: 'inactive'
  },
  subscriptionType: {
    type: String,
    enum: ['basic', 'professional', 'enterprise'],
    default: 'basic'
  },
  amount: {
    type: Number,
    required: true,
    default: 1000 // 1000 per month
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true
  },
  nextBillingDate: {
    type: Date,
    required: true
  },
  paymentHistory: [{
    amount: Number,
    paymentDate: Date,
    razorpayPaymentId: String,
    razorpayOrderId: String,
    status: {
      type: String,
      enum: ['success', 'failed', 'pending'],
      default: 'pending'
    }
  }],
  features: {
    userManagement: {
      type: Boolean,
      default: true
    },
    eventManagement: {
      type: Boolean,
      default: true
    },
    analytics: {
      type: Boolean,
      default: true
    },
    attendanceManagement: {
      type: Boolean,
      default: true
    },
    customBranding: {
      type: Boolean,
      default: false
    },
    apiAccess: {
      type: Boolean,
      default: false
    },
    prioritySupport: {
      type: Boolean,
      default: false
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  autoRenew: {
    type: Boolean,
    default: true
  },
  cancellationDate: {
    type: Date,
    default: null
  },
  notes: {
    type: String,
    maxlength: 500
  }
}, {
  timestamps: true
});

// Indexes for better performance
adminSubscriptionSchema.index({ admin: 1 });
adminSubscriptionSchema.index({ status: 1 });
adminSubscriptionSchema.index({ endDate: 1 });
adminSubscriptionSchema.index({ nextBillingDate: 1 });

// Virtual for days remaining
adminSubscriptionSchema.virtual('daysRemaining').get(function() {
  const now = new Date();
  const end = new Date(this.endDate);
  const diffTime = end - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
});

// Virtual for subscription status
adminSubscriptionSchema.virtual('subscriptionStatus').get(function() {
  const now = new Date();
  if (this.status === 'cancelled') return 'cancelled';
  if (this.status === 'inactive') return 'inactive';
  if (now > this.endDate) return 'expired';
  if (this.daysRemaining <= 7) return 'expiring_soon';
  return 'active';
});

// Method to check if subscription is valid
adminSubscriptionSchema.methods.isValid = function() {
  const now = new Date();
  return this.status === 'active' && now <= this.endDate;
};

// Method to check if admin has specific feature access
adminSubscriptionSchema.methods.hasFeature = function(feature) {
  return this.isValid() && this.features[feature] === true;
};

// Method to renew subscription
adminSubscriptionSchema.methods.renew = function(months = 1) {
  const now = new Date();
  this.startDate = now;
  this.endDate = new Date(now.getTime() + (months * 30 * 24 * 60 * 60 * 1000));
  this.nextBillingDate = this.endDate;
  this.status = 'active';
  return this.save();
};

// Method to cancel subscription
adminSubscriptionSchema.methods.cancel = function() {
  this.status = 'cancelled';
  this.cancellationDate = new Date();
  this.autoRenew = false;
  return this.save();
};

// Static method to get active subscriptions
adminSubscriptionSchema.statics.getActiveSubscriptions = function() {
  return this.find({
    status: 'active',
    endDate: { $gt: new Date() }
  }).populate('admin', 'name email');
};

// Static method to get expiring subscriptions
adminSubscriptionSchema.statics.getExpiringSubscriptions = function(days = 7) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  
  return this.find({
    status: 'active',
    endDate: { $lte: futureDate, $gt: new Date() }
  }).populate('admin', 'name email');
};

// Pre-save middleware to set end date if not provided
adminSubscriptionSchema.pre('save', function() {
  if (this.isNew && !this.endDate) {
    const start = this.startDate || new Date();
    // All subscription types are monthly (1 month duration)
    const months = 1;
    this.endDate = new Date(start.getTime() + (months * 30 * 24 * 60 * 60 * 1000));
    this.nextBillingDate = this.endDate;
  }
});

// Ensure virtual fields are serialized
adminSubscriptionSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('AdminSubscription', adminSubscriptionSchema);

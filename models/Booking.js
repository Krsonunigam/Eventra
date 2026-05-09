const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    default: 1,
    min: 1
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'refunded'],
    default: 'pending'
  },
  razorpayOrderId: {
    type: String,
    required: false,
    default: null
  },
  razorpayPaymentId: {
    type: String,
    default: null
  },
  paymentDate: {
    type: Date,
    default: null
  },
  verificationCode: {
    type: String,
    required: true,
    unique: true
  },
  attendanceMarked: {
    type: Boolean,
    default: false
  },
  attendanceTime: {
    type: Date,
    default: null
  },
  cancelledAt: {
    type: Date,
    default: null
  },
  cancellationReason: {
    type: String,
    default: null
  },
  refundAmount: {
    type: Number,
    default: 0
  },
  refundDate: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for better performance
bookingSchema.index({ user: 1, event: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ verificationCode: 1 });
bookingSchema.index({ razorpayOrderId: 1 });
bookingSchema.index({ razorpayPaymentId: 1 });

// Virtual for booking duration
bookingSchema.virtual('bookingDuration').get(function() {
  if (this.paymentDate) {
    return Math.floor((this.paymentDate - this.createdAt) / (1000 * 60)); // in minutes
  }
  return null;
});

// Virtual for attendance status
bookingSchema.virtual('attendanceStatus').get(function() {
  if (this.attendanceMarked) {
    return 'present';
  } else if (this.status === 'confirmed') {
    return 'absent';
  } else {
    return 'not_applicable';
  }
});

// Method to check if booking is active
bookingSchema.methods.isActive = function() {
  return this.status === 'confirmed' && !this.attendanceMarked;
};

// Method to check if booking can be cancelled
bookingSchema.methods.canBeCancelled = function() {
  return this.status === 'confirmed' && !this.attendanceMarked;
};

// Method to get booking summary
bookingSchema.methods.getSummary = function() {
  return {
    id: this._id,
    eventTitle: this.event?.title || 'Event not found',
    status: this.status,
    totalAmount: this.totalAmount,
    quantity: this.quantity,
    attendanceMarked: this.attendanceMarked,
    attendanceTime: this.attendanceTime,
    createdAt: this.createdAt,
    paymentDate: this.paymentDate
  };
};

// Pre-save middleware to generate verification code
bookingSchema.pre('save', function(next) {
  if (this.isNew && !this.verificationCode) {
    this.verificationCode = generateVerificationCode();
  }
  next();
});

// Helper function to generate verification code
function generateVerificationCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Static method to get booking statistics
bookingSchema.statics.getStats = async function(userId = null) {
  const match = userId ? { user: userId } : {};
  
  const stats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$totalAmount' }
      }
    }
  ]);

  return stats.reduce((acc, stat) => {
    acc[stat._id] = {
      count: stat.count,
      totalAmount: stat.totalAmount
    };
    return acc;
  }, {});
};

// Static method to get bookings by date range
bookingSchema.statics.getByDateRange = function(startDate, endDate, userId = null) {
  const match = {
    createdAt: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  };

  if (userId) {
    match.user = userId;
  }

  return this.find(match)
    .populate('user', 'name email studentId')
    .populate('event', 'title dateTime venue')
    .sort({ createdAt: -1 });
};

module.exports = mongoose.model('Booking', bookingSchema);
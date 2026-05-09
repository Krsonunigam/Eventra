const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
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
  attendance: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Attendance',
    required: true
  },
  certificateId: {
    type: String,
    required: true,
    unique: true
  },
  certificateNumber: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  issuedDate: {
    type: Date,
    default: Date.now
  },
  validFrom: {
    type: Date,
    required: true
  },
  validUntil: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'revoked'],
    default: 'active'
  },
  verificationCode: {
    type: String,
    required: true,
    unique: true
  },
  pdfPath: {
    type: String,
    default: ''
  },
  metadata: {
    eventDuration: Number, // in hours
    attendanceMethod: String,
    confidence: Number,
    issuedBy: String,
    organization: String
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verifiedAt: {
    type: Date,
    default: null
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

// Indexes for better performance
certificateSchema.index({ user: 1, event: 1 });
certificateSchema.index({ certificateId: 1 });
certificateSchema.index({ certificateNumber: 1 });
certificateSchema.index({ verificationCode: 1 });
certificateSchema.index({ status: 1 });

// Virtual for validity status
certificateSchema.virtual('isValid').get(function() {
  const now = new Date();
  return this.status === 'active' && 
         this.validFrom <= now && 
         this.validUntil >= now;
});

// Virtual for days until expiration
certificateSchema.virtual('daysUntilExpiration').get(function() {
  const now = new Date();
  const diffTime = this.validUntil - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Method to verify certificate
certificateSchema.methods.verify = function() {
  this.isVerified = true;
  this.verifiedAt = new Date();
  return this.save();
};

// Method to revoke certificate
certificateSchema.methods.revoke = function() {
  this.status = 'revoked';
  return this.save();
};

// Static method to generate certificate ID
certificateSchema.statics.generateCertificateId = function() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'CERT-';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Static method to generate certificate number
certificateSchema.statics.generateCertificateNumber = function() {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `CERT-${year}${month}-${random}`;
};

// Static method to generate verification code
certificateSchema.statics.generateVerificationCode = function() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Pre-save middleware to generate IDs if not provided
certificateSchema.pre('save', function(next) {
  if (this.isNew) {
    if (!this.certificateId) {
      this.certificateId = this.constructor.generateCertificateId();
    }
    if (!this.certificateNumber) {
      this.certificateNumber = this.constructor.generateCertificateNumber();
    }
    if (!this.verificationCode) {
      this.verificationCode = this.constructor.generateVerificationCode();
    }
  }
  next();
});

// Ensure virtual fields are serialized
certificateSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Certificate', certificateSchema);

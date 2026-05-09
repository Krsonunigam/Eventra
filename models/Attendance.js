const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  method: {
    type: String,
    enum: ['qr', 'face', 'rfid', 'booking', 'manual', 'qr_override', 'face_override'],
    required: true
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['present', 'late', 'absent'],
    default: 'present'
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1,
    default: null
  },
  location: {
    latitude: Number,
    longitude: Number,
    address: String
  },
  deviceInfo: {
    userAgent: String,
    platform: String,
    browser: String
  },
  notes: {
    type: String,
    maxlength: 500
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  verifiedAt: {
    type: Date,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
attendanceSchema.index({ userId: 1, eventId: 1, timestamp: 1 });
attendanceSchema.index({ eventId: 1, timestamp: 1 });
attendanceSchema.index({ userId: 1, timestamp: -1 });

// Virtual for date (without time)
attendanceSchema.virtual('date').get(function() {
  return new Date(this.timestamp.getFullYear(), this.timestamp.getMonth(), this.timestamp.getDate());
});

// Ensure virtual fields are serialized
attendanceSchema.set('toJSON', { virtuals: true });

// Pre-save middleware (no-op for virtual date - handled by virtual getter)
attendanceSchema.pre('save', function(next) {
  next();
});

module.exports = mongoose.model('Attendance', attendanceSchema);
const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  venue: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    address: {
      type: String,
      required: false,
      trim: true,
      default: ''
    },
    city: {
      type: String,
      required: true,
      trim: true
    },
    coordinates: {
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null }
    }
  },
  dateTime: {
    start: {
      type: Date,
      required: true
    },
    end: {
      type: Date,
      required: true
    }
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  capacity: {
    type: Number,
    required: true,
    min: 1
  },
  availableSeats: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    required: true,
    enum: ['Technology', 'Sports', 'Music', 'Art', 'Business', 'Science', 'Literature', 'Gaming', 'Photography', 'Dance', 'Conference', 'Workshop', 'Seminar']
  },
  image: {
    type: String,
    default: ''
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'cancelled', 'completed'],
    default: 'draft'
  },
  registrationDeadline: {
    type: Date,
    required: true
  },
  cancellationPolicy: {
    allowCancellation: {
      type: Boolean,
      default: true
    },
    cancellationDeadline: {
      type: Date,
      required: function() {
        return this.cancellationPolicy && this.cancellationPolicy.allowCancellation && this.cancellationPolicy.cancellationDeadline !== null;
      }
    },
    refundPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 100
    }
  },
  requirements: {
    minAge: {
      type: Number,
      default: 18
    },
    maxAge: {
      type: Number,
      default: null
    },
    dressCode: {
      type: String,
      default: ''
    },
    itemsToBring: [String]
  },
  tags: [String],
  detailedSchedule: [{
    time: String,
    activity: String,
    speaker: String
  }],
  sponsors: [String],
  organizerContact: {
    email: String,
    phone: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Virtual for duration in hours
eventSchema.virtual('duration').get(function() {
  return (this.dateTime.end - this.dateTime.start) / (1000 * 60 * 60);
});

// Virtual for days until event
eventSchema.virtual('daysUntilEvent').get(function() {
  const now = new Date();
  const eventDate = new Date(this.dateTime.start);
  const diffTime = eventDate - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Index for better query performance
eventSchema.index({ dateTime: 1, status: 1 });
eventSchema.index({ category: 1, status: 1 });
eventSchema.index({ organizer: 1 });

module.exports = mongoose.model('Event', eventSchema);

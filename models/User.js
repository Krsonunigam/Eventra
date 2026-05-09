const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');


const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  username: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  profilePicture: {
    type: String,
    default: null
  },
  phoneNumber: {
    type: String,
    default: null
  },
  studentId: {
    type: String,
    default: null
  },
  institute: {
    type: String,
    default: null
  },
  department: {
    type: String,
    default: null
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other', 'Prefer not to say', ''],
    default: ''
  },
  dateOfBirth: {
    type: Date,
    default: null
  },
  bio: {
    type: String,
    default: ''
  },
  socialLinks: {
    linkedin: { type: String, default: '' },
    github: { type: String, default: '' },
    twitter: { type: String, default: '' },
    website: { type: String, default: '' }
  },
  notificationPreferences: {
    email: { type: Boolean, default: true },
    push: { type: Boolean, default: true },
    sms: { type: Boolean, default: false }
  },
  privacySettings: {
    profileVisibility: { type: String, enum: ['public', 'friends', 'private'], default: 'public' },
    showEmail: { type: Boolean, default: false },
    showPhone: { type: Boolean, default: false }
  },
  phone: {
    type: String,
    default: null
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  preferences: {
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      push: { type: Boolean, default: true }
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'auto'
    }
  },
  
  // Face Recognition Fields
  faceImages: [String],
  faceData: [String],
  faceDataCollected: {
    type: Boolean,
    default: false
  },
  faceDataQuality: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  isFaceVerified: {
    type: Boolean,
    default: false
  },
  faceTrainingCompleted: {
    type: Boolean,
    default: false
  },
  faceTrainingDate: {
    type: Date,
    default: null
  },
  faceSampleCount: {
    type: Number,
    default: 0
  },
  faceVerificationDate: {
    type: Date,
    default: null
  },
  faceVerificationConfidence: {
    type: Number,
    default: 0
  },
  
  // MongoDB Image Storage Fields
  faceImages: [{
    imageData: {
      type: String, // Base64 encoded image
      required: true
    },
    imageType: {
      type: String,
      enum: ['jpeg', 'png', 'webp'],
      default: 'jpeg'
    },
    imageSize: {
      type: Number, // Size in bytes
      required: true
    },
    imageQuality: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    capturedAt: {
      type: Date,
      default: Date.now
    },
    isProcessed: {
      type: Boolean,
      default: false
    },
    processingNotes: {
      type: String,
      default: null
    }
  }],
  
  // Image Recognition Fields
  base64Images: [{
    type: String, // Store base64 encoded image strings
    required: true
  }],
  imageRecognitionData: {
    isRegistered: { type: Boolean, default: false },
    lastRegisteredDate: { type: Date, default: null },
    verificationAttempts: { type: Number, default: 0 },
    lastVerificationAttempt: { type: Date, default: null },
    isVerified: { type: Boolean, default: false },
    verificationConfidence: { type: Number, default: 0 }
  },
  
  // RFID Cards
  rfidCards: [{
    cardId: {
      type: String,
      required: true
    },
    cardType: {
      type: String,
      enum: ['standard', 'premium', 'admin'],
      default: 'standard'
    },
    isActive: {
      type: Boolean,
      default: true
    },
    issuedAt: {
      type: Date,
      default: Date.now
    },
    lastUsed: {
      type: Date,
      default: null
    }
  }],

  // NFC Cards
nfcCards: [{
  cardId: {
    type: String,
    default: null
  },
  cardName: {
    type: String,
    default: 'NFC Card'
  },
  cardType: {
    type: String,
    enum: ['student', 'staff', 'visitor', 'admin'],
    default: 'student'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}],

  // Fingerprint Data
  fingerprintData: {
    isRegistered: {
      type: Boolean,
      default: false
    },
    fingerprintId: {
      type: String,
      default: null
    },
    registeredAt: {
      type: Date,
      default: null
    },
    lastVerified: {
      type: Date,
      default: null
    },
    verificationCount: {
      type: Number,
      default: 0
    },
    fingerprintQuality: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    fingerprintTemplate: {
      type: String, // Encrypted fingerprint template
      default: null
    }
  },
  
  // Attendance tracking
  lastAttendanceAt: {
    type: Date,
    default: null
  },
  totalAttendanceCount: {
    type: Number,
    default: 0
  },
  
  // Account status
  lastLoginAt: {
    type: Date,
    default: null
  },
  loginCount: {
    type: Number,
    default: 0
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output

userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.faceData; // Don't expose face data
  delete user.base64Images; // Don't expose base64 images
  delete user.faceImages; // Don't expose face images
  if (user.fingerprintData && user.fingerprintData.fingerprintTemplate) {
    delete user.fingerprintData.fingerprintTemplate; // Don't expose fingerprint template
  }
  return user;
};


// Helper methods for image management
userSchema.methods.addFaceImage = function(imageData, imageType = 'jpeg', quality = 'medium') {
  const imageSize = Buffer.from(imageData, 'base64').length;
  
  this.faceImages.push({
    imageData: imageData,
    imageType: imageType,
    imageSize: imageSize,
    imageQuality: quality,
    capturedAt: new Date(),
    isProcessed: false
  });
  
  return this.save();
};

userSchema.methods.getFaceImages = function() {
  return this.faceImages.map(img => ({
    id: img._id,
    imageType: img.imageType,
    imageSize: img.imageSize,
    imageQuality: img.imageQuality,
    capturedAt: img.capturedAt,
    isProcessed: img.isProcessed
  }));
};

userSchema.methods.removeFaceImage = function(imageId) {
  this.faceImages = this.faceImages.filter(img => img._id.toString() !== imageId);
  return this.save();
};

userSchema.methods.clearAllFaceImages = function() {
  this.faceImages = [];
  return this.save();
};

userSchema.methods.getImageStorageStats = function() {
  const totalImages = this.faceImages.length;
  const totalSize = this.faceImages.reduce((sum, img) => sum + img.imageSize, 0);
  const processedImages = this.faceImages.filter(img => img.isProcessed).length;
  
  return {
    totalImages,
    totalSize,
    processedImages,
    unprocessedImages: totalImages - processedImages,
    averageImageSize: totalImages > 0 ? Math.round(totalSize / totalImages) : 0
  };
};

// Helper methods for NFC cards
userSchema.methods.addNFCCard = function(cardId, cardName = 'NFC Card', cardType = 'student') {
  const newCard = {
    cardId: cardId,
    cardName: cardName,
    cardType: cardType,
    issuedAt: new Date(),
    expiryDate: new Date(Date.now() + (365 * 24 * 60 * 60 * 1000)) // 1 year from now
  };
  
  this.nfcCards.push(newCard);
  return this.save();
};

userSchema.methods.getActiveNFCCards = function() {
  return this.nfcCards.filter(card => card.isActive && card.cardStatus === 'active');
};

userSchema.methods.blockNFCCard = function(cardId) {
  const card = this.nfcCards.find(c => c.cardId === cardId);
  if (card) {
    card.cardStatus = 'blocked';
    return this.save();
  }
  return false;
};

// Helper methods for RFID cards
userSchema.methods.addRFIDCard = function(cardId, cardType = 'standard') {
  const newCard = {
    cardId: cardId,
    cardType: cardType,
    issuedAt: new Date()
  };
  
  this.rfidCards.push(newCard);
  return this.save();
};

userSchema.methods.getActiveRFIDCards = function() {
  return this.rfidCards.filter(card => card.isActive);
};

// Helper methods for fingerprint
userSchema.methods.registerFingerprint = function(fingerprintId, fingerprintTemplate) {
  this.fingerprintData = {
    isRegistered: true,
    fingerprintId: fingerprintId,
    registeredAt: new Date(),
    fingerprintQuality: 'high',
    fingerprintTemplate: fingerprintTemplate
  };
  return this.save();
};

userSchema.methods.verifyFingerprint = function() {
  if (this.fingerprintData.isRegistered) {
    this.fingerprintData.lastVerified = new Date();
    this.fingerprintData.verificationCount += 1;
    return this.save();
  }
  return false;
};
module.exports = mongoose.model('User', userSchema);

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const faceImageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  public_id: { type: String, required: true }
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: {
    type: String, required: true, unique: true, lowercase: true, trim: true,
    index: true
  },
  username: { type: String, unique: true, sparse: true, trim: true },
  password: {
    type: String,
    required: function () { return this.authProvider !== 'google'; },
    minlength: 6
  },
  authProvider: { type: String, enum: ['local', 'google'], default: 'local' },
  googleId: { type: String, unique: true, sparse: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  isActive: { type: Boolean, default: true },
  emailVerified: { type: Boolean, default: false },
  profilePicture: { type: String, default: null },
  phoneNumber: { type: String, default: null },
  studentId: { type: String, default: null },
  institute: { type: String, default: null },
  department: { type: String, default: null },
  gender: { type: String, enum: ['Male', 'Female', 'Other', 'Prefer not to say', ''], default: '' },
  dateOfBirth: { type: Date, default: null },
  bio: { type: String, default: '' },
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
  phone: { type: String, default: null },
  address: {
    street: String, city: String, state: String, zipCode: String, country: String
  },
  preferences: {
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      push: { type: Boolean, default: true }
    },
    theme: { type: String, enum: ['light', 'dark', 'auto'], default: 'auto' }
  },

  // OTP Reset Fields
  resetPasswordOTP: { type: String, default: null },
  resetPasswordExpires: { type: Date, default: null },
  resetPasswordAttempts: { type: Number, default: 0 },

  // ─── Face Recognition Fields ────────────────────────────────────────────────
  // Stores Cloudinary URLs + public_ids for the 25 face samples
  faceImages: { type: [faceImageSchema], default: [] },

  // Raw face descriptor data for recognition algorithm
  faceData: { type: String, default: null },

  faceDataCollected: { type: Boolean, default: false },
  faceDataQuality: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  isFaceVerified: { type: Boolean, default: false },
  faceTrainingCompleted: { type: Boolean, default: false },
  faceTrainingDate: { type: Date, default: null },
  faceSampleCount: { type: Number, default: 0 },
  faceVerificationDate: { type: Date, default: null },
  faceVerificationConfidence: { type: Number, default: 0 },
  // ────────────────────────────────────────────────────────────────────────────

  // Image Recognition Fields
  base64Images: [{ type: String }],
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
    cardId: { type: String, required: true },
    cardType: { type: String, enum: ['standard', 'premium', 'admin'], default: 'standard' },
    isActive: { type: Boolean, default: true },
    issuedAt: { type: Date, default: Date.now },
    lastUsed: { type: Date, default: null }
  }],

  // NFC Cards
  nfcCards: [{
    cardId: { type: String, default: null },
    cardName: { type: String, default: 'NFC Card' },
    cardType: { type: String, enum: ['student', 'staff', 'visitor', 'admin'], default: 'student' },
    isActive: { type: Boolean, default: true }
  }],

  // Fingerprint Data
  fingerprintData: {
    isRegistered: { type: Boolean, default: false },
    fingerprintId: { type: String, default: null },
    registeredAt: { type: Date, default: null },
    lastVerified: { type: Date, default: null },
    verificationCount: { type: Number, default: 0 },
    fingerprintQuality: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    fingerprintTemplate: { type: String, default: null }
  },

  // Attendance tracking
  lastAttendanceAt: { type: Date, default: null },
  totalAttendanceCount: { type: Number, default: 0 },

  // Account status
  lastLoginAt: { type: Date, default: null },
  loginCount: { type: Number, default: 0 }

}, { timestamps: true });

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ role: 1 });
userSchema.index({ faceDataCollected: 1 });

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove sensitive fields from JSON output
// NOTE: We intentionally keep faceImages so the frontend can confirm upload success
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  delete user.faceData;           // raw descriptor data – never expose
  delete user.base64Images;       // don't expose base64 blobs
  delete user.resetPasswordOTP;
  delete user.resetPasswordExpires;
  if (user.fingerprintData && user.fingerprintData.fingerprintTemplate) {
    delete user.fingerprintData.fingerprintTemplate;
  }
  return user;
};

// Helper: add a face image (url + public_id object)
userSchema.methods.addFaceImage = function (url, public_id) {
  this.faceImages.push({ url, public_id });
  return this.save();
};

userSchema.methods.clearAllFaceImages = function () {
  this.faceImages = [];
  return this.save();
};

// Helper methods for NFC cards
userSchema.methods.addNFCCard = function (cardId, cardName = 'NFC Card', cardType = 'student') {
  this.nfcCards.push({ cardId, cardName, cardType });
  return this.save();
};

// Helper methods for RFID cards
userSchema.methods.addRFIDCard = function (cardId, cardType = 'standard') {
  this.rfidCards.push({ cardId, cardType, issuedAt: new Date() });
  return this.save();
};

// Helper methods for fingerprint
userSchema.methods.registerFingerprint = function (fingerprintId, fingerprintTemplate) {
  this.fingerprintData = {
    isRegistered: true,
    fingerprintId,
    registeredAt: new Date(),
    fingerprintQuality: 'high',
    fingerprintTemplate
  };
  return this.save();
};

module.exports = mongoose.model('User', userSchema);

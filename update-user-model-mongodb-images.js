const fs = require('fs');
const path = require('path');

console.log('🔧 UPDATING USER MODEL FOR MONGODB IMAGE STORAGE\n');
console.log('=' .repeat(60));

// Path to the User model
const userModelPath = path.join(__dirname, 'models', 'User.js');

try {
  // Read the current User model
  let userModelCode = fs.readFileSync(userModelPath, 'utf8');
  
  console.log('📋 Current User model found');
  console.log(`   Path: ${userModelPath}`);
  
  // Create a backup
  const backupPath = userModelPath + '.backup';
  fs.writeFileSync(backupPath, userModelCode);
  console.log(`✅ Backup created: ${backupPath}`);
  
  // Enhanced User schema with MongoDB image storage
  const enhancedUserSchema = `
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
  faceData: {
    type: String, // JSON string of face embeddings
    default: null
  },
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
});`;

  // Find and replace the userSchema definition
  const schemaStartPattern = 'const userSchema = new mongoose.Schema({';
  const schemaEndPattern = '}, {';
  
  const schemaStartIndex = userModelCode.indexOf(schemaStartPattern);
  const schemaEndIndex = userModelCode.indexOf(schemaEndPattern, schemaStartIndex);
  
  if (schemaStartIndex !== -1 && schemaEndIndex !== -1) {
    const beforeSchema = userModelCode.substring(0, schemaStartIndex);
    const afterSchema = userModelCode.substring(schemaEndIndex);
    const newSchema = beforeSchema + enhancedUserSchema + afterSchema;
    userModelCode = newSchema;
    console.log('✅ Updated User schema with MongoDB image storage fields');
  } else {
    console.log('⚠️ Could not find exact schema to replace');
  }
  
  // Add helper methods for image management
  const imageHelperMethods = `
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
};`;

  // Add the helper methods before the module.exports
  const moduleExportsIndex = userModelCode.lastIndexOf('module.exports = mongoose.model');
  if (moduleExportsIndex !== -1) {
    const beforeExports = userModelCode.substring(0, moduleExportsIndex);
    const afterExports = userModelCode.substring(moduleExportsIndex);
    userModelCode = beforeExports + imageHelperMethods + '\n' + afterExports;
    console.log('✅ Added image management helper methods');
  } else {
    console.log('⚠️ Could not find module.exports');
  }
  
  // Update the toJSON method to exclude sensitive data
  const toJSONMethod = `
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.faceData; // Don't expose face data
  delete user.base64Images; // Don't expose base64 images
  delete user.faceImages; // Don't expose face images
  return user;
};`;

  // Replace existing toJSON method if it exists
  const existingToJSON = userModelCode.match(/userSchema\.methods\.toJSON\s*=\s*function\(\)\s*\{[\s\S]*?\};/);
  if (existingToJSON) {
    userModelCode = userModelCode.replace(existingToJSON[0], toJSONMethod);
    console.log('✅ Updated toJSON method');
  } else {
    // Add toJSON method before module.exports
    const moduleExportsIndex2 = userModelCode.lastIndexOf('module.exports = mongoose.model');
    if (moduleExportsIndex2 !== -1) {
      const beforeExports2 = userModelCode.substring(0, moduleExportsIndex2);
      const afterExports2 = userModelCode.substring(moduleExportsIndex2);
      userModelCode = beforeExports2 + toJSONMethod + '\n' + afterExports2;
      console.log('✅ Added toJSON method');
    }
  }
  
  // Write the modified file
  fs.writeFileSync(userModelPath, userModelCode);
  console.log('✅ Modified User model saved');
  
  console.log('\n🎯 FIXES IMPLEMENTED:');
  console.log('1. ✅ Added MongoDB image storage fields to User schema');
  console.log('2. ✅ Added faceImages array for storing base64 images');
  console.log('3. ✅ Added image management helper methods');
  console.log('4. ✅ Added image storage statistics');
  console.log('5. ✅ Updated toJSON method to exclude sensitive data');
  console.log('6. ✅ Enhanced face recognition fields');
  
  console.log('\n🚀 NEXT STEPS:');
  console.log('1. Test the updated User model');
  console.log('2. Test image storage functionality');
  console.log('3. Test face verification with MongoDB storage');
  console.log('4. Verify user profile updates correctly');
  
} catch (error) {
  console.error('❌ Error updating User model for MongoDB image storage:', error);
  console.log('\n📋 Manual fix instructions:');
  console.log('1. Open models/User.js');
  console.log('2. Add MongoDB image storage fields');
  console.log('3. Add image management helper methods');
  console.log('4. Update toJSON method');
  console.log('5. Test the changes');
}


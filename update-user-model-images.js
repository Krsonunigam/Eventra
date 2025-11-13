const fs = require('fs');
const path = require('path');

console.log('🔧 UPDATING USER MODEL FOR BASE64 IMAGE STORAGE\n');
console.log('=' .repeat(60));

// Path to the User model file
const userModelPath = path.join(__dirname, 'models', 'User.js');

try {
  // Read the current User model file
  let userModelCode = fs.readFileSync(userModelPath, 'utf8');
  
  console.log('📋 Current User model file found');
  console.log(`   Path: ${userModelPath}`);
  
  // Create a backup
  const backupPath = userModelPath + '.backup';
  fs.writeFileSync(backupPath, userModelCode);
  console.log(`✅ Backup created: ${backupPath}`);
  
  // Add base64 image storage fields
  const base64ImageFields = `  // Base64 image storage for verification
  base64Images: [{
    imageData: {
      type: String, // Base64 encoded image data
      required: true
    },
    imageType: {
      type: String,
      enum: ['profile', 'verification', 'attendance'],
      default: 'verification'
    },
    imageQuality: {
      type: String,
      enum: ['poor', 'fair', 'good', 'excellent'],
      default: 'good'
    },
    capturedAt: {
      type: Date,
      default: Date.now
    },
    isActive: {
      type: Boolean,
      default: true
    },
    imageHash: {
      type: String, // Hash for duplicate detection
      default: ''
    }
  }],
  // Image recognition data
  imageRecognitionData: {
    isSetup: {
      type: Boolean,
      default: false
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    lastVerification: {
      type: Date,
      default: null
    },
    verificationCount: {
      type: Number,
      default: 0
    },
    recognitionAccuracy: {
      type: Number,
      default: 0
    }
  },`;

  // Find the faceData field and add base64 image fields after it
  const faceDataEnd = userModelCode.indexOf('  faceData: {');
  if (faceDataEnd !== -1) {
    const beforeFaceData = userModelCode.substring(0, faceDataEnd);
    const afterFaceData = userModelCode.substring(faceDataEnd);
    
    // Find the end of the faceData field
    const faceDataFieldEnd = userModelCode.indexOf('  faceData: {', faceDataEnd);
    const faceDataEndIndex = userModelCode.indexOf('  },', faceDataEnd + 50);
    
    if (faceDataEndIndex !== -1) {
      const beforeField = userModelCode.substring(0, faceDataEndIndex + 4);
      const afterField = userModelCode.substring(faceDataEndIndex + 4);
      userModelCode = beforeField + base64ImageFields + afterField;
      console.log('✅ Added base64 image storage fields');
    } else {
      console.log('⚠️ Could not find faceData field end');
    }
  } else {
    console.log('⚠️ Could not find faceData field');
  }
  
  // Add image recognition methods to the schema
  const imageRecognitionMethods = `
// Image recognition methods
userSchema.methods.addBase64Image = function(imageData, imageType = 'verification', imageQuality = 'good') {
  const imageHash = this.generateImageHash(imageData);
  
  // Check for duplicates
  const existingImage = this.base64Images.find(img => img.imageHash === imageHash);
  if (existingImage) {
    return { success: false, message: 'Duplicate image detected' };
  }
  
  this.base64Images.push({
    imageData: imageData,
    imageType: imageType,
    imageQuality: imageQuality,
    capturedAt: new Date(),
    isActive: true,
    imageHash: imageHash
  });
  
  return { success: true, message: 'Image added successfully' };
};

userSchema.methods.generateImageHash = function(imageData) {
  // Simple hash generation for duplicate detection
  let hash = 0;
  for (let i = 0; i < imageData.length; i++) {
    const char = imageData.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString();
};

userSchema.methods.verifyImage = function(inputImageData) {
  // Simple image verification logic
  // In a real implementation, you would use more sophisticated image comparison
  const inputHash = this.generateImageHash(inputImageData);
  
  for (let image of this.base64Images) {
    if (image.isActive && image.imageHash === inputHash) {
      return {
        success: true,
        confidence: 100,
        message: 'Image verified successfully'
      };
    }
  }
  
  return {
    success: false,
    confidence: 0,
    message: 'Image verification failed'
  };
};

userSchema.methods.updateImageRecognitionStatus = function(isVerified = true, accuracy = 0) {
  this.imageRecognitionData.isSetup = true;
  this.imageRecognitionData.isVerified = isVerified;
  this.imageRecognitionData.lastVerification = new Date();
  this.imageRecognitionData.verificationCount += 1;
  this.imageRecognitionData.recognitionAccuracy = accuracy;
  
  return { success: true, message: 'Image recognition status updated' };
};`;

  // Find the comparePassword method and add image recognition methods after it
  const comparePasswordEnd = userModelCode.indexOf('userSchema.methods.comparePassword = async function(candidatePassword) {');
  if (comparePasswordEnd !== -1) {
    const comparePasswordMethodEnd = userModelCode.indexOf('};', comparePasswordEnd + 100);
    if (comparePasswordMethodEnd !== -1) {
      const beforeMethods = userModelCode.substring(0, comparePasswordMethodEnd + 2);
      const afterMethods = userModelCode.substring(comparePasswordMethodEnd + 2);
      userModelCode = beforeMethods + imageRecognitionMethods + afterMethods;
      console.log('✅ Added image recognition methods');
    } else {
      console.log('⚠️ Could not find comparePassword method end');
    }
  } else {
    console.log('⚠️ Could not find comparePassword method');
  }
  
  // Update the toJSON method to exclude base64 images for security
  const toJSONMethod = userModelCode.indexOf('userSchema.methods.toJSON = function() {');
  if (toJSONMethod !== -1) {
    const toJSONMethodEnd = userModelCode.indexOf('  return user;', toJSONMethod);
    if (toJSONMethodEnd !== -1) {
      const beforeToJSON = userModelCode.substring(0, toJSONMethodEnd);
      const afterToJSON = userModelCode.substring(toJSONMethodEnd);
      userModelCode = beforeToJSON + '  delete user.base64Images;\n  ' + afterToJSON;
      console.log('✅ Updated toJSON method to exclude base64 images');
    }
  }
  
  // Write the modified file
  fs.writeFileSync(userModelPath, userModelCode);
  console.log('✅ Modified User model file saved');
  
  console.log('\n🎯 UPDATES IMPLEMENTED:');
  console.log('1. ✅ Added base64Images array field');
  console.log('2. ✅ Added imageRecognitionData object field');
  console.log('3. ✅ Added addBase64Image method');
  console.log('4. ✅ Added generateImageHash method');
  console.log('5. ✅ Added verifyImage method');
  console.log('6. ✅ Added updateImageRecognitionStatus method');
  console.log('7. ✅ Updated toJSON method for security');
  
  console.log('\n🚀 NEXT STEPS:');
  console.log('1. Create image recognition API endpoints');
  console.log('2. Test base64 image storage');
  console.log('3. Test image verification');
  console.log('4. Test complete image registration and verification flow');
  
} catch (error) {
  console.error('❌ Error updating User model:', error);
  console.log('\n📋 Manual fix instructions:');
  console.log('1. Open models/User.js');
  console.log('2. Add base64Images array field');
  console.log('3. Add imageRecognitionData object field');
  console.log('4. Add image recognition methods');
  console.log('5. Update toJSON method for security');
}

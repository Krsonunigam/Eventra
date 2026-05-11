const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const { OAuth2Client } = require('google-auth-library');
const emailVerificationService = require('../utils/emailVerification');
const { storeFaceData, verifyFace } = require('../utils/pureNodeFaceRecognition');
const { sendResetOTP } = require('../utils/emailService');
const crypto = require('crypto');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const router = express.Router();

// ─── Migration helper ───────────────────────────────────────────────────────
// Safely derives face status from any user document regardless of schema version.
// Old users may have faceImages as strings — we treat those as already migrated
// if they have faceTrainingDate + sufficient sample count.
const safeFaceStatus = (user) => {
  const sampleCount = user.faceSampleCount || 0;
  const hasDate = Boolean(user.faceTrainingDate);

  // Accept as complete if: flags are true, OR has training date + 10+ samples
  const faceDataCollected    = user.faceDataCollected    || (hasDate && sampleCount >= 10);
  const faceTrainingCompleted = user.faceTrainingCompleted || (hasDate && sampleCount >= 10);
  const isFaceVerified       = user.isFaceVerified       || faceTrainingCompleted;

  return { faceDataCollected, faceTrainingCompleted, isFaceVerified };
};

// Register new user
router.post('/register', async (req, res) => {
  try {
    let { name, email, password, studentId, institute, dateOfBirth, phoneNumber, interests } = req.body;

    // Basic input validation
    if (!name || !email || !password || !studentId || !institute || !dateOfBirth || !phoneNumber) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Email normalization & validation
    email = email.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email format' });
    }

    const dob = new Date(dateOfBirth);
    if (isNaN(dob.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid date of birth format' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "This email is already registered. Please login."
      });
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
      studentId,
      institute,
      dateOfBirth: dob,
      phoneNumber,
      interests: interests || [],
      faceDataCollected: false,
      isFaceVerified: false
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        studentId: user.studentId,
        institute: user.institute,
        dateOfBirth: user.dateOfBirth,
        phoneNumber: user.phoneNumber,
        interests: user.interests
      }
    });

  } catch (error) {
    
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        emailVerified: user.emailVerified,
        faceDataCollected: user.faceDataCollected || false,
        faceTrainingCompleted: user.faceTrainingCompleted || false,
        faceSampleCount: user.faceSampleCount || 0,
        isFaceVerified: user.isFaceVerified || false,
        faceTrainingDate: user.faceTrainingDate || null
      }
    });

  } catch (error) {
    
    res.status(500).json({ success: false, message: 'Login failed', error: error.message });
  }
});

// Google Login/Register
router.post('/google', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Google token is required' });
    }

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const { name, email, picture, sub: googleId } = ticket.getPayload();

    let user = await User.findOne({ $or: [{ googleId }, { email: email.toLowerCase() }] });

    if (!user) {
      // Create new user (Always normal user role)
      user = new User({
        name,
        email: email.toLowerCase(),
        googleId,
        authProvider: 'google',
        profilePicture: picture,
        role: 'user', // Force normal user role
        emailVerified: true // Google emails are pre-verified
      });
      await user.save();
    } else if (user.authProvider !== 'google') {
      // Link existing local account to Google if emails match
      user.googleId = googleId;
      user.authProvider = 'google';
      if (!user.profilePicture) user.profilePicture = picture;
      await user.save();
    }

    // Generate JWT token
    const jwtToken = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Google login successful',
      token: jwtToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
        faceDataCollected: user.faceDataCollected || false,
        isFaceVerified: user.isFaceVerified || false
      }
    });

  } catch (error) {
    
    res.status(500).json({ success: false, message: 'Google authentication failed', error: error.message });
  }
});

// Forgot Password - Send OTP
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // We still return success to prevent email enumeration
      return res.json({ success: true, message: 'If an account with that email exists, an OTP has been sent.' });
    }

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Set expiry to 5 minutes
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + 5);

    user.resetPasswordOTP = otp;
    user.resetPasswordExpires = expiry;
    user.resetPasswordAttempts = 0;
    await user.save();

    await sendResetOTP(user.email, otp);

    res.json({ success: true, message: 'OTP sent successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to send OTP', error: error.message });
  }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ success: false, message: 'Email and OTP are required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (!user.resetPasswordOTP || !user.resetPasswordExpires) {
      return res.status(400).json({ success: false, message: 'No OTP request found for this email' });
    }

    if (new Date() > user.resetPasswordExpires) {
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }

    if (user.resetPasswordAttempts >= 5) {
      return res.status(400).json({ success: false, message: 'Too many failed attempts. Please request a new OTP.' });
    }

    if (user.resetPasswordOTP !== otp) {
      user.resetPasswordAttempts += 1;
      await user.save();
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    // Mark as verified by clearing OTP but leaving a flag or just sending success
    // In a real app we might issue a short-lived reset token here.
    // For simplicity, we can let them proceed to the next step, but we shouldn't clear the OTP until password is reset,
    // OR we clear it and set a flag. Let's just respond success and they must include OTP in the final reset request.
    res.json({ success: true, message: 'OTP verified successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to verify OTP', error: error.message });
  }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email, OTP, and new password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (!user.resetPasswordOTP || user.resetPasswordOTP !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid or missing OTP' });
    }

    if (new Date() > user.resetPasswordExpires) {
      return res.status(400).json({ success: false, message: 'OTP has expired' });
    }

    // Reset password
    user.password = newPassword; // Mongoose pre-save hook will hash it
    user.resetPasswordOTP = null;
    user.resetPasswordExpires = null;
    user.resetPasswordAttempts = 0;
    
    await user.save();

    res.json({ success: true, message: 'Password has been reset successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to reset password', error: error.message });
  }
});

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const hasEnoughFaceSamples = (user.faceSampleCount || 0) >= 10;
    const hasTrainingArtifacts = Boolean(user.faceTrainingDate) && hasEnoughFaceSamples;
    const normalizedFaceDataCollected = user.faceDataCollected || hasTrainingArtifacts;
    const normalizedFaceTrainingCompleted = user.faceTrainingCompleted || hasTrainingArtifacts;

    if (
      normalizedFaceDataCollected !== user.faceDataCollected ||
      normalizedFaceTrainingCompleted !== user.faceTrainingCompleted
    ) {
      user.faceDataCollected = normalizedFaceDataCollected;
      user.faceTrainingCompleted = normalizedFaceTrainingCompleted;
      await user.save();
    }

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        studentId: user.studentId,
        institute: user.institute,
        dateOfBirth: user.dateOfBirth,
        phoneNumber: user.phoneNumber,
        phone: user.phone,
        interests: user.interests,
        gender: user.gender,
        bio: user.bio,
        socialLinks: user.socialLinks,
        notificationPreferences: user.notificationPreferences,
        privacySettings: user.privacySettings,
        isActive: user.isActive,
        emailVerified: user.emailVerified,
        faceDataCollected: user.faceDataCollected || false,
        isFaceVerified: user.isFaceVerified || false,
        faceSampleCount: user.faceSampleCount || 0,
        faceTrainingDate: user.faceTrainingDate,
        faceVerificationDate: user.faceVerificationDate,
        faceVerificationConfidence: user.faceVerificationConfidence,
        faceDataQuality: user.faceDataQuality,
        profilePicture: user.profilePicture
      }
    });

  } catch (error) {
    
    res.status(500).json({ message: 'Failed to get profile', error: error.message });
  }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    
    const { 
      name, studentId, institute, phoneNumber, interests, profilePicture, 
      phone, dateOfBirth, gender, bio, socialLinks, notificationPreferences, privacySettings 
    } = req.body;
    
    // Find and update user
    const updateData = {
      ...(name && { name }),
      ...(studentId && { studentId }),
      ...(institute && { institute }),
      ...(phoneNumber && { phoneNumber }),
      ...(phone && { phone }),
      ...(interests && { interests }),
      ...(dateOfBirth && { dateOfBirth: new Date(dateOfBirth) }),
      ...(gender && { gender }),
      ...(bio !== undefined && { bio }),
      ...(socialLinks && { socialLinks }),
      ...(notificationPreferences && { notificationPreferences }),
      ...(privacySettings && { privacySettings })
    };

    // Explicitly handle profilePicture (allow null/empty to clear)
    if (req.body.hasOwnProperty('profilePicture')) {
      updateData.profilePicture = profilePicture;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.userId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        studentId: updatedUser.studentId,
        institute: updatedUser.institute,
        dateOfBirth: updatedUser.dateOfBirth,
        phoneNumber: updatedUser.phoneNumber,
        phone: updatedUser.phone,
        interests: updatedUser.interests,
        profilePicture: updatedUser.profilePicture,
        gender: updatedUser.gender,
        bio: updatedUser.bio,
        socialLinks: updatedUser.socialLinks,
        notificationPreferences: updatedUser.notificationPreferences,
        privacySettings: updatedUser.privacySettings
      }
    });

  } catch (error) {
    
    res.status(400).json({ success: false, message: 'Failed to update profile', error: error.message });
  }
});

// Enhanced face verification with MongoDB image storage
router.post('/verify-face', auth, async (req, res) => {
  try {
    const { faceData } = req.body;
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    
    

    // If user doesn't have face data collected yet, this is first-time setup
    if (!user.faceDataCollected) {
      // For first-time setup, we need to collect face samples first
      return res.status(400).json({ 
        message: 'No face data collected. Please collect face samples first.',
        requiresSetup: true,
        user: {
          id: user._id,
          email: user.email,
          faceDataCollected: user.faceDataCollected,
          isFaceVerified: user.isFaceVerified
        }
      });
    }

    // Check if face is already verified
    if (user.isFaceVerified) {
      
      return res.status(400).json({ 
        message: 'Face already verified',
        user: {
          id: user._id,
          email: user.email,
          faceDataCollected: user.faceDataCollected,
          isFaceVerified: user.isFaceVerified,
          faceSampleCount: user.faceSampleCount,
          faceTrainingDate: user.faceTrainingDate
        }
      });
    }

    // User has stored face data, verify against it
    
    const verificationResult = await verifyFace(faceData, req.user.userId);

    

    if (verificationResult.success && verificationResult.isMatch && verificationResult.confidence > 70) {
      // Update user verification status
      user.isFaceVerified = true;
      user.faceVerificationDate = new Date();
      user.faceVerificationConfidence = verificationResult.confidence;
      await user.save();

      

      res.json({ 
        message: 'Face verification successful',
        confidence: verificationResult.confidence,
        isFirstTime: false,
        user: {
          id: user._id,
          email: user.email,
          faceDataCollected: user.faceDataCollected,
          isFaceVerified: user.isFaceVerified,
          faceSampleCount: user.faceSampleCount,
          faceVerificationDate: user.faceVerificationDate,
          faceVerificationConfidence: user.faceVerificationConfidence
        }
      });
    } else {
      
      res.status(400).json({ 
        message: 'Face verification failed',
        confidence: verificationResult.confidence || 0,
        details: verificationResult.message || 'Face did not match stored data'
      });
    }

  } catch (error) {
    
    res.status(500).json({ 
      message: 'Face verification failed', 
      error: error.message 
    });
  }
});

// Update face data
router.post('/update-face', auth, async (req, res) => {
  try {
    const { faceSamples } = req.body;
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Use the new MongoDB-based face data collection
    if (!faceSamples || !Array.isArray(faceSamples) || faceSamples.length < 5) {
      return res.status(400).json({ 
        message: 'At least 10 face samples are required for training' 
      });
    }

    // Limit the number of samples to prevent memory issues
    const limitedSamples = faceSamples.slice(0, 25);
    if (limitedSamples.length < faceSamples.length) {
      
    }

    // Store face data in MongoDB
    try {
      // Update user record with face data
      const updatedUser = await User.findByIdAndUpdate(
        req.user.userId,
        {
          faceData: JSON.stringify(limitedSamples), // Store all samples as JSON
          faceDataCollected: true,
          faceDataQuality: 'high',
          isFaceVerified: false, // Reset verification status
          faceTrainingCompleted: true,
          faceTrainingDate: new Date(),
          faceSampleCount: limitedSamples.length
        },
        { new: true }
      );

      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      

      return res.json({
        message: 'Face samples collected and recognizer trained successfully',
        sampleCount: limitedSamples.length,
        user: {
          id: updatedUser._id,
          faceDataCollected: updatedUser.faceDataCollected,
          faceDataQuality: updatedUser.faceDataQuality,
          isFaceVerified: updatedUser.isFaceVerified,
          faceTrainingCompleted: updatedUser.faceTrainingCompleted,
          faceSampleCount: updatedUser.faceSampleCount
        }
      });
    } catch (dbError) {
      
      return res.status(500).json({ 
        message: 'Failed to save face data to database' 
      });
    }
  } catch (error) {
    
    res.status(500).json({ message: 'Failed to update face data', error: error.message });
  }
});

// Update face data
router.post('/update-face-data', auth, async (req, res) => {
  try {
    const { faceData, quality } = req.body;

    if (!faceData) {
      return res.status(400).json({ message: 'Face data is required' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update face data
    user.faceData = faceData;
    user.faceDataCollected = true;
    user.faceDataQuality = quality || 'medium';
    user.faceTrainingCompleted = true;
    user.faceTrainingDate = new Date();
    await user.save();

    res.json({
      message: 'Face data updated successfully',
      user: {
        id: user._id,
        faceDataCollected: user.faceDataCollected,
        faceDataQuality: user.faceDataQuality,
        faceTrainingCompleted: user.faceTrainingCompleted,
        faceTrainingDate: user.faceTrainingDate
      }
    });

  } catch (error) {
    
    res.status(500).json({ message: 'Failed to update face data', error: error.message });
  }
});

// Train face model
router.post('/train-face-model', auth, async (req, res) => {
  try {
    const { faceSamples } = req.body;
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!faceSamples || !Array.isArray(faceSamples) || faceSamples.length < 3) {
      return res.status(400).json({ 
        message: 'At least 3 face samples are required for training' 
      });
    }

    // Store face data in MongoDB
    try {
      const updatedUser = await User.findByIdAndUpdate(
        req.user.userId,
        {
          faceData: JSON.stringify(faceSamples),
          faceDataCollected: true,
          faceDataQuality: 'high',
          isFaceVerified: false,
          faceTrainingCompleted: true,
          faceTrainingDate: new Date(),
          faceSampleCount: faceSamples.length
        },
        { new: true }
      );

      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      

      return res.json({
        message: 'Face model trained successfully',
        sampleCount: faceSamples.length,
        user: {
          id: updatedUser._id,
          faceDataCollected: updatedUser.faceDataCollected,
          faceDataQuality: updatedUser.faceDataQuality,
          isFaceVerified: updatedUser.isFaceVerified,
          faceTrainingCompleted: updatedUser.faceTrainingCompleted,
          faceSampleCount: updatedUser.faceSampleCount
        }
      });
    } catch (dbError) {
      
      return res.status(500).json({ 
        message: 'Failed to save face data to database' 
      });
    }
  } catch (error) {
    
    res.status(500).json({ message: 'Failed to train face model', error: error.message });
  }
});

// GET /api/auth/face-status - Get user face verification status
router.get('/face-status', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const hasEnoughFaceSamples = (user.faceSampleCount || 0) >= 10;
    const hasTrainingArtifacts = Boolean(user.faceTrainingDate) && hasEnoughFaceSamples;
    const normalizedFaceDataCollected = user.faceDataCollected || hasTrainingArtifacts;
    const normalizedFaceTrainingCompleted = user.faceTrainingCompleted || hasTrainingArtifacts;

    if (
      normalizedFaceDataCollected !== user.faceDataCollected ||
      normalizedFaceTrainingCompleted !== user.faceTrainingCompleted
    ) {
      user.faceDataCollected = normalizedFaceDataCollected;
      user.faceTrainingCompleted = normalizedFaceTrainingCompleted;
      await user.save();
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        faceDataCollected: user.faceDataCollected || false,
        isFaceVerified: user.isFaceVerified || false,
        faceSampleCount: user.faceSampleCount || 0,
        faceTrainingDate: user.faceTrainingDate,
        faceVerificationDate: user.faceVerificationDate,
        faceVerificationConfidence: user.faceVerificationConfidence,
        faceDataQuality: user.faceDataQuality
      }
    });
  } catch (error) {
    
    res.status(500).json({ 
      message: 'Failed to get face status', 
      error: error.message 
    });
  }
});

// GET /api/auth/me — Returns the authenticated user's full profile.
// Migration-safe: works for both old (string faceImages) and new ({url,public_id}) users.
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .select('-password -faceData -base64Images -resetPasswordOTP -resetPasswordExpires');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Derive face status safely (handles old + new schema)
    const { faceDataCollected, faceTrainingCompleted, isFaceVerified } = safeFaceStatus(user);

    // Only write back to DB if flags are stale (avoid unnecessary saves)
    if (
      faceDataCollected    !== user.faceDataCollected ||
      faceTrainingCompleted !== user.faceTrainingCompleted ||
      isFaceVerified       !== user.isFaceVerified
    ) {
      await User.findByIdAndUpdate(user._id, {
        $set: { faceDataCollected, faceTrainingCompleted, isFaceVerified }
      });
    }

    return res.json({
      success: true,
      user: {
        id:                      user._id,
        name:                    user.name,
        email:                   user.email,
        role:                    user.role,
        isActive:                user.isActive,
        emailVerified:           user.emailVerified,
        profilePicture:          user.profilePicture,
        phone:                   user.phone,
        phoneNumber:             user.phoneNumber,
        studentId:               user.studentId,
        institute:               user.institute,
        dateOfBirth:             user.dateOfBirth,
        gender:                  user.gender,
        bio:                     user.bio,
        socialLinks:             user.socialLinks,
        notificationPreferences: user.notificationPreferences,
        privacySettings:         user.privacySettings,
        address:                 user.address,
        preferences:             user.preferences,
        // ── Face fields (migration-safe) ────────────────────────────
        faceDataCollected:          faceDataCollected,
        faceTrainingCompleted:       faceTrainingCompleted,
        isFaceVerified:             isFaceVerified,
        faceSampleCount:            user.faceSampleCount || 0,
        faceDataQuality:            user.faceDataQuality || 'medium',
        faceTrainingDate:           user.faceTrainingDate,
        faceVerificationDate:       user.faceVerificationDate,
        faceVerificationConfidence: user.faceVerificationConfidence || 0,
        // ─────────────────────────────────────────────────────────────
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error('GET /api/auth/me error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to get user info' });
  }
});

// PUT /api/auth/change-password
router.put('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Both passwords are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.authProvider === 'google') {
      return res.status(400).json({ success: false, message: 'Google accounts cannot change password here' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();
    return res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to change password' });
  }
});

module.exports = router;

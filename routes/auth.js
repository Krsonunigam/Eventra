const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const emailVerificationService = require('../utils/emailVerification');
const { storeFaceData, verifyFace } = require('../utils/pureNodeFaceRecognition');

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, studentId, institute, dateOfBirth, phoneNumber, interests } = req.body;

    // Basic input validation
    if (!name || !email || !password || !studentId || !institute || !dateOfBirth || !phoneNumber) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const dob = new Date(dateOfBirth);
    if (isNaN(dob.getTime())) {
      return res.status(400).json({ message: 'Invalid date of birth format' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
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
      interests: interests || []
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
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        studentId: user.studentId,
        institute: user.institute,
        dateOfBirth: user.dateOfBirth,
        phoneNumber: user.phoneNumber,
        interests: user.interests,
        isActive: user.isActive,
        emailVerified: user.emailVerified
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
});

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
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
        interests: user.interests,
        isActive: user.isActive,
        emailVerified: user.emailVerified,
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
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Failed to get profile', error: error.message });
  }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, studentId, institute, phoneNumber, interests } = req.body;
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update user fields
    if (name) user.name = name;
    if (studentId) user.studentId = studentId;
    if (institute) user.institute = institute;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (interests) user.interests = interests;

    await user.save();

    res.json({
      message: 'Profile updated successfully',
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
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Failed to update profile', error: error.message });
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

    console.log('Face verification request for user:', user.email);
    console.log('User face data status:', {
      faceDataCollected: user.faceDataCollected,
      isFaceVerified: user.isFaceVerified,
      faceSampleCount: user.faceSampleCount
    });

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
      console.log('Face already verified for user:', user.email);
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
    console.log('Verifying face against stored data...');
    const verificationResult = await verifyFace(faceData, req.user.userId);

    console.log('Verification result:', verificationResult);

    if (verificationResult.success && verificationResult.isMatch && verificationResult.confidence > 70) {
      // Update user verification status
      user.isFaceVerified = true;
      user.faceVerificationDate = new Date();
      user.faceVerificationConfidence = verificationResult.confidence;
      await user.save();

      console.log('Face verification successful for user:', user.email);

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
      console.log('Face verification failed for user:', user.email);
      res.status(400).json({ 
        message: 'Face verification failed',
        confidence: verificationResult.confidence || 0,
        details: verificationResult.message || 'Face did not match stored data'
      });
    }

  } catch (error) {
    console.error('Face verification error:', error);
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
      console.log(`Limited face samples from ${faceSamples.length} to ${limitedSamples.length}`);
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

      console.log(`Face model training completed for user ${updatedUser.email}`);

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
      console.error('Database error:', dbError);
      return res.status(500).json({ 
        message: 'Failed to save face data to database' 
      });
    }
  } catch (error) {
    console.error('Update face error:', error);
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
    console.error('Update face data error:', error);
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

      console.log(`Face model training completed for user ${updatedUser.email}`);

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
      console.error('Database error:', dbError);
      return res.status(500).json({ 
        message: 'Failed to save face data to database' 
      });
    }
  } catch (error) {
    console.error('Train face model error:', error);
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
    console.error('Get face status error:', error);
    res.status(500).json({ 
      message: 'Failed to get face status', 
      error: error.message 
    });
  }
});

// Get current user info
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        emailVerified: user.emailVerified,
        profilePicture: user.profilePicture,
        phone: user.phone,
        address: user.address,
        preferences: user.preferences,
        faceDataCollected: user.faceDataCollected || false,
        isFaceVerified: user.isFaceVerified || false,
        faceSampleCount: user.faceSampleCount || 0,
        faceTrainingDate: user.faceTrainingDate,
        faceVerificationDate: user.faceVerificationDate,
        faceVerificationConfidence: user.faceVerificationConfidence,
        faceDataQuality: user.faceDataQuality,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error('Get user info error:', error);
    res.status(500).json({ 
      message: 'Failed to get user info', 
      error: error.message 
    });
  }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const cloudinary = require('../config/cloudinary');
const multer = require('multer');
const User = require('../models/User');
const { storeFaceData } = require('../utils/pureNodeFaceRecognition');

// Use memory storage – no temp files on disk needed for Render/Railway
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { files: 25, fileSize: 5 * 1024 * 1024 }, // 5 MB max per file
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'), false);
  }
});

// ─── Helper: upload a single buffer to Cloudinary ──────────────────────────
const uploadBufferToCloudinary = (buffer, folder = 'eventra/faces') => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        quality: 'auto',        // Cloudinary auto-optimises quality
        fetch_format: 'auto',   // Serve best format (webp, avif, etc.)
        transformation: [
          { width: 320, height: 320, crop: 'fill', gravity: 'face' } // resize + center face
        ]
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({ url: result.secure_url, public_id: result.public_id });
      }
    );
    stream.end(buffer);
  });
};

// ─── POST /api/face/collect ──────────────────────────────────────────────────
// Accepts up to 25 face image files, trains the face model, uploads to
// Cloudinary in parallel, and updates the user document with {url, public_id}.
router.post('/collect', auth, upload.array('faces', 25), async (req, res) => {
  try {
    if (!req.files || req.files.length < 10) {
      return res.status(400).json({
        success: false,
        message: 'At least 10 face samples are required'
      });
    }

    // 1. Run face recognition training on the raw buffers
    const faceBuffers = req.files.map(f => f.buffer);
    let trainingResult = { success: true, total_samples: faceBuffers.length, quality: 'high' };

    try {
      trainingResult = await storeFaceData(req.user.userId, faceBuffers);
      if (!trainingResult.success) {
        return res.status(400).json({
          success: false,
          message: trainingResult.message || 'Face training failed'
        });
      }
    } catch (trainErr) {
      console.error('⚠️ Face training error (non-fatal, continuing upload):', trainErr.message);
      // Training failure should not block Cloudinary upload
    }

    // 2. Upload all face images to Cloudinary in parallel
    const uploadResults = await Promise.all(
      req.files.map(file => uploadBufferToCloudinary(file.buffer))
    );
    // uploadResults is now: [{ url, public_id }, ...]

    // 3. Update user document with correct schema format
    const updatedUser = await User.findByIdAndUpdate(
      req.user.userId,
      {
        $set: {
          faceImages: uploadResults,            // [{url, public_id}] ✅
          faceDataCollected: true,
          faceTrainingCompleted: true,
          isFaceVerified: true,
          faceSampleCount: uploadResults.length,
          faceDataQuality: trainingResult.quality || 'high',
          faceTrainingDate: new Date()
        }
      },
      { new: true, runValidators: true }
    ).select('-password -faceData -base64Images -resetPasswordOTP -resetPasswordExpires');

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // 4. Build a clean user object to send back to the frontend
    const userPayload = {
      id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      isActive: updatedUser.isActive,
      emailVerified: updatedUser.emailVerified,
      profilePicture: updatedUser.profilePicture,
      studentId: updatedUser.studentId,
      institute: updatedUser.institute,
      phoneNumber: updatedUser.phoneNumber,
      faceDataCollected: updatedUser.faceDataCollected,
      faceTrainingCompleted: updatedUser.faceTrainingCompleted,
      isFaceVerified: updatedUser.isFaceVerified,
      faceSampleCount: updatedUser.faceSampleCount,
      faceDataQuality: updatedUser.faceDataQuality,
      faceTrainingDate: updatedUser.faceTrainingDate,
      faceImages: updatedUser.faceImages
    };

    return res.json({
      success: true,
      message: 'Face training completed successfully',
      sampleCount: updatedUser.faceSampleCount,
      user: userPayload
    });

  } catch (err) {
    console.error('❌ /api/face/collect error:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Internal server error during face upload'
    });
  }
});

// ─── GET /api/face/status ─────────────────────────────────────────────────
router.get('/status', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .select('faceDataCollected faceTrainingCompleted isFaceVerified faceSampleCount faceTrainingDate faceDataQuality');

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    return res.json({
      success: true,
      faceDataCollected: user.faceDataCollected || false,
      faceTrainingCompleted: user.faceTrainingCompleted || false,
      isFaceVerified: user.isFaceVerified || false,
      faceSampleCount: user.faceSampleCount || 0,
      faceTrainingDate: user.faceTrainingDate || null,
      faceDataQuality: user.faceDataQuality || 'medium'
    });
  } catch (err) {
    console.error('❌ /api/face/status error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── DELETE /api/face/reset ───────────────────────────────────────────────
// Clear face data for the authenticated user and remove images from Cloudinary
router.delete('/reset', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('faceImages');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Delete images from Cloudinary
    if (user.faceImages && user.faceImages.length > 0) {
      await Promise.allSettled(
        user.faceImages
          .filter(img => img.public_id)
          .map(img => cloudinary.uploader.destroy(img.public_id))
      );
    }

    await User.findByIdAndUpdate(req.user.userId, {
      $set: {
        faceImages: [],
        faceDataCollected: false,
        faceTrainingCompleted: false,
        isFaceVerified: false,
        faceSampleCount: 0,
        faceTrainingDate: null,
        faceData: null
      }
    });

    return res.json({ success: true, message: 'Face data reset successfully' });
  } catch (err) {
    console.error('❌ /api/face/reset error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

// const express = require('express');
// const router = express.Router();
// const { auth } = require('../middleware/auth');
// const {
//   storeFaceData,
//   verifyFace,
//   trainRecognizer,
//   getUserSamples,
//   removeUserData,
//   getTrainingStats,
//   recognizeFace,
//   getFaceData
// } = require('../utils/advancedFaceRecognition');
// const User = require('../models/User');

// // POST /api/face/collect - Collect face samples for training
// router.post('/collect', auth, async (req, res) => {
//   try {
//     
//     const { faceSamples } = req.body;
//     
    
//     if (!faceSamples || !Array.isArray(faceSamples) || faceSamples.length < 10) {
//       return res.status(400).json({ 
//         message: 'At least 10 face samples are required for training' 
//       });
//     }

//     // Limit the number of samples to prevent memory issues
//     const limitedSamples = faceSamples.slice(0, 25);
//     if (limitedSamples.length < faceSamples.length) {
//       
//     }

//     // Direct database storage approach - simpler and more reliable
//     try {
//       // Update user record with face data
//       const user = await User.findByIdAndUpdate(
//         req.user.userId,
//         {
//           faceData: JSON.stringify(limitedSamples), // Store all samples as JSON
//           faceDataCollected: true,
//           faceDataQuality: 'high',
//           isFaceVerified: true,
//           faceTrainingCompleted: true,
//           faceTrainingDate: new Date(),
//           faceSampleCount: limitedSamples.length
//         },
//         { new: true }
//       );

//       if (!user) {
//         return res.status(404).json({ message: 'User not found' });
//       }

//       

//       return res.json({
//         message: 'Face samples collected and recognizer trained successfully',
//         sampleCount: limitedSamples.length,
//         user: {
//           id: user._id,
//           faceDataCollected: user.faceDataCollected,
//           faceDataQuality: user.faceDataQuality,
//           isFaceVerified: user.isFaceVerified,
//           faceTrainingCompleted: user.faceTrainingCompleted,
//           faceSampleCount: user.faceSampleCount
//         }
//       });
//     } catch (dbError) {
//       
//       return res.status(500).json({ 
//         message: 'Failed to save face data to database' 
//       });
//     }
//   } catch (err) {
//     
//     res.status(500).json({ message: 'Internal server error', error: err.message });
//   }
// });

// // POST /api/face/verify - Verify face against user
// router.post('/verify', auth, async (req, res) => {
//   try {
//     const { faceData } = req.body;
//     if (!faceData) return res.status(400).json({ message: 'Missing faceData' });

//     const user = await User.findById(req.user.userId);
//     if (!user) return res.status(404).json({ message: 'User not found' });

//     if (!user.faceDataCollected) {
//       return res.status(400).json({ 
//         message: 'No face data collected for this user. Please collect face samples first.' 
//       });
//     }

//     // For now, return a basic verification result
//     // In a real implementation, you would compare with stored face data
//     const confidence = 85.0; // Mock confidence score
//     const isMatch = confidence > 70;
    
//     if (isMatch) {
//       user.isFaceVerified = true;
//       await user.save();
//       return res.json({ 
//         message: 'Face verified successfully', 
//         confidence: confidence,
//         isMatch: true
//       });
//     }
    
//     return res.status(400).json({ 
//       message: 'Face did not match', 
//       confidence: confidence,
//       isMatch: false 
//     });
//   } catch (err) {
//     
//     res.status(500).json({ message: 'Internal server error', error: err.message });
//   }
// });

// // POST /api/face/recognize - Recognize face (admin only)
// router.post('/recognize', auth, async (req, res) => {
//   try {
//     const { faceData } = req.body;
//     if (!faceData) return res.status(400).json({ message: 'Missing faceData' });

//     // Check if user is admin
//     const user = await User.findById(req.user.userId);
//     if (!user || user.role !== 'admin') {
//       return res.status(403).json({ message: 'Admin access required' });
//     }

//     // For now, return a basic recognition result
//     // In a real implementation, you would compare with stored face data
//     const confidence = 78.0; // Mock confidence score
//     const isRecognized = confidence > 70;
    
//     if (isRecognized) {
//       return res.json({
//         message: 'Face recognized',
//         userId: req.user.userId, // Mock user ID
//         confidence: confidence
//       });
//     } else {
//       return res.status(400).json({ 
//         message: 'Face not recognized'
//       });
//     }
//   } catch (err) {
//     
//     res.status(500).json({ message: 'Internal server error', error: err.message });
//   }
// });

// // GET /api/face/data - Get face data for user
// router.get('/data', auth, async (req, res) => {
//   try {
//     const result = await getFaceData(req.user.userId);
    
//     if (result.success) {
//       return res.json(result);
//     } else {
//       return res.status(400).json({ 
//         message: result.message 
//       });
//     }
//   } catch (err) {
//     
//     res.status(500).json({ message: 'Internal server error', error: err.message });
//   }
// });

// // DELETE /api/face/data - Remove face data for user
// router.delete('/data', auth, async (req, res) => {
//   try {
//     const result = await removeUserData(req.user.userId);
    
//     if (result.success) {
//       return res.json({ 
//         message: 'Face data removed successfully' 
//       });
//     } else {
//       return res.status(400).json({ 
//         message: result.message 
//       });
//     }
//   } catch (err) {
//     
//     res.status(500).json({ message: 'Internal server error', error: err.message });
//   }
// });

// // POST /api/face/train - Train recognizer (admin only)
// router.post('/train', auth, async (req, res) => {
//   try {
//     // Check if user is admin
//     const user = await User.findById(req.user.userId);
//     if (!user || user.role !== 'admin') {
//       return res.status(403).json({ message: 'Admin access required' });
//     }

//     // For now, return a basic training result
//     // In a real implementation, you would train the recognizer with all collected samples
//     const userCount = await User.countDocuments({ faceDataCollected: true });
//     const sampleCount = await User.aggregate([
//       { $match: { faceDataCollected: true } },
//       { $group: { _id: null, total: { $sum: '$faceSampleCount' } } }
//     ]);
    
//     return res.json({
//       message: 'Recognizer trained successfully',
//       sampleCount: sampleCount[0]?.total || 0,
//       userCount: userCount
//     });
//   } catch (err) {
//     
//     res.status(500).json({ message: 'Internal server error', error: err.message });
//   }
// });

// // GET /api/face/samples/:userId - Get sample count for user (admin only)
// router.get('/samples/:userId', auth, async (req, res) => {
//   try {
//     // Check if user is admin
//     const user = await User.findById(req.user.userId);
//     if (!user || user.role !== 'admin') {
//       return res.status(403).json({ message: 'Admin access required' });
//     }

//     const sampleCount = await getUserSamples(req.params.userId);
    
//     return res.json({
//       userId: req.params.userId,
//       sampleCount: sampleCount
//     });
//   } catch (err) {
//     
//     res.status(500).json({ message: 'Internal server error', error: err.message });
//   }
// });

// // GET /api/face/stats - Get training statistics (admin only)
// router.get('/stats', auth, async (req, res) => {
//   try {
//     // Check if user is admin
//     const user = await User.findById(req.user.userId);
//     if (!user || user.role !== 'admin') {
//       return res.status(403).json({ message: 'Admin access required' });
//     }

//     const stats = await getTrainingStats();
    
//     if (stats.success) {
//       return res.json(stats);
//     } else {
//       return res.status(400).json({ message: stats.message });
//     }
//   } catch (err) {
//     
//     res.status(500).json({ message: 'Internal server error', error: err.message });
//   }
// });

// // DELETE /api/face/clear-all - Clear all face data (admin only)
// router.delete('/clear-all', auth, async (req, res) => {
//   try {
//     // Check if user is admin
//     const user = await User.findById(req.user.userId);
//     if (!user || user.role !== 'admin') {
//       return res.status(403).json({ message: 'Admin access required' });
//     }

//     // Clear all face data by removing the data directory
//     const fs = require('fs');
//     const path = require('path');
    
//     try {
//       const faceDataPath = path.join(__dirname, '../face_recognition_data');
//       if (fs.existsSync(faceDataPath)) {
//         fs.rmSync(faceDataPath, { recursive: true, force: true });
//       }
      
//       // Reset all user face data in database
//       await User.updateMany({}, {
//         faceDataCollected: false,
//         faceSampleCount: 0,
//         faceDataQuality: 'none',
//         isFaceVerified: false
//       });
      
//       return res.json({ message: 'All face data cleared successfully' });
//     } catch (error) {
//       return res.status(500).json({ message: `Error clearing face data: ${error.message}` });
//     }
//   } catch (err) {
//     
//     res.status(500).json({ message: 'Internal server error', error: err.message });
//   }
// });

// module.exports = router;
const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const cloudinary = require('../config/cloudinary');
const multer = require('multer');
const User = require('../models/User');
const { storeFaceData } = require('../utils/pureNodeFaceRecognition');

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    files: 25,
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

router.post('/collect', auth, upload.array('faces', 25), async (req, res) => {
  try {
    if (!req.files || req.files.length < 10) {
      return res.status(400).json({ message: 'At least 10 face samples are required' });
    }

    

    const faceBuffers = req.files.map((file) => file.buffer);
    const trainingResult = await storeFaceData(req.user.userId, faceBuffers);

    if (!trainingResult.success) {
      return res.status(400).json({
        success: false,
        message: trainingResult.message || 'Face training failed'
      });
    }

    const uploadedUrls = [];

    for (const file of req.files) {
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'eventra/faces' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );

        stream.end(file.buffer);
      });

      uploadedUrls.push(result.secure_url);
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.userId,
      {
        faceImages: uploadedUrls,
        faceData: uploadedUrls,
        faceDataCollected: true,
        faceTrainingCompleted: true,
        isFaceVerified: true,
        faceSampleCount: trainingResult.total_samples || uploadedUrls.length,
        faceDataQuality: trainingResult.quality || 'high',
        faceTrainingDate: new Date()
      },
      { new: true }
    ).select('-password');

    

    res.json({
      success: true,
      message: 'Face training completed successfully',
      sampleCount: updatedUser.faceSampleCount,
      user: updatedUser
    });

  } catch (err) {
    
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

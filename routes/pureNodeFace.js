const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
    storeFaceData,
    verifyFace,
    recognizeFace,
    getUserSamples,
    getFaceData,
    removeFaceData,
    getTrainingStats,
    healthCheck,
    pureNodeFaceRecognition
} = require('../utils/pureNodeFaceRecognition');
const User = require('../models/User');

// POST /api/pure-face/detect - Detect if a face is in the single frame
router.post('/detect', auth, async (req, res) => {
    try {
        const { faceData } = req.body;
        if (!faceData) {
            return res.status(400).json({ success: false, message: 'Missing faceData' });
        }

        const processedImage = await pureNodeFaceRecognition.processImage(faceData);
        const face = await pureNodeFaceRecognition.detectFace(processedImage);

        if (!face) {
            return res.json({ success: true, hasFace: false });
        }

        return res.json({ success: true, hasFace: true, quality: face.quality });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
});

// POST /api/pure-face/collect - Collect face samples for training
router.post('/collect', auth, async (req, res) => {
    try {
        
        const { faceSamples } = req.body;
        
        
        if (!faceSamples || !Array.isArray(faceSamples) || faceSamples.length < 10) {
            return res.status(400).json({ 
                message: 'At least 10 face samples are required for training' 
            });
        }

        // Limit the number of samples to prevent memory issues
        const limitedSamples = faceSamples.slice(0, 25);
        if (limitedSamples.length < faceSamples.length) {
            
        }

        // Use pure Node.js face recognition
        const result = await storeFaceData(req.user.userId, limitedSamples);
        
        if (result.success) {
            
            res.json(result);
        } else {
            
            // Return success with training failure details instead of 400 error
            res.json({
                success: false,
                message: result.message || 'Face training failed',
                total_samples: 0,
                quality: 'none'
            });
        }

    } catch (err) {
        
        res.status(500).json({ 
            message: 'Internal server error', 
            error: err.message 
        });
    }
});

// POST /api/pure-face/verify - Verify face against user
router.post('/verify', auth, async (req, res) => {
    try {
        const { faceData } = req.body;
        if (!faceData) {
            return res.status(400).json({ message: 'Missing faceData' });
        }

        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!user.faceDataCollected) {
            return res.status(400).json({ 
                message: 'No face data collected for this user. Please collect face samples first.' 
            });
        }

        // Use pure Node.js face verification
        const result = await verifyFace(faceData, req.user.userId);
        
        if (result.success && result.isMatch) {
            // Update user verification status
            user.isFaceVerified = true;
            user.faceVerificationDate = new Date();
            user.faceVerificationConfidence = result.confidence;
            await user.save();
            
            
            res.json(result);
        } else {
            
            // Return success with verification failure details instead of 400 error
            res.json({
                success: false,
                isMatch: false,
                confidence: 0,
                message: result.message || 'Face verification failed'
            });
        }

    } catch (err) {
        
        res.status(500).json({ 
            message: 'Internal server error', 
            error: err.message 
        });
    }
});

// POST /api/pure-face/recognize - Recognize face (admin only)
router.post('/recognize', auth, async (req, res) => {
    try {
        const { faceData } = req.body;
        if (!faceData) {
            return res.status(400).json({ message: 'Missing faceData' });
        }

        // Check if user is admin
        const user = await User.findById(req.user.userId);
        if (!user || user.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }

        // Use pure Node.js face recognition
        const result = await recognizeFace(faceData);
        
        if (result.success) {
            
            res.json(result);
        } else {
            
            // Return success with recognition failure details instead of 400 error
            res.json({
                success: false,
                userId: null,
                confidence: 0,
                message: result.message || 'Face recognition failed'
            });
        }

    } catch (err) {
        
        res.status(500).json({ 
            message: 'Internal server error', 
            error: err.message 
        });
    }
});

// GET /api/pure-face/data - Get face data for user
router.get('/data', auth, async (req, res) => {
    try {
        const result = await getFaceData(req.user.userId);
        
        if (result) {
            return res.json({
                success: true,
                status: {
                    id: req.user.userId,
                    hasData: true,
                    has_data: true, // For Dashboard compatibility
                    samples: result.sample_count || 0,
                    quality: result.quality || 'unknown',
                    lastTrained: result.last_trained,
                    last_training: result.last_trained, // For Dashboard compatibility
                    trained: true, // For Dashboard compatibility
                    ...result
                }
            });
        } else {
            // Return success with empty data instead of 400 error
            return res.json({ 
                success: true,
                status: {
                    id: req.user.userId,
                    hasData: false,
                    has_data: false, // For Dashboard compatibility
                    samples: 0,
                    quality: 'none',
                    lastTrained: null,
                    last_training: null, // For Dashboard compatibility
                    trained: false // For Dashboard compatibility
                },
                message: 'No face data found for user'
            });
        }
    } catch (err) {
        
        res.status(500).json({ 
            message: 'Internal server error', 
            error: err.message 
        });
    }
});

// DELETE /api/pure-face/data - Remove face data for user
router.delete('/data', auth, async (req, res) => {
    try {
        const result = await removeFaceData(req.user.userId);
        
        if (result.success) {
            
            res.json(result);
        } else {
            
            // Return success with removal failure details instead of 400 error
            res.json({
                success: false,
                message: result.message || 'Face data removal failed',
                files_removed: 0
            });
        }

    } catch (err) {
        
        res.status(500).json({ 
            message: 'Internal server error', 
            error: err.message 
        });
    }
});

// POST /api/pure-face/train - Train recognizer (admin only)
router.post('/train', auth, async (req, res) => {
    try {
        // Check if user is admin
        const user = await User.findById(req.user.userId);
        if (!user || user.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }

        // Pure Node.js system doesn't need separate training
        // Training happens during sample collection
        res.json({
            success: true,
            message: 'Pure Node.js face recognition system is always ready - no separate training needed'
        });

    } catch (err) {
        
        res.status(500).json({ 
            message: 'Internal server error', 
            error: err.message 
        });
    }
});

// GET /api/pure-face/stats - Get system statistics
router.get('/stats', async (req, res) => {
    try {
        const result = await getTrainingStats();
        
        if (result.success) {
            res.json(result);
        } else {
            // Return success with stats failure details instead of 400 error
            res.json({
                success: false,
                message: result.message || 'Failed to get system statistics',
                total_users: 0,
                trained_users: 0,
                total_samples: 0
            });
        }

    } catch (err) {
        
        res.status(500).json({ 
            message: 'Internal server error', 
            error: err.message 
        });
    }
});

// GET /api/pure-face/health - Health check
router.get('/health', async (req, res) => {
    try {
        const result = await healthCheck();
        res.json(result);
    } catch (err) {
        
        res.status(500).json({ 
            success: false,
            message: 'Health check failed', 
            error: err.message 
        });
    }
});

// POST /api/pure-face/samples/:userId - Get sample count for user
router.get('/samples/:userId', auth, async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Check if user can access this data
        if (req.user.userId !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const count = await getUserSamples(userId);
        res.json({
            success: true,
            userId: userId,
            sample_count: count
        });

    } catch (err) {
        
        res.status(500).json({ 
            message: 'Internal server error', 
            error: err.message 
        });
    }
});

// POST /api/pure-face/sync - Sync profile pictures from Cloudinary (admin only)
router.post('/sync', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user || user.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }

        // Trigger sync in background or wait for it? 
        // Better to trigger and return status
        pureNodeFaceRecognition.syncCloudinaryProfiles();
        
        res.json({
            success: true,
            message: 'Cloudinary sync triggered successfully in the background'
        });
    } catch (err) {
        
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
});

module.exports = router;

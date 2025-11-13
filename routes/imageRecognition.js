const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const User = require('../models/User');

// POST /api/image-recognition/register - Register user with base64 images
router.post('/register', auth, async (req, res) => {
  try {
    console.log('Image registration request received for user:', req.user.userId);
    const { images, imageType = 'verification', imageQuality = 'good' } = req.body;
    
    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ 
        message: 'At least one image is required for registration' 
      });
    }

    // Limit the number of images to prevent memory issues
    const limitedImages = images.slice(0, 5);
    if (limitedImages.length < images.length) {
      console.log(`Limited images from ${images.length} to ${limitedImages.length}`);
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Add each image to the user's base64Images array
    const addedImages = [];
    for (let i = 0; i < limitedImages.length; i++) {
      const imageData = limitedImages[i];
      const result = user.addBase64Image(imageData, imageType, imageQuality);
      
      if (result.success) {
        addedImages.push({
          index: i,
          imageType: imageType,
          imageQuality: imageQuality,
          capturedAt: new Date()
        });
      } else {
        console.log(`Image ${i} was not added: ${result.message}`);
      }
    }

    // Update image recognition status
    user.updateImageRecognitionStatus(true, 85.0); // Mock accuracy score
    
    await user.save();

    console.log(`Image registration completed for user ${user.email}`);
    console.log(`Added ${addedImages.length} images out of ${limitedImages.length}`);

    return res.json({
      message: 'Images registered successfully',
      addedImages: addedImages.length,
      totalImages: limitedImages.length,
      user: {
        id: user._id,
        imageRecognitionData: user.imageRecognitionData,
        base64ImagesCount: user.base64Images.length
      }
    });

  } catch (error) {
    console.error('Error in image registration:', error);
    res.status(500).json({ 
      message: 'Image registration failed', 
      error: error.message 
    });
  }
});

// POST /api/image-recognition/verify - Verify user with base64 image
router.post('/verify', auth, async (req, res) => {
  try {
    console.log('Image verification request received for user:', req.user.userId);
    const { imageData } = req.body;
    
    if (!imageData) {
      return res.status(400).json({ 
        message: 'Image data is required for verification' 
      });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.imageRecognitionData.isSetup) {
      return res.status(400).json({ 
        message: 'Image recognition is not set up for this user. Please register images first.' 
      });
    }

    // Verify the image
    const verificationResult = user.verifyImage(imageData);
    
    if (verificationResult.success) {
      // Update verification status
      user.updateImageRecognitionStatus(true, verificationResult.confidence);
      await user.save();
      
      return res.json({
        message: 'Image verification successful',
        success: true,
        confidence: verificationResult.confidence,
        user: {
          id: user._id,
          imageRecognitionData: user.imageRecognitionData
        }
      });
    } else {
      return res.status(400).json({
        message: 'Image verification failed',
        success: false,
        confidence: verificationResult.confidence,
        user: {
          id: user._id,
          imageRecognitionData: user.imageRecognitionData
        }
      });
    }

  } catch (error) {
    console.error('Error in image verification:', error);
    res.status(500).json({ 
      message: 'Image verification failed', 
      error: error.message 
    });
  }
});

// GET /api/image-recognition/status - Get image recognition status
router.get('/status', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({
      success: true,
      imageRecognitionData: user.imageRecognitionData,
      base64ImagesCount: user.base64Images.length,
      hasImages: user.base64Images.length > 0,
      isSetup: user.imageRecognitionData.isSetup,
      isVerified: user.imageRecognitionData.isVerified,
      lastVerification: user.imageRecognitionData.lastVerification,
      verificationCount: user.imageRecognitionData.verificationCount,
      recognitionAccuracy: user.imageRecognitionData.recognitionAccuracy
    });

  } catch (error) {
    console.error('Error getting image recognition status:', error);
    res.status(500).json({ 
      message: 'Failed to get image recognition status', 
      error: error.message 
    });
  }
});

// POST /api/image-recognition/compare - Compare two images
router.post('/compare', auth, async (req, res) => {
  try {
    const { image1, image2 } = req.body;
    
    if (!image1 || !image2) {
      return res.status(400).json({ 
        message: 'Both images are required for comparison' 
      });
    }

    // Simple image comparison logic
    // In a real implementation, you would use more sophisticated image comparison
    const similarity = compareImages(image1, image2);
    
    return res.json({
      success: true,
      similarity: similarity,
      isMatch: similarity > 80, // 80% similarity threshold
      message: similarity > 80 ? 'Images match' : 'Images do not match'
    });

  } catch (error) {
    console.error('Error in image comparison:', error);
    res.status(500).json({ 
      message: 'Image comparison failed', 
      error: error.message 
    });
  }
});

// DELETE /api/image-recognition/clear - Clear all user images
router.delete('/clear', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Clear all base64 images
    user.base64Images = [];
    user.imageRecognitionData = {
      isSetup: false,
      isVerified: false,
      lastVerification: null,
      verificationCount: 0,
      recognitionAccuracy: 0
    };
    
    await user.save();

    return res.json({
      message: 'All images cleared successfully',
      success: true
    });

  } catch (error) {
    console.error('Error clearing images:', error);
    res.status(500).json({ 
      message: 'Failed to clear images', 
      error: error.message 
    });
  }
});

// Helper function to compare images
function compareImages(image1, image2) {
  // Simple image comparison based on hash similarity
  // In a real implementation, you would use more sophisticated image comparison algorithms
  
  const hash1 = generateImageHash(image1);
  const hash2 = generateImageHash(image2);
  
  // Calculate similarity based on hash comparison
  const similarity = calculateHashSimilarity(hash1, hash2);
  
  return similarity;
}

// Helper function to generate image hash
function generateImageHash(imageData) {
  let hash = 0;
  for (let i = 0; i < imageData.length; i++) {
    const char = imageData.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString();
}

// Helper function to calculate hash similarity
function calculateHashSimilarity(hash1, hash2) {
  // Simple similarity calculation based on hash comparison
  // In a real implementation, you would use more sophisticated similarity algorithms
  
  if (hash1 === hash2) return 100;
  
  const len1 = hash1.length;
  const len2 = hash2.length;
  const maxLen = Math.max(len1, len2);
  const minLen = Math.min(len1, len2);
  
  let matches = 0;
  for (let i = 0; i < minLen; i++) {
    if (hash1[i] === hash2[i]) matches++;
  }
  
  return Math.round((matches / maxLen) * 100);
}

module.exports = router;

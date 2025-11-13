const express = require('express');
const router = express.Router();
const User = require('../models/User');
const emailVerificationService = require('../utils/emailVerification');

// Send verification email
router.post('/send-verification', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is required' 
      });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Check if already verified
    if (user.emailVerified) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email already verified' 
      });
    }

    // Generate and send verification email
    const token = emailVerificationService.generateVerificationToken(email);
    
    // Save token to user
    user.verificationToken = token;
    await user.save();

    // Send email
    const result = await emailVerificationService.sendVerificationEmail(email, token);
    
    if (result.success) {
      res.json({ 
        success: true, 
        message: 'Verification email sent successfully' 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to send verification email',
        error: result.error 
      });
    }

  } catch (error) {
    console.error('Send verification error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Verify email
router.get('/verify', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ 
        success: false, 
        message: 'Verification token is required' 
      });
    }

    // Verify token
    const verificationResult = await emailVerificationService.verifyToken(token);
    
    if (!verificationResult.success) {
      return res.status(400).json({ 
        success: false, 
        message: verificationResult.message 
      });
    }

    res.json({ 
      success: true, 
      message: 'Email verified successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified
      }
    });

  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Check verification status
router.get('/status/:email', async (req, res) => {
  try {
    const { email } = req.params;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    res.json({ 
      success: true, 
      emailVerified: user.emailVerified 
    });

  } catch (error) {
    console.error('Check status error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

module.exports = router;


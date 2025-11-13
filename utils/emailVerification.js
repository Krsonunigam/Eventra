const crypto = require('crypto');
const transporter = require('../config/emailConfig');
const User = require('../models/User');

class EmailVerificationService {
  constructor() {
    // Using database storage instead of in-memory
  }

  // Generate verification token
  generateVerificationToken(email) {
    const token = crypto.randomBytes(32).toString('hex');
    return token;
  }

  // Send verification email
  async sendVerificationEmail(email, token) {
    const verificationUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/verify-email?token=${token}`;
    
    const mailOptions = {
      from: `"Eventra" <${process.env.EMAIL_USER || 'noreply@eventra.com'}>`,
      to: email,
      subject: 'Verify Your Eventra Account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #1e40af, #3b82f6); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Welcome to Eventra!</h1>
          </div>
          
          <div style="padding: 30px; background: #f8fafc;">
            <h2 style="color: #1e40af; margin-top: 0;">Email Verification Required</h2>
            
            <p>Thank you for signing up for Eventra! To complete your registration and start managing amazing events, please verify your email address.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background: #f97316; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                Verify Email Address
              </a>
            </div>
            
            <p style="color: #64748b; font-size: 14px;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <a href="${verificationUrl}" style="color: #1e40af;">${verificationUrl}</a>
            </p>
            
            <p style="color: #64748b; font-size: 14px;">
              This verification link will expire in 24 hours for security reasons.
            </p>
          </div>
          
          <div style="background: #1e40af; padding: 20px; text-align: center; color: white;">
            <p style="margin: 0; font-size: 14px;">
              © 2024 Eventra. All rights reserved.
            </p>
          </div>
        </div>
      `
    };

    // Check if we have Gmail configuration
    const hasGmailConfig = process.env.EMAIL_USER && process.env.EMAIL_PASS && 
                          process.env.EMAIL_USER !== 'your_gmail@gmail.com' && 
                          process.env.EMAIL_PASS !== 'your_app_password';
    
    if (!hasGmailConfig) {
      // In development, just log the email details
      console.log('\n📧 ===== VERIFICATION EMAIL (DEVELOPMENT) =====');
      console.log(`To: ${email}`);
      console.log(`Subject: Verify Your Eventra Account`);
      console.log(`Verification URL: ${verificationUrl}`);
      console.log('==========================================\n');
      return { success: true };
    }

    try {
      await transporter.sendMail(mailOptions);
      console.log('Verification email sent to:', email);
      return { success: true };
    } catch (error) {
      console.error('Error sending verification email:', error);
      return { success: false, error: error.message };
    }
  }

  // Verify token
  async verifyToken(token) {
    try {
      // Find user by verification token
      const user = await User.findOne({ verificationToken: token });
      
      if (!user) {
        return { success: false, message: 'Invalid verification token' };
      }
      
      // Check if token has expired (24 hours)
      const tokenAge = Date.now() - new Date(user.updatedAt).getTime();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
      
      if (tokenAge > maxAge) {
        // Clear expired token
        user.verificationToken = null;
        await user.save();
        return { success: false, message: 'Verification token has expired' };
      }
      
      // Mark email as verified and clear token
      user.emailVerified = true;
      user.verificationToken = null;
      await user.save();
      
      return { 
        success: true, 
        email: user.email,
        message: 'Email verified successfully' 
      };
    } catch (error) {
      console.error('Error verifying token:', error);
      return { success: false, message: 'Error verifying token' };
    }
  }

  // Check if email is verified
  async isEmailVerified(email) {
    try {
      const user = await User.findOne({ email });
      return user ? user.emailVerified : false;
    } catch (error) {
      console.error('Error checking email verification status:', error);
      return false;
    }
  }

  // Clean expired tokens
  async cleanExpiredTokens() {
    try {
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
      const cutoffTime = new Date(Date.now() - maxAge);
      
      // Find and clear expired tokens
      await User.updateMany(
        { 
          verificationToken: { $ne: null },
          updatedAt: { $lt: cutoffTime }
        },
        { 
          $unset: { verificationToken: 1 }
        }
      );
    } catch (error) {
      console.error('Error cleaning expired tokens:', error);
    }
  }
}

module.exports = new EmailVerificationService();

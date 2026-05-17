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
    const verificationUrl = `${process.env.CLIENT_URL || 'https://eventraind.onrender.com'}/verify-email?token=${token}`;
    
    const mailOptions = {
      from: `"Eventra" <${process.env.EMAIL_USER || 'noreply@eventra.com'}>`,
      to: email,
      subject: '🛡️ Verify Your Eventra Account',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            .button:hover { background-color: #2563eb !important; transform: translateY(-2px); }
          </style>
        </head>
        <body style="margin: 0; padding: 0; background-color: #050b18; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #ffffff;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 40px auto; background-color: #0f172a; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.5);">
            <tr>
              <td style="padding: 40px; text-align: center; background: linear-gradient(135deg, #1e40af, #3b82f6);">
                <h1 style="margin: 0; font-size: 32px; font-weight: 900; letter-spacing: -1px; color: #ffffff;">EVENTRA<span style="color: #fbbf24;">.</span></h1>
                <p style="margin: 10px 0 0; font-size: 14px; color: rgba(255,255,255,0.8); font-weight: 500;">Your Journey Starts Here</p>
              </td>
            </tr>
            <tr>
              <td style="padding: 50px 40px; text-align: center;">
                <h2 style="margin: 0 0 20px; font-size: 24px; font-weight: 800; color: #ffffff;">Verify Your Identity</h2>
                <p style="margin: 0 0 40px; font-size: 16px; line-height: 1.6; color: #94a3b8;">
                  Welcome to the future of event management! To unlock all features and start your adventure, please verify your email address by clicking the button below.
                </p>
                
                <a href="${verificationUrl}" class="button" style="display: inline-block; padding: 18px 36px; background-color: #3b82f6; color: #ffffff; text-decoration: none; border-radius: 16px; font-size: 16px; font-weight: 700; transition: all 0.3s ease; box-shadow: 0 10px 20px rgba(59, 130, 246, 0.3);">
                  Verify Account
                </a>
                
                <p style="margin: 40px 0 0; font-size: 13px; color: #475569;">
                  If the button doesn't work, copy and paste this link:<br/>
                  <a href="${verificationUrl}" style="color: #3b82f6; text-decoration: none;">${verificationUrl}</a>
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding: 30px; background-color: #020617; text-align: center; border-top: 1px solid rgba(255,255,255,0.05);">
                <p style="margin: 0; font-size: 12px; color: #475569;">
                  This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
                </p>
                <p style="margin: 20px 0 0; font-size: 12px; color: #475569; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
                  © 2024 EVENTRA TEAM
                </p>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `
    };

    // Check if we have Gmail configuration
    const hasGmailConfig = process.env.EMAIL_USER && process.env.EMAIL_PASS && 
                          process.env.EMAIL_USER !== 'your_gmail@gmail.com' && 
                          process.env.EMAIL_PASS !== 'your_app_password';
    
    if (!hasGmailConfig) {
      // In development, just log the email details
      
      
      
      
      
      return { success: true };
    }

    try {
      await transporter.sendMail(mailOptions);
      
      return { success: true };
    } catch (error) {
      
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
      
      return { success: false, message: 'Error verifying token' };
    }
  }

  // Check if email is verified
  async isEmailVerified(email) {
    try {
      const user = await User.findOne({ email });
      return user ? user.emailVerified : false;
    } catch (error) {
      
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
      
    }
  }
}

module.exports = new EmailVerificationService();

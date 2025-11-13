const nodemailer = require('nodemailer');

// Email configuration - Gmail SMTP (Free)
const emailConfig = {
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER || 'your_gmail@gmail.com',
    pass: process.env.EMAIL_PASS || 'your_app_password'
  }
};

// Create transporter
const transporter = nodemailer.createTransport(emailConfig);

// Check if Gmail credentials are configured
const hasGmailConfig = process.env.EMAIL_USER && process.env.EMAIL_PASS && 
                      process.env.EMAIL_USER !== 'your_gmail@gmail.com' && 
                      process.env.EMAIL_PASS !== 'your_app_password';

if (hasGmailConfig) {
  // Verify connection for Gmail
  transporter.verify((error, success) => {
    if (error) {
      console.log('❌ Gmail SMTP error:', error.message);
      console.log('📧 Email service: Using development mode (emails logged to console)');
    } else {
      console.log('✅ Gmail SMTP connected successfully');
      console.log('📧 Email service: Real emails will be sent');
    }
  });
} else {
  console.log('📧 Email service: Development mode - emails will be logged to console');
  console.log('💡 To enable real emails, set EMAIL_USER and EMAIL_PASS in your environment');
}

module.exports = transporter;

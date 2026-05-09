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
      // 
      // 
    } else {
      // 
      // 
    }
  });
} else {
  
  
}

module.exports = transporter;

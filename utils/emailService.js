const nodemailer = require('nodemailer');

// Create transporter
const transport = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Send verification email
const sendVerificationEmail = async (email, name, token) => {
  try {
    const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${token}`;
    
    const mailOptions = {
      from: `"Eventra" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Verify Your Eventra Account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1a1a1a; color: #ffffff; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #00d4ff; margin: 0;">Eventra</h1>
            <p style="color: #888; margin: 5px 0;">Event Management Portal</p>
          </div>
          
          <div style="background: #2a2a2a; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
            <h2 style="color: #ffffff; margin-top: 0;">Welcome to Eventra, ${name}!</h2>
            <p style="color: #cccccc; line-height: 1.6;">
              Thank you for registering with Eventra. To complete your registration and start exploring amazing events, 
              please verify your email address by clicking the button below.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background: linear-gradient(135deg, #00d4ff, #0099cc); 
                        color: #ffffff; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 8px; 
                        display: inline-block; 
                        font-weight: bold;
                        box-shadow: 0 4px 15px rgba(0, 212, 255, 0.3);">
                Verify Email Address
              </a>
            </div>
            
            <p style="color: #888; font-size: 14px; text-align: center;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <a href="${verificationUrl}" style="color: #00d4ff;">${verificationUrl}</a>
            </p>
          </div>
          
          <div style="text-align: center; color: #888; font-size: 12px;">
            <p>This verification link will expire in 24 hours.</p>
            <p>If you didn't create an account with Eventra, please ignore this email.</p>
          </div>
        </div>
      `
    };

    await transport.sendMail(mailOptions);
    console.log('Verification email sent successfully');
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw error;
  }
};

// Send event notification email
const sendEventNotification = async (email, name, eventTitle, eventDate, eventVenue) => {
  try {
    const mailOptions = {
      from: `"Eventra" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Event Reminder: ${eventTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1a1a1a; color: #ffffff; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #00d4ff; margin: 0;">Eventra</h1>
            <p style="color: #888; margin: 5px 0;">Event Management Portal</p>
          </div>
          
          <div style="background: #2a2a2a; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
            <h2 style="color: #ffffff; margin-top: 0;">Event Reminder</h2>
            <p style="color: #cccccc; line-height: 1.6;">
              Hi ${name},<br><br>
              This is a reminder that you have an upcoming event:
            </p>
            
            <div style="background: #1a1a1a; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #00d4ff; margin-top: 0;">${eventTitle}</h3>
              <p style="color: #cccccc; margin: 10px 0;"><strong>Date:</strong> ${new Date(eventDate).toLocaleDateString()}</p>
              <p style="color: #cccccc; margin: 10px 0;"><strong>Venue:</strong> ${eventVenue}</p>
            </div>
            
            <p style="color: #cccccc; line-height: 1.6;">
              Don't forget to check in at the event venue. We look forward to seeing you there!
            </p>
          </div>
          
          <div style="text-align: center; color: #888; font-size: 12px;">
            <p>This is an automated reminder from Eventra.</p>
          </div>
        </div>
      `
    };

    await transport.sendMail(mailOptions);
    console.log('Event notification email sent successfully');
  } catch (error) {
    console.error('Error sending event notification email:', error);
    throw error;
  }
};

// Send booking confirmation email
const sendBookingConfirmation = async (email, name, eventTitle, bookingReference, seatNumber, totalAmount) => {
  try {
    const mailOptions = {
      from: `"Eventra" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Booking Confirmation - ${eventTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1a1a1a; color: #ffffff; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #00d4ff; margin: 0;">Eventra</h1>
            <p style="color: #888; margin: 5px 0;">Event Management Portal</p>
          </div>
          
          <div style="background: #2a2a2a; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
            <h2 style="color: #ffffff; margin-top: 0;">Booking Confirmed!</h2>
            <p style="color: #cccccc; line-height: 1.6;">
              Hi ${name},<br><br>
              Your booking has been confirmed successfully. Here are the details:
            </p>
            
            <div style="background: #1a1a1a; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #00d4ff; margin-top: 0;">${eventTitle}</h3>
              <p style="color: #cccccc; margin: 10px 0;"><strong>Booking Reference:</strong> ${bookingReference}</p>
              <p style="color: #cccccc; margin: 10px 0;"><strong>Seat Number:</strong> ${seatNumber}</p>
              <p style="color: #cccccc; margin: 10px 0;"><strong>Total Amount:</strong> ₹${totalAmount}</p>
            </div>
            
            <p style="color: #cccccc; line-height: 1.6;">
              Please keep this confirmation email safe. You'll need it for event check-in.
            </p>
          </div>
          
          <div style="text-align: center; color: #888; font-size: 12px;">
            <p>Thank you for choosing Eventra!</p>
          </div>
        </div>
      `
    };

    await transport.sendMail(mailOptions);
    console.log('Booking confirmation email sent successfully');
  } catch (error) {
    console.error('Error sending booking confirmation email:', error);
    throw error;
  }
};

module.exports = {
  sendVerificationEmail,
  sendEventNotification,
  sendBookingConfirmation
};

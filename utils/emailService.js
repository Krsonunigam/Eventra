const sgMail = require("@sendgrid/mail");
const nodemailer = require('nodemailer');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Nodemailer transporter (Gmail SMTP - primary for OTP)
const createNodemailerTransporter = () => nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendBookingConfirmation = async (email, name, event, booking, pdf) => {
  try {
    const firstName = name.split(" ")[0];

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Booking Confirmed - Eventra</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #050b18; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #ffffff;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 20px auto; background-color: #0f172a; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.5);">
        <!-- Hero Header -->
        <tr>
          <td style="position: relative; height: 240px; background: url('${event.image || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=600&q=80'}') center/cover no-repeat;">
            <div style="position: absolute; bottom: 0; left: 0; right: 0; height: 100%; background: linear-gradient(to top, #0f172a, transparent); padding: 30px; display: flex; align-items: flex-end;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 800; text-shadow: 0 2px 10px rgba(0,0,0,0.5);">${event.title}</h1>
            </div>
          </td>
        </tr>
        
        <!-- Content Body -->
        <tr>
          <td style="padding: 40px 30px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="display: inline-block; padding: 10px 20px; background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3); border-radius: 50px; color: #22c55e; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px;">
                Booking Confirmed
              </div>
            </div>

            <p style="font-size: 18px; line-height: 1.6; color: #94a3b8; text-align: center; margin-bottom: 40px;">
              Hey <span style="color: #ffffff; font-weight: 700;">${firstName}</span>, your ticket is secured! Get ready for an incredible experience at ${event.title}.
            </p>

            <!-- Ticket Details Card -->
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 20px; padding: 30px;">
              <tr>
                <td style="padding-bottom: 20px;">
                  <table width="100%">
                    <tr>
                      <td width="50%" style="vertical-align: top;">
                        <p style="margin: 0; font-size: 11px; color: #64748b; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">Date & Time</p>
                        <p style="margin: 5px 0 0; font-size: 14px; font-weight: 600; color: #f1f5f9;">${new Date(event.dateTime.start).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}<br/>${new Date(event.dateTime.start).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                      </td>
                      <td width="50%" style="vertical-align: top; text-align: right;">
                        <p style="margin: 0; font-size: 11px; color: #64748b; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">Location</p>
                        <p style="margin: 5px 0 0; font-size: 14px; font-weight: 600; color: #f1f5f9;">${event.venue.name}<br/>${event.venue.city}</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="border-top: 1px dashed rgba(255,255,255,0.1); padding: 30px 0; text-align: center;">
                   <!-- Inline QR Code -->
                   <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${booking.verificationCode}&color=3b82f6&bgcolor=0f172a" alt="QR Code" style="border: 4px solid rgba(59, 130, 246, 0.3); border-radius: 12px;" />
                   <p style="margin: 15px 0 0; font-size: 11px; color: #64748b; font-weight: 800; text-transform: uppercase; letter-spacing: 2px;">SCAN FOR ENTRY</p>
                </td>
              </tr>
              <tr>
                <td style="border-top: 1px dashed rgba(255,255,255,0.1); padding-top: 20px;">
                  <table width="100%">
                    <tr>
                      <td width="50%">
                        <p style="margin: 0; font-size: 11px; color: #64748b; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">Quantity</p>
                        <p style="margin: 5px 0 0; font-size: 14px; font-weight: 600; color: #f1f5f9;">${booking.quantity} ${booking.quantity > 1 ? 'Tickets' : 'Ticket'}</p>
                      </td>
                      <td width="50%" style="text-align: right;">
                        <p style="margin: 0; font-size: 11px; color: #64748b; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">Pass Code</p>
                        <p style="margin: 5px 0 0; font-size: 18px; font-weight: 900; color: #3b82f6; letter-spacing: 1px;">${booking.verificationCode}</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <div style="margin-top: 40px; text-align: center;">
              <a href="https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${new Date(event.dateTime.start).toISOString().replace(/-|:|\.\d\d\d/g, "")}/${new Date(event.dateTime.end || event.dateTime.start).toISOString().replace(/-|:|\.\d\d\d/g, "")}&details=Booking+Code:+${booking.verificationCode}&location=${encodeURIComponent(event.venue.name)}" style="display: inline-block; padding: 14px 30px; background: #3b82f6; border-radius: 12px; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700; transition: all 0.3s ease;">Add to Calendar</a>
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding: 30px; background: #020617; text-align: center;">
            <p style="margin: 0; font-size: 18px; font-weight: 900; color: #ffffff; letter-spacing: -0.5px;">EVENTRA<span style="color: #3b82f6;">.</span></p>
            <p style="margin: 10px 0 0; font-size: 12px; color: #475569;">The future of event management. Built with ❤️ for organizers.</p>
            <div style="margin-top: 20px;">
              <a href="#" style="color: #64748b; text-decoration: none; margin: 0 10px; font-size: 12px;">Support</a>
              <a href="#" style="color: #64748b; text-decoration: none; margin: 0 10px; font-size: 12px;">Terms</a>
              <a href="#" style="color: #64748b; text-decoration: none; margin: 0 10px; font-size: 12px;">Privacy</a>
            </div>
          </td>
        </tr>
      </table>
    </body>
    </html>
    `;

    const msg = {
      to: email,
      from: {
        email: process.env.EMAIL_FROM || "notifications@eventra.com",
        name: "Eventra"
      },
      subject: `🎟 Confirmed: ${event.title} - Eventra`,
      html,
      attachments: pdf ? [
        {
          content: pdf.toString("base64"),
          filename: `ticket-${event.title.replace(/\s+/g, '-').toLowerCase()}.pdf`,
          type: "application/pdf",
          disposition: "attachment"
        }
      ] : []
    };

    await sgMail.send(msg);
    
  } catch (err) {
    
  }
};

// Generic event notification for reminders/cancellations
const sendEventNotification = async (email, name, eventTitle, date, venue) => {
  try {
    const html = `
    <!DOCTYPE html>
    <html>
    <body style="background-color: #050b18; font-family: sans-serif; color: #ffffff; padding: 40px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #0f172a; border-radius: 20px; padding: 40px; border: 1px solid rgba(255,255,255,0.05);">
        <h2 style="color: #3b82f6; margin-top: 0;">Event Update</h2>
        <p>Hi ${name},</p>
        <p>We have an update regarding <strong>${eventTitle}</strong>.</p>
        <div style="background: rgba(255,255,255,0.03); border-radius: 15px; padding: 20px; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px; color: #94a3b8;">Event Details:</p>
          <p style="margin: 5px 0; font-weight: bold;">${eventTitle}</p>
          <p style="margin: 0; font-size: 14px;">${new Date(date).toLocaleString()}</p>
          <p style="margin: 0; font-size: 14px;">${venue}</p>
        </div>
        <p>See you there!</p>
        <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.1); margin: 30px 0;">
        <p style="font-size: 12px; color: #475569; text-align: center;">Team Eventra</p>
      </div>
    </body>
    </html>
    `;

    const msg = {
      to: email,
      from: {
        email: process.env.EMAIL_FROM || "notifications@eventra.com",
        name: "Eventra"
      },
      subject: `Update: ${eventTitle} - Eventra`,
      html
    };

    await sgMail.send(msg);
    
  } catch (err) {
    
  }
};

const sendResetOTP = async (email, otp) => {
  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset OTP - Eventra</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #050b18; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #ffffff;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 40px auto; background-color: #0f172a; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.05);">
      <tr>
        <td style="padding: 30px; text-align: center; background: linear-gradient(135deg, #1e40af, #3b82f6);">
          <h1 style="margin: 0; font-size: 28px; font-weight: 900; letter-spacing: -1px; color: #ffffff;">EVENTRA<span style="color: #fbbf24;">.</span></h1>
          <p style="margin: 6px 0 0; font-size: 13px; color: rgba(255,255,255,0.8);">Security Alert</p>
        </td>
      </tr>
      <tr>
        <td style="padding: 40px 30px; text-align: center;">
          <h2 style="margin: 0 0 12px; font-size: 22px; color: #ffffff;">Password Reset Request</h2>
          <p style="margin: 0 0 30px; font-size: 15px; line-height: 1.6; color: #94a3b8;">
            We received a request to reset your password. Use the code below — it expires in <strong style="color: #ef4444;">5 minutes</strong>.
          </p>
          <div style="background: rgba(59, 130, 246, 0.1); border: 2px solid rgba(59, 130, 246, 0.4); border-radius: 16px; padding: 30px 40px; margin: 0 auto; display: inline-block;">
            <p style="margin: 0 0 8px; font-size: 11px; color: #3b82f6; font-weight: 800; text-transform: uppercase; letter-spacing: 3px;">Your OTP Code</p>
            <h2 style="margin: 0; font-size: 42px; color: #ffffff; letter-spacing: 8px; font-family: 'Courier New', monospace; font-weight: 900;">${otp}</h2>
          </div>
          <p style="margin: 30px 0 0; font-size: 12px; color: #64748b;">
            If you didn't request this, please ignore this email. Your password will not change.
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding: 20px 30px; background-color: #020617; text-align: center; border-top: 1px solid rgba(255,255,255,0.05);">
          <p style="margin: 0; font-size: 11px; color: #475569;">© Eventra Team &bull; Secure Event Management</p>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;

  // Try Nodemailer (Gmail) first — more reliable for transactional emails
  const hasGmailConfig = process.env.EMAIL_USER && process.env.EMAIL_PASS;
  if (hasGmailConfig) {
    try {
      const transporter = createNodemailerTransporter();
      await transporter.sendMail({
        from: `"Eventra Security" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: '🔒 Your Eventra Password Reset Code',
        html
      });
      console.log(`OTP email sent via Nodemailer to ${email}`);
      return;
    } catch (nodemailerErr) {
      console.error('Nodemailer OTP send failed, trying SendGrid:', nodemailerErr.message);
    }
  }

  // Fallback to SendGrid
  try {
    await sgMail.send({
      to: email,
      from: { email: process.env.EMAIL_FROM || 'notifications@eventra.com', name: 'Eventra Security' },
      subject: '🔒 Your Eventra Password Reset Code',
      html
    });
    console.log(`OTP email sent via SendGrid to ${email}`);
  } catch (sgErr) {
    console.error('SendGrid OTP send also failed:', sgErr.message);
    throw new Error('Unable to send OTP email. Please try again later.');
  }
};

const sendCertificateEmail = async (email, name, eventTitle, certificateId, verificationCode, pdfBuffer) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
  const verifyUrl = `${clientUrl}/verify-certificate/${verificationCode}`;

  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Certificate - Eventra</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #050b18; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #ffffff;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 40px auto; background-color: #0f172a; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.05);">
      <tr>
        <td style="padding: 35px 30px; text-align: center; background: linear-gradient(135deg, #1e40af, #3b82f6);">
          <h1 style="margin: 0; font-size: 30px; font-weight: 900; letter-spacing: -1px; color: #ffffff;">EVENTRA<span style="color: #fbbf24;">.</span></h1>
          <p style="margin: 8px 0 0; font-size: 13px; color: rgba(255,255,255,0.85);">Certificate of Participation</p>
        </td>
      </tr>
      <tr>
        <td style="padding: 40px 30px; text-align: center;">
          <div style="display: inline-block; padding: 10px 24px; background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3); border-radius: 50px; color: #22c55e; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 28px;">
            🏆 Certificate Issued
          </div>
          <h2 style="margin: 0 0 10px; font-size: 24px; font-weight: 800; color: #ffffff;">Congratulations, ${name}!</h2>
          <p style="margin: 0 0 30px; font-size: 15px; line-height: 1.7; color: #94a3b8;">
            You have successfully completed <strong style="color: #ffffff;">${eventTitle}</strong> and earned your official certificate of participation.
          </p>
          
          <div style="background: rgba(59, 130, 246, 0.08); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 16px; padding: 24px; margin: 0 0 30px;">
            <p style="margin: 0 0 6px; font-size: 11px; color: #3b82f6; font-weight: 800; text-transform: uppercase; letter-spacing: 2px;">Certificate ID</p>
            <p style="margin: 0; font-size: 18px; font-weight: 900; color: #ffffff; font-family: 'Courier New', monospace; letter-spacing: 2px;">${certificateId}</p>
          </div>

          <a href="${verifyUrl}" style="display: inline-block; padding: 16px 36px; background: #3b82f6; border-radius: 14px; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 700; box-shadow: 0 8px 20px rgba(59, 130, 246, 0.35); margin-bottom: 20px;">
            View & Download Certificate
          </a>

          <p style="margin: 20px 0 0; font-size: 12px; color: #64748b;">
            You can also verify this certificate at:<br>
            <a href="${verifyUrl}" style="color: #3b82f6; text-decoration: none;">${verifyUrl}</a>
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding: 24px 30px; background-color: #020617; text-align: center; border-top: 1px solid rgba(255,255,255,0.05);">
          <p style="margin: 0; font-size: 11px; color: #475569;">© Eventra Team • Secure Event Management • Your achievement is permanently recorded.</p>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;

  const hasGmailConfig = process.env.EMAIL_USER && process.env.EMAIL_PASS;
  if (hasGmailConfig) {
    try {
      const transporter = createNodemailerTransporter();
      const mailOptions = {
        from: `"Eventra Certificates" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `🏆 Your Certificate for ${eventTitle} - Eventra`,
        html
      };

      if (pdfBuffer) {
        mailOptions.attachments = [{
          filename: `Certificate_${certificateId}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }];
      }

      await transporter.sendMail(mailOptions);
      console.log(`Certificate email sent via Nodemailer to ${email}`);
      return;
    } catch (err) {
      console.error('Nodemailer certificate email failed, trying SendGrid:', err.message);
    }
  }

  try {
    const sgMessage = {
      to: email,
      from: { email: process.env.EMAIL_FROM || 'notifications@eventra.com', name: 'Eventra Certificates' },
      subject: `🏆 Your Certificate for ${eventTitle} - Eventra`,
      html
    };

    if (pdfBuffer) {
      sgMessage.attachments = [{
        content: pdfBuffer.toString('base64'),
        filename: `Certificate_${certificateId}.pdf`,
        type: 'application/pdf',
        disposition: 'attachment'
      }];
    }

    await sgMail.send(sgMessage);
    console.log(`Certificate email sent via SendGrid to ${email}`);
  } catch (sgErr) {
    console.error('SendGrid certificate email also failed:', sgErr.message);
  }
};

module.exports = { sendBookingConfirmation, sendEventNotification, sendResetOTP, sendCertificateEmail };
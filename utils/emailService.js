const sgMail = require("@sendgrid/mail");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

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

module.exports = { sendBookingConfirmation, sendEventNotification };
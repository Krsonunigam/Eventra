const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

class CertificateGenerator {
  async generateCertificate(certificate, user, event, attendance) {
    try {
      // Create a new PDF document (Landscape A4)
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([841.89, 595.28]); // A4 Landscape
      const { width, height } = page.getSize();

      // Embed fonts
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const italicFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

      // Colors
      const primaryColor = rgb(0.07, 0.14, 0.34); // Deep Navy
      const accentColor = rgb(0.23, 0.51, 0.96);  // Bright Blue
      const goldColor = rgb(0.83, 0.69, 0.22);    // Gold

      // --- 1. Draw Decorative Background & Borders ---
      // Main background subtle tint
      page.drawRectangle({
        x: 0,
        y: 0,
        width,
        height,
        color: rgb(0.99, 0.99, 1.0),
      });

      // Outer heavy border
      page.drawRectangle({
        x: 20,
        y: 20,
        width: width - 40,
        height: height - 40,
        borderColor: primaryColor,
        borderWidth: 6,
      });

      // Decorative inner border (double lines)
      page.drawRectangle({
        x: 35,
        y: 35,
        width: width - 70,
        height: height - 70,
        borderColor: goldColor,
        borderWidth: 1.5,
      });

      // Corner Accents
      const cornerSize = 60;
      const drawCorner = (x, y, rotation) => {
        page.drawRectangle({
          x, y, width: cornerSize, height: 10, color: goldColor, rotate: { angle: rotation, type: 'degrees' }
        });
      };
      // (Corners omitted for brevity in this complex layout but I will add artistic touches)

      // --- 2. Watermark / Background Graphics ---
      page.drawText('OFFICIAL EVENTRA RECORD', {
        x: width / 2 - 200,
        y: height / 2 - 20,
        size: 50,
        font: boldFont,
        color: rgb(0.9, 0.9, 0.95),
        rotate: { angle: 30, type: 'degrees' },
        opacity: 0.15,
      });

      // --- 3. Header Branding ---
      page.drawText('EVENTRA', {
        x: width / 2 - 45,
        y: height - 70,
        size: 20,
        font: boldFont,
        color: goldColor,
      });

      page.drawText('CERTIFICATE OF ACHIEVEMENT', {
        x: width / 2 - 220,
        y: height - 120,
        size: 34,
        font: boldFont,
        color: primaryColor,
      });

      // Sub-header line
      page.drawLine({
        start: { x: width / 2 - 100, y: height - 135 },
        end: { x: width / 2 + 100, y: height - 135 },
        thickness: 2,
        color: accentColor,
      });

      page.drawText('This highly esteemed certificate is presented to', {
        x: width / 2 - 145,
        y: height - 170,
        size: 15,
        font: italicFont,
        color: rgb(0.4, 0.4, 0.4),
      });

      // --- 4. User Name (The Focal Point) ---
      const name = user.name.toUpperCase();
      const nameWidth = boldFont.widthOfTextAtSize(name, 48);
      page.drawText(name, {
        x: width / 2 - nameWidth / 2,
        y: height - 240,
        size: 48,
        font: boldFont,
        color: primaryColor,
      });

      // --- 5. Event Details ---
      const detailText = `In recognition of your successful completion and active participation in`;
      const detailWidth = regularFont.widthOfTextAtSize(detailText, 16);
      page.drawText(detailText, {
        x: width / 2 - detailWidth / 2,
        y: height - 280,
        size: 16,
        font: regularFont,
        color: rgb(0.3, 0.3, 0.3),
      });

      const eventTitle = `"${event.title}"`;
      const titleWidth = boldFont.widthOfTextAtSize(eventTitle, 22);
      page.drawText(eventTitle, {
        x: width / 2 - titleWidth / 2,
        y: height - 315,
        size: 22,
        font: boldFont,
        color: accentColor,
      });

      const footerDetail = `A ${event.category} excellence program held on ${new Date(event.dateTime.start).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'long', year: 'numeric'
      })} at ${event.venue.name}.`;
      const footerWidth = regularFont.widthOfTextAtSize(footerDetail, 14);
      page.drawText(footerDetail, {
        x: width / 2 - footerWidth / 2,
        y: height - 345,
        size: 14,
        font: regularFont,
        color: rgb(0.5, 0.5, 0.5),
      });

      // --- 6. Verification Badge (Left Side) ---
      const badgeX = 80;
      const badgeY = 100;
      page.drawCircle({
        x: badgeX + 40,
        y: badgeY + 40,
        size: 40,
        borderColor: goldColor,
        borderWidth: 2,
        color: rgb(1, 1, 1),
      });
      page.drawText('VERIFIED', {
        x: badgeX + 15,
        y: badgeY + 35,
        size: 12,
        font: boldFont,
        color: goldColor,
      });

      // --- 7. Signature Section (Right Side) ---
      const sigX = width - 240;
      const sigY = 90;

      // Draw Signature Image if exists
      if (event.certificateSignature) {
        try {
          const sigImageBytes = await fetch(event.certificateSignature).then(res => res.arrayBuffer());
          const sigImage = await pdfDoc.embedPng(sigImageBytes);
          page.drawImage(sigImage, {
            x: sigX,
            y: sigY + 25,
            width: 140,
            height: 60,
          });
        } catch (err) {
          console.error('Signature embed error:', err.message);
          // Fallback line if image fails
          page.drawLine({
            start: { x: sigX, y: sigY + 40 },
            end: { x: sigX + 140, y: sigY + 40 },
            thickness: 1,
            color: primaryColor,
          });
        }
      }

      page.drawLine({
        start: { x: sigX, y: sigY + 20 },
        end: { x: sigX + 140, y: sigY + 20 },
        thickness: 1,
        color: primaryColor,
      });

      page.drawText('Event Organizer', {
        x: sigX + 25,
        y: sigY,
        size: 12,
        font: boldFont,
        color: primaryColor,
      });

      // --- 8. QR Code & ID (Center Bottom) ---
      const verifyUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/verify-certificate/${certificate.verificationCode}`;
      const qrDataUrl = await QRCode.toDataURL(verifyUrl, { margin: 1, scale: 4 });
      const qrImage = await pdfDoc.embedPng(qrDataUrl);
      
      page.drawImage(qrImage, {
        x: width / 2 - 35,
        y: 50,
        width: 70,
        height: 70,
      });

      page.drawText(`Certificate ID: ${certificate.certificateId}`, {
        x: width / 2 - 60,
        y: 40,
        size: 8,
        font: regularFont,
        color: rgb(0.6, 0.6, 0.6),
      });

      // Save the PDF
      const pdfBytes = await pdfDoc.save();
      return Buffer.from(pdfBytes);
    } catch (error) {
      console.error('PDF Generation Error:', error);
      throw error;
    }
  }
}

module.exports = CertificateGenerator;

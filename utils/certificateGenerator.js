const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const QRCode = require('qrcode');
const axios = require('axios');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

class CertificateGenerator {
  async generateCertificate(certificate, user, event, attendance) {
    try {
      // Create a new PDF document (Landscape A4)
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([841.89, 595.28]);
      const { width, height } = page.getSize();

      // Load Fonts
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const italicFont = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
      const nameFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBoldItalic);

      // Colors
      const primaryColor = rgb(0.1, 0.1, 0.2); // Navy
      const accentColor = rgb(0.145, 0.388, 0.921); // Eventra Blue
      const goldColor = rgb(0.831, 0.686, 0.216); // Gold

      // --- Logo Embedding ---
      let logoImage = null;
      try {
        const logoSvgPath = path.join(__dirname, '..', 'client', 'public', 'eventra-logo.svg');
        if (fs.existsSync(logoSvgPath)) {
          const logoPngBuffer = await sharp(logoSvgPath).resize(300).png().toBuffer();
          logoImage = await pdfDoc.embedPng(logoPngBuffer);
        }
      } catch (err) {
        console.error('Logo embedding error:', err.message);
      }

      // --- 1. Background & Border ---
      // Artistic Border
      page.drawRectangle({
        x: 20,
        y: 20,
        width: width - 40,
        height: height - 40,
        borderColor: accentColor,
        borderWidth: 2,
      });

      page.drawRectangle({
        x: 35,
        y: 35,
        width: width - 70,
        height: height - 70,
        borderColor: goldColor,
        borderWidth: 1.5,
      });

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

      // --- 3. Header Branding & Logo ---
      if (logoImage) {
        page.drawImage(logoImage, {
          x: width / 2 - 60,
          y: height - 90,
          width: 120,
          height: 60,
        });
      } else {
        const brandName = 'EVENTRA';
        const brandWidth = boldFont.widthOfTextAtSize(brandName, 20);
        page.drawText(brandName, {
          x: width / 2 - brandWidth / 2,
          y: height - 70,
          size: 20,
          font: boldFont,
          color: goldColor,
        });
      }

      const certTitle = 'CERTIFICATE OF ACHIEVEMENT';
      const certTitleWidth = boldFont.widthOfTextAtSize(certTitle, 28);
      page.drawText(certTitle, {
        x: width / 2 - certTitleWidth / 2,
        y: height - 135,
        size: 28,
        font: boldFont,
        color: primaryColor,
      });

      // Sub-header line
      page.drawLine({
        start: { x: width / 2 - 120, y: height - 150 },
        end: { x: width / 2 + 120, y: height - 150 },
        thickness: 1.5,
        color: accentColor,
      });

      const presentedTo = 'This highly esteemed certificate is presented to';
      const presentedWidth = italicFont.widthOfTextAtSize(presentedTo, 15);
      page.drawText(presentedTo, {
        x: width / 2 - presentedWidth / 2,
        y: height - 185,
        size: 15,
        font: italicFont,
        color: rgb(0.4, 0.4, 0.4),
      });

      // --- 4. User Name (The Focal Point) ---
      // Name in Italic/Cursive style (TimesBoldItalic)
      const name = user.name;
      const nameWidth = nameFont.widthOfTextAtSize(name, 42);
      page.drawText(name, {
        x: width / 2 - nameWidth / 2,
        y: height - 250,
        size: 42,
        font: nameFont,
        color: primaryColor,
      });

      // Underline for name
      page.drawLine({
        start: { x: width / 2 - nameWidth / 2 - 10, y: height - 255 },
        end: { x: width / 2 + nameWidth / 2 + 10, y: height - 255 },
        thickness: 1,
        color: goldColor,
      });

      // --- 5. Event Details ---
      const detailText = `In recognition of your successful completion and active participation in`;
      const detailWidth = regularFont.widthOfTextAtSize(detailText, 16);
      page.drawText(detailText, {
        x: width / 2 - detailWidth / 2,
        y: height - 290,
        size: 16,
        font: regularFont,
        color: rgb(0.3, 0.3, 0.3),
      });

      const eventTitle = `"${event.title}"`;
      const titleWidth = boldFont.widthOfTextAtSize(eventTitle, 22);
      page.drawText(eventTitle, {
        x: width / 2 - titleWidth / 2,
        y: height - 325,
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
        y: height - 355,
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
      const sigX = width - 260;
      const sigY = 90;

      // Draw Signature Image if exists, else draw fallback text
      if (event.certificateSignature) {
        try {
          const response = await axios.get(event.certificateSignature, { responseType: 'arraybuffer' });
          const sigImageBytes = response.data;
          
          let sigImage;
          try {
            // Try PNG first
            sigImage = await pdfDoc.embedPng(sigImageBytes);
          } catch (pngErr) {
            try {
              // Try JPG if PNG fails
              sigImage = await pdfDoc.embedJpg(sigImageBytes);
            } catch (jpgErr) {
              throw new Error('Image is neither PNG nor JPG');
            }
          }

          if (sigImage) {
            page.drawImage(sigImage, {
              x: sigX + 10,
              y: sigY + 25,
              width: 120,
              height: 50,
            });
          }
        } catch (err) {
          console.error('Signature embed error details:', err);
          // Fallback if image fails
          page.drawText(event.organizer?.name || 'Authorized Signatory', {
            x: sigX + 10,
            y: sigY + 35,
            size: 18,
            font: italicFont,
            color: accentColor,
          });
        }
      } else {
        // Professional Fallback Signature
        page.drawText(event.organizer?.name || 'Authorized Signatory', {
          x: sigX + 10,
          y: sigY + 35,
          size: 18,
          font: italicFont,
          color: accentColor,
        });
      }

      page.drawLine({
        start: { x: sigX, y: sigY + 20 },
        end: { x: sigX + 140, y: sigY + 20 },
        thickness: 1.5,
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
      const verifyUrl = `${process.env.CLIENT_URL || 'https://eventraind.onrender.com'}/verify-certificate/${certificate.verificationCode}`;
      const qrDataUrl = await QRCode.toDataURL(verifyUrl, { margin: 1, scale: 4 });
      const qrImage = await pdfDoc.embedPng(qrDataUrl);
      
      page.drawImage(qrImage, {
        x: width / 2 - 35,
        y: 50,
        width: 70,
        height: 70,
      });

      const certIdText = `Certificate ID: ${certificate.certificateId}`;
      const certIdWidth = regularFont.widthOfTextAtSize(certIdText, 8);
      page.drawText(certIdText, {
        x: width / 2 - certIdWidth / 2,
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

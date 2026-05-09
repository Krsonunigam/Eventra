const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');

class CertificateGenerator {
  constructor() {
    this.doc = null;
  }

  // Generate certificate PDF with watermark
  async generateCertificate(certificate, user, event, attendance) {
    return new Promise(async (resolve, reject) => {
      try {
        // Create PDF document with A4 size
        this.doc = new PDFDocument({
          size: 'A4',
          margin: 50,
          info: {
            Title: `Certificate - ${certificate.title}`,
            Author: 'Eventra',
            Subject: 'Event Certificate',
            Creator: 'Eventra Platform'
          }
        });

        const buffers = [];
        this.doc.on('data', buffers.push.bind(buffers));
        this.doc.on('end', () => {
          const pdfData = Buffer.concat(buffers);
          resolve(pdfData);
        });

        // Draw watermark background
        this.drawWatermark();

        // Draw certificate border
        this.drawCertificateBorder();

        // Draw header
        this.drawHeader();

        // Draw certificate content
        this.drawCertificateContent(certificate, user, event, attendance);

        // Draw QR code for verification
        await this.drawVerificationQR(certificate);

        // Draw footer
        this.drawFooter(certificate);

        this.doc.end();

      } catch (error) {
        reject(error);
      }
    });
  }

  drawWatermark() {
    try {
      // Try to load the logo file
      const logoPath = path.join(__dirname, '..', 'logo.png');
      if (fs.existsSync(logoPath)) {
        // Create subtle watermark with logo
        this.doc.save();
        this.doc.opacity(0.05); // Very low opacity for watermark
        this.doc.image(logoPath, 0, 0, { 
          width: this.doc.page.width,
          height: this.doc.page.height,
          fit: [this.doc.page.width, this.doc.page.height]
        });
        this.doc.restore();
      } else {
        // Fallback to text watermark
        this.doc.save();
        this.doc.opacity(0.03);
        this.doc.fontSize(60);
        this.doc.fillColor('#cccccc');
        
        // Create diagonal watermark pattern
        for (let i = 0; i < 8; i++) {
          for (let j = 0; j < 6; j++) {
            this.doc.text('EVENTRA', 50 + i * 120, 100 + j * 120, {
              angle: -45,
              align: 'center'
            });
          }
        }
        this.doc.restore();
      }
    } catch (error) {
      
    }
  }

  drawCertificateBorder() {
    // Draw decorative border
    this.doc.rect(30, 30, this.doc.page.width - 60, this.doc.page.height - 60)
      .lineWidth(3)
      .stroke('#1E3A8A');

    // Inner border
    this.doc.rect(40, 40, this.doc.page.width - 80, this.doc.page.height - 80)
      .lineWidth(1)
      .stroke('#6B7280');
  }

  drawHeader() {
    // Main title
    this.doc.fontSize(28)
      .font('Helvetica-Bold')
      .fillColor('#1E3A8A')
      .text('CERTIFICATE OF COMPLETION', this.doc.page.width / 2, 80, {
        align: 'center'
      });

    // Subtitle
    this.doc.fontSize(16)
      .font('Helvetica')
      .fillColor('#6B7280')
      .text('This is to certify that', this.doc.page.width / 2, 120, {
        align: 'center'
      });
  }

  drawCertificateContent(certificate, user, event, attendance) {
    const centerX = this.doc.page.width / 2;
    let currentY = 160;

    // Recipient name
    this.doc.fontSize(24)
      .font('Helvetica-Bold')
      .fillColor('#000000')
      .text(user.name, centerX, currentY, {
        align: 'center'
      });

    currentY += 50;

    // Completion text
    this.doc.fontSize(16)
      .font('Helvetica')
      .fillColor('#374151')
      .text('has successfully completed', centerX, currentY, {
        align: 'center'
      });

    currentY += 40;

    // Event title
    this.doc.fontSize(20)
      .font('Helvetica-Bold')
      .fillColor('#1E3A8A')
      .text(event.title, centerX, currentY, {
        align: 'center'
      });

    currentY += 50;

    // Event details
    this.doc.fontSize(14)
      .font('Helvetica')
      .fillColor('#6B7280')
      .text(`Date: ${new Date(event.dateTime.start).toLocaleDateString()}`, centerX, currentY, {
        align: 'center'
      });

    currentY += 25;
    this.doc.text(`Duration: ${this.calculateDuration(event.dateTime.start, event.dateTime.end)} hours`, centerX, currentY, {
      align: 'center'
    });

    currentY += 25;
    this.doc.text(`Venue: ${event.venue.name}`, centerX, currentY, {
      align: 'center'
    });

    currentY += 25;
    this.doc.text(`Attendance Method: ${attendance.method.toUpperCase()}`, centerX, currentY, {
      align: 'center'
    });

    currentY += 50;

    // Certificate details
    this.doc.fontSize(12)
      .font('Helvetica')
      .fillColor('#6B7280')
      .text(`Certificate ID: ${certificate.certificateId}`, centerX, currentY, {
        align: 'center'
      });

    currentY += 20;
    this.doc.text(`Certificate Number: ${certificate.certificateNumber}`, centerX, currentY, {
      align: 'center'
    });

    currentY += 20;
    this.doc.text(`Issued Date: ${new Date(certificate.issuedDate).toLocaleDateString()}`, centerX, currentY, {
      align: 'center'
    });

    currentY += 20;
    this.doc.text(`Valid Until: ${new Date(certificate.validUntil).toLocaleDateString()}`, centerX, currentY, {
      align: 'center'
    });
  }

  async drawVerificationQR(certificate) {
    try {
      // Generate QR code with verification URL
      const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-certificate/${certificate.verificationCode}`;
      const qrCodeDataURL = await QRCode.toDataURL(verificationUrl, {
        width: 100,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      // Draw QR code in bottom right
      const qrX = this.doc.page.width - 150;
      const qrY = this.doc.page.height - 150;
      
      this.doc.image(qrCodeDataURL, qrX, qrY, { width: 100, height: 100 });

      // Add verification text
      this.doc.fontSize(10)
        .font('Helvetica')
        .fillColor('#6B7280')
        .text('Scan to verify', qrX, qrY + 110, {
          align: 'center',
          width: 100
        });
    } catch (error) {
      
    }
  }

  drawFooter(certificate) {
    const centerX = this.doc.page.width / 2;
    const footerY = this.doc.page.height - 100;

    // Signature line
    this.doc.fontSize(12)
      .font('Helvetica')
      .fillColor('#000000')
      .text('Authorized Signature', centerX - 100, footerY, {
        align: 'center',
        width: 200
      });

    // Date line
    this.doc.text('Date', centerX + 100, footerY, {
      align: 'center',
      width: 200
    });

    // Organization name
    this.doc.fontSize(14)
      .font('Helvetica-Bold')
      .fillColor('#1E3A8A')
      .text('Eventra Platform', centerX, footerY + 30, {
        align: 'center'
      });

    // Verification code
    this.doc.fontSize(10)
      .font('Helvetica')
      .fillColor('#6B7280')
      .text(`Verification Code: ${certificate.verificationCode}`, centerX, footerY + 50, {
        align: 'center'
      });
  }

  calculateDuration(start, end) {
    const startTime = new Date(start);
    const endTime = new Date(end);
    const durationMs = endTime - startTime;
    return Math.round(durationMs / (1000 * 60 * 60) * 10) / 10; // Round to 1 decimal place
  }
}

module.exports = CertificateGenerator;

const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

class PDFGenerator {
  constructor() {
    this.doc = null;
  }

  // Clean airplane-style event pass with logo watermark
  async generateEventPass(booking, event, user) {
    return new Promise(async (resolve, reject) => {
      try {
        // Create PDF document with airplane ticket dimensions
        this.doc = new PDFDocument({
          size: [612, 200], // 8.5 x 2.5 inches - standard airline ticket size
          margin: 0,
          info: {
            Title: `Event Pass - ${event.title}`,
            Author: 'Eventra',
            Subject: 'Event Pass',
            Creator: 'Eventra Platform'
          }
        });

        const buffers = [];
        this.doc.on('data', buffers.push.bind(buffers));
        this.doc.on('end', () => {
          const pdfData = Buffer.concat(buffers);
          resolve(pdfData);
        });

        // Generate expanded QR Code for comprehensive verification
        const qrData = {
          bookingId: booking._id,
          userId: booking.user?._id || booking.user,
          eventId: event._id,
          verificationCode: booking.verificationCode,
          timestamp: new Date().toISOString()
        };

        const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
          width: 80, // Slightly larger for better readability of more data
          margin: 1,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });

        // Draw logo and student name watermark background
        this.drawLogoWatermark(user.name);

        // Draw clean airplane-style ticket
        this.drawCleanAirplaneTicket(event, user, booking, qrCodeDataURL);

        this.doc.end();

      } catch (error) {
        reject(error);
      }
    });
  }

  drawLogoWatermark(studentName = 'EVENTRA') {
    try {
      // Try to load the logo file
      const logoPath = path.join(__dirname, '..', 'logo.png');
      if (fs.existsSync(logoPath)) {
        // Create subtle logo watermark
        this.doc.save();
        this.doc.opacity(0.08); // Very subtle opacity
        
        // Calculate watermark positions
        const logoSize = 80;
        const spacing = 150;
        
        for (let x = -50; x < 700; x += spacing) {
          for (let y = -50; y < 250; y += spacing) {
            try {
              this.doc.image(logoPath, x, y, { 
                width: logoSize, 
                height: logoSize,
                fit: [logoSize, logoSize]
              });
            } catch (logoError) {
              // If logo fails, use text fallback
              this.drawTextWatermark(x, y, studentName);
            }
          }
        }
        
        this.doc.restore();
      } else {
        // Fallback to text watermark if logo not found
        this.drawTextWatermark(0, 0, studentName);
      }
    } catch (error) {
      
      this.drawTextWatermark(0, 0, studentName);
    }
  }

  drawTextWatermark(x = 0, y = 0, text = 'EVENTRA') {
    this.doc.save();
    this.doc.opacity(0.05);
    this.doc.fillColor('#CCCCCC');
    
    // Create diagonal watermark pattern
    for (let wx = -100; wx < 700; wx += 120) {
      for (let wy = -50; wy < 250; wy += 80) {
        this.doc.text(text.toUpperCase(), wx, wy, {
          fontSize: 20,
          angle: -45,
          align: 'center'
        });
      }
    }
    
    this.doc.restore();
  }

  drawCleanAirplaneTicket(event, user, booking, qrCodeDataURL) {
    const pageWidth = 612;
    const pageHeight = 200;
    const margin = 10;
    
    // Background - Off-white for premium feel
    this.doc.rect(0, 0, pageWidth, pageHeight).fill('#F9FAFB');

    // Main Card Container with rounded corners
    this.doc.roundedRect(margin, margin, pageWidth - margin * 2, pageHeight - margin * 2, 8)
           .fill('#FFFFFF');
    
    // Subtle shadow-like border
    this.doc.roundedRect(margin, margin, pageWidth - margin * 2, pageHeight - margin * 2, 8)
           .lineWidth(0.5)
           .stroke('#E5E7EB');

    // Accent Header Bar
    this.doc.roundedRect(margin, margin, pageWidth - margin * 2, 40, 8)
           .fill('#1E1B4B'); // Deep indigo

    // Main ticket section (left 70%)
    const mainSectionWidth = pageWidth * 0.70;
    this.drawMainSection(event, user, booking, qrCodeDataURL, mainSectionWidth, pageHeight);

    // Stub section (right 30%)
    const stubSectionStart = mainSectionWidth;
    const stubSectionWidth = pageWidth - stubSectionStart;
    
    // Perforated edge effect
    this.drawPerforation(mainSectionWidth, margin, pageHeight - margin);
    
    this.drawStubSection(event, booking, stubSectionStart, stubSectionWidth, pageHeight);
  }

  drawMainSection(event, user, booking, qrCodeDataURL, sectionWidth, pageHeight) {
    const margin = 25;
    let currentY = 22;

    // Logo / Brand on header
    this.doc.fillColor('#FFFFFF')
           .fontSize(16)
           .font('Helvetica-Bold')
           .text('EVENTRA', margin, currentY);

    this.doc.fillColor('#A5B4FC') // Light indigo
           .fontSize(8)
           .font('Helvetica')
           .text('OFFICIAL EVENT PASS', margin + 85, currentY + 6);

    currentY = 65;

    // Event Title (Large and Bold)
    this.doc.fillColor('#111827')
           .fontSize(14)
           .font('Helvetica-Bold')
           .text(event.title?.toUpperCase() || 'EVENT NAME', margin, currentY, { width: sectionWidth - 100 });

    currentY += 25;

    // Grid Layout for details
    const col1 = margin;
    const col2 = margin + 140;

    // Row 1: Date & Time
    this.drawLabelValue(col1, currentY, 'DATE', this.formatDate(event.dateTime?.start));
    this.drawLabelValue(col2, currentY, 'TIME', this.formatTime(event.dateTime?.start));

    currentY += 35;

    // Row 2: Venue
    this.drawLabelValue(col1, currentY, 'VENUE', event.venue?.name || 'ONLINE EVENT');
    
    // Seat info on same row
    const seat = this.generateRandomSeat();
    this.drawLabelValue(col2, currentY, 'SEAT / GATE', `${seat}  •  GATE 1`);

    currentY += 35;

    // Row 3: USER
    this.drawLabelValue(col1, currentY, 'USER', user.name || 'GUEST');
    this.doc.fillColor('#6B7280')
           .fontSize(7)
           .text(user.email || '', col1, currentY + 18);

    // QR Code Section (Right side of main section)
    const qrX = sectionWidth - 85;
    const qrY = 60;
    
    // QR Code Frame
    this.doc.roundedRect(qrX - 5, qrY - 5, 70, 70, 4)
           .fill('#F3F4F6');
    
    this.doc.image(qrCodeDataURL, qrX, qrY, { width: 60, height: 60 });

    this.doc.fillColor('#9CA3AF')
           .fontSize(6)
           .font('Helvetica')
           .text('SCAN FOR ENTRY', qrX, qrY + 68, { width: 60, align: 'center' });
    
    // Price Tag
    this.doc.fillColor('#1E1B4B')
           .fontSize(14)
           .font('Helvetica-Bold')
           .text(`₹${event.price || '0'}`, sectionWidth - 85, pageHeight - 35, { width: 70, align: 'right' });
  }

  drawLabelValue(x, y, label, value) {
    this.doc.fillColor('#6B7280')
           .fontSize(7)
           .font('Helvetica-Bold')
           .text(label, x, y);

    this.doc.fillColor('#1F2937')
           .fontSize(10)
           .font('Helvetica')
           .text(value, x, y + 10, { width: 130, ellipsis: true });
  }

  drawPerforation(x, yStart, yEnd) {
    this.doc.save();
    this.doc.strokeColor('#E5E7EB')
           .dash(3, { space: 4 })
           .lineWidth(1)
           .moveTo(x, yStart)
           .lineTo(x, yEnd)
           .stroke()
           .restore();

    // Circle cutouts top and bottom
    this.doc.circle(x, yStart, 6).fill('#F9FAFB');
    this.doc.circle(x, yEnd, 6).fill('#F9FAFB');
  }

  drawStubSection(event, booking, sectionStart, sectionWidth, pageHeight) {
    const margin = 15;
    let currentY = 22;

    // Stub header on navy background
    this.doc.fillColor('#FFFFFF')
           .fontSize(11)
           .font('Helvetica-Bold')
           .text('RECEIPT', sectionStart + margin, currentY);

    currentY = 65;

    // Booking Details
    this.drawLabelValue(sectionStart + margin, currentY, 'BOOKING ID', booking._id.toString().substring(0, 10).toUpperCase());
    
    currentY += 35;
    
    this.drawLabelValue(sectionStart + margin, currentY, 'VERIFICATION', booking.verificationCode || '---');
    
    currentY += 35;

    // Status Badge
    this.doc.fillColor('#6B7280')
           .fontSize(7)
           .font('Helvetica-Bold')
           .text('STATUS', sectionStart + margin, currentY);
    
    const status = booking.status?.toUpperCase() || 'CONFIRMED';
    const statusColor = status === 'CONFIRMED' ? '#059669' : '#DC2626';
    
    this.doc.fillColor(statusColor)
           .fontSize(9)
           .font('Helvetica-Bold')
           .text(status, sectionStart + margin, currentY + 10);

    // Bottom Barcode
    this.drawCleanBarcode(booking.verificationCode || 'EVENTRA', sectionStart + margin, pageHeight - 40, sectionWidth - 30);
  }

  drawCleanBarcode(data, x, y, width) {
    const barHeight = 15;
    const barWidth = 1.2;
    const numBars = Math.floor(width / barWidth);
    
    this.doc.save();
    for (let i = 0; i < numBars; i++) {
      const barX = x + (i * barWidth);
      // Pseudo-random barcode look
      if ((i % 3 === 0 && i % 2 !== 0) || (i % 7 === 0)) {
        this.doc.fillColor('#1F2937')
               .rect(barX, y, barWidth, barHeight)
               .fill();
      }
    }
    
    this.doc.fillColor('#9CA3AF')
           .fontSize(6)
           .text(new Date().toLocaleDateString('en-GB'), x, y + barHeight + 4);
    this.doc.restore();
  }

  generateRandomSeat() {
    const rows = 'ABCDEFG';
    const row = rows[Math.floor(Math.random() * rows.length)];
    const number = Math.floor(Math.random() * 30) + 1; // 1-30
    return `${row}${number}`;
  }

  formatDate(dateString) {
    if (!dateString) return 'DD-MM-YYYY';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB');
  }

  formatTime(dateString) {
    if (!dateString) return 'HH:MM';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }
}

module.exports = PDFGenerator;
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

        // Generate QR Code with all details needed by admin scanner
        const qrData = {
          bookingId: booking._id,
          eventId: event._id,
          userId: user._id,
          eventTitle: event.title,
          attendeeName: user.name,
          attendeeEmail: user.email,
          eventDate: event.dateTime.start,
          venue: event.venue?.name,
          verificationCode: booking.verificationCode
        };

        const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
          width: 60,
          margin: 1,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });

        // Draw logo watermark background
        this.drawLogoWatermark();

        // Draw clean airplane-style ticket
        this.drawCleanAirplaneTicket(event, user, booking, qrCodeDataURL);

        this.doc.end();

      } catch (error) {
        reject(error);
      }
    });
  }

  drawLogoWatermark() {
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
              this.drawTextWatermark(x, y);
            }
          }
        }
        
        this.doc.restore();
      } else {
        // Fallback to text watermark if logo not found
        this.drawTextWatermark();
      }
    } catch (error) {
      console.log('Logo watermark error, using text fallback');
      this.drawTextWatermark();
    }
  }

  drawTextWatermark(x = 0, y = 0) {
    this.doc.save();
    this.doc.opacity(0.05);
    this.doc.fillColor('#CCCCCC');
    
    // Create diagonal watermark pattern
    for (let wx = -100; wx < 700; wx += 120) {
      for (let wy = -50; wy < 250; wy += 80) {
        this.doc.text('EVENTRA', wx, wy, {
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
    
    // Clean white background
    this.doc.rect(0, 0, pageWidth, pageHeight).fill('#FFFFFF');

    // Subtle border
    this.doc.rect(8, 8, pageWidth - 16, pageHeight - 16)
           .stroke('#E5E5E5')
           .lineWidth(1);

    // Main ticket section (left 65%)
    const mainSectionWidth = pageWidth * 0.65;
    this.drawMainSection(event, user, booking, qrCodeDataURL, mainSectionWidth, pageHeight);

    // Clean separator line
    this.drawCleanSeparator(mainSectionWidth, 15, mainSectionWidth, pageHeight - 15);

    // Stub section (right 35%)
    const stubSectionStart = mainSectionWidth;
    const stubSectionWidth = pageWidth - stubSectionStart;
    this.drawStubSection(event, booking, stubSectionStart, stubSectionWidth, pageHeight);
  }

  drawMainSection(event, user, booking, qrCodeDataURL, sectionWidth, pageHeight) {
    const margin = 20;
    let currentY = 25;

    // Clean header with proper alignment
    this.doc.fillColor('#1E3A8A') // Professional blue
           .fontSize(18)
           .font('Helvetica-Bold')
           .text('EVENTRA', margin, currentY);

    this.doc.fillColor('#6B7280') // Gray subtitle
           .fontSize(10)
           .font('Helvetica')
           .text('EVENT PASS', margin + 80, currentY + 3);

    currentY += 30;

    // Event details with clean alignment
    this.drawEventDetails(event, margin, currentY);
    currentY += 80;

    // Passenger details with clean alignment
    this.drawPassengerDetails(user, margin, currentY);
    currentY += 40;

    // Seat and gate info
    this.drawSeatInfo(margin, currentY);

    // QR Code positioned cleanly
    const qrX = sectionWidth - 75;
    const qrY = 25;
    this.doc.image(qrCodeDataURL, qrX, qrY, { width: 60, height: 60 });

    // Confirmation code below QR
    this.doc.fillColor('#000000')
           .fontSize(8)
           .font('Helvetica-Bold')
           .text('CONFIRMATION', qrX - 5, qrY + 65);

    this.doc.fillColor('#6B7280')
           .fontSize(7)
           .font('Helvetica')
           .text(booking.verificationCode || 'ABC123', qrX - 2, qrY + 75);

    // Price in bottom right
    const priceY = pageHeight - 25;
    this.doc.fillColor('#1E3A8A')
           .fontSize(12)
           .font('Helvetica-Bold')
           .text(`₹${event.price || '300'}`, qrX, priceY);
  }

  drawEventDetails(event, startX, startY) {
    // Event title
    this.doc.fillColor('#000000')
           .fontSize(12)
           .font('Helvetica-Bold')
           .text('EVENT', startX, startY);

    this.doc.fillColor('#000000')
           .fontSize(10)
           .font('Helvetica')
           .text(event.title || 'EVENT NAME', startX + 50, startY);

    // Date and time with proper alignment
    this.doc.fillColor('#000000')
           .fontSize(10)
           .font('Helvetica-Bold')
           .text('DATE', startX, startY + 20);

    const eventDate = this.formatDate(event.dateTime?.start);
    this.doc.fillColor('#000000')
           .fontSize(9)
           .font('Helvetica')
           .text(eventDate, startX + 50, startY + 20);

    this.doc.fillColor('#000000')
           .fontSize(10)
           .font('Helvetica-Bold')
           .text('TIME', startX + 150, startY + 20);

    const eventTime = this.formatTime(event.dateTime?.start);
    this.doc.fillColor('#000000')
           .fontSize(9)
           .font('Helvetica')
           .text(eventTime, startX + 190, startY + 20);

    // Venue
    this.doc.fillColor('#000000')
           .fontSize(10)
           .font('Helvetica-Bold')
           .text('VENUE', startX, startY + 40);

    this.doc.fillColor('#000000')
           .fontSize(9)
           .font('Helvetica')
           .text(event.venue?.name || 'VENUE NAME', startX + 50, startY + 40, {
             width: 200,
             ellipsis: true
           });
  }

  drawPassengerDetails(user, startX, startY) {
    this.doc.fillColor('#000000')
           .fontSize(10)
           .font('Helvetica-Bold')
           .text('PASSENGER', startX, startY);

    this.doc.fillColor('#000000')
           .fontSize(10)
           .font('Helvetica')
           .text(user.name || 'ATTENDEE NAME', startX + 70, startY);

    // Email below name
    this.doc.fillColor('#6B7280')
           .fontSize(8)
           .font('Helvetica')
           .text(user.email || 'email@example.com', startX + 70, startY + 15);
  }

  drawSeatInfo(startX, startY) {
    // Seat
    this.doc.fillColor('#000000')
           .fontSize(10)
           .font('Helvetica-Bold')
           .text('SEAT', startX, startY);

    // Generate random seat like A12-F30
    const seat = this.generateRandomSeat();

    this.doc.fillColor('#1E3A8A')
           .fontSize(10)
           .font('Helvetica-Bold')
           .text(seat, startX + 40, startY);

    // Gate
    this.doc.fillColor('#000000')
           .fontSize(10)
           .font('Helvetica-Bold')
           .text('GATE', startX + 80, startY);

    this.doc.fillColor('#1E3A8A')
           .fontSize(10)
           .font('Helvetica-Bold')
           .text('1', startX + 120, startY);

    // Removed class label to avoid confusion
  }

  generateRandomSeat() {
    const rows = 'ABCDEFG';
    const row = rows[Math.floor(Math.random() * rows.length)];
    const number = Math.floor(Math.random() * 30) + 1; // 1-30
    return `${row}${number}`;
  }

  drawStubSection(event, booking, sectionStart, sectionWidth, pageHeight) {
    const margin = 15;
    let currentY = 25;

    // Stub header
    this.doc.fillColor('#1E3A8A')
           .fontSize(12)
           .font('Helvetica-Bold')
           .text('RECEIPT', sectionStart + margin, currentY);

    currentY += 25;

    // Booking details with clean alignment
    this.doc.fillColor('#000000')
           .fontSize(9)
           .font('Helvetica-Bold')
           .text('BOOKING ID', sectionStart + margin, currentY);

    this.doc.fillColor('#6B7280')
           .fontSize(8)
           .font('Helvetica')
           .text(booking._id.toString().substring(0, 12), sectionStart + margin, currentY + 12);

    currentY += 35;

    // Amount
    this.doc.fillColor('#000000')
           .fontSize(9)
           .font('Helvetica-Bold')
           .text('AMOUNT', sectionStart + margin, currentY);

    this.doc.fillColor('#059669')
           .fontSize(10)
           .font('Helvetica-Bold')
           .text(`₹${booking.totalAmount || '300'}`, sectionStart + margin, currentY + 12);

    currentY += 35;

    // Status
    this.doc.fillColor('#000000')
           .fontSize(9)
           .font('Helvetica-Bold')
           .text('STATUS', sectionStart + margin, currentY);

    this.doc.fillColor('#059669')
           .fontSize(8)
           .font('Helvetica-Bold')
           .text(booking.status?.toUpperCase() || 'CONFIRMED', sectionStart + margin, currentY + 12);

    // Date at bottom
    const bookingDate = new Date(booking.createdAt).toLocaleDateString('en-GB');
    this.doc.fillColor('#6B7280')
           .fontSize(7)
           .font('Helvetica')
           .text(bookingDate, sectionStart + margin, pageHeight - 20);

    // Small barcode at bottom
    this.drawCleanBarcode(booking.verificationCode || 'BARCODE123', sectionStart + margin, pageHeight - 35, 60);
  }

  drawCleanSeparator(x, y1, x2, y2) {
    const dashLength = 4;
    const gapLength = 3;
    const totalLength = Math.abs(y2 - y1);
    const numDashes = Math.floor(totalLength / (dashLength + gapLength));

    this.doc.strokeColor('#D1D5DB')
           .lineWidth(1);

    for (let i = 0; i < numDashes; i++) {
      const startY = y1 + i * (dashLength + gapLength);
      const endY = startY + dashLength;
      this.doc.moveTo(x, startY)
             .lineTo(x, endY)
             .stroke();
    }
  }

  drawCleanBarcode(data, x, y, width) {
    const barHeight = 12;
    const numBars = Math.floor(width / 2);
    
    for (let i = 0; i < numBars; i++) {
      const barWidth = 1.5;
      const barX = x + (i * barWidth);
      
      // Create realistic barcode pattern
      if (i % 2 === 0 && Math.random() > 0.3) {
        this.doc.fillColor('#000000')
               .rect(barX, y, barWidth, barHeight)
               .fill();
      }
    }
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
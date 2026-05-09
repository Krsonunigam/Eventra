const express = require('express');
const Booking = require('../models/Booking');
const Event = require('../models/Event');
const User = require('../models/User');
const { adminAuth } = require('../middleware/auth');
const PDFGenerator = require('../utils/pdfGenerator');
const ExcelJS = require('exceljs');

const router = express.Router();

// Test endpoint to check if there are any bookings
router.get('/test', adminAuth, async (req, res) => {
  try {
    const totalBookings = await Booking.countDocuments();
    const sampleBookings = await Booking.find().limit(5).populate('user', 'name email').populate('event', 'title');
    
    res.json({
      totalBookings,
      sampleBookings: sampleBookings.map(b => ({
        id: b._id,
        status: b.status,
        totalAmount: b.totalAmount,
        user: b.user?.name,
        event: b.event?.title,
        createdAt: b.createdAt
      }))
    });
  } catch (error) {
    
    res.status(500).json({ message: 'Test failed', error: error.message });
  }
});

// Get booking statistics
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    
    const match = {};
    // Only apply date filter if both dates are provided
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      // Set end date to end of day
      end.setHours(23, 59, 59, 999);
      
      match.createdAt = {
        $gte: start,
        $lte: end
      };
      
      
    }

    

    const stats = await Booking.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalBookings: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' },
          confirmedBookings: {
            $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] }
          },
          cancelledBookings: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
          },
          pendingBookings: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          refundedBookings: {
            $sum: { $cond: [{ $eq: ['$status', 'refunded'] }, 1, 0] }
          }
        }
      }
    ]);

    

    const result = stats[0] || {
      totalBookings: 0,
      totalRevenue: 0,
      confirmedBookings: 0,
      cancelledBookings: 0,
      pendingBookings: 0,
      refundedBookings: 0
    };

    
    res.json(result);
  } catch (error) {
    
    res.status(500).json({ message: 'Failed to fetch booking statistics', error: error.message });
  }
});

// Get recent bookings with filters
router.get('/bookings', adminAuth, async (req, res) => {
  try {
    const { startDate, endDate, status, search, page = 1, limit = 50 } = req.query;
    
    
    const match = {};
    
    // Date range filter - only apply if both dates are provided
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      // Set end date to end of day
      end.setHours(23, 59, 59, 999);
      
      match.createdAt = {
        $gte: start,
        $lte: end
      };
      
      
    }
    
    // Status filter
    if (status && status !== 'all') {
      match.status = status;
    }

    // Search filter
    if (search) {
      match.$or = [
        { verificationCode: { $regex: search, $options: 'i' } }
      ];
    }

    

    const bookings = await Booking.find(match)
      .populate('user', 'name email studentId institute phoneNumber')
      .populate('event', 'title dateTime venue price category')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    
    

    // If search term provided, filter by user/event names
    let filteredBookings = bookings;
    if (search) {
      filteredBookings = bookings.filter(booking => {
        const searchLower = search.toLowerCase();
        return (
          booking.user?.name?.toLowerCase().includes(searchLower) ||
          booking.user?.email?.toLowerCase().includes(searchLower) ||
          booking.event?.title?.toLowerCase().includes(searchLower)
        );
      });
    }

    
    res.json({ bookings: filteredBookings });
  } catch (error) {
    
    res.status(500).json({ message: 'Failed to fetch bookings', error: error.message });
  }
});

// Export bookings as PDF
router.get('/export/pdf', adminAuth, async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;
    
    const match = {};
    if (startDate && endDate) {
      match.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    if (status && status !== 'all') {
      match.status = status;
    }

    const bookings = await Booking.find(match)
      .populate('user', 'name email studentId institute')
      .populate('event', 'title dateTime venue price')
      .sort({ createdAt: -1 });

    // Generate PDF report
    const pdfGenerator = new PDFGenerator();
    const pdfBuffer = await pdfGenerator.generateBookingReport(bookings, {
      startDate,
      endDate,
      status
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="bookings-report-${startDate}-to-${endDate}.pdf"`);
    res.send(pdfBuffer);

  } catch (error) {
    
    res.status(500).json({ message: 'Failed to export PDF report', error: error.message });
  }
});

// Export bookings as Excel
router.get('/export/excel', adminAuth, async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;
    
    const match = {};
    if (startDate && endDate) {
      match.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    if (status && status !== 'all') {
      match.status = status;
    }

    const bookings = await Booking.find(match)
      .populate('user', 'name email studentId institute')
      .populate('event', 'title dateTime venue price')
      .sort({ createdAt: -1 });

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Bookings Report');

    // Add headers
    worksheet.columns = [
      { header: 'Booking ID', key: 'verificationCode', width: 15 },
      { header: 'User Name', key: 'userName', width: 20 },
      { header: 'User Email', key: 'userEmail', width: 25 },
      { header: 'Event Title', key: 'eventTitle', width: 30 },
      { header: 'Event Date', key: 'eventDate', width: 20 },
      { header: 'Venue', key: 'venue', width: 25 },
      { header: 'Quantity', key: 'quantity', width: 10 },
      { header: 'Amount', key: 'totalAmount', width: 15 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Booking Date', key: 'createdAt', width: 20 },
      { header: 'Payment Date', key: 'paymentDate', width: 20 }
    ];

    // Add data rows
    bookings.forEach(booking => {
      worksheet.addRow({
        verificationCode: booking.verificationCode,
        userName: booking.user?.name || 'N/A',
        userEmail: booking.user?.email || 'N/A',
        eventTitle: booking.event?.title || 'N/A',
        eventDate: booking.event?.dateTime?.start ? new Date(booking.event.dateTime.start).toLocaleDateString() : 'N/A',
        venue: booking.event?.venue?.name || 'N/A',
        quantity: booking.quantity,
        totalAmount: booking.totalAmount,
        status: booking.status,
        createdAt: new Date(booking.createdAt).toLocaleDateString(),
        paymentDate: booking.paymentDate ? new Date(booking.paymentDate).toLocaleDateString() : 'N/A'
      });
    });

    // Style the header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F46E5' }
    };

    // Generate Excel buffer
    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="bookings-report-${startDate}-to-${endDate}.xlsx"`);
    res.send(buffer);

  } catch (error) {
    
    res.status(500).json({ message: 'Failed to export Excel report', error: error.message });
  }
});

module.exports = router;

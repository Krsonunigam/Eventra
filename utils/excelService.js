const ExcelJS = require('exceljs');

// Generate Excel report for attendance
const generateExcelReport = async (attendanceList, event, type = 'all') => {
  try {
    const workbook = new ExcelJS.Workbook();
    
    // Create worksheets for different reports
    const attendeesSheet = workbook.addWorksheet('Attendees');
    const nonAttendeesSheet = workbook.addWorksheet('Non-Attendees');
    const summarySheet = workbook.addWorksheet('Summary');

    // Set up attendees sheet
    attendeesSheet.columns = [
      { header: 'S.No', key: 'sno', width: 8 },
      { header: 'Name', key: 'name', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Student ID', key: 'studentId', width: 15 },
      { header: 'Phone', key: 'phoneNumber', width: 15 },
      { header: 'Institute', key: 'institute', width: 25 },
      { header: 'Seat Number', key: 'seatNumber', width: 15 },
      { header: 'Hall', key: 'hall', width: 15 },
      { header: 'Check-in Time', key: 'checkInTime', width: 20 },
      { header: 'Face Verified', key: 'faceVerified', width: 15 },
      { header: 'Confidence', key: 'confidence', width: 12 },
      { header: 'Amount Paid', key: 'amount', width: 15 }
    ];

    // Set up non-attendees sheet
    nonAttendeesSheet.columns = [
      { header: 'S.No', key: 'sno', width: 8 },
      { header: 'Name', key: 'name', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Student ID', key: 'studentId', width: 15 },
      { header: 'Phone', key: 'phoneNumber', width: 15 },
      { header: 'Institute', key: 'institute', width: 25 },
      { header: 'Seat Number', key: 'seatNumber', width: 15 },
      { header: 'Hall', key: 'hall', width: 15 },
      { header: 'Amount Paid', key: 'amount', width: 15 },
      { header: 'Refund Eligible', key: 'refundEligible', width: 15 }
    ];

    // Set up summary sheet
    summarySheet.columns = [
      { header: 'Metric', key: 'metric', width: 30 },
      { header: 'Value', key: 'value', width: 20 }
    ];

    // Add data to attendees sheet
    let attendeeCount = 0;
    const attendees = attendanceList.filter(a => a.status === 'present');
    
    attendees.forEach((attendance, index) => {
      attendeeCount++;
      attendeesSheet.addRow({
        sno: attendeeCount,
        name: attendance.user.name,
        email: attendance.user.email,
        studentId: attendance.user.studentId,
        phoneNumber: attendance.user.phoneNumber,
        institute: attendance.user.institute,
        seatNumber: attendance.booking.seatNumber,
        hall: attendance.booking.hall,
        checkInTime: attendance.checkInTime ? new Date(attendance.checkInTime).toLocaleString() : 'N/A',
        faceVerified: attendance.faceVerification.isVerified ? 'Yes' : 'No',
        confidence: attendance.faceVerification.confidence.toFixed(2),
        amount: `₹${attendance.booking.totalAmount}`
      });
    });

    // Add data to non-attendees sheet
    let nonAttendeeCount = 0;
    const nonAttendees = attendanceList.filter(a => a.status === 'absent');
    
    nonAttendees.forEach((attendance, index) => {
      nonAttendeeCount++;
      nonAttendeesSheet.addRow({
        sno: nonAttendeeCount,
        name: attendance.user.name,
        email: attendance.user.email,
        studentId: attendance.user.studentId,
        phoneNumber: attendance.user.phoneNumber,
        institute: attendance.user.institute,
        seatNumber: attendance.booking.seatNumber,
        hall: attendance.booking.hall,
        amount: `₹${attendance.booking.totalAmount}`,
        refundEligible: 'Yes'
      });
    });

    // Add summary data
    const totalBookings = attendanceList.length;
    const totalAttendees = attendees.length;
    const totalNonAttendees = nonAttendees.length;
    const attendanceRate = totalBookings > 0 ? (totalAttendees / totalBookings * 100).toFixed(2) : 0;
    const totalRevenue = attendanceList.reduce((sum, a) => sum + a.booking.totalAmount, 0);

    summarySheet.addRows([
      { metric: 'Event Title', value: event.title },
      { metric: 'Event Date', value: new Date(event.dateTime.start).toLocaleDateString() },
      { metric: 'Venue', value: event.venue.name },
      { metric: 'Total Capacity', value: event.capacity },
      { metric: 'Total Bookings', value: totalBookings },
      { metric: 'Total Attendees', value: totalAttendees },
      { metric: 'Total Non-Attendees', value: totalNonAttendees },
      { metric: 'Attendance Rate', value: `${attendanceRate}%` },
      { metric: 'Total Revenue', value: `₹${totalRevenue}` },
      { metric: 'Report Generated', value: new Date().toLocaleString() }
    ]);

    // Style the headers
    [attendeesSheet, nonAttendeesSheet, summarySheet].forEach(sheet => {
      sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      sheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1a1a1a' }
      };
      sheet.getRow(1).alignment = { horizontal: 'center' };
    });

    // Auto-fit columns
    [attendeesSheet, nonAttendeesSheet, summarySheet].forEach(sheet => {
      sheet.columns.forEach(column => {
        column.width = Math.max(column.width, 12);
      });
    });

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;

  } catch (error) {
    console.error('Error generating Excel report:', error);
    throw error;
  }
};

// Generate user registration report
const generateUserReport = async (users) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Registered Users');

    sheet.columns = [
      { header: 'S.No', key: 'sno', width: 8 },
      { header: 'Name', key: 'name', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Student ID', key: 'studentId', width: 15 },
      { header: 'Institute', key: 'institute', width: 25 },
      { header: 'Phone', key: 'phoneNumber', width: 15 },
      { header: 'Date of Birth', key: 'dateOfBirth', width: 15 },
      { header: 'Email Verified', key: 'emailVerified', width: 15 },
      { header: 'Face Verified', key: 'faceVerified', width: 15 },
      { header: 'Interests', key: 'interests', width: 30 },
      { header: 'Registration Date', key: 'createdAt', width: 20 },
      { header: 'Last Login', key: 'lastLogin', width: 20 }
    ];

    users.forEach((user, index) => {
      sheet.addRow({
        sno: index + 1,
        name: user.name,
        email: user.email,
        studentId: user.studentId,
        institute: user.institute,
        phoneNumber: user.phoneNumber,
        dateOfBirth: new Date(user.dateOfBirth).toLocaleDateString(),
        emailVerified: user.isEmailVerified ? 'Yes' : 'No',
        faceVerified: user.isFaceVerified ? 'Yes' : 'No',
        interests: user.interests.join(', '),
        createdAt: new Date(user.createdAt).toLocaleString(),
        lastLogin: user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'
      });
    });

    // Style the header
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1a1a1a' }
    };
    sheet.getRow(1).alignment = { horizontal: 'center' };

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;

  } catch (error) {
    console.error('Error generating user report:', error);
    throw error;
  }
};

// Generate event report
const generateEventReport = async (events) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Events');

    sheet.columns = [
      { header: 'S.No', key: 'sno', width: 8 },
      { header: 'Title', key: 'title', width: 30 },
      { header: 'Category', key: 'category', width: 15 },
      { header: 'Venue', key: 'venue', width: 25 },
      { header: 'Start Date', key: 'startDate', width: 20 },
      { header: 'End Date', key: 'endDate', width: 20 },
      { header: 'Price', key: 'price', width: 12 },
      { header: 'Capacity', key: 'capacity', width: 12 },
      { header: 'Available Seats', key: 'availableSeats', width: 15 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Registration Deadline', key: 'deadline', width: 20 },
      { header: 'Created Date', key: 'createdAt', width: 20 }
    ];

    events.forEach((event, index) => {
      sheet.addRow({
        sno: index + 1,
        title: event.title,
        category: event.category,
        venue: event.venue.name,
        startDate: new Date(event.dateTime.start).toLocaleString(),
        endDate: new Date(event.dateTime.end).toLocaleString(),
        price: `₹${event.price}`,
        capacity: event.capacity,
        availableSeats: event.availableSeats,
        status: event.status,
        deadline: new Date(event.registrationDeadline).toLocaleString(),
        createdAt: new Date(event.createdAt).toLocaleString()
      });
    });

    // Style the header
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1a1a1a' }
    };
    sheet.getRow(1).alignment = { horizontal: 'center' };

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;

  } catch (error) {
    console.error('Error generating event report:', error);
    throw error;
  }
};

module.exports = {
  generateExcelReport,
  generateUserReport,
  generateEventReport
};

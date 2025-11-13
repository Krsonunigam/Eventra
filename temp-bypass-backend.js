const fs = require('fs');
const path = require('path');

console.log('🔧 CREATING TEMPORARY BACKEND BYPASS FOR DEBUGGING\n');
console.log('=' .repeat(60));

// Path to the attendance routes file
const attendanceRoutesPath = path.join(__dirname, 'routes', 'attendance.js');

try {
  // Read the current attendance routes file
  let attendanceRoutes = fs.readFileSync(attendanceRoutesPath, 'utf8');
  
  console.log('📋 Current attendance routes file found');
  console.log(`   Path: ${attendanceRoutesPath}`);
  
  // Create a backup
  const backupPath = attendanceRoutesPath + '.backup';
  fs.writeFileSync(backupPath, attendanceRoutes);
  console.log(`✅ Backup created: ${backupPath}`);
  
  // Find and replace attendance window checks
  const originalWindowCheck = `// Check attendance window (15 minutes before to 2 hours after event start)
    const now = new Date();
    const eventStart = new Date(event.dateTime.start);
    const eventEnd = new Date(event.dateTime.end);
    const attendanceWindowStart = new Date(eventStart.getTime() - 15 * 60 * 1000); // 15 minutes before
    const attendanceWindowEnd = new Date(eventEnd.getTime() + 2 * 60 * 60 * 1000); // 2 hours after end

    if (now < attendanceWindowStart) {
      return res.status(400).json({
        message: 'Attendance window is not open yet',
        opensAt: attendanceWindowStart.toISOString(),
        success: false
      });
    }

    if (now > attendanceWindowEnd) {
      return res.status(400).json({
        message: 'Attendance window has closed',
        closedAt: attendanceWindowEnd.toISOString(),
        success: false
      });
    }`;

  const bypassedWindowCheck = `// TEMPORARY BYPASS: Attendance window check disabled for debugging
    const now = new Date();
    const eventStart = new Date(event.dateTime.start);
    const eventEnd = new Date(event.dateTime.end);
    const attendanceWindowStart = new Date(eventStart.getTime() - 15 * 60 * 1000); // 15 minutes before
    const attendanceWindowEnd = new Date(eventEnd.getTime() + 2 * 60 * 60 * 1000); // 2 hours after end

    // TEMPORARY BYPASS: Commented out for debugging
    /*
    if (now < attendanceWindowStart) {
      return res.status(400).json({
        message: 'Attendance window is not open yet',
        opensAt: attendanceWindowStart.toISOString(),
        success: false
      });
    }

    if (now > attendanceWindowEnd) {
      return res.status(400).json({
        message: 'Attendance window has closed',
        closedAt: attendanceWindowEnd.toISOString(),
        success: false
      });
    }
    */
    
    // DEBUG: Log attendance window info
    console.log('DEBUG: Attendance window check bypassed for debugging');
    console.log('DEBUG: Event start:', eventStart.toISOString());
    console.log('DEBUG: Event end:', eventEnd.toISOString());
    console.log('DEBUG: Attendance window start:', attendanceWindowStart.toISOString());
    console.log('DEBUG: Attendance window end:', attendanceWindowEnd.toISOString());
    console.log('DEBUG: Current time:', now.toISOString());`;

  // Replace the attendance window check
  if (attendanceRoutes.includes(originalWindowCheck)) {
    attendanceRoutes = attendanceRoutes.replace(originalWindowCheck, bypassedWindowCheck);
    console.log('✅ Attendance window check replaced with bypass');
  } else {
    console.log('⚠️ Original attendance window check not found, trying alternative pattern...');
    
    // Try alternative pattern
    const alternativePattern = `if (now < attendanceWindowStart) {
      return res.status(400).json({
        message: 'Attendance window is not open yet',
        opensAt: attendanceWindowStart.toISOString(),
        success: false
      });
    }`;
    
    const bypassedPattern = `// TEMPORARY BYPASS: Attendance window check disabled for debugging
    /*
    if (now < attendanceWindowStart) {
      return res.status(400).json({
        message: 'Attendance window is not open yet',
        opensAt: attendanceWindowStart.toISOString(),
        success: false
      });
    }
    */
    
    // DEBUG: Log attendance window info
    console.log('DEBUG: Attendance window check bypassed for debugging');
    console.log('DEBUG: Event start:', eventStart.toISOString());
    console.log('DEBUG: Event end:', eventEnd.toISOString());
    console.log('DEBUG: Attendance window start:', attendanceWindowStart.toISOString());
    console.log('DEBUG: Attendance window end:', attendanceWindowEnd.toISOString());
    console.log('DEBUG: Current time:', now.toISOString());`;
    
    if (attendanceRoutes.includes(alternativePattern)) {
      attendanceRoutes = attendanceRoutes.replace(alternativePattern, bypassedPattern);
      console.log('✅ Alternative attendance window check replaced with bypass');
    } else {
      console.log('❌ Could not find attendance window check pattern');
      console.log('📋 Please manually comment out the attendance window checks in routes/attendance.js');
      console.log('📋 Look for lines containing "Attendance window is not open yet"');
      return;
    }
  }
  
  // Write the modified file
  fs.writeFileSync(attendanceRoutesPath, attendanceRoutes);
  console.log('✅ Modified attendance routes file saved');
  
  console.log('\n🎯 BYPASS IMPLEMENTED:');
  console.log('1. ✅ Attendance window checks are now bypassed');
  console.log('2. ✅ Debug logging added to console');
  console.log('3. ✅ Original file backed up');
  
  console.log('\n🚀 NEXT STEPS:');
  console.log('1. Restart your server');
  console.log('2. Test attendance functionality');
  console.log('3. Check console for debug information');
  console.log('4. When done debugging, run restore-backend.js to restore original code');
  
} catch (error) {
  console.error('❌ Error creating backend bypass:', error);
  console.log('\n📋 Manual bypass instructions:');
  console.log('1. Open routes/attendance.js');
  console.log('2. Find the attendance window check (around line with "Attendance window is not open yet")');
  console.log('3. Comment out the if statements that check the time');
  console.log('4. Save the file and restart your server');
}

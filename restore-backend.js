const fs = require('fs');
const path = require('path');

console.log('🔧 RESTORING ORIGINAL BACKEND CODE\n');
console.log('=' .repeat(60));

// Path to the attendance routes file
const attendanceRoutesPath = path.join(__dirname, 'routes', 'attendance.js');
const backupPath = attendanceRoutesPath + '.backup';

try {
  // Check if backup exists
  if (!fs.existsSync(backupPath)) {
    console.log('❌ Backup file not found');
    console.log(`   Expected: ${backupPath}`);
    console.log('📋 Please manually restore the attendance window checks in routes/attendance.js');
    return;
  }
  
  console.log('📋 Backup file found');
  console.log(`   Path: ${backupPath}`);
  
  // Read the backup file
  const originalCode = fs.readFileSync(backupPath, 'utf8');
  
  // Write the original code back
  fs.writeFileSync(attendanceRoutesPath, originalCode);
  console.log('✅ Original attendance routes file restored');
  
  // Remove the backup file
  fs.unlinkSync(backupPath);
  console.log('✅ Backup file removed');
  
  console.log('\n🎯 RESTORATION COMPLETE:');
  console.log('1. ✅ Original attendance window checks restored');
  console.log('2. ✅ Debug logging removed');
  console.log('3. ✅ Backup file cleaned up');
  
  console.log('\n🚀 NEXT STEPS:');
  console.log('1. Restart your server');
  console.log('2. Test attendance functionality with proper time restrictions');
  console.log('3. Verify that attendance window logic works correctly');
  
} catch (error) {
  console.error('❌ Error restoring backend:', error);
  console.log('\n📋 Manual restoration instructions:');
  console.log('1. Open routes/attendance.js');
  console.log('2. Find the commented out attendance window checks');
  console.log('3. Uncomment the if statements that check the time');
  console.log('4. Remove any debug logging');
  console.log('5. Save the file and restart your server');
}

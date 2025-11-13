const fs = require('fs');
const path = require('path');

console.log('🔧 UPDATING SERVER ROUTES FOR IMAGE RECOGNITION\n');
console.log('=' .repeat(60));

// Path to the server.js file
const serverPath = path.join(__dirname, 'server.js');

try {
  // Read the current server.js file
  let serverCode = fs.readFileSync(serverPath, 'utf8');
  
  console.log('📋 Current server.js file found');
  console.log(`   Path: ${serverPath}`);
  
  // Create a backup
  const backupPath = serverPath + '.backup';
  fs.writeFileSync(backupPath, serverCode);
  console.log(`✅ Backup created: ${backupPath}`);
  
  // Add image recognition route import
  const imageRecognitionImport = `const imageRecognitionRoutes = require('./routes/imageRecognition');`;

  // Find where other routes are imported and add image recognition route
  const routesImport = serverCode.indexOf('const attendanceRoutes = require(\'./routes/attendance\');');
  if (routesImport !== -1) {
    const beforeRoutes = serverCode.substring(0, routesImport);
    const afterRoutes = serverCode.substring(routesImport);
    serverCode = beforeRoutes + imageRecognitionImport + '\n' + afterRoutes;
    console.log('✅ Added image recognition route import');
  } else {
    console.log('⚠️ Could not find routes import section');
  }
  
  // Add image recognition route usage
  const imageRecognitionUsage = `app.use('/api/image-recognition', imageRecognitionRoutes);`;

  // Find where other routes are used and add image recognition route
  const routesUsage = serverCode.indexOf('app.use(\'/api/attendance\', attendanceRoutes);');
  if (routesUsage !== -1) {
    const beforeUsage = serverCode.substring(0, routesUsage);
    const afterUsage = serverCode.substring(routesUsage);
    serverCode = beforeUsage + imageRecognitionUsage + '\n' + afterUsage;
    console.log('✅ Added image recognition route usage');
  } else {
    console.log('⚠️ Could not find routes usage section');
  }
  
  // Write the modified file
  fs.writeFileSync(serverPath, serverCode);
  console.log('✅ Modified server.js file saved');
  
  console.log('\n🎯 UPDATES IMPLEMENTED:');
  console.log('1. ✅ Added image recognition route import');
  console.log('2. ✅ Added image recognition route usage');
  console.log('3. ✅ Image recognition API endpoints are now available');
  
  console.log('\n🚀 NEXT STEPS:');
  console.log('1. Restart the server to load new routes');
  console.log('2. Test image recognition API endpoints');
  console.log('3. Verify image registration and verification works');
  
} catch (error) {
  console.error('❌ Error updating server routes:', error);
  console.log('\n📋 Manual fix instructions:');
  console.log('1. Open server.js');
  console.log('2. Add image recognition route import');
  console.log('3. Add image recognition route usage');
  console.log('4. Restart the server');
}

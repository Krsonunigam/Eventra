/**
 * Python 3.10 Setup Script for Eventra
 * This script helps you set up Python 3.10 in your Eventra folder
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🐍 Setting up Python 3.10 for Eventra Face Recognition...\n');

// Check if python310 folder already exists
const python310Path = path.join(__dirname, 'python310');
const python310Exe = path.join(python310Path, 'python.exe');

if (fs.existsSync(python310Exe)) {
    console.log('✅ Python 3.10 already exists in python310 folder');
    console.log(`📍 Path: ${python310Exe}`);
    
    // Test if it works
    try {
        const version = execSync(`"${python310Exe}" --version`, { encoding: 'utf8', stdio: 'pipe' });
        console.log(`✅ Version: ${version.trim()}`);
        
        // Check if required packages are installed
        console.log('\n📦 Checking required packages...');
        const requiredPackages = ['opencv-python', 'numpy', 'face_recognition', 'Pillow'];
        
        for (const package of requiredPackages) {
            try {
                execSync(`"${python310Exe}" -c "import ${package.replace('-', '_')}"`, { stdio: 'pipe' });
                console.log(`✅ ${package} is installed`);
            } catch (error) {
                console.log(`❌ ${package} is NOT installed`);
            }
        }
        
        console.log('\n🎉 Python 3.10 setup is complete!');
        console.log('💡 If any packages are missing, run:');
        console.log(`"${python310Exe}" -m pip install opencv-python numpy face_recognition Pillow`);
        
    } catch (error) {
        console.log('❌ Python 3.10 found but not working properly');
        console.log('💡 Please reinstall Python 3.10');
    }
    
} else {
    console.log('❌ Python 3.10 not found in python310 folder');
    console.log('\n📥 Setup Instructions:');
    console.log('1. Download Python 3.10.11 from: https://www.python.org/downloads/release/python-31011/');
    console.log('2. Choose "Windows installer (64-bit)" or "Windows installer (32-bit)"');
    console.log('3. During installation:');
    console.log('   - Choose "Customize installation"');
    console.log('   - Advanced options: Check "Install for all users"');
    console.log('   - Change installation path to: ' + python310Path);
    console.log('   - IMPORTANT: Uncheck "Add Python to PATH" (we want portable)');
    console.log('4. After installation, run this script again');
    console.log('\n🔧 Alternative: Extract portable Python 3.10 to python310 folder');
    console.log('   - Download portable Python from: https://www.python.org/downloads/windows/');
    console.log('   - Extract to: ' + python310Path);
    console.log('   - Ensure python.exe is in: ' + python310Exe);
}

console.log('\n📋 Next Steps:');
console.log('1. Ensure Python 3.10 is in: ' + python310Path);
console.log('2. Install packages: python310\\python.exe -m pip install opencv-python numpy face_recognition Pillow');
console.log('3. Test: node check-python.js');
console.log('4. Start server: npm start');
console.log('5. Test face training in admin subscription flow');


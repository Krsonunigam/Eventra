/**
 * Setup Script for Advanced Face Recognition System
 * Installs dependencies and initializes the face recognition system
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

class FaceRecognitionSetup {
    constructor() {
        this.pythonScript = path.join(__dirname, 'utils', 'advancedFaceRecognition.py');
        this.requirementsFile = path.join(__dirname, 'requirements.txt');
        this.dataPath = path.join(__dirname, 'face_recognition_data');
    }

    async runCommand(command, args = [], options = {}) {
        return new Promise((resolve, reject) => {
            console.log(`Running: ${command} ${args.join(' ')}`);
            
            const process = spawn(command, args, {
                stdio: 'inherit',
                shell: true,
                ...options
            });

            process.on('close', (code) => {
                if (code === 0) {
                    resolve();
                } else {
                    reject(new Error(`Command failed with code ${code}`));
                }
            });

            process.on('error', (error) => {
                reject(error);
            });
        });
    }

    async checkPython() {
        console.log('🐍 Checking Python installation...');
        
        try {
            await this.runCommand('python', ['--version']);
            console.log('✅ Python is installed');
            return true;
        } catch (error) {
            console.log('❌ Python is not installed or not in PATH');
            console.log('Please install Python 3.8+ from https://python.org');
            return false;
        }
    }

    async checkPip() {
        console.log('📦 Checking pip installation...');
        
        try {
            await this.runCommand('pip', ['--version']);
            console.log('✅ pip is installed');
            return true;
        } catch (error) {
            console.log('❌ pip is not installed');
            console.log('Please install pip or use: python -m ensurepip --upgrade');
            return false;
        }
    }

    async installPythonDependencies() {
        console.log('📦 Installing Python dependencies...');
        
        try {
            if (fs.existsSync(this.requirementsFile)) {
                await this.runCommand('pip', ['install', '-r', this.requirementsFile]);
                console.log('✅ Python dependencies installed successfully');
            } else {
                console.log('❌ requirements.txt not found');
                return false;
            }
            return true;
        } catch (error) {
            console.log('❌ Failed to install Python dependencies');
            console.log('Error:', error.message);
            
            // Try installing core dependencies individually
            console.log('🔄 Trying to install core dependencies individually...');
            
            const coreDeps = [
                'opencv-python>=4.8.0',
                'opencv-contrib-python>=4.8.0',
                'numpy>=1.21.0',
                'Pillow>=9.0.0',
                'mediapipe>=0.10.0'
            ];

            for (const dep of coreDeps) {
                try {
                    await this.runCommand('pip', ['install', dep]);
                    console.log(`✅ Installed ${dep}`);
                } catch (error) {
                    console.log(`❌ Failed to install ${dep}`);
                }
            }
            
            return true;
        }
    }

    async testFaceRecognition() {
        console.log('🧪 Testing face recognition system...');
        
        try {
            const result = await new Promise((resolve, reject) => {
                const process = spawn('python', [this.pythonScript], {
                    stdio: ['pipe', 'pipe', 'pipe']
                });

                let stdout = '';
                let stderr = '';

                process.stdout.on('data', (data) => {
                    stdout += data.toString();
                });

                process.stderr.on('data', (data) => {
                    stderr += data.toString();
                });

                process.on('close', (code) => {
                    if (code === 0) {
                        resolve({ success: true, output: stdout });
                    } else {
                        reject(new Error(`Test failed: ${stderr}`));
                    }
                });
            });

            console.log('✅ Face recognition system test passed');
            console.log('System output:', result.output);
            return true;
        } catch (error) {
            console.log('❌ Face recognition system test failed');
            console.log('Error:', error.message);
            return false;
        }
    }

    async createDirectories() {
        console.log('📁 Creating necessary directories...');
        
        const directories = [
            this.dataPath,
            path.join(this.dataPath, 'dataset'),
            path.join(this.dataPath, 'models'),
            path.join(this.dataPath, 'metadata')
        ];

        for (const dir of directories) {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
                console.log(`✅ Created directory: ${dir}`);
            } else {
                console.log(`📁 Directory already exists: ${dir}`);
            }
        }
    }

    async setupComplete() {
        console.log('\n🎉 Advanced Face Recognition System Setup Complete!');
        console.log('\n📋 Next Steps:');
        console.log('1. Start your Node.js server: npm start');
        console.log('2. Test face collection through the web interface');
        console.log('3. Train the recognizer with collected samples');
        console.log('4. Test face verification for attendance');
        
        console.log('\n📚 Features:');
        console.log('• MediaPipe + OpenCV for advanced face detection');
        console.log('• Local storage for privacy and performance');
        console.log('• Quality assessment and automatic filtering');
        console.log('• Real-time face recognition and verification');
        console.log('• Admin controls for system management');
        
        console.log('\n🔧 API Endpoints:');
        console.log('• POST /api/face/collect - Collect face samples');
        console.log('• POST /api/face/verify - Verify face against user');
        console.log('• POST /api/face/recognize - Recognize face (admin)');
        console.log('• GET /api/face/data - Get user face data');
        console.log('• DELETE /api/face/data - Remove user face data');
        console.log('• POST /api/face/train - Train recognizer (admin)');
    }

    async run() {
        console.log('🚀 Starting Advanced Face Recognition System Setup...\n');
        
        try {
            // Check Python
            const pythonOk = await this.checkPython();
            if (!pythonOk) {
                throw new Error('Python is required but not installed');
            }

            // Check pip
            const pipOk = await this.checkPip();
            if (!pipOk) {
                throw new Error('pip is required but not installed');
            }

            // Install dependencies
            const depsOk = await this.installPythonDependencies();
            if (!depsOk) {
                throw new Error('Failed to install Python dependencies');
            }

            // Create directories
            await this.createDirectories();

            // Test the system
            const testOk = await this.testFaceRecognition();
            if (!testOk) {
                console.log('⚠️ Face recognition test failed, but setup may still work');
            }

            await this.setupComplete();
            
        } catch (error) {
            console.error('\n❌ Setup failed:', error.message);
            console.log('\n🔧 Troubleshooting:');
            console.log('1. Ensure Python 3.8+ is installed and in PATH');
            console.log('2. Ensure pip is installed and up to date');
            console.log('3. Try running: pip install --upgrade pip');
            console.log('4. For MediaPipe issues, try: pip install mediapipe --no-deps');
            console.log('5. Check if you have the required system dependencies');
            process.exit(1);
        }
    }
}

// Run setup if this script is executed directly
if (require.main === module) {
    const setup = new FaceRecognitionSetup();
    setup.run();
}

module.exports = FaceRecognitionSetup;

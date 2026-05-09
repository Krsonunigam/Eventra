/**
 * Advanced Face Recognition Service - JavaScript Wrapper
 * Interfaces with Python face recognition service for Node.js
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');

class AdvancedFaceRecognitionService {
    constructor() {
        this.pythonScript = path.join(__dirname, 'advancedFaceRecognition.py');
        this.pythonPath = null;
        this.isAvailable = this.checkPythonEnvironment();
    }

    checkPythonEnvironment() {
        try {
            // Check if Python script exists
            if (!fs.existsSync(this.pythonScript)) {
                
                return false;
            }
            
            // Find Python path - prioritizing Python 3.10 for face recognition
            const pythonPaths = [
                // Python 3.10 in Eventra project folder (PRIORITY)
                path.join(__dirname, '..', 'python310', 'python.exe'),
                path.join(__dirname, '..', 'Python310', 'python.exe'),
                path.join(__dirname, '..', 'python', 'python.exe'),
                path.join(__dirname, '..', 'Python', 'python.exe'),
                // Direct paths in Eventra folder (Python 3.10 first)
                'python310\\python.exe',
                'Python310\\python.exe',
                'python\\python.exe',
                'Python\\python.exe',
                // Standard Python 3.10 installations (PRIORITY)
                'C:\\Users\\zehra\\AppData\\Local\\Programs\\Python\\Python310\\python.exe',
                'C:\\Program Files\\Python310\\python.exe',
                'C:\\Program Files (x86)\\Python310\\python.exe',
                // Other Python versions (fallbacks)
                'python3', 'python',
                path.join(__dirname, '..', 'python39', 'python.exe'),
                path.join(__dirname, '..', 'Python39', 'python.exe'),
                path.join(__dirname, '..', 'python311', 'python.exe'),
                path.join(__dirname, '..', 'Python311', 'python.exe'),
                'python39\\python.exe',
                'Python39\\python.exe',
                'python311\\python.exe',
                'Python311\\python.exe',
                'C:\\Users\\zehra\\AppData\\Local\\Programs\\Python\\Python311\\python.exe',
                'C:\\Users\\zehra\\AppData\\Local\\Programs\\Python\\Python39\\python.exe',
                'C:\\Users\\zehra\\AppData\\Local\\Programs\\Python\\Python38\\python.exe',
                'C:\\Program Files\\Python311\\python.exe',
                'C:\\Program Files\\Python39\\python.exe',
                'C:\\Program Files\\Python38\\python.exe',
                'C:\\Program Files (x86)\\Python311\\python.exe',
                'C:\\Program Files (x86)\\Python39\\python.exe',
                'C:\\Program Files (x86)\\Python38\\python.exe',
            ];
            
            this.pythonPath = this.findPythonPath(pythonPaths);
            if (!this.pythonPath) {
                
                
                return false;
            }
            
            // Verify Python can execute the script
            try {
                const { execSync } = require('child_process');
                const testResult = execSync(`"${this.pythonPath}" "${this.pythonScript}" --help`, { 
                    encoding: 'utf8', 
                    stdio: 'pipe',
                    timeout: 10000 
                });
                
                
                return true;
            } catch (testError) {
                
                return false;
            }
        } catch (error) {
            
            return false;
        }
    }

    findPythonPath(pythonPaths) {
        const { execSync } = require('child_process');
        
        for (const path of pythonPaths) {
            try {
                // Test if this Python path works
                if (path === 'python3' || path === 'python') {
                    // Test command availability
                    execSync(`${path} --version`, { stdio: 'ignore' });
                    
                    return path;
                } else {
                    // Test if file exists
                    if (fs.existsSync(path)) {
                        
                        return path;
                    }
                }
            } catch (error) {
                // Continue to next path
                continue;
            }
        }
        
        // Fallback to first path if none found
        
        return pythonPaths[0];
    }

    
    // Enhanced error handling for Python service communication
    async runPythonScript(method, ...args) {
        return new Promise((resolve, reject) => {
            // Use cached Python path or find it (prioritizing Python 3.10)
            const pythonPath = this.pythonPath || this.findPythonPath([
                // Python 3.10 in Eventra project folder (PRIORITY)
                path.join(__dirname, '..', 'python310', 'python.exe'),
                path.join(__dirname, '..', 'Python310', 'python.exe'),
                path.join(__dirname, '..', 'python', 'python.exe'),
                path.join(__dirname, '..', 'Python', 'python.exe'),
                // Direct paths in Eventra folder (Python 3.10 first)
                'python310\python.exe',
                'Python310\python.exe',
                'python\python.exe',
                'Python\python.exe',
                // Standard Python 3.10 installations (PRIORITY)
                'C:\\Users\\zehra\\AppData\\Local\\Programs\\Python\\Python310\\python.exe',
                'C:\\Program Files\\Python310\\python.exe',
                'C:\\Program Files (x86)\\Python310\\python.exe',
                // Other Python versions (fallbacks)
                'python3', 'python',
                path.join(__dirname, '..', 'python39', 'python.exe'),
                path.join(__dirname, '..', 'Python39', 'python.exe'),
                path.join(__dirname, '..', 'python311', 'python.exe'),
                path.join(__dirname, '..', 'Python311', 'python.exe'),
                'python39\\python.exe',
                'Python39\\python.exe',
                'python311\\python.exe',
                'Python311\\python.exe',
                'C:\\Users\\zehra\\AppData\\Local\\Programs\\Python\\Python311\\python.exe',
                'C:\\Users\\zehra\\AppData\\Local\\Programs\\Python\\Python39\\python.exe',
                'C:\\Users\\zehra\\AppData\\Local\\Programs\\Python\\Python38\\python.exe',
                'C:\\Program Files\\Python311\\python.exe',
                'C:\\Program Files\\Python39\\python.exe',
                'C:\\Program Files\\Python38\\python.exe',
                'C:\\Program Files (x86)\\Python311\\python.exe',
                'C:\\Program Files (x86)\\Python39\\python.exe',
                'C:\\Program Files (x86)\\Python38\\python.exe',
            ]);
            
            if (!pythonPath) {
                reject(new Error('Python not found. Please install Python 3.8+ and ensure it\'s in your PATH.'));
                return;
            }

            // Verify Python path exists and is executable
            if (!fs.existsSync(pythonPath)) {
                reject(new Error(`Python executable not found at: ${pythonPath}`));
                return;
            }

            // Verify Python script exists
            if (!fs.existsSync(this.pythonScript)) {
                reject(new Error(`Python script not found at: ${this.pythonScript}`));
                return;
            }
            
            // For methods with large data (like face images), use file-based approach
            if ((method === 'collect' && args.length > 1) || (method === 'verify' && args.length >= 2)) {
                // For collect method, save data to temp file to avoid command line length limits
                let userId, faceDataList, faceData;
                if (method === 'collect') {
                    [userId, ...faceDataList] = args;
                } else if (method === 'verify') {
                    [faceData, userId] = args;
                    faceDataList = [faceData];
                }
                
                const fs = require('fs');
                const path = require('path');
                const crypto = require('crypto');
                
                try {
                    // Create temporary file for input data
                    const tempDir = path.join(__dirname, '..', 'face_recognition_data', 'temp');
                    if (!fs.existsSync(tempDir)) {
                        fs.mkdirSync(tempDir, { recursive: true });
                    }
                    
                    const tempFile = path.join(tempDir, `${crypto.randomBytes(16).toString('hex')}.json`);
                    
                    // Ensure temp file path is absolute
                    const absoluteTempFile = path.resolve(tempFile);
                    
                    // Prepare input data
                    let inputData;
                    if (method === 'collect') {
                        inputData = JSON.stringify({
                            method: method,
                            userId: userId,
                            faceDataList: faceDataList
                        });
                    } else if (method === 'verify') {
                        inputData = JSON.stringify({
                            method: method,
                            userId: userId,
                            faceData: faceDataList[0] // First argument is the face data
                        });
                    }
                    
                    // Write data to temp file
                    fs.writeFileSync(absoluteTempFile, inputData);
                    
                    // Use the advanced face recognition script which supports --file argument
                    const pythonArgs = [this.pythonScript, '--file', absoluteTempFile];
                    
                    const pythonProcess = spawn(pythonPath, pythonArgs, {
                        stdio: ['pipe', 'pipe', 'pipe'],
                        env: { ...process.env, PYTHONPATH: path.join(__dirname, '..') }
                    });

                    let stdout = '';
                    let stderr = '';
                    let isResolved = false;

                    // Set timeout for the process
                    const timeout = setTimeout(() => {
                        if (!isResolved) {
                            isResolved = true;
                            pythonProcess.kill();
                            // Clean up temp file
                            try { fs.unlinkSync(absoluteTempFile); } catch (e) {}
                            reject(new Error('Python process timeout'));
                        }
                    }, 60000); // 60 second timeout

                    pythonProcess.stdout.on('data', (data) => {
                        stdout += data.toString();
                    });

                    pythonProcess.stderr.on('data', (data) => {
                        stderr += data.toString();
                    });

                    pythonProcess.on('close', (code) => {
                        if (!isResolved) {
                            isResolved = true;
                            clearTimeout(timeout);
                            
                            // Clean up temp file
                            try { fs.unlinkSync(absoluteTempFile); } catch (e) {}
                            
                            if (code === 0) {
                                try {
                                    // Enhanced JSON parsing with better error handling
                                    if (!stdout || stdout.trim() === '') {
                                        
                                        resolve({ 
                                            success: false, 
                                            message: 'Face recognition service returned empty response. Please try again.',
                                            error: 'Empty response from Python service'
                                        });
                                        return;
                                    }
                                    
                                    // Check if stdout looks like HTML (proxy error, etc.)
                                    if (stdout.includes('<html>') || stdout.includes('<!DOCTYPE') || stdout.includes('Proxy error') || stdout.includes('502 Bad Gateway') || stdout.includes('503 Service Unavailable') || stdout.includes('nginx') || stdout.includes('Apache')) {
                                        
                                        resolve({ 
                                            success: false, 
                                            message: 'Face recognition service temporarily unavailable. Please try again.',
                                            error: 'Service returned HTML instead of JSON',
                                            details: 'This usually indicates a proxy or server configuration issue.'
                                        });
                                        return;
                                    }
                                    
                                    // Check for common Python errors in stdout
                                    if (stdout.includes('ModuleNotFoundError') || stdout.includes('ImportError')) {
                                        
                                        resolve({ 
                                            success: false, 
                                            message: 'Face recognition dependencies not installed. Please contact support.',
                                            error: 'Missing Python dependencies'
                                        });
                                        return;
                                    }
                                    
                                    if (stdout.includes('PermissionError') || stdout.includes('FileNotFoundError')) {
                                        
                                        resolve({ 
                                            success: false, 
                                            message: 'Face recognition service configuration error. Please contact support.',
                                            error: 'File access error'
                                        });
                                        return;
                                    }
                                    
                                    const result = JSON.parse(stdout);
                                    resolve(result);
                                } catch (error) {
                                    
                                    
                                    
                                    
                                    // Try to extract meaningful error from stdout
                                    let errorMessage = 'Invalid response from Python service';
                                    if (stdout.includes('Proxy error') || stdout.includes('502') || stdout.includes('503')) {
                                        errorMessage = 'Face recognition service temporarily unavailable. Please try again.';
                                    } else if (stdout.includes('ModuleNotFoundError') || stdout.includes('ImportError')) {
                                        errorMessage = 'Face recognition dependencies not installed. Please contact support.';
                                    } else if (stdout.includes('PermissionError') || stdout.includes('FileNotFoundError')) {
                                        errorMessage = 'Face recognition service configuration error. Please contact support.';
                                    } else if (stdout.includes('TimeoutError') || stdout.includes('timeout')) {
                                        errorMessage = 'Face recognition service timeout. Please try again.';
                                    }
                                    
                                    resolve({ 
                                        success: false, 
                                        message: errorMessage,
                                        error: error.message,
                                        rawOutput: stdout.substring(0, 200)
                                    });
                                }
                            } else {
                                
                                
                                
                                // Try to provide meaningful error message based on stderr
                                let errorMessage = `Python process exited with code ${code}`;
                                if (stderr.includes('ModuleNotFoundError') || stderr.includes('ImportError')) {
                                    errorMessage = 'Face recognition dependencies not installed. Please contact support.';
                                } else if (stderr.includes('PermissionError') || stderr.includes('FileNotFoundError')) {
                                    errorMessage = 'Face recognition service configuration error. Please contact support.';
                                } else if (stderr.includes('TimeoutError') || stderr.includes('timeout')) {
                                    errorMessage = 'Face recognition service timeout. Please try again.';
                                }
                                
                                reject(new Error(`${errorMessage}: ${stderr}`));
                            }
                        }
                    });

                    pythonProcess.on('error', (error) => {
                        if (!isResolved) {
                            isResolved = true;
                            clearTimeout(timeout);
                            // Clean up temp file
                            try { fs.unlinkSync(absoluteTempFile); } catch (e) {}
                            reject(new Error(`Failed to start Python process: ${error.message}`));
                        }
                    });
                    
                } catch (error) {
                    reject(new Error(`Failed to create temp file: ${error.message}`));
                }
            } else {
                // For other methods, use command line arguments as before
                const pythonProcess = spawn(pythonPath, [this.pythonScript, method, ...args], {
                    stdio: ['pipe', 'pipe', 'pipe'],
                    env: { ...process.env, PYTHONPATH: path.join(__dirname, '..') }
                });

                let stdout = '';
                let stderr = '';

                pythonProcess.stdout.on('data', (data) => {
                    stdout += data.toString();
                });

                pythonProcess.stderr.on('data', (data) => {
                    stderr += data.toString();
                });

                pythonProcess.on('close', (code) => {
                    if (code === 0) {
                        try {
                            // Enhanced JSON parsing with better error handling
                            if (!stdout || stdout.trim() === '') {
                                
                                resolve({ 
                                    success: false, 
                                    message: 'Face recognition service returned empty response. Please try again.',
                                    error: 'Empty response from Python service'
                                });
                                return;
                            }
                            
                            // Check if stdout looks like HTML (proxy error, etc.)
                            if (stdout.includes('<html>') || stdout.includes('<!DOCTYPE') || stdout.includes('Proxy error') || stdout.includes('502 Bad Gateway') || stdout.includes('503 Service Unavailable') || stdout.includes('nginx') || stdout.includes('Apache')) {
                                
                                resolve({ 
                                    success: false, 
                                    message: 'Face recognition service temporarily unavailable. Please try again.',
                                    error: 'Service returned HTML instead of JSON',
                                    details: 'This usually indicates a proxy or server configuration issue.'
                                });
                                return;
                            }
                            
                            // Check for common Python errors in stdout
                            if (stdout.includes('ModuleNotFoundError') || stdout.includes('ImportError')) {
                                
                                resolve({ 
                                    success: false, 
                                    message: 'Face recognition dependencies not installed. Please contact support.',
                                    error: 'Missing Python dependencies'
                                });
                                return;
                            }
                            
                            if (stdout.includes('PermissionError') || stdout.includes('FileNotFoundError')) {
                                
                                resolve({ 
                                    success: false, 
                                    message: 'Face recognition service configuration error. Please contact support.',
                                    error: 'File access error'
                                });
                                return;
                            }
                            
                            const result = JSON.parse(stdout);
                            resolve(result);
                        } catch (error) {
                            
                            
                            
                            // Try to extract meaningful error from stdout
                            let errorMessage = 'Invalid response from Python service';
                            if (stdout.includes('Proxy error') || stdout.includes('502') || stdout.includes('503')) {
                                errorMessage = 'Face recognition service temporarily unavailable. Please try again.';
                            } else if (stdout.includes('ModuleNotFoundError') || stdout.includes('ImportError')) {
                                errorMessage = 'Face recognition dependencies not installed. Please contact support.';
                            } else if (stdout.includes('PermissionError') || stdout.includes('FileNotFoundError')) {
                                errorMessage = 'Face recognition service configuration error. Please contact support.';
                            } else if (stdout.includes('TimeoutError') || stdout.includes('timeout')) {
                                errorMessage = 'Face recognition service timeout. Please try again.';
                            }
                            
                            resolve({ 
                                success: false, 
                                message: errorMessage,
                                error: error.message,
                                rawOutput: stdout.substring(0, 200)
                            });
                        }
                    } else {
                        
                        
                        
                        // Try to provide meaningful error message based on stderr
                        let errorMessage = `Python process exited with code ${code}`;
                        if (stderr.includes('ModuleNotFoundError') || stderr.includes('ImportError')) {
                            errorMessage = 'Face recognition dependencies not installed. Please contact support.';
                        } else if (stderr.includes('PermissionError') || stderr.includes('FileNotFoundError')) {
                            errorMessage = 'Face recognition service configuration error. Please contact support.';
                        } else if (stderr.includes('TimeoutError') || stderr.includes('timeout')) {
                            errorMessage = 'Face recognition service timeout. Please try again.';
                        }
                        
                        reject(new Error(`${errorMessage}: ${stderr}`));
                    }
                });

                pythonProcess.on('error', (error) => {
                    reject(new Error(`Failed to start Python process: ${error.message}`));
                });
            }
        });
    }

    async collectFaceSamples(userId, faceDataList) {
        try {
            if (!this.isAvailable) {
                throw new Error('Face recognition service not available');
            }

            // Validate input
            if (!faceDataList || !Array.isArray(faceDataList) || faceDataList.length < 10) {
                return {
                    success: false,
                    message: 'At least 10 face samples are required for training'
                };
            }

            // Call Python service
            const result = await this.runPythonScript('collect', userId, ...faceDataList);
            
            if (result.success) {
                // Update user in database
                const user = await User.findById(userId);
                if (user) {
                    user.faceDataCollected = true;
                    user.faceSampleCount = result.total_samples;
                    user.faceDataQuality = result.quality;
                    user.isFaceVerified = false; // Reset verification
                    await user.save();
                }
            }

            return result;
        } catch (error) {
            
            return {
                success: false,
                message: `Error collecting face samples: ${error.message}`
            };
        }
    }

    async trainRecognizer() {
        try {
            if (!this.isAvailable) {
                throw new Error('Face recognition service not available');
            }

            const result = await this.runPythonScript('train');
            return result;
        } catch (error) {
            
            return {
                success: false,
                message: `Error training recognizer: ${error.message}`
            };
        }
    }

    async recognizeFace(faceData) {
        try {
            if (!this.isAvailable) {
                throw new Error('Face recognition service not available');
            }

            if (!faceData) {
                return {
                    success: false,
                    message: 'Face data is required'
                };
            }

            const result = await this.runPythonScript('recognize', faceData);
            return result;
        } catch (error) {
            
            return {
                success: false,
                message: `Error recognizing face: ${error.message}`
            };
        }
    }

    async verifyFace(faceData, userId) {
        try {
            if (!this.isAvailable) {
                throw new Error('Face recognition service not available');
            }

            if (!faceData) {
                return {
                    success: false,
                    isMatch: false,
                    confidence: 0,
                    message: 'Face data is required'
                };
            }

            // Run Python verification directly - let Python handle user data checking
            const result = await this.runPythonScript('verify', faceData, userId);
            
            // Try to update user verification status if database is available
            if (result.success && result.isMatch && result.confidence > 70) {
                try {
                    const user = await User.findById(userId);
                    if (user) {
                        user.isFaceVerified = true;
                        await user.save();
                    }
                } catch (dbError) {
                    
                    // Continue with verification result even if database update fails
                }
            }

            return result;
        } catch (error) {
            
            return {
                success: false,
                isMatch: false,
                confidence: 0,
                message: `Error verifying face: ${error.message}`
            };
        }
    }

    async getUserSamples(userId) {
        try {
            if (!this.isAvailable) {
                return 0;
            }

            const result = await this.runPythonScript('get_samples', userId);
            return result.success ? result.count : 0;
        } catch (error) {
            
            return 0;
        }
    }

    async getUserMetadata(userId) {
        try {
            if (!this.isAvailable) {
                return null;
            }

            const result = await this.runPythonScript('get_metadata', userId);
            return result.success ? result.metadata : null;
        } catch (error) {
            
            return null;
        }
    }

    async removeUserData(userId) {
        try {
            if (!this.isAvailable) {
                throw new Error('Face recognition service not available');
            }

            const result = await this.runPythonScript('remove', userId);
            
            if (result.success) {
                // Update user in database
                const user = await User.findById(userId);
                if (user) {
                    user.faceDataCollected = false;
                    user.faceSampleCount = 0;
                    user.faceDataQuality = 'none';
                    user.isFaceVerified = false;
                    await user.save();
                }
            }

            return result;
        } catch (error) {
            
            return {
                success: false,
                message: `Error removing user data: ${error.message}`
            };
        }
    }

    async getSystemStats() {
        try {
            if (!this.isAvailable) {
                return {
                    success: false,
                    message: 'Face recognition service not available'
                };
            }

            const result = await this.runPythonScript('stats');
            return result;
        } catch (error) {
            
            return {
                success: false,
                message: `Error getting system stats: ${error.message}`
            };
        }
    }

    async isServiceAvailable() {
        return this.isAvailable;
    }
}

// Create global instance
const faceRecognitionService = new AdvancedFaceRecognitionService();

// Export functions for backward compatibility
async function storeFaceData(userId, faceDataList) {
    const result = await faceRecognitionService.collectFaceSamples(userId, faceDataList);
    
    if (result.success) {
        return {
            success: true,
            message: result.message,
            sampleCount: result.sample_count,
            user: {
                id: userId,
                faceDataCollected: true,
                faceDataQuality: result.quality,
                isFaceVerified: false,
                faceSampleCount: result.total_samples
            }
        };
    }
    
    return result;
}

async function trainRecognizer() {
    return await faceRecognitionService.trainRecognizer();
}

async function recognizeFace(faceData) {
    return await faceRecognitionService.recognizeFace(faceData);
}

async function verifyFace(faceData, userId) {
    return await faceRecognitionService.verifyFace(faceData, userId);
}

async function getUserSamples(userId) {
    return await faceRecognitionService.getUserSamples(userId);
}

async function getFaceData(userId) {
    const user = await User.findById(userId);
    if (!user) {
        return {
            success: false,
            message: 'User not found'
        };
    }

    return {
        success: true,
        faceDataCollected: user.faceDataCollected || false,
        faceDataQuality: user.faceDataQuality || 'none',
        isFaceVerified: user.isFaceVerified || false,
        faceSampleCount: user.faceSampleCount || 0
    };
}

async function removeFaceData(userId) {
    return await faceRecognitionService.removeUserData(userId);
}

async function getTrainingStats() {
    return await faceRecognitionService.getSystemStats();
}

module.exports = {
    storeFaceData,
    trainRecognizer,
    recognizeFace,
    verifyFace,
    getUserSamples,
    getFaceData,
    removeUserData: removeFaceData,
    getTrainingStats,
    faceRecognitionService
};

/**
 * Main Application Controller
 * Orchestrates all face recognition components
 */

class FaceRecognitionApp {
    constructor() {
        this.isInitialized = false;
        this.currentMode = 'idle'; // idle, training, verification
        this.video = null;
        this.canvas = null;
        
        this.initializeApp();
    }

    async initializeApp() {
        try {
            console.log('Initializing Face Recognition System...');
            
            // Get DOM elements
            this.video = document.getElementById('video');
            this.canvas = document.getElementById('canvas');
            
            if (!this.video || !this.canvas) {
                throw new Error('Required DOM elements not found');
            }

            // Initialize components
            await this.initializeComponents();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Update UI
            this.updateStatus();
            
            this.isInitialized = true;
            console.log('Face Recognition System initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.showError('Failed to initialize system: ' + error.message);
        }
    }

    async initializeComponents() {
        // Initialize face detection
        window.faceDetection.setDetectionCallback((results) => {
            this.handleDetectionResults(results);
        });

        window.faceDetection.setErrorCallback((error) => {
            this.showError('Face detection error: ' + error.message);
        });

        // Initialize training callbacks
        window.faceTraining.onProgressCallback = (progress) => {
            this.updateTrainingProgress(progress);
        };

        window.faceTraining.onCompleteCallback = (result) => {
            this.handleTrainingComplete(result);
        };

        window.faceTraining.onErrorCallback = (error) => {
            this.showError('Training error: ' + error.message);
        };

        // Initialize verification callbacks
        window.faceVerification.onCompleteCallback = (result) => {
            this.handleVerificationComplete(result);
        };

        window.faceVerification.onErrorCallback = (error) => {
            this.showError('Verification error: ' + error.message);
        };
    }

    setupEventListeners() {
        // Camera controls
        document.getElementById('start-camera').addEventListener('click', () => {
            this.startCamera();
        });

        document.getElementById('stop-camera').addEventListener('click', () => {
            this.stopCamera();
        });

        // Training controls
        document.getElementById('train-btn').addEventListener('click', () => {
            this.startTraining();
        });

        document.getElementById('stop-training').addEventListener('click', () => {
            this.stopTraining();
        });

        // Verification controls
        document.getElementById('verify-btn').addEventListener('click', () => {
            this.startVerification();
        });

        document.getElementById('close-verification').addEventListener('click', () => {
            this.closeVerification();
        });

        // Data management
        document.getElementById('clear-btn').addEventListener('click', () => {
            this.clearData();
        });

        document.getElementById('export-btn').addEventListener('click', () => {
            this.exportData();
        });

        document.getElementById('import-btn').addEventListener('click', () => {
            this.importData();
        });

        // File input for import
        document.getElementById('import-file').addEventListener('change', (e) => {
            this.handleFileImport(e);
        });
    }

    async startCamera() {
        try {
            const success = await window.faceDetection.startCamera(this.video);
            if (success) {
                this.showSuccess('Camera started successfully');
                this.updateStatus();
            } else {
                this.showError('Failed to start camera');
            }
        } catch (error) {
            this.showError('Camera error: ' + error.message);
        }
    }

    stopCamera() {
        window.faceDetection.stopCamera();
        this.showInfo('Camera stopped');
        this.updateStatus();
    }

    async startTraining() {
        if (this.currentMode === 'training') {
            this.showWarning('Training already in progress');
            return;
        }

        try {
            this.currentMode = 'training';
            this.showTrainingPanel();
            
            const success = await window.faceTraining.startTraining();
            if (success) {
                window.faceDetection.startDetection();
                this.showSuccess('Training started');
            } else {
                this.currentMode = 'idle';
                this.hideTrainingPanel();
                this.showError('Failed to start training');
            }
        } catch (error) {
            this.currentMode = 'idle';
            this.hideTrainingPanel();
            this.showError('Training error: ' + error.message);
        }
    }

    stopTraining() {
        window.faceTraining.stopTraining();
        window.faceDetection.stopDetection();
        this.currentMode = 'idle';
        this.hideTrainingPanel();
        this.showInfo('Training stopped');
        this.updateStatus();
    }

    async startVerification() {
        if (this.currentMode === 'verification') {
            this.showWarning('Verification already in progress');
            return;
        }

        try {
            this.currentMode = 'verification';
            this.showVerificationPanel();
            
            const success = await window.faceVerification.startVerification();
            if (success) {
                window.faceDetection.startDetection();
                this.showSuccess('Verification started');
                
                // Start automatic verification
                this.startAutoVerification();
            } else {
                this.currentMode = 'idle';
                this.hideVerificationPanel();
                this.showError('Failed to start verification');
            }
        } catch (error) {
            this.currentMode = 'idle';
            this.hideVerificationPanel();
            this.showError('Verification error: ' + error.message);
        }
    }

    startAutoVerification() {
        const verificationInterval = setInterval(() => {
            if (this.currentMode === 'verification') {
                window.faceVerification.verifyCurrentFace();
            } else {
                clearInterval(verificationInterval);
            }
        }, 2000); // Verify every 2 seconds
    }

    closeVerification() {
        window.faceVerification.stopVerification();
        window.faceDetection.stopDetection();
        this.currentMode = 'idle';
        this.hideVerificationPanel();
        this.showInfo('Verification stopped');
        this.updateStatus();
    }

    clearData() {
        if (confirm('Are you sure you want to clear all face data? This action cannot be undone.')) {
            window.faceStorage.clearData();
            window.faceTraining.resetTraining();
            this.showSuccess('All data cleared');
            this.updateStatus();
        }
    }

    exportData() {
        const data = window.faceStorage.exportData();
        if (data) {
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `face-recognition-data-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
            this.showSuccess('Data exported successfully');
        } else {
            this.showError('No data to export');
        }
    }

    importData() {
        document.getElementById('import-file').click();
    }

    handleFileImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const success = window.faceStorage.importData(e.target.result);
                if (success) {
                    this.showSuccess('Data imported successfully');
                    this.updateStatus();
                } else {
                    this.showError('Failed to import data');
                }
            } catch (error) {
                this.showError('Import error: ' + error.message);
            }
        };
        reader.readAsText(file);
    }

    handleDetectionResults(results) {
        // Update face overlay
        this.updateFaceOverlay(results);
        
        // Handle verification if in verification mode
        if (this.currentMode === 'verification') {
            // Verification is handled by auto-verification interval
        }
    }

    updateFaceOverlay(results) {
        const overlay = document.getElementById('face-overlay');
        overlay.innerHTML = '';

        if (results.detections && results.detections.length > 0) {
            const detection = results.detections[0];
            const bbox = detection.locationData.relativeBoundingBox;
            
            const box = document.createElement('div');
            box.className = 'face-box';
            box.style.left = (bbox.xOrigin * 100) + '%';
            box.style.top = (bbox.yOrigin * 100) + '%';
            box.style.width = (bbox.width * 100) + '%';
            box.style.height = (bbox.height * 100) + '%';
            
            overlay.appendChild(box);
        }
    }

    updateTrainingProgress(progress) {
        const progressFill = document.getElementById('progress-fill');
        const progressText = document.getElementById('progress-text');
        const collectedSamples = document.getElementById('collected-samples');
        const qualityScore = document.getElementById('quality-score');

        if (progressFill) {
            progressFill.style.width = progress.percentage + '%';
        }
        if (progressText) {
            progressText.textContent = Math.round(progress.percentage) + '%';
        }
        if (collectedSamples) {
            collectedSamples.textContent = progress.currentSample;
        }
        if (qualityScore) {
            const quality = window.faceTraining.getTrainingStats().overallQuality;
            qualityScore.textContent = Math.round(quality * 100) + '%';
        }
    }

    handleTrainingComplete(result) {
        this.currentMode = 'idle';
        this.hideTrainingPanel();
        
        if (result.success) {
            this.showSuccess(`Training completed! Collected ${result.sampleCount} samples in ${Math.round(result.trainingTime / 1000)}s`);
        } else {
            this.showError('Training failed');
        }
        
        this.updateStatus();
    }

    handleVerificationComplete(result) {
        this.currentMode = 'idle';
        this.hideVerificationPanel();
        
        // Update verification results
        const confidenceScore = document.getElementById('confidence-score');
        const matchResult = document.getElementById('match-result');
        
        if (confidenceScore) {
            confidenceScore.textContent = Math.round(result.confidence * 100) + '%';
        }
        if (matchResult) {
            matchResult.textContent = result.success ? 'Match' : 'No Match';
            matchResult.className = result.success ? 'success' : 'error';
        }
        
        if (result.success) {
            this.showSuccess(`Verification successful! Confidence: ${Math.round(result.confidence * 100)}%`);
        } else {
            this.showError(`Verification failed. Confidence: ${Math.round(result.confidence * 100)}%`);
        }
        
        this.updateStatus();
    }

    updateStatus() {
        const info = window.faceStorage.getStorageInfo();
        if (!info) return;

        // Update status panel
        const faceDataStatus = document.getElementById('face-data-status');
        const sampleCount = document.getElementById('sample-count');
        const trainedStatus = document.getElementById('trained-status');
        const lastUpdated = document.getElementById('last-updated');
        const storageUsed = document.getElementById('storage-used');
        const totalSamples = document.getElementById('total-samples');
        const dataVersion = document.getElementById('data-version');

        if (faceDataStatus) {
            faceDataStatus.textContent = info.sampleCount > 0 ? 'Available' : 'None';
            faceDataStatus.className = info.sampleCount > 0 ? 'success' : 'error';
        }
        if (sampleCount) {
            sampleCount.textContent = info.sampleCount;
        }
        if (trainedStatus) {
            trainedStatus.textContent = info.isTrained ? 'Yes' : 'No';
            trainedStatus.className = info.isTrained ? 'success' : 'warning';
        }
        if (lastUpdated) {
            lastUpdated.textContent = info.lastUpdated ? new Date(info.lastUpdated).toLocaleString() : 'Never';
        }
        if (storageUsed) {
            storageUsed.textContent = info.storageSize;
        }
        if (totalSamples) {
            totalSamples.textContent = info.sampleCount;
        }
        if (dataVersion) {
            dataVersion.textContent = info.version;
        }
    }

    showTrainingPanel() {
        const panel = document.getElementById('training-panel');
        if (panel) {
            panel.style.display = 'block';
        }
    }

    hideTrainingPanel() {
        const panel = document.getElementById('training-panel');
        if (panel) {
            panel.style.display = 'none';
        }
    }

    showVerificationPanel() {
        const panel = document.getElementById('verification-panel');
        if (panel) {
            panel.style.display = 'block';
        }
    }

    hideVerificationPanel() {
        const panel = document.getElementById('verification-panel');
        if (panel) {
            panel.style.display = 'none';
        }
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showWarning(message) {
        this.showNotification(message, 'warning');
    }

    showInfo(message) {
        this.showNotification(message, 'info');
    }

    showNotification(message, type) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;

        // Set background color based on type
        const colors = {
            success: '#48bb78',
            error: '#f56565',
            warning: '#ed8936',
            info: '#4299e1'
        };
        notification.style.backgroundColor = colors[type] || colors.info;

        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.faceRecognitionApp = new FaceRecognitionApp();
});

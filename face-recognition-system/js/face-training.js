/**
 * Advanced Face Training System
 * Handles face sample collection and model training
 */

class FaceTraining {
    constructor() {
        this.isTraining = false;
        this.samples = [];
        this.requiredSamples = 20;
        this.currentSample = 0;
        this.trainingProgress = 0;
        this.qualityThreshold = 0.7;
        this.captureInterval = null;
        this.trainingStartTime = null;
        
        this.onProgressCallback = null;
        this.onCompleteCallback = null;
        this.onErrorCallback = null;
    }

    async startTraining() {
        if (this.isTraining) {
            
            return false;
        }

        try {
            this.isTraining = true;
            this.samples = [];
            this.currentSample = 0;
            this.trainingProgress = 0;
            this.trainingStartTime = Date.now();

            
            this.updateProgress(0, 'Initializing training...');

            // Load existing samples
            const existingSamples = window.faceStorage.getSamples();
            if (existingSamples.length > 0) {
                this.samples = existingSamples;
                this.currentSample = existingSamples.length;
                this.updateProgress(
                    (existingSamples.length / this.requiredSamples) * 100,
                    `Found ${existingSamples.length} existing samples`
                );
            }

            // Start automatic capture
            this.startAutoCapture();

            return true;
        } catch (error) {
            
            this.handleError(error);
            return false;
        }
    }

    stopTraining() {
        if (!this.isTraining) return;

        this.isTraining = false;
        this.clearCaptureInterval();
        
        
        this.updateProgress(0, 'Training stopped');
    }

    startAutoCapture() {
        if (!this.isTraining) return;

        this.captureInterval = setInterval(() => {
            if (this.isTraining && this.currentSample < this.requiredSamples) {
                this.captureSample();
            } else if (this.currentSample >= this.requiredSamples) {
                this.completeTraining();
            }
        }, 1000); // Capture every second
    }

    clearCaptureInterval() {
        if (this.captureInterval) {
            clearInterval(this.captureInterval);
            this.captureInterval = null;
        }
    }

    async captureSample() {
        try {
            const video = document.getElementById('video');
            if (!video || !video.videoWidth) {
                
                return;
            }

            // Get current detection results
            const detectionResults = window.faceDetection.getDetectionResults();
            if (!detectionResults || !detectionResults.detections || detectionResults.detections.length === 0) {
                
                return;
            }

            // Capture image
            const canvas = document.getElementById('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0);

            const imageData = canvas.toDataURL('image/jpeg', 0.8);
            
            // Extract face landmarks if available
            let landmarks = null;
            if (detectionResults.landmarks) {
                landmarks = detectionResults.landmarks;
            }

            // Assess face quality
            const quality = this.assessSampleQuality(landmarks, detectionResults.detections[0]);
            
            if (quality.score >= this.qualityThreshold) {
                // Create sample data
                const sample = {
                    id: `sample_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    imageData: imageData,
                    landmarks: landmarks,
                    quality: quality.score,
                    timestamp: new Date().toISOString(),
                    features: this.extractFeatures(landmarks),
                    metadata: {
                        brightness: this.calculateBrightness(canvas),
                        contrast: this.calculateContrast(canvas),
                        sharpness: quality.sharpness,
                        symmetry: quality.symmetry
                    }
                };

                // Add to storage
                const success = window.faceStorage.addSample(sample, quality.score);
                if (success) {
                    this.samples.push(sample);
                    this.currentSample++;
                    
                    this.updateProgress(
                        (this.currentSample / this.requiredSamples) * 100,
                        `Captured sample ${this.currentSample}/${this.requiredSamples} (Quality: ${Math.round(quality.score * 100)}%)`
                    );
                }
            } else {
                
            }

        } catch (error) {
            
            this.handleError(error);
        }
    }

    assessSampleQuality(landmarks, detection) {
        let score = 1.0;
        const issues = [];

        // Base score from detection confidence
        if (detection && detection.score) {
            score *= detection.score;
        }

        // Check landmarks quality
        if (landmarks && landmarks.length >= 468) {
            const quality = window.faceDetection.assessFaceQuality(landmarks);
            score *= quality.quality;
            issues.push(...quality.issues);
        } else {
            score *= 0.5; // Lower score if no landmarks
            issues.push('No landmarks detected');
        }

        // Check face size and position
        if (detection && detection.locationData) {
            const bbox = detection.locationData.relativeBoundingBox;
            const faceSize = bbox.width * bbox.height;
            
            if (faceSize < 0.1) {
                score *= 0.7;
                issues.push('Face too small');
            } else if (faceSize > 0.8) {
                score *= 0.8;
                issues.push('Face too large');
            }

            // Check if face is centered
            const centerX = bbox.xOrigin + bbox.width / 2;
            const centerY = bbox.yOrigin + bbox.height / 2;
            
            if (centerX < 0.2 || centerX > 0.8 || centerY < 0.2 || centerY > 0.8) {
                score *= 0.8;
                issues.push('Face not centered');
            }
        }

        return {
            score: Math.max(0, Math.min(1, score)),
            issues: issues,
            sharpness: this.calculateSharpness(landmarks),
            symmetry: landmarks ? window.faceDetection.calculateFaceSymmetry(landmarks) : 0
        };
    }

    calculateSharpness(landmarks) {
        if (!landmarks || landmarks.length < 468) return 0;

        // Calculate edge density as a proxy for sharpness
        let edgeCount = 0;
        const threshold = 0.01;

        for (let i = 0; i < landmarks.length - 1; i++) {
            const current = landmarks[i];
            const next = landmarks[i + 1];
            
            if (current && next) {
                const distance = Math.sqrt(
                    Math.pow(current.x - next.x, 2) + 
                    Math.pow(current.y - next.y, 2)
                );
                if (distance > threshold) {
                    edgeCount++;
                }
            }
        }

        return Math.min(1, edgeCount / landmarks.length * 10);
    }

    extractFeatures(landmarks) {
        if (!landmarks || landmarks.length < 468) return null;

        return window.faceDetection.getFaceEmbeddings(landmarks);
    }

    calculateBrightness(canvas) {
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        let totalBrightness = 0;
        for (let i = 0; i < data.length; i += 4) {
            const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
            totalBrightness += brightness;
        }
        
        return totalBrightness / (data.length / 4) / 255;
    }

    calculateContrast(canvas) {
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        let minBrightness = 255;
        let maxBrightness = 0;
        
        for (let i = 0; i < data.length; i += 4) {
            const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
            minBrightness = Math.min(minBrightness, brightness);
            maxBrightness = Math.max(maxBrightness, brightness);
        }
        
        return (maxBrightness - minBrightness) / 255;
    }

    async completeTraining() {
        if (!this.isTraining) return;

        this.isTraining = false;
        this.clearCaptureInterval();

        try {
            // Mark as trained in storage
            const success = window.faceStorage.markAsTrained();
            
            if (success) {
                const trainingTime = Date.now() - this.trainingStartTime;
                
                
                this.updateProgress(100, 'Training completed successfully!');
                
                if (this.onCompleteCallback) {
                    this.onCompleteCallback({
                        success: true,
                        sampleCount: this.currentSample,
                        trainingTime: trainingTime,
                        quality: this.calculateOverallQuality()
                    });
                }
            } else {
                throw new Error('Failed to mark training as complete');
            }
        } catch (error) {
            
            this.handleError(error);
        }
    }

    calculateOverallQuality() {
        if (this.samples.length === 0) return 0;
        
        const totalQuality = this.samples.reduce((sum, sample) => sum + sample.quality, 0);
        return totalQuality / this.samples.length;
    }

    updateProgress(percentage, message) {
        this.trainingProgress = percentage;
        
        if (this.onProgressCallback) {
            this.onProgressCallback({
                percentage: percentage,
                message: message,
                currentSample: this.currentSample,
                requiredSamples: this.requiredSamples
            });
        }
    }

    handleError(error) {
        
        
        if (this.onErrorCallback) {
            this.onErrorCallback(error);
        }
    }

    // Manual sample capture
    async captureManualSample() {
        if (!this.isTraining) {
            
            return false;
        }

        if (this.currentSample >= this.requiredSamples) {
            
            return false;
        }

        await this.captureSample();
        return true;
    }

    // Get training statistics
    getTrainingStats() {
        return {
            isTraining: this.isTraining,
            currentSample: this.currentSample,
            requiredSamples: this.requiredSamples,
            progress: this.trainingProgress,
            samples: this.samples,
            overallQuality: this.calculateOverallQuality()
        };
    }

    // Reset training
    resetTraining() {
        this.isTraining = false;
        this.samples = [];
        this.currentSample = 0;
        this.trainingProgress = 0;
        this.clearCaptureInterval();
        
        // Clear storage
        window.faceStorage.clearData();
        
        
        this.updateProgress(0, 'Training reset');
    }
}

// Create global instance
window.faceTraining = new FaceTraining();

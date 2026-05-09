/**
 * Advanced Face Verification System
 * Handles real-time face verification against trained data
 */

class FaceVerification {
    constructor() {
        this.isVerifying = false;
        this.verificationResults = null;
        this.confidenceThreshold = 0.8;
        this.maxAttempts = 3;
        this.currentAttempt = 0;
        this.verificationStartTime = null;
        
        this.onVerificationCallback = null;
        this.onErrorCallback = null;
        this.onCompleteCallback = null;
    }

    async startVerification() {
        if (this.isVerifying) {
            
            return false;
        }

        try {
            // Check if we have trained data
            if (!window.faceStorage.isTrained()) {
                throw new Error('No trained face data available. Please complete training first.');
            }

            const samples = window.faceStorage.getSamples();
            if (samples.length === 0) {
                throw new Error('No face samples available for verification.');
            }

            this.isVerifying = true;
            this.currentAttempt = 0;
            this.verificationStartTime = Date.now();
            this.verificationResults = null;

            
            

            return true;
        } catch (error) {
            
            this.handleError(error);
            return false;
        }
    }

    stopVerification() {
        this.isVerifying = false;
        this.verificationResults = null;
        
    }

    async verifyCurrentFace() {
        if (!this.isVerifying) {
            
            return false;
        }

        try {
            this.currentAttempt++;
            
            // Get current detection results
            const detectionResults = window.faceDetection.getDetectionResults();
            if (!detectionResults || !detectionResults.detections || detectionResults.detections.length === 0) {
                
                return false;
            }

            // Capture current face
            const video = document.getElementById('video');
            const canvas = document.getElementById('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0);

            const currentImageData = canvas.toDataURL('image/jpeg', 0.8);
            const currentLandmarks = detectionResults.landmarks;

            // Extract current face features
            const currentFeatures = this.extractVerificationFeatures(currentLandmarks, detectionResults.detections[0]);
            if (!currentFeatures) {
                
                return false;
            }

            // Compare with trained samples
            const comparisonResults = await this.compareWithTrainedSamples(currentFeatures, currentImageData);
            
            // Update verification results
            this.verificationResults = {
                attempt: this.currentAttempt,
                timestamp: new Date().toISOString(),
                confidence: comparisonResults.confidence,
                match: comparisonResults.match,
                similarity: comparisonResults.similarity,
                bestMatch: comparisonResults.bestMatch,
                processingTime: Date.now() - this.verificationStartTime
            };

            // Check if verification is successful
            if (comparisonResults.confidence >= this.confidenceThreshold) {
                this.completeVerification(true, comparisonResults);
            } else if (this.currentAttempt >= this.maxAttempts) {
                this.completeVerification(false, comparisonResults);
            } else {
                // Continue verification
                
            }

            return true;
        } catch (error) {
            
            this.handleError(error);
            return false;
        }
    }

    extractVerificationFeatures(landmarks, detection) {
        if (!landmarks || landmarks.length < 468) {
            
            return null;
        }

        // Extract key facial features
        const keyFeatures = {
            eyeDistance: this.calculateDistance(landmarks[33], landmarks[362]),
            noseWidth: this.calculateDistance(landmarks[31], landmarks[35]),
            mouthWidth: this.calculateDistance(landmarks[61], landmarks[291]),
            faceWidth: this.calculateDistance(landmarks[234], landmarks[454]),
            faceHeight: this.calculateDistance(landmarks[10], landmarks[152]),
            eyeNoseDistance: this.calculateDistance(landmarks[33], landmarks[1]),
            noseMouthDistance: this.calculateDistance(landmarks[1], landmarks[13])
        };

        // Add detection confidence
        keyFeatures.detectionConfidence = detection ? detection.score : 0;

        // Add face quality metrics
        const quality = window.faceDetection.assessFaceQuality(landmarks);
        keyFeatures.quality = quality.quality;
        keyFeatures.symmetry = quality.symmetry;

        return keyFeatures;
    }

    calculateDistance(point1, point2) {
        if (!point1 || !point2) return 0;
        const dx = point1.x - point2.x;
        const dy = point1.y - point2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    async compareWithTrainedSamples(currentFeatures, currentImageData) {
        const trainedSamples = window.faceStorage.getSamples();
        if (trainedSamples.length === 0) {
            return {
                confidence: 0,
                match: false,
                similarity: 0,
                bestMatch: null
            };
        }

        let bestSimilarity = 0;
        let bestMatch = null;
        let totalSimilarity = 0;
        let validComparisons = 0;

        // Compare with each trained sample
        for (const sample of trainedSamples) {
            if (sample.features) {
                const similarity = this.calculateFeatureSimilarity(currentFeatures, sample.features);
                totalSimilarity += similarity;
                validComparisons++;

                if (similarity > bestSimilarity) {
                    bestSimilarity = similarity;
                    bestMatch = sample;
                }
            }
        }

        // Calculate overall confidence
        const averageSimilarity = validComparisons > 0 ? totalSimilarity / validComparisons : 0;
        const confidence = this.calculateConfidence(averageSimilarity, bestSimilarity, currentFeatures);

        return {
            confidence: confidence,
            match: confidence >= this.confidenceThreshold,
            similarity: averageSimilarity,
            bestSimilarity: bestSimilarity,
            bestMatch: bestMatch,
            comparisons: validComparisons
        };
    }

    calculateFeatureSimilarity(features1, features2) {
        if (!features1 || !features2) return 0;

        const keys = Object.keys(features1);
        let totalSimilarity = 0;
        let validKeys = 0;

        keys.forEach(key => {
            if (features1[key] !== undefined && features2[key] !== undefined) {
                const value1 = features1[key];
                const value2 = features2[key];
                
                if (typeof value1 === 'number' && typeof value2 === 'number') {
                    const diff = Math.abs(value1 - value2);
                    const max = Math.max(value1, value2);
                    const similarity = max > 0 ? 1 - (diff / max) : 0;
                    totalSimilarity += similarity;
                    validKeys++;
                }
            }
        });

        return validKeys > 0 ? totalSimilarity / validKeys : 0;
    }

    calculateConfidence(averageSimilarity, bestSimilarity, currentFeatures) {
        let confidence = (averageSimilarity + bestSimilarity) / 2;

        // Adjust confidence based on face quality
        if (currentFeatures.quality) {
            confidence *= currentFeatures.quality;
        }

        // Adjust confidence based on detection confidence
        if (currentFeatures.detectionConfidence) {
            confidence *= currentFeatures.detectionConfidence;
        }

        // Adjust confidence based on symmetry
        if (currentFeatures.symmetry) {
            confidence *= (0.5 + currentFeatures.symmetry * 0.5);
        }

        return Math.max(0, Math.min(1, confidence));
    }

    completeVerification(success, results) {
        this.isVerifying = false;
        
        const verificationTime = Date.now() - this.verificationStartTime;
        
        const finalResults = {
            success: success,
            confidence: results.confidence,
            similarity: results.similarity,
            attempts: this.currentAttempt,
            verificationTime: verificationTime,
            timestamp: new Date().toISOString(),
            bestMatch: results.bestMatch
        };

        this.verificationResults = finalResults;

        
        

        if (this.onCompleteCallback) {
            this.onCompleteCallback(finalResults);
        }
    }

    getVerificationResults() {
        return this.verificationResults;
    }

    getVerificationStats() {
        return {
            isVerifying: this.isVerifying,
            currentAttempt: this.currentAttempt,
            maxAttempts: this.maxAttempts,
            confidenceThreshold: this.confidenceThreshold,
            results: this.verificationResults
        };
    }

    setConfidenceThreshold(threshold) {
        this.confidenceThreshold = Math.max(0, Math.min(1, threshold));
        
    }

    setMaxAttempts(attempts) {
        this.maxAttempts = Math.max(1, attempts);
        
    }

    handleError(error) {
        
        
        if (this.onErrorCallback) {
            this.onErrorCallback(error);
        }
    }

    // Reset verification
    resetVerification() {
        this.isVerifying = false;
        this.currentAttempt = 0;
        this.verificationResults = null;
        
    }

    // Export verification results
    exportResults() {
        if (!this.verificationResults) return null;

        return {
            ...this.verificationResults,
            exportedAt: new Date().toISOString(),
            systemVersion: '2.0'
        };
    }
}

// Create global instance
window.faceVerification = new FaceVerification();

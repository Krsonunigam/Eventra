/**
 * Advanced Face Detection using MediaPipe
 * Handles real-time face detection and landmark extraction
 */

class FaceDetection {
    constructor() {
        this.faceDetection = null;
        this.faceMesh = null;
        this.camera = null;
        this.isInitialized = false;
        this.isDetecting = false;
        this.detectionResults = null;
        this.onDetectionCallback = null;
        this.onErrorCallback = null;
        
        this.initializeMediaPipe();
    }

    async initializeMediaPipe() {
        try {
            // Initialize Face Detection
            this.faceDetection = new FaceDetection({
                locateFile: (file) => {
                    return `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`;
                }
            });

            this.faceDetection.setOptions({
                model: 'short',
                minDetectionConfidence: 0.5,
                minSuppressionThreshold: 0.3
            });

            this.faceDetection.onResults((results) => {
                this.handleDetectionResults(results);
            });

            // Initialize Face Mesh for detailed landmarks
            this.faceMesh = new FaceMesh({
                locateFile: (file) => {
                    return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
                }
            });

            this.faceMesh.setOptions({
                maxNumFaces: 1,
                refineLandmarks: true,
                minDetectionConfidence: 0.5,
                minTrackingConfidence: 0.5
            });

            this.faceMesh.onResults((results) => {
                this.handleMeshResults(results);
            });

            this.isInitialized = true;
            
        } catch (error) {
            
            if (this.onErrorCallback) {
                this.onErrorCallback(error);
            }
        }
    }

    async startCamera(videoElement) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user'
                }
            });

            videoElement.srcObject = stream;
            this.camera = new Camera(videoElement, {
                onFrame: async () => {
                    if (this.isDetecting && this.faceDetection) {
                        await this.faceDetection.send({ image: videoElement });
                    }
                },
                width: 640,
                height: 480
            });

            await this.camera.start();
            
            return true;
        } catch (error) {
            
            if (this.onErrorCallback) {
                this.onErrorCallback(error);
            }
            return false;
        }
    }

    stopCamera() {
        if (this.camera) {
            this.camera.stop();
            this.camera = null;
        }
        this.isDetecting = false;
    }

    startDetection() {
        if (!this.isInitialized) {
            
            return false;
        }
        this.isDetecting = true;
        return true;
    }

    stopDetection() {
        this.isDetecting = false;
    }

    handleDetectionResults(results) {
        this.detectionResults = results;
        
        if (this.onDetectionCallback) {
            this.onDetectionCallback({
                detections: results.detections,
                image: results.image,
                timestamp: Date.now()
            });
        }
    }

    handleMeshResults(results) {
        if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
            const landmarks = results.multiFaceLandmarks[0];
            
            if (this.onDetectionCallback) {
                this.onDetectionCallback({
                    landmarks: landmarks,
                    image: results.image,
                    timestamp: Date.now(),
                    hasFace: true
                });
            }
        }
    }

    setDetectionCallback(callback) {
        this.onDetectionCallback = callback;
    }

    setErrorCallback(callback) {
        this.onErrorCallback = callback;
    }

    getDetectionResults() {
        return this.detectionResults;
    }

    // Face quality assessment
    assessFaceQuality(landmarks) {
        if (!landmarks || landmarks.length < 468) {
            return { quality: 0, issues: ['Insufficient landmarks'] };
        }

        const issues = [];
        let qualityScore = 1.0;

        // Check for key facial features
        const leftEye = landmarks[33];
        const rightEye = landmarks[362];
        const nose = landmarks[1];
        const mouth = landmarks[13];

        if (!leftEye || !rightEye) {
            issues.push('Eyes not detected');
            qualityScore -= 0.3;
        }

        if (!nose) {
            issues.push('Nose not detected');
            qualityScore -= 0.2;
        }

        if (!mouth) {
            issues.push('Mouth not detected');
            qualityScore -= 0.2;
        }

        // Check face symmetry
        const symmetry = this.calculateFaceSymmetry(landmarks);
        if (symmetry < 0.7) {
            issues.push('Face not centered');
            qualityScore -= 0.2;
        }

        // Check face size
        const faceSize = this.calculateFaceSize(landmarks);
        if (faceSize < 0.1 || faceSize > 0.8) {
            issues.push('Face size inappropriate');
            qualityScore -= 0.2;
        }

        return {
            quality: Math.max(0, qualityScore),
            issues: issues,
            symmetry: symmetry,
            faceSize: faceSize
        };
    }

    calculateFaceSymmetry(landmarks) {
        if (!landmarks || landmarks.length < 468) return 0;

        const leftSide = landmarks.slice(0, 234);
        const rightSide = landmarks.slice(234, 468);
        
        let totalSymmetry = 0;
        let validPoints = 0;

        for (let i = 0; i < Math.min(leftSide.length, rightSide.length); i++) {
            const left = leftSide[i];
            const right = rightSide[234 - i];
            
            if (left && right) {
                const distance = Math.abs(left.x - (1 - right.x));
                totalSymmetry += 1 - distance;
                validPoints++;
            }
        }

        return validPoints > 0 ? totalSymmetry / validPoints : 0;
    }

    calculateFaceSize(landmarks) {
        if (!landmarks || landmarks.length < 468) return 0;

        const faceOutline = landmarks.slice(0, 17);
        let minX = 1, maxX = 0, minY = 1, maxY = 0;

        faceOutline.forEach(point => {
            if (point) {
                minX = Math.min(minX, point.x);
                maxX = Math.max(maxX, point.x);
                minY = Math.min(minY, point.y);
                maxY = Math.max(maxY, point.y);
            }
        });

        const width = maxX - minX;
        const height = maxY - minY;
        
        return Math.sqrt(width * width + height * height);
    }

    // Extract face region from image
    extractFaceRegion(image, landmarks) {
        if (!landmarks || landmarks.length < 468) return null;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Calculate bounding box
        let minX = 1, maxX = 0, minY = 1, maxY = 0;
        
        landmarks.forEach(point => {
            if (point) {
                minX = Math.min(minX, point.x);
                maxX = Math.max(maxX, point.x);
                minY = Math.min(minY, point.y);
                maxY = Math.max(maxY, point.y);
            }
        });

        // Add padding
        const padding = 0.1;
        minX = Math.max(0, minX - padding);
        maxX = Math.min(1, maxX + padding);
        minY = Math.max(0, minY - padding);
        maxY = Math.min(1, maxY + padding);

        // Set canvas size
        canvas.width = (maxX - minX) * image.width;
        canvas.height = (maxY - minY) * image.height;

        // Draw face region
        ctx.drawImage(
            image,
            minX * image.width, minY * image.height,
            (maxX - minX) * image.width, (maxY - minY) * image.height,
            0, 0,
            canvas.width, canvas.height
        );

        return canvas.toDataURL('image/jpeg', 0.8);
    }

    // Get face embeddings for comparison
    getFaceEmbeddings(landmarks) {
        if (!landmarks || landmarks.length < 468) return null;

        // Extract key facial features
        const keyPoints = [
            landmarks[10],  // Forehead
            landmarks[33],  // Left eye
            landmarks[362], // Right eye
            landmarks[1],   // Nose
            landmarks[13],  // Mouth
            landmarks[152], // Chin
            landmarks[234], // Left cheek
            landmarks[454]  // Right cheek
        ];

        return keyPoints.filter(point => point).map(point => ({
            x: point.x,
            y: point.y,
            z: point.z || 0
        }));
    }
}

// Create global instance
window.faceDetection = new FaceDetection();

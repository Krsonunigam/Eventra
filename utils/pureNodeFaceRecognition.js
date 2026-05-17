/**
 * Pure Node.js Face Recognition System
 * No external dependencies - everything runs in Node.js
 * Eliminates connection errors and server management issues
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const sharp = require('sharp'); // For image processing
const axios = require('axios'); // For downloading Cloudinary images
const User = require('../models/User');

class PureNodeFaceRecognition {
    constructor() {
        this.dataPath = path.join(__dirname, '..', 'face_recognition_data');
        this.datasetPath = path.join(this.dataPath, 'dataset');
        this.modelsPath = path.join(this.dataPath, 'models');
        this.metadataPath = path.join(this.dataPath, 'metadata');
        this.tempPath = path.join(this.dataPath, 'temp');
        
        // Ensure directories exist
        this.ensureDirectories();
        
        // Initialize face recognition data
        this.userMapping = new Map(); // internal_id -> user_id
        this.userMetadata = new Map(); // user_id -> metadata
        this.loadMetadata();
        
        // Face recognition parameters
        this.minSamples = 10;
        this.maxSamples = 25;
        this.baseConfidence = 25; // Lower base threshold for better matching
        this.adaptiveThreshold = true; // Enable adaptive thresholds
        this.qualityThreshold = 0.3; // Minimum quality threshold
        this.minConfidence = 40; // Default minimum confidence for recognition
        this.minSimilarity = 0.25; // Default minimum similarity
        
        
        
        // Sync Cloudinary profile pictures in the background
        setTimeout(() => this.syncCloudinaryProfiles(), 5000);
    }

    ensureDirectories() {
        const dirs = [this.dataPath, this.datasetPath, this.modelsPath, this.metadataPath, this.tempPath];
        dirs.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }

    loadMetadata() {
        try {
            const metadataFile = path.join(this.metadataPath, 'user_metadata.json');
            if (fs.existsSync(metadataFile)) {
                const data = JSON.parse(fs.readFileSync(metadataFile, 'utf8'));
                
                // Load user mapping
                if (data.user_mapping) {
                    Object.entries(data.user_mapping).forEach(([userId, internalId]) => {
                        this.userMapping.set(userId, internalId);
                    });
                }
                
                // Load user metadata
                if (data.user_metadata) {
                    Object.entries(data.user_metadata).forEach(([userId, metadata]) => {
                        this.userMetadata.set(userId, metadata);
                    });
                }
                
                
            }
        } catch (error) {
            
        }
    }

    saveMetadata() {
        try {
            const metadataFile = path.join(this.metadataPath, 'user_metadata.json');
            
            const userMappingObj = {};
            const userMetadataObj = {};
            
            // Convert Maps to Objects
            this.userMapping.forEach((internalId, userId) => {
                userMappingObj[userId] = internalId;
            });
            
            this.userMetadata.forEach((metadata, userId) => {
                userMetadataObj[userId] = metadata;
            });
            
            const data = {
                user_mapping: userMappingObj,
                user_metadata: userMetadataObj,
                last_updated: new Date().toISOString()
            };
            
            fs.writeFileSync(metadataFile, JSON.stringify(data, null, 2));
            
        } catch (error) {
            
        }
    }

    getUserId(userId) {
        return this.userMapping.get(userId) || null;
    }

    getNextInternalId() {
        return Math.max(0, ...Array.from(this.userMapping.values())) + 1;
    }

    async processImage(imageData) {
        try {
            let buffer;
            
            // Handle different input types
            if (Buffer.isBuffer(imageData)) {
                // Already a buffer
                buffer = imageData;
            } else if (typeof imageData === 'string') {
                // Base64 string with or without data URL prefix
                const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
                buffer = Buffer.from(base64Data, 'base64');
            } else {
                throw new Error('Invalid image data type');
            }
            
            // Process image with sharp
            const processed = await sharp(buffer)
                .resize(200, 200, { fit: 'cover' })
                .grayscale()
                .jpeg({ quality: 90 })
                .toBuffer();
            
            return processed;
        } catch (error) {
            
            throw new Error(`Failed to process image: ${error.message}`);
        }
    }

    calculateImageHash(imageBuffer) {
        return crypto.createHash('md5').update(imageBuffer).digest('hex');
    }

    async detectFace(imageBuffer) {
        try {
            // Extract image features instead of just hash
            const features = await this.extractImageFeatures(imageBuffer);
            if (!features || features.length < 98) {
                return null;
            }

            const brightness = await this.calculateBrightness(imageBuffer);
            const contrast = await this.calculateContrast(imageBuffer);
            
            // More lenient validation - allow wider range of brightness
            if (brightness < 0.02 || brightness > 0.98) {
                return null;
            }
            
            // Check for reasonable contrast (more lenient)
            if (contrast < 0.05) {
                return null;
            }
            
            // Scientific face presence check: check edge density and biometric variance
            const edgeFeatures = features.slice(64, 80);
            const biometricFeatures = features.slice(92, 98);
            const edgeCount = edgeFeatures.filter(f => f === 1).length;
            const std1 = biometricFeatures[1];
            const std2 = biometricFeatures[3];
            const std3 = biometricFeatures[5];
            const avgBiometricStd = (std1 + std2 + std3) / 3;

            // Flat walls, ceilings, and empty frames have very low edges and region variance
            if (edgeCount < 3 && avgBiometricStd < 0.04) {
                return null; // Reject as empty/non-face frame
            }

            const quality = this.calculateQuality(imageBuffer, brightness, contrast);
            
            return {
                features,
                brightness,
                contrast,
                quality,
                hash: this.calculateImageHash(imageBuffer) // Keep for backward compatibility
            };
        } catch (error) {
            return null;
        }
    }

    async extractImageFeatures(imageBuffer) {
        try {
            // Resize image to standard size for feature extraction
            const processedImage = await sharp(imageBuffer)
                .resize(100, 100, { fit: 'cover' })
                .grayscale()
                .raw()
                .toBuffer({ resolveWithObject: true });

            const { data, info } = processedImage;
            
            // Extract multiple types of features
            const gridFeatures = this.extractGridFeatures(data, info);
            const edgeFeatures = this.extractEdgeFeatures(data, info);
            const textureFeatures = this.extractTextureFeatures(data, info);
            const biometricFeatures = this.extractBiometricFeatures(data, info);

            // Combine all features
            const features = [
                ...gridFeatures,
                ...edgeFeatures,
                ...textureFeatures,
                ...biometricFeatures
            ];

            return features;
        } catch (error) {
            
            return [];
        }
    }

    extractGridFeatures(data, info) {
        const features = [];
        const gridSize = 8; // 8x8 grid for basic features
        const cellSize = Math.floor(100 / gridSize);
        
        for (let row = 0; row < gridSize; row++) {
            for (let col = 0; col < gridSize; col++) {
                let cellSum = 0;
                let cellCount = 0;
                
                // Calculate average intensity for this cell
                for (let y = row * cellSize; y < Math.min((row + 1) * cellSize, info.height); y++) {
                    for (let x = col * cellSize; x < Math.min((col + 1) * cellSize, info.width); x++) {
                        const pixelIndex = y * info.width + x;
                        if (pixelIndex < data.length) {
                            cellSum += data[pixelIndex];
                            cellCount++;
                        }
                    }
                }
                
                const avgIntensity = cellCount > 0 ? cellSum / cellCount : 0;
                features.push(avgIntensity / 255);
            }
        }
        return features;
    }

    extractEdgeFeatures(data, info) {
        const features = [];
        const edgeThreshold = 30;
        
        // Simple edge detection using gradient
        for (let y = 1; y < info.height - 1; y += 4) {
            for (let x = 1; x < info.width - 1; x += 4) {
                const current = data[y * info.width + x];
                const right = data[y * info.width + (x + 1)];
                const down = data[(y + 1) * info.width + x];
                
                const gradientX = Math.abs(current - right);
                const gradientY = Math.abs(current - down);
                const edgeStrength = Math.sqrt(gradientX * gradientX + gradientY * gradientY);
                
                features.push(edgeStrength > edgeThreshold ? 1 : 0);
            }
        }
        return features.slice(0, 16); // Limit to 16 edge features
    }

    extractTextureFeatures(data, info) {
        const features = [];
        const windowSize = 5;
        
        // Extract texture using local binary patterns
        for (let y = windowSize; y < info.height - windowSize; y += 8) {
            for (let x = windowSize; x < info.width - windowSize; x += 8) {
                const center = data[y * info.width + x];
                let pattern = 0;
                
                // 8-neighborhood pattern
                const neighbors = [
                    data[(y-1) * info.width + (x-1)],
                    data[(y-1) * info.width + x],
                    data[(y-1) * info.width + (x+1)],
                    data[y * info.width + (x+1)],
                    data[(y+1) * info.width + (x+1)],
                    data[(y+1) * info.width + x],
                    data[(y+1) * info.width + (x-1)],
                    data[y * info.width + (x-1)]
                ];
                
                neighbors.forEach((neighbor, i) => {
                    if (neighbor >= center) {
                        pattern |= (1 << i);
                    }
                });
                
                features.push(pattern / 255); // Normalize
            }
        }
        return features.slice(0, 12); // Limit to 12 texture features
    }

    extractBiometricFeatures(data, info) {
        const features = [];
        
        // Extract facial region features (assuming face is in center)
        const centerX = Math.floor(info.width / 2);
        const centerY = Math.floor(info.height / 2);
        const regionSize = 20;
        
        // Eye region analysis (upper third)
        const eyeRegion = this.analyzeRegion(data, info, centerX, centerY - 15, regionSize);
        features.push(...eyeRegion);
        
        // Nose region analysis (middle)
        const noseRegion = this.analyzeRegion(data, info, centerX, centerY, regionSize);
        features.push(...noseRegion);
        
        // Mouth region analysis (lower third)
        const mouthRegion = this.analyzeRegion(data, info, centerX, centerY + 15, regionSize);
        features.push(...mouthRegion);
        
        return features;
    }

    analyzeRegion(data, info, centerX, centerY, size) {
        const features = [];
        const halfSize = Math.floor(size / 2);
        
        let sum = 0;
        let count = 0;
        let variance = 0;
        
        for (let y = centerY - halfSize; y < centerY + halfSize && y < info.height; y++) {
            for (let x = centerX - halfSize; x < centerX + halfSize && x < info.width; x++) {
                if (y >= 0 && x >= 0) {
                    const pixelIndex = y * info.width + x;
                    if (pixelIndex < data.length) {
                        sum += data[pixelIndex];
                        count++;
                    }
                }
            }
        }
        
        const mean = count > 0 ? sum / count : 0;
        
        // Calculate variance
        for (let y = centerY - halfSize; y < centerY + halfSize && y < info.height; y++) {
            for (let x = centerX - halfSize; x < centerX + halfSize && x < info.width; x++) {
                if (y >= 0 && x >= 0) {
                    const pixelIndex = y * info.width + x;
                    if (pixelIndex < data.length) {
                        variance += Math.pow(data[pixelIndex] - mean, 2);
                    }
                }
            }
        }
        
        features.push(mean / 255); // Normalized mean
        features.push(Math.sqrt(variance / count) / 255); // Normalized standard deviation
        
        return features;
    }

    async calculateBrightness(imageBuffer) {
        try {
            const { data } = await sharp(imageBuffer)
                .resize(10, 10)
                .raw()
                .toBuffer({ resolveWithObject: true });
            
            let totalBrightness = 0;
            for (let i = 0; i < data.length; i++) {
                totalBrightness += data[i] / 255;
            }
            
            return totalBrightness / data.length;
        } catch (error) {
            return 0.5; // Default brightness
        }
    }

    async calculateContrast(imageBuffer) {
        try {
            const { data } = await sharp(imageBuffer)
                .resize(10, 10)
                .raw()
                .toBuffer({ resolveWithObject: true });
            
            let min = 255;
            let max = 0;
            
            for (let i = 0; i < data.length; i++) {
                min = Math.min(min, data[i]);
                max = Math.max(max, data[i]);
            }
            
            return (max - min) / 255;
        } catch (error) {
            return 0.5; // Default contrast
        }
    }

    calculateQuality(imageBuffer, brightness, contrast = 0.5) {
        // Calculate quality based on image characteristics
        const size = imageBuffer.length;
        const sizeScore = Math.min(1, size / 50000); // Prefer larger images
        const brightnessScore = 1 - Math.abs(brightness - 0.5) * 2; // Prefer medium brightness
        const contrastScore = Math.min(1, contrast * 2); // Prefer higher contrast
        
        return Math.round((sizeScore + brightnessScore + contrastScore) / 3 * 100) / 100;
    }

    async collectFaceSamples(userId, faceDataList) {
        try {
            
            
            // Validate input
            if (!faceDataList || !Array.isArray(faceDataList) || faceDataList.length < this.minSamples) {
                return {
                    success: false,
                    message: `At least ${this.minSamples} face samples are required for training`
                };
            }

            // Limit samples
            const samples = faceDataList.slice(0, this.maxSamples);
            const userIdStr = String(userId);
            
            // Get or create internal ID
            let internalId = this.getUserId(userIdStr);
            if (!internalId) {
                internalId = this.getNextInternalId();
                this.userMapping.set(userIdStr, internalId);
            }

            let successfulSamples = 0;
            const qualityScores = [];
            const sampleHashes = [];
            const sampleFeatures = [];

            // Process each sample
            for (let i = 0; i < samples.length; i++) {
                try {
                    const processedImage = await this.processImage(samples[i]);
                    const faceData = await this.detectFace(processedImage);
                    
                    if (!faceData) {
                        
                        continue;
                    }

                    if (faceData.quality < 0.3) {
                        
                        continue;
                    }

                    // Save sample
                    const sampleFilename = `user_${userIdStr}_sample_${successfulSamples + 1}.jpg`;
                    const samplePath = path.join(this.datasetPath, sampleFilename);
                    
                    fs.writeFileSync(samplePath, processedImage);
                    
                    successfulSamples++;
                    qualityScores.push(faceData.quality);
                    sampleHashes.push(faceData.hash);
                    sampleFeatures.push(faceData.features); // Store features for better matching
                    
                    
                    
                } catch (error) {
                    
                }
            }

            if (successfulSamples < this.minSamples) {
                return {
                    success: false,
                    message: `Only ${successfulSamples} valid samples collected. Need at least ${this.minSamples}.`
                };
            }

            // Update metadata
            const avgQuality = qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length;
            const qualityLevel = avgQuality > 0.7 ? 'high' : avgQuality > 0.5 ? 'medium' : 'low';
            
            this.userMetadata.set(userIdStr, {
                internal_id: internalId,
                created_at: new Date().toISOString(),
                sample_count: successfulSamples,
                last_trained: new Date().toISOString(),
                quality: qualityLevel,
                last_updated: new Date().toISOString(),
                avg_quality: avgQuality,
                sample_hashes: sampleHashes,
                sample_features: sampleFeatures // Store features for better matching
            });

            // Save metadata
            this.saveMetadata();

            // Update database
            try {
                await User.findByIdAndUpdate(userId, {
                    faceDataCollected: true,
                    faceSampleCount: successfulSamples,
                    faceDataQuality: qualityLevel,
                    isFaceVerified: false,
                    faceTrainingCompleted: true,
                    faceTrainingDate: new Date()
                });
                
            } catch (dbError) {
                
            }

            
            

            return {
                success: true,
                message: 'Face samples collected successfully',
                total_samples: successfulSamples,
                quality: qualityLevel,
                avg_quality: avgQuality,
                user: {
                    id: userId,
                    internal_id: internalId,
                    sample_count: successfulSamples,
                    quality: qualityLevel
                }
            };

        } catch (error) {
            
            return {
                success: false,
                message: `Error collecting face samples: ${error.message}`
            };
        }
    }

    async detectFacesFromDataset(userIdStr) {
        try {
            
            
            const userMetadata = this.userMetadata.get(userIdStr);
            if (!userMetadata) {
                
                return [];
            }

            const detectedFaces = [];
            const sampleCount = userMetadata.sample_count || 0;
            
            // Check each sample file
            for (let i = 1; i <= sampleCount; i++) {
                const samplePath = path.join(this.datasetPath, `user_${userIdStr}_sample_${i}.jpg`);
                
                if (fs.existsSync(samplePath)) {
                    try {
                        const sampleBuffer = fs.readFileSync(samplePath);
                        const faceData = await this.detectFace(sampleBuffer);
                        
                        if (faceData) {
                            detectedFaces.push({
                                sampleIndex: i,
                                faceData: faceData,
                                path: samplePath
                            });
                            
                        } else {
                            
                        }
                    } catch (error) {
                        
                    }
                }
            }
            
            
            return detectedFaces;
            
        } catch (error) {
            
            return [];
        }
    }

    async verifyFace(faceData, userId) {
        try {
            
            
            const userIdStr = String(userId);
            
            // Check if user has face data
            if (!this.userMetadata.has(userIdStr)) {
                return {
                    success: false,
                    isMatch: false,
                    confidence: 0,
                    message: `No face data found for user ${userId}`
                };
            }

            // Step 1: Detect faces from dataset samples first
            
            const datasetFaces = await this.detectFacesFromDataset(userIdStr);
            if (!datasetFaces || datasetFaces.length === 0) {
                return {
                    success: false,
                    isMatch: false,
                    confidence: 0,
                    message: 'No faces detected in dataset samples'
                };
            }
            

            // Step 2: Process and detect face in input image
            
            const processedImage = await this.processImage(faceData);
            const inputFaceData = await this.detectFace(processedImage);
            
            if (!inputFaceData) {
                return {
                    success: false,
                    isMatch: false,
                    confidence: 0,
                    message: 'No face detected in input image'
                };
            }
            

            // Step 3: Compare input face with dataset faces
            

            let maxSimilarity = 0;
            let minEuclideanDistance = 100; // Large initial value
            let bestMatchIndex = -1;
            const similarities = [];
            
            // Compare with detected dataset faces
            if (datasetFaces.length > 0 && inputFaceData.features.length > 0) {
                for (let i = 0; i < datasetFaces.length; i++) {
                    const datasetFace = datasetFaces[i];
                    
                    // 1. Calculate weighted similarity (existing logic)
                    const similarity = this.calculateFeatureSimilarity(inputFaceData.features, datasetFace.faceData.features);
                    similarities.push(similarity);
                    
                    // 2. Calculate raw Euclidean distance for the user's specific requirement
                    const rawDistance = this.calculateRawEuclideanDistance(inputFaceData.features, datasetFace.faceData.features);
                    if (rawDistance < minEuclideanDistance) {
                        minEuclideanDistance = rawDistance;
                        bestMatchIndex = i;
                    }
                    
                    if (similarity > maxSimilarity) {
                        maxSimilarity = similarity;
                    }
                    
                    
                }
            }

            // USER REQUIREMENT: Match if distance < 0.5
            const distanceMatch = minEuclideanDistance < 0.5;
            
            // Calculate confidence
            const baseConfidence = maxSimilarity * 100;
            const distanceConfidence = distanceMatch ? 90 : Math.max(0, (1 - minEuclideanDistance) * 100);
            let confidence = Math.max(baseConfidence, distanceConfidence);
            
            // Apply threshold
            const isMatch = distanceMatch || confidence >= this.minConfidence;

            

            return {
                success: true,
                isMatch,
                confidence: Math.round(confidence * 10) / 10,
                message: isMatch 
                    ? `Face verified! (Distance: ${minEuclideanDistance.toFixed(3)})`
                    : `Face verification failed. (Best Distance: ${minEuclideanDistance.toFixed(3)})`,
                details: {
                    min_distance: minEuclideanDistance,
                    is_distance_match: distanceMatch,
                    best_match_sample: datasetFaces[bestMatchIndex]?.sampleIndex || 'N/A'
                }
            };

        } catch (error) {
            
            return {
                success: false,
                isMatch: false,
                confidence: 0,
                message: `Error verifying face: ${error.message}`
            };
        }
    }

    calculateHashSimilarity(hash1, hash2) {
        if (hash1 === hash2) return 1.0;
        
        // Fallback to advanced hash similarity for backward compatibility
        const similarity = this.calculateAdvancedSimilarity(hash1, hash2);
        return similarity;
    }

    calculateFeatureSimilarity(features1, features2) {
        if (!features1 || !features2 || features1.length === 0 || features2.length === 0) {
            return 0;
        }

        // Ensure both feature arrays have the same length
        const minLength = Math.min(features1.length, features2.length);
        
        if (minLength === 0) return 0;

        // Calculate multiple similarity metrics for robust matching
        const cosineSimilarity = this.calculateCosineSimilarity(features1, features2);
        const euclideanSimilarity = this.calculateEuclideanSimilarity(features1, features2);
        const manhattanSimilarity = this.calculateManhattanSimilarity(features1, features2);
        const correlationSimilarity = this.calculateCorrelationSimilarity(features1, features2);

        // Calculate weighted similarity for different feature types
        const gridFeatures = features1.slice(0, 64); // First 64 are grid features
        const edgeFeatures = features1.slice(64, 80); // Next 16 are edge features
        const textureFeatures = features1.slice(80, 92); // Next 12 are texture features
        const biometricFeatures = features1.slice(92); // Rest are biometric features

        const gridFeatures2 = features2.slice(0, 64);
        const edgeFeatures2 = features2.slice(64, 80);
        const textureFeatures2 = features2.slice(80, 92);
        const biometricFeatures2 = features2.slice(92);

        // Calculate feature-specific similarities using multiple methods
        const gridSimilarity = this.calculateMultiMetricSimilarity(gridFeatures, gridFeatures2);
        const edgeSimilarity = this.calculateMultiMetricSimilarity(edgeFeatures, edgeFeatures2);
        const textureSimilarity = this.calculateMultiMetricSimilarity(textureFeatures, textureFeatures2);
        const biometricSimilarity = this.calculateMultiMetricSimilarity(biometricFeatures, biometricFeatures2);

        // Overall similarity using multiple approaches
        const overallSimilarity = (cosineSimilarity + euclideanSimilarity + manhattanSimilarity + correlationSimilarity) / 4;
        
        // Feature-weighted combination
        const featureSimilarity = (gridSimilarity * 0.35) + (edgeSimilarity * 0.2) + 
                                 (textureSimilarity * 0.25) + (biometricSimilarity * 0.2);

        // Combine overall and feature similarities with adaptive weighting
        const finalSimilarity = (overallSimilarity * 0.4) + (featureSimilarity * 0.6);

        // Apply adaptive boosting for better matching
        let boostedSimilarity = finalSimilarity;
        
        // Boost for high-quality matches
        if (finalSimilarity > 0.6) {
            boostedSimilarity = Math.min(1.0, finalSimilarity * 1.15);
        } else if (finalSimilarity > 0.4) {
            boostedSimilarity = Math.min(1.0, finalSimilarity * 1.08);
        } else if (finalSimilarity > 0.25) {
            boostedSimilarity = Math.min(1.0, finalSimilarity * 1.05);
        }

        return Math.max(0, Math.min(1.0, boostedSimilarity));
    }

    calculateWeightedSimilarity(features1, features2, weight) {
        if (!features1 || !features2 || features1.length === 0 || features2.length === 0) {
            return 0;
        }

        const minLength = Math.min(features1.length, features2.length);
        
        // Calculate cosine similarity (better for high-dimensional features)
        let dotProduct = 0;
        let norm1 = 0;
        let norm2 = 0;
        
        for (let i = 0; i < minLength; i++) {
            dotProduct += features1[i] * features2[i];
            norm1 += features1[i] * features1[i];
            norm2 += features2[i] * features2[i];
        }
        
        const cosineSimilarity = dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
        
        // Handle NaN cases
        if (isNaN(cosineSimilarity)) return 0;
        
        return Math.max(0, cosineSimilarity);
    }

    // New multi-metric similarity calculation methods
    calculateCosineSimilarity(features1, features2) {
        if (!features1 || !features2 || features1.length === 0 || features2.length === 0) {
            return 0;
        }

        const minLength = Math.min(features1.length, features2.length);
        let dotProduct = 0;
        let norm1 = 0;
        let norm2 = 0;
        
        for (let i = 0; i < minLength; i++) {
            dotProduct += features1[i] * features2[i];
            norm1 += features1[i] * features1[i];
            norm2 += features2[i] * features2[i];
        }
        
        if (norm1 === 0 || norm2 === 0) return 0;
        
        const cosineSimilarity = dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
        return Math.max(0, Math.min(1.0, cosineSimilarity));
    }

    calculateEuclideanSimilarity(features1, features2) {
        const distance = this.calculateRawEuclideanDistance(features1, features2);
        const minLength = Math.min(features1.length, features2.length);
        const maxPossibleDistance = Math.sqrt(minLength * 4); // Assuming features are in range [-1, 1]
        const similarity = 1 - (distance / maxPossibleDistance);
        
        return Math.max(0, Math.min(1.0, similarity));
    }

    calculateRawEuclideanDistance(features1, features2) {
        if (!features1 || !features2 || features1.length === 0 || features2.length === 0) {
            return 100;
        }

        const minLength = Math.min(features1.length, features2.length);
        let sumSquaredDiffs = 0;
        
        for (let i = 0; i < minLength; i++) {
            const diff = features1[i] - features2[i];
            sumSquaredDiffs += diff * diff;
        }
        
        return Math.sqrt(sumSquaredDiffs);
    }

    calculateManhattanSimilarity(features1, features2) {
        if (!features1 || !features2 || features1.length === 0 || features2.length === 0) {
            return 0;
        }

        const minLength = Math.min(features1.length, features2.length);
        let sumAbsDiffs = 0;
        
        for (let i = 0; i < minLength; i++) {
            sumAbsDiffs += Math.abs(features1[i] - features2[i]);
        }
        
        const manhattanDistance = sumAbsDiffs;
        const maxPossibleDistance = minLength * 2; // Assuming features are in range [-1, 1]
        const similarity = 1 - (manhattanDistance / maxPossibleDistance);
        
        return Math.max(0, Math.min(1.0, similarity));
    }

    calculateCorrelationSimilarity(features1, features2) {
        if (!features1 || !features2 || features1.length === 0 || features2.length === 0) {
            return 0;
        }

        const minLength = Math.min(features1.length, features2.length);
        
        // Calculate means
        let sum1 = 0, sum2 = 0;
        for (let i = 0; i < minLength; i++) {
            sum1 += features1[i];
            sum2 += features2[i];
        }
        const mean1 = sum1 / minLength;
        const mean2 = sum2 / minLength;
        
        // Calculate correlation coefficient
        let numerator = 0;
        let sumSq1 = 0;
        let sumSq2 = 0;
        
        for (let i = 0; i < minLength; i++) {
            const diff1 = features1[i] - mean1;
            const diff2 = features2[i] - mean2;
            numerator += diff1 * diff2;
            sumSq1 += diff1 * diff1;
            sumSq2 += diff2 * diff2;
        }
        
        if (sumSq1 === 0 || sumSq2 === 0) return 0;
        
        const correlation = numerator / Math.sqrt(sumSq1 * sumSq2);
        const similarity = (correlation + 1) / 2; // Convert from [-1, 1] to [0, 1]
        
        return Math.max(0, Math.min(1.0, similarity));
    }

    calculateMultiMetricSimilarity(features1, features2) {
        if (!features1 || !features2 || features1.length === 0 || features2.length === 0) {
            return 0;
        }

        // Calculate multiple similarity metrics
        const cosine = this.calculateCosineSimilarity(features1, features2);
        const euclidean = this.calculateEuclideanSimilarity(features1, features2);
        const manhattan = this.calculateManhattanSimilarity(features1, features2);
        const correlation = this.calculateCorrelationSimilarity(features1, features2);
        
        // Weighted average of all metrics
        const weightedSimilarity = (cosine * 0.3) + (euclidean * 0.25) + (manhattan * 0.2) + (correlation * 0.25);
        
        return Math.max(0, Math.min(1.0, weightedSimilarity));
    }

    calculateAdvancedSimilarity(hash1, hash2) {
        // Method 1: Character similarity (basic)
        let charMatches = 0;
        const minLength = Math.min(hash1.length, hash2.length);
        
        for (let i = 0; i < minLength; i++) {
            if (hash1[i] === hash2[i]) charMatches++;
        }
        const charSimilarity = charMatches / minLength;

        // Method 2: Pattern similarity (check for similar patterns)
        const patternSimilarity = this.calculatePatternSimilarity(hash1, hash2);

        // Method 3: Length similarity
        const lengthDiff = Math.abs(hash1.length - hash2.length);
        const maxLength = Math.max(hash1.length, hash2.length);
        const lengthSimilarity = 1 - (lengthDiff / maxLength);

        // Method 4: Positional similarity (weighted by position)
        const positionalSimilarity = this.calculatePositionalSimilarity(hash1, hash2);

        // Combine all metrics with weights
        const weights = {
            char: 0.3,
            pattern: 0.3,
            length: 0.2,
            positional: 0.2
        };

        const combinedSimilarity = 
            (charSimilarity * weights.char) +
            (patternSimilarity * weights.pattern) +
            (lengthSimilarity * weights.length) +
            (positionalSimilarity * weights.positional);

        // Boost similarity for very close matches
        if (combinedSimilarity > 0.8) {
            return Math.min(1.0, combinedSimilarity * 1.2);
        }

        return combinedSimilarity;
    }

    calculatePatternSimilarity(hash1, hash2) {
        // Look for similar character patterns
        const patterns1 = this.extractPatterns(hash1);
        const patterns2 = this.extractPatterns(hash2);
        
        let commonPatterns = 0;
        const totalPatterns = Math.max(patterns1.size, patterns2.size);
        
        for (const pattern of patterns1) {
            if (patterns2.has(pattern)) {
                commonPatterns++;
            }
        }
        
        return totalPatterns > 0 ? commonPatterns / totalPatterns : 0;
    }

    extractPatterns(hash) {
        const patterns = new Set();
        // Extract 2-character patterns
        for (let i = 0; i < hash.length - 1; i++) {
            patterns.add(hash.substring(i, i + 2));
        }
        // Extract 3-character patterns
        for (let i = 0; i < hash.length - 2; i++) {
            patterns.add(hash.substring(i, i + 3));
        }
        return patterns;
    }

    calculatePositionalSimilarity(hash1, hash2) {
        let positionalScore = 0;
        const minLength = Math.min(hash1.length, hash2.length);
        
        // Weight early positions more heavily (they're more stable)
        for (let i = 0; i < minLength; i++) {
            const weight = (minLength - i) / minLength; // Higher weight for earlier positions
            if (hash1[i] === hash2[i]) {
                positionalScore += weight;
            }
        }
        
        return positionalScore / minLength;
    }

    analyzeSimilarityDistribution(similarities) {
        if (similarities.length === 0) {
            return { isSuspicious: true, message: "No similarities to analyze" };
        }

        // Calculate statistics
        const mean = similarities.reduce((a, b) => a + b, 0) / similarities.length;
        const variance = similarities.reduce((sum, sim) => sum + Math.pow(sim - mean, 2), 0) / similarities.length;
        const stdDev = Math.sqrt(variance);
        const maxSim = Math.max(...similarities);
        const minSim = Math.min(...similarities);
        const range = maxSim - minSim;

        

        // Security checks for impersonation detection (more lenient for legitimate matches)
        const checks = {
            // Check 1: Too uniform similarities (more lenient threshold)
            uniformSimilarities: stdDev < 0.02 && similarities.length > 10,
            
            // Check 2: Too high mean similarity (more lenient)
            tooHighSimilarity: mean > 0.95 && stdDev < 0.01,
            
            // Check 3: Too low variance (more lenient)
            lowVariance: stdDev < 0.05 && similarities.length > 8,
            
            // Check 4: Perfect matches (more lenient - allow some perfect matches)
            perfectMatches: similarities.filter(s => s > 0.99).length > similarities.length * 0.5,
            
            // Check 5: All similarities above threshold (more lenient)
            allAboveThreshold: similarities.filter(s => s > 0.8).length === similarities.length && similarities.length > 10
        };

        const suspiciousChecks = Object.entries(checks).filter(([_, value]) => value);
        
        if (suspiciousChecks.length > 0) {
            return {
                isSuspicious: true,
                message: `Suspicious pattern: ${suspiciousChecks.map(([check, _]) => check).join(', ')}`,
                checks: checks,
                stats: { mean, stdDev, range, maxSim, minSim }
            };
        }

        return {
            isSuspicious: false,
            message: "Normal similarity distribution",
            checks: checks,
            stats: { mean, stdDev, range, maxSim, minSim }
        };
    }

    performSecurityValidation(maxSimilarity, similarities, faceData) {
        let adjustment = 0;
        let message = "Normal verification";

        // Check 1: Minimum similarity threshold
        if (maxSimilarity < this.minSimilarity) {
            adjustment -= 20;
            message = "Similarity below minimum threshold";
        }

        // Check 2: Quality validation
        if (faceData.quality < 0.4) {
            adjustment -= 15;
            message = "Image quality too low";
        }

        // Check 3: Suspicious similarity patterns
        if (similarities.length > 0) {
            const mean = similarities.reduce((a, b) => a + b, 0) / similarities.length;
            const highSimilarities = similarities.filter(s => s > 0.8).length;
            
            // If most similarities are very high, it might be impersonation
            if (highSimilarities > similarities.length * 0.7 && similarities.length > 3) {
                adjustment -= 25;
                message = "Suspicious high similarity pattern";
            }
            
            // If similarity is too close to perfect, it's suspicious
            if (maxSimilarity > 0.95) {
                adjustment -= 10;
                message = "Suspiciously perfect match";
            }
        }

        // Check 4: Face detection quality
        if (faceData.brightness < 0.2 || faceData.brightness > 0.8) {
            adjustment -= 10;
            message = "Poor lighting conditions";
        }

        return { adjustment, message };
    }

    calculateAdaptiveThreshold(userId, similarities, faceData) {
        const userMetadata = this.userMetadata.get(userId);
        if (!userMetadata) {
            return this.baseConfidence; // Default threshold for new users
        }

        // Base threshold
        let threshold = this.baseConfidence;

        // Adjust based on user's historical performance
        if (userMetadata.avg_quality) {
            // Higher quality users can have lower thresholds
            const qualityAdjustment = (userMetadata.avg_quality - 0.5) * 20;
            threshold -= qualityAdjustment;
        }

        // Adjust based on current image quality
        if (faceData.quality > 0.7) {
            threshold -= 10; // Lower threshold for high-quality images
        } else if (faceData.quality < 0.4) {
            threshold += 15; // Higher threshold for poor-quality images
        }

        // Adjust based on lighting conditions
        if (faceData.brightness > 0.3 && faceData.brightness < 0.7) {
            threshold -= 5; // Good lighting = lower threshold
        } else {
            threshold += 10; // Poor lighting = higher threshold
        }

        // Adjust based on similarity distribution
        if (similarities.length > 0) {
            const mean = similarities.reduce((a, b) => a + b, 0) / similarities.length;
            const stdDev = Math.sqrt(similarities.reduce((sum, sim) => sum + Math.pow(sim - mean, 2), 0) / similarities.length);
            
            // If similarities are too uniform, increase threshold (impersonation detection)
            if (stdDev < 0.05 && similarities.length > 5) {
                threshold += 20;
            }
            
            // If similarities are too high, increase threshold (suspicious)
            if (mean > 0.85) {
                threshold += 15;
            }
        }

        // Ensure threshold is within reasonable bounds (more user-friendly)
        return Math.max(30, Math.min(75, threshold));
    }

    performIntelligentValidation(maxSimilarity, similarities, faceData, adaptiveThreshold) {
        let adjustment = 0;
        let message = "Normal verification";

        // Check 1: Minimum similarity requirement (more lenient)
        if (maxSimilarity < 0.25) {
            adjustment -= 15;
            message = "Similarity too low";
        }

        // Check 2: Quality validation with adaptive thresholds (more lenient)
        const qualityThreshold = faceData.brightness > 0.3 && faceData.brightness < 0.7 ? 0.2 : 0.25;
        if (faceData.quality < qualityThreshold) {
            adjustment -= 10;
            message = "Image quality below threshold";
        }

        // Check 3: Intelligent similarity pattern analysis (more lenient for legitimate matches)
        if (similarities.length > 0) {
            const mean = similarities.reduce((a, b) => a + b, 0) / similarities.length;
            const stdDev = Math.sqrt(similarities.reduce((sum, sim) => sum + Math.pow(sim - mean, 2), 0) / similarities.length);
            
            // Detect impersonation patterns (more lenient)
            if (stdDev < 0.02 && similarities.length > 10 && maxSimilarity < 0.8) {
                adjustment -= 20;
                message = "Suspicious uniform similarity pattern";
            } else if (mean > 0.95 && similarities.length > 5 && stdDev < 0.01) {
                adjustment -= 15;
                message = "Suspiciously uniform high similarity";
            } else if (maxSimilarity > 0.99 && stdDev < 0.001) {
                adjustment -= 10;
                message = "Suspiciously perfect match";
            } else if (maxSimilarity > 0.95 && mean > 0.9) {
                // This might be a legitimate match with same person
                adjustment += 5;
                message = "High-quality legitimate match detected";
            }
        }

        // Check 4: Biometric consistency check (more lenient)
        if (faceData.features && faceData.features.length > 92) {
            const biometricFeatures = faceData.features.slice(92);
            const biometricVariance = this.calculateVariance(biometricFeatures);
            
            // Too low variance in biometric features might indicate fake image (more lenient threshold)
            if (biometricVariance < 0.002) {
                adjustment -= 10;
                message = "Suspicious biometric pattern";
            }
        }

        // Check 5: Lighting condition validation (more lenient)
        if (faceData.brightness < 0.1 || faceData.brightness > 0.9) {
            adjustment -= 10;
            message = "Poor lighting conditions";
        }

        // Check 6: Contrast validation (more lenient)
        if (faceData.contrast < 0.15) {
            adjustment -= 5;
            message = "Low contrast image";
        }

        // Check 7: Adaptive bonus for good conditions and legitimate patterns
        if (faceData.quality > 0.6 && faceData.brightness > 0.3 && faceData.brightness < 0.7 && faceData.contrast > 0.4) {
            adjustment += 8;
            message = "Excellent capture conditions";
        } else if (faceData.quality > 0.5 && maxSimilarity > 0.4 && maxSimilarity < 0.8) {
            // Bonus for reasonable similarity range (legitimate user pattern)
            adjustment += 5;
            message = "Good user pattern detected";
        } else if (faceData.quality > 0.25 && maxSimilarity > 0.25 && maxSimilarity < 0.8) {
            // Bonus for acceptable quality and similarity (help lower quality users)
            adjustment += 5;
            message = "Acceptable user pattern detected";
        }

        return { adjustment, message };
    }

    calculateVariance(features) {
        if (features.length === 0) return 0;
        
        const mean = features.reduce((a, b) => a + b, 0) / features.length;
        const variance = features.reduce((sum, feature) => sum + Math.pow(feature - mean, 2), 0) / features.length;
        
        return variance;
    }

    async syncCloudinaryProfiles() {
        try {
            
            const users = await User.find({ profilePicture: { $ne: null } }).select('_id name profilePicture');
            
            
            
            let syncedCount = 0;
            for (const user of users) {
                const userIdStr = String(user._id);
                
                // If user doesn't have local face data or has very few samples
                const metadata = this.userMetadata.get(userIdStr);
                if (!metadata || metadata.sample_count < 1) {
                    
                    const success = await this.addCloudinarySample(userIdStr, user.profilePicture);
                    if (success) syncedCount++;
                }
            }
            
            if (syncedCount > 0) {
                
                this.saveMetadata();
            } else {
                
            }
        } catch (error) {
            
        }
    }

    async addCloudinarySample(userId, imageUrl) {
        try {
            // Download image
            const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
            const buffer = Buffer.from(response.data);
            
            // Process image
            const processedImage = await this.processImage(buffer);
            const faceData = await this.detectFace(processedImage);
            
            if (!faceData || faceData.quality < 0.2) {
                
                return false;
            }

            const userIdStr = String(userId);
            let internalId = this.getUserId(userIdStr);
            if (!internalId) {
                internalId = this.getNextInternalId();
                this.userMapping.set(userIdStr, internalId);
            }

            // Save sample locally
            const sampleFilename = `user_${userIdStr}_profile_sync.jpg`;
            const samplePath = path.join(this.datasetPath, sampleFilename);
            fs.writeFileSync(samplePath, processedImage);

            // Update metadata
            const existingMetadata = this.userMetadata.get(userIdStr) || {
                internal_id: internalId,
                created_at: new Date().toISOString(),
                sample_count: 0,
                sample_hashes: [],
                sample_features: []
            };

            // Add this sample to features/hashes if not already present
            if (!existingMetadata.sample_hashes.includes(faceData.hash)) {
                existingMetadata.sample_count += 1;
                existingMetadata.sample_hashes.push(faceData.hash);
                existingMetadata.sample_features.push(faceData.features);
                existingMetadata.last_updated = new Date().toISOString();
                existingMetadata.quality = existingMetadata.quality || (faceData.quality > 0.5 ? 'medium' : 'low');
                
                this.userMetadata.set(userIdStr, existingMetadata);
                return true;
            }

            return false;
        } catch (error) {
            
            return false;
        }
    }

    async recognizeFace(faceData) {
        try {
            
            
            // Process input image
            const processedImage = await this.processImage(faceData);
            const inputFaceData = await this.detectFace(processedImage);
            
            if (!inputFaceData) {
                return {
                    success: false,
                    userId: null,
                    confidence: 0,
                    message: 'No face detected in input image'
                };
            }

            let bestMatch = null;
            let bestConfidence = 0;

            // Compare against all users in metadata
            for (const [userId, userMetadata] of this.userMetadata) {
                const storedFeatures = userMetadata.sample_features || [];
                
                let maxSimilarity = 0;
                for (const features of storedFeatures) {
                    const similarity = this.calculateFeatureSimilarity(inputFaceData.features, features);
                    maxSimilarity = Math.max(maxSimilarity, similarity);
                }

                // Calculate confidence (similar to verifyFace logic)
                const baseConfidence = maxSimilarity * 100;
                const qualityBonus = inputFaceData.quality * 10;
                const confidence = Math.min(98, baseConfidence + qualityBonus);
                
                if (confidence > bestConfidence && confidence >= 45) { // Use 45% as minimum threshold for recognition
                    bestConfidence = confidence;
                    bestMatch = userId;
                }
            }

            if (bestMatch) {
                
                return {
                    success: true,
                    userId: bestMatch,
                    confidence: Math.round(bestConfidence * 10) / 10,
                    message: `Face recognized as user ${bestMatch}`
                };
            } else {
                return {
                    success: false,
                    userId: null,
                    confidence: 0,
                    message: 'Face not recognized in dataset'
                };
            }

        } catch (error) {
            
            return {
                success: false,
                userId: null,
                confidence: 0,
                message: `Error recognizing face: ${error.message}`
            };
        }
    }

    async getUserSamples(userId) {
        try {
            const userIdStr = String(userId);
            const metadata = this.userMetadata.get(userIdStr);
            return metadata ? metadata.sample_count : 0;
        } catch (error) {
            
            return 0;
        }
    }

    async getUserMetadata(userId) {
        try {
            const userIdStr = String(userId);
            const metadata = this.userMetadata.get(userIdStr);
            return metadata ? { ...metadata } : null;
        } catch (error) {
            
            return null;
        }
    }

    async removeUserData(userId) {
        try {
            
            
            const userIdStr = String(userId);
            const internalId = this.getUserId(userIdStr);
            
            if (!internalId) {
                return {
                    success: false,
                    message: `No face data found for user ${userId}`
                };
            }

            // Remove files
            const files = fs.readdirSync(this.datasetPath);
            const userFiles = files.filter(file => file.startsWith(`user_${userIdStr}_`));
            
            for (const file of userFiles) {
                const filePath = path.join(this.datasetPath, file);
                fs.unlinkSync(filePath);
                
            }

            // Remove from metadata
            this.userMapping.delete(userIdStr);
            this.userMetadata.delete(userIdStr);
            this.saveMetadata();

            // Update database
            try {
                await User.findByIdAndUpdate(userId, {
                    $unset: {
                        faceData: "",
                        faceDataCollected: "",
                        faceDataQuality: "",
                        isFaceVerified: "",
                        faceTrainingCompleted: "",
                        faceTrainingDate: "",
                        faceSampleCount: ""
                    }
                });
                
            } catch (dbError) {
                
            }

            
            
            return {
                success: true,
                message: `Face data removed for user ${userId}`,
                files_removed: userFiles.length
            };

        } catch (error) {
            
            return {
                success: false,
                message: `Error removing user data: ${error.message}`
            };
        }
    }

    async getSystemStats() {
        try {
            const totalUsers = this.userMapping.size;
            const trainedUsers = this.userMetadata.size;
            
            let totalSamples = 0;
            let totalFiles = 0;
            
            if (fs.existsSync(this.datasetPath)) {
                const files = fs.readdirSync(this.datasetPath);
                totalFiles = files.length;
                totalSamples = files.filter(file => file.endsWith('.jpg')).length;
            }

            const avgSamplesPerUser = totalUsers > 0 ? Math.round(totalSamples / totalUsers) : 0;
            const systemQuality = totalUsers >= 10 ? 'high' : totalUsers >= 5 ? 'medium' : 'low';

            return {
                success: true,
                total_users: totalUsers,
                trained_users: trainedUsers,
                total_samples: totalSamples,
                total_files: totalFiles,
                avg_samples_per_user: avgSamplesPerUser,
                system_quality: systemQuality,
                last_updated: new Date().toISOString()
            };

        } catch (error) {
            
            return {
                success: false,
                message: `Error getting system stats: ${error.message}`
            };
        }
    }

    async healthCheck() {
        try {
            const stats = await this.getSystemStats();
            return {
                success: true,
                status: 'healthy',
                service: 'Pure Node.js Face Recognition',
                uptime: process.uptime(),
                memory_usage: process.memoryUsage(),
                stats: stats
            };
        } catch (error) {
            return {
                success: false,
                status: 'error',
                message: error.message
            };
        }
    }
}

// Create singleton instance
const pureNodeFaceRecognition = new PureNodeFaceRecognition();

// Export functions for compatibility
async function storeFaceData(userId, faceDataList) {
    return await pureNodeFaceRecognition.collectFaceSamples(userId, faceDataList);
}

async function verifyFace(faceData, userId) {
    return await pureNodeFaceRecognition.verifyFace(faceData, userId);
}

async function recognizeFace(faceData) {
    return await pureNodeFaceRecognition.recognizeFace(faceData);
}

async function getUserSamples(userId) {
    return await pureNodeFaceRecognition.getUserSamples(userId);
}

async function getFaceData(userId) {
    return await pureNodeFaceRecognition.getUserMetadata(userId);
}

async function removeFaceData(userId) {
    return await pureNodeFaceRecognition.removeUserData(userId);
}

async function getTrainingStats() {
    return await pureNodeFaceRecognition.getSystemStats();
}

async function healthCheck() {
    return await pureNodeFaceRecognition.healthCheck();
}

module.exports = {
    pureNodeFaceRecognition,
    storeFaceData,
    verifyFace,
    recognizeFace,
    getUserSamples,
    getFaceData,
    removeFaceData,
    getTrainingStats,
    healthCheck
};

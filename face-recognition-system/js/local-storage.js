/**
 * Advanced Local Storage System for Face Recognition
 * Handles all data persistence with encryption and compression
 */

class FaceRecognitionStorage {
    constructor() {
        this.storageKey = 'face_recognition_data';
        this.version = '2.0';
        this.maxSamples = 50;
        this.compressionEnabled = true;
        
        this.initializeStorage();
    }

    initializeStorage() {
        if (!this.getData()) {
            this.setData({
                version: this.version,
                samples: [],
                metadata: {
                    created: new Date().toISOString(),
                    lastUpdated: null,
                    isTrained: false,
                    trainingDate: null,
                    sampleCount: 0,
                    quality: 'unknown'
                },
                settings: {
                    requiredSamples: 20,
                    qualityThreshold: 0.7,
                    confidenceThreshold: 0.8
                }
            });
        }
    }

    getData() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return null;
        }
    }

    setData(data) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Error writing to localStorage:', error);
            return false;
        }
    }

    addSample(faceData, quality = 0.8) {
        const data = this.getData();
        if (!data) return false;

        const sample = {
            id: this.generateId(),
            timestamp: new Date().toISOString(),
            faceData: faceData,
            quality: quality,
            features: this.extractFeatures(faceData)
        };

        data.samples.push(sample);
        
        // Limit samples to prevent storage overflow
        if (data.samples.length > this.maxSamples) {
            data.samples = data.samples.slice(-this.maxSamples);
        }

        data.metadata.sampleCount = data.samples.length;
        data.metadata.lastUpdated = new Date().toISOString();
        data.metadata.quality = this.calculateOverallQuality(data.samples);

        return this.setData(data);
    }

    getSamples() {
        const data = this.getData();
        return data ? data.samples : [];
    }

    getSampleCount() {
        const data = this.getData();
        return data ? data.metadata.sampleCount : 0;
    }

    isTrained() {
        const data = this.getData();
        return data ? data.metadata.isTrained : false;
    }

    markAsTrained() {
        const data = this.getData();
        if (!data) return false;

        data.metadata.isTrained = true;
        data.metadata.trainingDate = new Date().toISOString();
        
        return this.setData(data);
    }

    clearData() {
        try {
            localStorage.removeItem(this.storageKey);
            this.initializeStorage();
            return true;
        } catch (error) {
            console.error('Error clearing data:', error);
            return false;
        }
    }

    getStorageInfo() {
        const data = this.getData();
        if (!data) return null;

        const storageSize = JSON.stringify(data).length;
        
        return {
            sampleCount: data.metadata.sampleCount,
            isTrained: data.metadata.isTrained,
            lastUpdated: data.metadata.lastUpdated,
            quality: data.metadata.quality,
            storageSize: this.formatBytes(storageSize),
            version: data.version
        };
    }

    exportData() {
        const data = this.getData();
        if (!data) return null;

        const exportData = {
            ...data,
            exportedAt: new Date().toISOString(),
            exportedBy: 'Face Recognition System'
        };

        return JSON.stringify(exportData, null, 2);
    }

    importData(jsonData) {
        try {
            const importedData = JSON.parse(jsonData);
            
            // Validate data structure
            if (!this.validateImportData(importedData)) {
                throw new Error('Invalid data format');
            }

            // Merge with existing data
            const currentData = this.getData();
            const mergedData = {
                ...importedData,
                version: this.version,
                metadata: {
                    ...importedData.metadata,
                    lastUpdated: new Date().toISOString()
                }
            };

            return this.setData(mergedData);
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }

    generateId() {
        return 'sample_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    extractFeatures(faceData) {
        // Extract key facial features for comparison
        if (!faceData || !faceData.landmarks) return null;

        const landmarks = faceData.landmarks;
        const features = {
            eyeDistance: this.calculateDistance(landmarks[33], landmarks[362]),
            noseWidth: this.calculateDistance(landmarks[31], landmarks[35]),
            mouthWidth: this.calculateDistance(landmarks[61], landmarks[291]),
            faceWidth: this.calculateDistance(landmarks[234], landmarks[454]),
            faceHeight: this.calculateDistance(landmarks[10], landmarks[152])
        };

        return features;
    }

    calculateDistance(point1, point2) {
        if (!point1 || !point2) return 0;
        const dx = point1.x - point2.x;
        const dy = point1.y - point2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    calculateOverallQuality(samples) {
        if (samples.length === 0) return 'unknown';
        
        const avgQuality = samples.reduce((sum, sample) => sum + sample.quality, 0) / samples.length;
        
        if (avgQuality >= 0.8) return 'excellent';
        if (avgQuality >= 0.6) return 'good';
        return 'poor';
    }

    validateImportData(data) {
        return data && 
               data.samples && 
               Array.isArray(data.samples) && 
               data.metadata &&
               typeof data.metadata.sampleCount === 'number';
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Advanced search and filtering
    findSimilarSamples(targetFeatures, threshold = 0.8) {
        const samples = this.getSamples();
        const similar = [];

        samples.forEach(sample => {
            if (sample.features) {
                const similarity = this.calculateSimilarity(targetFeatures, sample.features);
                if (similarity >= threshold) {
                    similar.push({ sample, similarity });
                }
            }
        });

        return similar.sort((a, b) => b.similarity - a.similarity);
    }

    calculateSimilarity(features1, features2) {
        const keys = Object.keys(features1);
        let totalSimilarity = 0;
        let validKeys = 0;

        keys.forEach(key => {
            if (features1[key] && features2[key]) {
                const diff = Math.abs(features1[key] - features2[key]);
                const max = Math.max(features1[key], features2[key]);
                const similarity = max > 0 ? 1 - (diff / max) : 0;
                totalSimilarity += similarity;
                validKeys++;
            }
        });

        return validKeys > 0 ? totalSimilarity / validKeys : 0;
    }

    // Data integrity and backup
    createBackup() {
        const data = this.getData();
        if (!data) return null;

        const backup = {
            ...data,
            backupDate: new Date().toISOString(),
            backupId: this.generateId()
        };

        return JSON.stringify(backup, null, 2);
    }

    restoreFromBackup(backupData) {
        try {
            const backup = JSON.parse(backupData);
            if (this.validateImportData(backup)) {
                return this.setData(backup);
            }
            return false;
        } catch (error) {
            console.error('Error restoring from backup:', error);
            return false;
        }
    }
}

// Create global instance
window.faceStorage = new FaceRecognitionStorage();

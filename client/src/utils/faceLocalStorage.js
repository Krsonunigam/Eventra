/**
 * Simple Face Recognition Local Storage System
 * Stores all face data locally with no server dependencies
 */

class FaceLocalStorage {
  constructor() {
    this.storageKey = 'eventra_face_data';
    this.userKey = 'eventra_user_id';
  }

  // Get current user ID from various sources
  getCurrentUserId() {
    // Try to get from localStorage first
    const storedUserId = localStorage.getItem(this.userKey);
    if (storedUserId) {
      return storedUserId;
    }

    // Try to get from auth context if available
    try {
      const authData = localStorage.getItem('token');
      if (authData) {
        // Extract user ID from token or create a session-based ID
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.setCurrentUserId(sessionId);
        return sessionId;
      }
    } catch (error) {
      console.warn('Could not extract user ID from auth:', error);
    }

    // Create a temporary user ID
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.setCurrentUserId(tempId);
    return tempId;
  }

  // Set current user ID
  setCurrentUserId(userId) {
    localStorage.setItem(this.userKey, userId);
  }

  // Get all face data
  getAllFaceData() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Error reading face data:', error);
      return {};
    }
  }

  // Get face data for current user
  getCurrentUserFaceData() {
    const userId = this.getCurrentUserId();
    const allData = this.getAllFaceData();
    return allData[userId] || null;
  }

  // Save face data for current user
  saveFaceData(faceData) {
    try {
      const userId = this.getCurrentUserId();
      const allData = this.getAllFaceData();
      
      allData[userId] = {
        ...faceData,
        userId: userId,
        lastUpdated: new Date().toISOString(),
        version: '2.0'
      };

      localStorage.setItem(this.storageKey, JSON.stringify(allData));
      console.log('Face data saved for user:', userId);
      return true;
    } catch (error) {
      console.error('Error saving face data:', error);
      return false;
    }
  }

  // Add face sample
  addFaceSample(sample) {
    const currentData = this.getCurrentUserFaceData() || {
      samples: [],
      isTrained: false,
      trainingDate: null,
      sampleCount: 0
    };

    const newSample = {
      id: `sample_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      imageData: sample.imageData,
      quality: sample.quality || 0.8,
      timestamp: new Date().toISOString(),
      metadata: sample.metadata || {}
    };

    currentData.samples.push(newSample);
    currentData.sampleCount = currentData.samples.length;
    currentData.lastUpdated = new Date().toISOString();

    return this.saveFaceData(currentData);
  }

  // Mark as trained
  markAsTrained() {
    const currentData = this.getCurrentUserFaceData() || { samples: [] };
    currentData.isTrained = true;
    currentData.trainingDate = new Date().toISOString();
    currentData.sampleCount = currentData.samples.length;
    currentData.lastUpdated = new Date().toISOString();

    return this.saveFaceData(currentData);
  }

  // Check if user has face data
  hasFaceData() {
    const data = this.getCurrentUserFaceData();
    return data && data.samples && data.samples.length > 0;
  }

  // Check if user is trained
  isTrained() {
    const data = this.getCurrentUserFaceData();
    return data && data.isTrained === true;
  }

  // Get sample count
  getSampleCount() {
    const data = this.getCurrentUserFaceData();
    return data ? data.sampleCount : 0;
  }

  // Get all samples
  getSamples() {
    const data = this.getCurrentUserFaceData();
    return data ? data.samples : [];
  }

  // Clear face data for current user
  clearFaceData() {
    try {
      const userId = this.getCurrentUserId();
      const allData = this.getAllFaceData();
      delete allData[userId];
      localStorage.setItem(this.storageKey, JSON.stringify(allData));
      console.log('Face data cleared for user:', userId);
      return true;
    } catch (error) {
      console.error('Error clearing face data:', error);
      return false;
    }
  }

  // Get storage info
  getStorageInfo() {
    try {
      const data = this.getAllFaceData();
      const userId = this.getCurrentUserId();
      const userData = data[userId];
      
      return {
        hasData: !!userData,
        isTrained: userData?.isTrained || false,
        sampleCount: userData?.sampleCount || 0,
        lastUpdated: userData?.lastUpdated,
        userId: userId,
        totalUsers: Object.keys(data).length
      };
    } catch (error) {
      console.error('Error getting storage info:', error);
      return {
        hasData: false,
        isTrained: false,
        sampleCount: 0,
        lastUpdated: null,
        userId: null,
        totalUsers: 0
      };
    }
  }

  // Export face data
  exportFaceData() {
    const data = this.getCurrentUserFaceData();
    if (!data) return null;

    return {
      ...data,
      exportedAt: new Date().toISOString(),
      version: '2.0'
    };
  }

  // Import face data
  importFaceData(importedData) {
    try {
      if (!importedData || !importedData.samples) {
        throw new Error('Invalid face data format');
      }

      const faceData = {
        samples: importedData.samples,
        isTrained: importedData.isTrained || false,
        trainingDate: importedData.trainingDate,
        sampleCount: importedData.samples.length,
        importedAt: new Date().toISOString(),
        version: '2.0'
      };

      return this.saveFaceData(faceData);
    } catch (error) {
      console.error('Error importing face data:', error);
      return false;
    }
  }
}

// Create singleton instance
const faceLocalStorage = new FaceLocalStorage();

export default faceLocalStorage;

/**
 * Face Recognition API Client
 * Communicates with the pure Node.js face recognition endpoints (no external dependencies)
 */

import api from './axiosConfig';

const FACE_API_BASE_URL = '/api/pure-face';

class FaceRecognitionAPI {
  constructor() {
    this.baseURL = FACE_API_BASE_URL;
  }

  async makeRequest(endpoint, method = 'GET', data = null) {
    try {
      const url = `${this.baseURL}${endpoint}`;
      
      let response;
      switch (method.toUpperCase()) {
        case 'GET':
          response = await api.get(url);
          break;
        case 'POST':
          response = await api.post(url, data);
          break;
        case 'PUT':
          response = await api.put(url, data);
          break;
        case 'DELETE':
          response = await api.delete(url);
          break;
        default:
          throw new Error(`Unsupported HTTP method: ${method}`);
      }

      return response.data;
    } catch (error) {
      console.error('Face Recognition API Error:', error);
      throw error;
    }
  }

  async getFaceStatus(userId) {
    return this.makeRequest('/data');
  }

  async addFaceSample(userId, imageData) {
    return this.makeRequest('/collect', 'POST', {
      faceSamples: Array.isArray(imageData) ? imageData : [imageData]
    });
  }

  async trainFaceModel(userId) {
    return this.makeRequest('/train', 'POST');
  }

  async verifyFace(imageData, userId = null) {
    const data = { faceData: imageData };
    return this.makeRequest('/verify', 'POST', data);
  }

  async clearFaceData(userId) {
    return this.makeRequest('/data', 'DELETE');
  }

  async healthCheck() {
    return this.makeRequest('/health');
  }

  // Helper method to convert canvas to base64
  canvasToBase64(canvas) {
    return canvas.toDataURL('image/jpeg', 0.8);
  }

  // Helper method to capture image from video
  captureImageFromVideo(videoElement) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    
    context.drawImage(videoElement, 0, 0);
    
    return this.canvasToBase64(canvas);
  }
}

const faceRecognitionAPI = new FaceRecognitionAPI();
export default faceRecognitionAPI;

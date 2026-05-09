import axios from 'axios';

import { API_BASE_URL } from '../config/api';

// Configure axios base URL
// const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Only redirect to login if it's not a face recognition related request
      const url = error.config?.url || '';
      const isFaceRelated = url.includes('/api/face') || url.includes('/api/auth/me');
      
      if (!isFaceRelated) {
        // Token expired or invalid
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;


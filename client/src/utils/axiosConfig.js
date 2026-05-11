import axios from 'axios';
import { API_BASE_URL } from '../config/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30s default — face uploads override this per-request
  headers: { 'Content-Type': 'application/json' }
});

// ── Request interceptor: attach JWT token ─────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Give multipart face uploads a much longer timeout
    if (config.headers['Content-Type']?.includes('multipart/form-data')) {
      config.timeout = 120000; // 2 min for face uploads
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: handle auth errors ──────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || '';
      // Don't redirect for face-related endpoints or /me (let callers handle it)
      const skipRedirect = url.includes('/api/face') || url.includes('/api/auth/me');

      if (!skipRedirect) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }

    // Surface a clean error message
    const message =
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred';

    error.userMessage = message;
    return Promise.reject(error);
  }
);

export default api;

const ENV = process.env.NODE_ENV || 'development';

const API_CONFIG = {
  development: {
    BASE_URL: process.env.REACT_APP_API_URL || 
              (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
                ? 'http://localhost:5000'
                : 'https://eventraind.onrender.com'),
  },
  production: {
    BASE_URL: process.env.REACT_APP_API_URL || 'https://eventraind.onrender.com',
  }
};

export const API_BASE_URL = API_CONFIG[ENV].BASE_URL;

export default API_CONFIG;

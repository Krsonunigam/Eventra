const ENV = process.env.NODE_ENV || 'development';

const API_CONFIG = {
  development: {
    BASE_URL: process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000',
  },
  production: {
    BASE_URL: process.env.REACT_APP_API_URL || 'https://eventra-backend-ayvh.onrender.com',
  }
};

export const API_BASE_URL = API_CONFIG[ENV].BASE_URL;

export default API_CONFIG;

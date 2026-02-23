import axios from 'axios';

// Get configuration from environment variables
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT) || 10000;

// Create axios instance with default configuration
const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token to requests
apiClient.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('authToken');

    // Add authorization header if token exists
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log request in development
    if (import.meta.env.DEV) {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, config.data);
    }

    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// Response interceptor - Handle responses and errors
apiClient.interceptors.response.use(
  (response) => {
    // Log response in development
    if (import.meta.env.DEV) {
      console.log(`[API Response] ${response.config.url}`, response.data);
    }

    return response;
  },
  (error) => {
    // Handle different error scenarios
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;

      console.error(`[API Error] ${status}:`, data);

      // Handle 401 Unauthorized - redirect to login
      if (status === 401) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');

        // Only redirect if not already on login page
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }

      // Handle 403 Forbidden
      if (status === 403) {
        console.error('Access denied. Insufficient permissions.');
      }

      // Handle 404 Not Found
      if (status === 404) {
        console.error('Resource not found.');
      }

      // Handle 500 Server Error
      if (status === 500) {
        console.error('Server error. Please try again later.');
      }
    } else if (error.request) {
      // Request was made but no response received
      console.error('[API Error] No response received:', error.request);
    } else {
      // Something else happened
      console.error('[API Error]', error.message);
    }

    return Promise.reject(error);
  }
);

export default apiClient;

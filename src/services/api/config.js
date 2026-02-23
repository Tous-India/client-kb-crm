/**
 * API Configuration
 * Handles environment-based configuration for API calls
 */

// Check if mock data should be used
export const USE_MOCK_DATA = import.meta.env.VITE_ENABLE_MOCK_DATA === 'true';

// API Base URL
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// API Timeout (in milliseconds)
export const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT) || 10000;

// Enable API logging in development
export const ENABLE_LOGGING = import.meta.env.DEV;

// API Configuration object
export const API_CONFIG = {
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  useMockData: USE_MOCK_DATA,
  enableLogging: ENABLE_LOGGING,
};

/**
 * Get configuration value
 * @param {string} key - Configuration key
 * @param {*} defaultValue - Default value if key not found
 * @returns {*} Configuration value
 */
export const getConfig = (key, defaultValue = null) => {
  return API_CONFIG[key] !== undefined ? API_CONFIG[key] : defaultValue;
};

/**
 * Check if currently in development mode
 * @returns {boolean}
 */
export const isDevelopment = () => {
  return import.meta.env.DEV;
};

/**
 * Check if currently in production mode
 * @returns {boolean}
 */
export const isProduction = () => {
  return import.meta.env.PROD;
};

/**
 * Log API call details (only in development)
 * @param {string} method - HTTP method
 * @param {string} endpoint - API endpoint
 * @param {*} data - Request data
 */
export const logApiCall = (method, endpoint, data = null) => {
  if (ENABLE_LOGGING) {
    console.log(`[API ${method.toUpperCase()}] ${endpoint}`, data || '');
  }
};

export default API_CONFIG;

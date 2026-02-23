import apiClient from './api/client';
import { ENDPOINTS } from './api/endpoints';
import { USE_MOCK_DATA } from './api/config';

/**
 * Auth Service
 * Handles all authentication related API calls
 */

const authService = {
  /**
   * Login user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  login: async (email, password) => {
    try {
      // Use mock data if enabled
      if (USE_MOCK_DATA) {
        // Simulate login for development
        if (email && password) {
          const mockUser = {
            _id: 'mock_user_001',
            user_id: 'ADM-00001',
            name: 'Test Admin',
            email: email,
            role: 'SUPER_ADMIN',
            permissions: ['manage_suppliers', 'manage_allocations', 'manage_users'],
            is_active: true,
          };
          const mockToken = 'mock_jwt_token_' + Date.now();

          // Store in localStorage
          localStorage.setItem('authToken', mockToken);
          localStorage.setItem('user', JSON.stringify(mockUser));

          return {
            success: true,
            data: {
              user: mockUser,
              token: mockToken,
            },
          };
        }
        return {
          success: false,
          error: 'Invalid credentials',
          data: null,
        };
      }

      const response = await apiClient.post(ENDPOINTS.AUTH.LOGIN, { email, password });

      // Store token and user in localStorage
      if (response.data.data?.token) {
        localStorage.setItem('authToken', response.data.data.token);
      }
      if (response.data.data?.user) {
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
      }

      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('[Auth Service] Login error:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Login failed',
        data: null,
      };
    }
  },

  /**
   * Register new user
   * @param {Object} userData - User registration data
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  register: async (userData) => {
    try {
      // Use mock data if enabled
      if (USE_MOCK_DATA) {
        return {
          success: true,
          data: {
            user: {
              _id: 'mock_' + Date.now(),
              ...userData,
            },
          },
        };
      }

      const response = await apiClient.post(ENDPOINTS.AUTH.REGISTER, userData);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('[Auth Service] Register error:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Registration failed',
        data: null,
      };
    }
  },

  /**
   * Get current user
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  getCurrentUser: async () => {
    try {
      // Use mock data if enabled
      if (USE_MOCK_DATA) {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          return {
            success: true,
            data: { user: JSON.parse(storedUser) },
          };
        }
        return {
          success: false,
          error: 'Not authenticated',
          data: null,
        };
      }

      const response = await apiClient.get(ENDPOINTS.AUTH.ME);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('[Auth Service] Get current user error:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to get user',
        data: null,
      };
    }
  },

  /**
   * Logout user
   * @returns {Promise<{success: boolean, error: string}>}
   */
  logout: async () => {
    try {
      // Clear local storage
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');

      // Use mock data if enabled
      if (USE_MOCK_DATA) {
        return { success: true };
      }

      await apiClient.post(ENDPOINTS.AUTH.LOGOUT);
      return { success: true };
    } catch (error) {
      console.error('[Auth Service] Logout error:', error);
      // Still consider logout successful since we cleared local storage
      return { success: true };
    }
  },

  /**
   * Check if user is authenticated
   * @returns {boolean}
   */
  isAuthenticated: () => {
    return !!localStorage.getItem('authToken');
  },

  /**
   * Get stored token
   * @returns {string|null}
   */
  getToken: () => {
    return localStorage.getItem('authToken');
  },

  /**
   * Get stored user
   * @returns {Object|null}
   */
  getUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  /**
   * Check if user has permission
   * @param {string} permission - Permission to check
   * @returns {boolean}
   */
  hasPermission: (permission) => {
    const user = authService.getUser();
    if (!user) return false;

    // Super admin has all permissions
    if (user.role === 'SUPER_ADMIN') return true;

    // Check if permission exists in user's permissions array
    return user.permissions?.includes(permission) || false;
  },
};

export default authService;

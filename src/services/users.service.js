import apiClient from './api/client';
import { ENDPOINTS } from './api/endpoints';

/**
 * Users Service
 * Handles user-related API operations
 */

const usersService = {
  /**
   * Get all users
   * No pagination - max ~150 users (100 buyers + 50 admins)
   * @param {Object} params - Query parameters (role, is_active, search)
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  getAll: async (params = {}) => {
    try {
      const response = await apiClient.get(ENDPOINTS.USERS.LIST, { params });
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('[Users Service] Error fetching all:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch users',
        data: { users: [] },
      };
    }
  },

  /**
   * Get users by role (e.g., BUYER)
   * @param {string} role - User role
   * @returns {Promise<{success: boolean, data: Array, error: string}>}
   */
  getByRole: async (role) => {
    try {
      // Use dedicated buyers endpoint for BUYER role
      const endpoint = role === 'BUYER'
        ? `${ENDPOINTS.USERS.LIST}/buyers`
        : ENDPOINTS.USERS.GET_BY_ROLE(role);
      const response = await apiClient.get(endpoint);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('[Users Service] Error fetching by role:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch users',
        data: [],
      };
    }
  },

  /**
   * Get all buyers
   * @returns {Promise<{success: boolean, data: Array, error: string}>}
   */
  getBuyers: async () => {
    try {
      const response = await apiClient.get(`${ENDPOINTS.USERS.LIST}/buyers`);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('[Users Service] Error fetching buyers:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch buyers',
        data: [],
      };
    }
  },

  /**
   * Get user by ID
   * @param {string} id - User ID
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  getById: async (id) => {
    try {
      const response = await apiClient.get(ENDPOINTS.USERS.GET(id));
      return {
        success: true,
        data: response.data.data?.user || response.data.data,
      };
    } catch (error) {
      console.error('[Users Service] Error fetching by ID:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch user',
        data: null,
      };
    }
  },

  /**
   * Create a new user
   * @param {Object} userData - User data
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  create: async (userData) => {
    try {
      const response = await apiClient.post(ENDPOINTS.USERS.CREATE, userData);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('[Users Service] Error creating:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to create user',
        data: null,
      };
    }
  },

  /**
   * Update a user
   * @param {string} id - User ID
   * @param {Object} userData - Updated user data
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  update: async (id, userData) => {
    try {
      const response = await apiClient.put(ENDPOINTS.USERS.UPDATE(id), userData);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('[Users Service] Error updating:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to update user',
        data: null,
      };
    }
  },

  /**
   * Delete a user (soft delete - deactivate)
   * @param {string} id - User ID
   * @returns {Promise<{success: boolean, error: string}>}
   */
  delete: async (id) => {
    try {
      await apiClient.delete(ENDPOINTS.USERS.DELETE(id));
      return {
        success: true,
      };
    } catch (error) {
      console.error('[Users Service] Error deleting:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to delete user',
      };
    }
  },

  /**
   * Activate a user
   * @param {string} id - User ID
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  activate: async (id) => {
    try {
      const response = await apiClient.put(ENDPOINTS.USERS.ACTIVATE(id));
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('[Users Service] Error activating:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to activate user',
        data: null,
      };
    }
  },

  /**
   * Deactivate a user
   * @param {string} id - User ID
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  deactivate: async (id) => {
    try {
      const response = await apiClient.put(ENDPOINTS.USERS.DEACTIVATE(id));
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('[Users Service] Error deactivating:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to deactivate user',
        data: null,
      };
    }
  },
};

export default usersService;

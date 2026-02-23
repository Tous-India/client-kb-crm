import apiClient from './api/client';
import { ENDPOINTS } from './api/endpoints';
import { USE_MOCK_DATA } from './api/config';

// Import mock data for fallback
import brandsData from '../mock/brands.json';

/**
 * Brands Service
 * Handles all brand related API calls
 */

const brandsService = {
  /**
   * Get all brands
   * @param {Object} params - Query parameters
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  getAll: async (params = {}) => {
    try {
      if (USE_MOCK_DATA) {
        let brands = brandsData.brands || [];

        // Filter by is_active if not explicitly requesting all
        if (params.all !== 'true') {
          brands = brands.filter(b => b.is_active !== false);
        }

        return {
          success: true,
          data: { brands },
        };
      }

      const response = await apiClient.get(ENDPOINTS.BRANDS.LIST, { params });
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('[Brands Service] Error fetching all:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch brands',
        data: { brands: [] },
      };
    }
  },

  /**
   * Get brand by ID
   * @param {string} id - Brand ID
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  getById: async (id) => {
    try {
      if (USE_MOCK_DATA) {
        const brand = brandsData.brands?.find(
          b => b.brand_id === id || b._id === id
        );
        if (!brand) {
          return {
            success: false,
            error: 'Brand not found',
            data: null,
          };
        }
        return {
          success: true,
          data: { brand },
        };
      }

      const response = await apiClient.get(ENDPOINTS.BRANDS.GET(id));
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('[Brands Service] Error fetching by ID:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch brand',
        data: null,
      };
    }
  },

  /**
   * Create a new brand
   * @param {Object|FormData} brandData - Brand data (use FormData for file upload)
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  create: async (brandData) => {
    try {
      if (USE_MOCK_DATA) {
        const newBrand = {
          _id: `mock_${Date.now()}`,
          brand_id: `BRD-${String(brandsData.brands.length + 1).padStart(3, '0')}`,
          ...brandData,
          is_active: true,
          createdAt: new Date().toISOString(),
        };
        return {
          success: true,
          data: { brand: newBrand },
        };
      }

      // Check if it's FormData (for file upload)
      const isFormData = brandData instanceof FormData;
      const config = isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};

      const response = await apiClient.post(ENDPOINTS.BRANDS.CREATE, brandData, config);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('[Brands Service] Error creating:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to create brand',
        data: null,
      };
    }
  },

  /**
   * Update brand
   * @param {string} id - Brand ID
   * @param {Object|FormData} brandData - Updated brand data
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  update: async (id, brandData) => {
    try {
      if (USE_MOCK_DATA) {
        return {
          success: true,
          data: {
            brand: {
              brand_id: id,
              ...brandData,
              updatedAt: new Date().toISOString(),
            }
          },
        };
      }

      const isFormData = brandData instanceof FormData;
      const config = isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};

      const response = await apiClient.put(ENDPOINTS.BRANDS.UPDATE(id), brandData, config);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('[Brands Service] Error updating:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to update brand',
        data: null,
      };
    }
  },

  /**
   * Delete brand (soft delete)
   * @param {string} id - Brand ID
   * @returns {Promise<{success: boolean, error: string}>}
   */
  delete: async (id) => {
    try {
      if (USE_MOCK_DATA) {
        return { success: true };
      }

      await apiClient.delete(ENDPOINTS.BRANDS.DELETE(id));
      return { success: true };
    } catch (error) {
      console.error('[Brands Service] Error deleting:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to delete brand',
      };
    }
  },
};

export default brandsService;

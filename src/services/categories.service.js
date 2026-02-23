import apiClient from './api/client';
import { ENDPOINTS } from './api/endpoints';
import { USE_MOCK_DATA } from './api/config';

// Import mock data for fallback
import categoriesData from '../mock/categories.json';

/**
 * Categories Service
 * Handles all category related API calls
 */

const categoriesService = {
  /**
   * Get all categories
   * @param {Object} params - Query parameters
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  getAll: async (params = {}) => {
    try {
      if (USE_MOCK_DATA) {
        let categories = categoriesData.categories || [];

        // Filter by is_active if specified
        if (params.all !== 'true') {
          categories = categories.filter(c => c.is_active !== false);
        }

        return {
          success: true,
          data: { categories },
        };
      }

      const response = await apiClient.get(ENDPOINTS.CATEGORIES.LIST, { params });
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('[Categories Service] Error fetching all:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch categories',
        data: { categories: [] },
      };
    }
  },

  /**
   * Get category by ID
   * @param {string} id - Category ID
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  getById: async (id) => {
    try {
      if (USE_MOCK_DATA) {
        const category = categoriesData.categories?.find(
          c => c.category_id === id || c._id === id
        );
        if (!category) {
          return {
            success: false,
            error: 'Category not found',
            data: null,
          };
        }
        return {
          success: true,
          data: { category },
        };
      }

      const response = await apiClient.get(ENDPOINTS.CATEGORIES.GET(id));
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('[Categories Service] Error fetching by ID:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch category',
        data: null,
      };
    }
  },

  /**
   * Create a new category
   * @param {Object|FormData} categoryData - Category data (use FormData for file upload)
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  create: async (categoryData) => {
    try {
      if (USE_MOCK_DATA) {
        const newCategory = {
          _id: `mock_${Date.now()}`,
          category_id: `CAT-${String(categoriesData.categories.length + 1).padStart(3, '0')}`,
          ...categoryData,
          is_active: true,
          createdAt: new Date().toISOString(),
        };
        return {
          success: true,
          data: { category: newCategory },
        };
      }

      // Check if it's FormData (for file upload)
      const isFormData = categoryData instanceof FormData;
      const config = isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};

      const response = await apiClient.post(ENDPOINTS.CATEGORIES.CREATE, categoryData, config);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('[Categories Service] Error creating:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to create category',
        data: null,
      };
    }
  },

  /**
   * Update category
   * @param {string} id - Category ID
   * @param {Object|FormData} categoryData - Updated category data
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  update: async (id, categoryData) => {
    try {
      if (USE_MOCK_DATA) {
        return {
          success: true,
          data: {
            category: {
              category_id: id,
              ...categoryData,
              updatedAt: new Date().toISOString(),
            }
          },
        };
      }

      const isFormData = categoryData instanceof FormData;
      const config = isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};

      const response = await apiClient.put(ENDPOINTS.CATEGORIES.UPDATE(id), categoryData, config);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('[Categories Service] Error updating:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to update category',
        data: null,
      };
    }
  },

  /**
   * Delete category (soft delete)
   * @param {string} id - Category ID
   * @returns {Promise<{success: boolean, error: string}>}
   */
  delete: async (id) => {
    try {
      if (USE_MOCK_DATA) {
        return { success: true };
      }

      await apiClient.delete(ENDPOINTS.CATEGORIES.DELETE(id));
      return { success: true };
    } catch (error) {
      console.error('[Categories Service] Error deleting:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to delete category',
      };
    }
  },

  /**
   * Add sub-category
   * @param {string} categoryId - Parent category ID
   * @param {Object} subCategoryData - Sub-category data
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  addSubCategory: async (categoryId, subCategoryData) => {
    try {
      if (USE_MOCK_DATA) {
        return {
          success: true,
          data: { category: { category_id: categoryId, sub_categories: [subCategoryData] } },
        };
      }

      const response = await apiClient.post(
        `${ENDPOINTS.CATEGORIES.GET(categoryId)}/subcategories`,
        subCategoryData
      );
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('[Categories Service] Error adding sub-category:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to add sub-category',
        data: null,
      };
    }
  },

  /**
   * Update sub-category
   * @param {string} categoryId - Parent category ID
   * @param {string} subCategoryId - Sub-category ID
   * @param {Object} subCategoryData - Updated sub-category data
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  updateSubCategory: async (categoryId, subCategoryId, subCategoryData) => {
    try {
      if (USE_MOCK_DATA) {
        return {
          success: true,
          data: { category: { category_id: categoryId } },
        };
      }

      const response = await apiClient.put(
        `${ENDPOINTS.CATEGORIES.GET(categoryId)}/subcategories/${subCategoryId}`,
        subCategoryData
      );
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('[Categories Service] Error updating sub-category:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to update sub-category',
        data: null,
      };
    }
  },

  /**
   * Delete sub-category
   * @param {string} categoryId - Parent category ID
   * @param {string} subCategoryId - Sub-category ID
   * @returns {Promise<{success: boolean, error: string}>}
   */
  deleteSubCategory: async (categoryId, subCategoryId) => {
    try {
      if (USE_MOCK_DATA) {
        return { success: true };
      }

      await apiClient.delete(
        `${ENDPOINTS.CATEGORIES.GET(categoryId)}/subcategories/${subCategoryId}`
      );
      return { success: true };
    } catch (error) {
      console.error('[Categories Service] Error deleting sub-category:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to delete sub-category',
      };
    }
  },
};

export default categoriesService;

import apiClient from './api/client';
import { ENDPOINTS } from './api/endpoints';
import { USE_MOCK_DATA } from './api/config';

// Import mock data for fallback
import productsData from '../mock/products.json';

/**
 * Products Service
 * Handles all product related API calls
 */

const productsService = {
  /**
   * Get all products
   * @param {Object} params - Query parameters (category, brand, search, etc.)
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  getAll: async (params = {}) => {
    try {
      const response = await apiClient.get(ENDPOINTS.PRODUCTS.LIST, { params });
      const products = Array.isArray(response.data.data) ? response.data.data : [];
      return {
        success: true,
        data: { products, pagination: response.data.pagination },
      };
    } catch (error) {
      console.error('[Products Service] Error fetching all:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch products',
        data: { products: [] },
      };
    }
  },

  /**
   * Get product by ID
   * @param {string} id - Product ID
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  getById: async (id) => {
    try {
      if (USE_MOCK_DATA) {
        const product = productsData.products?.find(
          p => p.product_id === id || p._id === id
        );
        if (!product) {
          return {
            success: false,
            error: 'Product not found',
            data: null,
          };
        }
        return {
          success: true,
          data: { product },
        };
      }

      const response = await apiClient.get(ENDPOINTS.PRODUCTS.GET(id));
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('[Products Service] Error fetching by ID:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch product',
        data: null,
      };
    }
  },

  /**
   * Search products
   * @param {string} query - Search query
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  search: async (query) => {
    try {
      if (USE_MOCK_DATA) {
        const queryLower = query.toLowerCase();
        const products = (productsData.products || []).filter(p =>
          p.product_name?.toLowerCase().includes(queryLower) ||
          p.part_number?.toLowerCase().includes(queryLower) ||
          p.description?.toLowerCase().includes(queryLower)
        );
        return {
          success: true,
          data: { products },
        };
      }

      const response = await apiClient.get(ENDPOINTS.PRODUCTS.SEARCH, { params: { q: query } });
      // API returns data as array directly, wrap it for consistency
      const products = Array.isArray(response.data.data) ? response.data.data : [];
      return {
        success: true,
        data: { products, pagination: response.data.pagination },
      };
    } catch (error) {
      console.error('[Products Service] Error searching:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to search products',
        data: { products: [] },
      };
    }
  },

  /**
   * Create a new product
   * @param {Object|FormData} productData - Product data
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  create: async (productData) => {
    try {
      if (USE_MOCK_DATA) {
        const newProduct = {
          _id: `mock_${Date.now()}`,
          product_id: `PROD-${String(productsData.products.length + 1).padStart(5, '0')}`,
          ...productData,
          createdAt: new Date().toISOString(),
        };
        return {
          success: true,
          data: { product: newProduct },
        };
      }

      const isFormData = productData instanceof FormData;
      const config = isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};

      const response = await apiClient.post(ENDPOINTS.PRODUCTS.CREATE, productData, config);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('[Products Service] Error creating:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to create product',
        data: null,
      };
    }
  },

  /**
   * Update product
   * @param {string} id - Product ID
   * @param {Object|FormData} productData - Updated product data
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  update: async (id, productData) => {
    try {
      if (USE_MOCK_DATA) {
        return {
          success: true,
          data: {
            product: {
              product_id: id,
              ...productData,
              updatedAt: new Date().toISOString(),
            }
          },
        };
      }

      const isFormData = productData instanceof FormData;
      const config = isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};

      const response = await apiClient.put(ENDPOINTS.PRODUCTS.UPDATE(id), productData, config);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('[Products Service] Error updating:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to update product',
        data: null,
      };
    }
  },

  /**
   * Delete product
   * @param {string} id - Product ID
   * @returns {Promise<{success: boolean, error: string}>}
   */
  delete: async (id) => {
    try {
      if (USE_MOCK_DATA) {
        return { success: true };
      }

      await apiClient.delete(ENDPOINTS.PRODUCTS.DELETE(id));
      return { success: true };
    } catch (error) {
      console.error('[Products Service] Error deleting:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to delete product',
      };
    }
  },

  /**
   * Update product inventory
   * @param {string} id - Product ID
   * @param {Object} inventoryData - Inventory update data
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  updateInventory: async (id, inventoryData) => {
    try {
      if (USE_MOCK_DATA) {
        return {
          success: true,
          data: { product: { product_id: id, ...inventoryData } },
        };
      }

      const response = await apiClient.put(`${ENDPOINTS.PRODUCTS.GET(id)}/inventory`, inventoryData);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('[Products Service] Error updating inventory:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to update inventory',
        data: null,
      };
    }
  },

  /**
   * Upload product images (adds to additional_images)
   * @param {string} id - Product ID
   * @param {FormData} formData - Form data with images
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  uploadImages: async (id, formData) => {
    try {
      if (USE_MOCK_DATA) {
        return {
          success: true,
          data: { product: { product_id: id } },
        };
      }

      const response = await apiClient.post(
        `${ENDPOINTS.PRODUCTS.GET(id)}/images`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('[Products Service] Error uploading images:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to upload images',
        data: null,
      };
    }
  },

  /**
   * Update main product image (replaces existing main image)
   * @param {string} id - Product ID
   * @param {FormData} formData - Form data with single image
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  updateMainImage: async (id, formData) => {
    try {
      if (USE_MOCK_DATA) {
        return {
          success: true,
          data: { product: { product_id: id } },
        };
      }

      const response = await apiClient.put(
        `${ENDPOINTS.PRODUCTS.GET(id)}/main-image`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('[Products Service] Error updating main image:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to update main image',
        data: null,
      };
    }
  },
};

export default productsService;

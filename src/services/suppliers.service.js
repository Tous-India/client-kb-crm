import apiClient from './api/client';
import { ENDPOINTS } from './api/endpoints';
import { USE_MOCK_DATA } from './api/config';

// Import mock data for fallback
import suppliersData from '../mock/suppliers.json';

/**
 * Suppliers Service
 * Handles all supplier related API calls
 */

const suppliersService = {
  /**
   * Get all suppliers
   * @param {Object} params - Query parameters (filters, pagination, etc.)
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  /**
   * Get all suppliers
   * No pagination - max 100 suppliers (fixed business limit)
   * @param {Object} params - Query parameters (filters)
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  getAll: async (params = {}) => {
    try {
      // Use mock data if enabled
      if (USE_MOCK_DATA) {
        let suppliers = suppliersData.suppliers || [];

        // Apply filters
        if (params.status) {
          suppliers = suppliers.filter(s => s.status === params.status);
        }
        if (params.supplier_type) {
          suppliers = suppliers.filter(s => s.supplier_type === params.supplier_type);
        }
        if (params.search) {
          const searchLower = params.search.toLowerCase();
          suppliers = suppliers.filter(s =>
            s.supplier_name.toLowerCase().includes(searchLower) ||
            s.supplier_code.toLowerCase().includes(searchLower)
          );
        }

        return {
          success: true,
          data: { suppliers },
        };
      }

      const response = await apiClient.get(ENDPOINTS.SUPPLIERS.LIST, { params });
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('[Suppliers Service] Error fetching all:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch suppliers',
        data: { suppliers: [] },
      };
    }
  },

  /**
   * Get supplier by ID
   * @param {string} id - Supplier ID (MongoDB _id or supplier_id like "SUP-00001")
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  getById: async (id) => {
    try {
      // Use mock data if enabled
      if (USE_MOCK_DATA) {
        const supplier = suppliersData.suppliers?.find(
          s => s.supplier_id === id || s._id === id
        );
        if (!supplier) {
          return {
            success: false,
            error: 'Supplier not found',
            data: null,
          };
        }
        return {
          success: true,
          data: { supplier },
        };
      }

      const response = await apiClient.get(ENDPOINTS.SUPPLIERS.GET(id));
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('[Suppliers Service] Error fetching by ID:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch supplier',
        data: null,
      };
    }
  },

  /**
   * Create a new supplier
   * @param {Object} supplierData - Supplier data
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  create: async (supplierData) => {
    try {
      // Use mock data if enabled
      if (USE_MOCK_DATA) {
        const newSupplier = {
          _id: `mock_${Date.now()}`,
          supplier_id: `SUP-${String(suppliersData.suppliers.length + 1).padStart(5, '0')}`,
          ...supplierData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        return {
          success: true,
          data: { supplier: newSupplier },
        };
      }

      const response = await apiClient.post(ENDPOINTS.SUPPLIERS.CREATE, supplierData);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('[Suppliers Service] Error creating:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to create supplier',
        data: null,
      };
    }
  },

  /**
   * Update supplier
   * @param {string} id - Supplier ID
   * @param {Object} supplierData - Updated supplier data
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  update: async (id, supplierData) => {
    try {
      // Use mock data if enabled
      if (USE_MOCK_DATA) {
        return {
          success: true,
          data: {
            supplier: {
              supplier_id: id,
              ...supplierData,
              updatedAt: new Date().toISOString(),
            }
          },
        };
      }

      const response = await apiClient.put(ENDPOINTS.SUPPLIERS.UPDATE(id), supplierData);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('[Suppliers Service] Error updating:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to update supplier',
        data: null,
      };
    }
  },

  /**
   * Delete supplier
   * @param {string} id - Supplier ID
   * @returns {Promise<{success: boolean, error: string}>}
   */
  delete: async (id) => {
    try {
      // Use mock data if enabled
      if (USE_MOCK_DATA) {
        return { success: true };
      }

      await apiClient.delete(ENDPOINTS.SUPPLIERS.DELETE(id));
      return { success: true };
    } catch (error) {
      console.error('[Suppliers Service] Error deleting:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to delete supplier',
      };
    }
  },

  /**
   * Update supplier status
   * @param {string} id - Supplier ID
   * @param {string} status - New status (ACTIVE, INACTIVE, BLOCKED)
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  updateStatus: async (id, status) => {
    try {
      // Use mock data if enabled
      if (USE_MOCK_DATA) {
        return {
          success: true,
          data: { supplier: { supplier_id: id, status } },
        };
      }

      const response = await apiClient.patch(ENDPOINTS.SUPPLIERS.UPDATE_STATUS(id), { status });
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('[Suppliers Service] Error updating status:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to update supplier status',
        data: null,
      };
    }
  },

  /**
   * Get supplier statistics
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  getStats: async () => {
    try {
      // Use mock data if enabled
      if (USE_MOCK_DATA) {
        const suppliers = suppliersData.suppliers || [];
        return {
          success: true,
          data: {
            stats: {
              total: suppliers.length,
              active: suppliers.filter(s => s.status === 'ACTIVE').length,
              inactive: suppliers.filter(s => s.status === 'INACTIVE').length,
              blocked: suppliers.filter(s => s.status === 'BLOCKED').length,
            }
          },
        };
      }

      const response = await apiClient.get(ENDPOINTS.SUPPLIERS.STATS);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('[Suppliers Service] Error fetching stats:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch supplier stats',
        data: null,
      };
    }
  },

  /**
   * Search suppliers
   * @param {string} query - Search query
   * @returns {Promise<{success: boolean, data: Array, error: string}>}
   */
  search: async (query) => {
    try {
      // Use mock data if enabled
      if (USE_MOCK_DATA) {
        const searchLower = query.toLowerCase();
        const results = (suppliersData.suppliers || []).filter(s =>
          s.supplier_name.toLowerCase().includes(searchLower) ||
          s.supplier_code.toLowerCase().includes(searchLower) ||
          s.contact?.email?.toLowerCase().includes(searchLower)
        );
        return {
          success: true,
          data: { suppliers: results },
        };
      }

      const response = await apiClient.get(ENDPOINTS.SUPPLIERS.SEARCH, { params: { q: query } });
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('[Suppliers Service] Error searching:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to search suppliers',
        data: { suppliers: [] },
      };
    }
  },
};

export default suppliersService;

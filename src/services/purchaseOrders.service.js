import apiClient from './api/client';
import { ENDPOINTS } from './api/endpoints';
import { USE_MOCK_DATA } from './api/config';

// Import mock data for fallback
import purchaseOrdersData from '../mock/purchaseOrders.json';

/**
 * Purchase Orders Service
 * Handles all purchase order related API calls
 */

const purchaseOrdersService = {
  /**
   * Get all purchase orders
   * @param {Object} params - Query parameters (filters, pagination, etc.)
   * @returns {Promise<{success: boolean, data: Array, error: string}>}
   */
  getAll: async (params = {}) => {
    try {
      // Use mock data if enabled
      if (USE_MOCK_DATA) {
        return {
          success: true,
          data: purchaseOrdersData.purchaseOrders || [],
        };
      }

      const response = await apiClient.get(ENDPOINTS.PURCHASE_ORDERS.LIST, { params });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('[PurchaseOrders Service] Error fetching all:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch purchase orders',
        data: [],
      };
    }
  },

  /**
   * Get purchase order by ID
   * @param {string} id - Purchase order ID
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  getById: async (id) => {
    try {
      // Use mock data if enabled
      if (USE_MOCK_DATA) {
        const po = purchaseOrdersData.purchaseOrders?.find(p => p.po_id === id);
        if (!po) {
          return {
            success: false,
            error: 'Purchase order not found',
            data: null,
          };
        }
        return {
          success: true,
          data: po,
        };
      }

      const response = await apiClient.get(ENDPOINTS.PURCHASE_ORDERS.GET(id));
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('[PurchaseOrders Service] Error fetching by ID:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch purchase order',
        data: null,
      };
    }
  },

  /**
   * Get purchase orders by status
   * @param {string} status - Status to filter by (PENDING, CONVERTED)
   * @returns {Promise<{success: boolean, data: Array, error: string}>}
   */
  getByStatus: async (status) => {
    try {
      // Use mock data if enabled
      if (USE_MOCK_DATA) {
        const filtered = purchaseOrdersData.purchaseOrders?.filter(p => p.status === status) || [];
        return {
          success: true,
          data: filtered,
        };
      }

      const response = await apiClient.get(ENDPOINTS.PURCHASE_ORDERS.GET_BY_STATUS(status));
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('[PurchaseOrders Service] Error fetching by status:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch purchase orders',
        data: [],
      };
    }
  },

  /**
   * Convert purchase order to quotation
   * @param {string} poId - Purchase order ID
   * @param {Object} quoteData - Quotation data
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  convertToQuote: async (poId, quoteData) => {
    try {
      // Use mock data if enabled (simulate API call)
      if (USE_MOCK_DATA) {
        // In mock mode, we'll just return success
        // The component will handle updating its state
        return {
          success: true,
          data: {
            quote_id: `QUO-2024-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
            quote_number: `Q24${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
            ...quoteData,
          },
        };
      }

      const response = await apiClient.post(
        ENDPOINTS.PURCHASE_ORDERS.CONVERT_TO_QUOTE(poId),
        quoteData
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('[PurchaseOrders Service] Error converting to quote:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to convert purchase order to quote',
        data: null,
      };
    }
  },

  /**
   * Create a new purchase order
   * @param {Object} poData - Purchase order data
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  create: async (poData) => {
    try {
      // Use mock data if enabled (simulate API call)
      if (USE_MOCK_DATA) {
        return {
          success: true,
          data: {
            po_id: `PO-2024-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
            po_number: `P24${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
            ...poData,
            po_date: new Date().toISOString(),
            status: 'PENDING',
          },
        };
      }

      const response = await apiClient.post(ENDPOINTS.PURCHASE_ORDERS.CREATE, poData);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('[PurchaseOrders Service] Error creating:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to create purchase order',
        data: null,
      };
    }
  },

  /**
   * Update purchase order
   * @param {string} id - Purchase order ID
   * @param {Object} poData - Updated purchase order data
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  update: async (id, poData) => {
    try {
      // Use mock data if enabled (simulate API call)
      if (USE_MOCK_DATA) {
        return {
          success: true,
          data: {
            po_id: id,
            ...poData,
          },
        };
      }

      const response = await apiClient.put(ENDPOINTS.PURCHASE_ORDERS.UPDATE(id), poData);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('[PurchaseOrders Service] Error updating:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to update purchase order',
        data: null,
      };
    }
  },

  /**
   * Delete purchase order
   * @param {string} id - Purchase order ID
   * @returns {Promise<{success: boolean, error: string}>}
   */
  delete: async (id) => {
    try {
      // Use mock data if enabled (simulate API call)
      if (USE_MOCK_DATA) {
        return {
          success: true,
        };
      }

      await apiClient.delete(ENDPOINTS.PURCHASE_ORDERS.DELETE(id));
      return {
        success: true,
      };
    } catch (error) {
      console.error('[PurchaseOrders Service] Error deleting:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to delete purchase order',
      };
    }
  },
};

export default purchaseOrdersService;

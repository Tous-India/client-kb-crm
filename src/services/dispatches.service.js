import apiClient from './api/client';
import { ENDPOINTS } from './api/endpoints';

/**
 * Dispatches Service
 * Handles all dispatch-related API calls for PI and Order dispatches
 */

const dispatchesService = {
  /**
   * Get buyer's own dispatches (shipments)
   * @param {Object} params - Query parameters (status, pagination)
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  getMyDispatches: async (params = {}) => {
    try {
      console.log('[Dispatches Service] Fetching my dispatches...');
      const response = await apiClient.get(ENDPOINTS.DISPATCHES.MY, { params });
      console.log('[Dispatches Service] My dispatches response:', response.data);
      return {
        success: true,
        data: response.data.data,
        pagination: response.data.pagination,
      };
    } catch (error) {
      console.error('[Dispatches Service] Error fetching my dispatches:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch dispatches',
        data: [],
      };
    }
  },

  /**
   * Get all dispatches
   * @param {Object} params - Query parameters (filters, pagination)
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  getAll: async (params = {}) => {
    try {
      console.log('[Dispatches Service] Fetching all dispatches...');
      const response = await apiClient.get(ENDPOINTS.DISPATCHES.LIST, { params });
      console.log('[Dispatches Service] Response:', response.data);
      // API returns: { status, message, data: [...dispatches], pagination }
      return {
        success: true,
        data: response.data.data, // This is the dispatches array
        pagination: response.data.pagination,
      };
    } catch (error) {
      console.error('[Dispatches Service] Error fetching all:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch dispatches',
        data: [],
      };
    }
  },

  /**
   * Get dispatch by ID
   * @param {string} id - Dispatch ID
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  getById: async (id) => {
    try {
      const response = await apiClient.get(ENDPOINTS.DISPATCHES.GET(id));
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('[Dispatches Service] Error fetching by ID:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch dispatch',
        data: null,
      };
    }
  },

  /**
   * Get dispatches by source (PI or Order)
   * @param {string} sourceType - 'PROFORMA_INVOICE' or 'ORDER'
   * @param {string} sourceId - The source document ID
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  getBySource: async (sourceType, sourceId) => {
    try {
      const response = await apiClient.get(ENDPOINTS.DISPATCHES.BY_SOURCE(sourceType, sourceId));
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('[Dispatches Service] Error fetching by source:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch dispatches for source',
        data: { dispatches: [] },
      };
    }
  },

  /**
   * Get dispatch summary for a source
   * @param {string} sourceType - 'PROFORMA_INVOICE' or 'ORDER'
   * @param {string} sourceId - The source document ID
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  getSummary: async (sourceType, sourceId) => {
    try {
      const response = await apiClient.get(ENDPOINTS.DISPATCHES.SUMMARY(sourceType, sourceId));
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('[Dispatches Service] Error fetching summary:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch dispatch summary',
        data: null,
      };
    }
  },

  /**
   * Create a new dispatch
   * @param {Object} dispatchData - Dispatch data
   * @param {string} dispatchData.source_type - 'PROFORMA_INVOICE' or 'ORDER'
   * @param {string} dispatchData.source_id - Source document ID
   * @param {Array} dispatchData.items - Items to dispatch
   * @param {Object} dispatchData.shipping_info - Shipping details
   * @param {string} dispatchData.dispatch_type - STANDARD, PROJECT, CREDIT, etc.
   * @param {boolean} dispatchData.generate_invoice - Whether to generate invoice
   * @param {string} dispatchData.invoice_number - Invoice number if generating
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  create: async (dispatchData) => {
    try {
      const response = await apiClient.post(ENDPOINTS.DISPATCHES.CREATE, dispatchData);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('[Dispatches Service] Error creating dispatch:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to create dispatch',
        data: null,
      };
    }
  },

  /**
   * Delete a dispatch
   * @param {string} id - Dispatch ID
   * @returns {Promise<{success: boolean, error: string}>}
   */
  delete: async (id) => {
    try {
      await apiClient.delete(ENDPOINTS.DISPATCHES.DELETE(id));
      return { success: true };
    } catch (error) {
      console.error('[Dispatches Service] Error deleting dispatch:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to delete dispatch',
      };
    }
  },

  /**
   * Dispatch items from a Proforma Invoice
   * Convenience method that wraps create() with PI-specific defaults
   * @param {string} piId - Proforma Invoice ID
   * @param {Object} dispatchData - Dispatch data
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  dispatchFromPI: async (piId, dispatchData) => {
    return dispatchesService.create({
      source_type: 'PROFORMA_INVOICE',
      source_id: piId,
      ...dispatchData,
    });
  },

  /**
   * Dispatch items from an Order
   * Convenience method that wraps create() with Order-specific defaults
   * @param {string} orderId - Order ID
   * @param {Object} dispatchData - Dispatch data
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  dispatchFromOrder: async (orderId, dispatchData) => {
    return dispatchesService.create({
      source_type: 'ORDER',
      source_id: orderId,
      ...dispatchData,
    });
  },
};

export default dispatchesService;

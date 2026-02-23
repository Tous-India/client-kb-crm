import apiClient from './api/client';
import { ENDPOINTS } from './api/endpoints';

/**
 * Proforma Invoices Service
 * Handles all proforma invoice related API calls
 * Always uses real database API calls
 */

const proformaInvoicesService = {
  /**
   * Get all proforma invoices
   * @param {Object} params - Query parameters (filters, pagination, etc.)
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  getAll: async (params = {}) => {
    try {
      const response = await apiClient.get(ENDPOINTS.PROFORMA_INVOICES.LIST, { params });
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('[Proforma Invoices Service] Error fetching all:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch proforma invoices',
        data: { proformaInvoices: [], pagination: {} },
      };
    }
  },

  /**
   * Get proforma invoice by ID
   * @param {string} id - PI ID
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  getById: async (id) => {
    try {
      const response = await apiClient.get(ENDPOINTS.PROFORMA_INVOICES.GET(id));
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('[Proforma Invoices Service] Error fetching by ID:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch proforma invoice',
        data: null,
      };
    }
  },

  /**
   * Create a new proforma invoice from quotation
   * @param {Object} piData - Proforma invoice data
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  create: async (piData) => {
    try {
      const response = await apiClient.post(ENDPOINTS.PROFORMA_INVOICES.CREATE, piData);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('[Proforma Invoices Service] Error creating:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to create proforma invoice',
        data: null,
      };
    }
  },

  /**
   * Update proforma invoice
   * @param {string} id - PI ID
   * @param {Object} piData - Updated PI data
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  update: async (id, piData) => {
    try {
      const response = await apiClient.put(ENDPOINTS.PROFORMA_INVOICES.UPDATE(id), piData);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('[Proforma Invoices Service] Error updating:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to update proforma invoice',
        data: null,
      };
    }
  },

  /**
   * Delete proforma invoice
   * @param {string} id - PI ID
   * @returns {Promise<{success: boolean, error: string}>}
   */
  delete: async (id) => {
    try {
      await apiClient.delete(ENDPOINTS.PROFORMA_INVOICES.DELETE(id));
      return { success: true };
    } catch (error) {
      console.error('[Proforma Invoices Service] Error deleting:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to delete proforma invoice',
      };
    }
  },

  /**
   * Get PIs with specific statuses for allocation
   * @param {Array<string>} statuses - Array of statuses to filter by
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  getForAllocation: async (statuses = ['APPROVED', 'PENDING', 'SENT']) => {
    try {
      const response = await apiClient.get(ENDPOINTS.PROFORMA_INVOICES.LIST, {
        params: { status: statuses.join(',') }
      });
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('[Proforma Invoices Service] Error fetching for allocation:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch proforma invoices',
        data: { proformaInvoices: [] },
      };
    }
  },

  /**
   * Get buyer's proforma invoices
   * @param {Object} params - Query parameters
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  getMyProformas: async (params = {}) => {
    try {
      const response = await apiClient.get(ENDPOINTS.PROFORMA_INVOICES.MY, { params });
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('[Proforma Invoices Service] Error fetching my proformas:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch proforma invoices',
        data: { proformaInvoices: [] },
      };
    }
  },

  /**
   * Approve a proforma invoice
   * @param {string} id - PI ID
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  approve: async (id) => {
    try {
      const response = await apiClient.put(ENDPOINTS.PROFORMA_INVOICES.APPROVE(id));
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('[Proforma Invoices Service] Error approving:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to approve proforma invoice',
        data: null,
      };
    }
  },

  /**
   * Reject a proforma invoice
   * @param {string} id - PI ID
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  reject: async (id) => {
    try {
      const response = await apiClient.put(ENDPOINTS.PROFORMA_INVOICES.REJECT(id));
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('[Proforma Invoices Service] Error rejecting:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to reject proforma invoice',
        data: null,
      };
    }
  },

  /**
   * Convert proforma invoice to order
   * @param {string} id - PI ID
   * @param {Object} orderData - Order data
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  convertToOrder: async (id, orderData = {}) => {
    try {
      const response = await apiClient.post(ENDPOINTS.PROFORMA_INVOICES.CONVERT_TO_ORDER(id), orderData);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('[Proforma Invoices Service] Error converting to order:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to convert to order',
        data: null,
      };
    }
  },

  /**
   * Get open PIs (with remaining items to dispatch)
   * For Open Orders page - shows PIs that haven't been fully dispatched
   * @param {Object} params - Query parameters (payment_status, pagination)
   * @returns {Promise<{success: boolean, data: Array, error: string}>}
   */
  getOpenPIs: async (params = {}) => {
    try {
      const response = await apiClient.get(ENDPOINTS.PROFORMA_INVOICES.OPEN, { params });
      return {
        success: true,
        data: response.data.data || [],
        pagination: response.data.pagination,
      };
    } catch (error) {
      console.error('[Proforma Invoices Service] Error fetching open PIs:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch open proforma invoices',
        data: [],
      };
    }
  },

  /**
   * Get completed PIs (fully dispatched)
   * For Completed tab in Open Orders page
   * @param {Object} params - Query parameters (payment_status, pagination)
   * @returns {Promise<{success: boolean, data: Array, error: string}>}
   */
  getCompletedPIs: async (params = {}) => {
    try {
      const response = await apiClient.get(ENDPOINTS.PROFORMA_INVOICES.COMPLETED, { params });
      return {
        success: true,
        data: response.data.data || [],
        pagination: response.data.pagination,
      };
    } catch (error) {
      console.error('[Proforma Invoices Service] Error fetching completed PIs:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch completed proforma invoices',
        data: [],
      };
    }
  },

  /**
   * Clone a proforma invoice
   * Creates a new PI based on existing one with reset payment/dispatch status
   * @param {string} id - PI ID to clone
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  clone: async (id) => {
    try {
      const response = await apiClient.post(`/proforma-invoices/${id}/clone`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('[Proforma Invoices Service] Error cloning:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to clone proforma invoice',
        data: null,
      };
    }
  },
};

export default proformaInvoicesService;

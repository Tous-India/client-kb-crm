import apiClient from './api/client';
import { ENDPOINTS } from './api/endpoints';
import { USE_MOCK_DATA } from './api/config';

// Import mock data for fallback
import quotationsData from '../mock/quotations.json';

/**
 * Quotations Service
 * Handles all quotation related API calls
 */

const quotationsService = {
  /**
   * Get all quotations (admin)
   * @param {Object} params - Query parameters (filters, pagination, etc.)
   * @returns {Promise<{success: boolean, data: Array, error: string}>}
   */
  getAll: async (params = {}) => {
    try {
      if (USE_MOCK_DATA) {
        return {
          success: true,
          data: quotationsData.quotations || [],
        };
      }

      const response = await apiClient.get(ENDPOINTS.QUOTATIONS.LIST, { params });
      return {
        success: true,
        data: response.data?.data || [],
        pagination: response.data?.pagination,
      };
    } catch (error) {
      console.error('[Quotations Service] Error fetching all:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch quotations',
        data: [],
      };
    }
  },

  /**
   * Get quotation by ID
   * @param {string} id - Quotation ID
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  getById: async (id) => {
    try {
      if (USE_MOCK_DATA) {
        const quotation = quotationsData.quotations?.find(q => q._id === id || q.quote_number === id);
        if (!quotation) {
          return {
            success: false,
            error: 'Quotation not found',
            data: null,
          };
        }
        return {
          success: true,
          data: quotation,
        };
      }

      const response = await apiClient.get(ENDPOINTS.QUOTATIONS.GET(id));
      return {
        success: true,
        data: response.data?.data || response.data,
      };
    } catch (error) {
      console.error('[Quotations Service] Error fetching by ID:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch quotation',
        data: null,
      };
    }
  },

  /**
   * Get logged-in buyer's quotations
   * Uses the dedicated /quotations/my endpoint
   * @param {Object} params - Query parameters (status, page, limit)
   * @returns {Promise<{success: boolean, data: Array, error: string}>}
   */
  getMyQuotations: async (params = {}) => {
    try {
      if (USE_MOCK_DATA) {
        // In mock mode, return all quotations as if they belong to the current user
        return {
          success: true,
          data: quotationsData.quotations || [],
        };
      }

      const response = await apiClient.get(ENDPOINTS.QUOTATIONS.MY_QUOTATIONS, { params });
      return {
        success: true,
        data: response.data?.data || [],
        pagination: response.data?.pagination,
      };
    } catch (error) {
      console.error('[Quotations Service] Error fetching my quotations:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch quotations',
        data: [],
      };
    }
  },

  /**
   * Get quotations by status
   * @param {string} status - Status to filter by (DRAFT, SENT, ACCEPTED, REJECTED, EXPIRED, CONVERTED)
   * @returns {Promise<{success: boolean, data: Array, error: string}>}
   */
  getByStatus: async (status) => {
    try {
      if (USE_MOCK_DATA) {
        const filtered = quotationsData.quotations?.filter(q => q.status === status) || [];
        return {
          success: true,
          data: filtered,
        };
      }

      const response = await apiClient.get(ENDPOINTS.QUOTATIONS.GET_BY_STATUS(status));
      return {
        success: true,
        data: response.data?.data || [],
      };
    } catch (error) {
      console.error('[Quotations Service] Error fetching by status:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch quotations',
        data: [],
      };
    }
  },

  /**
   * Accept a quotation (buyer action)
   * @param {string} id - Quotation ID
   * @param {Object} data - Optional data including shipping_address
   * @param {Object} data.shipping_address - Shipping address {street, city, state, zip, country}
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  accept: async (id, data = {}) => {
    try {
      if (USE_MOCK_DATA) {
        return {
          success: true,
          data: {
            _id: id,
            status: 'ACCEPTED',
            shipping_address: data.shipping_address,
          },
        };
      }

      const response = await apiClient.put(ENDPOINTS.QUOTATIONS.ACCEPT(id), data);
      return {
        success: true,
        data: response.data?.data || response.data,
      };
    } catch (error) {
      console.error('[Quotations Service] Error accepting quotation:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to accept quotation',
        data: null,
      };
    }
  },

  /**
   * Reject a quotation (buyer action)
   * @param {string} id - Quotation ID
   * @param {string} reason - Optional rejection reason
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  reject: async (id, reason = '') => {
    try {
      if (USE_MOCK_DATA) {
        return {
          success: true,
          data: {
            _id: id,
            status: 'REJECTED',
            rejection_reason: reason,
          },
        };
      }

      const response = await apiClient.put(ENDPOINTS.QUOTATIONS.REJECT(id), { reason });
      return {
        success: true,
        data: response.data?.data || response.data,
      };
    } catch (error) {
      console.error('[Quotations Service] Error rejecting quotation:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to reject quotation',
        data: null,
      };
    }
  },

  /**
   * Convert quotation to order (admin action)
   * @param {string} id - Quotation ID
   * @param {Object} orderData - Order data
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  convertToOrder: async (id, orderData = {}) => {
    try {
      if (USE_MOCK_DATA) {
        return {
          success: true,
          data: {
            quotation: { _id: id, status: 'CONVERTED' },
            order: { _id: `ORD-${Date.now()}` },
          },
        };
      }

      const response = await apiClient.post(ENDPOINTS.QUOTATIONS.CONVERT_TO_ORDER(id), orderData);
      return {
        success: true,
        data: response.data?.data || response.data,
      };
    } catch (error) {
      console.error('[Quotations Service] Error converting to order:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to convert to order',
        data: null,
      };
    }
  },

  /**
   * Renew an expired quotation
   * @param {string} id - Quotation ID
   * @param {number} expiryDays - New expiry period in days
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  renew: async (id, expiryDays = 30) => {
    try {
      if (USE_MOCK_DATA) {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + expiryDays);
        return {
          success: true,
          data: {
            _id: id,
            status: 'SENT',
            expiry_date: expiryDate.toISOString(),
          },
        };
      }

      const response = await apiClient.put(ENDPOINTS.QUOTATIONS.RENEW(id), { expiry_days: expiryDays });
      return {
        success: true,
        data: response.data?.data || response.data,
      };
    } catch (error) {
      console.error('[Quotations Service] Error renewing quotation:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to renew quotation',
        data: null,
      };
    }
  },

  /**
   * Send inquiry about a quotation (buyer action)
   * Sends email through CRM to admin
   * @param {string} id - Quotation ID
   * @param {Object} data - Inquiry data
   * @param {string} data.subject - Email subject
   * @param {string} data.message - Email message
   * @returns {Promise<{success: boolean, message: string, error: string}>}
   */
  sendInquiry: async (id, data) => {
    try {
      if (USE_MOCK_DATA) {
        return {
          success: true,
          message: 'Inquiry sent successfully (mock)',
        };
      }

      const response = await apiClient.post(ENDPOINTS.QUOTATIONS.SEND_INQUIRY(id), data);
      return {
        success: true,
        message: response.data?.message || 'Inquiry sent successfully',
      };
    } catch (error) {
      console.error('[Quotations Service] Error sending inquiry:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to send inquiry',
      };
    }
  },
};

export default quotationsService;

import apiClient from './api/client';
import { ENDPOINTS } from './api/endpoints';

/**
 * Invoices Service
 * Handles invoice CRUD operations and generation from PI
 */

const invoicesService = {
  /**
   * Get all invoices (Admin)
   * @param {Object} params - Query parameters (status, page, limit)
   * @returns {Promise<{success: boolean, data: Array, pagination: Object, error: string}>}
   */
  getAll: async (params = {}) => {
    try {
      const response = await apiClient.get(ENDPOINTS.INVOICES.LIST, { params });
      return {
        success: true,
        data: response.data.data,
        pagination: response.data.pagination,
      };
    } catch (error) {
      console.error('[Invoices Service] Error fetching all:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch invoices',
        data: [],
      };
    }
  },

  /**
   * Get my invoices (Buyer)
   * @param {Object} params - Query parameters
   * @returns {Promise<{success: boolean, data: Array, pagination: Object, error: string}>}
   */
  getMyInvoices: async (params = {}) => {
    try {
      const response = await apiClient.get(ENDPOINTS.INVOICES.MY, { params });
      return {
        success: true,
        data: response.data.data,
        pagination: response.data.pagination,
      };
    } catch (error) {
      console.error('[Invoices Service] Error fetching my invoices:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch invoices',
        data: [],
      };
    }
  },

  /**
   * Get invoice by ID
   * @param {string} id - Invoice ID
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  getById: async (id) => {
    try {
      const response = await apiClient.get(ENDPOINTS.INVOICES.GET(id));
      return {
        success: true,
        data: response.data.data?.invoice || response.data.data,
      };
    } catch (error) {
      console.error('[Invoices Service] Error fetching by ID:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch invoice',
        data: null,
      };
    }
  },

  /**
   * Get invoice by Proforma Invoice ID
   * @param {string} piId - Proforma Invoice ID
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  getByPI: async (piId) => {
    try {
      const response = await apiClient.get(ENDPOINTS.INVOICES.BY_PI(piId));
      return {
        success: true,
        data: response.data.data?.invoice || null,
      };
    } catch (error) {
      console.error('[Invoices Service] Error fetching by PI:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch invoice',
        data: null,
      };
    }
  },

  /**
   * Create invoice from Proforma Invoice
   * @param {Object} data - Invoice data
   * @param {string} data.proforma_invoice_id - PI ID (required)
   * @param {string} data.invoice_type - TAX_INVOICE, PROFORMA, COMMERCIAL, EXPORT
   * @param {string} data.invoice_date - Invoice date
   * @param {string} data.due_date - Due date
   * @param {number} data.exchange_rate - Exchange rate
   * @param {Object} data.bank_details - Bank details object
   * @param {string} data.bank_account_type - Bank account type
   * @param {boolean} data.include_dispatch_info - Include dispatch info
   * @param {string} data.notes - Notes
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  createFromPI: async (data) => {
    try {
      const response = await apiClient.post(ENDPOINTS.INVOICES.CREATE_FROM_PI, data);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('[Invoices Service] Error creating from PI:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to create invoice',
        data: null,
      };
    }
  },

  /**
   * Create invoice from Order
   * @param {Object} data - { order, due_date, billing_address, notes }
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  createFromOrder: async (data) => {
    try {
      const response = await apiClient.post(ENDPOINTS.INVOICES.CREATE, data);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('[Invoices Service] Error creating from order:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to create invoice',
        data: null,
      };
    }
  },

  /**
   * Create manual invoice
   * @param {Object} data - { buyer, items, tax, shipping, due_date, billing_address, notes }
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  createManual: async (data) => {
    try {
      const response = await apiClient.post(ENDPOINTS.INVOICES.CREATE_MANUAL, data);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('[Invoices Service] Error creating manual invoice:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to create invoice',
        data: null,
      };
    }
  },

  /**
   * Update invoice (all editable fields)
   * @param {string} id - Invoice ID
   * @param {Object} data - Invoice data to update
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  update: async (id, data) => {
    try {
      const response = await apiClient.put(ENDPOINTS.INVOICES.UPDATE(id), data);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('[Invoices Service] Error updating:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to update invoice',
        data: null,
      };
    }
  },

  /**
   * Update invoice items (delivery tracking)
   * @param {string} id - Invoice ID
   * @param {Array} items - Array of items with delivery updates
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  updateItems: async (id, items) => {
    try {
      const response = await apiClient.put(ENDPOINTS.INVOICES.UPDATE_ITEMS(id), { items });
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('[Invoices Service] Error updating items:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to update invoice items',
        data: null,
      };
    }
  },

  /**
   * Delete invoice (soft delete - marks as CANCELLED)
   * @param {string} id - Invoice ID
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  delete: async (id) => {
    try {
      const response = await apiClient.delete(ENDPOINTS.INVOICES.DELETE(id));
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('[Invoices Service] Error deleting:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to delete invoice',
        data: null,
      };
    }
  },

  /**
   * Duplicate invoice
   * @param {string} id - Invoice ID to duplicate
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  duplicate: async (id) => {
    try {
      const response = await apiClient.post(ENDPOINTS.INVOICES.DUPLICATE(id));
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('[Invoices Service] Error duplicating:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to duplicate invoice',
        data: null,
      };
    }
  },

  /**
   * Update invoice status
   * @param {string} id - Invoice ID
   * @param {string} status - UNPAID, PARTIAL, PAID, OVERDUE, CANCELLED
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  updateStatus: async (id, status) => {
    try {
      const response = await apiClient.put(ENDPOINTS.INVOICES.UPDATE_STATUS(id), { status });
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('[Invoices Service] Error updating status:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to update invoice status',
        data: null,
      };
    }
  },

  /**
   * Download invoice PDF
   * @param {string} id - Invoice ID
   * @returns {Promise<{success: boolean, data: Blob, error: string}>}
   */
  downloadPdf: async (id) => {
    try {
      const response = await apiClient.get(ENDPOINTS.INVOICES.PDF(id), {
        responseType: 'blob',
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('[Invoices Service] Error downloading PDF:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to download PDF',
        data: null,
      };
    }
  },
};

export default invoicesService;

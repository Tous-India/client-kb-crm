import apiClient from './api/client';
import { ENDPOINTS } from './api/endpoints';

/**
 * Archives Service
 * Handles legacy/archived data operations
 */

const archivesService = {
  /**
   * Get all archives with filters
   * @param {Object} params - Query parameters
   * @param {string} params.document_type - Filter by type (INVOICE, ORDER, etc.)
   * @param {string} params.buyer_name - Filter by buyer name
   * @param {string} params.buyer_id - Filter by buyer ID
   * @param {string} params.date_from - Start date (YYYY-MM-DD)
   * @param {string} params.date_to - End date (YYYY-MM-DD)
   * @param {string} params.fiscal_year - Filter by fiscal year
   * @param {string} params.payment_status - Filter by payment status
   * @param {number} params.min_amount - Minimum amount
   * @param {number} params.max_amount - Maximum amount
   * @param {string} params.tags - Comma-separated tags
   * @param {string} params.search - Search query
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  getAll: async (params = {}) => {
    try {
      const response = await apiClient.get(ENDPOINTS.ARCHIVES.LIST, { params });
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('[Archives Service] Error fetching all:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch archives',
        data: { archives: [] },
      };
    }
  },

  /**
   * Get archive by ID
   * @param {string} id - Archive ID (MongoDB _id or archive_id like "ARC-00001")
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  getById: async (id) => {
    try {
      const response = await apiClient.get(ENDPOINTS.ARCHIVES.GET(id));
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('[Archives Service] Error fetching by ID:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch archive',
        data: null,
      };
    }
  },

  /**
   * Create a new archive entry
   * @param {Object} archiveData - Archive data
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  create: async (archiveData) => {
    try {
      const response = await apiClient.post(ENDPOINTS.ARCHIVES.CREATE, archiveData);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('[Archives Service] Error creating:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to create archive',
        data: null,
      };
    }
  },

  /**
   * Update an archive entry
   * @param {string} id - Archive ID
   * @param {Object} archiveData - Updated archive data
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  update: async (id, archiveData) => {
    try {
      const response = await apiClient.put(ENDPOINTS.ARCHIVES.UPDATE(id), archiveData);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('[Archives Service] Error updating:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to update archive',
        data: null,
      };
    }
  },

  /**
   * Delete an archive entry
   * @param {string} id - Archive ID
   * @returns {Promise<{success: boolean, error: string}>}
   */
  delete: async (id) => {
    try {
      await apiClient.delete(ENDPOINTS.ARCHIVES.DELETE(id));
      return { success: true };
    } catch (error) {
      console.error('[Archives Service] Error deleting:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to delete archive',
      };
    }
  },

  /**
   * Search archives (full-text search)
   * @param {string} query - Search query
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  search: async (query) => {
    try {
      const response = await apiClient.get(ENDPOINTS.ARCHIVES.SEARCH, { params: { q: query } });
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('[Archives Service] Error searching:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to search archives',
        data: { archives: [] },
      };
    }
  },

  /**
   * Get archive statistics
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  getStats: async () => {
    try {
      const response = await apiClient.get(ENDPOINTS.ARCHIVES.STATS);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('[Archives Service] Error fetching stats:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch stats',
        data: null,
      };
    }
  },

  /**
   * Bulk import archives
   * @param {Array} archives - Array of archive objects
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  bulkImport: async (archives) => {
    try {
      const response = await apiClient.post(ENDPOINTS.ARCHIVES.BULK_IMPORT, { archives });
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('[Archives Service] Error bulk importing:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to bulk import',
        data: null,
      };
    }
  },

  /**
   * Get list of fiscal years
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  getFiscalYears: async () => {
    try {
      const response = await apiClient.get(ENDPOINTS.ARCHIVES.FISCAL_YEARS);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('[Archives Service] Error fetching fiscal years:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch fiscal years',
        data: { fiscal_years: [] },
      };
    }
  },

  /**
   * Get list of unique buyers from archives
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  getBuyers: async () => {
    try {
      const response = await apiClient.get(ENDPOINTS.ARCHIVES.BUYERS);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('[Archives Service] Error fetching buyers:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch buyers',
        data: { buyers: [] },
      };
    }
  },
};

export default archivesService;

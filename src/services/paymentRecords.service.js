import apiClient from './api/client';
import { ENDPOINTS } from './api/endpoints';

/**
 * Payment Records Service
 * Handles buyer payment submissions and admin verification
 */

const paymentRecordsService = {
  /**
   * Get all payment records (Admin)
   * @param {Object} params - Query parameters
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  getAll: async (params = {}) => {
    try {
      const response = await apiClient.get(ENDPOINTS.PAYMENT_RECORDS.LIST, { params });
      return {
        success: true,
        data: response.data.data,
        pagination: response.data.pagination,
      };
    } catch (error) {
      console.error('[Payment Records Service] Error fetching all:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch payment records',
        data: [],
      };
    }
  },

  /**
   * Get pending payment records (Admin)
   * @param {Object} params - Query parameters
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  getPending: async (params = {}) => {
    try {
      const response = await apiClient.get(ENDPOINTS.PAYMENT_RECORDS.PENDING, { params });
      return {
        success: true,
        data: response.data.data,
        pagination: response.data.pagination,
      };
    } catch (error) {
      console.error('[Payment Records Service] Error fetching pending:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch pending payment records',
        data: [],
      };
    }
  },

  /**
   * Get my payment records (Buyer)
   * @param {Object} params - Query parameters
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  getMyRecords: async (params = {}) => {
    try {
      const response = await apiClient.get(ENDPOINTS.PAYMENT_RECORDS.MY, { params });
      return {
        success: true,
        data: response.data.data,
        pagination: response.data.pagination,
      };
    } catch (error) {
      console.error('[Payment Records Service] Error fetching my records:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch payment records',
        data: [],
      };
    }
  },

  /**
   * Get payment records by PI ID
   * @param {string} piId - Proforma Invoice ID
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  getByProformaInvoice: async (piId) => {
    try {
      const response = await apiClient.get(ENDPOINTS.PAYMENT_RECORDS.BY_PI(piId));
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('[Payment Records Service] Error fetching by PI:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch payment records',
        data: { records: [] },
      };
    }
  },

  /**
   * Submit a payment record for verification (Buyer)
   * Supports FormData for file upload
   * @param {FormData|Object} paymentData - Payment record data (FormData with file or JSON object)
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  create: async (paymentData) => {
    try {
      // Check if paymentData is FormData (file upload) or regular JSON
      const isFormData = paymentData instanceof FormData;
      const config = isFormData
        ? { headers: { 'Content-Type': 'multipart/form-data' } }
        : {};

      const response = await apiClient.post(ENDPOINTS.PAYMENT_RECORDS.CREATE, paymentData, config);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('[Payment Records Service] Error creating:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to submit payment record',
        data: null,
      };
    }
  },

  /**
   * Verify a payment record (Admin)
   * @param {string} id - Payment record ID
   * @param {Object} verificationData - { recorded_amount?, verification_notes? }
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  verify: async (id, verificationData = {}) => {
    try {
      const response = await apiClient.put(ENDPOINTS.PAYMENT_RECORDS.VERIFY(id), verificationData);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('[Payment Records Service] Error verifying:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to verify payment',
        data: null,
      };
    }
  },

  /**
   * Reject a payment record (Admin)
   * @param {string} id - Payment record ID
   * @param {Object} rejectionData - { verification_notes? }
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  reject: async (id, rejectionData = {}) => {
    try {
      const response = await apiClient.put(ENDPOINTS.PAYMENT_RECORDS.REJECT(id), rejectionData);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('[Payment Records Service] Error rejecting:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to reject payment',
        data: null,
      };
    }
  },

  /**
   * Get payment record by ID
   * @param {string} id - Payment record ID
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  getById: async (id) => {
    try {
      const response = await apiClient.get(ENDPOINTS.PAYMENT_RECORDS.GET(id));
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('[Payment Records Service] Error fetching by ID:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch payment record',
        data: null,
      };
    }
  },

  /**
   * Update payment proof for a record (Buyer only, PENDING records only)
   * @param {string} id - Payment record ID
   * @param {File} proofFile - New proof file
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  updateProof: async (id, proofFile) => {
    try {
      const formData = new FormData();
      formData.append('proof_file', proofFile);

      const response = await apiClient.put(
        `/payment-records/${id}/update-proof`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('[Payment Records Service] Error updating proof:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to update payment proof',
        data: null,
      };
    }
  },

  /**
   * Update full payment record (Buyer only, PENDING records only)
   * @param {string} id - Payment record ID
   * @param {Object} data - { amount, transaction_id, payment_method, payment_date, notes }
   * @param {File} proofFile - Optional new proof file
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  update: async (id, data, proofFile = null) => {
    try {
      const formData = new FormData();
      if (data.amount !== undefined) formData.append('amount', data.amount);
      if (data.transaction_id) formData.append('transaction_id', data.transaction_id);
      if (data.payment_method) formData.append('payment_method', data.payment_method);
      if (data.payment_date) formData.append('payment_date', data.payment_date);
      if (data.notes !== undefined) formData.append('notes', data.notes);
      if (proofFile) formData.append('proof_file', proofFile);

      const response = await apiClient.put(
        `/payment-records/${id}/update`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('[Payment Records Service] Error updating record:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to update payment record',
        data: null,
      };
    }
  },

  /**
   * Admin update payment record (Admin only)
   * Can edit verified records to correct mistakes
   * @param {string} id - Payment record ID
   * @param {Object} data - Updated payment data
   * @param {File} proofFile - Optional new proof file
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  adminUpdate: async (id, data, proofFile = null) => {
    try {
      const formData = new FormData();
      if (data.amount !== undefined) formData.append('amount', data.amount);
      if (data.recorded_amount !== undefined) formData.append('recorded_amount', data.recorded_amount);
      if (data.transaction_id !== undefined) formData.append('transaction_id', data.transaction_id);
      if (data.payment_method !== undefined) formData.append('payment_method', data.payment_method);
      if (data.payment_date !== undefined) formData.append('payment_date', data.payment_date);
      if (data.notes !== undefined) formData.append('notes', data.notes);
      if (data.verification_notes !== undefined) formData.append('verification_notes', data.verification_notes);
      if (data.payment_exchange_rate !== undefined) formData.append('payment_exchange_rate', data.payment_exchange_rate);
      if (proofFile) formData.append('proof_file', proofFile);

      const response = await apiClient.put(
        ENDPOINTS.PAYMENT_RECORDS.ADMIN_UPDATE(id),
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('[Payment Records Service] Error admin updating:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to update payment record',
        data: null,
      };
    }
  },

  /**
   * Admin direct collection (Admin only)
   * Used when buyer contacts via phone, email, or in-person
   * @param {Object} data - Payment data
   * @param {File} proofFile - Optional proof file (email screenshot, etc.)
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  adminCollect: async (data, proofFile = null) => {
    try {
      const formData = new FormData();
      formData.append('proforma_invoice_id', data.proforma_invoice_id);
      formData.append('amount', data.amount);
      if (data.currency) formData.append('currency', data.currency);
      if (data.transaction_id) formData.append('transaction_id', data.transaction_id);
      if (data.payment_method) formData.append('payment_method', data.payment_method);
      if (data.payment_date) formData.append('payment_date', data.payment_date);
      if (data.notes) formData.append('notes', data.notes);
      if (data.collection_source) formData.append('collection_source', data.collection_source);
      if (data.payment_exchange_rate) formData.append('payment_exchange_rate', data.payment_exchange_rate);
      if (proofFile) formData.append('proof_file', proofFile);

      const response = await apiClient.post(
        '/payment-records/admin-collect',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('[Payment Records Service] Error admin collecting:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to collect payment',
        data: null,
      };
    }
  },
};

export default paymentRecordsService;

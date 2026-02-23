import apiClient from './api/client';
import { ENDPOINTS } from './api/endpoints';
import { USE_MOCK_DATA } from './api/config';

// Import mock data for fallback
import supplierOrdersData from '../mock/supplierOrders.json';

/**
 * Supplier Orders Service
 * Handles all supplier order (SPO) related API calls
 */

const supplierOrdersService = {
  /**
   * Get all supplier orders
   * @param {Object} params - Query parameters (filters, pagination, etc.)
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  getAll: async (params = {}) => {
    try {
      // Use mock data if enabled
      if (USE_MOCK_DATA) {
        let orders = supplierOrdersData.supplierOrders || [];

        // Apply filters
        if (params.status) {
          orders = orders.filter(o => o.status === params.status);
        }
        if (params.supplier_id) {
          orders = orders.filter(o => o.supplier_id === params.supplier_id);
        }
        if (params.payment_status) {
          orders = orders.filter(o => o.payment_status === params.payment_status);
        }

        return {
          success: true,
          data: {
            supplierOrders: orders,
            pagination: {
              total: orders.length,
              page: params.page || 1,
              limit: params.limit || 50,
              totalPages: Math.ceil(orders.length / (params.limit || 50))
            }
          },
        };
      }

      const response = await apiClient.get(ENDPOINTS.SUPPLIER_ORDERS.LIST, { params });
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('[Supplier Orders Service] Error fetching all:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch supplier orders',
        data: { supplierOrders: [], pagination: {} },
      };
    }
  },

  /**
   * Get supplier order by ID
   * @param {string} id - SPO ID
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  getById: async (id) => {
    try {
      // Use mock data if enabled
      if (USE_MOCK_DATA) {
        const order = supplierOrdersData.supplierOrders?.find(
          o => o.spo_id === id || o.spo_number === id
        );
        if (!order) {
          return {
            success: false,
            error: 'Supplier order not found',
            data: null,
          };
        }
        return {
          success: true,
          data: { supplierOrder: order },
        };
      }

      const response = await apiClient.get(ENDPOINTS.SUPPLIER_ORDERS.GET(id));
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('[Supplier Orders Service] Error fetching by ID:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch supplier order',
        data: null,
      };
    }
  },

  /**
   * Get orders by supplier ID
   * @param {string} supplierId - Supplier ID
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  getBySupplier: async (supplierId) => {
    try {
      // Use mock data if enabled
      if (USE_MOCK_DATA) {
        const orders = supplierOrdersData.supplierOrders?.filter(
          o => o.supplier_id === supplierId
        ) || [];
        return {
          success: true,
          data: { supplierOrders: orders },
        };
      }

      const response = await apiClient.get(ENDPOINTS.SUPPLIER_ORDERS.GET_BY_SUPPLIER(supplierId));
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('[Supplier Orders Service] Error fetching by supplier:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch supplier orders',
        data: { supplierOrders: [] },
      };
    }
  },

  /**
   * Create a new supplier order
   * @param {Object} orderData - Order data
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  create: async (orderData) => {
    try {
      // Use mock data if enabled
      if (USE_MOCK_DATA) {
        const year = new Date().getFullYear();
        const newOrder = {
          spo_id: `SPO-${year}-${String(supplierOrdersData.supplierOrders.length + 1).padStart(3, '0')}`,
          spo_number: `SP${String(year).slice(2)}${String(supplierOrdersData.supplierOrders.length + 1).padStart(4, '0')}`,
          ...orderData,
          status: 'DRAFT',
          created_at: new Date().toISOString(),
        };
        return {
          success: true,
          data: { supplierOrder: newOrder },
        };
      }

      const response = await apiClient.post(ENDPOINTS.SUPPLIER_ORDERS.CREATE, orderData);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('[Supplier Orders Service] Error creating:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to create supplier order',
        data: null,
      };
    }
  },

  /**
   * Update supplier order
   * @param {string} id - SPO ID
   * @param {Object} orderData - Updated order data
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  update: async (id, orderData) => {
    try {
      // Use mock data if enabled
      if (USE_MOCK_DATA) {
        return {
          success: true,
          data: {
            supplierOrder: {
              spo_id: id,
              ...orderData,
              updated_at: new Date().toISOString(),
            }
          },
        };
      }

      const response = await apiClient.put(ENDPOINTS.SUPPLIER_ORDERS.UPDATE(id), orderData);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('[Supplier Orders Service] Error updating:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to update supplier order',
        data: null,
      };
    }
  },

  /**
   * Delete supplier order
   * @param {string} id - SPO ID
   * @returns {Promise<{success: boolean, error: string}>}
   */
  delete: async (id) => {
    try {
      // Use mock data if enabled
      if (USE_MOCK_DATA) {
        return { success: true };
      }

      await apiClient.delete(ENDPOINTS.SUPPLIER_ORDERS.DELETE(id));
      return { success: true };
    } catch (error) {
      console.error('[Supplier Orders Service] Error deleting:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to delete supplier order',
      };
    }
  },

  /**
   * Update order status
   * @param {string} id - SPO ID
   * @param {string} status - New status
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  updateStatus: async (id, status) => {
    try {
      // Use mock data if enabled
      if (USE_MOCK_DATA) {
        return {
          success: true,
          data: { supplierOrder: { spo_id: id, status } },
        };
      }

      const response = await apiClient.patch(ENDPOINTS.SUPPLIER_ORDERS.UPDATE_STATUS(id), { status });
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('[Supplier Orders Service] Error updating status:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to update order status',
        data: null,
      };
    }
  },

  /**
   * Add payment to order
   * @param {string} id - SPO ID
   * @param {Object} paymentData - Payment data
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  addPayment: async (id, paymentData) => {
    try {
      // Use mock data if enabled
      if (USE_MOCK_DATA) {
        return {
          success: true,
          data: { supplierOrder: { spo_id: id, payment_history: [paymentData] } },
        };
      }

      const response = await apiClient.post(ENDPOINTS.SUPPLIER_ORDERS.ADD_PAYMENT(id), paymentData);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('[Supplier Orders Service] Error adding payment:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to add payment',
        data: null,
      };
    }
  },

  /**
   * Receive items
   * @param {string} id - SPO ID
   * @param {Object} receiveData - Receive data
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  receiveItems: async (id, receiveData) => {
    try {
      // Use mock data if enabled
      if (USE_MOCK_DATA) {
        return {
          success: true,
          data: { supplierOrder: { spo_id: id } },
        };
      }

      const response = await apiClient.post(ENDPOINTS.SUPPLIER_ORDERS.RECEIVE_ITEMS(id), receiveData);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('[Supplier Orders Service] Error receiving items:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to receive items',
        data: null,
      };
    }
  },

  /**
   * Get summary statistics
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  getSummary: async () => {
    try {
      // Use mock data if enabled
      if (USE_MOCK_DATA) {
        const orders = supplierOrdersData.supplierOrders || [];
        return {
          success: true,
          data: {
            summary: {
              total_orders: orders.length,
              draft: orders.filter(o => o.status === 'DRAFT').length,
              ordered: orders.filter(o => o.status === 'ORDERED').length,
              received: orders.filter(o => o.status === 'RECEIVED').length,
              total_value: orders.reduce((sum, o) => sum + (o.total_amount || 0), 0),
              unpaid_balance: orders.reduce((sum, o) => sum + (o.balance_due || 0), 0),
            }
          },
        };
      }

      const response = await apiClient.get(ENDPOINTS.SUPPLIER_ORDERS.SUMMARY);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('[Supplier Orders Service] Error fetching summary:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch summary',
        data: null,
      };
    }
  },
};

export default supplierOrdersService;

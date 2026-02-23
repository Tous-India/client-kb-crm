import apiClient from './api/client';
import { ENDPOINTS } from './api/endpoints';
import { USE_MOCK_DATA } from './api/config';

// Import mock data for fallback
import ordersData from '../mock/orders.json';

/**
 * Orders Service
 * Handles all order related API calls
 */

const ordersService = {
  /**
   * Get all orders
   * @param {Object} params - Query parameters (filters, pagination, etc.)
   * @returns {Promise<{success: boolean, data: Array, error: string}>}
   */
  getAll: async (params = {}) => {
    try {
      // Use mock data if enabled
      if (USE_MOCK_DATA) {
        return {
          success: true,
          data: ordersData.orders || [],
        };
      }

      const response = await apiClient.get(ENDPOINTS.ORDERS.LIST, { params });
      // API returns { status, message, data, pagination } - extract the data array
      return {
        success: true,
        data: response.data?.data || [],
        pagination: response.data?.pagination,
      };
    } catch (error) {
      console.error('[Orders Service] Error fetching all:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch orders',
        data: [],
      };
    }
  },

  /**
   * Get order by ID
   * @param {string} id - Order ID
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  getById: async (id) => {
    try {
      // Use mock data if enabled
      if (USE_MOCK_DATA) {
        const order = ordersData.orders?.find(o => o.order_id === id);
        if (!order) {
          return {
            success: false,
            error: 'Order not found',
            data: null,
          };
        }
        return {
          success: true,
          data: order,
        };
      }

      const response = await apiClient.get(ENDPOINTS.ORDERS.GET(id));
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('[Orders Service] Error fetching by ID:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch order',
        data: null,
      };
    }
  },

  /**
   * Get orders by status
   * @param {string} status - Status to filter by (OPEN, DISPATCHED)
   * @returns {Promise<{success: boolean, data: Array, error: string}>}
   */
  getByStatus: async (status) => {
    try {
      // Use mock data if enabled
      if (USE_MOCK_DATA) {
        const filtered = ordersData.orders?.filter(o => o.status === status) || [];
        return {
          success: true,
          data: filtered,
        };
      }

      const response = await apiClient.get(ENDPOINTS.ORDERS.GET_BY_STATUS(status));
      // API returns { status, message, data, pagination } - extract the data array
      return {
        success: true,
        data: response.data?.data || [],
      };
    } catch (error) {
      console.error('[Orders Service] Error fetching by status:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch orders',
        data: [],
      };
    }
  },

  /**
   * Dispatch order (full dispatch)
   * @param {string} orderId - Order ID
   * @param {Object} dispatchData - Dispatch data (e.g., { trackingNumber: 'TRK123' })
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  dispatch: async (orderId, dispatchData) => {
    try {
      // Use mock data if enabled (simulate API call)
      if (USE_MOCK_DATA) {
        return {
          success: true,
          data: {
            order_id: orderId,
            status: 'DISPATCHED',
            tracking_number: dispatchData.trackingNumber || `TRK${String(Math.floor(Math.random() * 1000000000)).padStart(9, '0')}`,
            dispatched_date: new Date().toISOString(),
          },
        };
      }

      const response = await apiClient.post(
        ENDPOINTS.ORDERS.DISPATCH(orderId),
        dispatchData
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('[Orders Service] Error dispatching order:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to dispatch order',
        data: null,
      };
    }
  },

  /**
   * Partial dispatch order with shipping details
   * @param {string} orderId - Order MongoDB _id
   * @param {Object} dispatchData - Dispatch data with items, shipping info
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  partialDispatch: async (orderId, dispatchData) => {
    try {
      if (USE_MOCK_DATA) {
        const dispatchedQty = dispatchData.items?.reduce((sum, i) => sum + (i.quantity || 0), 0) || 0;
        return {
          success: true,
          data: {
            order: {
              _id: orderId,
              status: dispatchData.items?.length === 0 ? 'DISPATCHED' : 'OPEN',
              dispatched_quantity: dispatchedQty,
            },
            dispatch_record: {
              dispatch_id: `DSP-${Date.now()}`,
              dispatch_date: new Date().toISOString(),
              ...dispatchData,
            },
            fully_dispatched: false,
          },
        };
      }

      const response = await apiClient.put(`/orders/${orderId}/partial-dispatch`, dispatchData);
      return {
        success: true,
        data: response.data?.data || response.data,
      };
    } catch (error) {
      console.error('[Orders Service] Error partial dispatching order:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to dispatch order',
        data: null,
      };
    }
  },

  /**
   * Get open orders (for admin)
   * @returns {Promise<{success: boolean, data: Array, error: string}>}
   */
  getOpenOrders: async () => {
    try {
      if (USE_MOCK_DATA) {
        const filtered = ordersData.orders?.filter(o => o.status === 'OPEN') || [];
        return {
          success: true,
          data: filtered,
        };
      }

      const response = await apiClient.get('/orders/open');
      return {
        success: true,
        data: response.data?.data || [],
      };
    } catch (error) {
      console.error('[Orders Service] Error fetching open orders:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch open orders',
        data: [],
      };
    }
  },

  /**
   * Get dispatched orders (for admin)
   * @returns {Promise<{success: boolean, data: Array, error: string}>}
   */
  getDispatchedOrders: async () => {
    try {
      if (USE_MOCK_DATA) {
        const filtered = ordersData.orders?.filter(o => o.status === 'DISPATCHED') || [];
        return {
          success: true,
          data: filtered,
        };
      }

      const response = await apiClient.get('/orders/dispatched');
      return {
        success: true,
        data: response.data?.data || [],
      };
    } catch (error) {
      console.error('[Orders Service] Error fetching dispatched orders:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch dispatched orders',
        data: [],
      };
    }
  },

  /**
   * Create a new order
   * @param {Object} orderData - Order data
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  create: async (orderData) => {
    try {
      // Use mock data if enabled (simulate API call)
      if (USE_MOCK_DATA) {
        return {
          success: true,
          data: {
            order_id: `ORD${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
            ...orderData,
            order_date: new Date().toISOString(),
            status: 'OPEN',
            payment_status: 'UNPAID',
          },
        };
      }

      const response = await apiClient.post(ENDPOINTS.ORDERS.CREATE, orderData);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('[Orders Service] Error creating:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to create order',
        data: null,
      };
    }
  },

  /**
   * Update order
   * @param {string} id - Order ID
   * @param {Object} orderData - Updated order data
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  update: async (id, orderData) => {
    try {
      // Use mock data if enabled (simulate API call)
      if (USE_MOCK_DATA) {
        return {
          success: true,
          data: {
            order_id: id,
            ...orderData,
          },
        };
      }

      const response = await apiClient.put(ENDPOINTS.ORDERS.UPDATE(id), orderData);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('[Orders Service] Error updating:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to update order',
        data: null,
      };
    }
  },

  /**
   * Delete order
   * @param {string} id - Order ID
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

      await apiClient.delete(ENDPOINTS.ORDERS.DELETE(id));
      return {
        success: true,
      };
    } catch (error) {
      console.error('[Orders Service] Error deleting:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to delete order',
      };
    }
  },

  /**
   * Get orders by customer/buyer ID
   * @param {string} customerId - Customer/Buyer ID
   * @returns {Promise<{success: boolean, data: Array, error: string}>}
   */
  getByCustomerId: async (customerId) => {
    try {
      if (USE_MOCK_DATA) {
        const filtered = ordersData.orders?.filter(o => o.customer_id === customerId) || [];
        return {
          success: true,
          data: filtered,
        };
      }

      const response = await apiClient.get(`${ENDPOINTS.ORDERS.LIST}?customer_id=${customerId}`);
      return {
        success: true,
        data: response.data?.data || [],
      };
    } catch (error) {
      console.error('[Orders Service] Error fetching by customer ID:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch orders',
        data: [],
      };
    }
  },

  /**
   * Get logged-in buyer's orders
   * Uses the dedicated /orders/my endpoint
   * @param {Object} params - Query parameters (status, page, limit)
   * @returns {Promise<{success: boolean, data: Array, error: string}>}
   */
  getMyOrders: async (params = {}) => {
    try {
      if (USE_MOCK_DATA) {
        // In mock mode, return all orders as if they belong to the current user
        const filtered = ordersData.orders || [];
        return {
          success: true,
          data: filtered,
        };
      }

      const response = await apiClient.get(ENDPOINTS.ORDERS.MY_ORDERS, { params });
      return {
        success: true,
        data: response.data?.data || [],
      };
    } catch (error) {
      console.error('[Orders Service] Error fetching my orders:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch orders',
        data: [],
      };
    }
  },

  /**
   * Get pending orders (for admin - Purchase Orders page)
   * Orders with status PENDING are waiting for quotation
   * Uses the dedicated /orders/pending endpoint
   * @returns {Promise<{success: boolean, data: Array, error: string}>}
   */
  getPendingOrders: async () => {
    try {
      if (USE_MOCK_DATA) {
        const filtered = ordersData.orders?.filter(o => o.status === 'PENDING') || [];
        return {
          success: true,
          data: filtered,
        };
      }

      // Use the dedicated pending orders endpoint
      const response = await apiClient.get(ENDPOINTS.ORDERS.PENDING);
      return {
        success: true,
        data: response.data?.data || [],
      };
    } catch (error) {
      console.error('[Orders Service] Error fetching pending orders:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch pending orders',
        data: [],
      };
    }
  },

  /**
   * Convert order to quotation (admin action)
   * Uses the dedicated /orders/:id/convert-to-quotation endpoint
   * @param {string} orderId - Order ID (MongoDB _id)
   * @param {Object} quotationData - Quotation details
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  convertToQuotation: async (orderId, quotationData) => {
    try {
      if (USE_MOCK_DATA) {
        return {
          success: true,
          data: {
            order_id: orderId,
            status: 'CONVERTED',
            quotation: {
              quote_id: `QUO-${Date.now()}`,
              quote_number: `Q${new Date().getFullYear()}${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
              ...quotationData,
            },
          },
        };
      }

      // Use the dedicated convert-to-quotation endpoint
      const response = await apiClient.post(ENDPOINTS.ORDERS.CONVERT_TO_QUOTATION(orderId), quotationData);
      return {
        success: true,
        data: response.data?.data || response.data,
      };
    } catch (error) {
      console.error('[Orders Service] Error converting to quotation:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to convert to quotation',
        data: null,
      };
    }
  },

  /**
   * Submit a quote request (buyer action - creates an order with PENDING status)
   * Uses the dedicated /orders/quote-request endpoint which supports optional auth
   * @param {Object} requestData - Quote request data from buyer
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  submitQuoteRequest: async (requestData) => {
    try {
      if (USE_MOCK_DATA) {
        const newOrder = {
          order_id: `ORD-${Date.now()}`,
          po_number: `PO${new Date().getFullYear()}${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
          ...requestData,
          status: 'PENDING',
          order_type: 'QUOTE_REQUEST',
          created_at: new Date().toISOString(),
        };
        return {
          success: true,
          data: newOrder,
        };
      }

      // Use the dedicated quote-request endpoint (supports optional auth)
      const response = await apiClient.post(ENDPOINTS.ORDERS.QUOTE_REQUEST, requestData);
      return {
        success: true,
        data: response.data?.data || response.data,
      };
    } catch (error) {
      console.error('[Orders Service] Error submitting quote request:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to submit quote request',
        data: null,
      };
    }
  },

  /**
   * Clone an existing order (buyer action)
   * Creates a new quote request with the same items as the original order
   * @param {string} orderId - MongoDB _id of the order to clone
   * @param {Object} data - Optional data like notes
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  cloneOrder: async (orderId, data = {}) => {
    try {
      if (USE_MOCK_DATA) {
        const clonedOrder = {
          order_id: `ORD-${Date.now()}`,
          po_number: `PO${new Date().getFullYear()}${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
          status: 'PENDING',
          order_type: 'QUOTE_REQUEST',
          created_at: new Date().toISOString(),
          ...data,
        };
        return {
          success: true,
          data: { order: clonedOrder, source_order_id: orderId },
        };
      }

      const response = await apiClient.post(ENDPOINTS.ORDERS.CLONE(orderId), data);
      return {
        success: true,
        data: response.data?.data || response.data,
      };
    } catch (error) {
      console.error('[Orders Service] Error cloning order:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to clone order',
        data: null,
      };
    }
  },
};

export default ordersService;

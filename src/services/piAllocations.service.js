import apiClient from './api/client';
import { ENDPOINTS } from './api/endpoints';
import { USE_MOCK_DATA } from './api/config';

// Import mock data for fallback
import piAllocationsData from '../mock/piAllocations.json';

/**
 * PI Allocations Service
 * Handles all PI allocation related API calls
 */

const piAllocationsService = {
  /**
   * Get all allocations
   * @param {Object} params - Query parameters (filters, pagination, etc.)
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  getAll: async (params = {}) => {
    try {
      // Use mock data if enabled
      if (USE_MOCK_DATA) {
        let allocations = piAllocationsData.piAllocations || [];

        // Apply filters
        if (params.status) {
          allocations = allocations.filter(a =>
            a.allocations?.some(alloc => alloc.status === params.status)
          );
        }
        if (params.pi_number) {
          allocations = allocations.filter(a => a.pi_number === params.pi_number);
        }

        return {
          success: true,
          data: {
            allocations,
            pagination: {
              total: allocations.length,
              page: params.page || 1,
              limit: params.limit || 10,
              totalPages: Math.ceil(allocations.length / (params.limit || 10))
            }
          },
        };
      }

      const response = await apiClient.get(ENDPOINTS.PI_ALLOCATIONS.LIST, { params });
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('[PI Allocations Service] Error fetching all:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch allocations',
        data: { allocations: [], pagination: {} },
      };
    }
  },

  /**
   * Get allocation by ID
   * @param {string} id - Allocation ID (MongoDB _id or allocation_id like "ALC-00001")
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  getById: async (id) => {
    try {
      // Use mock data if enabled
      if (USE_MOCK_DATA) {
        const allocation = piAllocationsData.piAllocations?.find(
          a => a.allocation_id === id || a._id === id
        );
        if (!allocation) {
          return {
            success: false,
            error: 'Allocation not found',
            data: null,
          };
        }
        return {
          success: true,
          data: { allocation },
        };
      }

      const response = await apiClient.get(ENDPOINTS.PI_ALLOCATIONS.GET(id));
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('[PI Allocations Service] Error fetching by ID:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch allocation',
        data: null,
      };
    }
  },

  /**
   * Get allocations by PI
   * @param {string} piId - Proforma Invoice ID
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  getByPI: async (piId) => {
    try {
      // Use mock data if enabled
      if (USE_MOCK_DATA) {
        const allocations = piAllocationsData.piAllocations?.filter(
          a => a.pi_id === piId || a.proforma_invoice === piId
        ) || [];
        return {
          success: true,
          data: { allocations },
        };
      }

      const response = await apiClient.get(ENDPOINTS.PI_ALLOCATIONS.GET_BY_PI(piId));
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('[PI Allocations Service] Error fetching by PI:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch allocations',
        data: { allocations: [] },
      };
    }
  },

  /**
   * Create a new allocation
   * @param {Object} allocationData - Allocation data
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  create: async (allocationData) => {
    try {
      // Use mock data if enabled
      if (USE_MOCK_DATA) {
        const newAllocation = {
          _id: `mock_${Date.now()}`,
          allocation_id: `ALC-${String(piAllocationsData.piAllocations.length + 1).padStart(5, '0')}`,
          ...allocationData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        return {
          success: true,
          data: { allocation: newAllocation },
        };
      }

      const response = await apiClient.post(ENDPOINTS.PI_ALLOCATIONS.CREATE, allocationData);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('[PI Allocations Service] Error creating:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to create allocation',
        data: null,
      };
    }
  },

  /**
   * Update allocation
   * @param {string} id - Allocation ID
   * @param {Object} allocationData - Updated allocation data
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  update: async (id, allocationData) => {
    try {
      // Use mock data if enabled
      if (USE_MOCK_DATA) {
        return {
          success: true,
          data: {
            allocation: {
              allocation_id: id,
              ...allocationData,
              updatedAt: new Date().toISOString(),
            }
          },
        };
      }

      const response = await apiClient.put(ENDPOINTS.PI_ALLOCATIONS.UPDATE(id), allocationData);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('[PI Allocations Service] Error updating:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to update allocation',
        data: null,
      };
    }
  },

  /**
   * Delete allocation
   * @param {string} id - Allocation ID
   * @returns {Promise<{success: boolean, error: string}>}
   */
  delete: async (id) => {
    try {
      // Use mock data if enabled
      if (USE_MOCK_DATA) {
        return { success: true };
      }

      await apiClient.delete(ENDPOINTS.PI_ALLOCATIONS.DELETE(id));
      return { success: true };
    } catch (error) {
      console.error('[PI Allocations Service] Error deleting:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to delete allocation',
      };
    }
  },

  /**
   * Bulk save allocations
   * @param {Array} allocations - Array of allocation data
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  bulkSave: async (allocations) => {
    try {
      // Use mock data if enabled
      if (USE_MOCK_DATA) {
        const savedAllocations = allocations.map((a, index) => ({
          _id: `mock_${Date.now()}_${index}`,
          allocation_id: `ALC-${String(piAllocationsData.piAllocations.length + index + 1).padStart(5, '0')}`,
          ...a,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));
        return {
          success: true,
          data: { allocations: savedAllocations, saved: savedAllocations.length },
        };
      }

      const response = await apiClient.post(ENDPOINTS.PI_ALLOCATIONS.BULK_SAVE, { allocations });
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('[PI Allocations Service] Error bulk saving:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to bulk save allocations',
        data: null,
      };
    }
  },

  /**
   * Get allocation summary statistics
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  getSummary: async () => {
    try {
      // Use mock data if enabled
      if (USE_MOCK_DATA) {
        const allocations = piAllocationsData.piAllocations || [];
        const byStatus = allocations.reduce((acc, a) => {
          const status = a.summary?.allocation_complete ? 'ALLOCATED' :
            (a.summary?.allocated_qty > 0 ? 'PARTIAL' : 'UNALLOCATED');
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {});

        return {
          success: true,
          data: {
            summary: {
              total_allocations: allocations.length,
              by_status: byStatus,
              total_value: allocations.reduce((sum, a) => sum + (a.sell_price * a.total_pi_qty || 0), 0),
              total_cost: allocations.reduce((sum, a) => sum + (a.avg_cost_price * a.total_pi_qty || 0), 0),
              avg_profit_margin: allocations.length > 0
                ? allocations.reduce((sum, a) => sum + (a.profit_margin || 0), 0) / allocations.length
                : 0,
            }
          },
        };
      }

      const response = await apiClient.get(ENDPOINTS.PI_ALLOCATIONS.SUMMARY);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('[PI Allocations Service] Error fetching summary:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch summary',
        data: null,
      };
    }
  },

  /**
   * Update allocation status (e.g., mark as ordered)
   * @param {string} id - Allocation ID
   * @param {number} allocationIndex - Index of supplier allocation
   * @param {string} status - New status
   * @param {string} spoNumber - Supplier PO number (optional)
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  updateStatus: async (id, allocationIndex, status, spoNumber = null) => {
    try {
      // Use mock data if enabled
      if (USE_MOCK_DATA) {
        return {
          success: true,
          data: { allocation: { allocation_id: id, status } },
        };
      }

      const response = await apiClient.patch(ENDPOINTS.PI_ALLOCATIONS.UPDATE_STATUS(id), {
        allocation_index: allocationIndex,
        status,
        spo_number: spoNumber,
      });
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('[PI Allocations Service] Error updating status:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to update status',
        data: null,
      };
    }
  },

  /**
   * Update received quantity
   * @param {string} id - Allocation ID
   * @param {number} allocationIndex - Index of supplier allocation
   * @param {number} receivedQty - Received quantity
   * @param {string} receivedDate - Received date
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  updateReceived: async (id, allocationIndex, receivedQty, receivedDate = null) => {
    try {
      // Use mock data if enabled
      if (USE_MOCK_DATA) {
        return {
          success: true,
          data: { allocation: { allocation_id: id, received_qty: receivedQty } },
        };
      }

      const response = await apiClient.patch(ENDPOINTS.PI_ALLOCATIONS.RECEIVE(id), {
        allocation_index: allocationIndex,
        received_qty: receivedQty,
        received_date: receivedDate || new Date().toISOString(),
      });
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('[PI Allocations Service] Error updating received:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to update received quantity',
        data: null,
      };
    }
  },
};

export default piAllocationsService;

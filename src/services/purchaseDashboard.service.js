import apiClient from './api/client';
import { ENDPOINTS } from './api/endpoints';
import { USE_MOCK_DATA } from './api/config';

// Import mock data for fallback
import piAllocationsData from '../mock/piAllocations.json';
import suppliersData from '../mock/suppliers.json';

/**
 * Purchase Dashboard Service
 * Handles all purchase dashboard related API calls
 */

const purchaseDashboardService = {
  /**
   * Get dashboard summary
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  getSummary: async () => {
    try {
      // Use mock data if enabled
      if (USE_MOCK_DATA) {
        const allocations = piAllocationsData.piAllocations || [];
        const suppliers = suppliersData.suppliers || [];

        const pendingAllocations = allocations.filter(
          a => !a.summary?.allocation_complete
        ).length;

        const activeSuppliers = suppliers.filter(s => s.status === 'ACTIVE').length;

        const ordersInProgress = allocations.filter(a =>
          a.allocations?.some(alloc => alloc.status === 'ORDERED')
        ).length;

        const itemsPendingReceipt = allocations.reduce((sum, a) => {
          return sum + (a.allocations?.reduce((s, alloc) =>
            s + ((alloc.status === 'ORDERED' || alloc.status === 'PARTIAL_RECEIVED')
              ? (alloc.allocated_qty - (alloc.received_qty || 0))
              : 0), 0) || 0);
        }, 0);

        const totalPurchaseValue = allocations.reduce((sum, a) =>
          sum + (a.avg_cost_price * a.total_pi_qty || 0), 0);

        const avgProfitMargin = allocations.length > 0
          ? allocations.reduce((sum, a) => sum + (a.profit_margin || 0), 0) / allocations.length
          : 0;

        return {
          success: true,
          data: {
            summary: {
              pending_allocations: pendingAllocations,
              active_suppliers: activeSuppliers,
              orders_in_progress: ordersInProgress,
              items_pending_receipt: itemsPendingReceipt,
              total_purchase_value: totalPurchaseValue,
              avg_profit_margin: avgProfitMargin,
            }
          },
        };
      }

      const response = await apiClient.get(ENDPOINTS.PURCHASE_DASHBOARD.SUMMARY);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('[Purchase Dashboard Service] Error fetching summary:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch dashboard summary',
        data: null,
      };
    }
  },

  /**
   * Get supplier statistics
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  getSupplierStats: async () => {
    try {
      // Use mock data if enabled
      if (USE_MOCK_DATA) {
        const suppliers = suppliersData.suppliers || [];
        const supplierStats = suppliers.map(s => ({
          supplier_id: s.supplier_id,
          supplier_name: s.supplier_name,
          total_orders: s.performance?.total_orders || 0,
          total_value: s.performance?.total_value || 0,
          pending_orders: Math.floor(Math.random() * 5),
          on_time_rate: s.performance?.on_time_delivery_rate || 100,
        }));

        return {
          success: true,
          data: { suppliers: supplierStats },
        };
      }

      const response = await apiClient.get(ENDPOINTS.PURCHASE_DASHBOARD.SUPPLIER_STATS);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('[Purchase Dashboard Service] Error fetching supplier stats:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch supplier statistics',
        data: { suppliers: [] },
      };
    }
  },

  /**
   * Get pending allocations
   * @param {Object} params - Query parameters (limit, priority)
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  getPendingAllocations: async (params = {}) => {
    try {
      // Use mock data if enabled
      if (USE_MOCK_DATA) {
        let pending = (piAllocationsData.piAllocations || []).filter(
          a => !a.summary?.allocation_complete
        );

        if (params.limit) {
          pending = pending.slice(0, params.limit);
        }

        return {
          success: true,
          data: { allocations: pending },
        };
      }

      const response = await apiClient.get(ENDPOINTS.PURCHASE_DASHBOARD.PENDING_ALLOCATIONS, { params });
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('[Purchase Dashboard Service] Error fetching pending allocations:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch pending allocations',
        data: { allocations: [] },
      };
    }
  },

  /**
   * Get allocation progress
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  getAllocationProgress: async () => {
    try {
      // Use mock data if enabled
      if (USE_MOCK_DATA) {
        const allocations = piAllocationsData.piAllocations || [];

        const totalItems = allocations.reduce((sum, a) => sum + a.total_pi_qty, 0);
        const allocated = allocations.reduce((sum, a) => sum + (a.summary?.allocated_qty || 0), 0);
        const ordered = allocations.reduce((sum, a) => sum + (a.summary?.ordered_qty || 0), 0);
        const received = allocations.reduce((sum, a) => sum + (a.summary?.received_qty || 0), 0);

        return {
          success: true,
          data: {
            progress: {
              total_items: totalItems,
              allocated: allocated,
              ordered: ordered,
              received: received,
              allocation_rate: totalItems > 0 ? (allocated / totalItems * 100).toFixed(1) : 0,
              fulfillment_rate: totalItems > 0 ? (received / totalItems * 100).toFixed(1) : 0,
            }
          },
        };
      }

      const response = await apiClient.get(ENDPOINTS.PURCHASE_DASHBOARD.ALLOCATION_PROGRESS);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('[Purchase Dashboard Service] Error fetching allocation progress:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch allocation progress',
        data: null,
      };
    }
  },

  /**
   * Get recent activity
   * @param {Object} params - Query parameters (limit, days)
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  getRecentActivity: async (params = {}) => {
    try {
      // Use mock data if enabled
      if (USE_MOCK_DATA) {
        const allocations = piAllocationsData.piAllocations || [];
        const recentActivity = allocations
          .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
          .slice(0, params.limit || 20)
          .map(a => ({
            type: 'allocation',
            allocation_id: a.allocation_id,
            pi_number: a.pi_number,
            product_name: a.product_name,
            status: a.summary?.allocation_complete ? 'Completed' : 'In Progress',
            timestamp: a.updated_at,
          }));

        return {
          success: true,
          data: { activities: recentActivity },
        };
      }

      const response = await apiClient.get(ENDPOINTS.PURCHASE_DASHBOARD.RECENT_ACTIVITY, { params });
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('[Purchase Dashboard Service] Error fetching recent activity:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch recent activity',
        data: { activities: [] },
      };
    }
  },
};

export default purchaseDashboardService;

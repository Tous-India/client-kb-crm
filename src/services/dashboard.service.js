import apiClient from './api/client';
import { ENDPOINTS } from './api/endpoints';

/**
 * Dashboard Service
 * Handles dashboard-related API operations for buyers and admins
 */

const dashboardService = {
  /**
   * Get buyer dashboard stats
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  getBuyerStats: async () => {
    try {
      const response = await apiClient.get(ENDPOINTS.DASHBOARD.BUYER_STATS);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('[Dashboard Service] Error fetching buyer stats:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch dashboard stats',
        data: null,
      };
    }
  },

  /**
   * Get buyer recent orders
   * @param {number} limit - Number of orders to fetch
   * @returns {Promise<{success: boolean, data: Array, error: string}>}
   */
  getBuyerRecentOrders: async (limit = 10) => {
    try {
      const response = await apiClient.get(ENDPOINTS.DASHBOARD.BUYER_RECENT_ORDERS, {
        params: { limit },
      });
      return {
        success: true,
        data: response.data.data.orders,
      };
    } catch (error) {
      console.error('[Dashboard Service] Error fetching buyer recent orders:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch recent orders',
        data: [],
      };
    }
  },

  /**
   * Get admin dashboard summary
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  getSummary: async () => {
    try {
      const response = await apiClient.get(ENDPOINTS.DASHBOARD.SUMMARY);
      return {
        success: true,
        data: response.data.data.summary,
      };
    } catch (error) {
      console.error('[Dashboard Service] Error fetching summary:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch dashboard summary',
        data: null,
      };
    }
  },
};

export default dashboardService;

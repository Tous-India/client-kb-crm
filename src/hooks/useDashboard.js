import { useQuery } from '@tanstack/react-query';
import dashboardService from '../services/dashboard.service';

// Query keys
export const dashboardKeys = {
  all: ['dashboard'],
  buyerStats: () => [...dashboardKeys.all, 'buyer-stats'],
  buyerRecentOrders: (limit) => [...dashboardKeys.all, 'buyer-recent-orders', limit],
  adminSummary: () => [...dashboardKeys.all, 'admin-summary'],
};

/**
 * Hook to fetch buyer dashboard stats
 * @returns {Object} React Query result with stats, creditInfo, customerId, recentOrders
 */
export const useBuyerDashboardStats = () => {
  return useQuery({
    queryKey: dashboardKeys.buyerStats(),
    queryFn: async () => {
      const result = await dashboardService.getBuyerStats();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to fetch buyer recent orders
 * @param {number} limit - Number of orders to fetch
 * @returns {Object} React Query result
 */
export const useBuyerRecentOrders = (limit = 10) => {
  return useQuery({
    queryKey: dashboardKeys.buyerRecentOrders(limit),
    queryFn: async () => {
      const result = await dashboardService.getBuyerRecentOrders(limit);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};

/**
 * Hook to fetch admin dashboard summary
 * @returns {Object} React Query result
 */
export const useAdminDashboardSummary = () => {
  return useQuery({
    queryKey: dashboardKeys.adminSummary(),
    queryFn: async () => {
      const result = await dashboardService.getSummary();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};

export default useBuyerDashboardStats;

import { describe, it, expect, vi, beforeEach } from 'vitest';
import dashboardService from '../../services/dashboard.service';
import apiClient from '../../services/api/client';

// Mock apiClient
vi.mock('../../services/api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('dashboardService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getBuyerStats', () => {
    it('should fetch buyer stats successfully', async () => {
      const mockStats = {
        totalOrders: 25,
        pendingOrders: 5,
        totalSpent: 50000,
        activeQuotations: 3,
      };
      apiClient.get.mockResolvedValue({
        data: { data: mockStats },
      });

      const result = await dashboardService.getBuyerStats();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockStats);
      expect(result.data.totalOrders).toBe(25);
    });

    it('should handle error', async () => {
      apiClient.get.mockRejectedValue({
        response: { data: { message: 'Failed to fetch dashboard stats' } },
      });

      const result = await dashboardService.getBuyerStats();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to fetch dashboard stats');
      expect(result.data).toBeNull();
    });

    it('should handle network error', async () => {
      apiClient.get.mockRejectedValue(new Error('Network error'));

      const result = await dashboardService.getBuyerStats();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });
  });

  describe('getBuyerRecentOrders', () => {
    it('should fetch recent orders with default limit', async () => {
      const mockOrders = [
        { _id: '1', order_id: 'ORD-00001', status: 'OPEN' },
        { _id: '2', order_id: 'ORD-00002', status: 'DISPATCHED' },
      ];
      apiClient.get.mockResolvedValue({
        data: { data: { orders: mockOrders } },
      });

      const result = await dashboardService.getBuyerRecentOrders();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockOrders);
      expect(apiClient.get).toHaveBeenCalledWith(
        expect.any(String),
        { params: { limit: 10 } }
      );
    });

    it('should fetch recent orders with custom limit', async () => {
      apiClient.get.mockResolvedValue({
        data: { data: { orders: [] } },
      });

      await dashboardService.getBuyerRecentOrders(5);

      expect(apiClient.get).toHaveBeenCalledWith(
        expect.any(String),
        { params: { limit: 5 } }
      );
    });

    it('should handle error', async () => {
      apiClient.get.mockRejectedValue({
        response: { data: { message: 'Failed to fetch recent orders' } },
      });

      const result = await dashboardService.getBuyerRecentOrders();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to fetch recent orders');
      expect(result.data).toEqual([]);
    });
  });

  describe('getSummary', () => {
    it('should fetch admin dashboard summary', async () => {
      const mockSummary = {
        totalProducts: 150,
        totalOrders: 500,
        totalRevenue: 1000000,
        totalBuyers: 50,
        pendingOrders: 20,
        completedOrders: 480,
      };
      apiClient.get.mockResolvedValue({
        data: { data: { summary: mockSummary } },
      });

      const result = await dashboardService.getSummary();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockSummary);
      expect(result.data.totalProducts).toBe(150);
    });

    it('should handle error', async () => {
      apiClient.get.mockRejectedValue({
        response: { data: { message: 'Failed to fetch dashboard summary' } },
      });

      const result = await dashboardService.getSummary();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to fetch dashboard summary');
      expect(result.data).toBeNull();
    });

    it('should handle network error', async () => {
      apiClient.get.mockRejectedValue(new Error('Connection refused'));

      const result = await dashboardService.getSummary();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Connection refused');
    });
  });
});

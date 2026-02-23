import { describe, it, expect, vi, beforeEach } from 'vitest';
import purchaseDashboardService from '../../services/purchaseDashboard.service';
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

// Mock config
vi.mock('../../services/api/config', () => ({
  USE_MOCK_DATA: false,
}));

// Mock data files
vi.mock('../../mock/piAllocations.json', () => ({
  default: { piAllocations: [] },
}));
vi.mock('../../mock/suppliers.json', () => ({
  default: { suppliers: [] },
}));

describe('purchaseDashboardService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getSummary', () => {
    it('should fetch dashboard summary successfully', async () => {
      const mockSummary = {
        pending_allocations: 10,
        active_suppliers: 25,
        orders_in_progress: 15,
        items_pending_receipt: 500,
        total_purchase_value: 100000,
        avg_profit_margin: 25.5,
      };
      apiClient.get.mockResolvedValue({
        data: { data: { summary: mockSummary } },
      });

      const result = await purchaseDashboardService.getSummary();

      expect(result.success).toBe(true);
      expect(result.data.summary).toEqual(mockSummary);
    });

    it('should handle error', async () => {
      apiClient.get.mockRejectedValue({
        response: { data: { message: 'Failed to fetch dashboard summary' } },
      });

      const result = await purchaseDashboardService.getSummary();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to fetch dashboard summary');
      expect(result.data).toBeNull();
    });

    it('should handle network error', async () => {
      apiClient.get.mockRejectedValue(new Error('Network error'));

      const result = await purchaseDashboardService.getSummary();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });
  });

  describe('getSupplierStats', () => {
    it('should fetch supplier statistics successfully', async () => {
      const mockSuppliers = [
        { supplier_id: 'SUP-001', supplier_name: 'Supplier A', total_orders: 10, on_time_rate: 95 },
        { supplier_id: 'SUP-002', supplier_name: 'Supplier B', total_orders: 20, on_time_rate: 98 },
      ];
      apiClient.get.mockResolvedValue({
        data: { data: { suppliers: mockSuppliers } },
      });

      const result = await purchaseDashboardService.getSupplierStats();

      expect(result.success).toBe(true);
      expect(result.data.suppliers).toEqual(mockSuppliers);
      expect(result.data.suppliers).toHaveLength(2);
    });

    it('should handle error', async () => {
      apiClient.get.mockRejectedValue({
        response: { data: { message: 'Failed to fetch supplier statistics' } },
      });

      const result = await purchaseDashboardService.getSupplierStats();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to fetch supplier statistics');
    });
  });

  describe('getPendingAllocations', () => {
    it('should fetch pending allocations successfully', async () => {
      const mockAllocations = [
        { allocation_id: 'ALC-001', pi_number: 'PI-001', status: 'UNALLOCATED' },
        { allocation_id: 'ALC-002', pi_number: 'PI-002', status: 'PARTIAL' },
      ];
      apiClient.get.mockResolvedValue({
        data: { data: { allocations: mockAllocations } },
      });

      const result = await purchaseDashboardService.getPendingAllocations();

      expect(result.success).toBe(true);
      expect(result.data.allocations).toEqual(mockAllocations);
    });

    it('should pass params to API', async () => {
      apiClient.get.mockResolvedValue({
        data: { data: { allocations: [] } },
      });

      await purchaseDashboardService.getPendingAllocations({ limit: 5 });

      expect(apiClient.get).toHaveBeenCalledWith(
        expect.any(String),
        { params: { limit: 5 } }
      );
    });

    it('should handle error', async () => {
      apiClient.get.mockRejectedValue({
        response: { data: { message: 'Failed to fetch pending allocations' } },
      });

      const result = await purchaseDashboardService.getPendingAllocations();

      expect(result.success).toBe(false);
      expect(result.data.allocations).toEqual([]);
    });
  });

  describe('getAllocationProgress', () => {
    it('should fetch allocation progress successfully', async () => {
      const mockProgress = {
        total_items: 1000,
        allocated: 800,
        ordered: 600,
        received: 500,
        allocation_rate: '80.0',
        fulfillment_rate: '50.0',
      };
      apiClient.get.mockResolvedValue({
        data: { data: { progress: mockProgress } },
      });

      const result = await purchaseDashboardService.getAllocationProgress();

      expect(result.success).toBe(true);
      expect(result.data.progress).toEqual(mockProgress);
    });

    it('should handle error', async () => {
      apiClient.get.mockRejectedValue({
        response: { data: { message: 'Failed to fetch allocation progress' } },
      });

      const result = await purchaseDashboardService.getAllocationProgress();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to fetch allocation progress');
    });
  });

  describe('getRecentActivity', () => {
    it('should fetch recent activity successfully', async () => {
      const mockActivities = [
        { type: 'allocation', allocation_id: 'ALC-001', timestamp: '2024-01-15T10:00:00Z' },
        { type: 'allocation', allocation_id: 'ALC-002', timestamp: '2024-01-14T15:00:00Z' },
      ];
      apiClient.get.mockResolvedValue({
        data: { data: { activities: mockActivities } },
      });

      const result = await purchaseDashboardService.getRecentActivity();

      expect(result.success).toBe(true);
      expect(result.data.activities).toEqual(mockActivities);
    });

    it('should pass params to API', async () => {
      apiClient.get.mockResolvedValue({
        data: { data: { activities: [] } },
      });

      await purchaseDashboardService.getRecentActivity({ limit: 10, days: 7 });

      expect(apiClient.get).toHaveBeenCalledWith(
        expect.any(String),
        { params: { limit: 10, days: 7 } }
      );
    });

    it('should handle error', async () => {
      apiClient.get.mockRejectedValue({
        response: { data: { message: 'Failed to fetch recent activity' } },
      });

      const result = await purchaseDashboardService.getRecentActivity();

      expect(result.success).toBe(false);
      expect(result.data.activities).toEqual([]);
    });
  });
});

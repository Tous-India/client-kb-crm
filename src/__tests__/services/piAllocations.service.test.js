import { describe, it, expect, vi, beforeEach } from 'vitest';
import piAllocationsService from '../../services/piAllocations.service';
import apiClient from '../../services/api/client';

// Mock apiClient
vi.mock('../../services/api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock config
vi.mock('../../services/api/config', () => ({
  USE_MOCK_DATA: false,
}));

// Mock piAllocations.json
vi.mock('../../mock/piAllocations.json', () => ({
  default: { piAllocations: [] },
}));

describe('piAllocationsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('should fetch all allocations successfully', async () => {
      const mockAllocations = [
        { _id: '1', allocation_id: 'ALC-00001', pi_number: 'PI-001' },
        { _id: '2', allocation_id: 'ALC-00002', pi_number: 'PI-002' },
      ];
      apiClient.get.mockResolvedValue({
        data: { data: { allocations: mockAllocations, pagination: { total: 2 } } },
      });

      const result = await piAllocationsService.getAll();

      expect(result.success).toBe(true);
      expect(result.data.allocations).toEqual(mockAllocations);
    });

    it('should pass params to API', async () => {
      apiClient.get.mockResolvedValue({
        data: { data: { allocations: [], pagination: {} } },
      });

      await piAllocationsService.getAll({ status: 'ORDERED', page: 1 });

      expect(apiClient.get).toHaveBeenCalledWith(
        expect.any(String),
        { params: { status: 'ORDERED', page: 1 } }
      );
    });

    it('should handle error', async () => {
      apiClient.get.mockRejectedValue({
        response: { data: { message: 'Server error' } },
      });

      const result = await piAllocationsService.getAll();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Server error');
    });
  });

  describe('getById', () => {
    it('should fetch allocation by ID', async () => {
      const mockAllocation = { _id: '123', allocation_id: 'ALC-00001' };
      apiClient.get.mockResolvedValue({
        data: { data: { allocation: mockAllocation } },
      });

      const result = await piAllocationsService.getById('123');

      expect(result.success).toBe(true);
      expect(result.data.allocation).toEqual(mockAllocation);
    });

    it('should handle not found error', async () => {
      apiClient.get.mockRejectedValue({
        response: { data: { message: 'Allocation not found' } },
      });

      const result = await piAllocationsService.getById('invalid');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Allocation not found');
    });
  });

  describe('getByPI', () => {
    it('should fetch allocations by Proforma Invoice ID', async () => {
      const mockAllocations = [{ _id: '1', pi_id: 'pi123' }];
      apiClient.get.mockResolvedValue({
        data: { data: { allocations: mockAllocations } },
      });

      const result = await piAllocationsService.getByPI('pi123');

      expect(result.success).toBe(true);
      expect(result.data.allocations).toEqual(mockAllocations);
    });
  });

  describe('create', () => {
    it('should create allocation successfully', async () => {
      const allocationData = { pi_id: 'pi123', product_id: 'prod123', quantity: 100 };
      const mockAllocation = { _id: '123', allocation_id: 'ALC-00003', ...allocationData };
      apiClient.post.mockResolvedValue({
        data: { data: { allocation: mockAllocation } },
      });

      const result = await piAllocationsService.create(allocationData);

      expect(result.success).toBe(true);
      expect(result.data.allocation.allocation_id).toBe('ALC-00003');
    });

    it('should handle create error', async () => {
      apiClient.post.mockRejectedValue({
        response: { data: { message: 'Invalid PI' } },
      });

      const result = await piAllocationsService.create({});

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid PI');
    });
  });

  describe('update', () => {
    it('should update allocation successfully', async () => {
      apiClient.put.mockResolvedValue({
        data: { data: { allocation: { _id: '123', quantity: 150 } } },
      });

      const result = await piAllocationsService.update('123', { quantity: 150 });

      expect(result.success).toBe(true);
    });

    it('should handle update error', async () => {
      apiClient.put.mockRejectedValue({
        response: { data: { message: 'Update failed' } },
      });

      const result = await piAllocationsService.update('123', {});

      expect(result.success).toBe(false);
      expect(result.error).toBe('Update failed');
    });
  });

  describe('delete', () => {
    it('should delete allocation successfully', async () => {
      apiClient.delete.mockResolvedValue({});

      const result = await piAllocationsService.delete('123');

      expect(result.success).toBe(true);
    });

    it('should handle delete error', async () => {
      apiClient.delete.mockRejectedValue({
        response: { data: { message: 'Cannot delete ordered allocation' } },
      });

      const result = await piAllocationsService.delete('123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cannot delete ordered allocation');
    });
  });

  describe('bulkSave', () => {
    it('should bulk save allocations', async () => {
      const allocations = [
        { pi_id: 'pi1', product_id: 'p1', quantity: 10 },
        { pi_id: 'pi1', product_id: 'p2', quantity: 20 },
      ];
      apiClient.post.mockResolvedValue({
        data: { data: { allocations: [], saved: 2 } },
      });

      const result = await piAllocationsService.bulkSave(allocations);

      expect(result.success).toBe(true);
      expect(result.data.saved).toBe(2);
      expect(apiClient.post).toHaveBeenCalledWith(
        expect.any(String),
        { allocations }
      );
    });
  });

  describe('getSummary', () => {
    it('should fetch allocation summary', async () => {
      const mockSummary = {
        total_allocations: 100,
        by_status: { ALLOCATED: 60, PARTIAL: 30, UNALLOCATED: 10 },
        total_value: 500000,
        total_cost: 350000,
        avg_profit_margin: 30,
      };
      apiClient.get.mockResolvedValue({
        data: { data: { summary: mockSummary } },
      });

      const result = await piAllocationsService.getSummary();

      expect(result.success).toBe(true);
      expect(result.data.summary).toEqual(mockSummary);
    });
  });

  describe('updateStatus', () => {
    it('should update allocation status', async () => {
      apiClient.patch.mockResolvedValue({
        data: { data: { allocation: { allocation_id: '123', status: 'ORDERED' } } },
      });

      const result = await piAllocationsService.updateStatus('123', 0, 'ORDERED', 'SPO-001');

      expect(result.success).toBe(true);
      expect(apiClient.patch).toHaveBeenCalledWith(
        expect.any(String),
        { allocation_index: 0, status: 'ORDERED', spo_number: 'SPO-001' }
      );
    });
  });

  describe('updateReceived', () => {
    it('should update received quantity', async () => {
      apiClient.patch.mockResolvedValue({
        data: { data: { allocation: { allocation_id: '123', received_qty: 50 } } },
      });

      const result = await piAllocationsService.updateReceived('123', 0, 50, '2024-01-15');

      expect(result.success).toBe(true);
      expect(apiClient.patch).toHaveBeenCalledWith(
        expect.any(String),
        { allocation_index: 0, received_qty: 50, received_date: '2024-01-15' }
      );
    });

    it('should use default date if not provided', async () => {
      apiClient.patch.mockResolvedValue({
        data: { data: { allocation: {} } },
      });

      await piAllocationsService.updateReceived('123', 0, 50);

      expect(apiClient.patch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          allocation_index: 0,
          received_qty: 50,
          received_date: expect.any(String),
        })
      );
    });
  });
});

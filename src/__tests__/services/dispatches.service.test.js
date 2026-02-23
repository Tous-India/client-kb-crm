import { describe, it, expect, vi, beforeEach } from 'vitest';
import dispatchesService from '../../services/dispatches.service';
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

describe('dispatchesService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getMyDispatches', () => {
    it('should fetch buyer dispatches successfully', async () => {
      const mockDispatches = [
        { _id: '1', dispatch_id: 'DSP-00001', status: 'DISPATCHED' },
        { _id: '2', dispatch_id: 'DSP-00002', status: 'DELIVERED' },
      ];
      apiClient.get.mockResolvedValue({
        data: { data: mockDispatches, pagination: { total: 2 } },
      });

      const result = await dispatchesService.getMyDispatches();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockDispatches);
    });

    it('should pass params to API', async () => {
      apiClient.get.mockResolvedValue({
        data: { data: [], pagination: {} },
      });

      await dispatchesService.getMyDispatches({ status: 'DELIVERED' });

      expect(apiClient.get).toHaveBeenCalledWith(
        expect.any(String),
        { params: { status: 'DELIVERED' } }
      );
    });

    it('should handle error', async () => {
      apiClient.get.mockRejectedValue({
        response: { data: { message: 'Failed to fetch' } },
      });

      const result = await dispatchesService.getMyDispatches();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to fetch');
      expect(result.data).toEqual([]);
    });
  });

  describe('getAll', () => {
    it('should fetch all dispatches', async () => {
      const mockDispatches = [{ _id: '1', dispatch_id: 'DSP-00001' }];
      apiClient.get.mockResolvedValue({
        data: { data: mockDispatches, pagination: { total: 1 } },
      });

      const result = await dispatchesService.getAll();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockDispatches);
    });

    it('should pass params', async () => {
      apiClient.get.mockResolvedValue({
        data: { data: [] },
      });

      await dispatchesService.getAll({ source_type: 'ORDER' });

      expect(apiClient.get).toHaveBeenCalledWith(
        expect.any(String),
        { params: { source_type: 'ORDER' } }
      );
    });
  });

  describe('getById', () => {
    it('should fetch dispatch by ID', async () => {
      const mockDispatch = { _id: '123', dispatch_id: 'DSP-00001' };
      apiClient.get.mockResolvedValue({
        data: { data: mockDispatch },
      });

      const result = await dispatchesService.getById('123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockDispatch);
    });

    it('should handle not found error', async () => {
      apiClient.get.mockRejectedValue({
        response: { data: { message: 'Dispatch not found' } },
      });

      const result = await dispatchesService.getById('invalid');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Dispatch not found');
    });
  });

  describe('getBySource', () => {
    it('should fetch dispatches by source', async () => {
      const mockDispatches = [{ _id: '1', source_type: 'ORDER' }];
      apiClient.get.mockResolvedValue({
        data: { data: mockDispatches },
      });

      const result = await dispatchesService.getBySource('ORDER', 'order123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockDispatches);
    });

    it('should handle error', async () => {
      apiClient.get.mockRejectedValue({
        response: { data: { message: 'Not found' } },
      });

      const result = await dispatchesService.getBySource('ORDER', 'invalid');

      expect(result.success).toBe(false);
      expect(result.data.dispatches).toEqual([]);
    });
  });

  describe('getSummary', () => {
    it('should get dispatch summary', async () => {
      const mockSummary = { total_dispatched: 50, pending: 10 };
      apiClient.get.mockResolvedValue({
        data: { data: mockSummary },
      });

      const result = await dispatchesService.getSummary('ORDER', 'order123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockSummary);
    });
  });

  describe('create', () => {
    it('should create dispatch successfully', async () => {
      const dispatchData = {
        source_type: 'ORDER',
        source_id: 'order123',
        items: [{ product_id: 'p1', quantity: 10 }],
      };
      const mockDispatch = { _id: '123', dispatch_id: 'DSP-00001', ...dispatchData };
      apiClient.post.mockResolvedValue({
        data: { data: mockDispatch },
      });

      const result = await dispatchesService.create(dispatchData);

      expect(result.success).toBe(true);
      expect(result.data.dispatch_id).toBe('DSP-00001');
    });

    it('should handle create error', async () => {
      apiClient.post.mockRejectedValue({
        response: { data: { message: 'Invalid dispatch data' } },
      });

      const result = await dispatchesService.create({});

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid dispatch data');
    });
  });

  describe('delete', () => {
    it('should delete dispatch successfully', async () => {
      apiClient.delete.mockResolvedValue({});

      const result = await dispatchesService.delete('123');

      expect(result.success).toBe(true);
    });

    it('should handle delete error', async () => {
      apiClient.delete.mockRejectedValue({
        response: { data: { message: 'Cannot delete' } },
      });

      const result = await dispatchesService.delete('123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cannot delete');
    });
  });

  describe('dispatchFromPI', () => {
    it('should dispatch from Proforma Invoice', async () => {
      const dispatchData = { items: [{ product_id: 'p1', quantity: 5 }] };
      apiClient.post.mockResolvedValue({
        data: { data: { dispatch_id: 'DSP-00001' } },
      });

      const result = await dispatchesService.dispatchFromPI('pi123', dispatchData);

      expect(result.success).toBe(true);
      expect(apiClient.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          source_type: 'PROFORMA_INVOICE',
          source_id: 'pi123',
        })
      );
    });
  });

  describe('dispatchFromOrder', () => {
    it('should dispatch from Order', async () => {
      const dispatchData = { items: [{ product_id: 'p1', quantity: 5 }] };
      apiClient.post.mockResolvedValue({
        data: { data: { dispatch_id: 'DSP-00001' } },
      });

      const result = await dispatchesService.dispatchFromOrder('order123', dispatchData);

      expect(result.success).toBe(true);
      expect(apiClient.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          source_type: 'ORDER',
          source_id: 'order123',
        })
      );
    });
  });
});

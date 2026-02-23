import { describe, it, expect, vi, beforeEach } from 'vitest';
import purchaseOrdersService from '../../services/purchaseOrders.service';
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

// Mock purchaseOrders.json
vi.mock('../../mock/purchaseOrders.json', () => ({
  default: { purchaseOrders: [] },
}));

describe('purchaseOrdersService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('should fetch all purchase orders successfully', async () => {
      const mockOrders = [
        { _id: '1', po_id: 'PO-2024-001', status: 'PENDING' },
        { _id: '2', po_id: 'PO-2024-002', status: 'CONVERTED' },
      ];
      apiClient.get.mockResolvedValue({
        data: mockOrders,
      });

      const result = await purchaseOrdersService.getAll();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockOrders);
    });

    it('should pass params to API', async () => {
      apiClient.get.mockResolvedValue({
        data: [],
      });

      await purchaseOrdersService.getAll({ status: 'PENDING', page: 1 });

      expect(apiClient.get).toHaveBeenCalledWith(
        expect.any(String),
        { params: { status: 'PENDING', page: 1 } }
      );
    });

    it('should handle error', async () => {
      apiClient.get.mockRejectedValue({
        response: { data: { message: 'Server error' } },
      });

      const result = await purchaseOrdersService.getAll();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Server error');
      expect(result.data).toEqual([]);
    });
  });

  describe('getById', () => {
    it('should fetch purchase order by ID', async () => {
      const mockOrder = { _id: '123', po_id: 'PO-2024-001' };
      apiClient.get.mockResolvedValue({
        data: mockOrder,
      });

      const result = await purchaseOrdersService.getById('123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockOrder);
    });

    it('should handle not found error', async () => {
      apiClient.get.mockRejectedValue({
        response: { data: { message: 'Purchase order not found' } },
      });

      const result = await purchaseOrdersService.getById('invalid');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Purchase order not found');
    });
  });

  describe('getByStatus', () => {
    it('should fetch orders by status', async () => {
      const mockOrders = [{ _id: '1', status: 'PENDING' }];
      apiClient.get.mockResolvedValue({
        data: mockOrders,
      });

      const result = await purchaseOrdersService.getByStatus('PENDING');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockOrders);
    });
  });

  describe('convertToQuote', () => {
    it('should convert purchase order to quotation', async () => {
      const quoteData = { items: [], notes: 'Test' };
      apiClient.post.mockResolvedValue({
        data: { quote_id: 'QUO-2024-001' },
      });

      const result = await purchaseOrdersService.convertToQuote('po123', quoteData);

      expect(result.success).toBe(true);
      expect(result.data.quote_id).toBe('QUO-2024-001');
    });

    it('should handle convert error', async () => {
      apiClient.post.mockRejectedValue({
        response: { data: { message: 'Conversion failed' } },
      });

      const result = await purchaseOrdersService.convertToQuote('po123', {});

      expect(result.success).toBe(false);
      expect(result.error).toBe('Conversion failed');
    });
  });

  describe('create', () => {
    it('should create purchase order successfully', async () => {
      const poData = { items: [], buyer: 'buyer123' };
      apiClient.post.mockResolvedValue({
        data: { po_id: 'PO-2024-003', ...poData, status: 'PENDING' },
      });

      const result = await purchaseOrdersService.create(poData);

      expect(result.success).toBe(true);
      expect(result.data.po_id).toBe('PO-2024-003');
      expect(result.data.status).toBe('PENDING');
    });

    it('should handle create error', async () => {
      apiClient.post.mockRejectedValue({
        response: { data: { message: 'Invalid buyer' } },
      });

      const result = await purchaseOrdersService.create({});

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid buyer');
    });
  });

  describe('update', () => {
    it('should update purchase order successfully', async () => {
      apiClient.put.mockResolvedValue({
        data: { po_id: '123', notes: 'Updated' },
      });

      const result = await purchaseOrdersService.update('123', { notes: 'Updated' });

      expect(result.success).toBe(true);
      expect(result.data.notes).toBe('Updated');
    });

    it('should handle update error', async () => {
      apiClient.put.mockRejectedValue({
        response: { data: { message: 'Update failed' } },
      });

      const result = await purchaseOrdersService.update('123', {});

      expect(result.success).toBe(false);
      expect(result.error).toBe('Update failed');
    });
  });

  describe('delete', () => {
    it('should delete purchase order successfully', async () => {
      apiClient.delete.mockResolvedValue({});

      const result = await purchaseOrdersService.delete('123');

      expect(result.success).toBe(true);
    });

    it('should handle delete error', async () => {
      apiClient.delete.mockRejectedValue({
        response: { data: { message: 'Cannot delete converted order' } },
      });

      const result = await purchaseOrdersService.delete('123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cannot delete converted order');
    });
  });
});

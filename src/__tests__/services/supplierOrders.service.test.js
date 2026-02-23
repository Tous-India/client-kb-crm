import { describe, it, expect, vi, beforeEach } from 'vitest';
import supplierOrdersService from '../../services/supplierOrders.service';
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

// Mock supplierOrders.json
vi.mock('../../mock/supplierOrders.json', () => ({
  default: { supplierOrders: [] },
}));

describe('supplierOrdersService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('should fetch all supplier orders successfully', async () => {
      const mockOrders = [
        { _id: '1', spo_id: 'SPO-2024-001', status: 'DRAFT' },
        { _id: '2', spo_id: 'SPO-2024-002', status: 'ORDERED' },
      ];
      apiClient.get.mockResolvedValue({
        data: { data: { supplierOrders: mockOrders, pagination: { total: 2 } } },
      });

      const result = await supplierOrdersService.getAll();

      expect(result.success).toBe(true);
      expect(result.data.supplierOrders).toEqual(mockOrders);
    });

    it('should pass params to API', async () => {
      apiClient.get.mockResolvedValue({
        data: { data: { supplierOrders: [], pagination: {} } },
      });

      await supplierOrdersService.getAll({ status: 'ORDERED', page: 1 });

      expect(apiClient.get).toHaveBeenCalledWith(
        expect.any(String),
        { params: { status: 'ORDERED', page: 1 } }
      );
    });

    it('should handle error', async () => {
      apiClient.get.mockRejectedValue({
        response: { data: { message: 'Server error' } },
      });

      const result = await supplierOrdersService.getAll();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Server error');
    });
  });

  describe('getById', () => {
    it('should fetch supplier order by ID', async () => {
      const mockOrder = { _id: '123', spo_id: 'SPO-2024-001' };
      apiClient.get.mockResolvedValue({
        data: { data: { supplierOrder: mockOrder } },
      });

      const result = await supplierOrdersService.getById('123');

      expect(result.success).toBe(true);
      expect(result.data.supplierOrder).toEqual(mockOrder);
    });

    it('should handle not found error', async () => {
      apiClient.get.mockRejectedValue({
        response: { data: { message: 'Supplier order not found' } },
      });

      const result = await supplierOrdersService.getById('invalid');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Supplier order not found');
    });
  });

  describe('getBySupplier', () => {
    it('should fetch orders by supplier ID', async () => {
      const mockOrders = [{ _id: '1', supplier_id: 'sup123' }];
      apiClient.get.mockResolvedValue({
        data: { data: { supplierOrders: mockOrders } },
      });

      const result = await supplierOrdersService.getBySupplier('sup123');

      expect(result.success).toBe(true);
      expect(result.data.supplierOrders).toEqual(mockOrders);
    });
  });

  describe('create', () => {
    it('should create supplier order successfully', async () => {
      const orderData = { supplier_id: 'sup123', items: [] };
      const mockOrder = { _id: '123', spo_id: 'SPO-2024-003', ...orderData };
      apiClient.post.mockResolvedValue({
        data: { data: { supplierOrder: mockOrder } },
      });

      const result = await supplierOrdersService.create(orderData);

      expect(result.success).toBe(true);
      expect(result.data.supplierOrder.spo_id).toBe('SPO-2024-003');
    });

    it('should handle create error', async () => {
      apiClient.post.mockRejectedValue({
        response: { data: { message: 'Invalid supplier' } },
      });

      const result = await supplierOrdersService.create({});

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid supplier');
    });
  });

  describe('update', () => {
    it('should update supplier order successfully', async () => {
      apiClient.put.mockResolvedValue({
        data: { data: { supplierOrder: { _id: '123', notes: 'Updated' } } },
      });

      const result = await supplierOrdersService.update('123', { notes: 'Updated' });

      expect(result.success).toBe(true);
    });

    it('should handle update error', async () => {
      apiClient.put.mockRejectedValue({
        response: { data: { message: 'Update failed' } },
      });

      const result = await supplierOrdersService.update('123', {});

      expect(result.success).toBe(false);
      expect(result.error).toBe('Update failed');
    });
  });

  describe('delete', () => {
    it('should delete supplier order successfully', async () => {
      apiClient.delete.mockResolvedValue({});

      const result = await supplierOrdersService.delete('123');

      expect(result.success).toBe(true);
    });

    it('should handle delete error', async () => {
      apiClient.delete.mockRejectedValue({
        response: { data: { message: 'Cannot delete ordered item' } },
      });

      const result = await supplierOrdersService.delete('123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cannot delete ordered item');
    });
  });

  describe('updateStatus', () => {
    it('should update order status', async () => {
      apiClient.patch.mockResolvedValue({
        data: { data: { supplierOrder: { _id: '123', status: 'ORDERED' } } },
      });

      const result = await supplierOrdersService.updateStatus('123', 'ORDERED');

      expect(result.success).toBe(true);
      expect(result.data.supplierOrder.status).toBe('ORDERED');
    });
  });

  describe('addPayment', () => {
    it('should add payment to order', async () => {
      const paymentData = { amount: 5000, payment_method: 'BANK_TRANSFER' };
      apiClient.post.mockResolvedValue({
        data: { data: { supplierOrder: { _id: '123', payment_history: [paymentData] } } },
      });

      const result = await supplierOrdersService.addPayment('123', paymentData);

      expect(result.success).toBe(true);
    });
  });

  describe('receiveItems', () => {
    it('should receive items', async () => {
      const receiveData = { items: [{ product_id: 'p1', received_qty: 10 }] };
      apiClient.post.mockResolvedValue({
        data: { data: { supplierOrder: { _id: '123' } } },
      });

      const result = await supplierOrdersService.receiveItems('123', receiveData);

      expect(result.success).toBe(true);
    });
  });

  describe('getSummary', () => {
    it('should fetch summary statistics', async () => {
      const mockSummary = { total_orders: 50, draft: 5, ordered: 20, received: 25 };
      apiClient.get.mockResolvedValue({
        data: { data: { summary: mockSummary } },
      });

      const result = await supplierOrdersService.getSummary();

      expect(result.success).toBe(true);
      expect(result.data.summary).toEqual(mockSummary);
    });
  });
});

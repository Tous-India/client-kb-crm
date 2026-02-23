import { describe, it, expect, vi, beforeEach } from 'vitest';
import ordersService from '../../services/orders.service';
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

// Mock orders.json
vi.mock('../../mock/orders.json', () => ({
  default: { orders: [] },
}));

describe('ordersService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('should fetch all orders successfully', async () => {
      const mockOrders = [
        { _id: '1', order_id: 'ORD-00001', status: 'OPEN' },
        { _id: '2', order_id: 'ORD-00002', status: 'DISPATCHED' },
      ];
      apiClient.get.mockResolvedValue({
        data: { data: mockOrders, pagination: { total: 2 } },
      });

      const result = await ordersService.getAll();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockOrders);
    });

    it('should pass params to API', async () => {
      apiClient.get.mockResolvedValue({
        data: { data: [] },
      });

      await ordersService.getAll({ status: 'OPEN', page: 1 });

      expect(apiClient.get).toHaveBeenCalledWith(
        expect.any(String),
        { params: { status: 'OPEN', page: 1 } }
      );
    });

    it('should handle error', async () => {
      apiClient.get.mockRejectedValue({
        response: { data: { message: 'Failed to fetch orders' } },
      });

      const result = await ordersService.getAll();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to fetch orders');
      expect(result.data).toEqual([]);
    });
  });

  describe('getById', () => {
    it('should fetch order by ID', async () => {
      const mockOrder = { _id: '123', order_id: 'ORD-00001' };
      apiClient.get.mockResolvedValue({
        data: mockOrder,
      });

      const result = await ordersService.getById('123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockOrder);
    });

    it('should handle not found error', async () => {
      apiClient.get.mockRejectedValue({
        response: { data: { message: 'Order not found' } },
      });

      const result = await ordersService.getById('invalid');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Order not found');
    });
  });

  describe('getByStatus', () => {
    it('should fetch orders by status', async () => {
      const mockOrders = [{ _id: '1', status: 'OPEN' }];
      apiClient.get.mockResolvedValue({
        data: { data: mockOrders },
      });

      const result = await ordersService.getByStatus('OPEN');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockOrders);
    });
  });

  describe('dispatch', () => {
    it('should dispatch order successfully', async () => {
      apiClient.post.mockResolvedValue({
        data: { order_id: '123', status: 'DISPATCHED' },
      });

      const result = await ordersService.dispatch('123', { trackingNumber: 'TRK123' });

      expect(result.success).toBe(true);
      expect(result.data.status).toBe('DISPATCHED');
    });

    it('should handle dispatch error', async () => {
      apiClient.post.mockRejectedValue({
        response: { data: { message: 'Cannot dispatch' } },
      });

      const result = await ordersService.dispatch('123', {});

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cannot dispatch');
    });
  });

  describe('partialDispatch', () => {
    it('should partial dispatch order', async () => {
      const dispatchData = {
        items: [{ product_id: 'p1', quantity: 5 }],
      };
      apiClient.put.mockResolvedValue({
        data: { data: { order: {}, dispatch_record: {} } },
      });

      const result = await ordersService.partialDispatch('123', dispatchData);

      expect(result.success).toBe(true);
    });
  });

  describe('getOpenOrders', () => {
    it('should fetch open orders', async () => {
      const mockOrders = [{ _id: '1', status: 'OPEN' }];
      apiClient.get.mockResolvedValue({
        data: { data: mockOrders },
      });

      const result = await ordersService.getOpenOrders();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockOrders);
    });
  });

  describe('getDispatchedOrders', () => {
    it('should fetch dispatched orders', async () => {
      const mockOrders = [{ _id: '1', status: 'DISPATCHED' }];
      apiClient.get.mockResolvedValue({
        data: { data: mockOrders },
      });

      const result = await ordersService.getDispatchedOrders();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockOrders);
    });
  });

  describe('create', () => {
    it('should create order successfully', async () => {
      const orderData = { items: [], buyer: '123' };
      apiClient.post.mockResolvedValue({
        data: { order_id: 'ORD-00001', ...orderData },
      });

      const result = await ordersService.create(orderData);

      expect(result.success).toBe(true);
      expect(result.data.order_id).toBe('ORD-00001');
    });

    it('should handle create error', async () => {
      apiClient.post.mockRejectedValue({
        response: { data: { message: 'Validation failed' } },
      });

      const result = await ordersService.create({});

      expect(result.success).toBe(false);
      expect(result.error).toBe('Validation failed');
    });
  });

  describe('update', () => {
    it('should update order successfully', async () => {
      apiClient.put.mockResolvedValue({
        data: { order_id: '123', status: 'CONFIRMED' },
      });

      const result = await ordersService.update('123', { status: 'CONFIRMED' });

      expect(result.success).toBe(true);
    });
  });

  describe('delete', () => {
    it('should delete order successfully', async () => {
      apiClient.delete.mockResolvedValue({});

      const result = await ordersService.delete('123');

      expect(result.success).toBe(true);
    });

    it('should handle delete error', async () => {
      apiClient.delete.mockRejectedValue({
        response: { data: { message: 'Cannot delete' } },
      });

      const result = await ordersService.delete('123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cannot delete');
    });
  });

  describe('getByCustomerId', () => {
    it('should fetch orders by customer ID', async () => {
      apiClient.get.mockResolvedValue({
        data: { data: [] },
      });

      const result = await ordersService.getByCustomerId('cust123');

      expect(result.success).toBe(true);
    });
  });

  describe('getMyOrders', () => {
    it('should fetch logged-in buyer orders', async () => {
      const mockOrders = [{ _id: '1', order_id: 'ORD-00001' }];
      apiClient.get.mockResolvedValue({
        data: { data: mockOrders },
      });

      const result = await ordersService.getMyOrders();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockOrders);
    });
  });

  describe('getPendingOrders', () => {
    it('should fetch pending orders', async () => {
      apiClient.get.mockResolvedValue({
        data: { data: [] },
      });

      const result = await ordersService.getPendingOrders();

      expect(result.success).toBe(true);
    });
  });

  describe('convertToQuotation', () => {
    it('should convert order to quotation', async () => {
      apiClient.post.mockResolvedValue({
        data: { data: { order_id: '123', status: 'CONVERTED' } },
      });

      const result = await ordersService.convertToQuotation('123', {});

      expect(result.success).toBe(true);
      expect(result.data.status).toBe('CONVERTED');
    });
  });

  describe('submitQuoteRequest', () => {
    it('should submit quote request', async () => {
      const requestData = { items: [], notes: 'Test' };
      apiClient.post.mockResolvedValue({
        data: { data: { order_id: 'ORD-00001', status: 'PENDING' } },
      });

      const result = await ordersService.submitQuoteRequest(requestData);

      expect(result.success).toBe(true);
      expect(result.data.status).toBe('PENDING');
    });
  });

  describe('cloneOrder', () => {
    it('should clone order successfully', async () => {
      apiClient.post.mockResolvedValue({
        data: { data: { order: {}, source_order_id: '123' } },
      });

      const result = await ordersService.cloneOrder('123', {});

      expect(result.success).toBe(true);
      expect(result.data.source_order_id).toBe('123');
    });
  });
});

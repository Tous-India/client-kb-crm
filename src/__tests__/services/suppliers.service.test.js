import { describe, it, expect, vi, beforeEach } from 'vitest';
import suppliersService from '../../services/suppliers.service';
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

// Mock suppliers.json
vi.mock('../../mock/suppliers.json', () => ({
  default: { suppliers: [] },
}));

describe('suppliersService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('should fetch all suppliers successfully', async () => {
      const mockSuppliers = [
        { _id: '1', supplier_id: 'SUP-00001', supplier_name: 'Supplier A', status: 'ACTIVE' },
        { _id: '2', supplier_id: 'SUP-00002', supplier_name: 'Supplier B', status: 'ACTIVE' },
      ];
      apiClient.get.mockResolvedValue({
        data: { data: { suppliers: mockSuppliers, pagination: { total: 2 } } },
      });

      const result = await suppliersService.getAll();

      expect(result.success).toBe(true);
      expect(result.data.suppliers).toEqual(mockSuppliers);
    });

    it('should pass params to API', async () => {
      apiClient.get.mockResolvedValue({
        data: { data: { suppliers: [], pagination: {} } },
      });

      await suppliersService.getAll({ status: 'ACTIVE', page: 1 });

      expect(apiClient.get).toHaveBeenCalledWith(
        expect.any(String),
        { params: { status: 'ACTIVE', page: 1 } }
      );
    });

    it('should handle error', async () => {
      apiClient.get.mockRejectedValue({
        response: { data: { message: 'Server error' } },
      });

      const result = await suppliersService.getAll();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Server error');
    });
  });

  describe('getById', () => {
    it('should fetch supplier by ID', async () => {
      const mockSupplier = { _id: '123', supplier_id: 'SUP-00001', supplier_name: 'Test Supplier' };
      apiClient.get.mockResolvedValue({
        data: { data: { supplier: mockSupplier } },
      });

      const result = await suppliersService.getById('123');

      expect(result.success).toBe(true);
      expect(result.data.supplier).toEqual(mockSupplier);
    });

    it('should handle not found error', async () => {
      apiClient.get.mockRejectedValue({
        response: { data: { message: 'Supplier not found' } },
      });

      const result = await suppliersService.getById('invalid');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Supplier not found');
    });
  });

  describe('create', () => {
    it('should create supplier successfully', async () => {
      const supplierData = { supplier_name: 'New Supplier', contact: { email: 'test@test.com' } };
      const mockSupplier = { _id: '123', supplier_id: 'SUP-00003', ...supplierData };
      apiClient.post.mockResolvedValue({
        data: { data: { supplier: mockSupplier } },
      });

      const result = await suppliersService.create(supplierData);

      expect(result.success).toBe(true);
      expect(result.data.supplier.supplier_name).toBe('New Supplier');
    });

    it('should handle create error', async () => {
      apiClient.post.mockRejectedValue({
        response: { data: { message: 'Supplier code already exists' } },
      });

      const result = await suppliersService.create({});

      expect(result.success).toBe(false);
      expect(result.error).toBe('Supplier code already exists');
    });
  });

  describe('update', () => {
    it('should update supplier successfully', async () => {
      apiClient.put.mockResolvedValue({
        data: { data: { supplier: { _id: '123', supplier_name: 'Updated Supplier' } } },
      });

      const result = await suppliersService.update('123', { supplier_name: 'Updated Supplier' });

      expect(result.success).toBe(true);
      expect(result.data.supplier.supplier_name).toBe('Updated Supplier');
    });

    it('should handle update error', async () => {
      apiClient.put.mockRejectedValue({
        response: { data: { message: 'Update failed' } },
      });

      const result = await suppliersService.update('123', {});

      expect(result.success).toBe(false);
      expect(result.error).toBe('Update failed');
    });
  });

  describe('delete', () => {
    it('should delete supplier successfully', async () => {
      apiClient.delete.mockResolvedValue({});

      const result = await suppliersService.delete('123');

      expect(result.success).toBe(true);
    });

    it('should handle delete error', async () => {
      apiClient.delete.mockRejectedValue({
        response: { data: { message: 'Cannot delete supplier with orders' } },
      });

      const result = await suppliersService.delete('123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cannot delete supplier with orders');
    });
  });

  describe('updateStatus', () => {
    it('should update supplier status', async () => {
      apiClient.patch.mockResolvedValue({
        data: { data: { supplier: { _id: '123', status: 'INACTIVE' } } },
      });

      const result = await suppliersService.updateStatus('123', 'INACTIVE');

      expect(result.success).toBe(true);
      expect(result.data.supplier.status).toBe('INACTIVE');
    });
  });

  describe('getStats', () => {
    it('should fetch supplier statistics', async () => {
      const mockStats = { total: 10, active: 8, inactive: 1, blocked: 1 };
      apiClient.get.mockResolvedValue({
        data: { data: { stats: mockStats } },
      });

      const result = await suppliersService.getStats();

      expect(result.success).toBe(true);
      expect(result.data.stats).toEqual(mockStats);
    });
  });

  describe('search', () => {
    it('should search suppliers', async () => {
      const mockSuppliers = [{ _id: '1', supplier_name: 'Test Supplier' }];
      apiClient.get.mockResolvedValue({
        data: { data: { suppliers: mockSuppliers } },
      });

      const result = await suppliersService.search('test');

      expect(result.success).toBe(true);
      expect(result.data.suppliers).toEqual(mockSuppliers);
      expect(apiClient.get).toHaveBeenCalledWith(
        expect.any(String),
        { params: { q: 'test' } }
      );
    });
  });
});

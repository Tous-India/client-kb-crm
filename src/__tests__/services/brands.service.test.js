import { describe, it, expect, vi, beforeEach } from 'vitest';
import brandsService from '../../services/brands.service';
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

// Mock brands.json
vi.mock('../../mock/brands.json', () => ({
  default: { brands: [] },
}));

describe('brandsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('should fetch all brands successfully', async () => {
      const mockBrands = [
        { _id: '1', brand_id: 'BRD-001', name: 'Brand A', is_active: true },
        { _id: '2', brand_id: 'BRD-002', name: 'Brand B', is_active: true },
      ];
      apiClient.get.mockResolvedValue({
        data: { data: { brands: mockBrands } },
      });

      const result = await brandsService.getAll();

      expect(result.success).toBe(true);
      expect(result.data.brands).toEqual(mockBrands);
    });

    it('should pass params to API', async () => {
      apiClient.get.mockResolvedValue({
        data: { data: { brands: [] } },
      });

      await brandsService.getAll({ all: 'true' });

      expect(apiClient.get).toHaveBeenCalledWith(
        expect.any(String),
        { params: { all: 'true' } }
      );
    });

    it('should handle error', async () => {
      apiClient.get.mockRejectedValue({
        response: { data: { message: 'Server error' } },
      });

      const result = await brandsService.getAll();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Server error');
    });
  });

  describe('getById', () => {
    it('should fetch brand by ID', async () => {
      const mockBrand = { _id: '123', brand_id: 'BRD-001', name: 'Brand A' };
      apiClient.get.mockResolvedValue({
        data: { data: { brand: mockBrand } },
      });

      const result = await brandsService.getById('123');

      expect(result.success).toBe(true);
      expect(result.data.brand).toEqual(mockBrand);
    });

    it('should handle not found error', async () => {
      apiClient.get.mockRejectedValue({
        response: { data: { message: 'Brand not found' } },
      });

      const result = await brandsService.getById('invalid');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Brand not found');
    });
  });

  describe('create', () => {
    it('should create brand successfully', async () => {
      const brandData = { name: 'New Brand', description: 'Test' };
      const mockBrand = { _id: '123', brand_id: 'BRD-003', ...brandData };
      apiClient.post.mockResolvedValue({
        data: { data: { brand: mockBrand } },
      });

      const result = await brandsService.create(brandData);

      expect(result.success).toBe(true);
      expect(result.data.brand.name).toBe('New Brand');
    });

    it('should handle FormData for file upload', async () => {
      const formData = new FormData();
      formData.append('name', 'Brand with Logo');
      apiClient.post.mockResolvedValue({
        data: { data: { brand: {} } },
      });

      await brandsService.create(formData);

      expect(apiClient.post).toHaveBeenCalledWith(
        expect.any(String),
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
    });

    it('should handle create error', async () => {
      apiClient.post.mockRejectedValue({
        response: { data: { message: 'Brand already exists' } },
      });

      const result = await brandsService.create({});

      expect(result.success).toBe(false);
      expect(result.error).toBe('Brand already exists');
    });
  });

  describe('update', () => {
    it('should update brand successfully', async () => {
      apiClient.put.mockResolvedValue({
        data: { data: { brand: { _id: '123', name: 'Updated Brand' } } },
      });

      const result = await brandsService.update('123', { name: 'Updated Brand' });

      expect(result.success).toBe(true);
      expect(result.data.brand.name).toBe('Updated Brand');
    });

    it('should handle FormData for file upload', async () => {
      const formData = new FormData();
      apiClient.put.mockResolvedValue({
        data: { data: { brand: {} } },
      });

      await brandsService.update('123', formData);

      expect(apiClient.put).toHaveBeenCalledWith(
        expect.any(String),
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
    });

    it('should handle update error', async () => {
      apiClient.put.mockRejectedValue({
        response: { data: { message: 'Update failed' } },
      });

      const result = await brandsService.update('123', {});

      expect(result.success).toBe(false);
      expect(result.error).toBe('Update failed');
    });
  });

  describe('delete', () => {
    it('should delete brand successfully', async () => {
      apiClient.delete.mockResolvedValue({});

      const result = await brandsService.delete('123');

      expect(result.success).toBe(true);
    });

    it('should handle delete error', async () => {
      apiClient.delete.mockRejectedValue({
        response: { data: { message: 'Cannot delete brand with products' } },
      });

      const result = await brandsService.delete('123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cannot delete brand with products');
    });
  });
});

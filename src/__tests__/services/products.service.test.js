import { describe, it, expect, vi, beforeEach } from 'vitest';
import productsService from '../../services/products.service';
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

// Mock USE_MOCK_DATA to false
vi.mock('../../services/api/config', () => ({
  USE_MOCK_DATA: false,
}));

// Mock products.json
vi.mock('../../mock/products.json', () => ({
  default: { products: [] },
}));

describe('productsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('should fetch all products successfully', async () => {
      const mockProducts = [
        { _id: '1', product_name: 'Product 1', price: 100 },
        { _id: '2', product_name: 'Product 2', price: 200 },
      ];
      apiClient.get.mockResolvedValue({
        data: { data: mockProducts, pagination: { total: 2, page: 1 } },
      });

      const result = await productsService.getAll();

      expect(result.success).toBe(true);
      expect(result.data.products).toEqual(mockProducts);
      expect(result.data.pagination.total).toBe(2);
    });

    it('should pass params to API', async () => {
      apiClient.get.mockResolvedValue({
        data: { data: [], pagination: {} },
      });

      await productsService.getAll({ category: 'electronics', page: 2 });

      expect(apiClient.get).toHaveBeenCalledWith(
        expect.any(String),
        { params: { category: 'electronics', page: 2 } }
      );
    });

    it('should handle error', async () => {
      apiClient.get.mockRejectedValue({
        response: { data: { message: 'Server error' } },
      });

      const result = await productsService.getAll();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Server error');
      expect(result.data.products).toEqual([]);
    });
  });

  describe('getById', () => {
    it('should fetch product by ID', async () => {
      const mockProduct = { _id: '123', product_name: 'Test Product' };
      apiClient.get.mockResolvedValue({
        data: { data: { product: mockProduct } },
      });

      const result = await productsService.getById('123');

      expect(result.success).toBe(true);
      expect(result.data.product).toEqual(mockProduct);
    });

    it('should handle not found error', async () => {
      apiClient.get.mockRejectedValue({
        response: { data: { message: 'Product not found' } },
      });

      const result = await productsService.getById('invalid');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Product not found');
    });
  });

  describe('search', () => {
    it('should search products', async () => {
      const mockProducts = [{ _id: '1', product_name: 'Search Result' }];
      apiClient.get.mockResolvedValue({
        data: { data: mockProducts },
      });

      const result = await productsService.search('test query');

      expect(result.success).toBe(true);
      expect(result.data.products).toEqual(mockProducts);
      expect(apiClient.get).toHaveBeenCalledWith(
        expect.any(String),
        { params: { q: 'test query' } }
      );
    });

    it('should handle search error', async () => {
      apiClient.get.mockRejectedValue(new Error('Search failed'));

      const result = await productsService.search('test');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Search failed');
    });
  });

  describe('create', () => {
    it('should create product successfully', async () => {
      const productData = { product_name: 'New Product', price: 150 };
      const mockResponse = { product: { _id: '123', ...productData } };
      apiClient.post.mockResolvedValue({
        data: { data: mockResponse },
      });

      const result = await productsService.create(productData);

      expect(result.success).toBe(true);
      expect(result.data.product.product_name).toBe('New Product');
    });

    it('should handle FormData for image upload', async () => {
      const formData = new FormData();
      formData.append('product_name', 'Product with Image');
      apiClient.post.mockResolvedValue({
        data: { data: { product: {} } },
      });

      await productsService.create(formData);

      expect(apiClient.post).toHaveBeenCalledWith(
        expect.any(String),
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
    });

    it('should handle create error', async () => {
      apiClient.post.mockRejectedValue({
        response: { data: { message: 'Validation failed' } },
      });

      const result = await productsService.create({});

      expect(result.success).toBe(false);
      expect(result.error).toBe('Validation failed');
    });
  });

  describe('update', () => {
    it('should update product successfully', async () => {
      const updateData = { price: 200 };
      apiClient.put.mockResolvedValue({
        data: { data: { product: { _id: '123', price: 200 } } },
      });

      const result = await productsService.update('123', updateData);

      expect(result.success).toBe(true);
      expect(result.data.product.price).toBe(200);
    });

    it('should handle update error', async () => {
      apiClient.put.mockRejectedValue({
        response: { data: { message: 'Update failed' } },
      });

      const result = await productsService.update('123', {});

      expect(result.success).toBe(false);
      expect(result.error).toBe('Update failed');
    });
  });

  describe('delete', () => {
    it('should delete product successfully', async () => {
      apiClient.delete.mockResolvedValue({});

      const result = await productsService.delete('123');

      expect(result.success).toBe(true);
    });

    it('should handle delete error', async () => {
      apiClient.delete.mockRejectedValue({
        response: { data: { message: 'Delete failed' } },
      });

      const result = await productsService.delete('123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Delete failed');
    });
  });

  describe('updateInventory', () => {
    it('should update inventory successfully', async () => {
      const inventoryData = { quantity: 50 };
      apiClient.put.mockResolvedValue({
        data: { data: { product: { quantity: 50 } } },
      });

      const result = await productsService.updateInventory('123', inventoryData);

      expect(result.success).toBe(true);
    });

    it('should handle inventory update error', async () => {
      apiClient.put.mockRejectedValue(new Error('Inventory update failed'));

      const result = await productsService.updateInventory('123', {});

      expect(result.success).toBe(false);
      expect(result.error).toBe('Inventory update failed');
    });
  });

  describe('uploadImages', () => {
    it('should upload images successfully', async () => {
      const formData = new FormData();
      apiClient.post.mockResolvedValue({
        data: { data: { product: {} } },
      });

      const result = await productsService.uploadImages('123', formData);

      expect(result.success).toBe(true);
      expect(apiClient.post).toHaveBeenCalledWith(
        expect.stringContaining('/images'),
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
    });
  });

  describe('updateMainImage', () => {
    it('should update main image successfully', async () => {
      const formData = new FormData();
      apiClient.put.mockResolvedValue({
        data: { data: { product: {} } },
      });

      const result = await productsService.updateMainImage('123', formData);

      expect(result.success).toBe(true);
    });
  });
});

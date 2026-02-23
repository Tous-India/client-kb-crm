import { describe, it, expect, vi, beforeEach } from 'vitest';
import categoriesService from '../../services/categories.service';
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

// Mock categories.json
vi.mock('../../mock/categories.json', () => ({
  default: { categories: [] },
}));

describe('categoriesService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('should fetch all categories successfully', async () => {
      const mockCategories = [
        { _id: '1', category_id: 'CAT-001', name: 'Electronics', is_active: true },
        { _id: '2', category_id: 'CAT-002', name: 'Clothing', is_active: true },
      ];
      apiClient.get.mockResolvedValue({
        data: { data: { categories: mockCategories } },
      });

      const result = await categoriesService.getAll();

      expect(result.success).toBe(true);
      expect(result.data.categories).toEqual(mockCategories);
    });

    it('should pass params to API', async () => {
      apiClient.get.mockResolvedValue({
        data: { data: { categories: [] } },
      });

      await categoriesService.getAll({ all: 'true' });

      expect(apiClient.get).toHaveBeenCalledWith(
        expect.any(String),
        { params: { all: 'true' } }
      );
    });

    it('should handle error', async () => {
      apiClient.get.mockRejectedValue({
        response: { data: { message: 'Server error' } },
      });

      const result = await categoriesService.getAll();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Server error');
    });
  });

  describe('getById', () => {
    it('should fetch category by ID', async () => {
      const mockCategory = { _id: '123', category_id: 'CAT-001', name: 'Electronics' };
      apiClient.get.mockResolvedValue({
        data: { data: { category: mockCategory } },
      });

      const result = await categoriesService.getById('123');

      expect(result.success).toBe(true);
      expect(result.data.category).toEqual(mockCategory);
    });

    it('should handle not found error', async () => {
      apiClient.get.mockRejectedValue({
        response: { data: { message: 'Category not found' } },
      });

      const result = await categoriesService.getById('invalid');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Category not found');
    });
  });

  describe('create', () => {
    it('should create category successfully', async () => {
      const categoryData = { name: 'New Category', description: 'Test' };
      const mockCategory = { _id: '123', category_id: 'CAT-003', ...categoryData };
      apiClient.post.mockResolvedValue({
        data: { data: { category: mockCategory } },
      });

      const result = await categoriesService.create(categoryData);

      expect(result.success).toBe(true);
      expect(result.data.category.name).toBe('New Category');
    });

    it('should handle FormData for file upload', async () => {
      const formData = new FormData();
      formData.append('name', 'Category with Image');
      apiClient.post.mockResolvedValue({
        data: { data: { category: {} } },
      });

      await categoriesService.create(formData);

      expect(apiClient.post).toHaveBeenCalledWith(
        expect.any(String),
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
    });

    it('should handle create error', async () => {
      apiClient.post.mockRejectedValue({
        response: { data: { message: 'Category already exists' } },
      });

      const result = await categoriesService.create({});

      expect(result.success).toBe(false);
      expect(result.error).toBe('Category already exists');
    });
  });

  describe('update', () => {
    it('should update category successfully', async () => {
      apiClient.put.mockResolvedValue({
        data: { data: { category: { _id: '123', name: 'Updated' } } },
      });

      const result = await categoriesService.update('123', { name: 'Updated' });

      expect(result.success).toBe(true);
      expect(result.data.category.name).toBe('Updated');
    });

    it('should handle update error', async () => {
      apiClient.put.mockRejectedValue({
        response: { data: { message: 'Update failed' } },
      });

      const result = await categoriesService.update('123', {});

      expect(result.success).toBe(false);
      expect(result.error).toBe('Update failed');
    });
  });

  describe('delete', () => {
    it('should delete category successfully', async () => {
      apiClient.delete.mockResolvedValue({});

      const result = await categoriesService.delete('123');

      expect(result.success).toBe(true);
    });

    it('should handle delete error', async () => {
      apiClient.delete.mockRejectedValue({
        response: { data: { message: 'Cannot delete category with products' } },
      });

      const result = await categoriesService.delete('123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cannot delete category with products');
    });
  });

  describe('addSubCategory', () => {
    it('should add sub-category successfully', async () => {
      apiClient.post.mockResolvedValue({
        data: { data: { category: { sub_categories: [{ name: 'Sub' }] } } },
      });

      const result = await categoriesService.addSubCategory('cat123', { name: 'Sub' });

      expect(result.success).toBe(true);
    });
  });

  describe('updateSubCategory', () => {
    it('should update sub-category successfully', async () => {
      apiClient.put.mockResolvedValue({
        data: { data: { category: {} } },
      });

      const result = await categoriesService.updateSubCategory('cat123', 'sub123', { name: 'Updated Sub' });

      expect(result.success).toBe(true);
    });
  });

  describe('deleteSubCategory', () => {
    it('should delete sub-category successfully', async () => {
      apiClient.delete.mockResolvedValue({});

      const result = await categoriesService.deleteSubCategory('cat123', 'sub123');

      expect(result.success).toBe(true);
    });
  });
});

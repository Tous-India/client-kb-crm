import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useProducts, useProduct, useProductSearch, useCreateProduct, useUpdateProduct, useDeleteProduct, productKeys } from '../../hooks/useProducts';
import productsService from '../../services/products.service';

// Mock the products service
vi.mock('../../services/products.service');

// Mock toast
vi.mock('../../utils/toast', () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
}));

// Create a wrapper with QueryClientProvider
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useProducts hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('productKeys', () => {
    it('should generate correct query keys', () => {
      expect(productKeys.all).toEqual(['products']);
      expect(productKeys.lists()).toEqual(['products', 'list']);
      expect(productKeys.list({ page: 1 })).toEqual(['products', 'list', { page: 1 }]);
      expect(productKeys.details()).toEqual(['products', 'detail']);
      expect(productKeys.detail('123')).toEqual(['products', 'detail', '123']);
      expect(productKeys.search('rivet')).toEqual(['products', 'search', 'rivet']);
    });
  });

  describe('useProducts', () => {
    it('should fetch products successfully', async () => {
      const mockProducts = [
        { _id: '1', name: 'Product 1', part_number: 'PN-001' },
        { _id: '2', name: 'Product 2', part_number: 'PN-002' },
      ];

      productsService.getAll.mockResolvedValue({
        success: true,
        data: { products: mockProducts },
      });

      const { result } = renderHook(() => useProducts(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockProducts);
      expect(productsService.getAll).toHaveBeenCalledWith({});
    });

    it('should pass params to service', async () => {
      productsService.getAll.mockResolvedValue({
        success: true,
        data: { products: [] },
      });

      const params = { page: 2, limit: 10, category: 'electronics' };
      renderHook(() => useProducts(params), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(productsService.getAll).toHaveBeenCalledWith(params);
      });
    });

    it('should handle error', async () => {
      productsService.getAll.mockResolvedValue({
        success: false,
        error: 'Failed to fetch products',
      });

      const { result } = renderHook(() => useProducts(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error.message).toBe('Failed to fetch products');
    });

    it('should return empty array when no products', async () => {
      productsService.getAll.mockResolvedValue({
        success: true,
        data: { products: null },
      });

      const { result } = renderHook(() => useProducts(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([]);
    });
  });

  describe('useProduct', () => {
    it('should fetch single product by ID', async () => {
      const mockProduct = { _id: '123', name: 'Test Product', part_number: 'PN-001' };

      productsService.getById.mockResolvedValue({
        success: true,
        data: { product: mockProduct },
      });

      const { result } = renderHook(() => useProduct('123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockProduct);
      expect(productsService.getById).toHaveBeenCalledWith('123');
    });

    it('should not fetch when ID is falsy', async () => {
      const { result } = renderHook(() => useProduct(null), {
        wrapper: createWrapper(),
      });

      expect(result.current.fetchStatus).toBe('idle');
      expect(productsService.getById).not.toHaveBeenCalled();
    });

    it('should handle error', async () => {
      productsService.getById.mockResolvedValue({
        success: false,
        error: 'Product not found',
      });

      const { result } = renderHook(() => useProduct('invalid'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error.message).toBe('Product not found');
    });
  });

  describe('useProductSearch', () => {
    it('should search products when query is valid', async () => {
      const mockProducts = [{ _id: '1', name: 'Rivet', part_number: 'RIV-001' }];

      productsService.search.mockResolvedValue({
        success: true,
        data: { products: mockProducts },
      });

      const { result } = renderHook(() => useProductSearch('rivet'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockProducts);
      expect(productsService.search).toHaveBeenCalledWith('rivet');
    });

    it('should not search when query is too short', async () => {
      const { result } = renderHook(() => useProductSearch('r'), {
        wrapper: createWrapper(),
      });

      expect(result.current.fetchStatus).toBe('idle');
      expect(productsService.search).not.toHaveBeenCalled();
    });

    it('should not search when query is empty', async () => {
      const { result } = renderHook(() => useProductSearch(''), {
        wrapper: createWrapper(),
      });

      expect(result.current.fetchStatus).toBe('idle');
      expect(productsService.search).not.toHaveBeenCalled();
    });
  });

  describe('useCreateProduct', () => {
    it('should create product successfully', async () => {
      const newProduct = { name: 'New Product', part_number: 'PN-NEW' };
      const createdProduct = { _id: '123', ...newProduct };

      productsService.create.mockResolvedValue({
        success: true,
        data: { product: createdProduct },
      });

      const { result } = renderHook(() => useCreateProduct(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(newProduct);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(createdProduct);
      expect(productsService.create).toHaveBeenCalledWith(newProduct);
    });

    it('should handle create error', async () => {
      productsService.create.mockResolvedValue({
        success: false,
        error: 'Failed to create product',
      });

      const { result } = renderHook(() => useCreateProduct(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ name: 'Test' });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error.message).toBe('Failed to create product');
    });
  });

  describe('useUpdateProduct', () => {
    it('should update product successfully', async () => {
      const updatedProduct = { _id: '123', name: 'Updated Product' };

      productsService.update.mockResolvedValue({
        success: true,
        data: { product: updatedProduct },
      });

      const { result } = renderHook(() => useUpdateProduct(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ id: '123', data: { name: 'Updated Product' } });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(productsService.update).toHaveBeenCalledWith('123', { name: 'Updated Product' });
    });

    it('should handle update error', async () => {
      productsService.update.mockResolvedValue({
        success: false,
        error: 'Failed to update product',
      });

      const { result } = renderHook(() => useUpdateProduct(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ id: '123', data: { name: 'Test' } });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe('useDeleteProduct', () => {
    it('should delete product successfully', async () => {
      productsService.delete.mockResolvedValue({
        success: true,
      });

      const { result } = renderHook(() => useDeleteProduct(), {
        wrapper: createWrapper(),
      });

      result.current.mutate('123');

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(productsService.delete).toHaveBeenCalledWith('123');
    });

    it('should handle delete error', async () => {
      productsService.delete.mockResolvedValue({
        success: false,
        error: 'Failed to delete product',
      });

      const { result } = renderHook(() => useDeleteProduct(), {
        wrapper: createWrapper(),
      });

      result.current.mutate('123');

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });
});

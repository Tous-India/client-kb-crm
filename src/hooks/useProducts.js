import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import productsService from '../services/products.service';
import { showSuccess, showError } from '../utils/toast';

// Query keys
export const productKeys = {
  all: ['products'],
  lists: () => [...productKeys.all, 'list'],
  list: (filters) => [...productKeys.lists(), filters],
  details: () => [...productKeys.all, 'detail'],
  detail: (id) => [...productKeys.details(), id],
  search: (query) => [...productKeys.all, 'search', query],
};

/**
 * Hook to fetch all products
 * @param {Object} params - Query parameters
 * @returns {Object} React Query result
 */
export const useProducts = (params = {}) => {
  return useQuery({
    queryKey: productKeys.list(params),
    queryFn: async () => {
      const result = await productsService.getAll(params);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data?.products || [];
    },
    staleTime: 30 * 1000, // 30 seconds - shorter for faster updates
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to fetch products with pagination metadata (for server-side pagination)
 * @param {Object} params - Query parameters (page, limit, category, brand, etc.)
 * @returns {Object} React Query result with { products, pagination }
 */
export const useProductsPaginated = (params = {}) => {
  return useQuery({
    queryKey: productKeys.list({ ...params, paginated: true }),
    queryFn: async () => {
      const result = await productsService.getAll(params);
      if (!result.success) {
        throw new Error(result.error);
      }
      return {
        products: result.data?.products || [],
        pagination: result.data?.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 },
      };
    },
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};

/**
 * Hook to fetch a single product by ID
 * @param {string} id - Product ID
 * @returns {Object} React Query result
 */
export const useProduct = (id) => {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: async () => {
      const result = await productsService.getById(id);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data?.product;
    },
    enabled: !!id,
  });
};

/**
 * Hook to search products
 * @param {string} query - Search query
 * @returns {Object} React Query result
 */
export const useProductSearch = (query) => {
  return useQuery({
    queryKey: productKeys.search(query),
    queryFn: async () => {
      const result = await productsService.search(query);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data?.products || [];
    },
    enabled: !!query && query.length >= 2,
  });
};

/**
 * Hook to create a new product
 * @returns {Object} Mutation result
 */
export const useCreateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productData) => {
      const result = await productsService.create(productData);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data?.product;
    },
    onSuccess: () => {
      // Invalidate all product-related queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: productKeys.all });
      showSuccess('Product created successfully');
    },
    onError: (error) => {
      showError(error.message || 'Failed to create product');
    },
  });
};

/**
 * Hook to update a product
 * @returns {Object} Mutation result
 */
export const useUpdateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      const result = await productsService.update(id, data);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data?.product;
    },
    onSuccess: () => {
      // Invalidate all product-related queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: productKeys.all });
      showSuccess('Product updated successfully');
    },
    onError: (error) => {
      showError(error.message || 'Failed to update product');
    },
  });
};

/**
 * Hook to delete a product
 * @returns {Object} Mutation result
 */
export const useDeleteProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const result = await productsService.delete(id);
      if (!result.success) {
        throw new Error(result.error);
      }
      return id;
    },
    onSuccess: () => {
      // Invalidate all product-related queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: productKeys.all });
      showSuccess('Product deleted successfully');
    },
    onError: (error) => {
      showError(error.message || 'Failed to delete product');
    },
  });
};

/**
 * Hook to update product inventory
 * @returns {Object} Mutation result
 */
export const useUpdateInventory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, inventoryData }) => {
      const result = await productsService.updateInventory(id, inventoryData);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data?.product;
    },
    onSuccess: () => {
      // Invalidate all product-related queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: productKeys.all });
      showSuccess('Inventory updated successfully');
    },
    onError: (error) => {
      showError(error.message || 'Failed to update inventory');
    },
  });
};

/**
 * Hook to upload product images (adds to additional_images)
 * @returns {Object} Mutation result
 */
export const useUploadProductImages = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, formData }) => {
      const result = await productsService.uploadImages(id, formData);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data?.product;
    },
    onSuccess: () => {
      // Invalidate all product-related queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: productKeys.all });
      showSuccess('Images uploaded successfully');
    },
    onError: (error) => {
      showError(error.message || 'Failed to upload images');
    },
  });
};

/**
 * Hook to update main product image (replaces existing)
 * @returns {Object} Mutation result
 */
export const useUpdateMainImage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, formData }) => {
      const result = await productsService.updateMainImage(id, formData);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data?.product;
    },
    onSuccess: () => {
      // Invalidate all product-related queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: productKeys.all });
      showSuccess('Main image updated successfully');
    },
    onError: (error) => {
      showError(error.message || 'Failed to update main image');
    },
  });
};

export default useProducts;

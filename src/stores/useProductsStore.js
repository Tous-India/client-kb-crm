import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

/**
 * Products Store
 * Manages products UI state using Zustand
 */
const useProductsStore = create(
  devtools(
    (set, get) => ({
      // Filter state
      searchTerm: '',
      filterCategory: '',
      filterBrand: '',
      stockFilter: 'all', // 'all', 'inStock', 'lowStock', 'outOfStock'

      // Pagination state
      page: 0,
      rowsPerPage: 10,

      // Selected product for edit/view
      selectedProduct: null,

      // Modal states
      isAddModalOpen: false,
      isEditModalOpen: false,
      isDeleteModalOpen: false,

      // Actions - Filters
      setSearchTerm: (searchTerm) => set({ searchTerm, page: 0 }),
      setFilterCategory: (filterCategory) => set({ filterCategory, page: 0 }),
      setFilterBrand: (filterBrand) => set({ filterBrand, page: 0 }),
      setStockFilter: (stockFilter) => set({ stockFilter, page: 0 }),

      clearFilters: () => set({
        searchTerm: '',
        filterCategory: '',
        filterBrand: '',
        stockFilter: 'all',
        page: 0,
      }),

      // Actions - Pagination
      setPage: (page) => set({ page }),
      setRowsPerPage: (rowsPerPage) => set({ rowsPerPage, page: 0 }),

      // Actions - Product selection
      setSelectedProduct: (selectedProduct) => set({ selectedProduct }),
      clearSelectedProduct: () => set({ selectedProduct: null }),

      // Actions - Modals
      openAddModal: () => set({ isAddModalOpen: true }),
      closeAddModal: () => set({ isAddModalOpen: false }),

      openEditModal: (product) => set({
        isEditModalOpen: true,
        selectedProduct: product
      }),
      closeEditModal: () => set({
        isEditModalOpen: false,
        selectedProduct: null
      }),

      openDeleteModal: (product) => set({
        isDeleteModalOpen: true,
        selectedProduct: product
      }),
      closeDeleteModal: () => set({
        isDeleteModalOpen: false,
        selectedProduct: null
      }),

      // Computed - Get filtered products (to be used with react-query data)
      getFilteredProducts: (products = []) => {
        const { searchTerm, filterCategory, filterBrand, stockFilter } = get();

        return products.filter((product) => {
          // Search filter
          const matchesSearch =
            searchTerm === '' ||
            product.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.part_number?.toLowerCase().includes(searchTerm.toLowerCase());

          // Category filter
          const matchesCategory =
            filterCategory === '' || product.category === filterCategory;

          // Brand filter
          const matchesBrand =
            filterBrand === '' || product.brand === filterBrand;

          // Stock filter
          let matchesStock = true;
          if (stockFilter === 'inStock') {
            matchesStock = product.total_quantity > 0;
          } else if (stockFilter === 'lowStock') {
            matchesStock = product.total_quantity > 0 && product.total_quantity < 50;
          } else if (stockFilter === 'outOfStock') {
            matchesStock = product.total_quantity === 0;
          }

          return matchesSearch && matchesCategory && matchesBrand && matchesStock;
        });
      },

      // Computed - Get paginated products
      getPaginatedProducts: (products = []) => {
        const { page, rowsPerPage } = get();
        const filteredProducts = get().getFilteredProducts(products);
        const startIndex = page * rowsPerPage;
        const endIndex = startIndex + rowsPerPage;
        return filteredProducts.slice(startIndex, endIndex);
      },

      // Computed - Get stats
      getStats: (products = []) => {
        return {
          total: products.length,
          inStock: products.filter(p => p.total_quantity > 0).length,
          lowStock: products.filter(p => p.total_quantity > 0 && p.total_quantity < 50).length,
          outOfStock: products.filter(p => p.total_quantity === 0).length,
        };
      },
    }),
    { name: 'products-store' }
  )
);

export default useProductsStore;

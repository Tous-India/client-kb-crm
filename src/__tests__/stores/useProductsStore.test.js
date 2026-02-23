import { describe, it, expect, beforeEach } from 'vitest';
import useProductsStore from '../../stores/useProductsStore';

// Mock products data
const mockProducts = [
  {
    _id: '1',
    product_id: 'PRD-00001',
    part_number: 'MS20426AD3-4',
    product_name: 'Solid Rivet MS20426AD3-4',
    category: 'Rivets',
    brand: 'Aviation Standard',
    total_quantity: 1000,
    stock_status: 'In Stock'
  },
  {
    _id: '2',
    product_id: 'PRD-00002',
    part_number: 'AN470AD3-5',
    product_name: 'Universal Head Rivet',
    category: 'Rivets',
    brand: 'Standard Parts',
    total_quantity: 25,
    stock_status: 'Low Stock'
  },
  {
    _id: '3',
    product_id: 'PRD-00003',
    part_number: 'NAS1149D0363N',
    product_name: 'Flat Washer',
    category: 'Spacers',
    brand: 'NAS Standard',
    total_quantity: 0,
    stock_status: 'Out of Stock'
  }
];

describe('useProductsStore', () => {
  // Reset store before each test
  beforeEach(() => {
    useProductsStore.setState({
      searchTerm: '',
      filterCategory: '',
      filterBrand: '',
      stockFilter: 'all',
      page: 0,
      rowsPerPage: 10,
      selectedProduct: null,
      isAddModalOpen: false,
      isEditModalOpen: false,
      isDeleteModalOpen: false
    });
  });

  describe('Filter Actions', () => {
    it('should set search term and reset page', () => {
      useProductsStore.setState({ page: 5 });
      useProductsStore.getState().setSearchTerm('rivet');

      const state = useProductsStore.getState();
      expect(state.searchTerm).toBe('rivet');
      expect(state.page).toBe(0);
    });

    it('should set category filter', () => {
      useProductsStore.getState().setFilterCategory('Rivets');

      expect(useProductsStore.getState().filterCategory).toBe('Rivets');
    });

    it('should set brand filter', () => {
      useProductsStore.getState().setFilterBrand('Aviation Standard');

      expect(useProductsStore.getState().filterBrand).toBe('Aviation Standard');
    });

    it('should set stock filter', () => {
      useProductsStore.getState().setStockFilter('inStock');

      expect(useProductsStore.getState().stockFilter).toBe('inStock');
    });

    it('should clear all filters', () => {
      useProductsStore.setState({
        searchTerm: 'test',
        filterCategory: 'Rivets',
        filterBrand: 'Test',
        stockFilter: 'inStock',
        page: 5
      });

      useProductsStore.getState().clearFilters();

      const state = useProductsStore.getState();
      expect(state.searchTerm).toBe('');
      expect(state.filterCategory).toBe('');
      expect(state.filterBrand).toBe('');
      expect(state.stockFilter).toBe('all');
      expect(state.page).toBe(0);
    });
  });

  describe('Pagination Actions', () => {
    it('should set page', () => {
      useProductsStore.getState().setPage(3);

      expect(useProductsStore.getState().page).toBe(3);
    });

    it('should set rows per page and reset page', () => {
      useProductsStore.setState({ page: 5 });
      useProductsStore.getState().setRowsPerPage(25);

      const state = useProductsStore.getState();
      expect(state.rowsPerPage).toBe(25);
      expect(state.page).toBe(0);
    });
  });

  describe('Modal Actions', () => {
    it('should open and close add modal', () => {
      useProductsStore.getState().openAddModal();
      expect(useProductsStore.getState().isAddModalOpen).toBe(true);

      useProductsStore.getState().closeAddModal();
      expect(useProductsStore.getState().isAddModalOpen).toBe(false);
    });

    it('should open edit modal with product and close it', () => {
      const product = mockProducts[0];
      useProductsStore.getState().openEditModal(product);

      let state = useProductsStore.getState();
      expect(state.isEditModalOpen).toBe(true);
      expect(state.selectedProduct).toEqual(product);

      useProductsStore.getState().closeEditModal();

      state = useProductsStore.getState();
      expect(state.isEditModalOpen).toBe(false);
      expect(state.selectedProduct).toBeNull();
    });

    it('should open delete modal with product and close it', () => {
      const product = mockProducts[1];
      useProductsStore.getState().openDeleteModal(product);

      let state = useProductsStore.getState();
      expect(state.isDeleteModalOpen).toBe(true);
      expect(state.selectedProduct).toEqual(product);

      useProductsStore.getState().closeDeleteModal();

      state = useProductsStore.getState();
      expect(state.isDeleteModalOpen).toBe(false);
      expect(state.selectedProduct).toBeNull();
    });
  });

  describe('getFilteredProducts', () => {
    it('should return all products when no filters', () => {
      const filtered = useProductsStore.getState().getFilteredProducts(mockProducts);

      expect(filtered).toHaveLength(3);
    });

    it('should filter by search term (product name)', () => {
      useProductsStore.setState({ searchTerm: 'rivet' });

      const filtered = useProductsStore.getState().getFilteredProducts(mockProducts);

      expect(filtered).toHaveLength(2);
      expect(filtered.every(p => p.product_name.toLowerCase().includes('rivet'))).toBe(true);
    });

    it('should filter by search term (part number)', () => {
      useProductsStore.setState({ searchTerm: 'MS20426' });

      const filtered = useProductsStore.getState().getFilteredProducts(mockProducts);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].part_number).toBe('MS20426AD3-4');
    });

    it('should filter by category', () => {
      useProductsStore.setState({ filterCategory: 'Rivets' });

      const filtered = useProductsStore.getState().getFilteredProducts(mockProducts);

      expect(filtered).toHaveLength(2);
      expect(filtered.every(p => p.category === 'Rivets')).toBe(true);
    });

    it('should filter by brand', () => {
      useProductsStore.setState({ filterBrand: 'Aviation Standard' });

      const filtered = useProductsStore.getState().getFilteredProducts(mockProducts);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].brand).toBe('Aviation Standard');
    });

    it('should filter by stock status - inStock', () => {
      useProductsStore.setState({ stockFilter: 'inStock' });

      const filtered = useProductsStore.getState().getFilteredProducts(mockProducts);

      expect(filtered).toHaveLength(2);
      expect(filtered.every(p => p.total_quantity > 0)).toBe(true);
    });

    it('should filter by stock status - lowStock', () => {
      useProductsStore.setState({ stockFilter: 'lowStock' });

      const filtered = useProductsStore.getState().getFilteredProducts(mockProducts);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].total_quantity).toBe(25);
    });

    it('should filter by stock status - outOfStock', () => {
      useProductsStore.setState({ stockFilter: 'outOfStock' });

      const filtered = useProductsStore.getState().getFilteredProducts(mockProducts);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].total_quantity).toBe(0);
    });

    it('should combine multiple filters', () => {
      useProductsStore.setState({
        filterCategory: 'Rivets',
        stockFilter: 'inStock'
      });

      const filtered = useProductsStore.getState().getFilteredProducts(mockProducts);

      expect(filtered).toHaveLength(2);
    });

    it('should handle empty products array', () => {
      const filtered = useProductsStore.getState().getFilteredProducts([]);

      expect(filtered).toHaveLength(0);
    });
  });

  describe('getPaginatedProducts', () => {
    it('should return paginated products', () => {
      useProductsStore.setState({ rowsPerPage: 2, page: 0 });

      const paginated = useProductsStore.getState().getPaginatedProducts(mockProducts);

      expect(paginated).toHaveLength(2);
    });

    it('should return correct page', () => {
      useProductsStore.setState({ rowsPerPage: 1, page: 1 });

      const paginated = useProductsStore.getState().getPaginatedProducts(mockProducts);

      expect(paginated).toHaveLength(1);
      expect(paginated[0]._id).toBe('2');
    });

    it('should return remaining items on last page', () => {
      useProductsStore.setState({ rowsPerPage: 2, page: 1 });

      const paginated = useProductsStore.getState().getPaginatedProducts(mockProducts);

      expect(paginated).toHaveLength(1);
    });
  });

  describe('getStats', () => {
    it('should calculate correct stats', () => {
      const stats = useProductsStore.getState().getStats(mockProducts);

      expect(stats.total).toBe(3);
      expect(stats.inStock).toBe(2);
      expect(stats.lowStock).toBe(1);
      expect(stats.outOfStock).toBe(1);
    });

    it('should handle empty products array', () => {
      const stats = useProductsStore.getState().getStats([]);

      expect(stats.total).toBe(0);
      expect(stats.inStock).toBe(0);
      expect(stats.lowStock).toBe(0);
      expect(stats.outOfStock).toBe(0);
    });
  });
});

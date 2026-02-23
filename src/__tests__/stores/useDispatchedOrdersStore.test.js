import { describe, it, expect, beforeEach } from 'vitest';
import useDispatchedOrdersStore from '../../stores/useDispatchedOrdersStore';

// Mock dispatched orders data
const mockOrders = [
  {
    _id: '1',
    order_id: 'ORD-00001',
    customer_id: 'USR-00001',
    buyer_name: 'Acme Corp',
    order_date: '2024-01-15T10:00:00Z',
    total_amount: 5000,
    items: [
      { part_number: 'PN-001', product_name: 'Product 1', quantity: 10, unit_price: 500 }
    ],
    dispatch_info: {
      dispatch_date: '2024-01-16',
      courier_service: 'FedEx',
      tracking_number: 'TRACK123',
      shipment_status: 'In Transit'
    }
  },
  {
    _id: '2',
    order_id: 'ORD-00002',
    customer_id: 'USR-00002',
    buyer_name: 'Beta Inc',
    order_date: '2024-01-10T08:00:00Z',
    total_amount: 3000,
    items: [
      { part_number: 'PN-002', product_name: 'Product 2', quantity: 5, unit_price: 600 }
    ],
    shipment_status: 'Pending'
  },
  {
    _id: '3',
    order_id: 'ORD-00003',
    customer_id: 'USR-00001',
    buyer_name: 'Acme Corp',
    order_date: '2024-01-20T14:00:00Z',
    total_amount: 8000,
    items: [
      { part_number: 'PN-003', product_name: 'Product 3', quantity: 8, unit_price: 1000 }
    ],
    dispatch_info: {
      tracking_number: 'TRACK456',
      shipment_status: 'Delivered'
    }
  },
  {
    _id: '4',
    order_id: 'ORD-00004',
    customer_id: 'USR-00003',
    buyer_name: 'Gamma LLC',
    order_date: '2024-01-05T12:00:00Z',
    total_amount: 2000,
    items: [
      { part_number: 'PN-004', product_name: 'Product 4', quantity: 4, unit_price: 500 }
    ],
    tracking_number: 'TRACK789'
  }
];

describe('useDispatchedOrdersStore', () => {
  // Reset store before each test
  beforeEach(() => {
    useDispatchedOrdersStore.setState({
      searchTerm: '',
      filterStatus: 'ALL',
      page: 0,
      rowsPerPage: 10,
      sortBy: 'order_date',
      sortOrder: 'desc',
      selectedOrder: null,
      isDetailModalOpen: false,
      isEmailModalOpen: false,
      isProductsModalOpen: false,
      isInvoicePreviewModalOpen: false,
      isDispatchPreviewModalOpen: false,
      isInvoiceCreationModalOpen: false,
      isEditingDispatch: false,
      dispatchForm: {
        dispatch_date: '',
        courier_service: '',
        tracking_number: '',
        dispatch_notes: '',
        shipment_status: 'Pending'
      },
      emailForm: { to: '', subject: '', message: '' },
      invoiceItems: [],
      selectedProducts: []
    });
  });

  describe('Filter Actions', () => {
    it('should set search term and reset page', () => {
      useDispatchedOrdersStore.setState({ page: 5 });
      useDispatchedOrdersStore.getState().setSearchTerm('ORD-00001');

      const state = useDispatchedOrdersStore.getState();
      expect(state.searchTerm).toBe('ORD-00001');
      expect(state.page).toBe(0);
    });

    it('should set filter status and reset page', () => {
      useDispatchedOrdersStore.setState({ page: 3 });
      useDispatchedOrdersStore.getState().setFilterStatus('Delivered');

      const state = useDispatchedOrdersStore.getState();
      expect(state.filterStatus).toBe('Delivered');
      expect(state.page).toBe(0);
    });

    it('should clear all filters', () => {
      useDispatchedOrdersStore.setState({
        searchTerm: 'test',
        filterStatus: 'Pending',
        page: 5
      });

      useDispatchedOrdersStore.getState().clearFilters();

      const state = useDispatchedOrdersStore.getState();
      expect(state.searchTerm).toBe('');
      expect(state.filterStatus).toBe('ALL');
      expect(state.page).toBe(0);
    });
  });

  describe('Sort Actions', () => {
    it('should set sort by', () => {
      useDispatchedOrdersStore.getState().setSortBy('total_amount');
      expect(useDispatchedOrdersStore.getState().sortBy).toBe('total_amount');
    });

    it('should set sort order', () => {
      useDispatchedOrdersStore.getState().setSortOrder('asc');
      expect(useDispatchedOrdersStore.getState().sortOrder).toBe('asc');
    });

    it('should toggle sort order when clicking same column', () => {
      useDispatchedOrdersStore.setState({ sortBy: 'order_date', sortOrder: 'desc' });
      useDispatchedOrdersStore.getState().toggleSort('order_date');

      expect(useDispatchedOrdersStore.getState().sortOrder).toBe('asc');
    });

    it('should set new column and reset to desc', () => {
      useDispatchedOrdersStore.setState({ sortBy: 'order_date', sortOrder: 'asc' });
      useDispatchedOrdersStore.getState().toggleSort('total_amount');

      const state = useDispatchedOrdersStore.getState();
      expect(state.sortBy).toBe('total_amount');
      expect(state.sortOrder).toBe('desc');
    });
  });

  describe('Pagination Actions', () => {
    it('should set page', () => {
      useDispatchedOrdersStore.getState().setPage(3);
      expect(useDispatchedOrdersStore.getState().page).toBe(3);
    });

    it('should set rows per page and reset page', () => {
      useDispatchedOrdersStore.setState({ page: 5 });
      useDispatchedOrdersStore.getState().setRowsPerPage(25);

      const state = useDispatchedOrdersStore.getState();
      expect(state.rowsPerPage).toBe(25);
      expect(state.page).toBe(0);
    });
  });

  describe('Order Selection', () => {
    it('should set selected order', () => {
      const order = mockOrders[0];
      useDispatchedOrdersStore.getState().setSelectedOrder(order);

      expect(useDispatchedOrdersStore.getState().selectedOrder).toEqual(order);
    });

    it('should clear selected order', () => {
      useDispatchedOrdersStore.setState({ selectedOrder: mockOrders[0] });
      useDispatchedOrdersStore.getState().clearSelectedOrder();

      expect(useDispatchedOrdersStore.getState().selectedOrder).toBeNull();
    });
  });

  describe('Dispatch Form Actions', () => {
    it('should set dispatch form', () => {
      const form = {
        dispatch_date: '2024-01-20',
        courier_service: 'DHL',
        tracking_number: 'DHL123',
        dispatch_notes: 'Handle with care',
        shipment_status: 'In Transit'
      };

      useDispatchedOrdersStore.getState().setDispatchForm(form);

      expect(useDispatchedOrdersStore.getState().dispatchForm).toEqual(form);
    });

    it('should update dispatch form field', () => {
      useDispatchedOrdersStore.getState().updateDispatchForm('courier_service', 'UPS');

      expect(useDispatchedOrdersStore.getState().dispatchForm.courier_service).toBe('UPS');
    });

    it('should reset dispatch form', () => {
      useDispatchedOrdersStore.setState({
        dispatchForm: {
          dispatch_date: '2024-01-20',
          courier_service: 'DHL',
          tracking_number: 'DHL123',
          dispatch_notes: 'Notes',
          shipment_status: 'Delivered'
        }
      });

      useDispatchedOrdersStore.getState().resetDispatchForm();

      const form = useDispatchedOrdersStore.getState().dispatchForm;
      expect(form.dispatch_date).toBe('');
      expect(form.courier_service).toBe('');
      expect(form.tracking_number).toBe('');
      expect(form.dispatch_notes).toBe('');
      expect(form.shipment_status).toBe('Pending');
    });
  });

  describe('Email Form Actions', () => {
    it('should set email form', () => {
      const form = {
        to: 'customer@test.com',
        subject: 'Order Shipped',
        message: 'Your order has been shipped.'
      };

      useDispatchedOrdersStore.getState().setEmailForm(form);

      expect(useDispatchedOrdersStore.getState().emailForm).toEqual(form);
    });

    it('should update email form field', () => {
      useDispatchedOrdersStore.getState().updateEmailForm('subject', 'Updated Subject');

      expect(useDispatchedOrdersStore.getState().emailForm.subject).toBe('Updated Subject');
    });

    it('should reset email form', () => {
      useDispatchedOrdersStore.setState({
        emailForm: {
          to: 'test@test.com',
          subject: 'Test',
          message: 'Test message'
        }
      });

      useDispatchedOrdersStore.getState().resetEmailForm();

      const form = useDispatchedOrdersStore.getState().emailForm;
      expect(form.to).toBe('');
      expect(form.subject).toBe('');
      expect(form.message).toBe('');
    });
  });

  describe('Invoice Items Actions', () => {
    const mockInvoiceItems = [
      { part_number: 'PN-001', quantity: 10, unit_price: 100, dispatch_quantity: 10, original_quantity: 10 },
      { part_number: 'PN-002', quantity: 5, unit_price: 200, dispatch_quantity: 5, original_quantity: 5 }
    ];

    it('should set invoice items', () => {
      useDispatchedOrdersStore.getState().setInvoiceItems(mockInvoiceItems);

      expect(useDispatchedOrdersStore.getState().invoiceItems).toHaveLength(2);
    });

    it('should update invoice item quantity', () => {
      useDispatchedOrdersStore.setState({ invoiceItems: mockInvoiceItems });
      useDispatchedOrdersStore.getState().updateInvoiceItemQuantity(0, 5);

      expect(useDispatchedOrdersStore.getState().invoiceItems[0].dispatch_quantity).toBe(5);
    });

    it('should not exceed original quantity', () => {
      useDispatchedOrdersStore.setState({ invoiceItems: mockInvoiceItems });
      useDispatchedOrdersStore.getState().updateInvoiceItemQuantity(0, 20);

      expect(useDispatchedOrdersStore.getState().invoiceItems[0].dispatch_quantity).toBe(10);
    });

    it('should not go below 0', () => {
      useDispatchedOrdersStore.setState({ invoiceItems: mockInvoiceItems });
      useDispatchedOrdersStore.getState().updateInvoiceItemQuantity(0, -5);

      expect(useDispatchedOrdersStore.getState().invoiceItems[0].dispatch_quantity).toBe(0);
    });

    it('should remove invoice item', () => {
      useDispatchedOrdersStore.setState({ invoiceItems: mockInvoiceItems });
      useDispatchedOrdersStore.getState().removeInvoiceItem(0);

      expect(useDispatchedOrdersStore.getState().invoiceItems).toHaveLength(1);
      expect(useDispatchedOrdersStore.getState().invoiceItems[0].part_number).toBe('PN-002');
    });
  });

  describe('Modal Actions', () => {
    it('should open and close detail modal', () => {
      const order = mockOrders[0];
      useDispatchedOrdersStore.getState().openDetailModal(order);

      let state = useDispatchedOrdersStore.getState();
      expect(state.isDetailModalOpen).toBe(true);
      expect(state.selectedOrder).toEqual(order);
      expect(state.dispatchForm.tracking_number).toBe('TRACK123');

      useDispatchedOrdersStore.getState().closeDetailModal();

      state = useDispatchedOrdersStore.getState();
      expect(state.isDetailModalOpen).toBe(false);
      expect(state.selectedOrder).toBeNull();
    });

    it('should open and close email modal', () => {
      const order = mockOrders[0];
      useDispatchedOrdersStore.getState().openEmailModal(order);

      let state = useDispatchedOrdersStore.getState();
      expect(state.isEmailModalOpen).toBe(true);
      expect(state.selectedOrder).toEqual(order);

      useDispatchedOrdersStore.getState().closeEmailModal();

      expect(useDispatchedOrdersStore.getState().isEmailModalOpen).toBe(false);
    });

    it('should open and close products modal', () => {
      const products = [{ part_number: 'PN-001', quantity: 10 }];
      useDispatchedOrdersStore.getState().openProductsModal(products);

      let state = useDispatchedOrdersStore.getState();
      expect(state.isProductsModalOpen).toBe(true);
      expect(state.selectedProducts).toEqual(products);

      useDispatchedOrdersStore.getState().closeProductsModal();

      state = useDispatchedOrdersStore.getState();
      expect(state.isProductsModalOpen).toBe(false);
      expect(state.selectedProducts).toHaveLength(0);
    });

    it('should open and close invoice preview modal', () => {
      const order = mockOrders[0];
      useDispatchedOrdersStore.getState().openInvoicePreviewModal(order);

      expect(useDispatchedOrdersStore.getState().isInvoicePreviewModalOpen).toBe(true);

      useDispatchedOrdersStore.getState().closeInvoicePreviewModal();

      expect(useDispatchedOrdersStore.getState().isInvoicePreviewModalOpen).toBe(false);
    });

    it('should open and close dispatch preview modal', () => {
      const order = mockOrders[0];
      useDispatchedOrdersStore.getState().openDispatchPreviewModal(order);

      expect(useDispatchedOrdersStore.getState().isDispatchPreviewModalOpen).toBe(true);

      useDispatchedOrdersStore.getState().closeDispatchPreviewModal();

      expect(useDispatchedOrdersStore.getState().isDispatchPreviewModalOpen).toBe(false);
    });

    it('should open invoice creation modal with items', () => {
      const order = mockOrders[0];
      useDispatchedOrdersStore.getState().openInvoiceCreationModal(order);

      const state = useDispatchedOrdersStore.getState();
      expect(state.isInvoiceCreationModalOpen).toBe(true);
      expect(state.invoiceItems).toHaveLength(1);
      expect(state.invoiceItems[0].dispatch_quantity).toBe(10);
      expect(state.invoiceItems[0].original_quantity).toBe(10);
    });

    it('should close invoice creation modal and clear items', () => {
      useDispatchedOrdersStore.setState({
        isInvoiceCreationModalOpen: true,
        invoiceItems: [{ part_number: 'PN-001' }]
      });

      useDispatchedOrdersStore.getState().closeInvoiceCreationModal();

      const state = useDispatchedOrdersStore.getState();
      expect(state.isInvoiceCreationModalOpen).toBe(false);
      expect(state.invoiceItems).toHaveLength(0);
    });
  });

  describe('getFilteredOrders', () => {
    it('should return all orders when no filters', () => {
      const filtered = useDispatchedOrdersStore.getState().getFilteredOrders(mockOrders);
      expect(filtered).toHaveLength(4);
    });

    it('should filter by search term (order_id)', () => {
      useDispatchedOrdersStore.setState({ searchTerm: 'ORD-00001' });
      const filtered = useDispatchedOrdersStore.getState().getFilteredOrders(mockOrders);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].order_id).toBe('ORD-00001');
    });

    it('should filter by search term (buyer_name)', () => {
      useDispatchedOrdersStore.setState({ searchTerm: 'Acme' });
      const filtered = useDispatchedOrdersStore.getState().getFilteredOrders(mockOrders);

      expect(filtered).toHaveLength(2);
    });

    it('should filter by search term (tracking_number)', () => {
      useDispatchedOrdersStore.setState({ searchTerm: 'TRACK123' });
      const filtered = useDispatchedOrdersStore.getState().getFilteredOrders(mockOrders);

      expect(filtered).toHaveLength(1);
    });

    it('should filter by status Pending', () => {
      useDispatchedOrdersStore.setState({ filterStatus: 'Pending' });
      const filtered = useDispatchedOrdersStore.getState().getFilteredOrders(mockOrders);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].order_id).toBe('ORD-00002');
    });

    it('should filter by status In Transit', () => {
      useDispatchedOrdersStore.setState({ filterStatus: 'In Transit' });
      const filtered = useDispatchedOrdersStore.getState().getFilteredOrders(mockOrders);

      expect(filtered).toHaveLength(2);
    });

    it('should filter by status Delivered', () => {
      useDispatchedOrdersStore.setState({ filterStatus: 'Delivered' });
      const filtered = useDispatchedOrdersStore.getState().getFilteredOrders(mockOrders);

      expect(filtered).toHaveLength(1);
    });

    it('should combine search and status filters', () => {
      useDispatchedOrdersStore.setState({
        searchTerm: 'Acme',
        filterStatus: 'In Transit'
      });
      const filtered = useDispatchedOrdersStore.getState().getFilteredOrders(mockOrders);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].order_id).toBe('ORD-00001');
    });

    it('should handle empty orders array', () => {
      const filtered = useDispatchedOrdersStore.getState().getFilteredOrders([]);
      expect(filtered).toHaveLength(0);
    });
  });

  describe('getSortedOrders', () => {
    it('should sort by order_date descending by default', () => {
      const sorted = useDispatchedOrdersStore.getState().getSortedOrders(mockOrders);

      expect(sorted[0].order_id).toBe('ORD-00003'); // Latest date
    });

    it('should sort by order_date ascending', () => {
      useDispatchedOrdersStore.setState({ sortBy: 'order_date', sortOrder: 'asc' });
      const sorted = useDispatchedOrdersStore.getState().getSortedOrders(mockOrders);

      expect(sorted[0].order_id).toBe('ORD-00004'); // Earliest date
    });

    it('should sort by total_amount descending', () => {
      useDispatchedOrdersStore.setState({ sortBy: 'total_amount', sortOrder: 'desc' });
      const sorted = useDispatchedOrdersStore.getState().getSortedOrders(mockOrders);

      expect(sorted[0].total_amount).toBe(8000);
    });

    it('should sort by total_amount ascending', () => {
      useDispatchedOrdersStore.setState({ sortBy: 'total_amount', sortOrder: 'asc' });
      const sorted = useDispatchedOrdersStore.getState().getSortedOrders(mockOrders);

      expect(sorted[0].total_amount).toBe(2000);
    });

    it('should sort by order_id', () => {
      useDispatchedOrdersStore.setState({ sortBy: 'order_id', sortOrder: 'asc' });
      const sorted = useDispatchedOrdersStore.getState().getSortedOrders(mockOrders);

      expect(sorted[0].order_id).toBe('ORD-00001');
    });
  });

  describe('getPaginatedOrders', () => {
    it('should return paginated orders', () => {
      useDispatchedOrdersStore.setState({ rowsPerPage: 2, page: 0 });
      const paginated = useDispatchedOrdersStore.getState().getPaginatedOrders(mockOrders);

      expect(paginated).toHaveLength(2);
    });

    it('should return correct page', () => {
      useDispatchedOrdersStore.setState({ rowsPerPage: 2, page: 1 });
      const paginated = useDispatchedOrdersStore.getState().getPaginatedOrders(mockOrders);

      expect(paginated).toHaveLength(2);
    });

    it('should return remaining items on last page', () => {
      useDispatchedOrdersStore.setState({ rowsPerPage: 3, page: 1 });
      const paginated = useDispatchedOrdersStore.getState().getPaginatedOrders(mockOrders);

      expect(paginated).toHaveLength(1);
    });
  });

  describe('getStats', () => {
    it('should calculate correct stats', () => {
      const stats = useDispatchedOrdersStore.getState().getStats(mockOrders);

      expect(stats.totalOrders).toBe(4);
      expect(stats.totalRevenue).toBe(18000);
      expect(stats.ordersWithTracking).toBe(3);
      expect(stats.ordersWithoutTracking).toBe(1);
      expect(stats.statusCounts.Pending).toBe(1);
      expect(stats.statusCounts['In Transit']).toBe(2);
      expect(stats.statusCounts.Delivered).toBe(1);
    });

    it('should handle empty orders array', () => {
      const stats = useDispatchedOrdersStore.getState().getStats([]);

      expect(stats.totalOrders).toBe(0);
      expect(stats.totalRevenue).toBe(0);
      expect(stats.ordersWithTracking).toBe(0);
      expect(stats.ordersWithoutTracking).toBe(0);
    });
  });

  describe('calculateInvoiceTotal', () => {
    it('should calculate invoice total correctly', () => {
      useDispatchedOrdersStore.setState({
        invoiceItems: [
          { unit_price: 100, dispatch_quantity: 5 },
          { unit_price: 200, dispatch_quantity: 3 }
        ]
      });

      const total = useDispatchedOrdersStore.getState().calculateInvoiceTotal();

      expect(total).toBe(1100); // (100*5) + (200*3)
    });

    it('should return 0 for empty items', () => {
      const total = useDispatchedOrdersStore.getState().calculateInvoiceTotal();

      expect(total).toBe(0);
    });

    it('should handle items with missing values', () => {
      useDispatchedOrdersStore.setState({
        invoiceItems: [
          { unit_price: 100 },
          { dispatch_quantity: 5 }
        ]
      });

      const total = useDispatchedOrdersStore.getState().calculateInvoiceTotal();

      expect(total).toBe(0);
    });
  });

  describe('Editing State', () => {
    it('should set editing dispatch state', () => {
      useDispatchedOrdersStore.getState().setIsEditingDispatch(true);
      expect(useDispatchedOrdersStore.getState().isEditingDispatch).toBe(true);

      useDispatchedOrdersStore.getState().setIsEditingDispatch(false);
      expect(useDispatchedOrdersStore.getState().isEditingDispatch).toBe(false);
    });
  });

  describe('Selected Products', () => {
    it('should set selected products', () => {
      const products = [
        { part_number: 'PN-001', quantity: 10 },
        { part_number: 'PN-002', quantity: 5 }
      ];

      useDispatchedOrdersStore.getState().setSelectedProducts(products);

      expect(useDispatchedOrdersStore.getState().selectedProducts).toEqual(products);
    });
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import useInvoicesStore from '../../stores/useInvoicesStore';

// Mock invoices data
const mockInvoices = [
  {
    _id: '1',
    invoice_number: 'INV-2024-001',
    order_id: 'ORD-00001',
    buyer_name: 'Acme Corp',
    status: 'PAID',
    dispatch_status: 'DISPATCHED',
    invoice_type: 'STANDARD',
    total_amount: 5000,
    balance_due: 0,
    pi_number: 'PI2024001',
    po_number: 'PO2024001'
  },
  {
    _id: '2',
    invoice_number: 'INV-2024-002',
    order_id: 'ORD-00002',
    customer_name: 'Beta Inc',
    status: 'UNPAID',
    dispatch_status: 'PENDING',
    invoice_type: 'PROFORMA',
    total_amount: 3000,
    balance_due: 3000,
    tracking_number: 'TRACK123'
  },
  {
    _id: '3',
    invoice_number: 'INV-2024-003',
    order_id: 'ORD-00003',
    buyer_name: 'Acme Corp',
    status: 'PARTIAL',
    dispatch_status: 'DISPATCHED',
    invoice_type: 'STANDARD',
    total_amount: 10000,
    balance_due: 5000,
    quote_reference: 'Q2024001'
  },
  {
    _id: '4',
    invoice_number: 'INV-2024-004',
    order_id: 'ORD-00004',
    customer_id: 'USR-00003',
    status: 'PAID',
    dispatch_status: 'PENDING',
    invoice_type: 'CREDIT',
    total_amount: 2000,
    balance_due: 0,
    proforma_invoice_number: 'PI2024002'
  }
];

describe('useInvoicesStore', () => {
  // Reset store before each test
  beforeEach(() => {
    useInvoicesStore.setState({
      searchTerm: '',
      filterStatus: 'ALL',
      filterDispatchStatus: 'ALL',
      filterCustomer: 'ALL',
      filterType: 'ALL',
      page: 0,
      rowsPerPage: 10,
      selectedInvoice: null,
      isDetailModalOpen: false,
      isSeriesModalOpen: false,
      seriesTabValue: 0
    });
  });

  describe('Filter Actions', () => {
    it('should set search term and reset page', () => {
      useInvoicesStore.setState({ page: 5 });
      useInvoicesStore.getState().setSearchTerm('INV-2024');

      const state = useInvoicesStore.getState();
      expect(state.searchTerm).toBe('INV-2024');
      expect(state.page).toBe(0);
    });

    it('should set filter status and reset page', () => {
      useInvoicesStore.setState({ page: 3 });
      useInvoicesStore.getState().setFilterStatus('PAID');

      const state = useInvoicesStore.getState();
      expect(state.filterStatus).toBe('PAID');
      expect(state.page).toBe(0);
    });

    it('should set filter dispatch status and reset page', () => {
      useInvoicesStore.setState({ page: 2 });
      useInvoicesStore.getState().setFilterDispatchStatus('DISPATCHED');

      const state = useInvoicesStore.getState();
      expect(state.filterDispatchStatus).toBe('DISPATCHED');
      expect(state.page).toBe(0);
    });

    it('should set filter customer and reset page', () => {
      useInvoicesStore.getState().setFilterCustomer('Acme Corp');

      expect(useInvoicesStore.getState().filterCustomer).toBe('Acme Corp');
    });

    it('should set filter type and reset page', () => {
      useInvoicesStore.getState().setFilterType('PROFORMA');

      expect(useInvoicesStore.getState().filterType).toBe('PROFORMA');
    });

    it('should clear all filters', () => {
      useInvoicesStore.setState({
        searchTerm: 'test',
        filterStatus: 'PAID',
        filterDispatchStatus: 'DISPATCHED',
        filterCustomer: 'Acme',
        filterType: 'STANDARD',
        page: 5
      });

      useInvoicesStore.getState().clearFilters();

      const state = useInvoicesStore.getState();
      expect(state.searchTerm).toBe('');
      expect(state.filterStatus).toBe('ALL');
      expect(state.filterDispatchStatus).toBe('ALL');
      expect(state.filterCustomer).toBe('ALL');
      expect(state.filterType).toBe('ALL');
      expect(state.page).toBe(0);
    });
  });

  describe('Pagination Actions', () => {
    it('should set page', () => {
      useInvoicesStore.getState().setPage(3);
      expect(useInvoicesStore.getState().page).toBe(3);
    });

    it('should set rows per page and reset page', () => {
      useInvoicesStore.setState({ page: 5 });
      useInvoicesStore.getState().setRowsPerPage(25);

      const state = useInvoicesStore.getState();
      expect(state.rowsPerPage).toBe(25);
      expect(state.page).toBe(0);
    });
  });

  describe('Invoice Selection', () => {
    it('should set selected invoice', () => {
      const invoice = mockInvoices[0];
      useInvoicesStore.getState().setSelectedInvoice(invoice);

      expect(useInvoicesStore.getState().selectedInvoice).toEqual(invoice);
    });

    it('should clear selected invoice', () => {
      useInvoicesStore.setState({ selectedInvoice: mockInvoices[0] });
      useInvoicesStore.getState().clearSelectedInvoice();

      expect(useInvoicesStore.getState().selectedInvoice).toBeNull();
    });
  });

  describe('Modal Actions', () => {
    it('should open and close detail modal', () => {
      const invoice = mockInvoices[0];
      useInvoicesStore.getState().openDetailModal(invoice);

      let state = useInvoicesStore.getState();
      expect(state.isDetailModalOpen).toBe(true);
      expect(state.selectedInvoice).toEqual(invoice);

      useInvoicesStore.getState().closeDetailModal();

      state = useInvoicesStore.getState();
      expect(state.isDetailModalOpen).toBe(false);
      expect(state.selectedInvoice).toBeNull();
    });

    it('should open and close series modal', () => {
      useInvoicesStore.getState().openSeriesModal();
      expect(useInvoicesStore.getState().isSeriesModalOpen).toBe(true);

      useInvoicesStore.getState().closeSeriesModal();
      expect(useInvoicesStore.getState().isSeriesModalOpen).toBe(false);
    });

    it('should set series tab value', () => {
      useInvoicesStore.getState().setSeriesTabValue(2);
      expect(useInvoicesStore.getState().seriesTabValue).toBe(2);
    });
  });

  describe('getFilteredInvoices', () => {
    it('should return all invoices when no filters', () => {
      const filtered = useInvoicesStore.getState().getFilteredInvoices(mockInvoices);
      expect(filtered).toHaveLength(4);
    });

    it('should filter by search term (invoice_number)', () => {
      useInvoicesStore.setState({ searchTerm: 'INV-2024-001' });
      const filtered = useInvoicesStore.getState().getFilteredInvoices(mockInvoices);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].invoice_number).toBe('INV-2024-001');
    });

    it('should filter by search term (order_id)', () => {
      useInvoicesStore.setState({ searchTerm: 'ORD-00002' });
      const filtered = useInvoicesStore.getState().getFilteredInvoices(mockInvoices);

      expect(filtered).toHaveLength(1);
    });

    it('should filter by search term (buyer_name)', () => {
      useInvoicesStore.setState({ searchTerm: 'Acme' });
      const filtered = useInvoicesStore.getState().getFilteredInvoices(mockInvoices);

      expect(filtered).toHaveLength(2);
    });

    it('should filter by search term (customer_name)', () => {
      useInvoicesStore.setState({ searchTerm: 'Beta' });
      const filtered = useInvoicesStore.getState().getFilteredInvoices(mockInvoices);

      expect(filtered).toHaveLength(1);
    });

    it('should filter by search term (pi_number)', () => {
      useInvoicesStore.setState({ searchTerm: 'PI2024001' });
      const filtered = useInvoicesStore.getState().getFilteredInvoices(mockInvoices);

      expect(filtered).toHaveLength(1);
    });

    it('should filter by search term (tracking_number)', () => {
      useInvoicesStore.setState({ searchTerm: 'TRACK123' });
      const filtered = useInvoicesStore.getState().getFilteredInvoices(mockInvoices);

      expect(filtered).toHaveLength(1);
    });

    it('should filter by status', () => {
      useInvoicesStore.setState({ filterStatus: 'PAID' });
      const filtered = useInvoicesStore.getState().getFilteredInvoices(mockInvoices);

      expect(filtered).toHaveLength(2);
      expect(filtered.every(i => i.status === 'PAID')).toBe(true);
    });

    it('should filter by dispatch status', () => {
      useInvoicesStore.setState({ filterDispatchStatus: 'DISPATCHED' });
      const filtered = useInvoicesStore.getState().getFilteredInvoices(mockInvoices);

      expect(filtered).toHaveLength(2);
      expect(filtered.every(i => i.dispatch_status === 'DISPATCHED')).toBe(true);
    });

    it('should filter by customer', () => {
      useInvoicesStore.setState({ filterCustomer: 'Acme Corp' });
      const filtered = useInvoicesStore.getState().getFilteredInvoices(mockInvoices);

      expect(filtered).toHaveLength(2);
    });

    it('should filter by invoice type', () => {
      useInvoicesStore.setState({ filterType: 'PROFORMA' });
      const filtered = useInvoicesStore.getState().getFilteredInvoices(mockInvoices);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].invoice_type).toBe('PROFORMA');
    });

    it('should combine multiple filters', () => {
      useInvoicesStore.setState({
        filterStatus: 'PAID',
        filterDispatchStatus: 'DISPATCHED'
      });
      const filtered = useInvoicesStore.getState().getFilteredInvoices(mockInvoices);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].invoice_number).toBe('INV-2024-001');
    });

    it('should handle empty invoices array', () => {
      const filtered = useInvoicesStore.getState().getFilteredInvoices([]);
      expect(filtered).toHaveLength(0);
    });
  });

  describe('getPaginatedInvoices', () => {
    it('should return paginated invoices', () => {
      useInvoicesStore.setState({ rowsPerPage: 2, page: 0 });
      const paginated = useInvoicesStore.getState().getPaginatedInvoices(mockInvoices);

      expect(paginated).toHaveLength(2);
    });

    it('should return correct page', () => {
      useInvoicesStore.setState({ rowsPerPage: 2, page: 1 });
      const paginated = useInvoicesStore.getState().getPaginatedInvoices(mockInvoices);

      expect(paginated).toHaveLength(2);
    });

    it('should return remaining items on last page', () => {
      useInvoicesStore.setState({ rowsPerPage: 3, page: 1 });
      const paginated = useInvoicesStore.getState().getPaginatedInvoices(mockInvoices);

      expect(paginated).toHaveLength(1);
    });
  });

  describe('getUniqueCustomers', () => {
    it('should return unique customers sorted', () => {
      const customers = useInvoicesStore.getState().getUniqueCustomers(mockInvoices);

      expect(customers).toContain('Acme Corp');
      expect(customers).toContain('Beta Inc');
      expect(customers).toContain('USR-00003');
    });

    it('should handle empty invoices array', () => {
      const customers = useInvoicesStore.getState().getUniqueCustomers([]);
      expect(customers).toHaveLength(0);
    });
  });

  describe('getStats', () => {
    it('should calculate correct stats', () => {
      const stats = useInvoicesStore.getState().getStats(mockInvoices);

      expect(stats.total).toBe(4);
      expect(stats.paid).toBe(2);
      expect(stats.unpaid).toBe(2); // UNPAID + PARTIAL
      expect(stats.dispatched).toBe(2);
      expect(stats.pendingDispatch).toBe(2);
      expect(stats.totalRevenue).toBe(7000); // 5000 + 2000 (paid invoices)
      expect(stats.outstandingBalance).toBe(8000); // 3000 + 5000 (unpaid balances)
    });

    it('should handle empty invoices array', () => {
      const stats = useInvoicesStore.getState().getStats([]);

      expect(stats.total).toBe(0);
      expect(stats.paid).toBe(0);
      expect(stats.unpaid).toBe(0);
      expect(stats.dispatched).toBe(0);
      expect(stats.pendingDispatch).toBe(0);
      expect(stats.totalRevenue).toBe(0);
      expect(stats.outstandingBalance).toBe(0);
    });
  });
});

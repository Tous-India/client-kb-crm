import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

/**
 * Invoices Store
 * Manages invoices UI state using Zustand
 */
const useInvoicesStore = create(
  devtools(
    (set, get) => ({
      // Filter state
      searchTerm: '',
      filterStatus: 'ALL',
      filterDispatchStatus: 'ALL',
      filterCustomer: 'ALL',
      filterType: 'ALL',

      // Pagination state
      page: 0,
      rowsPerPage: 10,

      // Selected invoice for view/edit
      selectedInvoice: null,

      // Modal states
      isDetailModalOpen: false,
      isSeriesModalOpen: false,

      // Series management state
      seriesTabValue: 0,

      // Actions - Filters
      setSearchTerm: (searchTerm) => set({ searchTerm, page: 0 }),
      setFilterStatus: (filterStatus) => set({ filterStatus, page: 0 }),
      setFilterDispatchStatus: (filterDispatchStatus) => set({ filterDispatchStatus, page: 0 }),
      setFilterCustomer: (filterCustomer) => set({ filterCustomer, page: 0 }),
      setFilterType: (filterType) => set({ filterType, page: 0 }),

      clearFilters: () => set({
        searchTerm: '',
        filterStatus: 'ALL',
        filterDispatchStatus: 'ALL',
        filterCustomer: 'ALL',
        filterType: 'ALL',
        page: 0,
      }),

      // Actions - Pagination
      setPage: (page) => set({ page }),
      setRowsPerPage: (rowsPerPage) => set({ rowsPerPage, page: 0 }),

      // Actions - Invoice selection
      setSelectedInvoice: (selectedInvoice) => set({ selectedInvoice }),
      clearSelectedInvoice: () => set({ selectedInvoice: null }),

      // Actions - Modals
      openDetailModal: (invoice) => set({
        isDetailModalOpen: true,
        selectedInvoice: invoice,
      }),
      closeDetailModal: () => set({
        isDetailModalOpen: false,
        selectedInvoice: null,
      }),

      openSeriesModal: () => set({ isSeriesModalOpen: true }),
      closeSeriesModal: () => set({ isSeriesModalOpen: false }),

      setSeriesTabValue: (seriesTabValue) => set({ seriesTabValue }),

      // Computed - Get filtered invoices (to be used with react-query data)
      getFilteredInvoices: (invoices = []) => {
        const { searchTerm, filterStatus, filterDispatchStatus, filterCustomer, filterType } = get();

        return invoices.filter((invoice) => {
          // Status filter
          const matchesStatus =
            filterStatus === 'ALL' || invoice.status === filterStatus;

          // Dispatch status filter
          const matchesDispatchStatus =
            filterDispatchStatus === 'ALL' ||
            invoice.dispatch_status === filterDispatchStatus;

          // Customer filter - use buyer_name or customer_name
          const customerName = invoice.buyer_name || invoice.customer_name || invoice.customer_id || '';
          const matchesCustomer =
            filterCustomer === 'ALL' || customerName === filterCustomer;

          // Type filter
          const matchesType =
            filterType === 'ALL' || invoice.invoice_type === filterType;

          // Search filter - search across all relevant fields
          const searchLower = searchTerm.toLowerCase();
          const matchesSearch =
            searchTerm === '' ||
            (invoice.invoice_number && invoice.invoice_number.toLowerCase().includes(searchLower)) ||
            (invoice.order_id && invoice.order_id.toLowerCase().includes(searchLower)) ||
            (invoice.buyer_name && invoice.buyer_name.toLowerCase().includes(searchLower)) ||
            (invoice.customer_name && invoice.customer_name.toLowerCase().includes(searchLower)) ||
            (invoice.customer_id && invoice.customer_id.toLowerCase().includes(searchLower)) ||
            (invoice.pi_number && invoice.pi_number.toLowerCase().includes(searchLower)) ||
            (invoice.proforma_invoice_number && invoice.proforma_invoice_number.toLowerCase().includes(searchLower)) ||
            (invoice.quote_reference && invoice.quote_reference.toLowerCase().includes(searchLower)) ||
            (invoice.po_number && invoice.po_number.toLowerCase().includes(searchLower)) ||
            (invoice.tracking_number && invoice.tracking_number.toLowerCase().includes(searchLower));

          return matchesStatus && matchesDispatchStatus && matchesCustomer && matchesType && matchesSearch;
        });
      },

      // Computed - Get paginated invoices
      getPaginatedInvoices: (invoices = []) => {
        const { page, rowsPerPage } = get();
        const filteredInvoices = get().getFilteredInvoices(invoices);
        const startIndex = page * rowsPerPage;
        const endIndex = startIndex + rowsPerPage;
        return filteredInvoices.slice(startIndex, endIndex);
      },

      // Computed - Get unique customers from invoices
      getUniqueCustomers: (invoices = []) => {
        return [...new Set(invoices.map((inv) => inv.buyer_name || inv.customer_name || inv.customer_id).filter(Boolean))].sort();
      },

      // Computed - Get stats
      getStats: (invoices = []) => {
        const paidInvoices = invoices.filter((i) => i.status === 'PAID');
        const unpaidInvoices = invoices.filter((i) => i.status === 'UNPAID' || i.status === 'PARTIAL');
        const dispatchedInvoices = invoices.filter((i) => i.dispatch_status === 'DISPATCHED');
        const pendingDispatch = invoices.filter((i) => i.dispatch_status === 'PENDING' || !i.dispatch_status);

        return {
          total: invoices.length,
          paid: paidInvoices.length,
          unpaid: unpaidInvoices.length,
          dispatched: dispatchedInvoices.length,
          pendingDispatch: pendingDispatch.length,
          totalRevenue: paidInvoices.reduce((sum, i) => sum + (i.total_amount || 0), 0),
          outstandingBalance: unpaidInvoices.reduce((sum, i) => sum + (i.balance_due || 0), 0),
        };
      },
    }),
    { name: 'invoices-store' }
  )
);

export default useInvoicesStore;

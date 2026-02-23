import { create } from 'zustand';

/**
 * Archives Store
 * Manages UI state for the archives page
 */
const useArchivesStore = create((set, get) => ({
  // Filters
  filters: {
    document_type: '',
    buyer_name: '',
    buyer_id: '',
    date_from: null,
    date_to: null,
    fiscal_year: '',
    payment_status: '',
    min_amount: '',
    max_amount: '',
    search: '',
    tags: '',
  },

  // Selected archive for detail view
  selectedArchive: null,

  // Modal states
  isDetailModalOpen: false,
  isCreateModalOpen: false,
  isEditModalOpen: false,
  isDeleteDialogOpen: false,

  // Stats data
  stats: null,

  // Fiscal years list
  fiscalYears: [],

  // Buyers list
  buyers: [],

  // Actions
  setFilter: (key, value) =>
    set((state) => ({
      filters: {
        ...state.filters,
        [key]: value,
      },
    })),

  setFilters: (filters) =>
    set((state) => ({
      filters: {
        ...state.filters,
        ...filters,
      },
    })),

  resetFilters: () =>
    set({
      filters: {
        document_type: '',
        buyer_name: '',
        buyer_id: '',
        date_from: null,
        date_to: null,
        fiscal_year: '',
        payment_status: '',
        min_amount: '',
        max_amount: '',
        search: '',
        tags: '',
      },
    }),

  setSelectedArchive: (archive) =>
    set({ selectedArchive: archive }),

  clearSelectedArchive: () =>
    set({ selectedArchive: null }),

  openDetailModal: (archive) =>
    set({
      selectedArchive: archive,
      isDetailModalOpen: true,
    }),

  closeDetailModal: () =>
    set({
      isDetailModalOpen: false,
    }),

  openCreateModal: () =>
    set({
      isCreateModalOpen: true,
    }),

  closeCreateModal: () =>
    set({
      isCreateModalOpen: false,
    }),

  openEditModal: (archive) =>
    set({
      selectedArchive: archive,
      isEditModalOpen: true,
    }),

  closeEditModal: () =>
    set({
      isEditModalOpen: false,
    }),

  openDeleteDialog: (archive) =>
    set({
      selectedArchive: archive,
      isDeleteDialogOpen: true,
    }),

  closeDeleteDialog: () =>
    set({
      isDeleteDialogOpen: false,
    }),

  setStats: (stats) =>
    set({ stats }),

  setFiscalYears: (fiscalYears) =>
    set({ fiscalYears }),

  setBuyers: (buyers) =>
    set({ buyers }),

  // Get active filters count
  getActiveFiltersCount: () => {
    const { filters } = get();
    let count = 0;
    if (filters.document_type) count++;
    if (filters.buyer_name) count++;
    if (filters.buyer_id) count++;
    if (filters.date_from) count++;
    if (filters.date_to) count++;
    if (filters.fiscal_year) count++;
    if (filters.payment_status) count++;
    if (filters.min_amount) count++;
    if (filters.max_amount) count++;
    if (filters.search) count++;
    if (filters.tags) count++;
    return count;
  },

  // Build query params from filters
  getQueryParams: () => {
    const { filters } = get();
    const params = {};

    if (filters.document_type) params.document_type = filters.document_type;
    if (filters.buyer_name) params.buyer_name = filters.buyer_name;
    if (filters.buyer_id) params.buyer_id = filters.buyer_id;
    if (filters.date_from) params.date_from = filters.date_from;
    if (filters.date_to) params.date_to = filters.date_to;
    if (filters.fiscal_year) params.fiscal_year = filters.fiscal_year;
    if (filters.payment_status) params.payment_status = filters.payment_status;
    if (filters.min_amount) params.min_amount = filters.min_amount;
    if (filters.max_amount) params.max_amount = filters.max_amount;
    if (filters.search) params.search = filters.search;
    if (filters.tags) params.tags = filters.tags;

    return params;
  },
}));

export default useArchivesStore;

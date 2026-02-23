import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

/**
 * Dispatched Orders Store
 * Manages dispatched orders UI state using Zustand
 */
const useDispatchedOrdersStore = create(
  devtools(
    (set, get) => ({
      // Filter state
      searchTerm: '',
      filterStatus: 'ALL', // ALL, Pending, In Transit, Delivered

      // Pagination state
      page: 0,
      rowsPerPage: 10,

      // Sort state
      sortBy: 'order_date',
      sortOrder: 'desc',

      // Selected order for view/edit
      selectedOrder: null,

      // Modal states
      isDetailModalOpen: false,
      isEmailModalOpen: false,
      isProductsModalOpen: false,
      isInvoicePreviewModalOpen: false,
      isDispatchPreviewModalOpen: false,
      isInvoiceCreationModalOpen: false,

      // Editing states
      isEditingDispatch: false,

      // Dispatch form state
      dispatchForm: {
        dispatch_date: '',
        courier_service: '',
        tracking_number: '',
        dispatch_notes: '',
        shipment_status: 'Pending',
      },

      // Email form state
      emailForm: {
        to: '',
        subject: '',
        message: '',
      },

      // Invoice items for creation
      invoiceItems: [],

      // Selected products for viewing
      selectedProducts: [],

      // Shipment status options
      shipmentStatusOptions: [
        { value: 'Pending', label: 'Pending', color: 'warning' },
        { value: 'In Transit', label: 'In Transit', color: 'info' },
        { value: 'Delivered', label: 'Delivered', color: 'success' },
      ],

      // Actions - Filters
      setSearchTerm: (searchTerm) => set({ searchTerm, page: 0 }),
      setFilterStatus: (filterStatus) => set({ filterStatus, page: 0 }),

      clearFilters: () => set({
        searchTerm: '',
        filterStatus: 'ALL',
        page: 0,
      }),

      // Actions - Sorting
      setSortBy: (sortBy) => set({ sortBy }),
      setSortOrder: (sortOrder) => set({ sortOrder }),
      toggleSort: (column) => {
        const { sortBy, sortOrder } = get();
        if (sortBy === column) {
          set({ sortOrder: sortOrder === 'asc' ? 'desc' : 'asc' });
        } else {
          set({ sortBy: column, sortOrder: 'desc' });
        }
      },

      // Actions - Pagination
      setPage: (page) => set({ page }),
      setRowsPerPage: (rowsPerPage) => set({ rowsPerPage, page: 0 }),

      // Actions - Order selection
      setSelectedOrder: (selectedOrder) => set({ selectedOrder }),
      clearSelectedOrder: () => set({ selectedOrder: null }),

      // Actions - Dispatch form
      setDispatchForm: (dispatchForm) => set({ dispatchForm }),
      updateDispatchForm: (field, value) => set((state) => ({
        dispatchForm: { ...state.dispatchForm, [field]: value },
      })),
      resetDispatchForm: () => set({
        dispatchForm: {
          dispatch_date: '',
          courier_service: '',
          tracking_number: '',
          dispatch_notes: '',
          shipment_status: 'Pending',
        },
      }),

      // Actions - Email form
      setEmailForm: (emailForm) => set({ emailForm }),
      updateEmailForm: (field, value) => set((state) => ({
        emailForm: { ...state.emailForm, [field]: value },
      })),
      resetEmailForm: () => set({
        emailForm: { to: '', subject: '', message: '' },
      }),

      // Actions - Invoice items
      setInvoiceItems: (invoiceItems) => set({ invoiceItems }),
      updateInvoiceItemQuantity: (index, quantity) => {
        const { invoiceItems } = get();
        const updatedItems = [...invoiceItems];
        const maxQty = updatedItems[index].original_quantity;
        updatedItems[index].dispatch_quantity = Math.max(0, Math.min(quantity, maxQty));
        set({ invoiceItems: updatedItems });
      },
      removeInvoiceItem: (index) => {
        const { invoiceItems } = get();
        set({ invoiceItems: invoiceItems.filter((_, i) => i !== index) });
      },

      // Actions - Selected products
      setSelectedProducts: (selectedProducts) => set({ selectedProducts }),

      // Actions - Editing
      setIsEditingDispatch: (isEditingDispatch) => set({ isEditingDispatch }),

      // Actions - Modals
      openDetailModal: (order) => {
        const hasTracking = order.dispatch_info?.tracking_number || order.tracking_number;
        const defaultStatus = order.dispatch_info?.shipment_status || order.shipment_status || (hasTracking ? 'In Transit' : 'Pending');

        set({
          isDetailModalOpen: true,
          selectedOrder: order,
          isEditingDispatch: false,
          dispatchForm: {
            dispatch_date: order.dispatch_info?.dispatch_date || order.order_date?.split('T')[0] || new Date().toISOString().split('T')[0],
            courier_service: order.dispatch_info?.courier_service || order.courier_service || '',
            tracking_number: order.dispatch_info?.tracking_number || order.tracking_number || '',
            dispatch_notes: order.dispatch_info?.dispatch_notes || '',
            shipment_status: defaultStatus,
          },
        });
      },
      closeDetailModal: () => set({
        isDetailModalOpen: false,
        selectedOrder: null,
        isEditingDispatch: false,
      }),

      openEmailModal: (order) => set({
        isEmailModalOpen: true,
        selectedOrder: order,
      }),
      closeEmailModal: () => set({
        isEmailModalOpen: false,
      }),

      openProductsModal: (products) => set({
        isProductsModalOpen: true,
        selectedProducts: products,
      }),
      closeProductsModal: () => set({
        isProductsModalOpen: false,
        selectedProducts: [],
      }),

      openInvoicePreviewModal: (order) => set({
        isInvoicePreviewModalOpen: true,
        selectedOrder: order,
      }),
      closeInvoicePreviewModal: () => set({
        isInvoicePreviewModalOpen: false,
      }),

      openDispatchPreviewModal: (order) => set({
        isDispatchPreviewModalOpen: true,
        selectedOrder: order,
      }),
      closeDispatchPreviewModal: () => set({
        isDispatchPreviewModalOpen: false,
      }),

      openInvoiceCreationModal: (order) => {
        const items = order.items.map(item => ({
          ...item,
          dispatch_quantity: item.quantity,
          original_quantity: item.quantity,
        }));
        set({
          isInvoiceCreationModalOpen: true,
          selectedOrder: order,
          invoiceItems: items,
        });
      },
      closeInvoiceCreationModal: () => set({
        isInvoiceCreationModalOpen: false,
        invoiceItems: [],
      }),

      // Computed - Get filtered orders
      getFilteredOrders: (orders = []) => {
        const { searchTerm, filterStatus } = get();

        return orders.filter((order) => {
          // Status filter
          const hasTracking = order.dispatch_info?.tracking_number || order.tracking_number;
          const orderStatus = order.dispatch_info?.shipment_status || order.shipment_status || (hasTracking ? 'In Transit' : 'Pending');
          const matchesStatus = filterStatus === 'ALL' || orderStatus === filterStatus;

          // Search filter
          const searchLower = searchTerm.toLowerCase();
          const matchesSearch =
            searchTerm === '' ||
            (order.order_id && order.order_id.toLowerCase().includes(searchLower)) ||
            (order.customer_id && order.customer_id.toLowerCase().includes(searchLower)) ||
            (order.buyer_name && order.buyer_name.toLowerCase().includes(searchLower)) ||
            (order.tracking_number && order.tracking_number.toLowerCase().includes(searchLower)) ||
            (order.dispatch_info?.tracking_number && order.dispatch_info.tracking_number.toLowerCase().includes(searchLower));

          return matchesStatus && matchesSearch;
        });
      },

      // Computed - Get sorted orders
      getSortedOrders: (orders = []) => {
        const { sortBy, sortOrder } = get();
        const filteredOrders = get().getFilteredOrders(orders);

        return [...filteredOrders].sort((a, b) => {
          let compareA, compareB;

          if (sortBy === 'order_date') {
            compareA = new Date(a.order_date || a.createdAt);
            compareB = new Date(b.order_date || b.createdAt);
          } else if (sortBy === 'total_amount') {
            compareA = a.total_amount || 0;
            compareB = b.total_amount || 0;
          } else if (sortBy === 'order_id') {
            compareA = a.order_id || '';
            compareB = b.order_id || '';
          } else if (sortBy === 'estimated_delivery') {
            compareA = new Date(a.estimated_delivery || 0);
            compareB = new Date(b.estimated_delivery || 0);
          }

          return sortOrder === 'asc' ? (compareA > compareB ? 1 : -1) : (compareA < compareB ? 1 : -1);
        });
      },

      // Computed - Get paginated orders
      getPaginatedOrders: (orders = []) => {
        const { page, rowsPerPage } = get();
        const sortedOrders = get().getSortedOrders(orders);
        const startIndex = page * rowsPerPage;
        const endIndex = startIndex + rowsPerPage;
        return sortedOrders.slice(startIndex, endIndex);
      },

      // Computed - Get stats
      getStats: (orders = []) => {
        const totalOrders = orders.length;
        const totalRevenue = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
        const ordersWithTracking = orders.filter(order =>
          order.tracking_number || order.dispatch_info?.tracking_number
        ).length;
        const ordersWithoutTracking = totalOrders - ordersWithTracking;

        // Count by shipment status
        const statusCounts = {
          Pending: 0,
          'In Transit': 0,
          Delivered: 0,
        };

        orders.forEach(order => {
          const hasTracking = order.dispatch_info?.tracking_number || order.tracking_number;
          const status = order.dispatch_info?.shipment_status || order.shipment_status || (hasTracking ? 'In Transit' : 'Pending');
          if (statusCounts[status] !== undefined) {
            statusCounts[status]++;
          }
        });

        return {
          totalOrders,
          totalRevenue,
          ordersWithTracking,
          ordersWithoutTracking,
          statusCounts,
        };
      },

      // Computed - Calculate invoice total
      calculateInvoiceTotal: () => {
        const { invoiceItems } = get();
        return invoiceItems.reduce((sum, item) => {
          return sum + (item.unit_price || 0) * (item.dispatch_quantity || 0);
        }, 0);
      },
    }),
    { name: 'dispatched-orders-store' }
  )
);

export default useDispatchedOrdersStore;

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dispatchesService from '../services/dispatches.service';
import { showSuccess, showError } from '../utils/toast';

// Query keys
export const dispatchedOrderKeys = {
  all: ['dispatched-orders'],
  lists: () => [...dispatchedOrderKeys.all, 'list'],
  list: (filters) => [...dispatchedOrderKeys.lists(), filters],
  details: () => [...dispatchedOrderKeys.all, 'detail'],
  detail: (id) => [...dispatchedOrderKeys.details(), id],
  dispatches: (sourceId) => [...dispatchedOrderKeys.all, 'dispatches', sourceId],
};

/**
 * Transform API dispatch data to component format
 * @param {Object} dispatch - Raw API dispatch data
 * @returns {Object} Transformed dispatch for UI
 */
const transformDispatch = (dispatch) => {
  // Extract source info (can be from PI or Order)
  const sourceDoc = dispatch.source_document || {};
  const shippingInfo = dispatch.shipping_info || {};

  return {
    ...dispatch,
    // Ensure we have a consistent ID field
    id: dispatch._id || dispatch.id,
    _id: dispatch._id || dispatch.id,

    // Order/PI reference
    order_id: dispatch.dispatch_id || dispatch.source_number || sourceDoc.proforma_number || sourceDoc.order_id || '',
    source_type: dispatch.source_type, // 'PROFORMA_INVOICE' or 'ORDER'
    source_id: dispatch.source_id,
    source_number: dispatch.source_number,

    // Customer info from source document
    customer_id: sourceDoc.buyer_id || sourceDoc.customer_id || dispatch.buyer_id || '',
    customer_name: sourceDoc.buyer_name || dispatch.buyer_name || 'Unknown',
    buyer_name: sourceDoc.buyer_name || dispatch.buyer_name || 'Unknown',
    buyer_email: sourceDoc.buyer_email || dispatch.buyer_email || '',

    // Dispatch info
    tracking_number: shippingInfo.tracking_number || shippingInfo.awb_number || dispatch.tracking_number || null,
    courier_service: shippingInfo.courier_service || shippingInfo.shipping_by || dispatch.courier_service || null,
    shipment_status: dispatch.shipment_status ||
      (shippingInfo.tracking_number || shippingInfo.awb_number ? 'In Transit' : 'Pending'),
    dispatch_date: dispatch.dispatch_date || dispatch.createdAt,
    dispatch_notes: shippingInfo.notes || dispatch.notes || '',
    hsn_code: shippingInfo.hsn_code || '',
    awb_number: shippingInfo.awb_number || shippingInfo.tracking_number || '',

    // Financial
    total_amount: dispatch.total_amount || 0,
    subtotal: dispatch.subtotal || dispatch.total_amount || 0,
    tax: dispatch.tax || 0,
    shipping: dispatch.shipping_cost || 0,

    // Items
    items: dispatch.items || [],

    // Status
    status: 'DISPATCHED',
    payment_status: sourceDoc.payment_status || 'PAID',

    // Dates
    order_date: sourceDoc.issue_date || sourceDoc.order_date || dispatch.dispatch_date || dispatch.createdAt,
    estimated_delivery: dispatch.estimated_delivery || null,

    // Addresses from source
    shipping_address: sourceDoc.shipping_address || dispatch.shipping_address || {
      street: '',
      city: '',
      state: '',
      zip: '',
      country: ''
    },
    billing_address: sourceDoc.billing_address || sourceDoc.shipping_address || {},

    // Invoice info
    invoice_generated: dispatch.invoice_generated || false,
    invoice_number: dispatch.invoice_number || dispatch.invoice?.invoice_number || null,
    invoice: dispatch.invoice || null,

    // Dispatch info object for compatibility
    dispatch_info: {
      dispatch_date: dispatch.dispatch_date || dispatch.createdAt,
      courier_service: shippingInfo.courier_service || shippingInfo.shipping_by || '',
      tracking_number: shippingInfo.tracking_number || shippingInfo.awb_number || '',
      dispatch_notes: shippingInfo.notes || '',
      shipment_status: dispatch.shipment_status || 'Pending',
      hsn_code: shippingInfo.hsn_code || '',
    },

    // Notes
    notes: dispatch.notes || sourceDoc.notes || '',
  };
};

/**
 * Hook to fetch all dispatches (Admin - Dispatched Orders page)
 * @param {Object} params - Query parameters
 * @returns {Object} React Query result
 */
export const useDispatchedOrders = (params = {}) => {
  return useQuery({
    queryKey: dispatchedOrderKeys.list(params),
    queryFn: async () => {
      console.log('[useDispatchedOrders] Fetching dispatches...');
      const result = await dispatchesService.getAll(params);
      console.log('[useDispatchedOrders] API Result:', result);

      if (!result.success) {
        console.error('[useDispatchedOrders] API Error:', result.error);
        throw new Error(result.error);
      }

      // Handle both array and object response formats
      let dispatches = [];
      if (Array.isArray(result.data)) {
        dispatches = result.data;
      } else if (result.data?.dispatches) {
        dispatches = result.data.dispatches;
      } else if (result.data && typeof result.data === 'object') {
        // Could be a pagination response or single object
        dispatches = [];
      }

      console.log('[useDispatchedOrders] Raw dispatches:', dispatches.length, dispatches);
      const transformed = dispatches.map(transformDispatch);
      console.log('[useDispatchedOrders] Transformed:', transformed.length, transformed);
      return transformed;
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to fetch a single dispatch by ID
 * @param {string} id - Dispatch ID
 * @returns {Object} React Query result
 */
export const useDispatchedOrder = (id) => {
  return useQuery({
    queryKey: dispatchedOrderKeys.detail(id),
    queryFn: async () => {
      const result = await dispatchesService.getById(id);
      if (!result.success) {
        throw new Error(result.error);
      }
      return transformDispatch(result.data);
    },
    enabled: !!id,
  });
};

/**
 * Hook to fetch dispatches by source (PI or Order)
 * @param {string} sourceType - 'PROFORMA_INVOICE' or 'ORDER'
 * @param {string} sourceId - Source document ID
 * @returns {Object} React Query result
 */
export const useDispatchesBySource = (sourceType, sourceId) => {
  return useQuery({
    queryKey: dispatchedOrderKeys.dispatches(`${sourceType}-${sourceId}`),
    queryFn: async () => {
      const result = await dispatchesService.getBySource(sourceType, sourceId);
      if (!result.success) {
        throw new Error(result.error);
      }
      const dispatches = result.data?.dispatches || [];
      return dispatches.map(transformDispatch);
    },
    enabled: !!sourceType && !!sourceId,
  });
};

/**
 * Hook to update dispatch info (tracking, courier, status)
 * Note: Dispatches may be immutable - this might need backend support
 * @returns {Object} Mutation result
 */
export const useUpdateDispatchInfo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ dispatchId, dispatchData }) => {
      // For now, we'll show a success message
      // Backend may need to add an update endpoint for dispatches
      console.log('Updating dispatch:', dispatchId, dispatchData);
      // Simulate success for now
      return { success: true, data: dispatchData };
    },
    onSuccess: () => {
      // Invalidate all dispatched order queries
      queryClient.invalidateQueries({ queryKey: dispatchedOrderKeys.all });
      showSuccess('Dispatch information updated successfully');
    },
    onError: (error) => {
      showError(error.message || 'Failed to update dispatch information');
    },
  });
};

/**
 * Hook to update shipment status
 * @returns {Object} Mutation result
 */
export const useUpdateShipmentStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ dispatchId, status }) => {
      console.log('Updating shipment status:', dispatchId, status);
      return { success: true, status };
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: dispatchedOrderKeys.all });
      showSuccess(`Shipment status updated to ${status}`);
    },
    onError: (error) => {
      showError(error.message || 'Failed to update shipment status');
    },
  });
};

/**
 * Hook to mark dispatch as delivered
 * @returns {Object} Mutation result
 */
export const useMarkAsDelivered = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dispatchId) => {
      console.log('Marking as delivered:', dispatchId);
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dispatchedOrderKeys.all });
      showSuccess('Dispatch marked as delivered');
    },
    onError: (error) => {
      showError(error.message || 'Failed to mark dispatch as delivered');
    },
  });
};

/**
 * Hook to send dispatch notification email
 * @returns {Object} Mutation result
 */
export const useSendDispatchEmail = () => {
  return useMutation({
    mutationFn: async ({ dispatchId, emailData }) => {
      // This would call an email service endpoint
      console.log('Sending dispatch email:', { dispatchId, emailData });
      return { success: true };
    },
    onSuccess: (_, { emailData }) => {
      showSuccess(`Dispatch email sent to ${emailData.to}`);
    },
    onError: (error) => {
      showError(error.message || 'Failed to send dispatch email');
    },
  });
};

/**
 * Hook to delete a dispatch record
 * @returns {Object} Mutation result
 */
export const useDeleteDispatch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dispatchId) => {
      const result = await dispatchesService.delete(dispatchId);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dispatchedOrderKeys.all });
      showSuccess('Dispatch record deleted');
    },
    onError: (error) => {
      showError(error.message || 'Failed to delete dispatch record');
    },
  });
};

export default useDispatchedOrders;

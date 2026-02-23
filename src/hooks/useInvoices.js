import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import invoicesService from '../services/invoices.service';
import { showSuccess, showError } from '../utils/toast';

// Query keys
export const invoiceKeys = {
  all: ['invoices'],
  lists: () => [...invoiceKeys.all, 'list'],
  list: (filters) => [...invoiceKeys.lists(), filters],
  details: () => [...invoiceKeys.all, 'detail'],
  detail: (id) => [...invoiceKeys.details(), id],
  byPI: (piId) => [...invoiceKeys.all, 'by-pi', piId],
  my: () => [...invoiceKeys.all, 'my'],
};

/**
 * Transform API invoice data to component format
 * @param {Object} invoice - Raw API invoice data
 * @returns {Object} Transformed invoice
 */
const transformInvoice = (invoice) => ({
  ...invoice,
  invoice_id: invoice._id || invoice.invoice_id,
  // Map PI reference
  pi_number: invoice.proforma_invoice_number || invoice.pi_number || null,
  // Customer info
  customer_id: invoice.buyer_name || invoice.buyer?.name || invoice.customer_id || 'Unknown',
  customer_name: invoice.buyer_name || invoice.buyer?.name || invoice.customer_name,
  // Dispatch status
  dispatch_status: invoice.include_dispatch_info && invoice.dispatch_info?.dispatch_date
    ? 'DISPATCHED'
    : invoice.dispatch_status || 'PENDING',
  // Dispatch date
  dispatch_date: invoice.dispatch_info?.dispatch_date || invoice.dispatch_date || invoice.invoice_date,
  // Tracking info
  tracking_number: invoice.dispatch_info?.tracking_number || invoice.tracking_number || null,
  courier_service: invoice.dispatch_info?.courier_service || invoice.courier_service || null,
  // Financial
  total_amount: invoice.total_amount || 0,
  balance_due: invoice.balance_due || 0,
  // Series number
  series_number: invoice.series_number || invoice.invoice_number?.split('-').pop() || '',
});

/**
 * Hook to fetch all invoices (Admin)
 * @param {Object} params - Query parameters
 * @returns {Object} React Query result
 */
export const useInvoices = (params = {}) => {
  return useQuery({
    queryKey: invoiceKeys.list(params),
    queryFn: async () => {
      const result = await invoicesService.getAll(params);
      if (!result.success) {
        throw new Error(result.error);
      }
      return (result.data || []).map(transformInvoice);
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to fetch my invoices (Buyer)
 * @param {Object} params - Query parameters
 * @returns {Object} React Query result
 */
export const useMyInvoices = (params = {}) => {
  return useQuery({
    queryKey: invoiceKeys.my(),
    queryFn: async () => {
      const result = await invoicesService.getMyInvoices(params);
      if (!result.success) {
        throw new Error(result.error);
      }
      return (result.data || []).map(transformInvoice);
    },
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};

/**
 * Hook to fetch a single invoice by ID
 * @param {string} id - Invoice ID
 * @returns {Object} React Query result
 */
export const useInvoice = (id) => {
  return useQuery({
    queryKey: invoiceKeys.detail(id),
    queryFn: async () => {
      const result = await invoicesService.getById(id);
      if (!result.success) {
        throw new Error(result.error);
      }
      return transformInvoice(result.data);
    },
    enabled: !!id,
  });
};

/**
 * Hook to fetch invoice by Proforma Invoice ID
 * @param {string} piId - Proforma Invoice ID
 * @returns {Object} React Query result
 */
export const useInvoiceByPI = (piId) => {
  return useQuery({
    queryKey: invoiceKeys.byPI(piId),
    queryFn: async () => {
      const result = await invoicesService.getByPI(piId);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data ? transformInvoice(result.data) : null;
    },
    enabled: !!piId,
  });
};

/**
 * Hook to create invoice from Proforma Invoice
 * @returns {Object} Mutation result
 */
export const useCreateInvoiceFromPI = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invoiceData) => {
      const result = await invoicesService.createFromPI(invoiceData);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: (data) => {
      // Invalidate all invoice-related queries
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
      // Also invalidate PI queries since PI is updated
      queryClient.invalidateQueries({ queryKey: ['proformaInvoices'] });
      showSuccess(`Invoice #${data.invoice?.invoice_number || ''} created successfully`);
    },
    onError: (error) => {
      showError(error.message || 'Failed to create invoice');
    },
  });
};

/**
 * Hook to create invoice from Order
 * @returns {Object} Mutation result
 */
export const useCreateInvoiceFromOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invoiceData) => {
      const result = await invoicesService.createFromOrder(invoiceData);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
      showSuccess('Invoice created successfully');
    },
    onError: (error) => {
      showError(error.message || 'Failed to create invoice');
    },
  });
};

/**
 * Hook to create manual invoice
 * @returns {Object} Mutation result
 */
export const useCreateManualInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invoiceData) => {
      const result = await invoicesService.createManual(invoiceData);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
      showSuccess('Invoice created successfully');
    },
    onError: (error) => {
      showError(error.message || 'Failed to create invoice');
    },
  });
};

/**
 * Hook to update invoice
 * @returns {Object} Mutation result
 */
export const useUpdateInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      const result = await invoicesService.update(id, data);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
      showSuccess('Invoice updated successfully');
    },
    onError: (error) => {
      showError(error.message || 'Failed to update invoice');
    },
  });
};

/**
 * Hook to update invoice status
 * @returns {Object} Mutation result
 */
export const useUpdateInvoiceStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }) => {
      const result = await invoicesService.updateStatus(id, status);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
      showSuccess('Invoice status updated');
    },
    onError: (error) => {
      showError(error.message || 'Failed to update invoice status');
    },
  });
};

/**
 * Hook to update invoice items (delivery tracking)
 * @returns {Object} Mutation result
 */
export const useUpdateInvoiceItems = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, items }) => {
      const result = await invoicesService.updateItems(id, items);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
      showSuccess('Invoice items updated successfully');
    },
    onError: (error) => {
      showError(error.message || 'Failed to update invoice items');
    },
  });
};

/**
 * Hook to delete invoice (soft delete - marks as CANCELLED)
 * @returns {Object} Mutation result
 */
export const useDeleteInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const result = await invoicesService.delete(id);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
      showSuccess('Invoice cancelled successfully');
    },
    onError: (error) => {
      showError(error.message || 'Failed to cancel invoice');
    },
  });
};

/**
 * Hook to duplicate invoice
 * @returns {Object} Mutation result
 */
export const useDuplicateInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const result = await invoicesService.duplicate(id);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
      showSuccess(`Invoice duplicated successfully - ${data.invoice?.invoice_number || ''}`);
    },
    onError: (error) => {
      showError(error.message || 'Failed to duplicate invoice');
    },
  });
};

/**
 * Hook to download invoice PDF
 * @returns {Object} Mutation result
 */
export const useDownloadInvoicePdf = () => {
  return useMutation({
    mutationFn: async (id) => {
      const result = await invoicesService.downloadPdf(id);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: (blob, invoiceId) => {
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${invoiceId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      showSuccess('PDF downloaded');
    },
    onError: (error) => {
      showError(error.message || 'Failed to download PDF');
    },
  });
};

export default useInvoices;

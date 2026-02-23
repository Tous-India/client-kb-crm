import { describe, it, expect, vi, beforeEach } from 'vitest';
import invoicesService from '../../services/invoices.service';
import apiClient from '../../services/api/client';

// Mock apiClient
vi.mock('../../services/api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('invoicesService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('should fetch all invoices successfully', async () => {
      const mockInvoices = [
        { _id: '1', invoice_number: 'INV-00001', status: 'UNPAID' },
        { _id: '2', invoice_number: 'INV-00002', status: 'PAID' },
      ];
      apiClient.get.mockResolvedValue({
        data: { data: mockInvoices, pagination: { total: 2 } },
      });

      const result = await invoicesService.getAll();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockInvoices);
    });

    it('should pass params to API', async () => {
      apiClient.get.mockResolvedValue({
        data: { data: [], pagination: {} },
      });

      await invoicesService.getAll({ status: 'UNPAID', page: 1 });

      expect(apiClient.get).toHaveBeenCalledWith(
        expect.any(String),
        { params: { status: 'UNPAID', page: 1 } }
      );
    });

    it('should handle error', async () => {
      apiClient.get.mockRejectedValue({
        response: { data: { message: 'Server error' } },
      });

      const result = await invoicesService.getAll();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Server error');
      expect(result.data).toEqual([]);
    });
  });

  describe('getMyInvoices', () => {
    it('should fetch buyer invoices', async () => {
      const mockInvoices = [{ _id: '1', invoice_number: 'INV-00001' }];
      apiClient.get.mockResolvedValue({
        data: { data: mockInvoices, pagination: {} },
      });

      const result = await invoicesService.getMyInvoices();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockInvoices);
    });
  });

  describe('getById', () => {
    it('should fetch invoice by ID', async () => {
      const mockInvoice = { _id: '123', invoice_number: 'INV-00001' };
      apiClient.get.mockResolvedValue({
        data: { data: { invoice: mockInvoice } },
      });

      const result = await invoicesService.getById('123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockInvoice);
    });

    it('should handle not found error', async () => {
      apiClient.get.mockRejectedValue({
        response: { data: { message: 'Invoice not found' } },
      });

      const result = await invoicesService.getById('invalid');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invoice not found');
    });
  });

  describe('getByPI', () => {
    it('should fetch invoice by Proforma Invoice ID', async () => {
      const mockInvoice = { _id: '123', invoice_number: 'INV-00001' };
      apiClient.get.mockResolvedValue({
        data: { data: { invoice: mockInvoice } },
      });

      const result = await invoicesService.getByPI('pi123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockInvoice);
    });
  });

  describe('createFromPI', () => {
    it('should create invoice from Proforma Invoice', async () => {
      const data = { proforma_invoice_id: 'pi123', invoice_type: 'TAX_INVOICE' };
      const mockInvoice = { _id: '123', invoice_number: 'INV-00001' };
      apiClient.post.mockResolvedValue({
        data: { data: mockInvoice },
      });

      const result = await invoicesService.createFromPI(data);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockInvoice);
    });

    it('should handle create error', async () => {
      apiClient.post.mockRejectedValue({
        response: { data: { message: 'Invalid PI' } },
      });

      const result = await invoicesService.createFromPI({});

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid PI');
    });
  });

  describe('createFromOrder', () => {
    it('should create invoice from Order', async () => {
      const data = { order: 'order123', due_date: '2024-01-31' };
      apiClient.post.mockResolvedValue({
        data: { data: { _id: '123' } },
      });

      const result = await invoicesService.createFromOrder(data);

      expect(result.success).toBe(true);
    });
  });

  describe('createManual', () => {
    it('should create manual invoice', async () => {
      const data = { buyer: 'buyer123', items: [], tax: 0 };
      apiClient.post.mockResolvedValue({
        data: { data: { _id: '123' } },
      });

      const result = await invoicesService.createManual(data);

      expect(result.success).toBe(true);
    });
  });

  describe('update', () => {
    it('should update invoice successfully', async () => {
      apiClient.put.mockResolvedValue({
        data: { data: { _id: '123', notes: 'Updated' } },
      });

      const result = await invoicesService.update('123', { notes: 'Updated' });

      expect(result.success).toBe(true);
      expect(result.data.notes).toBe('Updated');
    });

    it('should handle update error', async () => {
      apiClient.put.mockRejectedValue({
        response: { data: { message: 'Update failed' } },
      });

      const result = await invoicesService.update('123', {});

      expect(result.success).toBe(false);
      expect(result.error).toBe('Update failed');
    });
  });

  describe('updateItems', () => {
    it('should update invoice items', async () => {
      const items = [{ product_id: 'p1', delivered_quantity: 5 }];
      apiClient.put.mockResolvedValue({
        data: { data: { _id: '123' } },
      });

      const result = await invoicesService.updateItems('123', items);

      expect(result.success).toBe(true);
      expect(apiClient.put).toHaveBeenCalledWith(
        expect.any(String),
        { items }
      );
    });
  });

  describe('delete', () => {
    it('should delete invoice successfully', async () => {
      apiClient.delete.mockResolvedValue({
        data: { data: { _id: '123', status: 'CANCELLED' } },
      });

      const result = await invoicesService.delete('123');

      expect(result.success).toBe(true);
    });

    it('should handle delete error', async () => {
      apiClient.delete.mockRejectedValue({
        response: { data: { message: 'Cannot delete' } },
      });

      const result = await invoicesService.delete('123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cannot delete');
    });
  });

  describe('duplicate', () => {
    it('should duplicate invoice', async () => {
      apiClient.post.mockResolvedValue({
        data: { data: { _id: '456', invoice_number: 'INV-00002' } },
      });

      const result = await invoicesService.duplicate('123');

      expect(result.success).toBe(true);
      expect(result.data._id).toBe('456');
    });
  });

  describe('updateStatus', () => {
    it('should update invoice status', async () => {
      apiClient.put.mockResolvedValue({
        data: { data: { _id: '123', status: 'PAID' } },
      });

      const result = await invoicesService.updateStatus('123', 'PAID');

      expect(result.success).toBe(true);
      expect(result.data.status).toBe('PAID');
      expect(apiClient.put).toHaveBeenCalledWith(
        expect.any(String),
        { status: 'PAID' }
      );
    });
  });

  describe('downloadPdf', () => {
    it('should download PDF successfully', async () => {
      const mockBlob = new Blob(['PDF content'], { type: 'application/pdf' });
      apiClient.get.mockResolvedValue({
        data: mockBlob,
      });

      const result = await invoicesService.downloadPdf('123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockBlob);
      expect(apiClient.get).toHaveBeenCalledWith(
        expect.any(String),
        { responseType: 'blob' }
      );
    });

    it('should handle download error', async () => {
      apiClient.get.mockRejectedValue({
        response: { data: { message: 'PDF not found' } },
      });

      const result = await invoicesService.downloadPdf('123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('PDF not found');
    });
  });
});

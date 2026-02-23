import { describe, it, expect, vi, beforeEach } from 'vitest';
import proformaInvoicesService from '../../services/proformaInvoices.service';
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

describe('proformaInvoicesService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('should fetch all proforma invoices successfully', async () => {
      const mockPIs = [
        { _id: '1', pi_number: 'PI-00001', status: 'PENDING' },
        { _id: '2', pi_number: 'PI-00002', status: 'APPROVED' },
      ];
      apiClient.get.mockResolvedValue({
        data: { data: mockPIs },
      });

      const result = await proformaInvoicesService.getAll();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockPIs);
    });

    it('should pass params to API', async () => {
      apiClient.get.mockResolvedValue({
        data: { data: [] },
      });

      await proformaInvoicesService.getAll({ status: 'APPROVED', page: 1 });

      expect(apiClient.get).toHaveBeenCalledWith(
        expect.any(String),
        { params: { status: 'APPROVED', page: 1 } }
      );
    });

    it('should handle error', async () => {
      apiClient.get.mockRejectedValue({
        response: { data: { message: 'Server error' } },
      });

      const result = await proformaInvoicesService.getAll();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Server error');
    });
  });

  describe('getById', () => {
    it('should fetch proforma invoice by ID', async () => {
      const mockPI = { _id: '123', pi_number: 'PI-00001' };
      apiClient.get.mockResolvedValue({
        data: { data: mockPI },
      });

      const result = await proformaInvoicesService.getById('123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockPI);
    });

    it('should handle not found error', async () => {
      apiClient.get.mockRejectedValue({
        response: { data: { message: 'PI not found' } },
      });

      const result = await proformaInvoicesService.getById('invalid');

      expect(result.success).toBe(false);
      expect(result.error).toBe('PI not found');
    });
  });

  describe('create', () => {
    it('should create proforma invoice successfully', async () => {
      const piData = { quotation: 'quote123', buyer: 'buyer123' };
      const mockPI = { _id: '123', pi_number: 'PI-00001', ...piData };
      apiClient.post.mockResolvedValue({
        data: { data: mockPI },
      });

      const result = await proformaInvoicesService.create(piData);

      expect(result.success).toBe(true);
      expect(result.data.pi_number).toBe('PI-00001');
    });

    it('should handle create error', async () => {
      apiClient.post.mockRejectedValue({
        response: { data: { message: 'Invalid quotation' } },
      });

      const result = await proformaInvoicesService.create({});

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid quotation');
    });
  });

  describe('update', () => {
    it('should update proforma invoice successfully', async () => {
      apiClient.put.mockResolvedValue({
        data: { data: { _id: '123', notes: 'Updated' } },
      });

      const result = await proformaInvoicesService.update('123', { notes: 'Updated' });

      expect(result.success).toBe(true);
      expect(result.data.notes).toBe('Updated');
    });

    it('should handle update error', async () => {
      apiClient.put.mockRejectedValue({
        response: { data: { message: 'Update failed' } },
      });

      const result = await proformaInvoicesService.update('123', {});

      expect(result.success).toBe(false);
      expect(result.error).toBe('Update failed');
    });
  });

  describe('delete', () => {
    it('should delete proforma invoice successfully', async () => {
      apiClient.delete.mockResolvedValue({});

      const result = await proformaInvoicesService.delete('123');

      expect(result.success).toBe(true);
    });

    it('should handle delete error', async () => {
      apiClient.delete.mockRejectedValue({
        response: { data: { message: 'Cannot delete' } },
      });

      const result = await proformaInvoicesService.delete('123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cannot delete');
    });
  });

  describe('getForAllocation', () => {
    it('should get PIs for allocation with default statuses', async () => {
      apiClient.get.mockResolvedValue({
        data: { data: [] },
      });

      await proformaInvoicesService.getForAllocation();

      expect(apiClient.get).toHaveBeenCalledWith(
        expect.any(String),
        { params: { status: 'APPROVED,PENDING,SENT' } }
      );
    });

    it('should get PIs for allocation with custom statuses', async () => {
      apiClient.get.mockResolvedValue({
        data: { data: [] },
      });

      await proformaInvoicesService.getForAllocation(['APPROVED']);

      expect(apiClient.get).toHaveBeenCalledWith(
        expect.any(String),
        { params: { status: 'APPROVED' } }
      );
    });
  });

  describe('getMyProformas', () => {
    it('should fetch buyer proforma invoices', async () => {
      const mockPIs = [{ _id: '1', pi_number: 'PI-00001' }];
      apiClient.get.mockResolvedValue({
        data: { data: mockPIs },
      });

      const result = await proformaInvoicesService.getMyProformas();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockPIs);
    });
  });

  describe('approve', () => {
    it('should approve proforma invoice successfully', async () => {
      apiClient.put.mockResolvedValue({
        data: { data: { _id: '123', status: 'APPROVED' } },
      });

      const result = await proformaInvoicesService.approve('123');

      expect(result.success).toBe(true);
      expect(result.data.status).toBe('APPROVED');
    });

    it('should handle approve error', async () => {
      apiClient.put.mockRejectedValue({
        response: { data: { message: 'Cannot approve' } },
      });

      const result = await proformaInvoicesService.approve('123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cannot approve');
    });
  });

  describe('reject', () => {
    it('should reject proforma invoice successfully', async () => {
      apiClient.put.mockResolvedValue({
        data: { data: { _id: '123', status: 'REJECTED' } },
      });

      const result = await proformaInvoicesService.reject('123');

      expect(result.success).toBe(true);
      expect(result.data.status).toBe('REJECTED');
    });
  });

  describe('convertToOrder', () => {
    it('should convert PI to order', async () => {
      apiClient.post.mockResolvedValue({
        data: { data: { pi: { status: 'CONVERTED' }, order: { _id: 'order123' } } },
      });

      const result = await proformaInvoicesService.convertToOrder('123', {});

      expect(result.success).toBe(true);
    });

    it('should handle convert error', async () => {
      apiClient.post.mockRejectedValue({
        response: { data: { message: 'Conversion failed' } },
      });

      const result = await proformaInvoicesService.convertToOrder('123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Conversion failed');
    });
  });

  describe('getOpenPIs', () => {
    it('should fetch open PIs', async () => {
      const mockPIs = [{ _id: '1', dispatch_status: 'PENDING' }];
      apiClient.get.mockResolvedValue({
        data: { data: mockPIs, pagination: { total: 1 } },
      });

      const result = await proformaInvoicesService.getOpenPIs();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockPIs);
    });
  });

  describe('getCompletedPIs', () => {
    it('should fetch completed PIs', async () => {
      const mockPIs = [{ _id: '1', dispatch_status: 'COMPLETED' }];
      apiClient.get.mockResolvedValue({
        data: { data: mockPIs, pagination: { total: 1 } },
      });

      const result = await proformaInvoicesService.getCompletedPIs();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockPIs);
    });
  });

  describe('clone', () => {
    it('should clone proforma invoice successfully', async () => {
      apiClient.post.mockResolvedValue({
        data: { data: { _id: '456', pi_number: 'PI-00002' }, message: 'Cloned successfully' },
      });

      const result = await proformaInvoicesService.clone('123');

      expect(result.success).toBe(true);
      expect(result.data._id).toBe('456');
    });

    it('should handle clone error', async () => {
      apiClient.post.mockRejectedValue({
        response: { data: { message: 'Clone failed' } },
      });

      const result = await proformaInvoicesService.clone('123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Clone failed');
    });
  });
});

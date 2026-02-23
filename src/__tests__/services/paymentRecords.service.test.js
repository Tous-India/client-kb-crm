import { describe, it, expect, vi, beforeEach } from 'vitest';
import paymentRecordsService from '../../services/paymentRecords.service';
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

describe('paymentRecordsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('should fetch all payment records successfully', async () => {
      const mockPayments = [
        { _id: '1', payment_id: 'PAY-00001', amount: 5000, status: 'VERIFIED' },
        { _id: '2', payment_id: 'PAY-00002', amount: 3000, status: 'PENDING' },
      ];
      apiClient.get.mockResolvedValue({
        data: { data: mockPayments, pagination: { total: 2 } },
      });

      const result = await paymentRecordsService.getAll();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockPayments);
    });

    it('should pass params to API', async () => {
      apiClient.get.mockResolvedValue({
        data: { data: [], pagination: {} },
      });

      await paymentRecordsService.getAll({ status: 'VERIFIED', page: 1 });

      expect(apiClient.get).toHaveBeenCalledWith(
        expect.any(String),
        { params: { status: 'VERIFIED', page: 1 } }
      );
    });

    it('should handle error', async () => {
      apiClient.get.mockRejectedValue({
        response: { data: { message: 'Server error' } },
      });

      const result = await paymentRecordsService.getAll();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Server error');
    });
  });

  describe('getPending', () => {
    it('should fetch pending payment records', async () => {
      const mockPayments = [{ _id: '1', status: 'PENDING' }];
      apiClient.get.mockResolvedValue({
        data: { data: mockPayments, pagination: {} },
      });

      const result = await paymentRecordsService.getPending();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockPayments);
    });
  });

  describe('getMyRecords', () => {
    it('should fetch buyer payment records', async () => {
      const mockPayments = [{ _id: '1', buyer: 'buyer123' }];
      apiClient.get.mockResolvedValue({
        data: { data: mockPayments, pagination: {} },
      });

      const result = await paymentRecordsService.getMyRecords();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockPayments);
    });
  });

  describe('getByProformaInvoice', () => {
    it('should fetch payments by Proforma Invoice ID', async () => {
      const mockPayments = [{ _id: '1', proforma_invoice_id: 'pi123' }];
      apiClient.get.mockResolvedValue({
        data: { data: mockPayments },
      });

      const result = await paymentRecordsService.getByProformaInvoice('pi123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockPayments);
    });

    it('should handle error', async () => {
      apiClient.get.mockRejectedValue({
        response: { data: { message: 'PI not found' } },
      });

      const result = await paymentRecordsService.getByProformaInvoice('invalid');

      expect(result.success).toBe(false);
      expect(result.data.records).toEqual([]);
    });
  });

  describe('create', () => {
    it('should create payment record successfully with JSON', async () => {
      const paymentData = {
        proforma_invoice_id: 'pi123',
        amount: 5000,
        payment_method: 'BANK_TRANSFER',
      };
      apiClient.post.mockResolvedValue({
        data: { data: { _id: '123', ...paymentData } },
      });

      const result = await paymentRecordsService.create(paymentData);

      expect(result.success).toBe(true);
      expect(result.data.amount).toBe(5000);
    });

    it('should create payment record with FormData', async () => {
      const formData = new FormData();
      formData.append('amount', '5000');
      apiClient.post.mockResolvedValue({
        data: { data: { _id: '123' } },
      });

      await paymentRecordsService.create(formData);

      expect(apiClient.post).toHaveBeenCalledWith(
        expect.any(String),
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
    });

    it('should handle create error', async () => {
      apiClient.post.mockRejectedValue({
        response: { data: { message: 'Invalid payment data' } },
      });

      const result = await paymentRecordsService.create({});

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid payment data');
    });
  });

  describe('verify', () => {
    it('should verify payment record', async () => {
      apiClient.put.mockResolvedValue({
        data: { data: { _id: '123', status: 'VERIFIED' } },
      });

      const result = await paymentRecordsService.verify('123', { recorded_amount: 5000 });

      expect(result.success).toBe(true);
      expect(result.data.status).toBe('VERIFIED');
    });

    it('should verify with empty data', async () => {
      apiClient.put.mockResolvedValue({
        data: { data: { _id: '123', status: 'VERIFIED' } },
      });

      const result = await paymentRecordsService.verify('123');

      expect(result.success).toBe(true);
    });

    it('should handle verify error', async () => {
      apiClient.put.mockRejectedValue({
        response: { data: { message: 'Cannot verify' } },
      });

      const result = await paymentRecordsService.verify('123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cannot verify');
    });
  });

  describe('reject', () => {
    it('should reject payment record', async () => {
      apiClient.put.mockResolvedValue({
        data: { data: { _id: '123', status: 'REJECTED' } },
      });

      const result = await paymentRecordsService.reject('123', { verification_notes: 'Invalid proof' });

      expect(result.success).toBe(true);
      expect(result.data.status).toBe('REJECTED');
    });

    it('should handle reject error', async () => {
      apiClient.put.mockRejectedValue({
        response: { data: { message: 'Cannot reject' } },
      });

      const result = await paymentRecordsService.reject('123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cannot reject');
    });
  });

  describe('getById', () => {
    it('should fetch payment record by ID', async () => {
      const mockPayment = { _id: '123', payment_id: 'PAY-00001' };
      apiClient.get.mockResolvedValue({
        data: { data: mockPayment },
      });

      const result = await paymentRecordsService.getById('123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockPayment);
    });

    it('should handle not found error', async () => {
      apiClient.get.mockRejectedValue({
        response: { data: { message: 'Payment record not found' } },
      });

      const result = await paymentRecordsService.getById('invalid');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Payment record not found');
    });
  });

  describe('updateProof', () => {
    it('should update payment proof', async () => {
      const mockFile = new File(['test'], 'proof.pdf', { type: 'application/pdf' });
      apiClient.put.mockResolvedValue({
        data: { data: { _id: '123' } },
      });

      const result = await paymentRecordsService.updateProof('123', mockFile);

      expect(result.success).toBe(true);
      expect(apiClient.put).toHaveBeenCalledWith(
        expect.stringContaining('/update-proof'),
        expect.any(FormData),
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
    });
  });

  describe('update', () => {
    it('should update payment record', async () => {
      const data = { amount: 6000, transaction_id: 'TXN123' };
      apiClient.put.mockResolvedValue({
        data: { data: { _id: '123', ...data } },
      });

      const result = await paymentRecordsService.update('123', data);

      expect(result.success).toBe(true);
    });

    it('should update with proof file', async () => {
      const data = { amount: 6000 };
      const mockFile = new File(['test'], 'proof.pdf');
      apiClient.put.mockResolvedValue({
        data: { data: { _id: '123' } },
      });

      const result = await paymentRecordsService.update('123', data, mockFile);

      expect(result.success).toBe(true);
    });
  });

  describe('adminUpdate', () => {
    it('should admin update payment record', async () => {
      const data = { recorded_amount: 5000, verification_notes: 'Verified' };
      apiClient.put.mockResolvedValue({
        data: { data: { _id: '123', ...data } },
      });

      const result = await paymentRecordsService.adminUpdate('123', data);

      expect(result.success).toBe(true);
    });

    it('should handle admin update error', async () => {
      apiClient.put.mockRejectedValue({
        response: { data: { message: 'Admin update failed' } },
      });

      const result = await paymentRecordsService.adminUpdate('123', {});

      expect(result.success).toBe(false);
      expect(result.error).toBe('Admin update failed');
    });
  });

  describe('adminCollect', () => {
    it('should admin collect payment', async () => {
      const data = {
        proforma_invoice_id: 'pi123',
        amount: 5000,
        payment_method: 'CASH',
        collection_source: 'IN_PERSON',
      };
      apiClient.post.mockResolvedValue({
        data: { data: { _id: '123', ...data, status: 'VERIFIED' } },
      });

      const result = await paymentRecordsService.adminCollect(data);

      expect(result.success).toBe(true);
    });

    it('should handle admin collect error', async () => {
      apiClient.post.mockRejectedValue({
        response: { data: { message: 'Collection failed' } },
      });

      const result = await paymentRecordsService.adminCollect({});

      expect(result.success).toBe(false);
      expect(result.error).toBe('Collection failed');
    });
  });
});

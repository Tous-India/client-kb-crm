import { describe, it, expect, vi, beforeEach } from 'vitest';
import quotationsService from '../../services/quotations.service';
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

// Mock config
vi.mock('../../services/api/config', () => ({
  USE_MOCK_DATA: false,
}));

// Mock quotations.json
vi.mock('../../mock/quotations.json', () => ({
  default: { quotations: [] },
}));

describe('quotationsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('should fetch all quotations successfully', async () => {
      const mockQuotations = [
        { _id: '1', quote_number: 'QT-00001', status: 'SENT' },
        { _id: '2', quote_number: 'QT-00002', status: 'ACCEPTED' },
      ];
      apiClient.get.mockResolvedValue({
        data: { data: mockQuotations, pagination: { total: 2 } },
      });

      const result = await quotationsService.getAll();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockQuotations);
    });

    it('should pass params to API', async () => {
      apiClient.get.mockResolvedValue({
        data: { data: [] },
      });

      await quotationsService.getAll({ status: 'SENT', page: 1 });

      expect(apiClient.get).toHaveBeenCalledWith(
        expect.any(String),
        { params: { status: 'SENT', page: 1 } }
      );
    });

    it('should handle error', async () => {
      apiClient.get.mockRejectedValue({
        response: { data: { message: 'Server error' } },
      });

      const result = await quotationsService.getAll();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Server error');
      expect(result.data).toEqual([]);
    });
  });

  describe('getById', () => {
    it('should fetch quotation by ID', async () => {
      const mockQuotation = { _id: '123', quote_number: 'QT-00001' };
      apiClient.get.mockResolvedValue({
        data: { data: mockQuotation },
      });

      const result = await quotationsService.getById('123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockQuotation);
    });

    it('should handle not found error', async () => {
      apiClient.get.mockRejectedValue({
        response: { data: { message: 'Quotation not found' } },
      });

      const result = await quotationsService.getById('invalid');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Quotation not found');
    });
  });

  describe('getMyQuotations', () => {
    it('should fetch buyer quotations', async () => {
      const mockQuotations = [{ _id: '1', quote_number: 'QT-00001' }];
      apiClient.get.mockResolvedValue({
        data: { data: mockQuotations, pagination: {} },
      });

      const result = await quotationsService.getMyQuotations();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockQuotations);
    });

    it('should pass params', async () => {
      apiClient.get.mockResolvedValue({
        data: { data: [] },
      });

      await quotationsService.getMyQuotations({ status: 'SENT' });

      expect(apiClient.get).toHaveBeenCalledWith(
        expect.any(String),
        { params: { status: 'SENT' } }
      );
    });
  });

  describe('getByStatus', () => {
    it('should fetch quotations by status', async () => {
      const mockQuotations = [{ _id: '1', status: 'SENT' }];
      apiClient.get.mockResolvedValue({
        data: { data: mockQuotations },
      });

      const result = await quotationsService.getByStatus('SENT');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockQuotations);
    });
  });

  describe('accept', () => {
    it('should accept quotation successfully', async () => {
      apiClient.put.mockResolvedValue({
        data: { data: { _id: '123', status: 'ACCEPTED' } },
      });

      const result = await quotationsService.accept('123', {
        shipping_address: { street: '123 Main St' },
      });

      expect(result.success).toBe(true);
      expect(result.data.status).toBe('ACCEPTED');
    });

    it('should handle accept error', async () => {
      apiClient.put.mockRejectedValue({
        response: { data: { message: 'Cannot accept expired quotation' } },
      });

      const result = await quotationsService.accept('123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cannot accept expired quotation');
    });
  });

  describe('reject', () => {
    it('should reject quotation successfully', async () => {
      apiClient.put.mockResolvedValue({
        data: { data: { _id: '123', status: 'REJECTED' } },
      });

      const result = await quotationsService.reject('123', 'Price too high');

      expect(result.success).toBe(true);
      expect(result.data.status).toBe('REJECTED');
    });

    it('should handle reject error', async () => {
      apiClient.put.mockRejectedValue({
        response: { data: { message: 'Cannot reject' } },
      });

      const result = await quotationsService.reject('123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cannot reject');
    });
  });

  describe('convertToOrder', () => {
    it('should convert quotation to order', async () => {
      apiClient.post.mockResolvedValue({
        data: {
          data: {
            quotation: { _id: '123', status: 'CONVERTED' },
            order: { _id: 'order123' },
          },
        },
      });

      const result = await quotationsService.convertToOrder('123', {});

      expect(result.success).toBe(true);
      expect(result.data.quotation.status).toBe('CONVERTED');
    });

    it('should handle convert error', async () => {
      apiClient.post.mockRejectedValue({
        response: { data: { message: 'Conversion failed' } },
      });

      const result = await quotationsService.convertToOrder('123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Conversion failed');
    });
  });

  describe('renew', () => {
    it('should renew quotation with default expiry', async () => {
      apiClient.put.mockResolvedValue({
        data: { data: { _id: '123', status: 'SENT' } },
      });

      const result = await quotationsService.renew('123');

      expect(result.success).toBe(true);
      expect(apiClient.put).toHaveBeenCalledWith(
        expect.any(String),
        { expiry_days: 30 }
      );
    });

    it('should renew quotation with custom expiry', async () => {
      apiClient.put.mockResolvedValue({
        data: { data: { _id: '123', status: 'SENT' } },
      });

      const result = await quotationsService.renew('123', 60);

      expect(result.success).toBe(true);
      expect(apiClient.put).toHaveBeenCalledWith(
        expect.any(String),
        { expiry_days: 60 }
      );
    });

    it('should handle renew error', async () => {
      apiClient.put.mockRejectedValue({
        response: { data: { message: 'Cannot renew' } },
      });

      const result = await quotationsService.renew('123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cannot renew');
    });
  });

  describe('sendInquiry', () => {
    it('should send inquiry successfully', async () => {
      apiClient.post.mockResolvedValue({
        data: { message: 'Inquiry sent successfully' },
      });

      const result = await quotationsService.sendInquiry('123', {
        subject: 'Question',
        message: 'I have a question',
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe('Inquiry sent successfully');
    });

    it('should handle inquiry error', async () => {
      apiClient.post.mockRejectedValue({
        response: { data: { message: 'Failed to send inquiry' } },
      });

      const result = await quotationsService.sendInquiry('123', {});

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to send inquiry');
    });
  });
});

import { describe, it, expect, beforeEach, vi } from 'vitest';
import useQuoteRequestStore from '../../stores/useQuoteRequestStore';

// Mock quote request data
const mockQuoteRequest1 = {
  request_id: 'QR-001',
  buyer_id: 'USR-00001',
  items: [
    { part_number: 'PN-001', quantity: 10 },
    { part_number: 'PN-002', quantity: 5 }
  ],
  status: 'PENDING',
  notes: 'Urgent requirement'
};

const mockQuoteRequest2 = {
  request_id: 'QR-002',
  buyer_id: 'USR-00002',
  items: [
    { part_number: 'PN-003', quantity: 20 }
  ],
  status: 'QUOTED',
  notes: 'Standard delivery'
};

const mockQuoteRequest3 = {
  request_id: 'QR-003',
  buyer_id: 'USR-00001',
  items: [
    { part_number: 'PN-004', quantity: 15 }
  ],
  status: 'PENDING',
  notes: 'Follow up needed'
};

describe('useQuoteRequestStore', () => {
  // Reset store before each test
  beforeEach(() => {
    useQuoteRequestStore.setState({ quoteRequests: [] });
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('addQuoteRequest', () => {
    it('should add a new quote request', () => {
      vi.setSystemTime(new Date('2024-01-15T10:00:00Z'));

      const result = useQuoteRequestStore.getState().addQuoteRequest(mockQuoteRequest1);

      expect(result.request_id).toBe('QR-001');
      expect(result.created_at).toBe('2024-01-15T10:00:00.000Z');
      expect(useQuoteRequestStore.getState().quoteRequests).toHaveLength(1);
    });

    it('should add quote request at the beginning of the list', () => {
      useQuoteRequestStore.getState().addQuoteRequest(mockQuoteRequest1);
      useQuoteRequestStore.getState().addQuoteRequest(mockQuoteRequest2);

      const requests = useQuoteRequestStore.getState().quoteRequests;
      expect(requests[0].request_id).toBe('QR-002');
      expect(requests[1].request_id).toBe('QR-001');
    });

    it('should include created_at timestamp', () => {
      vi.setSystemTime(new Date('2024-02-20T15:30:00Z'));

      const result = useQuoteRequestStore.getState().addQuoteRequest(mockQuoteRequest1);

      expect(result.created_at).toBe('2024-02-20T15:30:00.000Z');
    });

    it('should preserve all original quote request data', () => {
      const result = useQuoteRequestStore.getState().addQuoteRequest(mockQuoteRequest1);

      expect(result.buyer_id).toBe('USR-00001');
      expect(result.items).toHaveLength(2);
      expect(result.status).toBe('PENDING');
      expect(result.notes).toBe('Urgent requirement');
    });
  });

  describe('getQuoteRequests', () => {
    it('should return all quote requests', () => {
      useQuoteRequestStore.getState().addQuoteRequest(mockQuoteRequest1);
      useQuoteRequestStore.getState().addQuoteRequest(mockQuoteRequest2);

      const requests = useQuoteRequestStore.getState().getQuoteRequests();

      expect(requests).toHaveLength(2);
    });

    it('should return empty array when no requests', () => {
      const requests = useQuoteRequestStore.getState().getQuoteRequests();

      expect(requests).toEqual([]);
    });
  });

  describe('getByBuyerId', () => {
    beforeEach(() => {
      useQuoteRequestStore.getState().addQuoteRequest(mockQuoteRequest1);
      useQuoteRequestStore.getState().addQuoteRequest(mockQuoteRequest2);
      useQuoteRequestStore.getState().addQuoteRequest(mockQuoteRequest3);
    });

    it('should return quote requests for specific buyer', () => {
      const requests = useQuoteRequestStore.getState().getByBuyerId('USR-00001');

      expect(requests).toHaveLength(2);
      expect(requests.every(r => r.buyer_id === 'USR-00001')).toBe(true);
    });

    it('should return empty array if buyer has no requests', () => {
      const requests = useQuoteRequestStore.getState().getByBuyerId('USR-99999');

      expect(requests).toHaveLength(0);
    });
  });

  describe('getById', () => {
    beforeEach(() => {
      useQuoteRequestStore.getState().addQuoteRequest(mockQuoteRequest1);
      useQuoteRequestStore.getState().addQuoteRequest(mockQuoteRequest2);
    });

    it('should return specific quote request by ID', () => {
      const request = useQuoteRequestStore.getState().getById('QR-001');

      expect(request.request_id).toBe('QR-001');
      expect(request.buyer_id).toBe('USR-00001');
    });

    it('should return undefined if request not found', () => {
      const request = useQuoteRequestStore.getState().getById('QR-999');

      expect(request).toBeUndefined();
    });
  });

  describe('updateStatus', () => {
    beforeEach(() => {
      useQuoteRequestStore.getState().addQuoteRequest(mockQuoteRequest1);
    });

    it('should update quote request status', () => {
      useQuoteRequestStore.getState().updateStatus('QR-001', 'QUOTED');

      const request = useQuoteRequestStore.getState().getById('QR-001');
      expect(request.status).toBe('QUOTED');
    });

    it('should update status with additional data', () => {
      useQuoteRequestStore.getState().updateStatus('QR-001', 'QUOTED', {
        quoted_at: '2024-01-20',
        quote_amount: 5000
      });

      const request = useQuoteRequestStore.getState().getById('QR-001');
      expect(request.status).toBe('QUOTED');
      expect(request.quoted_at).toBe('2024-01-20');
      expect(request.quote_amount).toBe(5000);
    });

    it('should not affect other quote requests', () => {
      useQuoteRequestStore.getState().addQuoteRequest(mockQuoteRequest2);
      useQuoteRequestStore.getState().updateStatus('QR-001', 'CONVERTED');

      const request1 = useQuoteRequestStore.getState().getById('QR-001');
      const request2 = useQuoteRequestStore.getState().getById('QR-002');

      expect(request1.status).toBe('CONVERTED');
      expect(request2.status).toBe('QUOTED');
    });
  });

  describe('removeQuoteRequest', () => {
    beforeEach(() => {
      useQuoteRequestStore.getState().addQuoteRequest(mockQuoteRequest1);
      useQuoteRequestStore.getState().addQuoteRequest(mockQuoteRequest2);
    });

    it('should remove specific quote request', () => {
      useQuoteRequestStore.getState().removeQuoteRequest('QR-001');

      const requests = useQuoteRequestStore.getState().quoteRequests;
      expect(requests).toHaveLength(1);
      expect(requests[0].request_id).toBe('QR-002');
    });

    it('should not affect other requests when removing', () => {
      useQuoteRequestStore.getState().removeQuoteRequest('QR-002');

      const request1 = useQuoteRequestStore.getState().getById('QR-001');
      expect(request1).toBeDefined();
      expect(request1.request_id).toBe('QR-001');
    });

    it('should handle removing non-existent request', () => {
      useQuoteRequestStore.getState().removeQuoteRequest('QR-999');

      expect(useQuoteRequestStore.getState().quoteRequests).toHaveLength(2);
    });
  });

  describe('clearAll', () => {
    beforeEach(() => {
      useQuoteRequestStore.getState().addQuoteRequest(mockQuoteRequest1);
      useQuoteRequestStore.getState().addQuoteRequest(mockQuoteRequest2);
      useQuoteRequestStore.getState().addQuoteRequest(mockQuoteRequest3);
    });

    it('should clear all quote requests', () => {
      useQuoteRequestStore.getState().clearAll();

      expect(useQuoteRequestStore.getState().quoteRequests).toHaveLength(0);
    });
  });

  describe('getPendingCount', () => {
    it('should return count of pending requests', () => {
      useQuoteRequestStore.getState().addQuoteRequest(mockQuoteRequest1); // PENDING
      useQuoteRequestStore.getState().addQuoteRequest(mockQuoteRequest2); // QUOTED
      useQuoteRequestStore.getState().addQuoteRequest(mockQuoteRequest3); // PENDING

      const count = useQuoteRequestStore.getState().getPendingCount();

      expect(count).toBe(2);
    });

    it('should return 0 when no pending requests', () => {
      useQuoteRequestStore.getState().addQuoteRequest(mockQuoteRequest2); // QUOTED

      const count = useQuoteRequestStore.getState().getPendingCount();

      expect(count).toBe(0);
    });

    it('should return 0 for empty store', () => {
      const count = useQuoteRequestStore.getState().getPendingCount();

      expect(count).toBe(0);
    });
  });

  describe('Multiple Operations', () => {
    it('should handle add, update, and remove in sequence', () => {
      // Add requests
      useQuoteRequestStore.getState().addQuoteRequest(mockQuoteRequest1);
      useQuoteRequestStore.getState().addQuoteRequest(mockQuoteRequest2);
      expect(useQuoteRequestStore.getState().quoteRequests).toHaveLength(2);

      // Update status
      useQuoteRequestStore.getState().updateStatus('QR-001', 'QUOTED');
      expect(useQuoteRequestStore.getState().getById('QR-001').status).toBe('QUOTED');

      // Remove one
      useQuoteRequestStore.getState().removeQuoteRequest('QR-002');
      expect(useQuoteRequestStore.getState().quoteRequests).toHaveLength(1);

      // Add another
      useQuoteRequestStore.getState().addQuoteRequest(mockQuoteRequest3);
      expect(useQuoteRequestStore.getState().quoteRequests).toHaveLength(2);

      // Clear all
      useQuoteRequestStore.getState().clearAll();
      expect(useQuoteRequestStore.getState().quoteRequests).toHaveLength(0);
    });
  });
});

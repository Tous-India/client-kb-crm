import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useQuoteRequestStore = create(
  persist(
    (set, get) => ({
      // User's submitted quote requests
      quoteRequests: [],

      // Add a new quote request
      addQuoteRequest: (quoteRequest) => {
        const newRequest = {
          ...quoteRequest,
          created_at: new Date().toISOString(),
        };

        set((state) => ({
          quoteRequests: [newRequest, ...state.quoteRequests],
        }));

        return newRequest;
      },

      // Get all quote requests
      getQuoteRequests: () => {
        return get().quoteRequests;
      },

      // Get quote requests by buyer ID
      getByBuyerId: (buyerId) => {
        return get().quoteRequests.filter(
          (qr) => qr.buyer_id === buyerId
        );
      },

      // Get quote request by ID
      getById: (requestId) => {
        return get().quoteRequests.find(
          (qr) => qr.request_id === requestId
        );
      },

      // Update quote request status
      updateStatus: (requestId, status, additionalData = {}) => {
        set((state) => ({
          quoteRequests: state.quoteRequests.map((qr) =>
            qr.request_id === requestId
              ? { ...qr, status, ...additionalData }
              : qr
          ),
        }));
      },

      // Remove a quote request
      removeQuoteRequest: (requestId) => {
        set((state) => ({
          quoteRequests: state.quoteRequests.filter(
            (qr) => qr.request_id !== requestId
          ),
        }));
      },

      // Clear all quote requests
      clearAll: () => {
        set({ quoteRequests: [] });
      },

      // Get count of pending requests
      getPendingCount: () => {
        return get().quoteRequests.filter(
          (qr) => qr.status === 'PENDING'
        ).length;
      },
    }),
    {
      name: 'kb-quote-requests-storage',
      version: 1,
    }
  )
);

export default useQuoteRequestStore;

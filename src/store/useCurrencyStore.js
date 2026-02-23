import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { externalApi } from '../api/axios';

const useCurrencyStore = create(
  persist(
    (set, get) => ({
      // State
      usdToInr: 89.99,
      isLoading: false,
      lastUpdated: null,
      isManualOverride: false,
      error: null,

      // Actions
      fetchCurrencyRate: async () => {
        const { isManualOverride } = get();

        // Don't fetch if manually overridden
        if (isManualOverride) return;

        set({ isLoading: true, error: null });

        try {
          const response = await externalApi.get('https://api.exchangerate-api.com/v4/latest/USD');

          if (response.data?.rates?.INR) {
            set({
              usdToInr: parseFloat(response.data.rates.INR.toFixed(2)),
              lastUpdated: new Date().toISOString(),
              isLoading: false,
            });
          }
        } catch (error) {
          console.error('Failed to fetch currency rate:', error);
          set({
            error: 'Failed to fetch currency rate',
            isLoading: false
          });
        }
      },

      // Manual update for admin
      updateCurrencyRate: (newRate) => {
        const rate = parseFloat(newRate);
        if (!isNaN(rate) && rate > 0) {
          set({
            usdToInr: parseFloat(rate.toFixed(2)),
            isManualOverride: true,
            lastUpdated: new Date().toISOString(),
          });
          return true;
        }
        return false;
      },

      // Reset to automatic updates
      resetToAutomatic: async () => {
        set({ isManualOverride: false });
        await get().fetchCurrencyRate();
      },

      // Convert USD to INR
      convertUsdToInr: (usdAmount) => {
        const { usdToInr } = get();
        return parseFloat((usdAmount * usdToInr).toFixed(2));
      },

      // Convert INR to USD
      convertInrToUsd: (inrAmount) => {
        const { usdToInr } = get();
        return parseFloat((inrAmount / usdToInr).toFixed(2));
      },

      // Refresh rate (force fetch)
      refreshRate: async () => {
        set({ isManualOverride: false });
        await get().fetchCurrencyRate();
      },

      // Initialize store (call on app load)
      initialize: async () => {
        const { fetchCurrencyRate, isManualOverride } = get();

        // Fetch rate on initialization if not manually overridden
        if (!isManualOverride) {
          await fetchCurrencyRate();
        }

        // Set up auto-refresh every 6 hours
        setInterval(() => {
          const { isManualOverride: currentOverride } = get();
          if (!currentOverride) {
            fetchCurrencyRate();
          }
        }, 6 * 60 * 60 * 1000); // 6 hours
      },
    }),
    {
      name: 'currency-storage', // localStorage key
      partialize: (state) => ({
        usdToInr: state.usdToInr,
        isManualOverride: state.isManualOverride,
        lastUpdated: state.lastUpdated,
      }),
    }
  )
);

export default useCurrencyStore;

import { createContext, useEffect } from 'react';
import useCurrencyStore from '../store/useCurrencyStore';

const CurrencyContext = createContext();

// Hook to use currency - can use either Zustand store directly or context
export function useCurrency() {
  const store = useCurrencyStore();

  // Return store values with computed lastUpdated as Date object
  return {
    usdToInr: store.usdToInr,
    isLoading: store.isLoading,
    lastUpdated: store.lastUpdated ? new Date(store.lastUpdated) : null,
    isManualOverride: store.isManualOverride,
    updateCurrencyRate: store.updateCurrencyRate,
    resetToAutomatic: store.resetToAutomatic,
    refreshRate: store.refreshRate,
    convertUsdToInr: store.convertUsdToInr,
    convertInrToUsd: store.convertInrToUsd,
    error: store.error,
  };
}

// Provider component - initializes the store
export function CurrencyProvider({ children }) {
  const initialize = useCurrencyStore((state) => state.initialize);
  const usdToInr = useCurrencyStore((state) => state.usdToInr);
  const isLoading = useCurrencyStore((state) => state.isLoading);
  const lastUpdated = useCurrencyStore((state) => state.lastUpdated);
  const isManualOverride = useCurrencyStore((state) => state.isManualOverride);
  const updateCurrencyRate = useCurrencyStore((state) => state.updateCurrencyRate);
  const resetToAutomatic = useCurrencyStore((state) => state.resetToAutomatic);
  const refreshRate = useCurrencyStore((state) => state.refreshRate);
  const convertUsdToInr = useCurrencyStore((state) => state.convertUsdToInr);
  const convertInrToUsd = useCurrencyStore((state) => state.convertInrToUsd);

  // Initialize store on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Context value for backwards compatibility
  const value = {
    usdToInr,
    isLoading,
    lastUpdated: lastUpdated ? new Date(lastUpdated) : null,
    isManualOverride,
    updateCurrencyRate,
    resetToAutomatic,
    refreshRate,
    convertUsdToInr,
    convertInrToUsd,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

// Export the store hook for direct usage (recommended)
export { useCurrencyStore };

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";
import apiClient from "../services/api/client";

/**
 * NotificationCountsContext
 * Provides real-time counts of items with STATUS CHANGES since last viewed
 * - Tracks updatedAt timestamps to detect changes
 * - Admin: new/updated orders, new/updated payments
 * - Buyer: quotation updates, PI updates, order status changes
 */

const NotificationCountsContext = createContext(null);

// Polling interval for refreshing counts (30 seconds)
const POLL_INTERVAL = 30000;

// LocalStorage keys for tracking last viewed timestamps
const STORAGE_KEYS = {
  // Admin keys
  adminOrders: "lastViewedAdminOrders",
  adminPayments: "lastViewedAdminPayments",
  adminApprovals: "lastViewedAdminApprovals",
  // Buyer keys
  buyerQuotes: "lastViewedQuotes",
  buyerPIs: "lastViewedPIs",
  buyerOrders: "lastViewedOrders",
  buyerInvoices: "lastViewedInvoices",
};

export function NotificationCountsProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const [counts, setCounts] = useState({
    // Admin counts (items updated since last viewed)
    pendingOrders: 0,
    pendingPayments: 0,
    pendingApprovals: 0,
    newQuoteRequests: 0,
    pendingPurchaseOrders: 0,
    // Buyer counts (items updated since last viewed)
    newQuotations: 0,
    newProformaInvoices: 0,
    orderUpdates: 0,
    newInvoices: 0,
  });
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Helper: Ensure we have an array
  const ensureArray = (data) => {
    if (Array.isArray(data)) return data;
    if (data && typeof data === "object") return [];
    return [];
  };

  // Helper: Count items updated since last viewed timestamp
  const countUpdatedSince = (items, lastViewedKey) => {
    const itemsArray = ensureArray(items);
    if (itemsArray.length === 0) return 0;

    const lastViewed = localStorage.getItem(lastViewedKey);
    if (!lastViewed) {
      // First time viewing - count all items as new
      return itemsArray.length;
    }

    const lastViewedDate = new Date(lastViewed);
    return itemsArray.filter(item => {
      const updatedAt = new Date(item.updatedAt || item.updated_at || item.createdAt || item.created_at);
      return updatedAt > lastViewedDate;
    }).length;
  };

  // Fetch counts from API
  const fetchCounts = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    setLoading(true);
    try {
      const isAdmin = user.role === "SUPER_ADMIN" || user.role === "SUB_ADMIN";

      if (isAdmin) {
        // Fetch admin notification counts in parallel
        const [ordersRes, paymentsRes, approvalsRes] = await Promise.allSettled([
          apiClient.get("/orders/pending"),
          apiClient.get("/payment-records/pending"),
          apiClient.get("/users/pending-approvals"),
        ]);

        // Get the actual items to check updatedAt
        // API returns { data: { orders: [...] } } or { data: { paymentRecords: [...] } } etc.
        const pendingOrdersList = ordersRes.status === "fulfilled"
          ? (ordersRes.value.data?.data?.orders || ordersRes.value.data?.data || [])
          : [];
        const pendingPaymentsList = paymentsRes.status === "fulfilled"
          ? (paymentsRes.value.data?.data?.paymentRecords || paymentsRes.value.data?.data || [])
          : [];
        const pendingApprovalsList = approvalsRes.status === "fulfilled"
          ? (approvalsRes.value.data?.data?.users || approvalsRes.value.data?.data || [])
          : [];

        // Count items updated since last viewed
        const pendingOrders = countUpdatedSince(pendingOrdersList, STORAGE_KEYS.adminOrders);
        const pendingPayments = countUpdatedSince(pendingPaymentsList, STORAGE_KEYS.adminPayments);
        const pendingApprovals = countUpdatedSince(pendingApprovalsList, STORAGE_KEYS.adminApprovals);

        setCounts(prev => ({
          ...prev,
          pendingOrders,
          pendingPayments,
          pendingApprovals,
          newQuoteRequests: pendingOrders,
        }));
      } else {
        // Fetch buyer notification counts
        const [quotesRes, pisRes, ordersRes, invoicesRes] = await Promise.allSettled([
          apiClient.get("/quotations/my"),
          apiClient.get("/proforma-invoices/my"),
          apiClient.get("/orders/my"),
          apiClient.get("/invoices/my"),
        ]);

        // Get the actual items - API returns { data: { quotations: [...] } } etc.
        const quotations = quotesRes.status === "fulfilled"
          ? (quotesRes.value.data?.data?.quotations || quotesRes.value.data?.data || [])
          : [];
        const pis = pisRes.status === "fulfilled"
          ? (pisRes.value.data?.data?.proformaInvoices || pisRes.value.data?.data || [])
          : [];
        const orders = ordersRes.status === "fulfilled"
          ? (ordersRes.value.data?.data?.orders || ordersRes.value.data?.data || [])
          : [];
        const invoices = invoicesRes.status === "fulfilled"
          ? (invoicesRes.value.data?.data?.invoices || invoicesRes.value.data?.data || [])
          : [];

        // Count items updated since last viewed (status changes)
        const newQuotations = countUpdatedSince(quotations, STORAGE_KEYS.buyerQuotes);
        const newPIs = countUpdatedSince(pis, STORAGE_KEYS.buyerPIs);
        const orderUpdates = countUpdatedSince(orders, STORAGE_KEYS.buyerOrders);
        const newInvoices = countUpdatedSince(invoices, STORAGE_KEYS.buyerInvoices);

        setCounts(prev => ({
          ...prev,
          newQuotations,
          newProformaInvoices: newPIs,
          orderUpdates,
          newInvoices,
        }));
      }

      setLastUpdated(new Date());
    } catch (error) {
      console.error("[NotificationCounts] Error fetching counts:", error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  // Mark items as viewed (saves timestamp and resets count for that category)
  const markAsViewed = useCallback((category) => {
    const timestamp = new Date().toISOString();

    switch (category) {
      // Buyer categories
      case "quotes":
      case "quotations":
        localStorage.setItem(STORAGE_KEYS.buyerQuotes, timestamp);
        setCounts(prev => ({ ...prev, newQuotations: 0 }));
        break;
      case "proforma-invoices":
      case "pis":
        localStorage.setItem(STORAGE_KEYS.buyerPIs, timestamp);
        setCounts(prev => ({ ...prev, newProformaInvoices: 0 }));
        break;
      case "orders":
        localStorage.setItem(STORAGE_KEYS.buyerOrders, timestamp);
        setCounts(prev => ({ ...prev, orderUpdates: 0 }));
        break;
      case "invoices":
        localStorage.setItem(STORAGE_KEYS.buyerInvoices, timestamp);
        setCounts(prev => ({ ...prev, newInvoices: 0 }));
        break;
      // Admin categories
      case "purchase-orders":
      case "admin-orders":
        localStorage.setItem(STORAGE_KEYS.adminOrders, timestamp);
        setCounts(prev => ({ ...prev, pendingOrders: 0, newQuoteRequests: 0 }));
        break;
      case "payment-records":
        localStorage.setItem(STORAGE_KEYS.adminPayments, timestamp);
        setCounts(prev => ({ ...prev, pendingPayments: 0 }));
        break;
      case "pending-approvals":
        localStorage.setItem(STORAGE_KEYS.adminApprovals, timestamp);
        setCounts(prev => ({ ...prev, pendingApprovals: 0 }));
        break;
      default:
        break;
    }
  }, []);

  // Refresh counts manually
  const refreshCounts = useCallback(() => {
    fetchCounts();
  }, [fetchCounts]);

  // Initial fetch and polling
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchCounts();

      // Set up polling
      const interval = setInterval(fetchCounts, POLL_INTERVAL);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, user, fetchCounts]);

  // Calculate total unread for badge
  const getTotalUnread = useCallback(() => {
    const isAdmin = user?.role === "SUPER_ADMIN" || user?.role === "SUB_ADMIN";

    if (isAdmin) {
      return counts.pendingOrders + counts.pendingPayments + counts.pendingApprovals;
    }
    return counts.newQuotations + counts.newProformaInvoices + counts.orderUpdates + counts.newInvoices;
  }, [user, counts]);

  const value = {
    counts,
    loading,
    lastUpdated,
    refreshCounts,
    markAsViewed,
    getTotalUnread,
  };

  return (
    <NotificationCountsContext.Provider value={value}>
      {children}
    </NotificationCountsContext.Provider>
  );
}

export function useNotificationCounts() {
  const context = useContext(NotificationCountsContext);
  if (!context) {
    throw new Error("useNotificationCounts must be used within NotificationCountsProvider");
  }
  return context;
}

export default NotificationCountsContext;

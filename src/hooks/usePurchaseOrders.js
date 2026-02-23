import { useState, useEffect, useCallback } from 'react';
import purchaseOrdersService from '../services/purchaseOrders.service';

/**
 * Custom hook for managing purchase orders
 * Provides data fetching, loading, and error states
 */
export const usePurchaseOrders = () => {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch all purchase orders
   */
  const fetchPurchaseOrders = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);

    const result = await purchaseOrdersService.getAll(params);

    if (result.success) {
      setPurchaseOrders(result.data);
    } else {
      setError(result.error);
    }

    setLoading(false);
    return result;
  }, []);

  /**
   * Get purchase order by ID
   */
  const getPurchaseOrderById = useCallback(async (id) => {
    setLoading(true);
    setError(null);

    const result = await purchaseOrdersService.getById(id);

    if (!result.success) {
      setError(result.error);
    }

    setLoading(false);
    return result;
  }, []);

  /**
   * Get purchase orders by status
   */
  const getPurchaseOrdersByStatus = useCallback(async (status) => {
    setLoading(true);
    setError(null);

    const result = await purchaseOrdersService.getByStatus(status);

    if (result.success) {
      setPurchaseOrders(result.data);
    } else {
      setError(result.error);
    }

    setLoading(false);
    return result;
  }, []);

  /**
   * Convert purchase order to quotation
   */
  const convertToQuote = useCallback(async (poId, quoteData) => {
    setLoading(true);
    setError(null);

    const result = await purchaseOrdersService.convertToQuote(poId, quoteData);

    if (!result.success) {
      setError(result.error);
    } else {
      // Refresh the purchase orders list after conversion
      fetchPurchaseOrders();
    }

    setLoading(false);
    return result;
  }, [fetchPurchaseOrders]);

  /**
   * Create new purchase order
   */
  const createPurchaseOrder = useCallback(async (poData) => {
    setLoading(true);
    setError(null);

    const result = await purchaseOrdersService.create(poData);

    if (!result.success) {
      setError(result.error);
    } else {
      // Refresh the purchase orders list after creation
      fetchPurchaseOrders();
    }

    setLoading(false);
    return result;
  }, [fetchPurchaseOrders]);

  /**
   * Update purchase order
   */
  const updatePurchaseOrder = useCallback(async (id, poData) => {
    setLoading(true);
    setError(null);

    const result = await purchaseOrdersService.update(id, poData);

    if (!result.success) {
      setError(result.error);
    } else {
      // Refresh the purchase orders list after update
      fetchPurchaseOrders();
    }

    setLoading(false);
    return result;
  }, [fetchPurchaseOrders]);

  /**
   * Delete purchase order
   */
  const deletePurchaseOrder = useCallback(async (id) => {
    setLoading(true);
    setError(null);

    const result = await purchaseOrdersService.delete(id);

    if (!result.success) {
      setError(result.error);
    } else {
      // Refresh the purchase orders list after deletion
      fetchPurchaseOrders();
    }

    setLoading(false);
    return result;
  }, [fetchPurchaseOrders]);

  // Fetch purchase orders on mount
  useEffect(() => {
    fetchPurchaseOrders();
  }, [fetchPurchaseOrders]);

  return {
    purchaseOrders,
    loading,
    error,
    refresh: fetchPurchaseOrders,
    getPurchaseOrderById,
    getPurchaseOrdersByStatus,
    convertToQuote,
    createPurchaseOrder,
    updatePurchaseOrder,
    deletePurchaseOrder,
  };
};

export default usePurchaseOrders;

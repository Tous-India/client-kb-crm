import { useState, useEffect, useCallback } from 'react';
import ordersService from '../services/orders.service';

/**
 * Custom hook for managing orders
 * Provides data fetching, loading, and error states
 */
export const useOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch all orders
   */
  const fetchOrders = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);

    const result = await ordersService.getAll(params);

    if (result.success) {
      setOrders(result.data);
    } else {
      setError(result.error);
    }

    setLoading(false);
    return result;
  }, []);

  /**
   * Get order by ID
   */
  const getOrderById = useCallback(async (id) => {
    setLoading(true);
    setError(null);

    const result = await ordersService.getById(id);

    if (!result.success) {
      setError(result.error);
    }

    setLoading(false);
    return result;
  }, []);

  /**
   * Get orders by status
   */
  const getOrdersByStatus = useCallback(async (status) => {
    setLoading(true);
    setError(null);

    const result = await ordersService.getByStatus(status);

    if (result.success) {
      setOrders(result.data);
    } else {
      setError(result.error);
    }

    setLoading(false);
    return result;
  }, []);

  /**
   * Dispatch order
   */
  const dispatchOrder = useCallback(async (orderId, dispatchData) => {
    setLoading(true);
    setError(null);

    const result = await ordersService.dispatch(orderId, dispatchData);

    if (!result.success) {
      setError(result.error);
    } else {
      // Refresh the orders list after dispatch
      fetchOrders();
    }

    setLoading(false);
    return result;
  }, [fetchOrders]);

  /**
   * Create new order
   */
  const createOrder = useCallback(async (orderData) => {
    setLoading(true);
    setError(null);

    const result = await ordersService.create(orderData);

    if (!result.success) {
      setError(result.error);
    } else {
      // Refresh the orders list after creation
      fetchOrders();
    }

    setLoading(false);
    return result;
  }, [fetchOrders]);

  /**
   * Update order
   */
  const updateOrder = useCallback(async (id, orderData) => {
    setLoading(true);
    setError(null);

    const result = await ordersService.update(id, orderData);

    if (!result.success) {
      setError(result.error);
    } else {
      // Refresh the orders list after update
      fetchOrders();
    }

    setLoading(false);
    return result;
  }, [fetchOrders]);

  /**
   * Delete order
   */
  const deleteOrder = useCallback(async (id) => {
    setLoading(true);
    setError(null);

    const result = await ordersService.delete(id);

    if (!result.success) {
      setError(result.error);
    } else {
      // Refresh the orders list after deletion
      fetchOrders();
    }

    setLoading(false);
    return result;
  }, [fetchOrders]);

  /**
   * Clone order - creates a new quote request from an existing order
   */
  const cloneOrder = useCallback(async (orderId, data = {}) => {
    setLoading(true);
    setError(null);

    const result = await ordersService.cloneOrder(orderId, data);

    if (!result.success) {
      setError(result.error);
    } else {
      // Refresh the orders list after cloning
      fetchOrders();
    }

    setLoading(false);
    return result;
  }, [fetchOrders]);

  // Fetch orders on mount
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return {
    orders,
    loading,
    error,
    refresh: fetchOrders,
    getOrderById,
    getOrdersByStatus,
    dispatchOrder,
    createOrder,
    updateOrder,
    deleteOrder,
    cloneOrder,
  };
};

export default useOrders;

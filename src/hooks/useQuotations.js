import { useState, useEffect, useCallback } from 'react';
import quotationsService from '../services/quotations.service';

/**
 * Custom hook for managing quotations
 * Provides data fetching, loading, and error states
 */
export const useQuotations = () => {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch all quotations
   */
  const fetchQuotations = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);

    const result = await quotationsService.getAll(params);

    if (result.success) {
      setQuotations(result.data);
    } else {
      setError(result.error);
    }

    setLoading(false);
    return result;
  }, []);

  /**
   * Get quotation by ID
   */
  const getQuotationById = useCallback(async (id) => {
    setLoading(true);
    setError(null);

    const result = await quotationsService.getById(id);

    if (!result.success) {
      setError(result.error);
    }

    setLoading(false);
    return result;
  }, []);

  /**
   * Get quotations by status
   */
  const getQuotationsByStatus = useCallback(async (status) => {
    setLoading(true);
    setError(null);

    const result = await quotationsService.getByStatus(status);

    if (result.success) {
      setQuotations(result.data);
    } else {
      setError(result.error);
    }

    setLoading(false);
    return result;
  }, []);

  /**
   * Mark quotation as paid
   */
  const markAsPaid = useCallback(async (quoteId) => {
    setLoading(true);
    setError(null);

    const result = await quotationsService.markAsPaid(quoteId);

    if (!result.success) {
      setError(result.error);
    } else {
      // Refresh the quotations list after marking as paid
      fetchQuotations();
    }

    setLoading(false);
    return result;
  }, [fetchQuotations]);

  /**
   * Convert quotation to order
   */
  const convertToOrder = useCallback(async (quoteId, orderData = {}) => {
    setLoading(true);
    setError(null);

    const result = await quotationsService.convertToOrder(quoteId, orderData);

    if (!result.success) {
      setError(result.error);
    } else {
      // Refresh the quotations list after conversion
      fetchQuotations();
    }

    setLoading(false);
    return result;
  }, [fetchQuotations]);

  /**
   * Renew expired quotation
   */
  const renewQuotation = useCallback(async (quoteId, renewData) => {
    setLoading(true);
    setError(null);

    const result = await quotationsService.renew(quoteId, renewData);

    if (!result.success) {
      setError(result.error);
    } else {
      // Refresh the quotations list after renewal
      fetchQuotations();
    }

    setLoading(false);
    return result;
  }, [fetchQuotations]);

  /**
   * Create new quotation
   */
  const createQuotation = useCallback(async (quoteData) => {
    setLoading(true);
    setError(null);

    const result = await quotationsService.create(quoteData);

    if (!result.success) {
      setError(result.error);
    } else {
      // Refresh the quotations list after creation
      fetchQuotations();
    }

    setLoading(false);
    return result;
  }, [fetchQuotations]);

  /**
   * Update quotation
   */
  const updateQuotation = useCallback(async (id, quoteData) => {
    setLoading(true);
    setError(null);

    const result = await quotationsService.update(id, quoteData);

    if (!result.success) {
      setError(result.error);
    } else {
      // Refresh the quotations list after update
      fetchQuotations();
    }

    setLoading(false);
    return result;
  }, [fetchQuotations]);

  /**
   * Delete quotation
   */
  const deleteQuotation = useCallback(async (id) => {
    setLoading(true);
    setError(null);

    const result = await quotationsService.delete(id);

    if (!result.success) {
      setError(result.error);
    } else {
      // Refresh the quotations list after deletion
      fetchQuotations();
    }

    setLoading(false);
    return result;
  }, [fetchQuotations]);

  // Fetch quotations on mount
  useEffect(() => {
    fetchQuotations();
  }, [fetchQuotations]);

  return {
    quotations,
    loading,
    error,
    refresh: fetchQuotations,
    getQuotationById,
    getQuotationsByStatus,
    markAsPaid,
    convertToOrder,
    renewQuotation,
    createQuotation,
    updateQuotation,
    deleteQuotation,
  };
};

export default useQuotations;

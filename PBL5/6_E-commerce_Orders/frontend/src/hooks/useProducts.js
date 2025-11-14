import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { startTransition } from 'react';
import { productsApi } from '../lib/api';

/**
 * Custom hook for fetching products with pagination, error handling, and retry logic
 * @param {Object} params - Query parameters (page, limit, category, search, etc.)
 * @returns {Object} - { products, pagination, loading, error, retry, refetch }
 */
export function useProducts(params = {}) {
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Use ref to track if component is mounted (prevent state updates after unmount)
  const isMountedRef = useRef(true);
  // Use ref to track abort controller for canceling requests
  const abortControllerRef = useRef(null);
  
  // Memoize params to prevent unnecessary re-fetches
  // Convert params object to stable string for comparison
  const paramsKey = useMemo(() => JSON.stringify(params), [
    params.page,
    params.limit,
    params.category,
    params.search,
    params.minPrice,
    params.maxPrice,
    params.sortBy,
    params.order,
  ]);

  const fetchProducts = useCallback(async (fetchParams = params, signal = null) => {
    try {
      setLoading(true);
      setError(null);

      // Cancel previous request if exists
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller for this request
      const controller = new AbortController();
      abortControllerRef.current = controller;
      const requestSignal = signal || controller.signal;

      const data = await productsApi.getAll(fetchParams);

      // Check if component is still mounted before updating state
      if (!isMountedRef.current || requestSignal.aborted) {
        return;
      }

      // Validate response structure
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid API response: expected an object');
      }

      if (!data.success) {
        throw new Error(data.message || data.error || 'Failed to fetch products');
      }

      // Ensure products is an array
      const productsArray = Array.isArray(data.products) ? data.products : [];
      
      // Use startTransition for non-urgent state updates to prevent flickering
      startTransition(() => {
        setProducts(productsArray);
        setPagination(data.pagination || null);
      });
    } catch (err) {
      // Don't set error if request was aborted or component unmounted
      if (!isMountedRef.current || (err.name === 'AbortError') || (abortControllerRef.current?.signal.aborted)) {
        return;
      }

      // Handle different error types
      let errorMessage = 'Failed to fetch products';
      
      if (err.response) {
        // Axios error with response
        const status = err.response.status;
        if (status === 404) {
          errorMessage = 'Products endpoint not found. Please check the API URL.';
        } else if (status === 401 || status === 403) {
          errorMessage = 'Authentication required. Please check your session.';
        } else if (status >= 500) {
          errorMessage = 'Server error. Please try again later.';
        } else {
          errorMessage = err.response.data?.message || err.response.data?.error || `Request failed with status ${status}`;
        }
      } else if (err.request) {
        // Network error (no response received)
        if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
          errorMessage = 'Request timeout. Please check your connection and try again.';
        } else if (err.message?.includes('CORS')) {
          errorMessage = 'CORS error: Backend may not be configured to allow requests from this origin.';
        } else {
          errorMessage = 'Network error: Unable to connect to the server. Please check if the backend is running.';
        }
      } else if (err.message) {
        errorMessage = err.message;
      }

      startTransition(() => {
        setError(errorMessage);
      });
      console.error('Products fetch error:', err);
    } finally {
      if (isMountedRef.current && !abortControllerRef.current?.signal.aborted) {
        setLoading(false);
      }
    }
  }, [params]);

  // Initial fetch and refetch when params change
  // Use paramsKey instead of params object to prevent unnecessary re-renders
  useEffect(() => {
    isMountedRef.current = true;
    fetchProducts(params);

    // Cleanup: abort request and mark as unmounted
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchProducts, paramsKey]); // Use paramsKey instead of params

  // Retry function
  const retry = useCallback(() => {
    fetchProducts(params);
  }, [fetchProducts, params]);

  // Refetch function (same as retry but more semantic)
  const refetch = useCallback(() => {
    fetchProducts(params);
  }, [fetchProducts, params]);

  return {
    products,
    pagination,
    loading,
    error,
    retry,
    refetch,
  };
}


/**
 * useProducts Hook Tests
 * Run with: npm test -- useProducts.test.js
 */

import { renderHook, waitFor } from '@testing-library/react';
import { useProducts } from './useProducts';
import { productsApi } from '../lib/api';

// Mock the API
jest.mock('../lib/api', () => ({
  productsApi: {
    getAll: jest.fn(),
  },
}));

const mockSuccessResponse = {
  success: true,
  products: [
    {
      id: '1',
      title: 'Product 1',
      price: '29.99',
      inventory: { quantity: 10, reserved_quantity: 0 },
    },
    {
      id: '2',
      title: 'Product 2',
      price: '39.99',
      inventory: { quantity: 5, reserved_quantity: 0 },
    },
  ],
  pagination: {
    page: 1,
    limit: 20,
    total: 2,
    pages: 1,
  },
};

describe('useProducts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches products successfully', async () => {
    productsApi.getAll.mockResolvedValue(mockSuccessResponse);

    const { result } = renderHook(() => useProducts({ page: 1, limit: 20 }));

    expect(result.current.loading).toBe(true);
    expect(result.current.products).toEqual([]);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.products).toHaveLength(2);
    expect(result.current.pagination).toEqual(mockSuccessResponse.pagination);
    expect(result.current.error).toBeNull();
  });

  it('handles API errors', async () => {
    const errorMessage = 'Network error';
    productsApi.getAll.mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useProducts({ page: 1 }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.products).toEqual([]);
  });

  it('handles non-success API response', async () => {
    productsApi.getAll.mockResolvedValue({
      success: false,
      message: 'Failed to fetch',
    });

    const { result } = renderHook(() => useProducts({ page: 1 }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toContain('Failed to fetch');
  });

  it('handles empty products array', async () => {
    productsApi.getAll.mockResolvedValue({
      success: true,
      products: [],
      pagination: { page: 1, limit: 20, total: 0, pages: 0 },
    });

    const { result } = renderHook(() => useProducts({ page: 1 }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.products).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('provides retry function', async () => {
    productsApi.getAll.mockResolvedValue(mockSuccessResponse);

    const { result } = renderHook(() => useProducts({ page: 1 }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(typeof result.current.retry).toBe('function');
    expect(typeof result.current.refetch).toBe('function');

    // Test retry
    result.current.retry();
    expect(result.current.loading).toBe(true);
  });

  it('cancels previous request when params change', async () => {
    productsApi.getAll.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(mockSuccessResponse), 100))
    );

    const { result, rerender } = renderHook(
      ({ page }) => useProducts({ page }),
      { initialProps: { page: 1 } }
    );

    // Change params before first request completes
    rerender({ page: 2 });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Should have called API with new params
    expect(productsApi.getAll).toHaveBeenCalledWith({ page: 2 });
  });
});


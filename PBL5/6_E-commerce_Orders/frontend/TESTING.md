# Frontend Testing Guide

## Setup

### Install Testing Dependencies

```bash
cd frontend
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event jest-environment-jsdom
```

**If using Vite (recommended):**
```bash
npm install --save-dev vitest @vitest/ui jsdom
```

### Update `package.json`

Add test scripts:

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

### Create `vite.config.js` (if not exists or update)

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
  },
});
```

### Create Test Setup File

**File:** `frontend/src/test/setup.js`

```javascript
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});
```

## Running Tests

```bash
# Run all tests
npm test

# Run in watch mode
npm test -- --watch

# Run with UI
npm test:ui

# Run with coverage
npm test:coverage
```

## Test Files

### 1. ProductCard Component Test

**File:** `frontend/src/components/products/ProductCard.test.jsx`

See `ProductCard.test.jsx` in the codebase.

**Run:**
```bash
npm test -- ProductCard
```

### 2. useProducts Hook Test

**File:** `frontend/src/hooks/useProducts.test.js`

See `useProducts.test.js` in the codebase.

**Run:**
```bash
npm test -- useProducts
```

### 3. Integration Test Example

**File:** `frontend/src/pages/Products.integration.test.jsx`

```javascript
/**
 * Integration Test: Products Page
 * Tests the full flow: fetch → render → interact
 */

import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Products } from './Products';
import { productsApi } from '../lib/api';
import { CartProvider } from '../contexts/CartContext';

// Mock API
jest.mock('../lib/api', () => ({
  productsApi: {
    getAll: jest.fn(),
    getCategories: jest.fn(),
  },
}));

const mockProducts = [
  {
    id: '1',
    title: 'Test Product 1',
    price: '29.99',
    thumbnail_url: 'https://example.com/img1.jpg',
    inventory: { quantity: 10, reserved_quantity: 0 },
    category: { id: 'cat1', name: 'Electronics' },
  },
  {
    id: '2',
    title: 'Test Product 2',
    price: '39.99',
    thumbnail_url: 'https://example.com/img2.jpg',
    inventory: { quantity: 5, reserved_quantity: 0 },
    category: { id: 'cat2', name: 'Clothing' },
  },
];

const mockResponse = {
  success: true,
  products: mockProducts,
  pagination: {
    page: 1,
    limit: 20,
    total: 2,
    pages: 1,
  },
};

describe('Products Page Integration', () => {
  beforeEach(() => {
    productsApi.getAll.mockResolvedValue(mockResponse);
    productsApi.getCategories.mockResolvedValue({
      success: true,
      categories: [
        { id: 'cat1', name: 'Electronics', slug: 'electronics' },
        { id: 'cat2', name: 'Clothing', slug: 'clothing' },
      ],
    });
  });

  it('fetches and displays products', async () => {
    render(
      <BrowserRouter>
        <CartProvider>
          <Products />
        </CartProvider>
      </BrowserRouter>
    );

    // Should show loading state initially
    expect(screen.getByText(/loading/i)).toBeInTheDocument();

    // Wait for products to load
    await waitFor(() => {
      expect(screen.getByText('Test Product 1')).toBeInTheDocument();
    });

    // Verify both products are rendered
    expect(screen.getByText('Test Product 1')).toBeInTheDocument();
    expect(screen.getByText('Test Product 2')).toBeInTheDocument();

    // Verify API was called
    expect(productsApi.getAll).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 1,
        limit: 20,
      })
    );
  });

  it('displays error state when API fails', async () => {
    productsApi.getAll.mockRejectedValue(new Error('Network error'));

    render(
      <BrowserRouter>
        <CartProvider>
          <Products />
        </CartProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/failed to load products/i)).toBeInTheDocument();
    });

    // Should have retry button
    expect(screen.getByText(/try again/i)).toBeInTheDocument();
  });

  it('displays empty state when no products', async () => {
    productsApi.getAll.mockResolvedValue({
      success: true,
      products: [],
      pagination: { page: 1, limit: 20, total: 0, pages: 0 },
    });

    render(
      <BrowserRouter>
        <CartProvider>
          <Products />
        </CartProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/no products found/i)).toBeInTheDocument();
    });
  });
});
```

## E2E Testing with Playwright

### Install Playwright

```bash
npm install --save-dev @playwright/test
npx playwright install
```

### Create E2E Test

**File:** `frontend/e2e/products.spec.js`

```javascript
import { test, expect } from '@playwright/test';

test.describe('Products Page', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API response
    await page.route('**/api/products*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          products: [
            {
              id: '1',
              title: 'Test Product',
              price: '29.99',
              thumbnail_url: 'https://via.placeholder.com/400',
              inventory: { quantity: 10, reserved_quantity: 0 },
              category: { id: 'cat1', name: 'Electronics' },
            },
          ],
          pagination: { page: 1, limit: 20, total: 1, pages: 1 },
        }),
      });
    });

    await page.goto('http://localhost:5173/products');
  });

  test('displays products in grid', async ({ page }) => {
    // Wait for products to load
    await expect(page.getByText('Test Product')).toBeVisible();

    // Verify product card is rendered
    const productCard = page.locator('[data-testid="product-card"]').first();
    await expect(productCard).toBeVisible();

    // Verify product details
    await expect(page.getByText('$29.99')).toBeVisible();
    await expect(page.getByText('Electronics')).toBeVisible();
  });

  test('handles API error gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/api/products*', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          message: 'Server error',
        }),
      });
    });

    await page.reload();

    // Should show error state
    await expect(page.getByText(/failed to load/i)).toBeVisible();
    await expect(page.getByText(/try again/i)).toBeVisible();
  });

  test('pagination works', async ({ page }) => {
    // Mock second page
    await page.route('**/api/products?page=2*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          products: [
            {
              id: '2',
              title: 'Product 2',
              price: '39.99',
              thumbnail_url: 'https://via.placeholder.com/400',
              inventory: { quantity: 5, reserved_quantity: 0 },
            },
          ],
          pagination: { page: 2, limit: 20, total: 2, pages: 2 },
        }),
      });
    });

    // Click next page
    await page.getByText('Next').click();

    // Should show second page product
    await expect(page.getByText('Product 2')).toBeVisible();
  });
});
```

### Run E2E Tests

```bash
# Run E2E tests
npx playwright test

# Run with UI
npx playwright test --ui

# Run specific test
npx playwright test products.spec.js
```

## Test Coverage Goals

- **Unit Tests**: 80%+ coverage for hooks and utilities
- **Component Tests**: All UI components with different states
- **Integration Tests**: Key user flows (browse → product → cart)
- **E2E Tests**: Critical paths (product listing, checkout flow)

## Mocking Best Practices

1. **Mock API at the module level** (not in component)
2. **Use MSW (Mock Service Worker)** for more realistic API mocking
3. **Test error states** as well as success states
4. **Test edge cases**: empty arrays, null values, network failures
5. **Test accessibility**: keyboard navigation, screen readers

## Quick Test Checklist

- [ ] Products fetch successfully
- [ ] Loading state displays
- [ ] Error state displays with retry
- [ ] Empty state displays
- [ ] Product cards render correctly
- [ ] Pagination works
- [ ] Filters work
- [ ] Add to cart works
- [ ] Images load with fallback
- [ ] Accessibility (keyboard, screen reader)


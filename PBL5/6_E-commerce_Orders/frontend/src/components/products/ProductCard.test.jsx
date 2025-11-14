/**
 * ProductCard Component Tests
 * Run with: npm test -- ProductCard.test.jsx
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ProductCard } from './ProductCard';
import { CartProvider } from '../../contexts/CartContext';

// Mock the cart context
jest.mock('../../contexts/CartContext', () => ({
  CartProvider: ({ children }) => <div>{children}</div>,
  useCart: () => ({
    addToCart: jest.fn().mockResolvedValue({ success: true }),
  }),
}));

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Link: ({ to, children, ...props }) => <a href={to} {...props}>{children}</a>,
}));

const mockProduct = {
  id: '1',
  title: 'Test Product',
  description: 'This is a test product description',
  price: '29.99',
  discount_percentage: 10,
  rating: 4.5,
  thumbnail_url: 'https://example.com/image.jpg',
  image_url: 'https://example.com/image-large.jpg',
  category: {
    id: 'cat1',
    name: 'Electronics',
    slug: 'electronics',
  },
  inventory: {
    quantity: 50,
    reserved_quantity: 5,
  },
  minimum_order_quantity: 1,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const renderProductCard = (product = mockProduct) => {
  return render(
    <BrowserRouter>
      <CartProvider>
        <ProductCard product={product} />
      </CartProvider>
    </BrowserRouter>
  );
};

describe('ProductCard', () => {
  it('renders product title', () => {
    renderProductCard();
    expect(screen.getByText('Test Product')).toBeInTheDocument();
  });

  it('renders product price', () => {
    renderProductCard();
    expect(screen.getByText(/\$26\.99/)).toBeInTheDocument(); // After 10% discount
  });

  it('renders original price when discounted', () => {
    renderProductCard();
    expect(screen.getByText(/\$29\.99/)).toBeInTheDocument();
  });

  it('renders product image with alt text', () => {
    renderProductCard();
    const image = screen.getByAltText('Test Product');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'https://example.com/image.jpg');
  });

  it('renders category name', () => {
    renderProductCard();
    expect(screen.getByText('ELECTRONICS')).toBeInTheDocument();
  });

  it('renders rating when available', () => {
    renderProductCard();
    expect(screen.getByText('4.5')).toBeInTheDocument();
  });

  it('shows "In Stock" badge when inventory is available', () => {
    renderProductCard();
    expect(screen.getByText('Add to Cart')).toBeInTheDocument();
  });

  it('shows "Out of Stock" when inventory is 0', () => {
    const outOfStockProduct = {
      ...mockProduct,
      inventory: { quantity: 0, reserved_quantity: 0 },
    };
    renderProductCard(outOfStockProduct);
    expect(screen.getByText('Out of Stock')).toBeInTheDocument();
  });

  it('shows "Low Stock" warning when inventory < 10', () => {
    const lowStockProduct = {
      ...mockProduct,
      inventory: { quantity: 5, reserved_quantity: 0 },
    };
    renderProductCard(lowStockProduct);
    expect(screen.getByText(/Only \d+ left in stock/)).toBeInTheDocument();
  });

  it('disables add to cart button when out of stock', () => {
    const outOfStockProduct = {
      ...mockProduct,
      inventory: { quantity: 0, reserved_quantity: 0 },
    };
    renderProductCard(outOfStockProduct);
    const button = screen.getByRole('button', { name: /out of stock/i });
    expect(button).toBeDisabled();
  });

  it('disables add to cart when available quantity < minimum_order_quantity', () => {
    const minOrderProduct = {
      ...mockProduct,
      inventory: { quantity: 5, reserved_quantity: 0 },
      minimum_order_quantity: 10,
    };
    renderProductCard(minOrderProduct);
    const button = screen.getByRole('button', { name: /Min: 10/i });
    expect(button).toBeDisabled();
  });

  it('handles missing optional fields gracefully', () => {
    const minimalProduct = {
      id: '2',
      title: 'Minimal Product',
      price: '19.99',
      inventory: { quantity: 10, reserved_quantity: 0 },
    };
    renderProductCard(minimalProduct);
    expect(screen.getByText('Minimal Product')).toBeInTheDocument();
    expect(screen.getByText(/\$19\.99/)).toBeInTheDocument();
  });

  it('uses placeholder image when image_url is missing', () => {
    const noImageProduct = {
      ...mockProduct,
      thumbnail_url: null,
      image_url: null,
    };
    renderProductCard(noImageProduct);
    const image = screen.getByAltText('Test Product');
    expect(image).toHaveAttribute('src', '/placeholder-product.jpg');
  });
});


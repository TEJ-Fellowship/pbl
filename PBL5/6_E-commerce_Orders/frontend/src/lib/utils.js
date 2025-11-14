import { clsx } from 'clsx';

/**
 * Utility function to merge class names
 */
export function cn(...inputs) {
  return clsx(inputs);
}

/**
 * Format price with currency
 */
export function formatPrice(price, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(price);
}

/**
 * Calculate discount price
 */
export function calculateDiscountPrice(price, discountPercentage) {
  if (!discountPercentage || discountPercentage === 0) return price;
  return price * (1 - discountPercentage / 100);
}

/**
 * Format date
 */
export function formatDate(date, options = {}) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  }).format(new Date(date));
}

/**
 * Truncate text
 */
export function truncate(text, maxLength = 100) {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * Debounce function
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Get stock status
 */
export function getStockStatus(quantity, reservedQuantity = 0) {
  const available = quantity - reservedQuantity;
  if (available <= 0) return { status: 'out_of_stock', label: 'Out of Stock', available: 0 };
  if (available < 10) return { status: 'low_stock', label: 'Low Stock', available };
  return { status: 'in_stock', label: 'In Stock', available };
}


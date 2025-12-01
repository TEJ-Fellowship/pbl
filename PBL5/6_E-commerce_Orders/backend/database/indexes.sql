-- =====================================================
-- COMPREHENSIVE DATABASE INDEXES FOR 1K USERS
-- =====================================================
-- This file contains all additional indexes needed for optimal performance
-- Run this after schema.sql to ensure all queries are optimized

-- =====================================================
-- PRODUCTS TABLE - Additional Indexes
-- =====================================================

-- Composite index for category + price filtering (common query pattern)
CREATE INDEX IF NOT EXISTS idx_products_category_price ON products(category_id, price);

-- Composite index for category + availability filtering
CREATE INDEX IF NOT EXISTS idx_products_category_availability ON products(category_id, availability_status);

-- Index for brand filtering
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand) WHERE brand IS NOT NULL;

-- Index for rating filtering
CREATE INDEX IF NOT EXISTS idx_products_rating ON products(rating DESC);

-- Composite index for price range queries
CREATE INDEX IF NOT EXISTS idx_products_price_range ON products(price) WHERE price > 0;

-- Index for discount filtering
CREATE INDEX IF NOT EXISTS idx_products_discount ON products(discount_percentage) WHERE discount_percentage > 0;

-- Composite index for search + category
CREATE INDEX IF NOT EXISTS idx_products_title_category ON products(category_id, title);

-- =====================================================
-- INVENTORY TABLE - Additional Indexes
-- =====================================================

-- Composite index for product + warehouse (for multi-warehouse support)
CREATE INDEX IF NOT EXISTS idx_inventory_product_warehouse ON inventory(product_id, warehouse_id) WHERE warehouse_id IS NOT NULL;

-- Index for low stock alerts (frequently queried)
CREATE INDEX IF NOT EXISTS idx_inventory_low_stock_updated ON inventory(updated_at DESC) WHERE available_quantity <= low_stock_threshold;

-- Index for reorder point monitoring
CREATE INDEX IF NOT EXISTS idx_inventory_reorder_point ON inventory(available_quantity, reorder_point) WHERE available_quantity <= reorder_point;

-- =====================================================
-- ORDERS TABLE - Additional Indexes
-- =====================================================

-- Composite index for session + status (common query pattern)
CREATE INDEX IF NOT EXISTS idx_orders_session_status ON orders(session_id, status);

-- Composite index for status + created_at (for order listing)
CREATE INDEX IF NOT EXISTS idx_orders_status_created_at ON orders(status, created_at DESC);

-- Composite index for payment status + created_at
CREATE INDEX IF NOT EXISTS idx_orders_payment_created ON orders(payment_status, created_at DESC);

-- Index for tracking number lookups
CREATE INDEX IF NOT EXISTS idx_orders_tracking ON orders(tracking_number) WHERE tracking_number IS NOT NULL;

-- Index for date range queries
CREATE INDEX IF NOT EXISTS idx_orders_created_at_brin ON orders USING brin(created_at);

-- =====================================================
-- ORDER ITEMS TABLE - Additional Indexes
-- =====================================================

-- Composite index for order + product (for order details)
CREATE INDEX IF NOT EXISTS idx_order_items_order_product ON order_items(order_id, product_id);

-- Index for product sales analytics
CREATE INDEX IF NOT EXISTS idx_order_items_product_created ON order_items(product_id, created_at DESC);

-- =====================================================
-- PAYMENTS TABLE - Additional Indexes
-- =====================================================

-- Composite index for order + status (common query)
CREATE INDEX IF NOT EXISTS idx_payments_order_status ON payments(order_id, status);

-- Index for transaction lookup
CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON payments(transaction_id) WHERE transaction_id IS NOT NULL;

-- Index for payment method analytics
CREATE INDEX IF NOT EXISTS idx_payments_method_status ON payments(payment_method, status);

-- Index for date range queries
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);

-- Index for processed payments
CREATE INDEX IF NOT EXISTS idx_payments_processed_at ON payments(processed_at DESC) WHERE processed_at IS NOT NULL;

-- =====================================================
-- CATEGORIES TABLE - Additional Indexes
-- =====================================================

-- Index for parent category lookups (hierarchical categories)
CREATE INDEX IF NOT EXISTS idx_categories_parent_slug ON categories(parent_id, slug) WHERE parent_id IS NOT NULL;

-- =====================================================
-- PERFORMANCE OPTIMIZATIONS
-- =====================================================

-- Analyze tables to update statistics (helps query planner)
ANALYZE products;
ANALYZE inventory;
ANALYZE orders;
ANALYZE order_items;
ANALYZE payments;
ANALYZE categories;

-- =====================================================
-- NOTES
-- =====================================================
-- These indexes are optimized for:
-- 1. Product browsing and filtering (category, price, search)
-- 2. Cart operations (product lookups)
-- 3. Order creation and retrieval (session, status)
-- 4. Payment processing (order, status)
-- 5. Inventory management (product, availability)
--
-- Monitor index usage with:
-- SELECT * FROM pg_stat_user_indexes WHERE schemaname = 'public';
--
-- If indexes are not being used, consider dropping them to save space


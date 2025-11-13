# Project 6: Real-Time Order Processing System (E-commerce)

## Project Overview

Build a distributed order processing system for a high-traffic e-commerce platform. The system must handle order placement, payment processing, inventory management, fraud detection, and order fulfillment through event-driven architecture. Focus on handling order surges (flash sales), preventing overselling, and maintaining data consistency across microservices.

---

## Tech Stack

- **Backend**: Node.js + Express (API Gateway) + microservices
- **Database**: PostgreSQL (orders, products) + MongoDB (order history) + Redis (inventory locks, cart)
- **Message Queue**: Kafka (order events, saga orchestration)
- **AI Integration**: Gemini/OpenAI for fraud detection, product recommendations, and demand forecasting
- **Payment**: Stripe/PayPal SDK (simulation)
- **Frontend**: React with real-time order tracking

---

## Roles

1. **Customer** - Browse products, place orders, track shipments
2. **Admin** - Manage inventory, process orders, view analytics dashboard

---

## Progressive Tier Requirements

### **Tier 1: Core Order System** (Week 1)

**Backend Focus: Order Placement + Basic Microservices**

#### Features:

- User authentication and profiles
- Product catalog (with stock levels)
- Shopping cart (Redis-backed)
- Order placement
- Basic inventory reservation (prevent overselling)
- Order status tracking (Pending → Confirmed → Shipped → Delivered)
- Payment processing (simulated)

#### Microservices Architecture:

```
API Gateway (Express)
├── Order Service (order creation, status)
├── Inventory Service (stock management)
├── Payment Service (payment processing)
├── Shipping Service (fulfillment)
└── Notification Service (email/SMS)
```

#### Database Schema:

```sql
-- PostgreSQL (Order Service)
users (id, name, email, password_hash, address, created_at)
products (id, name, description, price, sku, category, image_url)
inventory (product_id, warehouse_id, quantity, reserved_quantity)

orders (
  id UUID PRIMARY KEY,
  user_id UUID,
  total_amount DECIMAL,
  status TEXT, -- pending/confirmed/processing/shipped/delivered/cancelled
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

order_items (
  id UUID PRIMARY KEY,
  order_id UUID,
  product_id UUID,
  quantity INT,
  price_at_purchase DECIMAL
)

-- Redis (Cart)
cart:{user_id} -> Hash {product_id: quantity}

-- Redis (Inventory Locks)
inventory_lock:{product_id} -> SET of order_ids (TTL: 10 minutes)
```

#### Order Flow (Tier 1 - Basic):

1. User adds items to cart (Redis)
2. User proceeds to checkout
3. **Reserve inventory** (Redis lock + decrement available stock)
4. Create order record (status: pending)
5. Process payment (simulated)
6. If payment succeeds → Confirm order (status: confirmed)
7. If payment fails → Release inventory, cancel order

#### API Endpoints:

- `POST /api/auth/register` & `/api/auth/login`
- `GET /api/products?category=X&page=1` - List products
- `POST /api/cart/add` - Add item to cart
- `GET /api/cart` - View cart
- `POST /api/orders/checkout` - Place order
- `GET /api/orders/:id` - Order details
- `GET /api/orders/my-orders` - User's order history
- `PUT /api/orders/:id/cancel` - Cancel order (if not shipped)

#### Basic Inventory Management:

```javascript
// Reserve inventory (atomic operation)
async function reserveInventory(productId, quantity, orderId) {
  const lockKey = `inventory_lock:${productId}`;
  const inventoryKey = `inventory:${productId}`;

  // Check available stock
  const available = await redis.get(inventoryKey);
  if (parseInt(available) < quantity) {
    throw new Error("Insufficient stock");
  }

  // Atomically decrement and add to lock set
  const multi = redis.multi();
  multi.decrby(inventoryKey, quantity);
  multi.sadd(lockKey, orderId);
  multi.expire(lockKey, 600); // 10-minute hold
  await multi.exec();

  return true;
}

// Release inventory (on payment failure or timeout)
async function releaseInventory(productId, quantity, orderId) {
  const lockKey = `inventory_lock:${productId}`;
  const inventoryKey = `inventory:${productId}`;

  const multi = redis.multi();
  multi.incrby(inventoryKey, quantity);
  multi.srem(lockKey, orderId);
  await multi.exec();
}
```

#### Success Criteria:

- Order placement completes within 2 seconds
- No overselling (inventory properly reserved)
- Payment failures rollback inventory correctly
- Order status updates reflected accurately

---

### **Tier 2: Event-Driven Architecture + High Volume** (Week 2)

**Backend Focus: Kafka Saga Pattern, Microservices Communication**

#### Saga Pattern for Distributed Transactions:

**Problem**: Order processing involves multiple services (inventory, payment, shipping). If payment fails, inventory must be released.

**Solution**: Orchestration-based Saga with Kafka

**Order Saga Flow**:

1. API Gateway → Publish `order.created` event
2. **Inventory Service** (consumer):
   - Reserve inventory
   - Publish `inventory.reserved` or `inventory.failed`
3. **Payment Service** (consumer):
   - Process payment
   - Publish `payment.succeeded` or `payment.failed`
4. **Order Service** (consumer):
   - If all succeed → Update order status to `confirmed`
   - Publish `order.confirmed`
5. **Shipping Service** (consumer):
   - Create shipment
   - Publish `shipment.created`
6. **Notification Service** (consumer):
   - Send order confirmation email
   - Send shipping notification

**Compensating Transactions** (Rollback):

- If `payment.failed` → Publish `inventory.release` → Inventory Service releases stock
- If `inventory.failed` → Publish `order.cancelled` → Order Service marks order as cancelled

#### Kafka Topics:

- `order-events` (created, confirmed, cancelled)
- `inventory-events` (reserved, released, failed)
- `payment-events` (succeeded, failed)
- `shipping-events` (created, in-transit, delivered)
- `notification-events` (email, SMS triggers)

#### Saga State Machine (Order Service):

```javascript
// Order state transitions
const orderSaga = {
  PENDING: {
    on: {
      INVENTORY_RESERVED: "AWAITING_PAYMENT",
      INVENTORY_FAILED: "CANCELLED",
    },
  },
  AWAITING_PAYMENT: {
    on: {
      PAYMENT_SUCCEEDED: "CONFIRMED",
      PAYMENT_FAILED: "CANCELLED", // Trigger inventory release
    },
  },
  CONFIRMED: {
    on: {
      SHIPMENT_CREATED: "PROCESSING",
      SHIPMENT_FAILED: "CONFIRMED", // Retry later
    },
  },
  PROCESSING: {
    on: {
      SHIPMENT_IN_TRANSIT: "SHIPPED",
    },
  },
  SHIPPED: {
    on: {
      SHIPMENT_DELIVERED: "DELIVERED",
    },
  },
  CANCELLED: {
    /* terminal state */
  },
  DELIVERED: {
    /* terminal state */
  },
};
```

#### High Volume Data Simulation:

```javascript
Seed Data:
- 100,000 users
- 50,000 products (50 categories)
- 10,000,000 orders (past year)
- 25,000,000 order items
- Realistic distributions:
  - Average order value: $75 (SD $50)
  - Average items per order: 2.5
  - Seasonal spikes (holiday sales)
```

#### Flash Sale Handling:

**Scenario**: 10,000 users trying to buy 100 units of a product simultaneously

**Challenges**:

1. Race conditions (overselling)
2. System overload (too many requests)
3. Fair allocation (first-come-first-served)

**Solutions**:

1. **Redis Atomic Operations**:

   ```javascript
   // Use Lua script for atomic check-and-decrement
   const reserveScript = `
     local available = redis.call('GET', KEYS[1])
     if tonumber(available) >= tonumber(ARGV[1]) then
       redis.call('DECRBY', KEYS[1], ARGV[1])
       return 1
     else
       return 0
     end
   `;

   const success = await redis.eval(reserveScript, 1, inventoryKey, quantity);
   ```

2. **Queue System**:

   - Use Kafka to queue checkout requests
   - Process sequentially (prevents thundering herd)
   - Show queue position to users

3. **Rate Limiting**:
   - Limit checkout attempts per user (max 3 per minute)
   - Use Redis sliding window counter

#### Idempotency:

**Problem**: User clicks "Place Order" twice → Duplicate orders

**Solution**: Idempotency keys

```javascript
POST /api/orders/checkout
Headers: Idempotency-Key: <uuid>

// Server checks if key exists in Redis
const processedOrderId = await redis.get(`idempotency:${key}`);
if (processedOrderId) {
  return { orderId: processedOrderId }; // Return existing order
}

// Process new order
const orderId = await createOrder(...);

// Store idempotency key (24-hour TTL)
await redis.setex(`idempotency:${key}`, 86400, orderId);
```

#### Success Criteria:

- Handle 1,000 orders/second without data corruption
- Saga pattern successfully handles payment failures (rollback inventory)
- Flash sale: 100 units sold correctly (no overselling) with 10K concurrent requests
- Kafka consumer lag < 500 messages
- Idempotency prevents duplicate orders

---

### **Tier 3: AI Features + Performant Order Dashboard** (Week 3)

**AI Integration + Admin/Customer UX**

#### AI-Powered Features:

1. **Fraud Detection** (Gemini/OpenAI):

   - Analyze order patterns for suspicious activity
   - Features: order value, frequency, shipping address changes, velocity
   - Risk score: 0-100 (>80 = high risk, manual review)
   - Endpoint: Kafka consumer processes orders asynchronously
   - Admin dashboard shows flagged orders

2. **Product Recommendations**:

   - "Customers who bought X also bought Y"
   - Collaborative filtering + content-based filtering
   - Endpoint: `GET /api/recommendations?product_id=X` or `GET /api/recommendations/personalized`
   - AI analyzes purchase history to recommend products

3. **Demand Forecasting** (AI):

   - Predict future demand for products (next 7/30 days)
   - Use historical sales data + seasonality + trends
   - Helps admins with inventory planning
   - Endpoint: `GET /api/analytics/demand-forecast?product_id=X`
   - Display confidence intervals

4. **Smart Search & Filters**:

   - Semantic search: "red summer dress under $50"
   - Use embeddings to understand intent
   - Endpoint: `GET /api/products/search?q=red summer dress under 50`
   - Better than keyword matching

5. **Dynamic Pricing Suggestions** (AI):
   - Suggest optimal prices based on demand, competitor pricing, inventory levels
   - Endpoint: `GET /api/pricing/suggest?product_id=X`
   - Admin can review and apply suggestions

#### Customer Frontend: Order Tracking

**Challenge**: Real-time order status updates for millions of orders

**Implementation**:

- **Order Status Timeline**:
  - Visual timeline (Pending → Confirmed → Processing → Shipped → Delivered)
  - Real-time updates via WebSocket
  - Show estimated delivery date
- **Live Shipment Tracking**:
  - Map view with shipment location (if available)
  - Push notifications on status changes
- **Order History Table**:
  - Virtual scrolling for users with 1000+ orders
  - Filters: Date range, status, price range
  - Search by product name or order ID
  - Server-side pagination and sorting

#### Admin Frontend: Order Management Dashboard

**Challenge**: Display 10M+ orders with filtering, sorting, and bulk actions

**Implementation**:

- **Order Queue**:
  - Show pending orders (need processing)
  - Fraud-flagged orders (need review)
  - Failed payments (need follow-up)
  - Virtual scrolling (render only visible rows)
- **Bulk Actions**:
  - Select multiple orders → Mark as shipped, Cancel, Refund
  - Batch API requests (max 100 orders per request)
- **Advanced Filters**:
  - Status, date range, price range, customer name, product
  - Server-side filtering: `GET /api/admin/orders?status=confirmed&date_from=2024-01-01&page=1`
  - Debounced search (300ms)
- **Real-Time Updates**:
  - WebSocket for new orders (notification badge)
  - Auto-refresh pending orders every 30 seconds
- **Export**:
  - Download filtered orders as CSV (up to 10K rows)
  - Background job for large exports (email link when ready)

#### API Optimizations:

```sql
-- Composite indexes for common queries
CREATE INDEX idx_orders_user_date ON orders(user_id, created_at DESC);
CREATE INDEX idx_orders_status_date ON orders(status, created_at DESC);
CREATE INDEX idx_order_items_product ON order_items(product_id);

-- Materialized view for admin dashboard stats
CREATE MATERIALIZED VIEW admin_order_stats AS
SELECT
  status,
  COUNT(*) as count,
  SUM(total_amount) as total_revenue,
  DATE(created_at) as order_date
FROM orders
GROUP BY status, DATE(created_at);
REFRESH MATERIALIZED VIEW admin_order_stats; -- Run hourly via cron
```

#### Success Criteria:

- AI fraud detection flags 90%+ of suspicious orders
- Product recommendations increase average order value by 15%+
- Order dashboard loads 10M orders in < 2 seconds (with pagination)
- Real-time order tracking updates within 500ms
- Admin can process 100 orders/minute efficiently

---

### **Tier 4: Admin Analytics Dashboard** (Week 4)

**Business Intelligence + Operational Monitoring**

#### Admin Dashboard Features:

1. **Real-Time Operations Monitor**:

   - Orders per second (line chart, live updates)
   - Current order processing rate (orders/minute)
   - Kafka consumer health (lag, throughput)
   - Payment success rate (percentage gauge)
   - Inventory alerts (low stock warnings)

2. **Sales Analytics**:

   - **Revenue Metrics**:
     - Total revenue (daily/weekly/monthly) (big number + trend)
     - Revenue by category (pie chart)
     - Revenue by hour of day (heatmap)
     - Top-selling products (leaderboard)
     - Average order value (AOV) trend
   - **Order Metrics**:
     - Total orders placed (with growth rate)
     - Order status distribution (funnel chart)
     - Order cancellation rate (line chart over time)
     - Average order processing time
   - **Product Performance**:
     - Best sellers (by units sold, revenue)
     - Worst sellers (inventory turnover rate)
     - Out-of-stock frequency
     - Profit margins by product

3. **Customer Analytics**:

   - **Behavior Metrics**:
     - New vs returning customers (ratio)
     - Customer lifetime value (CLV) distribution
     - Average orders per customer
     - Cart abandonment rate (funnel)
   - **Segmentation**:
     - High-value customers (top 10% by spend)
     - Churn risk customers (no orders in 90 days)
     - Cohort analysis (retention by signup month)

4. **Inventory Analytics**:

   - **Stock Levels**:
     - Current inventory by product (table with search/filter)
     - Low stock alerts (< 10 units)
     - Overstock items (> 90 days no sales)
     - Stock turnover rate (inventory velocity)
   - **Demand vs Supply**:
     - Forecasted demand vs current stock (comparison chart)
     - Stockout incidents (how often products run out)
     - Reorder point recommendations (AI)

5. **Fraud & Risk Analytics**:

   - Flagged orders queue (AI fraud detection)
   - Fraud rate over time (percentage)
   - Most common fraud patterns (AI insights)
   - Chargebacks and disputes (count and amount)
   - False positive rate tracking (review accuracy)

6. **Operational Efficiency**:

   - **Order Fulfillment**:
     - Average time
     - Average time to ship (order placed → shipped)
     - On-time delivery rate (percentage)
     - Shipping delays (by carrier, region)
   - **System Performance**:
     - API response times (P50, P95, P99)
     - Database query performance (slow queries)
     - Kafka consumer lag by topic
     - Error rates by service (microservices health)
   - **Payment Analytics**:
     - Payment method distribution (credit card, PayPal, etc.)
     - Payment success/failure rates
     - Average payment processing time
     - Failed payment reasons (insufficient funds, etc.)

7. **Predictive Analytics** (AI):
   - Sales forecast (next 7/30/90 days)
   - Inventory reorder recommendations
   - Customer churn predictions (likely to stop buying)
   - Seasonal trend detection
   - Optimal pricing recommendations
   - Flash sale impact predictions

#### Implementation:

- **Data Aggregation**:

  ```sql
  -- Materialized views for fast dashboard queries
  CREATE MATERIALIZED VIEW analytics_daily_revenue AS
  SELECT
    DATE(created_at) as date,
    status,
    COUNT(*) as order_count,
    SUM(total_amount) as revenue,
    AVG(total_amount) as avg_order_value
  FROM orders
  WHERE created_at > NOW() - INTERVAL '1 year'
  GROUP BY DATE(created_at), status;

  CREATE MATERIALIZED VIEW analytics_product_performance AS
  SELECT
    p.id,
    p.name,
    p.category,
    COUNT(oi.id) as units_sold,
    SUM(oi.quantity * oi.price_at_purchase) as revenue,
    COUNT(DISTINCT o.user_id) as unique_customers
  FROM products p
  LEFT JOIN order_items oi ON oi.product_id = p.id
  LEFT JOIN orders o ON o.id = oi.order_id
  WHERE o.status IN ('confirmed', 'shipped', 'delivered')
    AND o.created_at > NOW() - INTERVAL '90 days'
  GROUP BY p.id, p.name, p.category;

  CREATE MATERIALIZED VIEW analytics_customer_segments AS
  SELECT
    user_id,
    COUNT(*) as total_orders,
    SUM(total_amount) as lifetime_value,
    MAX(created_at) as last_order_date,
    MIN(created_at) as first_order_date,
    AVG(total_amount) as avg_order_value
  FROM orders
  WHERE status IN ('confirmed', 'shipped', 'delivered')
  GROUP BY user_id;
  ```

- **Real-Time Streaming Aggregations**:

  - Kafka Streams for windowed metrics (orders per minute)
  - Redis for transient metrics (current active carts, checkout sessions)
  - WebSocket for pushing live updates to dashboard

- **Batch Jobs**:
  - **Hourly**: Refresh materialized views, compute fraud risk scores
  - **Daily**: Customer segmentation, inventory reorder calculations, cohort analysis
  - **Weekly**: Sales forecasts, trend analysis, performance reports

#### Dashboard UI Components:

1. **Executive Summary Page**:

   - Big numbers: Today's revenue, orders, AOV, conversion rate
   - Mini charts: 7-day trends for key metrics
   - Alerts: Low stock items, fraud flags, system issues
   - Quick actions: Process pending orders, view flagged orders

2. **Sales Analytics Page**:

   - Interactive charts (click to drill down)
   - Date range selector (Today, 7d, 30d, 90d, Custom)
   - Comparison mode (compare this week vs last week)
   - Top products table (sortable, searchable)
   - Export reports as PDF/CSV

3. **Order Management Page**:

   - Order queue with filters (status, date, customer)
   - Virtual scrolling table (handle 10M+ orders)
   - Bulk actions toolbar (when rows selected)
   - Side panel for order details (click row to expand)
   - Real-time updates (new orders highlighted)

4. **Inventory Management Page**:

   - Product inventory table (current stock, reserved, available)
   - Low stock alerts (red highlighting)
   - Reorder recommendations (AI-powered)
   - Bulk update actions (adjust stock levels)
   - Import/export CSV for bulk updates

5. **Fraud Review Page**:

   - Queue of flagged orders (sorted by risk score)
   - Order details with risk factors highlighted
   - Customer history (previous orders, flags)
   - Side-by-side comparison (this order vs customer's typical)
   - Actions: Approve, Reject, Request more info
   - Audit log (all review actions)

6. **System Health Page**:
   - Service status indicators (green/yellow/red)
   - Kafka topic lag charts
   - Database performance metrics
   - API endpoint latencies
   - Error rate graphs
   - Recent errors log (filterable)

#### Advanced Features:

- **Custom Reports Builder**:

  - Drag-and-drop interface to create custom reports
  - Select dimensions (date, product, category, region)
  - Select metrics (revenue, orders, AOV, etc.)
  - Save and schedule reports (email daily/weekly)

- **Alerts & Notifications**:

  - Configure custom alerts (revenue drops 20%, fraud spike, etc.)
  - Delivery channels: Email, SMS, Slack, in-app
  - Alert history and management

- **A/B Testing Dashboard**:
  - Track experiments (pricing tests, UI changes)
  - Compare metrics between variants
  - Statistical significance calculations

#### Success Criteria:

- Dashboard loads analytics for 10M orders in < 3 seconds
- Real-time metrics update within 1 second
- Admin can identify issues (stockouts, fraud) within 30 seconds of occurrence
- AI forecasts achieve 85%+ accuracy (MAPE < 15%)
- Materialized views refresh without impacting production queries
- Export large datasets (1M+ rows) completes within 5 minutes

---

## Data Volume Simulation Strategy

### Initial Seed:

```javascript
- 100,000 users (realistic profiles, addresses)
- 50,000 products (50 categories, varying prices $5-$500)
- Inventory:
  - 70% products: 50-500 units in stock
  - 20% products: 10-50 units (low stock)
  - 10% products: 0 units (out of stock)
- 10,000,000 orders (past 12 months)
- Order distribution:
  - 60% delivered successfully
  - 15% currently in transit
  - 10% pending/processing
  - 10% cancelled
  - 5% payment failed
- 25,000,000 order items (avg 2.5 items per order)
- Realistic patterns:
  - 40% orders during holiday season (Nov-Dec)
  - Peak hours: 7pm-10pm (30% of daily orders)
  - Average order value: $75 (lognormal distribution)
```

### Seasonal Patterns:

- **Holiday Spike**: 5x normal volume during Black Friday/Cyber Monday
- **Flash Sales**: 50x normal volume for specific products
- **Hourly Patterns**: 10x difference between peak and off-peak

### Load Testing Scenarios:

1. **Normal Load**: 100 orders/second sustained
2. **Peak Load**: 500 orders/second (evening rush)
3. **Flash Sale**: 2,000 orders/second for 1 product (100 units available)
4. **Payment Failure Storm**: 30% payment failure rate (test rollback)
5. **Database Failover**: Test system behavior during DB downtime

### Fraud Simulation:

- 2% of orders flagged as high-risk (AI detection)
- Common patterns: Multiple orders from same IP, rapid address changes, high-value orders from new accounts

### Tools:

- k6 for load testing
- Custom order generator (Kafka producer)
- Artillery.io for WebSocket testing
- PostgreSQL pg_bench for database stress testing

---

## Key Learning Outcomes

1. **Microservices Architecture**: Service decomposition, inter-service communication
2. **Saga Pattern**: Distributed transaction handling, compensating transactions
3. **Event-Driven Systems**: Kafka for async processing, event sourcing
4. **Concurrency Control**: Distributed locks, atomic operations, idempotency
5. **AI for Business**: Fraud detection, demand forecasting, recommendations
6. **Data Analytics**: Materialized views, real-time aggregations, BI dashboards
7. **System Reliability**: Handling failures, rollback mechanisms, monitoring

---

## Evaluation Criteria

- **Architecture**: Clean microservices design, proper event-driven patterns
- **Performance**: Handle 1000 orders/sec, dashboard loads in < 3s
- **Reliability**: Saga pattern correctly handles failures (no data loss)
- **Scalability**: System scales horizontally (add more service instances)
- **AI Integration**: Fraud detection 90%+ precision, forecasts 85%+ accuracy
- **Code Quality**: Clean service boundaries, comprehensive testing, monitoring
- **Documentation**: Architecture diagrams, API docs, runbooks

---

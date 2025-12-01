# High-Level Architecture Overview

## System Architecture

This e-commerce order processing system follows a **layered, scalable architecture** with clear separation of concerns between frontend, backend, and data layers. The system is designed to handle 1,000+ daily users with horizontal scaling capabilities.

---

## Architecture Layers

### 1. **Presentation Layer (Frontend)**
**Technology:** React 18 + Vite + TailwindCSS  
**Location:** `frontend/`

**Components:**
- **Pages:** Home, Products, ProductDetail, Cart, Orders, OrderDetail
- **Components:** Reusable UI components (Button, Card, Modal, Skeleton, etc.)
- **State Management:** React Context API (CartContext)
- **API Integration:** Axios-based API client with session management
- **Routing:** React Router v6 with lazy loading

**Key Features:**
- Code splitting for optimal performance
- Responsive design with TailwindCSS
- Session-based cart persistence
- Real-time cart updates via Context API

---

### 2. **Application Layer (Backend API)**
**Technology:** Node.js + Express  
**Location:** `backend/`

#### **2.1 Route Layer** (`routes/`)
- **Purpose:** HTTP endpoint definitions and request routing
- **Files:**
  - `index.js` - Main router aggregator
  - `productRoutes.js` - Product catalog endpoints
  - `cartRoutes.js` - Shopping cart endpoints
  - `orderRoutes.js` - Order processing endpoints

#### **2.2 Middleware Layer** (`middleware/`)
- **Purpose:** Request processing, database routing, session management
- **Components:**
  - `dbRouter.js` - Intelligent read/write database routing
    - GET/HEAD → Read Replica (round-robin)
    - POST/PUT/DELETE → Primary Database
  - `sessionId.js` - Session ID extraction from headers/cookies

#### **2.3 Controller Layer** (`controllers/`)
- **Purpose:** Business logic orchestration
- **Components:**
  - `productController.js` - Product catalog operations
  - `cartController.js` - Cart management (Redis-backed)
  - `orderController.js` - Order creation, payment processing, inventory reservation

#### **2.4 Model Layer** (`models/`)
- **Technology:** Sequelize ORM
- **Purpose:** Database schema definitions and relationships
- **Models:**
  - `Category` - Product categories
  - `Product` - Product catalog
  - `Inventory` - Stock levels and reservations
  - `Order` - Order records
  - `OrderItem` - Order line items
  - `Payment` - Payment transactions

#### **2.5 Utility Layer** (`utils/`)
- **Purpose:** Cross-cutting concerns and infrastructure
- **Components:**
  - `db.js` - Database connection management (Primary + 2 Replicas)
  - `redis.js` - Redis client, caching, cart, inventory locks
  - `config.js` - Environment configuration
  - `initDatabase.js` - Database schema initialization

---

### 3. **Data Layer**

#### **3.1 PostgreSQL Database Cluster**
**Architecture:** Primary-Replica (1 Write + 2 Read Replicas)

- **Primary Database:**
  - All write operations (CREATE, UPDATE, DELETE)
  - Source of truth for data consistency
  - Publishes changes via PostgreSQL Logical Replication (WAL)

- **Read Replicas (2x):**
  - All read operations (SELECT queries)
  - Round-robin load balancing
  - Subscribes to Primary via WAL streaming
  - Typical replication lag: < 100ms

**Connection Pooling:**
- Max connections: 20 per database
- Min connections: 5
- Idle timeout: 10 seconds

#### **3.2 Redis Cache Layer**
**Purpose:** High-performance caching and session storage

**Cache Patterns:**
- **Cache-Aside:** Application-managed cache
- **Write-Through:** Cache updates on writes
- **TTL-based Expiration:** Automatic invalidation

**Cache Keys:**
```
product:{id}                    → Product details (1 hour TTL)
products:page:{n}:...           → Product listings (30 min TTL)
categories:all                  → All categories (1 hour TTL)
cart:{sessionId}                → Shopping cart (7 days TTL)
inventory:{productId}           → Inventory levels (5 min TTL)
inventory_lock:{productId}      → Inventory reservations (10 min TTL)
```

**Cart Storage:**
- Hash structure: `cart:{sessionId}` → `{productId: {quantity, price, title, ...}}`
- Session-based (guest sessions)
- Auto-expires after 7 days

**Inventory Locks:**
- Atomic reservation using Lua scripts
- Prevents race conditions during checkout
- Auto-release after 10 minutes if order not confirmed

---

### 4. **Infrastructure Layer**

#### **4.1 NGINX Load Balancer** (`nginx/`)
**Purpose:** Request distribution, rate limiting, SSL termination

**Features:**
- Round-robin load balancing (configurable to least-connections)
- Health checks (5s interval)
- Rate limiting:
  - API endpoints: 100 req/min per IP
  - Checkout: 10 req/min per IP
- SSL/TLS ready for production
- Upstream failover (3 retries)

**Scaling:**
- Currently: 1 Node.js server (port 3001)
- Ready for: 3 servers (ports 3001, 3002, 3003)

---

## Data Flow Architecture

### **Read Operation Flow (GET)**

```
┌─────────┐
│ Client  │
│(Browser)│
└────┬────┘
     │ HTTP GET /api/products
     ↓
┌─────────────────┐
│  NGINX          │
│  Load Balancer  │
└────┬────────────┘
     │
     ↓
┌─────────────────┐
│  Node.js Server │
│  Express App    │
└────┬────────────┘
     │
     ├─→ Middleware: dbRouter
     │   └─→ Detects GET → Route to Read Replica
     │
     ├─→ Controller: productController.getProducts()
     │   ├─→ Check Redis Cache
     │   │   └─→ Cache Hit? Return cached data
     │   │
     │   └─→ Cache Miss? Query Read Replica
     │       ├─→ Sequelize Query (Product.findAll)
     │       ├─→ Include: Category, Inventory
     │       └─→ Store in Redis (30 min TTL)
     │
     └─→ Response → Client
```

### **Write Operation Flow (POST/PUT/DELETE)**

```
┌─────────┐
│ Client  │
│(Browser)│
└────┬────┘
     │ HTTP POST /api/orders/checkout
     ↓
┌─────────────────┐
│  NGINX          │
│  Load Balancer  │
└────┬────────────┘
     │
     ↓
┌─────────────────┐
│  Node.js Server │
│  Express App    │
└────┬────────────┘
     │
     ├─→ Middleware: dbRouter
     │   └─→ Detects POST → Route to Primary DB
     │
     ├─→ Controller: orderController.createOrder()
     │   ├─→ Begin Transaction (Primary DB)
     │   │
     │   ├─→ Get Cart from Redis
     │   │
     │   ├─→ Verify Stock (Query Primary DB)
     │   │
     │   ├─→ Reserve Inventory (Redis Lua Script - Atomic)
     │   │   └─→ inventory_lock:{productId}
     │   │
     │   ├─→ Create Order (Primary DB Transaction)
     │   │   ├─→ orders table
     │   │   └─→ order_items table
     │   │
     │   ├─→ Update Inventory (Primary DB)
     │   │   └─→ Decrement quantity, increment reserved_quantity
     │   │
     │   ├─→ Process Payment (Simulated)
     │   │
     │   ├─→ If Payment Success:
     │   │   ├─→ Update Order Status → 'confirmed'
     │   │   ├─→ Create Payment Record
     │   │   ├─→ Clear Cart (Redis)
     │   │   └─→ Commit Transaction
     │   │
     │   └─→ If Payment Fails:
     │       ├─→ Release Inventory (Redis)
     │       ├─→ Rollback Transaction
     │       └─→ Return Error
     │
     ├─→ Invalidate Cache (Redis)
     │   └─→ Delete product:* patterns
     │
     └─→ Response → Client
```

### **Order Processing Flow (Detailed)**

```
1. Add to Cart
   Client → API → Redis (cart:{sessionId})
   └─→ Hash Set: {productId: {quantity, price, title, ...}}

2. Checkout Initiation
   Client → POST /api/orders/checkout
   └─→ Body: {shippingAddress, paymentMethod}

3. Inventory Reservation (Atomic)
   Redis Lua Script:
   ├─→ Check available stock
   ├─→ Decrement available quantity
   ├─→ Add orderId to inventory_lock set
   └─→ Set 10-minute TTL

4. Order Creation (Database Transaction)
   Primary DB:
   ├─→ Create order record (status: 'pending')
   ├─→ Create order_items records
   └─→ Update inventory (decrement quantity, increment reserved)

5. Payment Processing
   Simulated Payment Service:
   ├─→ 95% success rate
   └─→ Generate transaction ID

6. Order Confirmation (if payment succeeds)
   ├─→ Update order status → 'confirmed'
   ├─→ Create payment record
   ├─→ Clear cart (Redis)
   └─→ Commit transaction

7. Order Cancellation (if payment fails)
   ├─→ Release inventory (Redis)
   ├─→ Rollback inventory in DB
   ├─→ Update order status → 'cancelled'
   └─→ Keep cart intact
```

---

## Session Management

**Type:** Guest Sessions (no authentication in Tier-1)

**Flow:**
1. Frontend generates session ID on first visit
2. Stored in `localStorage` (browser)
3. Sent via `X-Session-ID` header in all API requests
4. Backend extracts session ID via middleware
5. Used for cart association and order tracking

**Session ID Format:**
- Client-side: `session_{timestamp}_{random}`
- Backend: UUID (if not provided)

**Persistence:**
- Cart: 7 days TTL in Redis
- Orders: Permanent in PostgreSQL

---

## Scalability Features

### **Current (Tier-1)**
- ✅ Horizontal scaling: 1-3 Node.js servers
- ✅ Database read scaling: 2 read replicas
- ✅ Redis caching layer
- ✅ Intelligent read/write splitting
- ✅ Connection pooling (20 max per DB)

### **Performance Targets**
- Product listing: < 200ms (with cache)
- Product details: < 100ms (with cache)
- Add to cart: < 100ms
- Checkout: < 2 seconds
- Order status: < 500ms

### **Capacity**
- Peak requests: 50-100 req/sec
- Concurrent users: 100-150 per server
- Orders per second: 5-10

---

## Security Considerations

1. **Rate Limiting:** NGINX-level protection (100 req/min API, 10 req/min checkout)
2. **Input Validation:** All inputs sanitized in controllers
3. **SQL Injection Prevention:** Parameterized queries (Sequelize ORM)
4. **CORS:** Configured with allowed origins
5. **Session Security:** Session ID in headers (future: HTTP-only cookies)

---

## Error Handling

**Layers:**
1. **Frontend:** Try-catch in API calls, error boundaries
2. **Backend:** Express error middleware
3. **Database:** Transaction rollback on errors
4. **Redis:** Graceful degradation (fallback to DB)

**Error Response Format:**
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error (development only)"
}
```

---

## Monitoring & Observability

**Key Metrics:**
- Request rate and response times (P50, P95, P99)
- Database replication lag
- Redis cache hit/miss ratio
- Connection pool usage
- Error rates by endpoint

**Health Checks:**
- `/api/health` - API health status
- Database connection status
- Redis connection status

---

## Deployment Architecture

```
┌─────────────────────────────────────────┐
│         Internet / Users                │
└──────────────┬──────────────────────────┘
               │ HTTPS
               ↓
┌─────────────────────────────────────────┐
│      NGINX Load Balancer (Port 80)      │
│  - Rate Limiting                        │
│  - SSL Termination                      │
│  - Health Checks                        │
└──────────────┬──────────────────────────┘
               │
     ┌─────────┼─────────┐
     │         │         │
     ↓         ↓         ↓
┌────────┐ ┌────────┐ ┌────────┐
│ Node 1 │ │ Node 2 │ │ Node 3 │
│ :3001  │ │ :3002  │ │ :3003  │
└───┬────┘ └───┬────┘ └───┬────┘
    │          │          │
    └──────────┼──────────┘
               │
    ┌──────────┴──────────┐
    │                     │
    ↓                     ↓
┌──────────┐        ┌──────────┐
│  Redis   │        │PostgreSQL│
│  Cache   │        │ Cluster  │
│          │        │          │
│          │        │ PRIMARY  │
│          │        │ (Write)  │
│          │        │    │     │
│          │        │    ├─→ REPLICA 1 (Read)
│          │        │    └─→ REPLICA 2 (Read)
└──────────┘        └──────────┘
```

---

## Technology Stack Summary

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18, Vite, TailwindCSS | User interface |
| **Backend** | Node.js, Express | API server |
| **Database** | PostgreSQL (Primary + 2 Replicas) | Data persistence |
| **Cache** | Redis | Caching, cart, inventory locks |
| **Load Balancer** | NGINX | Request distribution, rate limiting |
| **ORM** | Sequelize | Database abstraction |
| **HTTP Client** | Axios | Frontend API communication |

---

## Key Design Patterns

1. **Repository Pattern:** Models abstract database access
2. **Middleware Pattern:** Request processing pipeline
3. **Cache-Aside Pattern:** Application-managed caching
4. **Transaction Pattern:** ACID guarantees for orders
5. **Atomic Operations:** Lua scripts for inventory locks
6. **Read/Write Splitting:** Automatic database routing

---

## Future Enhancements (Tier-2+)

- 🔄 Kafka for async order processing
- 🔄 Microservices architecture (split services)
- 🔄 Database sharding for scale
- 🔄 Multi-region deployment
- 🔄 Real-time order tracking (WebSockets)
- 🔄 AI-powered fraud detection
- 🔄 Automated failover for database replicas


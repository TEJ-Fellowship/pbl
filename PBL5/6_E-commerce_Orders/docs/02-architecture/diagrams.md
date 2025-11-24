# Architecture Visualization

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER                                      │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                    React Frontend (Vite)                            │  │
│  │                                                                       │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │  │
│  │  │   Pages      │  │  Components  │  │   Contexts   │              │  │
│  │  │              │  │              │  │              │              │  │
│  │  │ • Home       │  │ • ProductCard│  │ • CartContext│              │  │
│  │  │ • Products   │  │ • Button     │  │              │              │  │
│  │  │ • Cart       │  │ • Modal      │  │              │              │  │
│  │  │ • Orders     │  │ • Skeleton   │  │              │              │  │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │  │
│  │         │                 │                  │                       │  │
│  │         └─────────────────┼──────────────────┘                       │  │
│  │                           │                                           │  │
│  │                    ┌──────▼───────┐                                  │  │
│  │                    │   API Client │                                  │  │
│  │                    │   (Axios)    │                                  │  │
│  │                    │              │                                  │  │
│  │                    │ • Session ID  │                                  │  │
│  │                    │ • Interceptors│                                  │  │
│  │                    └──────┬───────┘                                  │  │
│  └───────────────────────────┼───────────────────────────────────────────┘  │
└───────────────────────────────┼───────────────────────────────────────────────┘
                                │ HTTP/HTTPS
                                │ X-Session-ID Header
                                ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                      INFRASTRUCTURE LAYER                                   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                    NGINX Load Balancer                             │  │
│  │                                                                     │  │
│  │  • Round-robin distribution                                         │  │
│  │  • Rate limiting (100 req/min API, 10 req/min checkout)          │  │
│  │  • Health checks                                                    │  │
│  │  • SSL termination (production)                                     │  │
│  └───────────────────────────┬─────────────────────────────────────────┘  │
└───────────────────────────────┼───────────────────────────────────────────────┘
                                │
                ┌───────────────┼───────────────┐
                │               │               │
                ↓               ↓               ↓
┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐
│  Node.js Server 1 │ │  Node.js Server 2 │ │  Node.js Server 3 │
│   (Port 3001)     │ │   (Port 3002)    │ │   (Port 3003)     │
│                   │ │                   │ │                   │
│  [Current]        │ │  [Future]        │ │  [Future]        │
└─────────┬─────────┘ └─────────┬─────────┘ └─────────┬─────────┘
          │                     │                     │
          └─────────────────────┼─────────────────────┘
                                │
                                ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER (Backend)                            │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                    Express Application                              │  │
│  │                                                                     │  │
│  │  ┌──────────────┐                                                 │  │
│  │  │  Middleware  │                                                 │  │
│  │  │              │                                                 │  │
│  │  │ • CORS       │                                                 │  │
│  │  │ • JSON Parse │                                                 │  │
│  │  │ • dbRouter   │ ──→ Routes GET to Replica, POST to Primary     │  │
│  │  │ • sessionId  │ ──→ Extracts X-Session-ID header               │  │
│  │  └──────┬───────┘                                                 │  │
│  │         │                                                          │  │
│  │         ↓                                                          │  │
│  │  ┌──────────────┐                                                 │  │
│  │  │    Routes    │                                                 │  │
│  │  │              │                                                 │  │
│  │  │ • /products  │                                                 │  │
│  │  │ • /cart      │                                                 │  │
│  │  │ • /orders    │                                                 │  │
│  │  └──────┬───────┘                                                 │  │
│  │         │                                                          │  │
│  │         ↓                                                          │  │
│  │  ┌──────────────┐                                                 │  │
│  │  │ Controllers  │                                                 │  │
│  │  │              │                                                 │  │
│  │  │ • product    │ ──→ Business logic for products                │  │
│  │  │ • cart       │ ──→ Cart operations (Redis)                     │  │
│  │  │ • order      │ ──→ Order creation, payment, inventory         │  │
│  │  └──────┬───────┘                                                 │  │
│  │         │                                                          │  │
│  │         ├──────────────────┐                                       │  │
│  │         │                  │                                       │  │
│  │         ↓                  ↓                                       │  │
│  │  ┌──────────────┐  ┌──────────────┐                              │  │
│  │  │    Models    │  │    Utils     │                              │  │
│  │  │  (Sequelize) │  │              │                              │  │
│  │  │              │  │ • redis.js   │ ──→ Redis operations         │  │
│  │  │ • Product    │  │ • db.js      │ ──→ DB connections           │  │
│  │  │ • Order      │  │ • config.js  │ ──→ Environment config       │  │
│  │  │ • Inventory  │  │              │                              │  │
│  │  │ • Category   │  │              │                              │  │
│  │  └──────────────┘  └──────────────┘                              │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                │
                ┌───────────────┼───────────────┐
                │               │               │
                ↓               ↓               ↓
┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐
│     Redis         │ │  PostgreSQL      │ │  PostgreSQL      │
│     Cache         │ │   PRIMARY         │ │   REPLICA 1      │
│                   │ │   (Write)        │ │   (Read)         │
│  • Cache          │ │                   │ │                   │
│  • Cart           │ │  All writes:     │ │  Read queries:    │
│  • Inventory Locks│ │  • CREATE        │ │  • SELECT         │
│                   │ │  • UPDATE        │ │                   │
│  Key Patterns:    │ │  • DELETE        │ │  Round-robin     │
│  • product:{id}   │ │                   │ │  load balancing   │
│  • cart:{sid}     │ │  Replication:    │ │                   │
│  • inventory:{id} │ │  WAL Streaming   │ │                   │
│                   │ │  ────────────────┼─→                   │
│                   │ │                   │                   │
└───────────────────┘ └───────────────────┘ └───────────────────┘
                                │
                                │ WAL Streaming
                                ↓
                    ┌───────────────────┐
                    │  PostgreSQL       │
                    │   REPLICA 2       │
                    │   (Read)          │
                    │                   │
                    │  Read queries:    │
                    │  • SELECT         │
                    │                   │
                    │  Round-robin      │
                    │  load balancing   │
                    └───────────────────┘
```

---

## Data Flow: Read Operation (GET /api/products)

```
┌─────────┐
│ Client  │
└────┬────┘
     │ 1. GET /api/products?page=1
     ↓
┌─────────────────┐
│  NGINX           │ 2. Route to available server
│  Load Balancer   │
└────┬─────────────┘
     │
     ↓
┌─────────────────┐
│  Express App    │ 3. Middleware: dbRouter
│                 │    └─→ Detects GET → Route to Read Replica
└────┬────────────┘
     │
     ↓
┌─────────────────┐
│  Controller     │ 4. productController.getProducts()
│                 │    ├─→ Check Redis: products:page:1:...
└────┬────────────┘    │
     │                 │ Cache Hit?
     │                 ├─→ YES → Return cached data
     │                 │
     │                 └─→ NO → Continue
     │
     ↓
┌─────────────────┐
│  Read Replica   │ 5. Query Database (round-robin)
│  (PostgreSQL)   │    └─→ Product.findAll({ include: Category, Inventory })
└────┬────────────┘
     │
     ↓
┌─────────────────┐
│  Controller     │ 6. Process results
│                 │    └─→ Store in Redis (30 min TTL)
└────┬────────────┘
     │
     ↓
┌─────────┐
│ Client  │ 7. Return JSON response
└─────────┘
```

---

## Data Flow: Write Operation (POST /api/orders/checkout)

```
┌─────────┐
│ Client  │
└────┬────┘
     │ 1. POST /api/orders/checkout
     │    Body: {shippingAddress, paymentMethod}
     ↓
┌─────────────────┐
│  NGINX           │ 2. Route to available server
│  Load Balancer   │    Rate limit: 10 req/min
└────┬─────────────┘
     │
     ↓
┌─────────────────┐
│  Express App    │ 3. Middleware: dbRouter
│                 │    └─→ Detects POST → Route to Primary DB
└────┬────────────┘
     │
     ↓
┌─────────────────┐
│  Controller     │ 4. orderController.createOrder()
│                 │    ├─→ Begin Transaction (Primary DB)
│                 │    │
│                 │    ├─→ Get Cart from Redis
│                 │    │   └─→ cart:{sessionId}
│                 │    │
│                 │    ├─→ Verify Stock (Query Primary DB)
│                 │    │
│                 │    ├─→ Reserve Inventory (Redis Lua Script)
│                 │    │   └─→ Atomic operation: inventory_lock:{productId}
│                 │    │
│                 │    ├─→ Create Order (Primary DB)
│                 │    │   ├─→ orders table
│                 │    │   └─→ order_items table
│                 │    │
│                 │    ├─→ Update Inventory (Primary DB)
│                 │    │   └─→ Decrement quantity
│                 │    │
│                 │    ├─→ Process Payment (Simulated)
│                 │    │
│                 │    ├─→ If Success:
│                 │    │   ├─→ Update Order Status
│                 │    │   ├─→ Create Payment Record
│                 │    │   ├─→ Clear Cart (Redis)
│                 │    │   └─→ Commit Transaction
│                 │    │
│                 │    └─→ If Failure:
│                 │        ├─→ Release Inventory (Redis)
│                 │        ├─→ Rollback Transaction
│                 │        └─→ Return Error
└────┬────────────┘
     │
     ├─────────────────┐
     │                 │
     ↓                 ↓
┌──────────┐    ┌──────────┐
│  Redis   │    │PostgreSQL│
│          │    │ PRIMARY  │
│ • Cart   │    │          │
│ • Locks  │    │ • Orders │
│          │    │ • Items  │
│          │    │ • Inv.   │
└──────────┘    └──────────┘
     │                 │
     │                 │ WAL Streaming
     │                 ↓
     │          ┌──────────┐
     │          │ REPLICA 1│
     │          │ REPLICA 2│
     │          └──────────┘
     │
     ↓
┌─────────┐
│ Client  │ 5. Return response (success or error)
└─────────┘
```

---

## Component Interaction Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend Layer                           │
│                                                                 │
│  ┌──────────────┐         ┌──────────────┐                    │
│  │   Pages      │────────→│  Components  │                    │
│  │              │         │              │                    │
│  │ • Products   │         │ • ProductCard│                    │
│  │ • Cart       │         │ • Button     │                    │
│  │ • Orders     │         │ • Modal      │                    │
│  └──────┬───────┘         └──────┬───────┘                    │
│         │                        │                             │
│         │                        │                             │
│         ↓                        ↓                             │
│  ┌──────────────┐         ┌──────────────┐                    │
│  │   Hooks      │         │  Contexts    │                    │
│  │              │         │              │                    │
│  │ useProducts  │         │ CartContext  │                    │
│  └──────┬───────┘         └──────┬───────┘                    │
│         │                        │                             │
│         └──────────┬──────────────┘                             │
│                    │                                             │
│                    ↓                                             │
│            ┌──────────────┐                                      │
│            │  API Client  │                                      │
│            │   (api.js)   │                                      │
│            │              │                                      │
│            │ • productsApi│                                      │
│            │ • cartApi    │                                      │
│            │ • ordersApi  │                                      │
│            └──────┬───────┘                                      │
└───────────────────┼─────────────────────────────────────────────┘
                    │ HTTP Request
                    │ X-Session-ID Header
                    ↓
┌─────────────────────────────────────────────────────────────────┐
│                        Backend Layer                            │
│                                                                 │
│  ┌──────────────┐         ┌──────────────┐                    │
│  │   Routes     │────────→│ Controllers  │                    │
│  │              │         │              │                    │
│  │ • /products  │         │ • product    │                    │
│  │ • /cart      │         │ • cart       │                    │
│  │ • /orders    │         │ • order      │                    │
│  └──────┬───────┘         └──────┬───────┘                    │
│         │                        │                             │
│         │                        ├──────────┐                  │
│         │                        │          │                  │
│         ↓                        ↓          ↓                  │
│  ┌──────────────┐    ┌──────────────┐ ┌──────────────┐        │
│  │  Middleware  │    │   Models    │ │    Utils     │        │
│  │              │    │             │ │              │        │
│  │ • dbRouter   │    │ • Product   │ │ • redis.js   │        │
│  │ • sessionId  │    │ • Order     │ │ • db.js      │        │
│  └──────────────┘    │ • Inventory │ │ • config.js  │        │
│                      └──────┬───────┘ └──────┬───────┘        │
│                             │                │                 │
│                             └────────┬───────┘                 │
│                                      │                          │
└──────────────────────────────────────┼──────────────────────────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    │                  │                  │
                    ↓                  ↓                  ↓
            ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
            │   Redis      │  │ PostgreSQL   │  │ PostgreSQL   │
            │              │  │   PRIMARY    │  │   REPLICA    │
            │ • Cache      │  │   (Write)    │  │   (Read)     │
            │ • Cart       │  │              │  │              │
            │ • Locks      │  │ • Orders     │  │ • Products   │
            └──────────────┘  │ • Inventory  │  │ • Categories │
                              └──────────────┘  └──────────────┘
```

---

## Request/Response Cycle

```
┌─────────────────────────────────────────────────────────────┐
│                    REQUEST CYCLE                            │
└─────────────────────────────────────────────────────────────┘

1. User Action (Frontend)
   └─→ User clicks "Add to Cart"

2. React Component
   └─→ Calls CartContext.addToCart(productId, quantity)

3. Context API
   └─→ Calls cartApi.add(productId, quantity)

4. API Client (Axios)
   └─→ POST /api/cart/add
       Headers: { X-Session-ID: "session_xxx" }

5. NGINX
   └─→ Routes to Node.js server
       Rate limit check

6. Express Middleware
   ├─→ CORS check
   ├─→ JSON parsing
   ├─→ dbRouter → Detects POST → Primary DB
   └─→ sessionId → Extracts X-Session-ID

7. Route Handler
   └─→ /api/cart → cartRoutes → cartController.addToCart()

8. Controller Logic
   ├─→ Get product from DB (Primary)
   ├─→ Add to Redis cart: cart:{sessionId}
   └─→ Return success response

9. Response Path (Reverse)
   └─→ Controller → Route → Middleware → NGINX → Client

10. Frontend Update
    └─→ CartContext updates state
        └─→ UI re-renders with new cart count
```

---

## Database Replication Flow

```
┌─────────────────────────────────────────────────────────────┐
│              DATABASE REPLICATION ARCHITECTURE              │
└─────────────────────────────────────────────────────────────┘

                    ┌──────────────┐
                    │   PRIMARY    │
                    │  (Write DB)  │
                    │              │
                    │ • CREATE     │
                    │ • UPDATE     │
                    │ • DELETE     │
                    └──────┬───────┘
                           │
                           │ WAL (Write-Ahead Log)
                           │ Logical Replication
                           │ Streaming
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ↓                  ↓                  ↓
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   REPLICA 1  │  │   REPLICA 2  │  │   REPLICA 3  │
│   (Read)     │  │   (Read)     │  │  (Future)    │
│              │  │              │  │              │
│ • SELECT     │  │ • SELECT     │  │              │
│              │  │              │  │              │
│ Round-robin  │  │ Round-robin  │  │              │
│ load balance │  │ load balance │  │              │
└──────────────┘  └──────────────┘  └──────────────┘

Replication Lag: < 100ms (typical)
Sync Method: PostgreSQL Logical Replication (WAL)
```

---

## Cache Strategy Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    CACHE FLOW                                │
└─────────────────────────────────────────────────────────────┘

READ OPERATION:
┌─────────┐
│ Request │
└────┬────┘
     │
     ↓
┌─────────────────┐
│ Check Redis     │
│ Cache           │
└────┬────────────┘
     │
     ├─→ Cache Hit? ──→ Return cached data
     │
     └─→ Cache Miss? ──→ Query Database
                          └─→ Store in Redis (with TTL)
                              └─→ Return data

WRITE OPERATION:
┌─────────┐
│ Request │
└────┬────┘
     │
     ↓
┌─────────────────┐
│ Update Database │
│ (Primary)       │
└────┬────────────┘
     │
     ↓
┌─────────────────┐
│ Invalidate      │
│ Related Cache   │
│                 │
│ • Delete keys   │
│ • Pattern match │
└─────────────────┘
```

---

## Session & Cart Flow

```
┌─────────────────────────────────────────────────────────────┐
│              SESSION & CART MANAGEMENT                      │
└─────────────────────────────────────────────────────────────┘

1. First Visit
   ┌─────────┐
   │ Browser│
   └────┬───┘
        │
        ↓
   ┌─────────────────┐
   │ Generate        │
   │ Session ID      │
   │ session_xxx     │
   └────┬────────────┘
        │
        ↓
   ┌─────────────────┐
   │ Store in        │
   │ localStorage    │
   └─────────────────┘

2. Add to Cart
   ┌─────────┐
   │ Browser │
   └────┬───┘
        │
        ↓
   ┌─────────────────┐
   │ POST /api/cart  │
   │ X-Session-ID    │
   └────┬────────────┘
        │
        ↓
   ┌─────────────────┐
   │ Backend         │
   │ Extract Session │
   └────┬────────────┘
        │
        ↓
   ┌─────────────────┐
   │ Redis           │
   │ cart:{sessionId}│
   │ Hash:           │
   │ {productId: {   │
   │   quantity,     │
   │   price, ...    │
   │ }}              │
   │ TTL: 7 days     │
   └─────────────────┘

3. Checkout
   ┌─────────┐
   │ Browser │
   └────┬───┘
        │
        ↓
   ┌─────────────────┐
   │ POST /checkout  │
   │ X-Session-ID    │
   └────┬────────────┘
        │
        ↓
   ┌─────────────────┐
   │ Get Cart        │
   │ from Redis      │
   └────┬────────────┘
        │
        ↓
   ┌─────────────────┐
   │ Create Order    │
   │ (Database)      │
   └────┬────────────┘
        │
        ↓
   ┌─────────────────┐
   │ Clear Cart      │
   │ (Redis)         │
   └─────────────────┘
```


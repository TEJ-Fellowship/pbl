# E-commerce Order Processing System - Backend

## Overview

Tier-1 implementation of a distributed e-commerce order processing system with:

- PostgreSQL Primary/Replica setup (1 primary + 2 replicas)
- Redis caching layer
- NGINX load balancer ready
- Node.js/Express REST API

## Architecture

```
NGINX → Node.js/Express → Redis (Cache) → PostgreSQL (Primary + 2 Replicas)
```

## Prerequisites

- Node.js 18+
- PostgreSQL 12+ (3 instances)
- Redis 6+
- NGINX (optional, for load balancing)

## Installation

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Configure environment:**

   ```bash
   cp .env.example .env
   # Edit .env with your database and Redis credentials
   ```

3. **Set up databases:**

   - Apply `database/schema.sql` to PRIMARY database
   - Set up replication (see `database/replication-setup.md`)
   - Apply same schema to REPLICA databases

4. **Start Redis:**

   ```bash
   redis-server
   ```

5. **Start the server:**
   ```bash
   npm start
   ```

## API Endpoints

### Products

- `GET /api/products` - List products (with pagination, filters)
- `GET /api/products/:id` - Get product by ID
- `GET /api/products/category/:categorySlug` - Get products by category
- `GET /api/products/categories` - Get all categories

### Cart

- `GET /api/cart` - Get cart items
- `POST /api/cart/add` - Add item to cart
- `PUT /api/cart/update` - Update cart item quantity
- `DELETE /api/cart/remove/:productId` - Remove item from cart
- `DELETE /api/cart/clear` - Clear entire cart

### Orders

- `POST /api/orders/checkout` - Create order from cart
- `GET /api/orders/:id` - Get order by ID
- `GET /api/orders/my-orders` - Get user's orders (by session)
- `PUT /api/orders/:id/cancel` - Cancel order

### Health

- `GET /api/health` - Health check endpoint

## Database Architecture

### Primary Database (Writes)

- All write operations (CREATE, UPDATE, DELETE)
- Source of truth for all data

### Replica Databases (Reads)

- All read operations (SELECT)
- Automatically synced via PostgreSQL logical replication
- Round-robin load balancing

## Caching Strategy

### Redis Cache Keys

- `product:{id}` - Product details (TTL: 1 hour)
- `products:page:{page}:...` - Product listings (TTL: 30 minutes)
- `categories:all` - All categories (TTL: 1 hour)
- `cart:{sessionId}` - Shopping cart (TTL: 7 days)
- `inventory:{productId}` - Inventory levels (TTL: 5 minutes)
- `inventory_lock:{productId}` - Inventory locks (TTL: 10 minutes)

## Session Management

- Guest sessions (no authentication)
- Session ID in header: `X-Session-ID` or cookie: `session_id`
- Auto-generated UUID if not provided

## Order Flow

1. User adds items to cart (stored in Redis)
2. User proceeds to checkout
3. System reserves inventory (Redis atomic operation)
4. Order created in database (status: pending)
5. Payment processed (simulated)
6. If payment succeeds:
   - Order confirmed
   - Inventory decremented
   - Cart cleared
7. If payment fails:
   - Order cancelled
   - Inventory released
   - Cart preserved

## Load Balancing

See `../nginx/nginx.conf` for NGINX configuration.

To scale to multiple servers:

1. Start additional Node.js servers on different ports (3002, 3003)
2. Update NGINX upstream configuration
3. Reload NGINX

## Testing

See `../docs/testing-strategy.md` for comprehensive testing guide.

Quick test:

```bash
# Health check
curl http://localhost:3001/api/health

# Get products
curl http://localhost:3001/api/products

# Add to cart
curl -X POST http://localhost:3001/api/cart/add \
  -H "Content-Type: application/json" \
  -H "X-Session-ID: test-123" \
  -d '{"productId": "product-id-here", "quantity": 2}'
```

## Project Structure

```
backend/
├── controllers/       # Request handlers
│   ├── productController.js
│   ├── cartController.js
│   └── orderController.js
├── models/           # Sequelize models
│   ├── Product.js
│   ├── Category.js
│   ├── Inventory.js
│   ├── Order.js
│   ├── OrderItem.js
│   └── Payment.js
├── routes/           # Express routes
│   ├── productRoutes.js
│   ├── cartRoutes.js
│   ├── orderRoutes.js
│   └── index.js
├── middleware/       # Custom middleware
│   ├── dbRouter.js   # Read/write splitting
│   └── sessionId.js # Session management
├── utils/           # Utilities
│   ├── db.js        # Database connections
│   ├── redis.js     # Redis client & utilities
│   └── config.js    # Configuration
├── database/        # Database files
│   ├── schema.sql   # Database schema
│   └── replication-setup.md
├── index.js         # Main server file
└── package.json
```

## Environment Variables

See `.env.example` for all required environment variables.

## Monitoring

Key metrics to monitor:

- Database replication lag
- Redis cache hit rate
- API response times
- Error rates
- Order processing time

## Troubleshooting

### Database Connection Issues

- Verify database URLs in `.env`
- Check PostgreSQL is running
- Verify network connectivity

### Redis Connection Issues

- Verify Redis is running: `redis-cli ping`
- Check REDIS_HOST and REDIS_PORT in `.env`

### Replication Lag

- Check network latency
- Monitor PRIMARY write load
- See `database/replication-setup.md`

## Next Steps

1. Set up database replication (see `database/replication-setup.md`)
2. Configure NGINX load balancer (see `../nginx/nginx.conf`)
3. Run tests (see `../docs/testing-strategy.md`)
4. Monitor performance metrics

## References

- [PostgreSQL Logical Replication](https://www.postgresql.org/docs/current/logical-replication.html)
- [Redis Documentation](https://redis.io/docs/)
- [Sequelize Documentation](https://sequelize.org/docs/v6/)

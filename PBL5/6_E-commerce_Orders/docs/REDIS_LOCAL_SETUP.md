# Local Redis/Memurai Setup Guide

## Overview

This application has been configured to use **local Redis/Memurai** for caching instead of cloud-based Redis. This provides better performance and eliminates network latency for local development and production deployments.

## Configuration

### Redis Connection Settings

The application is configured to connect to:
- **Host**: `localhost` (127.0.0.1)
- **Port**: `6379` (default Redis port)
- **Password**: None (local Redis/Memurai doesn't require authentication)

These settings are defined in `backend/utils/config.js` and can be overridden via environment variables:
- `REDIS_HOST` (default: `localhost`)
- `REDIS_PORT` (default: `6379`)
- `REDIS_PASSWORD` (default: `undefined` - only set if using cloud Redis)

## Key Features Implemented

### 1. **Connection Management**
- **Automatic Reconnection**: Exponential backoff strategy (2s, 4s, 8s, max 10s)
- **Connection State Tracking**: Monitors connection status to prevent operations on disconnected clients
- **Graceful Degradation**: Application continues to work even if Redis is unavailable (without caching)

### 2. **Error Handling**
- All Redis operations are wrapped with try-catch blocks
- Errors are logged in development mode, silent in production
- Operations return safe defaults (null, false, empty objects) on failure

### 3. **Cache Patterns Implemented**

#### **Cache-Aside Pattern** (Product Data)
- **Product Details**: `product:{id}` - TTL: 1 hour
- **Product Lists**: `products:page:{n}:...` - TTL: 30 minutes
- **Categories**: `categories:all` - TTL: 1 hour

#### **Shopping Cart** (Hash Structure)
- **Cart Storage**: `cart:{sessionId}` - TTL: 7 days
- Uses Redis Hash for efficient item management
- Each cart item stored as JSON string

#### **Inventory Management** (Atomic Operations)
- **Inventory Cache**: `inventory:{productId}` - TTL: 5 minutes
- **Inventory Locks**: `inventory_lock:{productId}` - TTL: 10 minutes
- Uses Lua scripts for atomic reservation operations
- Prevents race conditions in concurrent order processing

### 4. **Connection Health Checks**

The application includes:
- Connection state monitoring (`isRedisReady()`)
- Startup verification with helpful error messages
- Automatic reconnection with retry limits (10 attempts)

## Memurai Configuration

Based on your Memurai config file, ensure these settings:

```conf
port 6379
maxmemory 2gb
maxmemory-policy allkeys-lru
save ""
appendonly no
```

This configuration:
- Uses port 6379 (default)
- Limits memory to 2GB
- Uses LRU eviction when memory is full
- Disables persistence (pure cache mode)

## Testing the Setup

### 1. Verify Memurai is Running

```powershell
# Check if Memurai service is running
Get-Service | Where-Object {$_.Name -like "*memurai*"}

# Check if port 6379 is listening
netstat -ano | findstr 6379
```

### 2. Test Redis Connection

```powershell
# Using Memurai CLI
"C:\Program Files\Memurai\memurai-cli.exe" -h 127.0.0.1 -p 6379

# Inside CLI:
> PING
> SET testkey "ok"
> GET testkey
```

### 3. Test Application

1. Start your Node.js application
2. Check console for Redis connection messages:
   - ✅ `Redis: Connected and ready (local Redis/Memurai)` - Success
   - ⚠️ `Redis is not connected` - Memurai not running

3. Make API requests and observe cache behavior:
   - First request: `fromCache: false` (cache miss)
   - Second request: `fromCache: true` (cache hit)

## Cache Invalidation

### Automatic Invalidation
- **TTL-based**: All cached data expires automatically based on TTL
- **Product cache**: 1 hour (stable data)
- **Product lists**: 30 minutes (may change frequently)
- **Inventory**: 5 minutes (real-time critical)

### Manual Invalidation
When products are updated, use:
```javascript
const { deleteCache, deleteCachePattern } = require('./utils/redis');

// Delete specific product cache
await deleteCache(`product:${productId}`);

// Delete all product list caches
await deleteCachePattern('products:page:*');
```

## Performance Benefits

### Before (Cloud Redis)
- Network latency: 50-200ms per operation
- Connection overhead
- Potential network failures
- Higher costs

### After (Local Redis)
- Sub-millisecond latency (< 1ms)
- No network overhead
- More reliable (local connection)
- No additional costs

## Troubleshooting

### Redis Not Connecting

1. **Check Memurai Service**:
   ```powershell
   Get-Service | Where-Object {$_.Name -like "*memurai*"}
   ```

2. **Check Port**:
   ```powershell
   netstat -ano | findstr 6379
   ```

3. **Check Firewall**: Ensure port 6379 is not blocked

4. **Check Logs**: Look for connection error messages in application console

### Cache Not Working

1. **Verify Connection**: Check startup logs for Redis connection status
2. **Check TTL**: Verify cache keys have appropriate TTLs
3. **Monitor Memory**: Use `INFO memory` in Redis CLI to check memory usage
4. **Check Eviction**: If memory is full, LRU eviction may remove keys

## Production Considerations

1. **Memurai Edition**: Use Enterprise edition for production (no restart restrictions)
2. **Memory Monitoring**: Monitor Redis memory usage and adjust `maxmemory` if needed
3. **Connection Pooling**: Already implemented via Redis client library
4. **Error Handling**: Application gracefully handles Redis failures
5. **Monitoring**: Consider adding Redis metrics to your monitoring system

## Code Structure

### Main Files
- `backend/utils/redis.js` - Redis client and utility functions
- `backend/utils/config.js` - Configuration (host, port, password)
- `backend/index.js` - Connection verification on startup

### Key Functions
- `isRedisReady()` - Check connection status
- `getCache(key)` - Get cached value
- `setCache(key, value, ttl)` - Set cached value with TTL
- `getCart(sessionId)` - Get shopping cart
- `reserveInventory(productId, quantity, orderId)` - Atomic inventory reservation

## Summary

✅ **Local Redis configured** - No password, localhost:6379
✅ **Connection management** - Auto-reconnect with exponential backoff
✅ **Error handling** - Graceful degradation if Redis unavailable
✅ **Cache patterns** - Cache-aside for products, hash for carts, atomic for inventory
✅ **Health checks** - Connection verification and status monitoring
✅ **Production ready** - Handles failures gracefully, optimized for performance


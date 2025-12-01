# Redis Configuration Recommendations

## Memory Management

To prevent Redis from running out of memory, configure the following in your `redis.conf` or via environment variables:

```conf
# Set max memory (adjust based on your server)
maxmemory 2gb

# Use allkeys-lru eviction policy
# This evicts least recently used keys when memory is full
maxmemory-policy allkeys-lru
```

## Alternative Eviction Policies

- `allkeys-lru`: Evict least recently used keys (recommended for cache)
- `volatile-lru`: Evict least recently used keys with TTL
- `allkeys-random`: Evict random keys
- `noeviction`: Don't evict (will cause errors when full)

## Monitoring

Monitor Redis memory usage:

```bash
redis-cli INFO memory
```

Key metrics to watch:

- `used_memory`: Current memory usage
- `used_memory_peak`: Peak memory usage
- `maxmemory`: Maximum memory limit
- `evicted_keys`: Number of keys evicted

## Docker Configuration

If using Docker, set memory limits:

```yaml
services:
  redis:
    image: redis:latest
    command: redis-server --maxmemory 2gb --maxmemory-policy allkeys-lru
```

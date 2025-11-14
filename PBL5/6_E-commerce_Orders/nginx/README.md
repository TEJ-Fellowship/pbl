# NGINX Load Balancer Setup

## Overview

This NGINX configuration provides load balancing for the E-commerce Order Processing System, supporting scaling from 1 to 3 Node.js backend servers.

## Installation

### Ubuntu/Debian
```bash
sudo apt update
sudo apt install nginx
```

### CentOS/RHEL
```bash
sudo yum install nginx
# or
sudo dnf install nginx
```

### macOS
```bash
brew install nginx
```

## Configuration

1. **Copy configuration file:**
   ```bash
   sudo cp nginx.conf /etc/nginx/sites-available/ecommerce
   sudo ln -s /etc/nginx/sites-available/ecommerce /etc/nginx/sites-enabled/
   ```

   Or for CentOS/RHEL:
   ```bash
   sudo cp nginx.conf /etc/nginx/conf.d/ecommerce.conf
   ```

2. **Test configuration:**
   ```bash
   sudo nginx -t
   ```

3. **Reload NGINX:**
   ```bash
   sudo systemctl reload nginx
   # or
   sudo service nginx reload
   ```

## Scaling to Multiple Servers

### Current Setup (1 Server)
```nginx
upstream backend_servers {
    server localhost:3001 max_fails=3 fail_timeout=30s;
}
```

### Scaling to 2 Servers
```nginx
upstream backend_servers {
    server localhost:3001 max_fails=3 fail_timeout=30s;
    server localhost:3002 max_fails=3 fail_timeout=30s;
}
```

### Scaling to 3 Servers
```nginx
upstream backend_servers {
    server localhost:3001 max_fails=3 fail_timeout=30s;
    server localhost:3002 max_fails=3 fail_timeout=30s;
    server localhost:3003 max_fails=3 fail_timeout=30s;
}
```

**Important:** Update your Node.js servers to run on different ports:
- Server 1: `PORT=3001`
- Server 2: `PORT=3002`
- Server 3: `PORT=3003`

## Load Balancing Methods

### Round-Robin (Default)
```nginx
upstream backend_servers {
    server localhost:3001;
    server localhost:3002;
    server localhost:3003;
}
```

### Least Connections
```nginx
upstream backend_servers {
    least_conn;
    server localhost:3001;
    server localhost:3002;
    server localhost:3003;
}
```

### IP Hash (Session Persistence)
```nginx
upstream backend_servers {
    ip_hash;
    server localhost:3001;
    server localhost:3002;
    server localhost:3003;
}
```

## Rate Limiting

The configuration includes rate limiting:
- **API endpoints**: 100 requests/minute per IP
- **Checkout endpoint**: 10 requests/minute per IP (stricter)

To adjust limits, modify the `limit_req_zone` directives.

## Health Checks

NGINX automatically removes unhealthy servers from the pool:
- `max_fails=3`: Remove after 3 failed requests
- `fail_timeout=30s`: Retry after 30 seconds

## Monitoring

### Check NGINX Status
```bash
sudo systemctl status nginx
```

### View Access Logs
```bash
sudo tail -f /var/log/nginx/ecommerce_access.log
```

### View Error Logs
```bash
sudo tail -f /var/log/nginx/ecommerce_error.log
```

### Check Active Connections
```bash
sudo netstat -an | grep :80 | wc -l
```

## Testing Load Balancing

1. **Start multiple Node.js servers:**
   ```bash
   # Terminal 1
   PORT=3001 npm start
   
   # Terminal 2
   PORT=3002 npm start
   
   # Terminal 3
   PORT=3003 npm start
   ```

2. **Test with curl:**
   ```bash
   for i in {1..10}; do
     curl http://localhost/api/health
     echo ""
   done
   ```

3. **Check which server handled each request** (add logging to your Node.js app)

## SSL/HTTPS Setup (Production)

1. **Obtain SSL certificate** (Let's Encrypt recommended):
   ```bash
   sudo certbot --nginx -d your-domain.com
   ```

2. **Uncomment SSL configuration** in `nginx.conf`

3. **Redirect HTTP to HTTPS:**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       return 301 https://$server_name$request_uri;
   }
   ```

## Performance Tuning

### Worker Processes
```nginx
worker_processes auto;  # Use all CPU cores
```

### Connection Limits
```nginx
events {
    worker_connections 1024;
    use epoll;  # Linux only
}
```

### Caching (Optional)
```nginx
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=1g;
proxy_cache api_cache;
proxy_cache_valid 200 10m;
```

## Troubleshooting

### NGINX won't start
```bash
sudo nginx -t  # Check for syntax errors
```

### 502 Bad Gateway
- Check if Node.js servers are running
- Check firewall rules
- Verify port numbers match

### High latency
- Check `proxy_read_timeout` settings
- Monitor backend server performance
- Consider increasing `worker_connections`

## References

- [NGINX Load Balancing](https://nginx.org/en/docs/http/load_balancing.html)
- [NGINX Rate Limiting](https://nginx.org/en/docs/http/ngx_http_limit_req_module.html)


# API Reference

Complete API documentation for the E-commerce Order Processing System.

## 📚 API Documentation

- **[Products API](./products.md)** - Product catalog endpoints
- **[Cart API](./cart.md)** - Shopping cart endpoints
- **[Orders API](./orders.md)** - Order processing endpoints
- **[Authentication API](./authentication.md)** - Authentication endpoints (future)
- **[Error Codes](./errors.md)** - Error codes and handling

## 🚀 Quick Start

### Base URL
```
Development: http://localhost:3000/api
Production: https://api.yourdomain.com/api
```

### Authentication
Currently using session-based authentication via `X-Session-ID` header:
```http
X-Session-ID: session_1234567890_abcdef
```

### Response Format
All responses follow this structure:
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}
```

## 📖 Endpoint Categories

### Products
- `GET /api/products` - List products with pagination
- `GET /api/products/:id` - Get product details
- `GET /api/products/category/:slug` - Get products by category
- `GET /api/products/categories` - List all categories

### Cart
- `GET /api/cart` - Get current cart
- `POST /api/cart/add` - Add item to cart
- `PUT /api/cart/update` - Update cart item quantity
- `DELETE /api/cart/remove/:productId` - Remove item from cart
- `DELETE /api/cart/clear` - Clear entire cart

### Orders
- `POST /api/orders/checkout` - Create order from cart
- `GET /api/orders/:id` - Get order details
- `GET /api/orders/my-orders` - Get user's orders
- `PUT /api/orders/:id/cancel` - Cancel order

## 📖 Related Documentation

- [Getting Started](../01-getting-started/) - Setup guide
- [Architecture](../02-architecture/) - System architecture
- [Development](../05-development/) - Development guidelines


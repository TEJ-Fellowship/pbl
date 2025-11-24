# Project Overview

## E-commerce Order Processing System

A full-stack, horizontally scalable e-commerce order processing system designed to handle 1,000+ daily users with the capability to scale to 1M+ users.

## 🎯 Project Goals

- **Scalability:** Handle growing user base from 1K to 1M+ users
- **Performance:** Fast response times with caching and database optimization
- **Reliability:** High availability with database replication and load balancing
- **Maintainability:** Clean architecture and comprehensive documentation

## ✨ Key Features

### Product Management
- Product catalog with categories
- Product search and filtering
- Product detail pages
- Inventory management

### Shopping Cart
- Session-based cart (guest sessions)
- Add/remove/update items
- Cart persistence (7 days)
- Real-time cart updates

### Order Processing
- Order creation from cart
- Inventory reservation (prevents overselling)
- Payment processing (simulated)
- Order tracking and history
- Order cancellation

### Technical Features
- Database replication (Primary + 2 Replicas)
- Redis caching layer
- NGINX load balancing
- Intelligent read/write splitting
- Horizontal scaling ready

## 🏗️ Architecture

### Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Vite, TailwindCSS |
| **Backend** | Node.js, Express.js |
| **Database** | PostgreSQL (Primary + 2 Replicas) |
| **Cache** | Redis |
| **Load Balancer** | NGINX |
| **ORM** | Sequelize |

### Architecture Pattern
- **Layered MVC Architecture** with clear separation of concerns
- **Primary-Replica Database Pattern** for read scaling
- **Cache-Aside Pattern** for performance
- **Session-based Authentication** (guest sessions)

## 📊 System Capacity

### Current (Tier 1)
- **Users:** 1,000 daily users
- **Servers:** 1-3 Node.js servers
- **Database:** 1 Primary + 2 Read Replicas
- **Cache:** Redis for caching and cart storage

### Future Scaling
- Tier 2: 10K users (add message queue)
- Tier 3: 30K users (microservices)
- Tier 4-6: 50K-1M users (advanced scaling)

## 🚀 Quick Start

1. **Setup:** Follow [Quick Start Guide](./quick-start.md)
2. **Installation:** See [Installation Guide](./installation.md)
3. **Development:** Check [Development Setup](./development-setup.md)

## 📖 Documentation

- [Architecture Overview](../02-architecture/overview.md) - System architecture
- [API Reference](../03-api-reference/) - API documentation
- [System Design](../07-system-design/) - Scalability planning

## 🎓 Learning Resources

- [Getting Started Guide](./quick-start.md)
- [Architecture Documentation](../02-architecture/)
- [Development Guides](../05-development/)

---

**Next Steps:**
1. Read [Quick Start Guide](./quick-start.md) to get started
2. Review [Architecture Overview](../02-architecture/overview.md) to understand the system
3. Check [API Reference](../03-api-reference/) to learn about endpoints


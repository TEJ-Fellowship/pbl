# Architecture Documentation

This section contains comprehensive architecture documentation for the E-commerce Order Processing System.

## 📚 Documentation in this Section

- **[Overview](./overview.md)** - High-level system architecture and design
- **[Diagrams](./diagrams.md)** - Visual architecture diagrams and flows
- **[ARCHITECTURE_ANALYSIS.md](./ARCHITECTURE_ANALYSIS.md)** - Complete architecture analysis (all 4 sections)
- **[Legacy Architecture Summary](./legacy-architecture-summary.md)** - Original architecture summary (for reference)

## 🎯 Quick Navigation

### Understanding the System
1. Start with [Overview](./overview.md) for high-level architecture
2. Review [Diagrams](./diagrams.md) for visual understanding
3. Deep dive into [ARCHITECTURE_ANALYSIS.md](./ARCHITECTURE_ANALYSIS.md) for complete analysis

### Key Topics
- **System Layers:** Frontend, Backend, Database, Infrastructure
- **Data Flow:** Request/response patterns, read/write operations
- **Database Design:** Primary-replica pattern, replication
- **Caching Strategy:** Redis patterns and TTL management
- **Scalability:** Horizontal scaling, load balancing

## 📖 Related Documentation

- [Getting Started](../01-getting-started/) - Setup and installation
- [System Design](../07-system-design/) - Scalability planning
- [Deployment](../04-deployment/) - Deployment architecture
- [API Reference](../03-api-reference/) - API design

## 🏗️ Architecture Highlights

- **Layered MVC Architecture** with clear separation of concerns
- **Primary-Replica Database Pattern** (1 write + 2 read replicas)
- **Redis Caching Layer** for performance optimization
- **Intelligent Read/Write Splitting** via middleware
- **Horizontal Scaling** ready (1-3 Node.js servers)


# E-Commerce Order Processing System - System Design Documentation

## Overview

This directory contains comprehensive system design documentation for scaling an e-commerce order processing system from 1,000 to 1 million daily users.

## Document Structure

- **[1K-Users.md](./1K-Users.md)** - System design for 1,000 daily users (Startup Phase)
- **[10K-Users.md](./10K-Users.md)** - Scaling strategy for 10,000 daily users
- **[30K-Users.md](./30K-Users.md)** - Scaling strategy for 30,000 daily users
- **[50K-Users.md](./50K-Users.md)** - Scaling strategy for 50,000 daily users
- **[70K-Users.md](./70K-Users.md)** - Scaling strategy for 70,000 daily users
- **[1M-Users.md](./1M-Users.md)** - Scaling strategy for 1,000,000 daily users
- **[scalability-roadmap.md](./scalability-roadmap.md)** - Complete roadmap and migration guide
- **[research-resources.md](./research-resources.md)** - External research, best practices, and YouTube tutorials

## Current System Architecture

### Existing Components:
- **Load Balancer**: Nginx (between client and Node/Express servers)
- **Application Servers**: 2 Node.js/Express servers
- **Databases**: 
  - 3 PostgreSQL databases (product details and other data)
  - 1 MongoDB (order history)
- **Cache**: Redis (between Node/Express servers and databases)
- **Message Queue**: Kafka (for payments, orders, and events)

### Current Limitations:
- Only 3 PostgreSQL connections per computer (planning for 6 total)
- Need to evaluate if current setup is sufficient for 1K users
- Requires clear scaling path to 1M users

## Quick Navigation

1. Start with [1K-Users.md](./1K-Users.md) to understand the baseline architecture
2. Review [scalability-roadmap.md](./scalability-roadmap.md) for the complete migration path
3. Reference [research-resources.md](./research-resources.md) for learning materials
4. Follow the tier-specific documents as you scale


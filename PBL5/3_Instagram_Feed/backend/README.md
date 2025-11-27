# Instagram-Style Feed Backend API

A high-performance social media feed backend implementing a **fan-out on write** architecture with Redis caching for optimal performance.

## 📋 Table of Contents

- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Database Architecture](#database-architecture)
- [Services Layer](#services-layer)
- [API Endpoints](#api-endpoints)
- [How It Works](#how-it-works)
- [Setup Instructions](#setup-instructions)
- [Redis Caching Strategy](#redis-caching-strategy)
- [Testing Guide](#testing-guide)
- [Performance Considerations](#performance-considerations)

---

## 🏗️ Architecture Overview

This backend implements a **fan-out on write** architecture, which means when a user creates a post, it's immediately written to all their followers' feeds. This ensures fast feed loading since feeds are pre-computed.

### Architecture Diagram

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│  Express API    │
│  (Controllers)  │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│  Services Layer │
│  (Business Logic)│
└──────┬──────────┘
       │
       ├──────────────┬──────────────┐
       ▼              ▼              ▼
┌──────────┐   ┌──────────┐   ┌──────────┐
│PostgreSQL│   │Cassandra │   │  Redis   │
│ (Users,  │   │  (Posts, │   │  (Cache) │
│ Follows) │   │  Feeds)  │   │          │
└──────────┘   └──────────┘   └──────────┘
```

### Data Flow

1. **Post Creation Flow:**

   ```
   User creates post
   → Save to Cassandra (posts, posts_by_user)
   → Fan-out: Write to all followers' feeds
      ├─ Cassandra (feeds_by_user) - Source of truth
      └─ Redis (feed:user:{id}) - Cache layer
   ```

2. **Feed Loading Flow:**
   ```
   User requests feed
   → Check Redis cache first
   ├─ Cache Hit: Return immediately (~0.1ms)
   └─ Cache Miss: Query Cassandra (~10ms)
      └─ Warm up Redis cache (async)
   ```

---

## 🛠️ Tech Stack

- **Runtime:** Node.js (ES Modules)
- **Framework:** Express.js 5.x
- **Databases:**
  - **PostgreSQL** (via Sequelize) - User data, follow relationships
  - **Cassandra/AstraDB** - Post storage, feed data (scalable, distributed)
  - **Redis** - Caching layer for feeds and counts
- **ORM:** Sequelize (PostgreSQL only)
- **Key Dependencies:**
  - `express` - Web framework
  - `sequelize` - PostgreSQL ORM
  - `cassandra-driver` - Cassandra client
  - `redis` - Redis client
  - `dotenv` - Environment variables

---

## 📁 Project Structure

```
backend/
├── config/
│   ├── db.js                 # Database connections (PostgreSQL, Cassandra, Redis)
│   └── cassandra-schema.js   # Cassandra table definitions and initialization
├── controllers/
│   ├── postController.js     # HTTP handlers for post operations
│   └── userController.js     # HTTP handlers for user operations
├── models/
│   ├── User.js               # Sequelize User model (PostgreSQL)
│   ├── Follow.js             # Sequelize Follow model (PostgreSQL)
│   └── index.js              # Model associations
├── routes/
│   ├── postRoutes.js         # Post API routes
│   └── userRoutes.js         # User API routes
├── services/
│   ├── postService.js        # Cassandra post operations
│   ├── feedService.js        # Feed management + Redis caching
│   └── userCacheService.js   # Redis caching for user counts
├── server.js                 # Express app entry point
├── package.json
└── README.md                 # This file
```

### Directory Responsibilities

- **`config/`** - Database configuration and connection management
- **`controllers/`** - HTTP request/response handling, validation
- **`models/`** - Sequelize models for PostgreSQL tables
- **`routes/`** - API route definitions
- **`services/`** - Business logic, database operations (reusable)

---

## 🗄️ Database Architecture

### PostgreSQL (User & Relationships)

**Tables:**

1. **`users`**

   - `id` (INT, PK)
   - `username`, `email`, `bio`, `avatar_url`
   - `followers_count`, `following_count` (denormalized)
   - `is_celebrity` (BOOLEAN)

2. **`follows`**
   - `id` (INT, PK)
   - `follower_id` (INT, FK → users.id)
   - `following_id` (INT, FK → users.id)
   - `created_at` (TIMESTAMP)
   - Unique constraint: `(follower_id, following_id)`

### Cassandra (Posts & Feeds)

**Keyspace:** `memogram` (configurable via `CASSANDRA_KEYSPACE`)

**Tables:**

1. **`posts`**

   - Primary Key: `id` (UUID)
   - Stores: `user_id`, `caption`, `image_url`, `likes_count`, `comments_count`, `created_at`
   - **Purpose:** Direct post lookups by post ID

2. **`posts_by_user`**

   - Primary Key: `(user_id, created_at, id)`
   - Clustering: `created_at DESC`
   - **Purpose:** Efficiently query all posts by a specific user, sorted by time

3. **`feeds_by_user`**
   - Primary Key: `(user_id, created_at, post_id)`
   - Clustering: `created_at DESC`
   - **Purpose:** Personalized feeds for each user (fan-out storage)
   - **Note:** When User A posts, this post_id is written to all of User A's followers' feeds

### Redis (Cache Layer)

**Data Structures:**

1. **Sorted Sets (ZSET)** - Feed caching

   - Key: `feed:user:{user_id}`
   - Score: Timestamp (milliseconds)
   - Value: `post_id` (UUID string)
   - Max Size: 100 posts per user (auto-trimmed)
   - TTL: 7 days

2. **Strings** - Count caching
   - Key: `user:{user_id}:followers_count`
   - Key: `user:{user_id}:following_count`
   - Value: Count as string
   - TTL: 1 hour

---

## 🔧 Services Layer

### 1. `postService.js` - Post Operations (Cassandra)

**Purpose:** All Cassandra operations for posts (reusable, testable)

**Functions:**

- `createPost(postData)` - Create post in `posts` and `posts_by_user` tables
- `getPostById(postId)` - Get single post by UUID
- `getPostsByUser(userId)` - Get all posts by a user
- `getPostsByIds(postIds)` - Batch fetch multiple posts (for feeds)
- `getAllPosts(limit)` - Get all posts (limited)

**Why separate service?**

- Reusable across controllers, background jobs, other services
- Testable without HTTP layer
- Clean separation of concerns

### 2. `feedService.js` - Feed Management + Redis Caching

**Purpose:** Feed operations with hybrid Redis/Cassandra strategy

**Key Functions:**

- **Fan-out Operations:**

  - `fanOutToFollowers(userId, postId, createdAt)` - Write post to all followers' feeds (both Cassandra & Redis)
  - `addPostToFeed(userId, postId, createdAt)` - Add to Cassandra feed
  - `addPostToFeedRedis(userId, postId, createdAt)` - Add to Redis cache

- **Feed Retrieval:**

  - `getFeed(userId, limit)` - **Hybrid:** Redis first, fallback to Cassandra
  - `getFeedFromRedis(userId, limit)` - Get from Redis cache
  - `getFeedFromCassandra(userId, limit)` - Get from Cassandra
  - `warmUpCache(userId, feedItems)` - Populate Redis from Cassandra

- **Cache Management:**
  - `invalidateFeedCache(userId)` - Clear feed cache (on unfollow)

**Cache Strategy:**

```
Read Path:
1. Check Redis → Cache hit? Return (0.1ms)
2. Cache miss? → Query Cassandra (10ms)
3. Warm up Redis cache (async, non-blocking)

Write Path:
1. Write to Cassandra (source of truth)
2. Write to Redis (cache) - parallel execution
```

### 3. `userCacheService.js` - User Count Caching

**Purpose:** Cache follower/following counts in Redis

**Functions:**

- `getFollowersCount(userId)` - Get from cache or database
- `getFollowingCount(userId)` - Get from cache or database
- `incrementFollowersCount(userId)` - Increment in Redis
- `decrementFollowersCount(userId)` - Decrement in Redis
- `incrementFollowingCount(userId)` - Increment in Redis
- `decrementFollowingCount(userId)` - Decrement in Redis
- `invalidateCountCache(userId)` - Clear count cache

**Cache Strategy:**

- TTL: 1 hour
- Auto-refresh on access
- Write-through: Updates both Redis and PostgreSQL

---

## 🌐 API Endpoints

### User Endpoints

**Base URL:** `/api/users`

| Method | Endpoint        | Description     | Body                                   |
| ------ | --------------- | --------------- | -------------------------------------- |
| `POST` | `/`             | Create new user | `{username, email, bio?, avatar_url?}` |
| `GET`  | `/`             | Get all users   | -                                      |
| `GET`  | `/:id`          | Get user by ID  | -                                      |
| `POST` | `/:id/follow`   | Follow a user   | `{follower_id}`                        |
| `POST` | `/:id/unfollow` | Unfollow a user | `{follower_id}`                        |

**Example - Follow User:**

```bash
POST /api/users/2/follow
Body: { "follower_id": 1 }
```

### Post Endpoints

**Base URL:** `/api/posts`

| Method | Endpoint         | Description       | Body                                          | Query       |
| ------ | ---------------- | ----------------- | --------------------------------------------- | ----------- |
| `POST` | `/`              | Create new post   | `{user_id, caption?, image_url, created_at?}` | -           |
| `GET`  | `/`              | Get all posts     | -                                             | `?limit=50` |
| `GET`  | `/:id`           | Get post by ID    | -                                             | -           |
| `GET`  | `/user/:user_id` | Get posts by user | -                                             | -           |
| `GET`  | `/feed/:user_id` | Get user's feed   | -                                             | `?limit=20` |

**Example - Create Post:**

```bash
POST /api/posts
Body: {
  "user_id": 1,
  "caption": "My first post!",
  "image_url": "https://example.com/image.jpg"
}
```

**Example - Get Feed:**

```bash
GET /api/posts/feed/1?limit=20
```

### Helper Endpoints

| Method | Endpoint                           | Description               |
| ------ | ---------------------------------- | ------------------------- |
| `GET`  | `/api/cassandra/tables`            | List all Cassandra tables |
| `GET`  | `/api/cassandra/tables/:tableName` | View table data           |
| `GET`  | `/api/redis/test`                  | Test Redis connection     |

---

## 🔄 How It Works

### Post Creation Flow

```javascript
1. User creates post via POST /api/posts
   ↓
2. postController.createPost()
   ↓
3. postService.createPost()
   ├─ Insert into Cassandra: posts table
   └─ Insert into Cassandra: posts_by_user table
   ↓
4. feedService.fanOutToFollowers()
   ├─ Query PostgreSQL: Get all followers
   ├─ Write to Cassandra: feeds_by_user (all followers)
   └─ Write to Redis: feed:user:{follower_id} (all followers)
   ↓
5. Return success response
```

**Console Output:**

```
📤 Fan-out: Adding post abc-123 to 5 followers' feeds
✅ Post abc-123 added to 5 followers' feeds
```

### Feed Loading Flow

```javascript
1. User requests feed via GET /api/posts/feed/:user_id
   ↓
2. postController.getUserFeed()
   ↓
3. feedService.getFeed()
   ├─ Try Redis: getFeedFromRedis()
   │  ├─ Cache Hit: Return posts (✅ [CACHE HIT])
   │  └─ Cache Miss: Continue
   ↓
4. feedService.getFeedFromCassandra()
   ├─ Query Cassandra: feeds_by_user table
   └─ Return posts (❌ [CACHE MISS])
   ↓
5. feedService.warmUpCache() (async, non-blocking)
   └─ Populate Redis for next request
   ↓
6. postService.getPostsByIds()
   └─ Batch fetch full post details from Cassandra
   ↓
7. Return feed with full post details
```

**Console Output:**

```
✅ [CACHE HIT] Feed cache for user 1 - 20 posts found
✅ [CACHE HIT] User 1 feed - returning 20 posts from Redis
```

OR

```
❌ [CACHE MISS] User 2 feed - fetching from Cassandra
📥 [CACHE WARM] Feed cached for user 2
```

### Follow/Unfollow Flow

```javascript
1. User follows via POST /api/users/:id/follow
   ↓
2. userController.followUser()
   ├─ Create Follow record in PostgreSQL
   ├─ Increment counts in PostgreSQL
   ├─ Increment counts in Redis (userCacheService)
   └─ Invalidate follower's feed cache
   ↓
3. Next feed load will include new followee's posts
```

**Cache Invalidation:**

- On follow: Feed cache invalidated (user will see new posts on next load)
- On unfollow: Feed cache invalidated (removes unfollowed user's posts)

---

## 🚀 Setup Instructions

### Prerequisites

- Node.js 18+ (ES Modules support)
- PostgreSQL 12+
- Redis 6+
- Cassandra/AstraDB account

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Server
PORT=3000

# PostgreSQL
DB_NAME=demo
DB_USER=postgres
DB_PASSWORD=0987
DB_HOST=localhost
DB_PORT=5432

# Cassandra/AstraDB
ASTRA_DB_USERNAME=your_username
ASTRA_CLIENT_SECRET=your_secret
ASTRA_SECURE_CONNECT_BUNDLE=./path/to/secure-connect-bundle.zip
CASSANDRA_KEYSPACE=memogram

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=  # Optional, leave empty if no password
```

### 3. Database Setup

**PostgreSQL:**

- Create database: `CREATE DATABASE demo;`
- Tables are auto-created by Sequelize on first run

**Cassandra/AstraDB:**

- Tables are auto-created on first run via `cassandra-schema.js`
- Ensure you have the secure connect bundle downloaded

**Redis:**

- Start Redis server: `redis-server`
- Or use Docker: `docker run -d -p 6379:6379 redis:latest`

### 4. Start Server

```bash
npm start
# or for development with auto-reload:
npm run dev
```

**Expected Console Output:**

```
✅ Connected to PostgreSQL successfully.
✅ Connected to Cassandra/AstraDB successfully.
✅ Keyspace 'memogram' created or already exists.
✅ Table 'posts' created or already exists.
✅ Table 'posts_by_user' created or already exists.
✅ Table 'feeds_by_user' created or already exists.
✅ Connected to Redis successfully.
📊 Redis PING response: PONG
Server running on http://localhost:3000
```

---

## 💾 Redis Caching Strategy

### Feed Caching (Sorted Sets)

**Key Pattern:** `feed:user:{user_id}`

**Structure:**

- Type: Sorted Set (ZSET)
- Score: Timestamp (milliseconds)
- Value: `post_id` (UUID string)
- Max Size: 100 posts (auto-trimmed)
- TTL: 7 days (refreshed on access)

**Operations:**

- `ZADD` - Add post to feed
- `ZREVRANGE` - Get top N posts (most recent)
- `ZREMRANGEBYRANK` - Trim to 100 posts
- `EXPIRE` - Set TTL

**Memory Usage:**

- Per user: ~5 KB (100 posts)
- 10K active users: ~50 MB
- 100K users: ~500 MB

### Count Caching (Strings)

**Key Patterns:**

- `user:{user_id}:followers_count`
- `user:{user_id}:following_count`

**Structure:**

- Type: String
- Value: Count as string
- TTL: 1 hour

**Operations:**

- `GET` - Read count
- `SETEX` - Set with TTL
- `INCR` - Increment
- `DECR` - Decrement

### Cache Invalidation

**Automatic:**

- TTL expiration (7 days for feeds, 1 hour for counts)
- On follow/unfollow: Feed cache invalidated

**Manual:**

- `invalidateFeedCache(userId)` - Clear feed cache
- `invalidateCountCache(userId)` - Clear count cache

### Cache Hit Logging

All cache operations log to console:

- `✅ [CACHE HIT]` - Cache hit
- `❌ [CACHE MISS]` - Cache miss
- `📥 [CACHE WARM]` - Cache populated

---

## 🧪 Testing Guide

### 1. Test User Creation

```bash
POST http://localhost:3000/api/users
Body: {
  "username": "alice",
  "email": "alice@example.com",
  "bio": "Hello world!"
}
```

### 2. Test Follow Relationship

```bash
# User 1 follows User 2
POST http://localhost:3000/api/users/2/follow
Body: { "follower_id": 1 }
```

### 3. Test Post Creation

```bash
POST http://localhost:3000/api/posts
Body: {
  "user_id": 1,
  "caption": "My first post!",
  "image_url": "https://example.com/image.jpg"
}
```

**Check Console:**

```
📤 Fan-out: Adding post abc-123 to 1 followers' feeds
✅ Post abc-123 added to 1 followers' feeds
```

### 4. Test Feed Loading

```bash
# First request (cache miss)
GET http://localhost:3000/api/posts/feed/2

# Second request (cache hit)
GET http://localhost:3000/api/posts/feed/2
```

**Check Console:**

```
# First request
❌ [CACHE MISS] User 2 feed - fetching from Cassandra
📥 [CACHE WARM] Feed cached for user 2

# Second request
✅ [CACHE HIT] Feed cache for user 2 - 20 posts found
✅ [CACHE HIT] User 2 feed - returning 20 posts from Redis
```

### 5. Test Redis Connection

```bash
GET http://localhost:3000/api/redis/test
```

### 6. View Cassandra Tables

```bash
# List tables
GET http://localhost:3000/api/cassandra/tables

# View feed data
GET http://localhost:3000/api/cassandra/tables/feeds_by_user?limit=10
```

---

## ⚡ Performance Considerations

### Feed Loading Performance

**With Redis Cache:**

- Cache Hit: ~0.1ms (in-memory)
- Cache Miss: ~10ms (Cassandra query)

**Without Cache:**

- Direct Cassandra: ~10-50ms (depending on data size)

**Improvement:** ~100x faster with cache

### Fan-out Performance

**Current Implementation:**

- Synchronous fan-out (blocks until complete)
- Parallel writes to Cassandra and Redis
- For 10K followers: ~2-5 seconds

**Optimization Opportunities:**

- Async fan-out (don't block post creation)
- Batch processing (1000 followers at a time)
- Background workers (Kafka-based)

### Memory Management

**Redis Memory:**

- Feeds: Limited to 100 posts per user
- Auto-expiration: 7 days TTL
- Only active users cached

**Scaling:**

- 10K active users: ~50 MB
- 100K active users: ~500 MB
- 1M active users: ~5 GB (manageable with Redis Cluster)

### Database Load

**Read Operations:**

- Feed reads: Mostly from Redis (reduces Cassandra load)
- Count reads: Mostly from Redis (reduces PostgreSQL load)

**Write Operations:**

- Post creation: 2 Cassandra writes + N Redis writes (N = followers)
- Follow: 1 PostgreSQL write + 2 Redis writes

---

## 📝 Notes for Teammates

### Key Concepts

1. **Fan-out on Write:** Posts are written to followers' feeds immediately, not computed on read
2. **Hybrid Caching:** Redis for speed, Cassandra for persistence
3. **Service Layer:** Business logic separated from HTTP handling
4. **Cache-First Strategy:** Always check Redis before database

### Common Patterns

**Adding a new feature:**

1. Create service function (if database operation)
2. Create controller function (HTTP handling)
3. Add route
4. Update cache if needed

**Debugging:**

- Check console logs for cache hits/misses
- Use helper endpoints to view database data
- Redis commands: `redis-cli KEYS "feed:user:*"` to see cached feeds

### Important Files

- **`feedService.js`** - Feed logic + Redis caching
- **`postService.js`** - Post operations (Cassandra)
- **`userCacheService.js`** - Count caching
- **`cassandra-schema.js`** - Database schema definitions

---

## 🐛 Troubleshooting

### Redis Connection Failed

- Check if Redis server is running: `redis-cli ping`
- Verify `REDIS_HOST` and `REDIS_PORT` in `.env`

### Cassandra Connection Failed

- Verify AstraDB credentials in `.env`
- Check secure connect bundle path
- Ensure network access to AstraDB

### Feed Not Showing Posts

- Check if follow relationship exists: `GET /api/cassandra/tables/follows`
- Check feed table: `GET /api/cassandra/tables/feeds_by_user`
- Verify fan-out executed (check console logs)

### Cache Not Working

- Check Redis connection: `GET /api/redis/test`
- Verify cache keys: Use `redis-cli KEYS "*"`
- Check console for cache hit/miss logs

---

## 📚 Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [Cassandra Documentation](https://cassandra.apache.org/doc/latest/)
- [Redis Documentation](https://redis.io/docs/)
- [Sequelize Documentation](https://sequelize.org/)

---

**Last Updated:** 2025-01-26  
**Version:** 1.0.0

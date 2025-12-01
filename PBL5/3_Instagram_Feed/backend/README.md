# Instagram-Style Feed Backend API

A high-performance social media feed backend implementing a **fan-out on write** architecture with multi-tier Redis caching and LUA script optimizations for optimal performance.

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
   → Cache post in Redis (post:{post_id})
   → Fan-out: Write to all followers' feeds
      ├─ Cassandra (feeds_by_user) - Source of truth
      └─ Redis (feed:user:{id}) - Cache layer (batch pipelined)
   → Invalidate followers' response caches
   ```

2. **Feed Loading Flow (3-Tier Cache Strategy):**
   ```
   User requests feed
   → Tier 1: Check complete response cache (fastest - ~0.05ms)
   ├─ Cache Hit: Return immediately
   └─ Cache Miss: Continue
   → Tier 2: Get feed + posts via combined LUA script (~0.1ms)
   ├─ All cached: Return + cache response
   └─ Partial cache: Fetch missing posts
   → Tier 3: Fallback to Cassandra (~10ms)
      └─ Warm up all caches (async)
   ```

---

## 🛠️ Tech Stack

- **Runtime:** Node.js (ES Modules)
- **Framework:** Express.js 5.x
- **Databases:**
  - **PostgreSQL** (via Sequelize) - User data, follow relationships
  - **Cassandra/AstraDB** - Post storage, feed data (scalable, distributed)
  - **Redis** - Multi-tier caching layer (feeds, posts, responses, counts)
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
│   ├── postService.js        # Cassandra post operations + Redis post caching
│   ├── feedService.js        # Feed management + multi-tier Redis caching
│   ├── userCacheService.js   # Redis caching for user counts (atomic LUA scripts)
│   └── redisLuaScripts.js    # Atomic Redis operations via LUA scripts
├── script/
│   ├── followUser.js         # Scripts for testing/seed data
│   ├── seedUsers.js
│   └── setupLoadTest.js
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
- **`services/redisLuaScripts.js`** - Atomic Redis operations for optimal performance

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

### Redis (Multi-Tier Cache Layer)

**Data Structures:**

1. **Sorted Sets (ZSET)** - Feed ID caching

   - Key: `feed:user:{user_id}`
   - Score: Timestamp (milliseconds)
   - Value: `post_id` (UUID string)
   - Max Size: 100 posts per user (auto-trimmed via LUA script)
   - TTL: 7 days (refreshed on access via LUA script)

2. **Strings** - Post detail caching

   - Key: `post:{post_id}`
   - Value: JSON stringified post object
   - TTL: 1 hour
   - **Purpose:** Cache individual post details to avoid Cassandra lookups

3. **Strings** - Complete feed response caching (fastest path)

   - Key: `feed:user:{user_id}:response`
   - Value: JSON stringified array of complete post objects
   - TTL: 7 days (refreshed on access)
   - **Purpose:** Cache the entire feed response for instant retrieval

4. **Strings** - Count caching
   - Key: `user:{user_id}:followers_count`
   - Key: `user:{user_id}:following_count`
   - Value: Count as string
   - TTL: 1 hour (refreshed on access via LUA script)

---

## 🔧 Services Layer

### 1. `postService.js` - Post Operations (Cassandra + Redis)

**Purpose:** All Cassandra operations for posts with Redis caching

**Functions:**

- `createPost(postData)` - Create post in `posts` and `posts_by_user` tables, cache in Redis
- `getPostById(postId)` - Get single post (Redis cache-first, fallback to Cassandra)
- `getPostsByUser(userId)` - Get all posts by a user
- `getPostsByIds(postIds)` - Batch fetch multiple posts with Redis cache optimization
- `getAllPosts(limit)` - Get all posts (limited)

**Caching Strategy:**

- Posts are cached individually in Redis as `post:{post_id}`
- Cache-first lookup, fallback to Cassandra
- Auto-cache on fetch

### 2. `feedService.js` - Feed Management + Multi-Tier Redis Caching

**Purpose:** Feed operations with 3-tier caching strategy

**Key Functions:**

- **Fan-out Operations:**

  - `fanOutToFollowers(userId, postId, createdAt)` - Write post to all followers' feeds (Cassandra + Redis batch pipelined)
  - `addPostToFeed(userId, postId, createdAt)` - Add to Cassandra feed
  - `addPostToFeedRedis(userId, postId, createdAt)` - Add to Redis cache (via LUA script)

- **Feed Retrieval (3-Tier Strategy):**

  - `getFeedResponseFromCache(userId, limit)` - **Tier 1:** Get complete cached response (fastest)
  - `getFeedWithPostsFromRedis(userId, limit)` - **Tier 2:** Get feed + posts via combined LUA script
  - `getFeed(userId, limit)` - **Tier 3:** Hybrid Redis/Cassandra fallback
  - `getFeedFromRedis(userId, limit)` - Get feed IDs from Redis
  - `getFeedFromCassandra(userId, limit)` - Get feed IDs from Cassandra
  - `warmUpCache(userId, feedItems)` - Populate Redis from Cassandra

- **Follow/Unfollow Operations:**

  - `backfillFeedOnFollow(followerId, followingId)` - Add existing posts to new follower's feed
  - `removePostsFromFeedOnUnfollow(followerId, unfollowedId)` - Remove posts from feed on unfollow

- **Cache Management:**
  - `invalidateFeedCache(userId)` - Clear all feed-related caches (feed IDs, response cache)

**3-Tier Cache Strategy:**

```
Tier 1: Complete Response Cache (fastest - ~0.05ms)
  → feed:user:{id}:response (pre-serialized JSON)
  → Single Redis GET operation

Tier 2: Feed + Posts Combined (fast - ~0.1ms)
  → feed:user:{id} (sorted set) + post:{id} (individual posts)
  → Single LUA script execution (atomic)

Tier 3: Fallback (slower - ~10ms)
  → Query Cassandra
  → Warm up all caches asynchronously
```

### 3. `userCacheService.js` - User Count Caching

**Purpose:** Cache follower/following counts in Redis with atomic operations

**Functions:**

- `getFollowersCount(userId)` - Get from cache or database (atomic LUA script)
- `getFollowingCount(userId)` - Get from cache or database (atomic LUA script)
- `incrementFollowersCount(userId)` - Increment in Redis (atomic LUA script)
- `decrementFollowersCount(userId)` - Decrement in Redis (atomic LUA script)
- `incrementFollowingCount(userId)` - Increment in Redis (atomic LUA script)
- `decrementFollowingCount(userId)` - Decrement in Redis (atomic LUA script)
- `invalidateCountCache(userId)` - Clear count cache

**Cache Strategy:**

- TTL: 1 hour
- Auto-refresh on access (via LUA script)
- Write-through: Updates both Redis and PostgreSQL
- Atomic operations prevent race conditions

### 4. `redisLuaScripts.js` - Atomic Redis Operations

**Purpose:** Optimized Redis operations using LUA scripts for atomicity and reduced network round-trips

**Key Features:**

- **Atomic Operations:** All operations execute atomically on Redis server
- **Reduced Round-trips:** Combine multiple operations into single script execution
- **Performance:** Scripts are pre-loaded (SHA1 hashes) for faster execution

**Available Scripts:**

1. `getCountWithTTL` - Get count with automatic TTL refresh
2. `incrementCountWithTTL` - Increment count atomically with TTL refresh
3. `decrementCountWithTTL` - Decrement count with bounds checking (≥0) and TTL refresh
4. `addPostToFeedWithLua` - Add post to feed, trim to max size, set TTL (atomic)
5. `batchAddPostToFeeds` - Batch add post to multiple feeds using pipelining
6. `getFeedWithTTL` - Get feed with automatic TTL refresh
7. `removePostsFromFeedWithLua` - Remove multiple posts from feed atomically
8. `warmUpFeedCacheWithLua` - Batch populate feed cache atomically
9. `getFeedWithPosts` - Get feed IDs + post details in single atomic operation
10. `getCachedFeedResponse` - Get complete cached response with TTL refresh
11. `cacheFeedResponse` - Cache complete feed response
12. `cachePost` - Cache individual post
13. `getPostsFromCache` - Batch get multiple posts from cache
14. `batchCachePosts` - Batch cache multiple posts

**Benefits:**

- **Atomicity:** No race conditions
- **Performance:** Single network round-trip for complex operations
- **Consistency:** TTL refresh happens atomically with reads

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
   ├─ Insert into Cassandra: posts_by_user table
   └─ Cache post in Redis: post:{post_id}
   ↓
4. feedService.fanOutToFollowers()
   ├─ Query PostgreSQL: Get all followers
   ├─ Write to Cassandra: feeds_by_user (all followers) - parallel
   ├─ Write to Redis: feed:user:{follower_id} (all followers) - batch pipelined
   └─ Invalidate followers' response caches - parallel
   ↓
5. Return success response
```

**Console Output:**

```
📤 Fan-out: Adding post abc-123 to 5 followers' feeds
[PIPELINE] Batch add to 5 feeds: 2.34ms
✅ Post abc-123 added to 5 followers' feeds
```

### Feed Loading Flow (3-Tier Cache Strategy)

```javascript
1. User requests feed via GET /api/posts/feed/:user_id
   ↓
2. postController.getUserFeed()
   ↓
3. Tier 1: feedService.getFeedResponseFromCache()
   ├─ Cache Hit: Return immediately (✅ [CACHE HIT] Complete feed response)
   └─ Cache Miss: Continue
   ↓
4. Tier 2: feedService.getFeedWithPostsFromRedis()
   ├─ Execute combined LUA script: Get feed IDs + post details
   ├─ All cached: Return + cache response (✅ [CACHE HIT] Feed + Posts)
   └─ Partial cache: Fetch missing posts from Cassandra
   ↓
5. Tier 3: feedService.getFeed() (fallback)
   ├─ Try Redis: getFeedFromRedis()
   │  ├─ Cache Hit: Return post IDs
   │  └─ Cache Miss: Continue
   ↓
6. feedService.getFeedFromCassandra()
   ├─ Query Cassandra: feeds_by_user table
   └─ Return post IDs (❌ [CACHE MISS])
   ↓
7. postService.getPostsByIds()
   ├─ Try Redis cache for each post
   └─ Fetch missing posts from Cassandra
   ↓
8. Cache complete response for next time
   ↓
9. Return feed with full post details
```

**Console Output Examples:**

**Tier 1 Hit (Fastest):**

```
✅ [CACHE HIT] Complete feed response for user 1 (fastest path)
```

**Tier 2 Hit:**

```
✅ [CACHE HIT] Feed + Posts for user 1 - 20 posts found in single LUA call
```

**Tier 3 (Fallback):**

```
❌ [CACHE MISS] User 2 feed - fetching from Cassandra
✅ [CACHE HIT] All 20 posts from Redis cache
```

### Follow/Unfollow Flow

**Follow:**

```javascript
1. User follows via POST /api/users/:id/follow
   ↓
2. userController.followUser()
   ├─ Create Follow record in PostgreSQL
   ├─ Increment counts in PostgreSQL
   ├─ Increment counts in Redis (userCacheService) - atomic LUA script
   └─ Backfill existing posts: feedService.backfillFeedOnFollow()
      ├─ Get all posts from followed user
      ├─ Add to follower's feed in Cassandra
      ├─ Add to follower's feed in Redis
      └─ Invalidate follower's feed cache
   ↓
3. Next feed load will include new followee's posts
```

**Unfollow:**

```javascript
1. User unfollows via POST /api/users/:id/unfollow
   ↓
2. userController.unfollowUser()
   ├─ Delete Follow record in PostgreSQL
   ├─ Decrement counts in PostgreSQL
   ├─ Decrement counts in Redis (userCacheService) - atomic LUA script
   └─ Remove posts: feedService.removePostsFromFeedOnUnfollow()
      ├─ Get all posts from unfollowed user
      ├─ Remove from follower's feed in Cassandra
      ├─ Remove from follower's feed in Redis (atomic LUA script)
      └─ Invalidate follower's feed cache
   ↓
3. Next feed load will exclude unfollowed user's posts
```

**Cache Invalidation:**

- On follow: Feed cache invalidated, backfill adds new posts
- On unfollow: Feed cache invalidated, posts removed from feed
- On post creation: All followers' response caches invalidated

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

# Kafka
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=instagram-feed-backend
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

**Kafka & Zookeeper:**

- **If you have existing Kafka Confluent 7.4.0+ and Zookeeper:**
  - Configure `KAFKA_BROKERS` in your `.env` file (e.g., `KAFKA_BROKERS=localhost:9092`)
  - Ensure your Kafka and Zookeeper are running
  - Skip the docker-compose step below
- **If you need to set up Kafka (optional):**
  - Start Kafka and Zookeeper using Docker Compose:
    ```bash
    docker-compose up -d
    ```
  - Verify services are running: `docker-compose ps`
  - Access Kafka UI at: http://localhost:8080
- See `KAFKA_GUIDE.md` for detailed Kafka documentation

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
🔌 Connecting to Kafka...
✅ Connected to Kafka
📝 Creating 5 new topics...
✅ Topics created successfully
🔌 Connecting Kafka producer...
✅ Kafka producer connected
🔌 Connecting feed consumer...
✅ Feed consumer connected
📋 Subscribed to topics: post-created, user-followed, user-unfollowed
✅ Feed consumer started and listening for messages
🚀 Server running on http://localhost:3000
📊 Kafka UI available at http://localhost:8080
📊 Redis PING response: PONG
✅ LUA scripts loaded successfully
Server running on http://localhost:3000
```

---

## 💾 Redis Caching Strategy

### Multi-Tier Caching Architecture

**Tier 1: Complete Response Cache (Fastest Path)**

- **Key:** `feed:user:{user_id}:response`
- **Type:** String (JSON)
- **TTL:** 7 days (refreshed on access)
- **Performance:** ~0.05ms (single GET + parse)
- **Use Case:** Returning complete feed response instantly

**Tier 2: Feed IDs + Post Details (Optimized Path)**

- **Feed IDs:** `feed:user:{user_id}` (Sorted Set)
- **Post Details:** `post:{post_id}` (String, JSON)
- **Performance:** ~0.1ms (single LUA script execution)
- **Use Case:** When response cache misses but feed and posts are cached

**Tier 3: Fallback to Cassandra**

- **Performance:** ~10ms (database query)
- **Use Case:** Cache miss, query Cassandra and warm up all caches

### Feed Caching (Sorted Sets)

**Key Pattern:** `feed:user:{user_id}`

**Structure:**

- Type: Sorted Set (ZSET)
- Score: Timestamp (milliseconds)
- Value: `post_id` (UUID string)
- Max Size: 100 posts per user (auto-trimmed via LUA script)
- TTL: 7 days (refreshed on access via LUA script)

**Operations:**

- `ZADD` - Add post to feed (via LUA script with trim + TTL)
- `ZREVRANGE` - Get top N posts (most recent)
- `ZREMRANGEBYRANK` - Trim to 100 posts (automatic)
- `EXPIRE` - Set TTL (automatic)

**Memory Usage:**

- Per user: ~5 KB (100 posts)
- 10K active users: ~50 MB
- 100K users: ~500 MB
- 1M users: ~5 GB (manageable with Redis Cluster)

### Post Detail Caching

**Key Pattern:** `post:{post_id}`

**Structure:**

- Type: String (JSON)
- Value: Complete post object as JSON
- TTL: 1 hour

**Operations:**

- `SETEX` - Cache post with TTL
- `GET` - Retrieve post
- `MGET` - Batch retrieve multiple posts (used in LUA scripts)

**Benefits:**

- Reduces Cassandra queries for post details
- Enables fast feed loading when posts are cached
- Batch operations via MGET for efficiency

### Response Caching (Fastest Path)

**Key Pattern:** `feed:user:{user_id}:response`

**Structure:**

- Type: String (JSON)
- Value: Complete feed array (serialized JSON)
- TTL: 7 days (refreshed on access)

**Operations:**

- `SETEX` - Cache complete response
- `GET` - Retrieve complete response
- `EXPIRE` - Refresh TTL on access

**Benefits:**

- Single Redis operation for complete feed
- Fastest possible response time
- Reduces CPU overhead (no post merging needed)

### Count Caching (Strings)

**Key Patterns:**

- `user:{user_id}:followers_count`
- `user:{user_id}:following_count`

**Structure:**

- Type: String
- Value: Count as string
- TTL: 1 hour (refreshed on access via LUA script)

**Operations:**

- `GET` - Read count (with TTL refresh)
- `SETEX` - Set with TTL
- `INCR` - Increment (atomic via LUA script)
- `DECR` - Decrement (atomic via LUA script with bounds checking)

### Cache Invalidation

**Automatic:**

- TTL expiration (7 days for feeds, 1 hour for posts/counts)
- On follow/unfollow: Feed cache invalidated (both feed IDs and response cache)
- On post creation: Followers' response caches invalidated

**Manual:**

- `invalidateFeedCache(userId)` - Clear all feed-related caches
- `invalidateCountCache(userId)` - Clear count cache

### Cache Hit Logging

All cache operations log to console:

- `✅ [CACHE HIT]` - Cache hit
- `❌ [CACHE MISS]` - Cache miss
- `⚠️ [CACHE PARTIAL]` - Partial cache (some data missing)
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

**Check Console:**

```
📥 Backfilling 5 posts from user 2 to follower 1's feed
✅ Backfilled 5 posts to user 1's feed and invalidated response cache
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
[PIPELINE] Batch add to 1 feeds: 1.23ms
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
✅ [CACHE HIT] All 20 posts from Redis cache

# Second request
✅ [CACHE HIT] Complete feed response for user 2 (fastest path)
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

**3-Tier Cache Strategy:**

- **Tier 1 (Response Cache):** ~0.05ms (single GET + parse)
- **Tier 2 (Feed + Posts):** ~0.1ms (single LUA script)
- **Tier 3 (Fallback):** ~10ms (Cassandra query)

**Without Cache:**

- Direct Cassandra: ~10-50ms (depending on data size)

**Improvement:**

- Tier 1: ~200-1000x faster than direct Cassandra
- Tier 2: ~100-500x faster than direct Cassandra

### Fan-out Performance

**Current Implementation:**

- Synchronous fan-out (blocks until complete)
- Parallel writes to Cassandra
- Batch pipelined writes to Redis (via LUA scripts)
- For 10K followers: ~2-5 seconds

**Optimization Opportunities:**

- Async fan-out (don't block post creation) - **Kafka integration planned**
- Batch processing (1000 followers at a time)
- Background workers (Kafka-based)

### Memory Management

**Redis Memory:**

- Feeds: Limited to 100 posts per user
- Posts: Individual post caching (1 hour TTL)
- Response cache: Complete feed responses (7 days TTL)
- Auto-expiration: TTL-based
- Only active users cached

**Scaling:**

- 10K active users: ~50 MB (feeds) + ~100 MB (posts) = ~150 MB
- 100K active users: ~500 MB (feeds) + ~1 GB (posts) = ~1.5 GB
- 1M active users: ~5 GB (feeds) + ~10 GB (posts) = ~15 GB (manageable with Redis Cluster)

### Database Load

**Read Operations:**

- Feed reads: Mostly from Redis (reduces Cassandra load by ~95%)
- Post reads: Mostly from Redis (reduces Cassandra load by ~80%)
- Count reads: Mostly from Redis (reduces PostgreSQL load by ~90%)

**Write Operations:**

- Post creation: 2 Cassandra writes + N Redis writes (N = followers) + cache invalidation
- Follow: 1 PostgreSQL write + backfill operations + cache invalidation
- Unfollow: 1 PostgreSQL delete + removal operations + cache invalidation

### LUA Script Benefits

**Performance Improvements:**

- **Atomic Operations:** No race conditions, guaranteed consistency
- **Reduced Round-trips:** Single network call for complex operations
- **Server-side Execution:** Operations execute on Redis server (lower latency)
- **Pre-loaded Scripts:** SHA1 hashes for faster execution

**Example:**

- Without LUA: 3 operations (ZADD + ZREMRANGEBYRANK + EXPIRE) = 3 round-trips
- With LUA: 1 operation (all 3 in single script) = 1 round-trip
- **Improvement:** ~3x faster for feed operations

---

## 📝 Notes for Teammates

### Key Concepts

1. **Fan-out on Write:** Posts are written to followers' feeds immediately, not computed on read
2. **Multi-Tier Caching:** 3-tier strategy for optimal performance (response → feed+posts → fallback)
3. **Atomic Operations:** LUA scripts ensure consistency and reduce round-trips
4. **Service Layer:** Business logic separated from HTTP handling
5. **Cache-First Strategy:** Always check Redis before database

### Common Patterns

**Adding a new feature:**

1. Create service function (if database operation)
2. Create controller function (HTTP handling)
3. Add route
4. Update cache if needed
5. Consider LUA script optimization if multiple Redis operations

**Debugging:**

- Check console logs for cache hits/misses
- Use helper endpoints to view database data
- Redis commands:
  - `redis-cli KEYS "feed:user:*"` to see cached feeds
  - `redis-cli KEYS "post:*"` to see cached posts
  - `redis-cli KEYS "*:response"` to see cached responses

### Important Files

- **`feedService.js`** - Feed logic + multi-tier Redis caching
- **`postService.js`** - Post operations (Cassandra) + post caching
- **`userCacheService.js`** - Count caching with atomic operations
- **`redisLuaScripts.js`** - Atomic Redis operations (critical for performance)
- **`cassandra-schema.js`** - Database schema definitions

### LUA Script Best Practices

1. **Always use pre-loaded scripts** (via `loadLuaScripts()`)
2. **Combine related operations** into single script
3. **Handle errors gracefully** (fallback to EVAL if script not found)
4. **Test scripts thoroughly** (atomic operations are harder to debug)

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
- Verify LUA scripts loaded: Check startup logs for "✅ LUA scripts loaded successfully"

### LUA Script Errors

- Check if scripts loaded on startup
- Verify Redis version supports LUA scripts (Redis 2.6+)
- Check console for script execution errors

---

## 📚 Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [Cassandra Documentation](https://cassandra.apache.org/doc/latest/)
- [Redis Documentation](https://redis.io/docs/)
- [Redis LUA Scripting](https://redis.io/docs/manual/programmability/eval-intro/)
- [Sequelize Documentation](https://sequelize.org/)

---

## 🔮 Future Enhancements

### Planned Features

1. **Kafka Integration** - Async fan-out processing

   - Post creation: Publish event, return immediately
   - Background workers handle fan-out
   - Expected: 10-25x faster post creation response time

2. **Celebrity User Handling** - Hybrid fan-out strategy

   - Users with >10K followers: Partial fan-out + on-demand pull
   - Separate celebrity posts cache
   - Feed merge strategy

3. **Analytics Pipeline** - Event-driven analytics
   - Engagement events (likes, comments) via Kafka
   - Real-time metrics aggregation
   - Dashboard for monitoring

---

**Last Updated:** 2025-01-26  
**Version:** 2.0.0

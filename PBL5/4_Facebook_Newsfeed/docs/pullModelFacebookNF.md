# Facebook-Style Newsfeed: Pure Pull Model Architecture

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Core Principle: Pull Model](#core-principle-pull-model)
3. [System Components](#system-components)
4. [File-by-File Deep Dive](#file-by-file-deep-dive)
5. [Complete Flow Scenarios](#complete-flow-scenarios)
6. [Key Design Decisions](#key-design-decisions)
7. [Performance Characteristics](#performance-characteristics)

---

## Architecture Overview

### What is a Pure Pull Model?

In a **pure pull model** (also called **fan-in on read**), feeds are computed **on-demand** when users request them, rather than being pre-computed and stored when posts are created.

```
┌─────────────────────────────────────────────────────────────┐
│                    PURE PULL MODEL                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  POST CREATION:                                             │
│  ┌──────────┐                                              │
│  │ User A   │ Creates Post                                 │
│  └────┬─────┘                                              │
│       │                                                     │
│       ▼                                                     │
│  ┌──────────┐                                              │
│  │ Database │ Save Post                                    │
│  └────┬─────┘                                              │
│       │                                                     │
│       ▼                                                     │
│  ┌──────────┐                                              │
│  │  Kafka   │ Send Event (for cache invalidation)          │
│  └──────────┘                                              │
│                                                             │
│  NO WRITING TO FOLLOWER FEEDS! ✅                          │
│                                                             │
│  ───────────────────────────────────────────────────────  │
│                                                             │
│  FEED REQUEST:                                              │
│  ┌──────────┐                                              │
│  │ User B   │ Requests Feed                                │
│  └────┬─────┘                                              │
│       │                                                     │
│       ▼                                                     │
│  ┌──────────┐                                              │
│  │  Redis   │ Check Cache                                 │
│  └────┬─────┘                                              │
│       │                                                     │
│       ├─── Cache HIT ────► Return Cached Feed             │
│       │                                                     │
│       └─── Cache MISS ────► Query Database (Fan-In)       │
│                             │                               │
│                             ▼                               │
│                        ┌──────────┐                        │
│                        │ Database │ Get Posts from         │
│                        │          │ Followed Users         │
│                        └────┬─────┘                        │
│                             │                               │
│                             ▼                               │
│                        ┌──────────┐                        │
│                        │  Redis   │ Cache Result            │
│                        └────┬─────┘                        │
│                             │                               │
│                             ▼                               │
│                        Return Feed                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Key Characteristics

1. **No Fan-Out on Write**: Posts are NOT written to follower feeds when created
2. **Fan-In on Read**: Feeds are computed by querying posts from all followed users
3. **Selective Cache Invalidation**: Only active users' caches are invalidated
4. **On-Demand Computation**: Feeds computed when requested, not pre-computed

---

## Core Principle: Pull Model

### The Fundamental Rule

> **Feeds are computed when users request them, not when posts are created.**

### Why This Matters

**Traditional Push Model (Fan-Out on Write):**

```
User with 1M followers posts
  ↓
System writes to 1M Redis keys (one per follower)
  ↓
❌ Problem: Expensive, doesn't scale, memory intensive
```

**Pure Pull Model (Fan-In on Read):**

```
User with 1M followers posts
  ↓
System saves post to database
  ↓
System invalidates only active followers' caches
  ↓
✅ Solution: Scales with read load, efficient
```

### Active User Tracking

The system tracks which users are "active" (viewed their feed in last 5 minutes):

```
User requests feed
  ↓
Mark as active: active_users:{user_id} = 1 (TTL: 5 minutes)
  ↓
When someone posts, only invalidate active users' caches
```

**Why?** Most users don't check their feed immediately. Only invalidate caches for users who are actually viewing feeds.

---

## System Components

### Technology Stack

```
┌─────────────────────────────────────────┐
│         APPLICATION LAYER               │
│  ┌────────────┐    ┌────────────┐       │
│  │ Controllers│    │   Workers │       │
│  └────────────┘    └────────────┘       │
└─────────────────────────────────────────┘
           │                    │
           ▼                    ▼
┌─────────────────────────────────────────┐
│         MESSAGE QUEUE                    │
│  ┌──────────────────────────────────┐   │
│  │         Kafka                    │   │
│  │  Topics: post-created            │   │
│  └──────────────────────────────────┘   │
└─────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│         DATA LAYER                       │
│  ┌────────────┐    ┌────────────┐       │
│  │ PostgreSQL │    │   Redis    │       │
│  │  (Database)│    │   (Cache)  │       │
│  └────────────┘    └────────────┘       │
└─────────────────────────────────────────┘
```

### Component Responsibilities

1. **Controllers**: Handle HTTP requests, business logic
2. **Workers**: Process Kafka events asynchronously
3. **Kafka**: Event streaming for cache invalidation
4. **PostgreSQL**: Persistent storage (users, posts, relationships)
5. **Redis**: Caching layer (feeds, active users, timestamps)

---

## File-by-File Deep Dive

### 1. `controllers/postController.js`

**Purpose**: Handles post creation, likes, and comments

#### Key Functions

##### `handlePost()` - Create Post

**What it does:**

1. Validates input
2. Creates post in database
3. Sends Kafka event (for cache invalidation, NOT fan-out)
4. Caches the post itself
5. Invalidates author's own posts cache

**Code Flow:**

```javascript
User creates post
  ↓
Validate input
  ↓
Save to PostgreSQL
  ↓
Send to Kafka (event for cache invalidation)
  ↓
Cache post: post:{postId}
  ↓
Invalidate author's posts cache
  ↓
Return success
```

**Important**: NO writing to follower feeds! This is the key difference from push model.

##### `invalidateActiveFollowersCache()` - Selective Cache Invalidation

**What it does:**

- Helper function used by like/comment handlers
- Only invalidates caches of active users who follow the post author

**Logic:**

```
1. Get all active users from Redis (active_users:*)
2. Check which active users follow the post author
3. Invalidate only those users' feed caches
```

**Why this matters**: Instead of invalidating all followers' caches (expensive), we only invalidate active followers' caches (efficient).

##### `handleLike()` and `handleComment()`

**What they do:**

1. Update like/comment in database
2. Invalidate post cache
3. Use `invalidateActiveFollowersCache()` for selective invalidation

**Key Point**: They use selective invalidation, not mass invalidation.

---

### 2. `controllers/feedController.js`

**Purpose**: Handles feed requests - the heart of the pull model

#### Key Function: `handleGetFeed()`

This is where the magic happens! Let's break it down:

##### Step 1: Mark User as Active

```javascript
await redisClient.setEx(`active_users:${user_id}`, 300, "1");
```

**What this does:**

- Marks user as "active" (viewed feed in last 5 minutes)
- Used later for selective cache invalidation
- TTL: 300 seconds (5 minutes)

**Why**: We only want to invalidate caches of users who are actually viewing feeds.

##### Step 2: Handle Refresh Scenario

**When**: User requests feed with `?refresh=true`

**What happens:**

```
1. Get last fetch timestamp
2. Query database for NEW posts since last fetch (delta)
3. Merge with cached feed
4. Update cache
5. Return new posts
```

**Key Query:**

```sql
SELECT * FROM posts
WHERE user_id IN (followed_users)
  AND created_at > last_fetch_timestamp
ORDER BY created_at DESC
LIMIT 100
```

**Why this is efficient**: Only queries new posts, not entire feed.

##### Step 3: Normal Feed Request (Cache Hit)

**When**: User requests feed, cache exists and is valid

**What happens:**

```
1. Check Redis cache
2. Cache HIT → Return cached feed immediately
3. No database query needed!
```

**Performance**: < 200ms (just Redis read)

##### Step 4: Normal Feed Request (Cache Miss)

**When**: User requests feed, cache doesn't exist or expired

**What happens:**

```
1. Check Redis cache
2. Cache MISS → Query database (FAN-IN)
3. Get all followed users
4. Query posts from followed users (last 7 days)
5. Cache result
6. Return feed
```

**Key Query (Fan-In):**

```sql
SELECT * FROM posts
WHERE user_id IN (followed_users)
  AND created_at >= '7 days ago'
ORDER BY created_at DESC
LIMIT 20
```

**Performance**: ~500ms - 1 second (database query + cache write)

##### Step 5: Cursor Pagination

**When**: User requests page 2+ (with cursor)

**What happens:**

```
1. Skip cache check (only first page is cached)
2. Query database for older posts (before cursor timestamp)
3. Return posts
```

**Why**: Only first page is cached. Subsequent pages are computed on-demand.

---

### 3. `workers/postWorker.js`

**Purpose**: Processes Kafka events asynchronously for cache invalidation

#### Key Function: `processPostCreated()`

**What it does:**

1. Receives post-created event from Kafka
2. Caches the post itself
3. Invalidates author's own posts cache
4. **Selectively invalidates active followers' caches**

#### Selective Cache Invalidation Logic

```
Post created event received
  ↓
Get all active users: active_users:*
  ↓
Check which active users follow the post author
  ↓
Invalidate only those active followers' caches
  ↓
Done!
```

**Example Scenario:**

```
Post author has 1,000,000 followers
But only 5,000 are active (viewed feed in last 5 min)
  ↓
Only invalidate 5,000 caches (not 1,000,000!)
  ↓
✅ Efficient!
```

**Key Code:**

```javascript
// Get active users
const activeUserKeys = await redisClient.keys("active_users:*");
const activeUserIds = activeUserKeys.map((key) =>
  parseInt(key.replace("active_users:", ""))
);

// Check which active users follow post author
const followers = await Follow.findAll({
  where: {
    following_id: userId,
    follower_id: { [Op.in]: activeUserIds },
  },
});

// Invalidate only active followers' caches
await Promise.all(activeFollowerIds.map((id) => deleteFeedCache(id)));
```

**Why this is important**: This is the core optimization that makes pull model scalable.

---

### 4. `services/kafkaProducer.js`

**Purpose**: Sends events to Kafka for asynchronous processing

#### Key Function: `sendPostCreatedEvent()`

**What it sends:**

```javascript
{
  eventType: "post-created",
  postId: 123,
  userId: 456,
  postData: { ... },
  timestamp: "2024-01-15T10:00:00Z"
}
```

**Important**: NO `followerIds` in the event! The worker determines which users to invalidate.

**Why**: In pull model, we don't need to know all followers upfront. Worker will check active users itself.

---

### 5. `utils/cache.js`

**Purpose**: Redis cache operations

#### Key Functions

##### Basic Operations

- `getCache(key)`: Get value from Redis
- `setCache(key, value, ttl)`: Set value in Redis with TTL
- `deleteCache(key)`: Delete key from Redis

##### Feed Cache Operations

**`appendMultipleToFeedCache(key, newPosts, maxLength, ttl)`**

- Used for refresh scenarios
- Appends new posts to existing cached feed
- Prevents duplicates
- Trims to maxLength

**Flow:**

```
1. GET existing feed from cache
2. Filter out duplicate posts
3. Prepend new posts
4. Trim to maxLength
5. SET updated feed back to cache
```

**`deleteFeedCache(user_id)`**

- Deletes user's feed cache
- Uses tracking set for efficient deletion
- Used for selective cache invalidation

##### Cache Tracking

**`addFeedCacheKey(user_id, ttl)`**

- Tracks feed cache keys in Redis SET
- Enables efficient bulk deletion

**`deleteFeedCache(user_id)`**

- Uses tracking set to find all feed cache keys
- Deletes them efficiently
- Much faster than pattern matching

##### Delta Computation

**`getLastFetchTime(userId)`**

- Gets timestamp of last feed fetch
- Used for delta queries (only new posts)

**`setLastFetchTime(userId, ttl)`**

- Stores timestamp of current feed fetch
- Used for next refresh query

---

## Complete Flow Scenarios

### Scenario 1: User Creates a Post

**Actors**: User A (post author), User B, User C (followers)

**Timeline:**

```
10:00:00 AM - User A creates post
  ↓
┌─────────────────────────────────────────┐
│ postController.js: handlePost()          │
├─────────────────────────────────────────┤
│ 1. Validate input                        │
│ 2. Save post to PostgreSQL               │
│ 3. Send Kafka event                      │
│ 4. Cache post: post:123                 │
│ 5. Invalidate User A's posts cache      │
│ 6. Return success                        │
└─────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────┐
│ Kafka: post-created event               │
│ { postId: 123, userId: A, ... }         │
└─────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────┐
│ postWorker.js: processPostCreated()     │
├─────────────────────────────────────────┤
│ 1. Cache post: post:123                 │
│ 2. Invalidate User A's posts cache     │
│ 3. Get active users                     │
│    - Found: User B (active)             │
│    - Found: User C (inactive)          │
│ 4. Check: Does User B follow User A?   │
│    - Yes ✅                             │
│ 5. Invalidate User B's feed cache       │
│ 6. Skip User C (not active)             │
└─────────────────────────────────────────┘

Result:
- Post saved to database ✅
- Post cached ✅
- Only User B's cache invalidated ✅
- User C's cache NOT invalidated (not active) ✅
- NO writing to follower feeds ✅
```

**Key Points:**

- No fan-out to follower feeds
- Only active followers' caches invalidated
- Post is cached for individual lookups

---

### Scenario 2: User Requests Feed (First Time)

**Actors**: User B (requesting feed), User A, User C (users B follows)

**Timeline:**

```
10:05:00 AM - User B requests feed (first time)
  ↓
┌─────────────────────────────────────────┐
│ feedController.js: handleGetFeed()      │
├─────────────────────────────────────────┤
│ Step 1: Mark User B as active            │
│   active_users:userB = 1 (TTL: 5 min)   │
│                                          │
│ Step 2: Check cache                     │
│   feed:user:userB → MISS ❌              │
│                                          │
│ Step 3: Query database (FAN-IN)           │
│   Get followed users: [A, C]            │
│   Query:                                │
│     SELECT * FROM posts                 │
│     WHERE user_id IN (A, C)             │
│       AND created_at >= '7 days ago'     │
│     ORDER BY created_at DESC            │
│     LIMIT 20                            │
│                                          │
│ Step 4: Cache result                    │
│   feed:user:userB = { posts: [...] }    │
│   last_fetch:userB = current_time        │
│                                          │
│ Step 5: Return feed                     │
└─────────────────────────────────────────┘

Result:
- Feed computed from database (fan-in) ✅
- Feed cached for 5 minutes ✅
- User B marked as active ✅
- Response time: ~500ms - 1 second
```

**Key Points:**

- Feed computed on-demand (pull model)
- Database query aggregates posts from followed users
- Result cached for subsequent requests

---

### Scenario 3: User Requests Feed (Cache Hit)

**Actors**: User B (requesting feed again)

**Timeline:**

```
10:05:30 AM - User B requests feed again (30 seconds later)
  ↓
┌─────────────────────────────────────────┐
│ feedController.js: handleGetFeed()      │
├─────────────────────────────────────────┤
│ Step 1: Mark User B as active            │
│   active_users:userB = 1 (TTL reset)     │
│                                          │
│ Step 2: Check cache                      │
│   feed:user:userB → HIT ✅               │
│                                          │
│ Step 3: Return cached feed               │
│   No database query needed!              │
└─────────────────────────────────────────┘

Result:
- Feed returned from cache ✅
- No database query ✅
- Response time: < 200ms ✅
```

**Key Points:**

- Fast response from cache
- No database load
- User stays active

---

### Scenario 4: User Refreshes Feed

**Actors**: User B (refreshing feed)

**Timeline:**

```
10:06:00 AM - User B refreshes feed (?refresh=true)
  ↓
┌─────────────────────────────────────────┐
│ feedController.js: handleGetFeed()      │
│ (refresh scenario)                       │
├─────────────────────────────────────────┤
│ Step 1: Mark User B as active            │
│                                          │
│ Step 2: Get last fetch time              │
│   last_fetch:userB = 10:05:00            │
│                                          │
│ Step 3: Query database for DELTA        │
│   Query:                                │
│     SELECT * FROM posts                 │
│     WHERE user_id IN (A, C)             │
│       AND created_at > 10:05:00          │
│     ORDER BY created_at DESC            │
│     LIMIT 100                           │
│                                          │
│ Step 4: Merge with cached feed           │
│   newPosts + cachedFeed.posts           │
│   (deduplicate, sort by timestamp)      │
│                                          │
│ Step 5: Update cache                     │
│   feed:user:userB = merged feed          │
│   last_fetch:userB = 10:06:00           │
│                                          │
│ Step 6: Return new posts                 │
└─────────────────────────────────────────┘

Result:
- Only new posts queried (delta) ✅
- Merged with cached feed ✅
- Cache updated ✅
- Response time: < 300ms ✅
```

**Key Points:**

- Delta computation (only new posts)
- Much faster than full recomputation
- Efficient for frequent refreshes

---

### Scenario 5: User with Many Followers Posts

**Actors**: User A (1M followers), User B (active follower), User C (inactive follower)

**Timeline:**

```
10:10:00 AM - User A (celebrity) creates post
  ↓
┌─────────────────────────────────────────┐
│ postController.js: handlePost()         │
├─────────────────────────────────────────┤
│ 1. Save post to database                 │
│ 2. Send Kafka event                     │
│ 3. Cache post                            │
│ 4. Return success (fast!)                │
└─────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────┐
│ postWorker.js: processPostCreated()     │
├─────────────────────────────────────────┤
│ 1. Get active users                     │
│    Found: 10,000 active users           │
│    (including User B, NOT User C)       │
│                                          │
│ 2. Check which active users follow A    │
│    Found: 5,000 active followers        │
│    (including User B)                   │
│                                          │
│ 3. Invalidate 5,000 caches              │
│    (parallel execution)                  │
│                                          │
│ 4. Done!                                 │
└─────────────────────────────────────────┘

Result:
- Post saved ✅
- Only 5,000 caches invalidated (not 1M!) ✅
- User B's cache invalidated ✅
- User C's cache NOT invalidated (not active) ✅
- Total time: ~2-5 seconds (acceptable)
```

**Key Points:**

- Scales efficiently even with 1M followers
- Only active users' caches invalidated
- Inactive users' caches untouched (they'll get fresh feed on next request)

---

### Scenario 6: User Follows Someone New

**Actors**: User B (follower), User D (new person to follow)

**Timeline:**

```
10:15:00 AM - User B follows User D
  ↓
┌─────────────────────────────────────────┐
│ userController.js: handleFollow()       │
├─────────────────────────────────────────┤
│ 1. Create follow relationship           │
│ 2. Invalidate User B's feed cache        │
│    (because their feed will change)      │
└─────────────────────────────────────────┘

Result:
- Follow relationship created ✅
- User B's feed cache invalidated ✅
- Next feed request will include User D's posts ✅
```

**Key Points:**

- Only the follower's cache is invalidated (not all of User D's followers)
- This is correct - User B's feed changes, so their cache should be invalidated

---

## Key Design Decisions

### 1. Why No Fan-Out on Write?

**Problem with Fan-Out:**

- User with 1M followers → 1M Redis writes
- Expensive, doesn't scale
- Wastes resources (many users inactive)

**Solution: Pull Model**

- Post creation: O(1) - just save to database
- Feed request: O(following_count) - query database
- Scales with read load (can add read replicas)

### 2. Why Active User Tracking?

**Problem without tracking:**

- Post created → invalidate all followers' caches
- 1M followers → 1M cache invalidations
- Expensive

**Solution with tracking:**

- Only track users who viewed feed in last 5 minutes
- Post created → invalidate only active followers' caches
- 1M followers, 10K active → only 10K invalidations
- Much more efficient

### 3. Why Cache Feeds?

**Problem without caching:**

- Every feed request queries database
- Slow for users following many people
- High database load

**Solution with caching:**

- First request: query database, cache result
- Subsequent requests: return from cache
- 80% cache hit rate → 80% of requests skip database
- Much faster and lower database load

### 4. Why Delta Computation?

**Problem without delta:**

- Refresh always queries entire feed
- Slow for users following many people
- Unnecessary work

**Solution with delta:**

- Refresh queries only new posts since last fetch
- Merge with cached feed
- Much faster (10-100x fewer posts to process)

### 5. Why Time Windowing (7 days)?

**Problem without windowing:**

- Query all posts from all followed users
- Very slow for users following many people
- Unnecessary (users rarely view old posts)

**Solution with windowing:**

- Only query posts from last 7 days
- Reduces data scanned by 5-10x
- Much faster queries

---

## Performance Characteristics

### Write Performance (Post Creation)

```
User creates post
  ↓
Save to database: ~10-50ms
Send Kafka event: ~5-10ms
Cache post: ~5-10ms
Invalidate author's cache: ~5-10ms
  ↓
Total: ~25-80ms ✅
```

**Key Point**: Fast! No fan-out, so write performance is excellent.

### Read Performance (Feed Request)

#### Cache Hit

```
User requests feed
  ↓
Check cache: ~1-5ms
Return cached feed: ~1-5ms
  ↓
Total: < 200ms ✅
```

#### Cache Miss (First Load)

```
User requests feed
  ↓
Mark active: ~1-5ms
Query database: ~200-800ms (depends on following count)
Cache result: ~5-10ms
  ↓
Total: ~500ms - 1 second ✅
```

#### Refresh (Delta)

```
User refreshes feed
  ↓
Query delta: ~50-200ms (only new posts)
Merge with cache: ~1-5ms
Update cache: ~5-10ms
  ↓
Total: < 300ms ✅
```

### Cache Invalidation Performance

```
Post created
  ↓
Kafka event: ~5-10ms
Worker processes: ~100-500ms (depends on active users)
  ↓
Total: ~100-500ms ✅
```

**Key Point**: Only invalidates active users, so even with 1M followers, it's fast if only 10K are active.

---

## Scalability Analysis

### Scenario: User with 1 Million Followers

**Post Creation:**

- Write cost: O(1) - just save post
- Cache invalidation: O(active_followers) - only active users
- If 10K active: invalidate 10K caches (~2-5 seconds)
- If 0 active: no invalidation (~100ms)

**Feed Request (Follower):**

- Cache hit: < 200ms
- Cache miss: ~500ms - 1 second (depends on how many people they follow)

**Key Insight**: Pull model scales with read load (can add read replicas), not write load.

### Scenario: User Following 5,000 People

**Feed Request:**

- Cache hit: < 200ms
- Cache miss: ~1-2 seconds (query 5,000 users' posts)
- With proper indexes: acceptable performance

**Optimizations:**

- Composite index: `(user_id, created_at DESC)`
- Time windowing: only last 7 days
- Caching: 80% cache hit rate

---

## Comparison: Pull vs Push Model

### Push Model (Fan-Out on Write)

```
Post Creation:
- Write cost: O(followers) - write to all follower feeds
- Read cost: O(1) - just read cache
- Memory: High (all feeds pre-computed)
- Scalability: ❌ Fails at large follower counts

Example: User with 1M followers posts
  → 1M Redis writes
  → ❌ Fails (command too large, timeout, memory)
```

### Pull Model (Fan-In on Read)

```
Post Creation:
- Write cost: O(1) - just save post
- Read cost: O(following_count) - query database
- Memory: Lower (only active users cached)
- Scalability: ✅ Scales with read load

Example: User with 1M followers posts
  → 1 database write
  → Invalidate only active followers' caches
  → ✅ Works perfectly
```

### When to Use Each

**Push Model (Fan-Out):**

- Small follower counts (< 10K)
- Very high read-to-write ratio
- Need instant feed updates

**Pull Model (Fan-In):**

- Large follower counts (> 10K)
- Moderate read-to-write ratio
- Can tolerate slight delay in feed updates
- ✅ **This is what we implemented**

---

## Redis Key Patterns

### Feed Cache

```
feed:user:{user_id}
  → { posts: [...], lastUpdated: "..." }
  → TTL: 300 seconds (5 minutes)
```

### Active User Tracking

```
active_users:{user_id}
  → "1"
  → TTL: 300 seconds (5 minutes)
```

### Post Cache

```
post:{post_id}
  → { id, user_id, content, ... }
  → TTL: 900 seconds (15 minutes)
```

### Last Fetch Time

```
last_fetch:user:{user_id}
  → "2024-01-15T10:00:00Z"
  → TTL: 300 seconds (5 minutes)
```

### Cache Tracking Sets

```
user_feed_cache:{user_id}
  → SET containing: ["feed:user:{user_id}"]
  → Used for efficient cache deletion

user_posts_cache:{user_id}
  → SET containing: ["posts:user:{user_id}:page:1", ...]
  → Used for efficient cache deletion
```

---

## Database Schema

### Key Tables

**posts**

```sql
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  image_urls TEXT[],
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_user_posts (user_id, created_at DESC)
);
```

**follows**

```sql
CREATE TABLE follows (
  follower_id INTEGER NOT NULL,
  following_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id),
  INDEX idx_follower (follower_id),
  INDEX idx_following (following_id)
);
```

**Key Index**: `idx_user_posts` is critical for fast feed queries!

---

## Query Optimization

### Feed Query (Fan-In)

**Query:**

```sql
SELECT p.*, u.username, u.avatar_url
FROM posts p
JOIN users u ON u.id = p.user_id
WHERE p.user_id IN (followed_user_ids)
  AND p.created_at >= '7 days ago'
ORDER BY p.created_at DESC
LIMIT 20;
```

**Optimizations:**

1. **Composite Index**: `(user_id, created_at DESC)` - enables fast lookups per user
2. **Time Windowing**: Only last 7 days - reduces data scanned
3. **Limit**: Only fetch what's needed
4. **Caching**: Cache result to avoid repeated queries

**Performance:**

- Following 200 people: ~200-500ms
- Following 5,000 people: ~500ms - 1 second
- With proper indexes: acceptable

---

## Error Handling

### Kafka Failure

**Scenario**: Kafka is down when post is created

**Handling:**

```javascript
try {
  await kafkaProducer.sendPostCreatedEvent(...);
} catch (kafkaError) {
  // Log error, but don't fail the request
  // Cache invalidation will happen on next post
}
```

**Why**: Post creation should succeed even if cache invalidation fails. Users will get fresh feed on next request.

### Redis Failure

**Scenario**: Redis is down

**Handling:**

- Feed requests: Fall back to database queries (slower but works)
- Cache operations: Check `redisClient.isOpen` before operations
- Active user tracking: Fail gracefully (don't break feed request)

**Why**: System should degrade gracefully, not fail completely.

---

## Monitoring and Observability

### Key Metrics to Track

1. **Cache Hit Rate**

   - Target: > 80%
   - Formula: cache_hits / total_requests

2. **Feed Generation Time**

   - Cache hit: < 200ms
   - Cache miss: < 1 second
   - Refresh: < 300ms

3. **Active Users Count**

   - Track: How many users are active at any time
   - Used for capacity planning

4. **Cache Invalidation Count**

   - Track: How many caches invalidated per post
   - Should be much less than total followers

5. **Database Query Performance**
   - Track: P50, P95, P99 latencies
   - Identify slow queries

---

## Summary

### What Makes This a Pure Pull Model?

1. ✅ **No Fan-Out on Write**: Posts are NOT written to follower feeds
2. ✅ **Fan-In on Read**: Feeds computed by querying database
3. ✅ **Selective Cache Invalidation**: Only active users' caches invalidated
4. ✅ **On-Demand Computation**: Feeds computed when requested
5. ✅ **Delta Computation**: Refresh only queries new posts

### Key Benefits

1. **Scalability**: Handles users with millions of followers
2. **Efficiency**: Only invalidates active users' caches
3. **Performance**: Fast reads from cache, acceptable database queries
4. **Resource Usage**: Lower memory (only active users cached)

### Trade-offs

1. **Slight Delay**: Inactive users may see slightly stale feeds (until they request)
2. **Database Load**: Cache misses require database queries
3. **Complexity**: More complex than simple push model

### When This Architecture Works Best

- ✅ Large follower counts (celebrities, influencers)
- ✅ Moderate read-to-write ratio
- ✅ Users don't need instant feed updates
- ✅ Want to scale efficiently

---

## Conclusion

This implementation is a **pure pull model** that:

- Computes feeds on-demand (not pre-computed)
- Uses selective cache invalidation (only active users)
- Scales efficiently (handles millions of followers)
- Provides good performance (fast cache hits, acceptable cache misses)

The architecture is production-ready and follows best practices for large-scale social media feed systems.

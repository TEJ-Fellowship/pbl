# Project 4: Facebook-Style Newsfeed with Pull Model (Fan-In on Read)

## Project Overview

Build a social media newsfeed system using the **pull/fan-in** architecture. Instead of pre-generating feeds, the system computes feeds on-demand when users request them. This project focuses on optimizing query performance, intelligent caching strategies, and computing only the delta (new posts) on subsequent requests.

---

## Tech Stack

- **Backend**: Node.js + Express
- **Database**: PostgreSQL (user data, posts, relationships) + Redis (feed cache, delta tracking)
- **Message Queue**: Kafka (post events, cache invalidation)
- **CDN**: Cloudflare/CloudFront for images
- **Storage**: S3/MinIO for media
- **AI Integration**: Gemini/OpenAI for feed ranking, content quality scoring, and personalized recommendations
- **Frontend**: React with pagination and refresh indicators

---

## Roles

1. **User** - Post content, follow users, view personalized feed, interact with posts
2. **Admin** - Content moderation, feed algorithm tuning, analytics dashboard

---

## Progressive Tier Requirements

### **Tier 1: Core Pull-Based Feed** (Week 1)

**Backend Focus: On-Demand Feed Generation**

#### Features:

- User authentication and profiles
- Create posts (text + images)
- Follow/unfollow users
- **Pull-based feed generation**:
  - On feed request, query recent posts from followed users
  - Sort by timestamp (most recent first)
  - Return paginated results
- Like and comment on posts
- User profile pages

#### Database Schema:

```sql
-- PostgreSQL
users (id, username, email, password_hash, bio, avatar_url, created_at)
follows (follower_id, following_id, created_at, PRIMARY KEY (follower_id, following_id))
posts (
  id,
  user_id,
  content TEXT,
  image_urls TEXT[],
  likes_count INT,
  comments_count INT,
  created_at TIMESTAMP,
  INDEX idx_user_posts (user_id, created_at DESC)
)
likes (user_id, post_id, created_at, PRIMARY KEY (user_id, post_id))
comments (id, post_id, user_id, content, created_at)

-- Redis (feed cache)
feed_cache:{user_id} -> JSON array of post objects (TTL: 5 minutes)
last_fetch:{user_id} -> timestamp of last feed fetch
```

#### Feed Generation Query (Naive Version):

```sql
-- Get posts from followed users
SELECT p.*, u.username, u.avatar_url
FROM posts p
JOIN follows f ON f.following_id = p.user_id
JOIN users u ON u.id = p.user_id
WHERE f.follower_id = $user_id
  AND p.created_at < $cursor_timestamp
ORDER BY p.created_at DESC
LIMIT 20;
```

**Problem**: This query gets slower as users follow more people and posts accumulate.

#### API Endpoints:

- `POST /api/auth/register` & `/api/auth/login`
- `POST /api/posts` - Create new post
- `GET /api/feed?cursor=TIMESTAMP&limit=20` - Get feed (pull on demand)
- `POST /api/posts/:id/like` - Like a post
- `POST /api/posts/:id/comment` - Comment on post
- `POST /api/users/:id/follow` - Follow user
- `GET /api/users/:id/posts` - User profile posts

#### Success Criteria:

- Feed generates and returns within 2 seconds for users following < 200 people
- Pagination works correctly (no duplicate posts)
- Database indexes optimize query performance

---

### **Tier 2: Intelligent Caching + Delta Computation** (Week 2)

**Backend Focus: Cache-Aside Pattern, Delta-Only Updates**

#### Caching Strategy:

**First Feed Load (Cache Miss)**:

1. Query database for recent posts (last 24 hours)
2. Store result in Redis: `feed_cache:{user_id}` (TTL: 5 minutes)
3. Store timestamp: `last_fetch:{user_id}` = current time
4. Return posts to user

**Subsequent Feed Loads (Cache Hit)**:

1. Check if cache exists and is valid (< 5 min old)
2. If valid: Return cached feed
3. If expired: Compute **delta only** (new posts since last fetch)

**Delta Computation**:

```sql
-- Only fetch posts created after last fetch
SELECT p.*, u.username, u.avatar_url
FROM posts p
JOIN follows f ON f.following_id = p.user_id
JOIN users u ON u.id = p.user_id
WHERE f.follower_id = $user_id
  AND p.created_at > $last_fetch_timestamp
ORDER BY p.created_at DESC
LIMIT 100; -- Cap to prevent massive queries
```

**Merge Strategy**:

1. Fetch delta (new posts)
2. Fetch cached feed from Redis
3. Merge: new posts + cached posts (deduplicate by post_id)
4. Sort by timestamp
5. Update cache with merged result
6. Update `last_fetch` timestamp

#### Cache Invalidation (Kafka):

**Events that invalidate cache**:

- User follows/unfollows someone
- User creates a post (invalidate followers' caches - but don't do full fan-out!)

**Kafka Topics**:

- `post-created` (trigger delta computation for active users)
- `follow-changed` (invalidate specific user's cache)
- `engagement-events` (likes, comments for analytics)

**Selective Cache Invalidation**:

- Don't invalidate all followers' caches on new post (expensive)
- Only invalidate caches of users who fetch feed within 5 minutes
- Use Redis: `SET active_users:{user_id} 1 EX 300` (expire in 5 min)

#### Query Optimization:

**Problem**: Querying posts from 500 followed users is slow

**Solutions**:

1. **Composite Index**: `CREATE INDEX idx_user_time ON posts(user_id, created_at DESC)`
2. **Limit Time Window**: Only query posts from last 7 days (older posts rarely viewed)
3. **Materialized View** (optional):
   ```sql
   CREATE MATERIALIZED VIEW user_recent_posts AS
   SELECT user_id, post_id, created_at
   FROM posts
   WHERE created_at > NOW() - INTERVAL '7 days'
   ORDER BY created_at DESC;
   ```
4. **Partial Indexes**: Index only recent posts
5. **Query Planner Hints**: Use `EXPLAIN ANALYZE` to optimize

#### High Volume Data Simulation:

```javascript
Seed Data:
- 1,000,000 users
- Follow distribution:
  - 70% users follow 10-500 people (avg 200)
  - 25% users follow 500-2000 people
  - 5% users follow 2000-5000 people (power users)
- 50,000,000 posts (past year, weighted toward recent)
- 500,000,000 likes
- 100,000,000 comments
- Average 3 posts/day per active user
```

#### Load Testing:

- Simulate 10,000 users refreshing feeds simultaneously
- Mix of cache hits (70%) and cache misses (30%)
- Measure P95/P99 latency

#### Success Criteria:

- **Cache Hit**: Feed returns in < 200ms
- **Cache Miss (First Load)**: Feed returns in < 1 second
- **Delta Computation**: Only queries new posts (< 500ms)
- Database CPU usage < 70% under load
- Redis hit rate > 80%

---

### **Tier 3: AI-Powered Feed Ranking + Frontend Performance** (Week 3)

**AI Integration + Optimized User Experience**

#### AI-Powered Feed Ranking:

**Problem**: Chronological feeds miss important/engaging content

**Solution**: AI-based content scoring and personalized ranking

1. **Content Quality Score** (Gemini/OpenAI):

   - Analyze post content for quality indicators:
     - Engagement potential (is it interesting?)
     - Sentiment (positive/negative/neutral)
     - Relevance to user's interests
   - Score: 0-100
   - Cache scores in `post_scores` table

2. **Personalized Ranking Algorithm**:

   ```javascript
   Feed Ranking Formula:
   score = (
     0.4 * recency_score +        // Time decay (newer = higher)
     0.3 * engagement_score +     // likes + comments
     0.2 * relationship_score +   // interaction history with poster
     0.1 * content_quality_score  // AI-generated quality
   )

   recency_score = 1 / (1 + hours_old)
   engagement_score = (likes + 2*comments) / (1 + follower_count)
   relationship_score = user_interactions_with_poster / total_interactions
   content_quality_score = AI score / 100
   ```

3. **Learning User Preferences**:

   - Track which posts user engages with (likes, comments, time spent viewing)
   - Build user profile: `user_preferences` table (preferred topics, post types)
   - Use OpenAI embeddings to find similar content
   - Endpoint: `POST /api/feed/feedback` (track engagement for ML)

4. **AI-Powered "You Might Like" Section**:

   - Show posts from non-followed users
   - Use collaborative filtering + content-based filtering
   - Endpoint: `GET /api/feed/discover`
   - Refresh every 12 hours

5. **Smart Notifications**:
   - AI determines which posts are worth notifying user about
   - Avoid notification fatigue
   - Priority scoring for important updates

#### Feed Ranking Implementation:

```javascript
// After fetching posts from database
const rankedPosts = await rankPosts(posts, userId);

async function rankPosts(posts, userId) {
  // 1. Fetch user's interaction history
  const userInteractions = await getUserInteractions(userId);

  // 2. Calculate scores for each post
  const scoredPosts = posts.map((post) => {
    const recencyScore = calculateRecency(post.created_at);
    const engagementScore = calculateEngagement(post);
    const relationshipScore = calculateRelationship(post, userInteractions);
    const qualityScore = post.ai_quality_score || 50; // Default if not scored

    const finalScore =
      0.4 * recencyScore +
      0.3 * engagementScore +
      0.2 * relationshipScore +
      0.1 * (qualityScore / 100);

    return { ...post, rank_score: finalScore };
  });

  // 3. Sort by score
  return scoredPosts.sort((a, b) => b.rank_score - a.rank_score);
}
```

#### Frontend: Performant Feed Display

**Challenge**: Display thousands of ranked posts with smooth scrolling and filtering

**Implementation**:

- **Infinite Scroll with Pagination**:
  - Load 20 posts initially
  - Fetch next 20 when scrolling near bottom
  - Use cursor-based pagination: `?cursor=SCORE-TIMESTAMP&limit=20`
- **Image Lazy Loading**:
  - Load images only when in viewport
  - Blur-up placeholder technique
  - Prioritize above-the-fold images
- **Filter and Sort UI**:
  - Client-side filters: Post type (text/image/video), time range
  - Server-side sorting: Top posts (by engagement), Recent, Personalized
  - Debounced filter inputs (300ms)
- **Pull-to-Refresh**:
  - Show loading indicator
  - Fetch delta (new posts since last load)
  - Prepend new posts to feed
  - Animate new post insertion
- **Optimistic Updates**:
  - Like/comment actions update UI immediately
  - Rollback on API failure
- **Virtual Scrolling** (optional):
  - For very long feeds (1000+ posts)
  - Use `react-virtuoso`

#### API Response Format:

```json
GET /api/feed?cursor=0.85-2024-01-15T10:00:00Z&limit=20

Response:
{
  "posts": [...],
  "nextCursor": "0.72-2024-01-15T08:30:00Z",
  "hasMore": true,
  "unreadCount": 5  // New posts since last visit
}
```

#### Success Criteria:

- Feed ranks posts intelligently (most engaging posts appear higher)
- AI content quality scoring completes in < 500ms per post
- Discover feed shows relevant content (user feedback loop)
- Smooth 60 FPS scrolling with 1000+ posts loaded
- Pull-to-refresh fetches only new posts (delta)

---

### **Tier 4: Admin Dashboard + Feed Analytics** (Week 4)

**Algorithm Tuning + Performance Monitoring**

#### Admin Dashboard Features:

1. **Feed Algorithm Performance**:

   - A/B test different ranking formulas
   - Metrics per algorithm version:
     - Average session duration
     - Engagement rate (likes/comments per post viewed)
     - User retention (return rate)
   - Algorithm weight tuning interface (adjust 0.4/0.3/0.2/0.1 weights)

2. **Feed Generation Metrics**:

   - **Performance**:
     - Feed generation time distribution (P50, P95, P99)
     - Cache hit rate over time (line chart)
     - Delta computation efficiency (avg posts fetched)
     - Database query performance (slow queries)
   - **Cache Analytics**:
     - Redis memory usage
     - Cache eviction rate
     - Most frequently accessed feeds

3. **Content Analytics**:

   - **Engagement Distribution**:
     - Posts by engagement level (0-10, 10-50, 50-100, 100+ interactions)
     - Average time-to-first-engagement
     - Engagement rate by content type (text, image, video)
   - **Viral Content Detection**:
     - Posts with exponential engagement growth
     - Trending topics (AI-extracted keywords)
     - Most shared posts
   - **User Behavior**:
     - Average posts viewed per session
     - Scroll depth distribution
     - Feed refresh frequency
     - Drop-off points (where users stop scrolling)

4. **AI Model Performance**:

   - Content quality score distribution
   - Prediction accuracy (predicted engagement vs actual)
   - Model drift detection (performance over time)
   - Feature importance analysis (which factors predict engagement best)

5. **System Health**:

   - Kafka consumer lag (cache invalidation queue)
   - PostgreSQL connection pool usage
   - Redis cluster health
   - API endpoint latency (by endpoint)

6. **Predictive Analytics** (AI):
   - Forecast user churn risk (low engagement patterns)
   - Predict optimal posting times for users
   - Identify content gaps (what users want but don't see)
   - Suggest feed algorithm improvements

#### A/B Testing Framework:

```javascript
// Assign users to algorithm variants
const userVariant = getUserVariant(userId); // A, B, or C

switch (userVariant) {
  case "A": // Chronological only
    return posts.sort((a, b) => b.created_at - a.created_at);
  case "B": // Engagement-focused
    return rankPostsByEngagement(posts);
  case "C": // AI-personalized
    return rankPostsWithAI(posts, userId);
}

// Track metrics per variant
await trackFeedImpression(userId, userVariant, postIds);
```

#### Admin Dashboard UI:

- **Real-Time Monitoring**:
  - Live feed generation rate (feeds/second)
  - Active users viewing feeds
  - Cache hit rate gauge
- **Historical Analytics**:
  - Date range selector (7d, 30d, 90d, custom)
  - Comparison view (compare two time periods)
- **Algorithm Tuning**:
  - Sliders to adjust ranking weights
  - "Test" button to simulate with sample users
  - Deploy new algorithm version
- **Reports**:
  - Weekly engagement summary
  - Top performing posts
  - User retention cohorts
  - Export as CSV/PDF

#### Implementation:

- **Materialized Views**:
  - `analytics_feed_performance` (date, avg_gen_time, cache_hit_rate, total_feeds)
  - `analytics_content_engagement` (post_id, views, likes, comments, shares)
  - `analytics_user_behavior` (user_id, avg_session_duration, posts_viewed_per_session)
- **Stream Processing**:
  - Kafka Streams for real-time engagement aggregation
  - Window functions for time-based metrics
- **Batch Jobs**:
  - Hourly: Trending topics, viral content detection
  - Daily: User cohorts, retention analysis, A/B test results
  - Weekly: Model retraining, algorithm optimization suggestions

#### Success Criteria:

- Dashboard loads analytics for 50M posts in < 3 seconds
- A/B testing framework tracks metrics with < 5% error margin
- Algorithm tuning shows measurable impact (engagement +10%+)
- Admins can identify and fix feed performance issues quickly
- AI predictions achieve 75%+ accuracy for engagement forecasting

---

## Data Volume Simulation Strategy

### Initial Seed:

```javascript
- 1,000,000 users
- Follow graph (realistic distribution):
  - 70% users: 10-500 follows (avg 200)
  - 25% users: 500-2000 follows
  - 5% users: 2000-5000 follows
- 50,000,000 posts (past 12 months, 70% in last 3 months)
- 500,000,000 likes (Pareto: 20% posts get 80% likes)
- 100,000,000 comments
- Realistic temporal patterns (peak posting 6pm-10pm)
```

### Load Testing Scenarios:

1. **Cold Start**: 10,000 users request feed simultaneously (all cache misses)
2. **Warm Cache**: 50,000 users browsing feeds (80% cache hits)
3. **Refresh Storm**: 20,000 users pull-to-refresh at same time
4. **Celebrity Post**: User with 5M followers posts → invalidate active caches

### Tools:

- k6 for load testing
- PostgreSQL pg_stat_statements for query analysis
- Redis monitoring (INFO command)
- Custom scripts for cache hit rate tracking

---

## Key Learning Outcomes

1. **Pull vs Push Trade-offs**: Understanding when to use fan-in architecture
2. **Caching Strategies**: Cache-aside pattern, delta computation, selective invalidation
3. **Query Optimization**: Database indexing, materialized views, query planning
4. **AI-Powered Ranking**: Building personalized feed algorithms
5. **A/B Testing**: Experimental framework for algorithm optimization
6. **Performance Monitoring**: Identifying and fixing bottlenecks

---

## Evaluation Criteria

- **Architecture Document**: Detailed explanation of pull model with caching strategy
- **Performance**: Feed generation < 1s (cache miss), < 200ms (cache hit)
- **Scalability**: Handle 50K concurrent users without degradation
- **AI Integration**: Intelligent ranking improves engagement measurably
- **Code Quality**: Efficient queries, clean caching logic, comprehensive tests
- **Analytics**: Dashboard provides actionable insights for optimization

---

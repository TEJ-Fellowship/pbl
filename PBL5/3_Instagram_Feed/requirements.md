# Project 3: Instagram-Style Feed with Push Model (Fan-Out on Write)

## Project Overview

Build a social media platform focused on image sharing with a **push/fan-out** architecture. When a user posts, the system immediately writes the post to all followers' feeds. This project emphasizes understanding the trade-offs of fan-out on write, handling celebrity users with millions of followers, and optimizing image delivery through CDNs.

---

## Tech Stack

- **Backend**: Node.js + Express
- **Database**: PostgreSQL (user data, relationships) + Redis (feed cache) + Cassandra (post storage)
- **Message Queue**: Kafka (fan-out job processing)
- **CDN**: Cloudflare/CloudFront for image delivery
- **Storage**: S3/MinIO for original images
- **Image Processing**: Sharp.js for thumbnails and optimization
- **AI Integration**: Gemini/OpenAI for content recommendations, image tagging, and caption generation
- **Frontend**: React with Intersection Observer for infinite scroll

---

## Roles

1. **User** - Post images, follow others, view feed, like/comment
2. **Admin** - Content moderation, user management, analytics dashboard

---

## Progressive Tier Requirements

### **Tier 1: Core Social Network** (Week 1)

**Backend Focus: Posts, Follows, Basic Feed**

#### Features:

- User authentication and profiles
- Image upload with multiple sizes (original, large, thumbnail)
- Follow/unfollow users
- Create posts with captions
- Basic feed generation (pull most recent posts from followed users)
- Like and comment on posts

#### Database Schema:

```sql
-- PostgreSQL
users (id, username, email, password_hash, bio, avatar_url, followers_count, following_count)
follows (id, follower_id, following_id, created_at)
posts (id, user_id, caption, image_url, likes_count, comments_count, created_at)
likes (id, user_id, post_id, created_at)
comments (id, post_id, user_id, text, created_at)

-- Redis (temporary solution, will be replaced in Tier 2)
feed:{user_id} -> sorted set of post_ids (score = timestamp)

-- Cassandra (post details with denormalization)
posts_denormalized (
  post_id UUID,
  user_id UUID,
  username TEXT,
  avatar_url TEXT,
  caption TEXT,
  image_urls MAP<TEXT, TEXT>, -- {original, large, thumbnail}
  likes_count INT,
  comments_count INT,
  created_at TIMESTAMP,
  PRIMARY KEY (post_id)
)
```

#### Image Upload Flow:

1. User uploads image → S3/MinIO (original)
2. Background job generates 3 sizes:
   - Thumbnail: 150x150
   - Medium: 640x640
   - Large: 1080x1080
3. Store all URLs in database
4. Serve via CDN

#### API Endpoints:

- `POST /api/auth/register` & `/api/auth/login`
- `POST /api/posts` - Upload image and create post
- `GET /api/feed?page=1&limit=20` - Get user's feed (simple pull for now)
- `POST /api/posts/:id/like` - Like a post
- `POST /api/posts/:id/comment` - Comment on post
- `POST /api/users/:id/follow` - Follow a user
- `GET /api/users/:id/posts` - Get user's posts

#### Success Criteria:

- Image upload and processing within 5 seconds
- Feed loads within 1 second for users following < 100 people
- Proper image optimization (thumbnails < 50KB)

---

### **Tier 2: Fan-Out on Write Implementation** (Week 2)

**Backend Focus: Push Model, Kafka-Based Fan-Out, High Volume**

#### Fan-Out Architecture:

**When user posts:**

1. Save post to database
2. Publish `post.created` event to Kafka
3. **Fan-out worker** (Kafka consumer):
   - Query all followers of the poster
   - Write post_id to each follower's feed in Redis
   - Use Redis sorted sets: `feed:{user_id}` (score = timestamp)
   - Process in batches (1000 followers at a time)

#### Handling Celebrity Users:

**Problem**: User with 10M followers = 10M Redis writes per post

**Solutions to implement**:

1. **Hybrid Approach**:
   - Regular users (< 10K followers): Full fan-out
   - Celebrity users (> 10K followers): Partial fan-out + on-demand pull
   - Flag in database: `users.is_celebrity BOOLEAN`
2. **Asynchronous Fan-Out**:
   - Don't block post creation on fan-out completion
   - Show post to poster immediately
   - Fan-out happens in background (Kafka workers)
3. **Feed Merge Strategy**:
   - Store celebrity posts separately: `celebrity_posts` Redis list
   - On feed load: Merge user's fan-out feed + recent celebrity posts

#### Kafka Setup:

**Topics**:

- `post-created` (partitioned by user_id)
- `feed-fanout-tasks` (fan-out jobs)
- `engagement-events` (likes, comments for analytics)

**Consumers**:

- **Fan-out Worker** (10 instances for parallelism)
  - Reads `post-created`
  - Writes to Redis feeds
  - Monitors: processing time, backlog
- **Analytics Worker**
  - Aggregates engagement metrics
  - Updates posts table (likes_count, comments_count)

#### High Volume Data Simulation:

```javascript
Seed Data:
- 500,000 users
- Follow distribution (power law):
  - 90% users have 10-1000 followers
  - 9% users have 1K-100K followers
  - 1% users have 100K-10M followers (celebrities)
- 10 million posts (distributed over 6 months)
- 100 million likes
- 50 million comments
- 250 million follow relationships
```

#### Feed Loading Optimization:

```javascript
GET /api/feed?cursor=TIMESTAMP&limit=20

1. Fetch post_ids from Redis: ZREVRANGEBYSCORE feed:{user_id} +inf (cursor) LIMIT 20
2. Batch fetch post details from Cassandra (avoid N+1 queries)
3. Hydrate with user info (avatar, username) - use Redis cache
4. Return posts + nextCursor
```

#### Success Criteria:

- Post creation completes within 500ms (don't wait for fan-out)
- Fan-out to 100K followers completes within 30 seconds
- Feed loads in < 1 second for users following 500 people
- Kafka consumer lag < 1000 messages

---

### **Tier 3: AI Features + Performant Feed UI** (Week 3)

**AI Integration + Frontend Optimization**

#### AI-Powered Features:

1. **Automatic Image Tagging** (Gemini Vision):

   - Analyze uploaded images
   - Generate tags (e.g., "sunset", "beach", "food")
   - Store in `post_tags` table for discovery
   - Endpoint: Tags generated automatically on upload

2. **Smart Caption Generation**:

   - AI suggests captions based on image content
   - Endpoint: `POST /api/posts/suggest-caption` (with image)
   - User can accept or modify suggestion

3. **Content Recommendations**:

   - "Discover" feed showing relevant posts from non-followed users
   - Use AI to analyze user's liked posts and viewing history
   - Generate embeddings for user preferences
   - Endpoint: `GET /api/discover?limit=20`
   - Refresh every 6 hours

4. **Content Moderation** (AI):

   - Detect NSFW content, violence, hate symbols
   - Flag posts for admin review
   - Use Gemini/OpenAI moderation API + custom ML model

5. **Smart Hashtag Suggestions**:
   - Analyze caption and image
   - Suggest relevant hashtags
   - Show trending hashtags in user's network

#### Frontend: Infinite Scroll Feed

**Challenge**: Smoothly display 10,000 posts with images without lag

**Implementation**:

- **Intersection Observer API**:
  - Load more posts when scrolling near bottom (prefetch)
  - Lazy load images when they enter viewport
- **Image Optimization**:
  - Show thumbnail first (blur-up effect)
  - Load medium size when in viewport
  - Prefetch next 5 images while scrolling
- **Virtual Scrolling** (optional for very long feeds):
  - Use `react-virtuoso` to unmount off-screen posts
  - Maintain scroll position
- **Optimistic Updates**:
  - Like button responds immediately
  - Send API request in background
  - Rollback on failure
- **Client-Side Caching**:
  - Use React Query to cache feed pages
  - Background refetch every 2 minutes
  - Invalidate on new post creation

#### Feed Loading Strategy:

```javascript
// Cursor-based pagination
const [posts, setPosts] = useState([]);
const [cursor, setCursor] = useState(null);

const loadMore = async () => {
  const response = await fetch(`/api/feed?cursor=${cursor}&limit=20`);
  const { posts: newPosts, nextCursor } = await response.json();
  setPosts([...posts, ...newPosts]);
  setCursor(nextCursor);
};

// Intersection Observer for infinite scroll
const { ref, inView } = useInView({ threshold: 0.5 });
useEffect(() => {
  if (inView) loadMore();
}, [inView]);
```

#### Success Criteria:

- Feed scrolls at 60 FPS even with 1000+ posts loaded
- Images lazy load smoothly (no layout shift)
- AI caption suggestions return within 2 seconds
- Discover feed shows relevant content (based on user feedback)

---

### **Tier 4: Admin Dashboard + Advanced Analytics** (Week 4)

**Real-Time Monitoring + Engagement Analytics**

#### Admin Dashboard Features:

1. **Real-Time Activity Monitor**:

   - Posts per second (live line chart)
   - Active users (WebSocket updates)
   - Feed fan-out queue depth (Kafka lag)
   - CDN bandwidth usage

2. **Engagement Analytics**:

   - **Post Performance**:
     - Top posts by likes/comments (leaderboard)
     - Engagement rate by time of day (heatmap)
     - Average likes per post by user tier
     - Viral posts (exponential engagement growth)
   - **User Analytics**:
     - Most followed users (leaderboard)
     - User growth over time (new signups)
     - Follower/following ratio distribution
     - Churn rate (inactive users)
   - **Content Analytics**:
     - Most popular hashtags (word cloud)
     - Image category distribution (AI tags)
     - Post caption length vs engagement (scatter plot)
     - Comment sentiment analysis (AI)

3. **Content Moderation Dashboard**:

   - Queue of flagged posts (AI-detected violations)
   - Review interface (approve/remove/ban user)
   - Moderation history and appeals
   - False positive rate tracking

4. **System Performance**:

   - Feed generation time percentiles (P50, P95, P99)
   - Kafka consumer throughput
   - Redis memory usage and hit rate
   - CDN cache hit ratio

5. **Predictive Analytics** (AI):
   - Forecast daily post volume (next 7 days)
   - Predict which posts will go viral (engagement spike)
   - Identify emerging trends (hashtags, topics)
   - User retention predictions (who might churn)

#### Implementation:

- **Materialized Views**:
  - `analytics_daily_posts` (date, total_posts, total_likes, total_comments)
  - `analytics_user_engagement` (user_id, posts_count, avg_likes, last_active)
  - `analytics_trending_hashtags` (hashtag, post_count, period)
- **Stream Processing**:
  - Kafka Streams for real-time aggregations
  - Window functions for time-based metrics
- **Batch Jobs**:
  - Daily: Engagement reports, user cohorts
  - Hourly: Trending content, moderation queue updates
  - Every 10 minutes: Active user counts, post rates

#### Dashboard UI:

- Real-time charts (auto-refresh every 5 seconds)
- Date range filters (24h, 7d, 30d, custom)
- Drill-down capabilities (click chart → see details)
- Export reports as CSV/PDF
- Virtual scrolling for large tables (flagged content, user lists)

#### Success Criteria:

- Dashboard loads analytics for 10M posts in < 3 seconds
- Real-time metrics update with < 1 second latency
- Admin can review 5000 flagged posts efficiently
- AI trend predictions identify 80%+ of viral posts early

---

## Data Volume Simulation Strategy

### Initial Seed:

```javascript
- 500,000 users (realistic profiles with avatars)
- Follow graph:
  - 90% users: 10-1000 followers (normal distribution)
  - 9% users: 1K-100K followers (influencers)
  - 1% users: 100K-10M followers (celebrities)
- 10,000,000 posts (past 6 months)
- 100,000,000 likes (20% of users like 30% of posts they see)
- 50,000,000 comments (10% of users comment on 5% of posts)
- 250,000,000 follow relationships
```

### Distribution Patterns:

- **Temporal**: 60% posts during 6pm-11pm, 30% during 11am-6pm, 10% overnight
- **Engagement**: Power law (1% posts get 80% of engagement)
- **Image Types**: 40% photos, 30% selfies, 20% food, 10% other

### Load Testing:

- **Concurrent Users**: 50,000 browsing feeds
- **Post Creation Rate**: 100 posts/second sustained
- **Celebrity Post Burst**: 1 post from 10M-follower user (fan-out stress test)
- **Tools**: k6, Gatling, custom scripts

---

## Key Learning Outcomes

1. **Fan-Out Architecture**: Understanding push vs pull models
2. **Kafka Stream Processing**: Event-driven fan-out at scale
3. **CDN Integration**: Image optimization and delivery
4. **Celebrity User Problem**: Hybrid strategies for skewed distributions
5. **AI for Content**: Image analysis, recommendations, moderation
6. **Frontend Performance**: Lazy loading, infinite scroll, virtual rendering

---

## Evaluation Criteria

- **Architecture Document**: Detailed explanation of fan-out strategy and trade-offs
- **Scalability**: Handle celebrity post (10M followers) without system degradation
- **Performance**: Feed loads in < 1s, images lazy load smoothly
- **AI Integration**: Accurate tagging and relevant recommendations
- **Code Quality**: Clean Kafka consumers, efficient Redis operations
- **Testing**: Unit tests, integration tests, load tests with metrics

---

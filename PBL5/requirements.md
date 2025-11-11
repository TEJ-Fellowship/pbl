# Backend-Heavy Project Catalog: 10 Progressive Projects

---

# Project 1: Real-Time Movie Ticket Booking System

## Project Overview

Build a scalable movie ticket booking platform that handles high-concurrency scenarios (flash sales for blockbuster movies), prevents double-booking through distributed locking, and uses Kafka for event-driven architecture. The system will handle ticket reservations, payments, and seat management across multiple theaters showing different movies.

---

## Tech Stack

- **Backend**: Node.js + Express/Fastify
- **Database**: PostgreSQL (transactional data), Redis (distributed locks, caching)
- **Message Queue**: Kafka (event streaming)
- **AI Integration**: Gemini/OpenAI for intelligent recommendations and dynamic pricing
- **Frontend**: React (for the admin dashboard and user booking interface)
- **Monitoring**: Prometheus + Grafana (optional but recommended)

---

## Roles

1. **Customer** - Browse movies, book tickets, view booking history
2. **Admin** - Manage theaters, movies, showtimes, view analytics dashboard

---

## Progressive Tier Requirements

### **Tier 1: Core Booking System** (Week 1)

**Backend Focus: Basic CRUD + Reservation Logic**

#### Features:

- User authentication (JWT-based)
- Theater, Movie, and Showtime management (Admin)
- Seat inventory management
- Basic ticket booking with seat selection
- Prevent double-booking using PostgreSQL row-level locking
- Simple booking confirmation

#### Database Schema:

- `users` (id, name, email, role, password_hash)
- `theaters` (id, name, location, total_seats)
- `movies` (id, title, description, duration, genre, poster_url)
- `showtimes` (id, movie_id, theater_id, show_time, price)
- `seats` (id, showtime_id, seat_number, status: available/reserved/booked)
- `bookings` (id, user_id, showtime_id, seats[], status, created_at)

#### API Endpoints:

- `POST /api/auth/register` & `/api/auth/login`
- `GET /api/movies` - List all movies
- `GET /api/showtimes?movie_id=X` - Get showtimes for a movie
- `GET /api/seats/:showtime_id` - Get seat availability
- `POST /api/bookings/reserve` - Reserve seats (5-minute hold)
- `POST /api/bookings/confirm` - Confirm booking (payment simulation)
- `GET /api/bookings/my-bookings` - User's booking history

#### Success Criteria:

- No double-booking under concurrent requests
- Seat reservations expire after 5 minutes
- Basic error handling and validation

---

### **Tier 2: Event-Driven Architecture + High Volume Simulation** (Week 2)

**Backend Focus: Kafka Integration + Performance Testing**

#### Features:

- **Kafka Integration**:
  - Producer: Emit events on booking actions (`booking.reserved`, `booking.confirmed`, `booking.cancelled`)
  - Consumers:
    - Email notification service (simulate sending emails)
    - Analytics service (aggregate booking data)
    - Inventory update service (sync seat status)
- **Distributed Locking**: Use Redis for seat reservation locks (replace PostgreSQL locks for better performance)
- **High Volume Data Simulation**:
  - Seed script to create 100 theaters, 500 movies, 10,000 showtimes
  - Generate 1 million historical bookings (past 6 months)
  - Use Faker.js for realistic data generation
- **Load Testing**: Use Apache JMeter or k6 to simulate 1000 concurrent users booking tickets

#### New Features:

- Waiting list for sold-out shows
- Automatic seat release after reservation timeout (Kafka consumer + Redis TTL)
- Idempotency keys for payment confirmation (prevent duplicate bookings)

#### Kafka Topics:

- `booking-events` (all booking lifecycle events)
- `notification-events` (email, SMS triggers)
- `analytics-events` (data for reporting)

#### Success Criteria:

- Handle 1000 concurrent booking requests without data corruption
- Event processing latency < 100ms
- Graceful degradation under load (queue requests if overwhelmed)

---

### **Tier 3: AI-Powered Features + Advanced Frontend** (Week 3)

**AI Integration + Performant Data Display**

#### AI-Powered Features:

1. **Smart Recommendations** (Gemini/OpenAI):

   - Analyze user's booking history
   - Recommend movies based on genre preferences, showtimes, and theater proximity
   - Endpoint: `GET /api/recommendations` (returns personalized movie suggestions)

2. **Dynamic Pricing** (AI-driven):

   - Use AI to suggest optimal ticket prices based on:
     - Seat occupancy rate
     - Time until showtime
     - Historical demand patterns
   - Endpoint: `GET /api/pricing/suggest?showtime_id=X`

3. **Chatbot Support**:
   - AI assistant to help users find movies, check seat availability
   - Endpoint: `POST /api/chatbot/query` (processes natural language queries)

#### Frontend: Performant Showtime Browser

**Challenge**: Display 10,000 showtimes with filters/sorting without lag

**Implementation**:

- **Virtual Scrolling**: Use `react-window` or `react-virtualized` to render only visible rows
- **Server-Side Filtering/Sorting**:
  - `GET /api/showtimes?movie_id=X&date=Y&theater=Z&sort=price&page=1&limit=50`
  - Return paginated results with total count
- **Debounced Search**: Filter showtimes by movie name with 300ms debounce
- **Optimistic UI Updates**: Show reserved seats instantly, rollback on error
- **Client-Side Caching**: Use React Query for caching and background refetching

#### Filters & Sorting:

- Filter by: Date, Theater, Genre, Price Range, Seat Availability
- Sort by: Price (low to high), Showtime (earliest first), Popularity

#### Success Criteria:

- Page load time < 2 seconds with 10,000 showtimes
- Smooth scrolling (60 FPS) even with large datasets
- AI recommendations return within 1 second

---

### **Tier 4: Admin Dashboard + Advanced Analytics** (Week 4)

**Data Analytics + Real-Time Monitoring**

#### Admin Dashboard Features:

1. **Real-Time Booking Monitor**:

   - Live feed of bookings (WebSocket/Server-Sent Events)
   - Show current occupancy rates for all active showtimes
   - Alert for low-occupancy shows (AI suggestion to reduce price)

2. **Analytics Dashboard**:
   - **Revenue Analytics**:
     - Total revenue by day/week/month (line chart)
     - Revenue breakdown by movie, theater, genre (pie chart)
     - Average ticket price trends
   - **Booking Analytics**:
     - Most popular movies (bar chart)
     - Peak booking hours (heatmap)
     - Conversion rate (reservations → confirmed bookings)
     - Cancellation rate by movie/theater
   - **User Analytics**:
     - New vs returning customers
     - User lifetime value (total spent)
     - Most active users (leaderboard)
3. **Predictive Insights** (AI):
   - Forecast demand for upcoming shows
   - Suggest optimal show timings based on historical data
   - Identify underperforming movies (recommend discontinuation)

#### Implementation:

- **Data Aggregation**: Use Kafka consumers to build materialized views in PostgreSQL
  - `analytics_daily_revenue` (date, total_revenue, bookings_count)
  - `analytics_movie_performance` (movie_id, total_bookings, total_revenue)
- **Real-Time Updates**: Use WebSocket to push live booking events to admin dashboard
- **Batch Processing**: Nightly cron job to compute heavy analytics (user segmentation, trends)

#### Dashboard UI:

- Charts: Use Recharts or Chart.js
- Tables: Virtual scrolling for large datasets (e.g., all bookings)
- Filters: Date range picker, movie/theater selector
- Export: Download reports as CSV/PDF

#### Success Criteria:

- Dashboard loads analytics for 1M+ bookings in < 3 seconds
- Real-time booking feed updates within 500ms
- AI predictions achieve 70%+ accuracy

---

## Data Volume Simulation Strategy

### Initial Seed (Development):

```javascript
// Run once to populate database
- 100 theaters (10 cities, 10 theaters each)
- 500 movies (various genres, ratings)
- 10,000 showtimes (next 30 days)
- 1,000,000 historical bookings (past 6 months)
- 50,000 users (mix of active/inactive)
```

### Continuous Load (Testing):

- **Script**: Node.js script that continuously creates bookings (100 bookings/minute)
- **Kafka Load**: Publish 1000 events/second to test consumer throughput
- **Redis Stress Test**: Simulate 10,000 concurrent seat locks

### Tools:

- **Faker.js**: Generate realistic names, emails, dates
- **Data Generator Script**: Custom Node.js script using pg-promise for bulk inserts
- **k6/Apache JMeter**: Simulate concurrent user traffic

---

## Key Learning Outcomes

1. **Distributed Systems**: Kafka, Redis, event-driven architecture
2. **Concurrency Handling**: Locks, idempotency, race conditions
3. **Performance Optimization**: Indexing, caching, query optimization
4. **AI Integration**: Practical use of LLMs for recommendations/pricing
5. **Frontend Performance**: Virtual scrolling, pagination, debouncing
6. **System Design**: Database schema design, API design, scalability patterns

---

## Evaluation Criteria

- **Code Quality**: Clean, modular, well-documented code
- **System Design**: Proper database indexing, efficient queries, scalable architecture
- **Testing**: Unit tests (Jest), integration tests, load tests
- **Documentation**: API docs (Swagger), architecture diagram, setup instructions
- **Demo**: Live demonstration handling 500 concurrent booking requests

---

---

# Project 2: Scalable Real-Time Chat System (WhatsApp Clone)

## Project Overview

Build a production-grade 1-1 chat system that handles millions of messages, implements proper message storage strategies, real-time delivery, and message search. Focus on choosing the right database architecture and implementing features like typing indicators, message status (sent/delivered/read), and efficient message pagination.

---

## Tech Stack

- **Backend**: Node.js + Socket.io/WebSocket
- **Database**: Cassandra/ScyllaDB (message storage) + PostgreSQL (user data) + Redis (online status, typing indicators)
- **Message Queue**: Kafka (message delivery, offline message queue)
- **AI Integration**: Gemini/OpenAI for smart replies, message summarization, and content moderation
- **Storage**: S3/MinIO for media files
- **Frontend**: React with Socket.io client

---

## Roles

1. **User** - Send/receive messages, search conversations, manage contacts
2. **Admin** - Monitor system health, view chat analytics, moderate content

---

## Progressive Tier Requirements

### **Tier 1: Core Chat Functionality** (Week 1)

**Backend Focus: Real-Time Messaging + Database Design**

#### Features:

- User authentication and profile management
- 1-1 chat initialization
- Real-time message sending/receiving (WebSocket)
- Message persistence with proper timestamps
- Basic message history retrieval (last 50 messages)
- Online/offline status indicators

#### Database Schema Research:

**Students must research and justify their choice:**

- **Option 1: Cassandra/ScyllaDB** (wide-column, optimized for write-heavy workloads)
  - Partition key: conversation_id
  - Clustering key: timestamp (DESC)
  - Excellent for message retrieval by conversation
- **Option 2: MongoDB** (document store, flexible schema)
  - Collection per conversation or single messages collection
- **Option 3: PostgreSQL with TimescaleDB** (time-series extension)
  - Optimized for time-based queries

**Required Deliverable**: 2-page document justifying database choice with:

- Write/read patterns analysis
- Scalability considerations
- Query performance benchmarks

#### Core Schema (Cassandra example):

```sql
-- Users table (PostgreSQL)
users (id, username, email, password_hash, avatar_url, created_at)

-- Messages table (Cassandra)
messages (
  conversation_id UUID,
  message_id TIMEUUID,
  sender_id UUID,
  content TEXT,
  message_type TEXT, -- text/image/video
  status TEXT, -- sent/delivered/read
  created_at TIMESTAMP,
  PRIMARY KEY (conversation_id, message_id)
) WITH CLUSTERING ORDER BY (message_id DESC);

-- Conversations table (PostgreSQL)
conversations (id, user1_id, user2_id, last_message_at, created_at)
```

#### API Endpoints:

- `POST /api/auth/register` & `/api/auth/login`
- `GET /api/conversations` - List user's conversations
- `POST /api/conversations` - Start new conversation
- `GET /api/messages/:conversation_id?limit=50&before=timestamp` - Paginated messages
- WebSocket events: `message:send`, `message:receive`, `status:update`

#### Success Criteria:

- Messages delivered within 100ms on local network
- Proper message ordering (no race conditions)
- Handle reconnection gracefully

---

### **Tier 2: Advanced Features + High Volume Simulation** (Week 2)

**Backend Focus: Typing Indicators, Message Status, Kafka Integration**

#### Features:

- **Real Typing Indicators** (NOT FAKED):
  - Use Redis pub/sub for typing events
  - Throttle typing events (max 1 per second per user)
  - Auto-expire typing status after 3 seconds
  - WebSocket event: `typing:start`, `typing:stop`
- **Message Status Tracking**:
  - Sent: Message saved to database
  - Delivered: Recipient's client acknowledged receipt
  - Read: Recipient opened conversation
  - Use Kafka for status update events
- **Message Pagination (Infinite Scroll)**:
  - Load messages in batches of 50
  - Cursor-based pagination using timestamps
  - Prefetch next batch when scrolling near bottom
- **Message Search**:
  - Full-text search across conversations
  - Use Elasticsearch or PostgreSQL full-text search
  - Search by keyword, sender, date range

#### Kafka Integration:

- **Topics**:
  - `message-events` (new messages)
  - `status-events` (delivery/read receipts)
  - `typing-events` (typing indicators)
- **Consumers**:
  - Offline message queue (store for disconnected users)
  - Analytics service (message volume, active users)
  - Notification service (push notifications)

#### High Volume Data Simulation:

- **Seed Data**:
  - 100,000 users
  - 500,000 conversations (random pairs)
  - 50 million messages (distributed over past year)
  - Realistic message patterns (bursts during peak hours)
- **Load Generation Script**:
  - Simulate 10,000 concurrent connections
  - Send 1,000 messages/second
  - Random typing indicators

#### Success Criteria:

- Typing indicators appear within 200ms
- Message status updates propagate within 500ms
- Search returns results within 1 second for 50M messages
- System handles 10,000 concurrent WebSocket connections

---

### **Tier 3: AI Features + Performant Message Feed** (Week 3)

**AI Integration + Frontend Performance**

#### AI-Powered Features:

1. **Smart Reply Suggestions** (Gemini/OpenAI):

   - Analyze last 3 messages in conversation
   - Suggest 3 contextually relevant quick replies
   - Endpoint: `GET /api/smart-replies/:conversation_id`
   - Cache suggestions in Redis (5-minute TTL)

2. **Message Summarization**:

   - Summarize long conversations (100+ messages)
   - Generate bullet-point summary of key topics discussed
   - Endpoint: `POST /api/conversations/:id/summarize`
   - Use streaming API for real-time summary generation

3. **Content Moderation** (AI):

   - Detect and flag inappropriate content (hate speech, spam)
   - Use Gemini/OpenAI moderation API
   - Kafka consumer processes all messages asynchronously
   - Admin dashboard shows flagged messages

4. **Smart Search**:
   - Semantic search using embeddings
   - "Find messages about vacation plans" (not just keyword match)
   - Use OpenAI embeddings + vector database (Pinecone/Qdrant)

#### Frontend: Performant Message List

**Challenge**: Display 50,000 messages in a conversation without lag

**Implementation**:

- **Virtual Scrolling**: Use `react-virtuoso` or `react-window`
  - Only render visible messages (~20-30 at a time)
  - Dynamic row heights for variable message lengths
- **Optimistic UI**:
  - Show sent messages immediately (with "sending" indicator)
  - Rollback if send fails
- **Image Lazy Loading**:
  - Load images only when scrolling into view
  - Use placeholder thumbnails
  - CDN for media files
- **Infinite Scroll**:
  - Load previous messages when scrolling to top
  - Maintain scroll position after loading
- **Message Grouping**:
  - Group consecutive messages by same sender
  - Show timestamps for first message in group

#### API Optimizations:

- `GET /api/messages/:conversation_id?cursor=TIMESTAMP&limit=50`
- Response includes: messages[], nextCursor, hasMore
- Use database indexes: `(conversation_id, created_at DESC)`

#### Success Criteria:

- Smooth 60 FPS scrolling through 50K messages
- Initial load < 1 second
- AI smart replies return within 2 seconds
- Image lazy loading saves 80%+ bandwidth on initial load

---

### **Tier 4: Admin Dashboard + Analytics** (Week 4)

**Real-Time Monitoring + Message Analytics**

#### Admin Dashboard Features:

1. **Real-Time Activity Monitor**:

   - Live active users count (WebSocket updates)
   - Messages sent per second (line chart)
   - Average message delivery time
   - WebSocket connection health

2. **Message Analytics**:

   - **Volume Metrics**:
     - Total messages by day/week/month (area chart)
     - Peak hours heatmap (24-hour view)
     - Messages per conversation (distribution histogram)
     - Average message length trends
   - **User Engagement**:
     - Most active users (leaderboard)
     - Daily/monthly active users (DAU/MAU)
     - User retention rate (cohort analysis)
     - Average session duration
   - **Content Analysis**:
     - Most common words/phrases (word cloud)
     - Message type distribution (text vs media)
     - Response time distribution (how fast users reply)

3. **Content Moderation Dashboard**:

   - Flagged messages queue (AI-detected violations)
   - Review interface (approve/delete/ban user)
   - Moderation actions log
   - False positive rate tracking

4. **System Health**:

   - Kafka consumer lag monitoring
   - Database query performance (slow queries)
   - Redis memory usage
   - WebSocket connection errors

5. **Predictive Analytics** (AI):
   - Forecast daily message volume (next 7 days)
   - Identify users at risk of churning (low activity)
   - Detect conversation patterns (who talks to whom frequently)

#### Implementation:

- **Data Aggregation**:
  - Kafka consumers write to `analytics_*` tables
  - Materialized views for fast dashboard queries
  - Time-series tables for historical trends
- **Real-Time Updates**:
  - WebSocket for live metrics
  - Server-Sent Events for analytics updates
- **Batch Jobs**:
  - Daily: User engagement calculations, retention cohorts
  - Hourly: Top conversations, content analysis
  - Every 5 minutes: Active user counts, message rates

#### Dashboard UI:

- Real-time charts with auto-refresh
- Date range selector (last 7/30/90 days)
- Export analytics as CSV/PDF
- Virtual scrolling for large tables (flagged messages, user lists)

#### Success Criteria:

- Dashboard loads metrics for 50M messages in < 3 seconds
- Real-time metrics update with < 500ms latency
- Admin can review 1000 flagged messages efficiently (virtual scroll)
- AI forecasting achieves 85%+ accuracy

---

## Data Volume Simulation Strategy

### Initial Seed:

```javascript
- 100,000 users (realistic names, avatars)
- 500,000 conversations (random pairings, weighted by activity)
- 50,000,000 messages (past 12 months, clustered around peak hours)
- 2,000,000 media files (images, videos) in S3/MinIO
```

### Distribution Patterns:

- **Temporal**: 70% messages during 9am-11pm, 30% overnight
- **User Activity**: Pareto distribution (20% users send 80% messages)
- **Conversation Length**: Exponential decay (most conversations < 100 messages)

### Load Testing:

- **Concurrent Users**: 10,000 WebSocket connections
- **Message Rate**: 1,000 messages/second sustained
- **Burst Testing**: 5,000 messages/second for 1 minute
- **Tools**: Artillery.io, k6, custom Socket.io load tester

---

## Key Learning Outcomes

1. **Database Selection**: Understanding trade-offs between NoSQL/SQL for chat systems
2. **Real-Time Systems**: WebSocket architecture, connection management
3. **Distributed Systems**: Kafka for event streaming, Redis for ephemeral data
4. **Search Optimization**: Full-text search, semantic search with embeddings
5. **Frontend Performance**: Virtual scrolling, optimistic UI, lazy loading
6. **AI Integration**: Smart replies, content moderation, embeddings

---

## Evaluation Criteria

- **Database Justification**: Well-researched document with benchmarks
- **Real-Time Performance**: Typing indicators and message delivery latency
- **Scalability**: Handle 10K concurrent users without degradation
- **Code Quality**: Clean WebSocket handlers, proper error handling
- **UI Performance**: Smooth scrolling through large message lists
- **Testing**: Unit tests, WebSocket integration tests, load tests

---

---

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

---

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

---

# Project 5: Real-Time Gaming Leaderboard System

## Project Overview

Build a massively scalable real-time leaderboard system for an MMORPG (Massively Multiplayer Online Role-Playing Game). The system must handle millions of score updates per minute, provide instant global rankings, support multiple game modes, and implement intelligent caching strategies to serve leaderboards with minimal latency.

---

## Tech Stack

- **Backend**: Node.js + Express + Socket.io (for real-time updates)
- **Database**: PostgreSQL (persistent storage) + Redis (in-memory leaderboards with sorted sets)
- **Message Queue**: Kafka (score update events, analytics)
- **Cache**: CDN (CloudFront/Cloudflare) for cached leaderboard snapshots
- **AI Integration**: Gemini/OpenAI for cheat detection, player skill prediction, and matchmaking recommendations
- **Frontend**: React with real-time WebSocket updates

---

## Roles

1. **Player** - Submit scores, view leaderboards, see personal stats
2. **Admin** - Monitor game health, detect cheaters, view analytics dashboard

---

## Progressive Tier Requirements

### **Tier 1: Core Leaderboard System** (Week 1)

**Backend Focus: Score Submission + Basic Leaderboard**

#### Features:

- Player authentication and profiles
- Submit scores for completed game sessions
- Global leaderboard (top 100 players)
- Player's personal rank and score
- Multiple game modes (Deathmatch, Capture the Flag, Raid)
- Basic anti-cheat validation (score limits, time checks)

#### Database Schema:

```sql
-- PostgreSQL (persistent storage)
players (
  id UUID PRIMARY KEY,
  username TEXT UNIQUE,
  email TEXT,
  level INT,
  total_score BIGINT DEFAULT 0,
  games_played INT DEFAULT 0,
  created_at TIMESTAMP
)

game_modes (
  id INT PRIMARY KEY,
  name TEXT, -- 'Deathmatch', 'Capture the Flag', 'Raid'
  max_score_per_game INT, -- Anti-cheat limit
  avg_game_duration_minutes INT
)

score_submissions (
  id UUID PRIMARY KEY,
  player_id UUID,
  game_mode_id INT,
  score INT,
  game_duration_seconds INT,
  submitted_at TIMESTAMP,
  is_valid BOOLEAN DEFAULT true, -- Flagged by anti-cheat
  INDEX idx_player_scores (player_id, submitted_at DESC)
)

-- Redis (in-memory leaderboards)
Key: leaderboard:{game_mode_id}:global
Type: Sorted Set (ZADD, ZREVRANGE)
Members: player_id
Scores: total_score

Key: leaderboard:{game_mode_id}:daily
Type: Sorted Set
Score: daily total

Key: player:{player_id}:stats
Type: Hash (games_played, total_score, avg_score, etc.)
```

#### Core Leaderboard Operations:

```javascript
// Submit score
1. Validate score (not exceeding max_score_per_game)
2. Save to PostgreSQL: score_submissions table
3. Update Redis sorted set: ZINCRBY leaderboard:global player_id score
4. Update player stats: HINCRBY player:{id}:stats total_score score

// Get global leaderboard (top 100)
ZREVRANGE leaderboard:{game_mode}:global 0 99 WITHSCORES

// Get player rank
ZREVRANK leaderboard:{game_mode}:global player_id

// Get player's score
ZSCORE leaderboard:{game_mode}:global player_id
```

#### API Endpoints:

- `POST /api/auth/register` & `/api/auth/login`
- `POST /api/scores/submit` - Submit game score
- `GET /api/leaderboard/:game_mode?limit=100` - Get top players
- `GET /api/players/:id/rank/:game_mode` - Get player's rank
- `GET /api/players/:id/stats` - Get player statistics
- `GET /api/game-modes` - List available game modes

#### Basic Anti-Cheat:

```javascript
async function validateScore(playerId, gameMode, score, duration) {
  // Check 1: Score not exceeding maximum
  if (score > gameMode.max_score_per_game) {
    return { valid: false, reason: "Score exceeds maximum" };
  }

  // Check 2: Game duration reasonable
  const expectedDuration = gameMode.avg_game_duration_minutes * 60;
  if (duration < expectedDuration * 0.3 || duration > expectedDuration * 3) {
    return { valid: false, reason: "Suspicious game duration" };
  }

  // Check 3: Submission frequency (max 1 game per minute)
  const lastSubmission = await getLastSubmissionTime(playerId);
  if (Date.now() - lastSubmission < 60000) {
    return { valid: false, reason: "Too many submissions" };
  }

  return { valid: true };
}
```

#### Success Criteria:

- Score submission completes within 100ms
- Leaderboard retrieval completes within 50ms (Redis)
- Player rank lookup completes within 10ms
- Basic cheat detection flags suspicious scores

---

### **Tier 2: Real-Time Updates + High Volume Simulation** (Week 2)

**Backend Focus: Kafka Integration, Massive Scale, Time-Windowed Leaderboards**

#### Real-Time Score Updates:

**Architecture**:

1. Player submits score → API server
2. API publishes to Kafka: `score-submitted` event
3. Kafka consumers:
   - **Leaderboard updater**: Updates Redis sorted sets
   - **Analytics processor**: Aggregates statistics
   - **Anti-cheat analyzer**: Detects patterns
4. WebSocket broadcasts rank changes to connected clients

#### Multiple Leaderboard Types:

1. **Global All-Time**: Total cumulative scores
2. **Daily**: Scores reset at midnight UTC
3. **Weekly**: Scores reset every Monday
4. **Monthly**: Scores reset first of month
5. **Seasonal**: 3-month competitive seasons

**Redis Key Structure**:

```
leaderboard:{game_mode}:global
leaderboard:{game_mode}:daily:2024-01-15
leaderboard:{game_mode}:weekly:2024-W03
leaderboard:{game_mode}:monthly:2024-01
leaderboard:{game_mode}:season:S1-2024
```

#### Time-Windowed Leaderboards:

```javascript
// Daily leaderboard update
async function updateDailyLeaderboard(playerId, gameMode, score) {
  const today = new Date().toISOString().split("T")[0];
  const key = `leaderboard:${gameMode}:daily:${today}`;

  // Add to today's leaderboard
  await redis.zincrby(key, score, playerId);

  // Set expiration (7 days after creation)
  await redis.expire(key, 7 * 24 * 60 * 60);
}

// Weekly reset (cron job at midnight Sunday)
async function resetWeeklyLeaderboards() {
  const lastWeek = getLastWeekIdentifier(); // '2024-W02'
  const thisWeek = getThisWeekIdentifier(); // '2024-W03'

  // Archive last week's leaderboards to PostgreSQL
  await archiveLeaderboard(`leaderboard:*:weekly:${lastWeek}`);

  // Initialize new week's leaderboards (empty sorted sets)
  // They'll populate as scores come in
}
```

#### Kafka Integration:

**Topics**:

- `score-submitted` (partitioned by game_mode for parallelism)
- `leaderboard-updated` (broadcasts rank changes for WebSocket)
- `cheat-detected` (flagged suspicious activity)
- `player-achievements` (milestone events: top 100, new high score)

**Consumers**:

1. **Leaderboard Updater** (10 instances):
   - Updates all Redis leaderboards (global, daily, weekly, etc.)
   - Publishes rank change events
2. **Analytics Aggregator**:
   - Computes statistics (avg score, percentiles, distributions)
3. **Anti-Cheat Analyzer**:
   - Detects statistical anomalies
   - Flags accounts for review

#### High Volume Data Simulation:

```javascript
Seed Data:
- 10,000,000 players (active + inactive)
- 3 game modes
- 500,000,000 historical score submissions (past 6 months)
- Realistic score distributions:
  - 60% players: 0-1000 points per game (casual)
  - 30% players: 1000-5000 points (intermediate)
  - 9% players: 5000-10000 points (advanced)
  - 1% players: 10000-15000 points (pro)
```

#### Load Generation:

- **Concurrent Score Submissions**: 10,000 scores/second
- **Peak Load**: 50,000 scores/second during major events
- **Sustained Load**: 5,000 scores/second baseline

#### Real-Time WebSocket Broadcasts:

```javascript
// When player's rank changes significantly (+/- 10 positions)
io.to(`player:${playerId}`).emit('rank_update', {
  gameMode: 'deathmatch',
  newRank: 42,
  oldRank: 53,
  score: 125000
});

// Top 10 leaderboard changes (broadcast to all)
io.emit('leaderboard_update', {
  gameMode: 'deathmatch',
  top10: [...] // Top 10 players with scores
});
```

#### CDN Caching for Leaderboards:

**Problem**: Millions of players requesting top 100 leaderboard

**Solution**: Cache leaderboard snapshots in CDN

```javascript
// API endpoint with aggressive caching
GET /api/leaderboard/:game_mode/top100
Cache-Control: public, max-age=5, s-maxage=5

// CDN caches response for 5 seconds
// Even with 1M requests/second, backend serves 1 request every 5 seconds
```

**Cache Invalidation**:

- Invalidate CDN cache when top 100 changes
- Use Kafka consumer to trigger cache purge
- Fallback: 5-second TTL ensures staleness < 5 seconds

#### Success Criteria:

- Handle 10,000 score submissions/second without lag
- Leaderboard retrieval < 50ms (Redis) or < 200ms (CDN cache hit)
- WebSocket updates propagate within 500ms
- Daily/weekly leaderboards reset automatically
- Kafka consumer lag < 1000 messages

---

### **Tier 3: AI-Powered Features + Performant Frontend** (Week 3)

**AI Integration + Real-Time UI**

#### AI-Powered Features:

1. **Cheat Detection (Anomaly Detection)**:

   - Use AI to detect statistical outliers
   - Features: score, game duration, submission frequency, score progression
   - Model: Isolation Forest or LSTM for time-series anomalies
   - Flag accounts with anomaly score > 0.8
   - Endpoint: Background Kafka consumer, no direct endpoint

2. **Skill Prediction & Rating System**:

   - Predict player skill level (ELO-style rating)
   - Use Gemini/OpenAI to analyze gameplay patterns
   - Endpoint: `GET /api/players/:id/skill-rating`
   - Update after each game submission

3. **Matchmaking Recommendations** (AI):

   - Suggest fair matches based on skill levels
   - Endpoint: `GET /api/matchmaking/find-opponents?player_id=X`
   - Return 5 players with similar skill ratings
   - Consider: game mode preference, region, recent activity

4. **Performance Insights**:

   - AI analyzes player's score history
   - Provides insights: "You perform 20% better in evening hours"
   - Endpoint: `GET /api/players/:id/insights`
   - Suggestions for improvement

5. **Predictive Analytics**:
   - Predict player's future rank based on current trajectory
   - "At your current pace, you'll reach top 1000 in 2 weeks"
   - Endpoint: `GET /api/players/:id/projections`

#### Frontend: Real-Time Leaderboard UI

**Challenge**: Display live leaderboard with 10M+ players, updating in real-time

**Implementation**:

- **Top 100 Leaderboard**:
  - Display top 100 players
  - Real-time updates via WebSocket (animate rank changes)
  - Smooth transitions (CSS animations for position changes)
  - Color coding: Green (rank up), Red (rank down), Gold (top 3)
- **Player's Current Rank**:

  - Sticky header showing player's rank, score, next milestone
  - Real-time updates when player's rank changes
  - Progress bar to next rank tier (e.g., top 100, top 50, top 10)

- **Virtual Scrolling for Large Leaderboards**:

  - If showing full leaderboard (all 10M players), use react-window
  - Cursor-based pagination: `GET /api/leaderboard/:mode?cursor=RANK&limit=100`
  - Only render visible rows (~20-30)

- **Filters and Tabs**:

  - Tabs: Global, Daily, Weekly, Monthly, Seasonal
  - Filters: Game mode, region, friends-only
  - Debounced search: Find player by username

- **Real-Time Score Feed**:

  - Live feed of recent high scores (right sidebar)
  - WebSocket stream: `recent_scores` event
  - Display: username, score, game mode, timestamp
  - Auto-scroll (pause on hover)

- **Performance Optimizations**:
  - Batch WebSocket updates (max 1 update per second per player)
  - Throttle leaderboard refreshes (max 1 refresh per 5 seconds)
  - Use React.memo for leaderboard rows (prevent unnecessary re-renders)
  - Prefetch adjacent leaderboard pages

#### API Endpoints:

- `GET /api/leaderboard/:mode?type=global|daily|weekly&cursor=RANK&limit=100`
- WebSocket events:
  - `subscribe:leaderboard` (client subscribes to updates)
  - `leaderboard_update` (server broadcasts changes)
  - `rank_change` (player-specific rank updates)
  - `recent_score` (live score feed)

#### Success Criteria:

- Leaderboard UI updates in real-time (< 500ms latency)
- Smooth animations for rank changes (60 FPS)
- Virtual scrolling handles 10M+ player leaderboard
- AI cheat detection flags 95%+ of anomalies
- Skill predictions correlate with actual performance (R² > 0.8)

---

### **Tier 4: Admin Dashboard + Advanced Analytics** (Week 4)

**Game Health Monitoring + Player Insights**

#### Admin Dashboard Features:

1. **Real-Time Game Metrics**:

   - Active players (live count via WebSocket)
   - Scores submitted per second (line chart)
   - Average game duration by mode
   - Kafka consumer lag (leaderboard updates)
   - Redis memory usage and hit rate

2. **Leaderboard Analytics**:

   - **Rank Distribution**:
     - Histogram of player scores
     - Percentile analysis (P50, P75, P90, P95, P99)
     - Score progression over time (line chart)
   - **Competition Metrics**:
     - Rank mobility (how often ranks change)
     - Top 100 turnover rate (new entrants per day)
     - Dominance score (how long players stay in top 10)
   - **Game Mode Popularity**:
     - Submissions per game mode (pie chart)
     - Peak hours by game mode (heatmap)

3. **Player Behavior Analytics**:

   - **Engagement Metrics**:
     - Daily/monthly active players (DAU/MAU)
     - Average games per player per day
     - Session duration distribution
     - Retention rate (cohort analysis)
   - **Skill Distribution**:
     - Player skill levels (beginner/intermediate/advanced/pro)
     - Skill progression curves
     - Skill vs time played (scatter plot)
   - **Churn Analysis**:
     - Players at risk of churning (low activity)
     - Reasons for churn (survey data or AI predictions)

4. **Anti-Cheat Dashboard**:

   - Flagged accounts queue (AI-detected anomalies)
   - Review interface:
     - Player's score history (graph)
     - Statistical analysis (z-scores, outliers)
     - Compare to population average
     - Actions: Clear flag, Temporary ban, Permanent ban
   - Cheat detection accuracy tracking:
     - True positives / False positives
     - Precision & recall metrics
   - Common cheat patterns (AI-identified)

5. **Leaderboard Health**:

   - Score inflation rate (average top 100 score over time)
   - Competitive balance (top 10 score gap vs average)
   - New player retention (how quickly new players climb ranks)
   - Leaderboard reset impact analysis (engagement before/after)

6. **Predictive Analytics** (AI):

   - Forecast player churn (identify at-risk players)
   - Predict seasonal leaderboard winners (top 10)
   - Identify emerging pro players (rapid skill progression)
   - Suggest leaderboard rebalancing (if score inflation detected)

7. **Economic Metrics** (if game has in-app purchases):
   - Revenue by player tier (casual vs pro)
   - Conversion rate (free to paid)
   - Lifetime value (LTV) by acquisition channel

#### Admin Actions:

- **Manual Leaderboard Adjustments**:
  - Remove cheater's scores
  - Recompute affected rankings
  - Announce corrections to players
- **Seasonal Resets**:
  - Archive current season leaderboards
  - Distribute rewards to top players
  - Reset all seasonal sorted sets
- **Event Management**:
  - Create limited-time leaderboards (weekend tournament)
  - Set special scoring rules (double points event)
  - Monitor event participation

#### Implementation:

- **Materialized Views**:
  - `analytics_daily_players` (date, game_mode, active_players, scores_submitted)
  - `analytics_score_distribution` (game_mode, score_bucket, player_count)
  - `analytics_top_players_history` (date, rank, player_id, score) -- Track top 100 over time
- **Real-Time Aggregation**:
  - Kafka Streams for windowed aggregations (scores per second, active players)
  - Redis for transient metrics (current active players)
- **Batch Jobs**:
  - Hourly: Rank distribution, cheat detection analysis
  - Daily: Player retention cohorts, engagement metrics, leaderboard snapshots
  - Weekly: Seasonal leaderboard standings, player skill ratings

#### Dashboard UI:

- **Live Monitoring Panel**:
  - Big numbers: Active players, Scores/sec, Kafka lag
  - Real-time charts (auto-refresh every 5 seconds)
  - Alert indicators (high latency, cheat spike, etc.)
- **Historical Analytics**:
  - Date range picker (7d, 30d, 90d, season, custom)
  - Comparison mode (compare two periods)
  - Drill-down capabilities (click chart → see details)
- **Cheat Review Interface**:
  - Queue of flagged accounts (sorted by anomaly score)
  - Side-by-side comparison (player vs population)
  - One-click actions (approve/ban)
  - Audit log (all admin actions)
- **Export & Reports**:
  - Download weekly/monthly reports as PDF
  - Export leaderboard snapshots as CSV
  - Scheduled email reports for stakeholders

#### Success Criteria:

- Dashboard loads analytics for 500M score submissions in < 3 seconds
- Real-time metrics update with < 1 second latency
- Admin can review and action 100 flagged accounts in < 10 minutes
- AI predictions identify 90%+ of churning players 7 days in advance
- Leaderboard health metrics detect score inflation early

---

## Data Volume Simulation Strategy

### Initial Seed:

```javascript
- 10,000,000 players (realistic usernames, skill levels)
- 3 game modes (Deathmatch, CTF, Raid)
- 500,000,000 score submissions (past 6 months)
- Score distributions:
  - Deathmatch: Mean 3000, SD 1500 (normal distribution)
  - CTF: Mean 5000, SD 2000
  - Raid: Mean 8000, SD 3000
- Temporal patterns:
  - 50% submissions during peak hours (6pm-11pm)
  - 30% during day (11am-6pm)
  - 20% overnight
```

### Realistic Player Behaviors:

- **Casual players (60%)**: 1-3 games/day, low scores
- **Regular players (30%)**: 5-10 games/day, medium scores
- **Hardcore players (9%)**: 20+ games/day, high scores
- **Pro players (1%)**: 50+ games/day, very high scores

### Load Testing Scenarios:

1. **Normal Load**: 5,000 scores/second sustained
2. **Peak Load**: 20,000 scores/second (evening rush)
3. **Event Load**: 50,000 scores/second (limited-time tournament)
4. **Leaderboard Query Storm**: 100,000 concurrent leaderboard requests

### Tools:

- k6 for HTTP load testing
- Socket.io-client for WebSocket testing
- Custom score submission simulator (Kafka producer)
- Redis benchmarking tools (redis-benchmark)

---

## Key Learning Outcomes

1. **In-Memory Data Structures**: Redis sorted sets for leaderboards
2. **Real-Time Systems**: WebSocket architecture, Kafka streaming
3. **Time-Windowed Aggregations**: Daily/weekly/seasonal leaderboards
4. **CDN Caching**: Aggressive caching for read-heavy workloads
5. **AI for Anomaly Detection**: Cheat detection, skill prediction
6. **High-Throughput Systems**: Handling millions of writes/second

---

## Evaluation Criteria

- **Performance**: Score submission < 100ms, leaderboard retrieval < 50ms
- **Scalability**: Handle 50K scores/second without degradation
- **Real-Time**: WebSocket updates propagate within 500ms
- **AI Integration**: Cheat detection achieves 95%+ precision
- **Code Quality**: Clean Redis operations, efficient Kafka consumers
- **Testing**: Load tests with metrics, unit tests, integration tests

---

---

# Project 6: Real-Time Order Processing System (E-commerce)

## Project Overview

Build a distributed order processing system for a high-traffic e-commerce platform. The system must handle order placement, payment processing, inventory management, fraud detection, and order fulfillment through event-driven architecture. Focus on handling order surges (flash sales), preventing overselling, and maintaining data consistency across microservices.

---

## Tech Stack

- **Backend**: Node.js + Express (API Gateway) + microservices
- **Database**: PostgreSQL (orders, products) + MongoDB (order history) + Redis (inventory locks, cart)
- **Message Queue**: Kafka (order events, saga orchestration)
- **AI Integration**: Gemini/OpenAI for fraud detection, product recommendations, and demand forecasting
- **Payment**: Stripe/PayPal SDK (simulation)
- **Frontend**: React with real-time order tracking

---

## Roles

1. **Customer** - Browse products, place orders, track shipments
2. **Admin** - Manage inventory, process orders, view analytics dashboard

---

## Progressive Tier Requirements

### **Tier 1: Core Order System** (Week 1)

**Backend Focus: Order Placement + Basic Microservices**

#### Features:

- User authentication and profiles
- Product catalog (with stock levels)
- Shopping cart (Redis-backed)
- Order placement
- Basic inventory reservation (prevent overselling)
- Order status tracking (Pending → Confirmed → Shipped → Delivered)
- Payment processing (simulated)

#### Microservices Architecture:

```
API Gateway (Express)
├── Order Service (order creation, status)
├── Inventory Service (stock management)
├── Payment Service (payment processing)
├── Shipping Service (fulfillment)
└── Notification Service (email/SMS)
```

#### Database Schema:

```sql
-- PostgreSQL (Order Service)
users (id, name, email, password_hash, address, created_at)
products (id, name, description, price, sku, category, image_url)
inventory (product_id, warehouse_id, quantity, reserved_quantity)

orders (
  id UUID PRIMARY KEY,
  user_id UUID,
  total_amount DECIMAL,
  status TEXT, -- pending/confirmed/processing/shipped/delivered/cancelled
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

order_items (
  id UUID PRIMARY KEY,
  order_id UUID,
  product_id UUID,
  quantity INT,
  price_at_purchase DECIMAL
)

-- Redis (Cart)
cart:{user_id} -> Hash {product_id: quantity}

-- Redis (Inventory Locks)
inventory_lock:{product_id} -> SET of order_ids (TTL: 10 minutes)
```

#### Order Flow (Tier 1 - Basic):

1. User adds items to cart (Redis)
2. User proceeds to checkout
3. **Reserve inventory** (Redis lock + decrement available stock)
4. Create order record (status: pending)
5. Process payment (simulated)
6. If payment succeeds → Confirm order (status: confirmed)
7. If payment fails → Release inventory, cancel order

#### API Endpoints:

- `POST /api/auth/register` & `/api/auth/login`
- `GET /api/products?category=X&page=1` - List products
- `POST /api/cart/add` - Add item to cart
- `GET /api/cart` - View cart
- `POST /api/orders/checkout` - Place order
- `GET /api/orders/:id` - Order details
- `GET /api/orders/my-orders` - User's order history
- `PUT /api/orders/:id/cancel` - Cancel order (if not shipped)

#### Basic Inventory Management:

```javascript
// Reserve inventory (atomic operation)
async function reserveInventory(productId, quantity, orderId) {
  const lockKey = `inventory_lock:${productId}`;
  const inventoryKey = `inventory:${productId}`;

  // Check available stock
  const available = await redis.get(inventoryKey);
  if (parseInt(available) < quantity) {
    throw new Error("Insufficient stock");
  }

  // Atomically decrement and add to lock set
  const multi = redis.multi();
  multi.decrby(inventoryKey, quantity);
  multi.sadd(lockKey, orderId);
  multi.expire(lockKey, 600); // 10-minute hold
  await multi.exec();

  return true;
}

// Release inventory (on payment failure or timeout)
async function releaseInventory(productId, quantity, orderId) {
  const lockKey = `inventory_lock:${productId}`;
  const inventoryKey = `inventory:${productId}`;

  const multi = redis.multi();
  multi.incrby(inventoryKey, quantity);
  multi.srem(lockKey, orderId);
  await multi.exec();
}
```

#### Success Criteria:

- Order placement completes within 2 seconds
- No overselling (inventory properly reserved)
- Payment failures rollback inventory correctly
- Order status updates reflected accurately

---

### **Tier 2: Event-Driven Architecture + High Volume** (Week 2)

**Backend Focus: Kafka Saga Pattern, Microservices Communication**

#### Saga Pattern for Distributed Transactions:

**Problem**: Order processing involves multiple services (inventory, payment, shipping). If payment fails, inventory must be released.

**Solution**: Orchestration-based Saga with Kafka

**Order Saga Flow**:

1. API Gateway → Publish `order.created` event
2. **Inventory Service** (consumer):
   - Reserve inventory
   - Publish `inventory.reserved` or `inventory.failed`
3. **Payment Service** (consumer):
   - Process payment
   - Publish `payment.succeeded` or `payment.failed`
4. **Order Service** (consumer):
   - If all succeed → Update order status to `confirmed`
   - Publish `order.confirmed`
5. **Shipping Service** (consumer):
   - Create shipment
   - Publish `shipment.created`
6. **Notification Service** (consumer):
   - Send order confirmation email
   - Send shipping notification

**Compensating Transactions** (Rollback):

- If `payment.failed` → Publish `inventory.release` → Inventory Service releases stock
- If `inventory.failed` → Publish `order.cancelled` → Order Service marks order as cancelled

#### Kafka Topics:

- `order-events` (created, confirmed, cancelled)
- `inventory-events` (reserved, released, failed)
- `payment-events` (succeeded, failed)
- `shipping-events` (created, in-transit, delivered)
- `notification-events` (email, SMS triggers)

#### Saga State Machine (Order Service):

```javascript
// Order state transitions
const orderSaga = {
  PENDING: {
    on: {
      INVENTORY_RESERVED: "AWAITING_PAYMENT",
      INVENTORY_FAILED: "CANCELLED",
    },
  },
  AWAITING_PAYMENT: {
    on: {
      PAYMENT_SUCCEEDED: "CONFIRMED",
      PAYMENT_FAILED: "CANCELLED", // Trigger inventory release
    },
  },
  CONFIRMED: {
    on: {
      SHIPMENT_CREATED: "PROCESSING",
      SHIPMENT_FAILED: "CONFIRMED", // Retry later
    },
  },
  PROCESSING: {
    on: {
      SHIPMENT_IN_TRANSIT: "SHIPPED",
    },
  },
  SHIPPED: {
    on: {
      SHIPMENT_DELIVERED: "DELIVERED",
    },
  },
  CANCELLED: {
    /* terminal state */
  },
  DELIVERED: {
    /* terminal state */
  },
};
```

#### High Volume Data Simulation:

```javascript
Seed Data:
- 100,000 users
- 50,000 products (50 categories)
- 10,000,000 orders (past year)
- 25,000,000 order items
- Realistic distributions:
  - Average order value: $75 (SD $50)
  - Average items per order: 2.5
  - Seasonal spikes (holiday sales)
```

#### Flash Sale Handling:

**Scenario**: 10,000 users trying to buy 100 units of a product simultaneously

**Challenges**:

1. Race conditions (overselling)
2. System overload (too many requests)
3. Fair allocation (first-come-first-served)

**Solutions**:

1. **Redis Atomic Operations**:

   ```javascript
   // Use Lua script for atomic check-and-decrement
   const reserveScript = `
     local available = redis.call('GET', KEYS[1])
     if tonumber(available) >= tonumber(ARGV[1]) then
       redis.call('DECRBY', KEYS[1], ARGV[1])
       return 1
     else
       return 0
     end
   `;

   const success = await redis.eval(reserveScript, 1, inventoryKey, quantity);
   ```

2. **Queue System**:

   - Use Kafka to queue checkout requests
   - Process sequentially (prevents thundering herd)
   - Show queue position to users

3. **Rate Limiting**:
   - Limit checkout attempts per user (max 3 per minute)
   - Use Redis sliding window counter

#### Idempotency:

**Problem**: User clicks "Place Order" twice → Duplicate orders

**Solution**: Idempotency keys

```javascript
POST /api/orders/checkout
Headers: Idempotency-Key: <uuid>

// Server checks if key exists in Redis
const processedOrderId = await redis.get(`idempotency:${key}`);
if (processedOrderId) {
  return { orderId: processedOrderId }; // Return existing order
}

// Process new order
const orderId = await createOrder(...);

// Store idempotency key (24-hour TTL)
await redis.setex(`idempotency:${key}`, 86400, orderId);
```

#### Success Criteria:

- Handle 1,000 orders/second without data corruption
- Saga pattern successfully handles payment failures (rollback inventory)
- Flash sale: 100 units sold correctly (no overselling) with 10K concurrent requests
- Kafka consumer lag < 500 messages
- Idempotency prevents duplicate orders

---

### **Tier 3: AI Features + Performant Order Dashboard** (Week 3)

**AI Integration + Admin/Customer UX**

#### AI-Powered Features:

1. **Fraud Detection** (Gemini/OpenAI):

   - Analyze order patterns for suspicious activity
   - Features: order value, frequency, shipping address changes, velocity
   - Risk score: 0-100 (>80 = high risk, manual review)
   - Endpoint: Kafka consumer processes orders asynchronously
   - Admin dashboard shows flagged orders

2. **Product Recommendations**:

   - "Customers who bought X also bought Y"
   - Collaborative filtering + content-based filtering
   - Endpoint: `GET /api/recommendations?product_id=X` or `GET /api/recommendations/personalized`
   - AI analyzes purchase history to recommend products

3. **Demand Forecasting** (AI):

   - Predict future demand for products (next 7/30 days)
   - Use historical sales data + seasonality + trends
   - Helps admins with inventory planning
   - Endpoint: `GET /api/analytics/demand-forecast?product_id=X`
   - Display confidence intervals

4. **Smart Search & Filters**:

   - Semantic search: "red summer dress under $50"
   - Use embeddings to understand intent
   - Endpoint: `GET /api/products/search?q=red summer dress under 50`
   - Better than keyword matching

5. **Dynamic Pricing Suggestions** (AI):
   - Suggest optimal prices based on demand, competitor pricing, inventory levels
   - Endpoint: `GET /api/pricing/suggest?product_id=X`
   - Admin can review and apply suggestions

#### Customer Frontend: Order Tracking

**Challenge**: Real-time order status updates for millions of orders

**Implementation**:

- **Order Status Timeline**:
  - Visual timeline (Pending → Confirmed → Processing → Shipped → Delivered)
  - Real-time updates via WebSocket
  - Show estimated delivery date
- **Live Shipment Tracking**:
  - Map view with shipment location (if available)
  - Push notifications on status changes
- **Order History Table**:
  - Virtual scrolling for users with 1000+ orders
  - Filters: Date range, status, price range
  - Search by product name or order ID
  - Server-side pagination and sorting

#### Admin Frontend: Order Management Dashboard

**Challenge**: Display 10M+ orders with filtering, sorting, and bulk actions

**Implementation**:

- **Order Queue**:
  - Show pending orders (need processing)
  - Fraud-flagged orders (need review)
  - Failed payments (need follow-up)
  - Virtual scrolling (render only visible rows)
- **Bulk Actions**:
  - Select multiple orders → Mark as shipped, Cancel, Refund
  - Batch API requests (max 100 orders per request)
- **Advanced Filters**:
  - Status, date range, price range, customer name, product
  - Server-side filtering: `GET /api/admin/orders?status=confirmed&date_from=2024-01-01&page=1`
  - Debounced search (300ms)
- **Real-Time Updates**:
  - WebSocket for new orders (notification badge)
  - Auto-refresh pending orders every 30 seconds
- **Export**:
  - Download filtered orders as CSV (up to 10K rows)
  - Background job for large exports (email link when ready)

#### API Optimizations:

```sql
-- Composite indexes for common queries
CREATE INDEX idx_orders_user_date ON orders(user_id, created_at DESC);
CREATE INDEX idx_orders_status_date ON orders(status, created_at DESC);
CREATE INDEX idx_order_items_product ON order_items(product_id);

-- Materialized view for admin dashboard stats
CREATE MATERIALIZED VIEW admin_order_stats AS
SELECT
  status,
  COUNT(*) as count,
  SUM(total_amount) as total_revenue,
  DATE(created_at) as order_date
FROM orders
GROUP BY status, DATE(created_at);
REFRESH MATERIALIZED VIEW admin_order_stats; -- Run hourly via cron
```

#### Success Criteria:

- AI fraud detection flags 90%+ of suspicious orders
- Product recommendations increase average order value by 15%+
- Order dashboard loads 10M orders in < 2 seconds (with pagination)
- Real-time order tracking updates within 500ms
- Admin can process 100 orders/minute efficiently

---

### **Tier 4: Admin Analytics Dashboard** (Week 4)

**Business Intelligence + Operational Monitoring**

#### Admin Dashboard Features:

1. **Real-Time Operations Monitor**:

   - Orders per second (line chart, live updates)
   - Current order processing rate (orders/minute)
   - Kafka consumer health (lag, throughput)
   - Payment success rate (percentage gauge)
   - Inventory alerts (low stock warnings)

2. **Sales Analytics**:

   - **Revenue Metrics**:
     - Total revenue (daily/weekly/monthly) (big number + trend)
     - Revenue by category (pie chart)
     - Revenue by hour of day (heatmap)
     - Top-selling products (leaderboard)
     - Average order value (AOV) trend
   - **Order Metrics**:
     - Total orders placed (with growth rate)
     - Order status distribution (funnel chart)
     - Order cancellation rate (line chart over time)
     - Average order processing time
   - **Product Performance**:
     - Best sellers (by units sold, revenue)
     - Worst sellers (inventory turnover rate)
     - Out-of-stock frequency
     - Profit margins by product

3. **Customer Analytics**:

   - **Behavior Metrics**:
     - New vs returning customers (ratio)
     - Customer lifetime value (CLV) distribution
     - Average orders per customer
     - Cart abandonment rate (funnel)
   - **Segmentation**:
     - High-value customers (top 10% by spend)
     - Churn risk customers (no orders in 90 days)
     - Cohort analysis (retention by signup month)

4. **Inventory Analytics**:

   - **Stock Levels**:
     - Current inventory by product (table with search/filter)
     - Low stock alerts (< 10 units)
     - Overstock items (> 90 days no sales)
     - Stock turnover rate (inventory velocity)
   - **Demand vs Supply**:
     - Forecasted demand vs current stock (comparison chart)
     - Stockout incidents (how often products run out)
     - Reorder point recommendations (AI)

5. **Fraud & Risk Analytics**:

   - Flagged orders queue (AI fraud detection)
   - Fraud rate over time (percentage)
   - Most common fraud patterns (AI insights)
   - Chargebacks and disputes (count and amount)
   - False positive rate tracking (review accuracy)

6. **Operational Efficiency**:

   - **Order Fulfillment**:
     - Average time
     - Average time to ship (order placed → shipped)
     - On-time delivery rate (percentage)
     - Shipping delays (by carrier, region)
   - **System Performance**:
     - API response times (P50, P95, P99)
     - Database query performance (slow queries)
     - Kafka consumer lag by topic
     - Error rates by service (microservices health)
   - **Payment Analytics**:
     - Payment method distribution (credit card, PayPal, etc.)
     - Payment success/failure rates
     - Average payment processing time
     - Failed payment reasons (insufficient funds, etc.)

7. **Predictive Analytics** (AI):
   - Sales forecast (next 7/30/90 days)
   - Inventory reorder recommendations
   - Customer churn predictions (likely to stop buying)
   - Seasonal trend detection
   - Optimal pricing recommendations
   - Flash sale impact predictions

#### Implementation:

- **Data Aggregation**:

  ```sql
  -- Materialized views for fast dashboard queries
  CREATE MATERIALIZED VIEW analytics_daily_revenue AS
  SELECT
    DATE(created_at) as date,
    status,
    COUNT(*) as order_count,
    SUM(total_amount) as revenue,
    AVG(total_amount) as avg_order_value
  FROM orders
  WHERE created_at > NOW() - INTERVAL '1 year'
  GROUP BY DATE(created_at), status;

  CREATE MATERIALIZED VIEW analytics_product_performance AS
  SELECT
    p.id,
    p.name,
    p.category,
    COUNT(oi.id) as units_sold,
    SUM(oi.quantity * oi.price_at_purchase) as revenue,
    COUNT(DISTINCT o.user_id) as unique_customers
  FROM products p
  LEFT JOIN order_items oi ON oi.product_id = p.id
  LEFT JOIN orders o ON o.id = oi.order_id
  WHERE o.status IN ('confirmed', 'shipped', 'delivered')
    AND o.created_at > NOW() - INTERVAL '90 days'
  GROUP BY p.id, p.name, p.category;

  CREATE MATERIALIZED VIEW analytics_customer_segments AS
  SELECT
    user_id,
    COUNT(*) as total_orders,
    SUM(total_amount) as lifetime_value,
    MAX(created_at) as last_order_date,
    MIN(created_at) as first_order_date,
    AVG(total_amount) as avg_order_value
  FROM orders
  WHERE status IN ('confirmed', 'shipped', 'delivered')
  GROUP BY user_id;
  ```

- **Real-Time Streaming Aggregations**:

  - Kafka Streams for windowed metrics (orders per minute)
  - Redis for transient metrics (current active carts, checkout sessions)
  - WebSocket for pushing live updates to dashboard

- **Batch Jobs**:
  - **Hourly**: Refresh materialized views, compute fraud risk scores
  - **Daily**: Customer segmentation, inventory reorder calculations, cohort analysis
  - **Weekly**: Sales forecasts, trend analysis, performance reports

#### Dashboard UI Components:

1. **Executive Summary Page**:

   - Big numbers: Today's revenue, orders, AOV, conversion rate
   - Mini charts: 7-day trends for key metrics
   - Alerts: Low stock items, fraud flags, system issues
   - Quick actions: Process pending orders, view flagged orders

2. **Sales Analytics Page**:

   - Interactive charts (click to drill down)
   - Date range selector (Today, 7d, 30d, 90d, Custom)
   - Comparison mode (compare this week vs last week)
   - Top products table (sortable, searchable)
   - Export reports as PDF/CSV

3. **Order Management Page**:

   - Order queue with filters (status, date, customer)
   - Virtual scrolling table (handle 10M+ orders)
   - Bulk actions toolbar (when rows selected)
   - Side panel for order details (click row to expand)
   - Real-time updates (new orders highlighted)

4. **Inventory Management Page**:

   - Product inventory table (current stock, reserved, available)
   - Low stock alerts (red highlighting)
   - Reorder recommendations (AI-powered)
   - Bulk update actions (adjust stock levels)
   - Import/export CSV for bulk updates

5. **Fraud Review Page**:

   - Queue of flagged orders (sorted by risk score)
   - Order details with risk factors highlighted
   - Customer history (previous orders, flags)
   - Side-by-side comparison (this order vs customer's typical)
   - Actions: Approve, Reject, Request more info
   - Audit log (all review actions)

6. **System Health Page**:
   - Service status indicators (green/yellow/red)
   - Kafka topic lag charts
   - Database performance metrics
   - API endpoint latencies
   - Error rate graphs
   - Recent errors log (filterable)

#### Advanced Features:

- **Custom Reports Builder**:

  - Drag-and-drop interface to create custom reports
  - Select dimensions (date, product, category, region)
  - Select metrics (revenue, orders, AOV, etc.)
  - Save and schedule reports (email daily/weekly)

- **Alerts & Notifications**:

  - Configure custom alerts (revenue drops 20%, fraud spike, etc.)
  - Delivery channels: Email, SMS, Slack, in-app
  - Alert history and management

- **A/B Testing Dashboard**:
  - Track experiments (pricing tests, UI changes)
  - Compare metrics between variants
  - Statistical significance calculations

#### Success Criteria:

- Dashboard loads analytics for 10M orders in < 3 seconds
- Real-time metrics update within 1 second
- Admin can identify issues (stockouts, fraud) within 30 seconds of occurrence
- AI forecasts achieve 85%+ accuracy (MAPE < 15%)
- Materialized views refresh without impacting production queries
- Export large datasets (1M+ rows) completes within 5 minutes

---

## Data Volume Simulation Strategy

### Initial Seed:

```javascript
- 100,000 users (realistic profiles, addresses)
- 50,000 products (50 categories, varying prices $5-$500)
- Inventory:
  - 70% products: 50-500 units in stock
  - 20% products: 10-50 units (low stock)
  - 10% products: 0 units (out of stock)
- 10,000,000 orders (past 12 months)
- Order distribution:
  - 60% delivered successfully
  - 15% currently in transit
  - 10% pending/processing
  - 10% cancelled
  - 5% payment failed
- 25,000,000 order items (avg 2.5 items per order)
- Realistic patterns:
  - 40% orders during holiday season (Nov-Dec)
  - Peak hours: 7pm-10pm (30% of daily orders)
  - Average order value: $75 (lognormal distribution)
```

### Seasonal Patterns:

- **Holiday Spike**: 5x normal volume during Black Friday/Cyber Monday
- **Flash Sales**: 50x normal volume for specific products
- **Hourly Patterns**: 10x difference between peak and off-peak

### Load Testing Scenarios:

1. **Normal Load**: 100 orders/second sustained
2. **Peak Load**: 500 orders/second (evening rush)
3. **Flash Sale**: 2,000 orders/second for 1 product (100 units available)
4. **Payment Failure Storm**: 30% payment failure rate (test rollback)
5. **Database Failover**: Test system behavior during DB downtime

### Fraud Simulation:

- 2% of orders flagged as high-risk (AI detection)
- Common patterns: Multiple orders from same IP, rapid address changes, high-value orders from new accounts

### Tools:

- k6 for load testing
- Custom order generator (Kafka producer)
- Artillery.io for WebSocket testing
- PostgreSQL pg_bench for database stress testing

---

## Key Learning Outcomes

1. **Microservices Architecture**: Service decomposition, inter-service communication
2. **Saga Pattern**: Distributed transaction handling, compensating transactions
3. **Event-Driven Systems**: Kafka for async processing, event sourcing
4. **Concurrency Control**: Distributed locks, atomic operations, idempotency
5. **AI for Business**: Fraud detection, demand forecasting, recommendations
6. **Data Analytics**: Materialized views, real-time aggregations, BI dashboards
7. **System Reliability**: Handling failures, rollback mechanisms, monitoring

---

## Evaluation Criteria

- **Architecture**: Clean microservices design, proper event-driven patterns
- **Performance**: Handle 1000 orders/sec, dashboard loads in < 3s
- **Reliability**: Saga pattern correctly handles failures (no data loss)
- **Scalability**: System scales horizontally (add more service instances)
- **AI Integration**: Fraud detection 90%+ precision, forecasts 85%+ accuracy
- **Code Quality**: Clean service boundaries, comprehensive testing, monitoring
- **Documentation**: Architecture diagrams, API docs, runbooks

---

---

# Project 7: Multi-Tenant SaaS Log Aggregation & Monitoring Platform

## Project Overview

Build a multi-tenant log aggregation and monitoring platform similar to Datadog/New Relic. The system collects logs from multiple Node.js microservices (belonging to different tenants), processes them through Kafka streams, stores them efficiently, and provides a powerful search/visualization interface. Focus on handling massive log volumes, efficient time-series queries, and tenant data isolation.

---

## Tech Stack

- **Backend**: Node.js + Express (API) + gRPC (log ingestion)
- **Database**: PostgreSQL (metadata, tenants) + TimescaleDB (time-series extension) or ClickHouse (columnar database for logs)
- **Message Queue**: Kafka (log ingestion pipeline, stream processing)
- **Search**: Elasticsearch (full-text search on logs)
- **Cache**: Redis (query caching, rate limiting)
- **AI Integration**: Gemini/OpenAI for anomaly detection, log pattern recognition, and intelligent alerting
- **Frontend**: React with real-time log streaming and visualization (charts)

---

## Roles

1. **Developer** - Configure log collection, view logs, create dashboards, set up alerts
2. **Admin** - Manage tenants, monitor system health, view platform analytics

---

## Progressive Tier Requirements

### **Tier 1: Core Log Collection & Storage** (Week 1)

**Backend Focus: Multi-Tenant Log Ingestion**

#### Features:

- Tenant registration and API key management
- Log ingestion endpoint (HTTP POST)
- Log parsing and normalization
- Multi-tenant data isolation
- Basic log storage (time-series)
- Simple log query interface (filter by time range, service, level)

#### Multi-Tenant Architecture:

**Tenant Isolation Strategies**:

1. **Shared Database, Separate Schemas** (PostgreSQL)
2. **Shared Tables with tenant_id Column** (Row-level security)
3. **Separate Kafka Topics per Tenant** (for high-volume tenants)

#### Database Schema:

```sql
-- PostgreSQL (metadata)
tenants (
  id UUID PRIMARY KEY,
  name TEXT,
  api_key TEXT UNIQUE, -- For authentication
  plan TEXT, -- free/pro/enterprise
  log_retention_days INT DEFAULT 30,
  created_at TIMESTAMP
)

services (
  id UUID PRIMARY KEY,
  tenant_id UUID,
  name TEXT, -- 'auth-service', 'payment-service'
  environment TEXT, -- 'production', 'staging'
  created_at TIMESTAMP
)

-- TimescaleDB (logs) - optimized for time-series queries
logs (
  id BIGSERIAL,
  tenant_id UUID NOT NULL,
  service_id UUID NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  level TEXT, -- debug/info/warn/error/fatal
  message TEXT,
  metadata JSONB, -- Additional structured data
  trace_id TEXT, -- For distributed tracing
  PRIMARY KEY (tenant_id, timestamp, id)
);

-- Hypertable for time-series optimization
SELECT create_hypertable('logs', 'timestamp',
  chunk_time_interval => INTERVAL '1 day',
  partitioning_column => 'tenant_id',
  number_partitions => 4
);

-- Indexes for common queries
CREATE INDEX idx_logs_tenant_time ON logs(tenant_id, timestamp DESC);
CREATE INDEX idx_logs_service_time ON logs(service_id, timestamp DESC);
CREATE INDEX idx_logs_level ON logs(tenant_id, level, timestamp DESC);
CREATE INDEX idx_logs_trace ON logs(trace_id) WHERE trace_id IS NOT NULL;
```

#### Log Ingestion Flow:

1. Client sends logs via HTTP POST with API key
2. Authenticate tenant (validate API key)
3. Publish to Kafka: `logs.raw.{tenant_id}`
4. **Log Processor** (Kafka consumer):
   - Parse log format (JSON, plain text, custom)
   - Extract structured fields (timestamp, level, message)
   - Enrich with metadata (service name, environment)
   - Write to TimescaleDB in batches (1000 logs per batch)

#### Log Ingestion API:

```javascript
POST /api/v1/logs/ingest
Headers:
  X-API-Key: <tenant_api_key>
  Content-Type: application/json

Body:
{
  "service": "auth-service",
  "environment": "production",
  "logs": [
    {
      "timestamp": "2024-01-15T10:30:00Z",
      "level": "error",
      "message": "Database connection failed",
      "metadata": {
        "error_code": "ECONNREFUSED",
        "host": "db.example.com"
      },
      "trace_id": "abc123"
    },
    // ... batch of logs (up to 1000)
  ]
}
```

#### Log Query API:

```javascript
GET /api/v1/logs?
  service_id=X&
  start_time=2024-01-15T00:00:00Z&
  end_time=2024-01-15T23:59:59Z&
  level=error&
  limit=100&
  cursor=TIMESTAMP_ID

Response:
{
  "logs": [...],
  "nextCursor": "2024-01-15T10:30:00Z_12345",
  "total": 5000
}
```

#### SDK for Log Collection (Node.js):

```javascript
// @example-monitoring/logger npm package
const Logger = require("@example-monitoring/logger");

const logger = new Logger({
  apiKey: process.env.MONITORING_API_KEY,
  service: "auth-service",
  environment: "production",
});

logger.info("User logged in", { userId: 123 });
logger.error("Payment failed", { orderId: 456, error: err.message });

// Batch sending (send every 5 seconds or 100 logs)
```

#### Success Criteria:

- Ingest 10,000 logs/second without data loss
- Query logs with < 1 second latency for 1-hour time range
- Tenant data properly isolated (no cross-tenant data leakage)
- SDK collects and batches logs efficiently

---

### **Tier 2: Stream Processing + High Volume Simulation** (Week 2)

**Backend Focus: Kafka Streams, Real-Time Aggregations, Alerting**

#### Kafka Stream Processing:

**Real-Time Aggregations**:

- **Error Rate**: Count errors per service per minute
- **Log Volume**: Total logs per service per minute
- **Response Time**: Calculate P50/P95/P99 from log metadata
- **Top Errors**: Group similar error messages

**Kafka Streams Topology**:

```javascript
// Stream 1: Error rate calculation
logs.raw
  .filter((log) => log.level === "error")
  .groupBy((log) => `${log.tenant_id}:${log.service_id}`)
  .windowedBy(TimeWindows.of(Duration.ofMinutes(1)))
  .count()
  .toStream()
  .to("metrics.error_rate");

// Stream 2: Log aggregation by level
logs.raw
  .groupBy((log) => `${log.tenant_id}:${log.level}`)
  .windowedBy(TimeWindows.of(Duration.ofMinutes(5)))
  .count()
  .toStream()
  .to("metrics.log_volume");

// Stream 3: Anomaly detection trigger
logs.raw
  .filter((log) => log.level === "error" || log.level === "fatal")
  .to("logs.critical"); // Separate topic for immediate processing
```

#### Real-Time Alerting:

**Alert Conditions**:

- Error rate > threshold (e.g., > 10 errors/minute)
- Service down (no logs received in 5 minutes)
- Specific error pattern detected (regex match)
- Anomaly detected (AI-based)

**Alert Schema**:

```sql
-- PostgreSQL
alerts (
  id UUID PRIMARY KEY,
  tenant_id UUID,
  service_id UUID,
  name TEXT,
  condition JSONB, -- {"type": "error_rate", "threshold": 10, "window": "1m"}
  channels JSONB, -- ["email", "slack", "webhook"]
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP
)

alert_incidents (
  id UUID PRIMARY KEY,
  alert_id UUID,
  triggered_at TIMESTAMP,
  resolved_at TIMESTAMP,
  severity TEXT, -- warning/critical
  message TEXT,
  metadata JSONB
)
```

**Alert Evaluation (Kafka Consumer)**:

```javascript
// Consume metrics.error_rate topic
kafkaConsumer.on("message", async (message) => {
  const { tenantId, serviceId, errorCount, window } = JSON.parse(message.value);

  // Fetch active alerts for this tenant/service
  const alerts = await getActiveAlerts(tenantId, serviceId);

  for (const alert of alerts) {
    if (shouldTrigger(alert, errorCount)) {
      await createIncident(alert, errorCount, window);
      await sendNotification(alert.channels, {
        title: `High error rate: ${errorCount} errors in ${window}`,
        service: serviceId,
        timestamp: new Date(),
      });
    }
  }
});
```

#### Log Sampling (for high-volume services):

**Problem**: Service produces 100K logs/second → too expensive to store all

**Solution**: Smart sampling

```javascript
// Keep all errors/warnings, sample info/debug logs
function shouldSample(log) {
  if (log.level === "error" || log.level === "warn") {
    return true; // Keep 100% of errors/warnings
  }

  if (log.level === "info") {
    return Math.random() < 0.1; // Sample 10% of info logs
  }

  if (log.level === "debug") {
    return Math.random() < 0.01; // Sample 1% of debug logs
  }
}
```

#### High Volume Data Simulation:

```javascript
Seed Data:
- 100 tenants
- 500 services (5 services per tenant avg)
- 10 billion logs (past 30 days)
- Log distribution:
  - 60% info
  - 25% debug
  - 10% warn
  - 4% error
  - 1% fatal
- Temporal patterns:
  - Peak: 8am-6pm (70% of logs)
  - Off-peak: 6pm-8am (30% of logs)
- Service patterns:
  - 80% services: 100-1000 logs/minute
  - 15% services: 1K-10K logs/minute
  - 5% services: 10K-100K logs/minute (high-volume)
```

#### Data Retention & Compression:

**Automatic Data Expiration**:

```sql
-- TimescaleDB retention policy
SELECT add_retention_policy('logs', INTERVAL '30 days');

-- Compress old data (older than 7 days)
SELECT add_compression_policy('logs', INTERVAL '7 days');

-- Results in 10x+ storage savings
```

#### Success Criteria:

- Ingest 100,000 logs/second sustained
- Real-time aggregations (error rate) compute within 10 seconds
- Alerts trigger within 1 minute of condition being met
- Log sampling reduces storage by 80% without losing critical data
- Kafka consumer lag < 5000 messages

---

### **Tier 3: AI-Powered Analysis + Advanced Search** (Week 3)

**AI Integration + Powerful Query Interface**

#### AI-Powered Features:

1. **Anomaly Detection** (Gemini/OpenAI):

   - Detect unusual patterns in log volume, error rates
   - Use time-series analysis (LSTM, Prophet)
   - Automatically create incidents for anomalies
   - Endpoint: Background Kafka consumer, surfaces in UI

2. **Log Pattern Recognition**:

   - Group similar error messages automatically
   - Example: "Database connection failed to host-1" and "Database connection failed to host-2" → Same issue
   - Use text embeddings to cluster errors
   - Endpoint: `GET /api/v1/logs/patterns?service_id=X&time_range=1d`
   - Shows: Top error patterns, frequency, affected services

3. **Intelligent Alerting** (reduce alert fatigue):

   - AI learns which alerts are actionable vs noise
   - Suggest alert threshold adjustments
   - Correlate alerts across services (one root cause → multiple alerts)
   - Endpoint: `GET /api/v1/alerts/suggestions`

4. **Root Cause Analysis**:

   - Given an error, AI traces related logs (using trace_id)
   - Builds timeline of events leading to error
   - Suggests likely root cause
   - Endpoint: `POST /api/v1/logs/analyze-error` with log_id

5. **Natural Language Queries**:
   - "Show me errors in payment service in the last hour"
   - "What caused the spike in response time at 3pm?"
   - AI converts to structured queries
   - Endpoint: `POST /api/v1/logs/nl-query` with natural language string

#### Advanced Search with Elasticsearch:

**Why Elasticsearch**: Full-text search, fuzzy matching, complex aggregations

**Data Pipeline**:

```
Logs → Kafka → [Processor] → TimescaleDB (primary storage)
                          └→ Elasticsearch (search index)
```

**Elasticsearch Index**:

```javascript
// Index template
{
  "mappings": {
    "properties": {
      "tenant_id": { "type": "keyword" },
      "service_id": { "type": "keyword" },
      "timestamp": { "type": "date" },
      "level": { "type": "keyword" },
      "message": { "type": "text", "analyzer": "standard" },
      "metadata": { "type": "object", "enabled": true },
      "trace_id": { "type": "keyword" }
    }
  }
}

// Index per day: logs-2024-01-15
// Automatic rollover and deletion (30-day retention)
```

**Search Queries**:

```javascript
// Full-text search
GET /api/v1/logs/search?
  q=database connection failed&
  service_id=X&
  start_time=...&
  end_time=...

// Field-specific search
GET /api/v1/logs/search?
  level=error&
  metadata.error_code=ECONNREFUSED&
  trace_id=abc123

// Aggregations (count by level, by service)
GET /api/v1/logs/aggregate?
  group_by=level&
  service_id=X&
  time_range=1h
```

#### Frontend: Log Explorer Interface

**Challenge**: Display millions of logs with powerful filtering and real-time updates

**Implementation**:

- **Log Table with Virtual Scrolling**:
  - Display 100 logs initially
  - Load more as user scrolls (pagination)
  - Columns: Timestamp, Level, Service, Message, Metadata
  - Color-coded by level (red=error, yellow=warn, etc.)
- **Advanced Filters**:
  - Time range picker (Last 15min, 1h, 24h, 7d, Custom)
  - Service selector (dropdown, multi-select)
  - Log level checkboxes (info, warn, error, etc.)
  - Full-text search (debounced, 300ms)
  - Metadata filters (key-value pairs)
- **Real-Time Log Streaming**:
  - WebSocket connection to stream new logs
  - Toggle: "Live tail" (auto-scroll to latest logs)
  - Pause/resume streaming
  - Show notification: "42 new logs" (click to load)
- **Log Details Panel**:
  - Click log row → Expand side panel
  - Show full message, metadata (formatted JSON)
  - Trace ID → Click to see related logs
  - Actions: Copy, Share permalink, Create alert
- **Saved Queries**:
  - Save complex filter combinations
  - Quick access to common queries
  - Share queries with team

#### API Optimizations:

```sql
-- Query with proper indexing
SELECT * FROM logs
WHERE tenant_id = $1
  AND timestamp BETWEEN $2 AND $3
  AND service_id = $4
  AND level = $5
ORDER BY timestamp DESC
LIMIT 100;

-- Execution plan uses index:
-- Index Scan using idx_logs_tenant_time (cost=0.56..8.58)
```

```javascript
// Cache common queries in Redis (5-minute TTL)
const cacheKey = `logs:${tenantId}:${serviceId}:${level}:${timeRange}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

const logs = await queryDatabase(...);
await redis.setex(cacheKey, 300, JSON.stringify(logs));
```

#### Success Criteria:

- AI anomaly detection identifies 90%+ of real incidents (low false positive rate)
- Log pattern recognition groups 80%+ of similar errors correctly
- Natural language queries convert to accurate structured queries
- Elasticsearch search returns results in < 500ms for complex queries
- Log Explorer UI loads 1M logs smoothly (virtual scrolling, 60 FPS)
- Real-time log streaming updates within 1 second

---

### **Tier 4: Platform Admin Dashboard + Analytics** (Week 4)

**System Monitoring + Tenant Analytics**

#### Platform Admin Dashboard Features:

1. **Real-Time System Health**:

   - Log ingestion rate (logs/second, live chart)
   - Kafka consumer lag by topic
   - Database query performance (slow queries)
   - Elasticsearch cluster health (yellow/green/red)
   - Storage usage (total logs stored, growth rate)
   - API response times (P50, P95, P99)

2. **Tenant Analytics**:

   - **Usage Metrics**:
     - Logs ingested per tenant (today, this month)
     - Storage consumed per tenant (GB)
     - API calls per tenant (rate limiting info)
     - Active services per tenant
   - **Billing Data** (if monetized):
     - Revenue by plan (free/pro/enterprise)
     - Tenants exceeding plan limits
     - Upgrade opportunities (high-usage free-tier tenants)
   - **Top Tenants**:
     - By log volume, by storage, by API calls
     - Leaderboard for easy identification

3. **Log Analytics (Aggregated)**:

   - **Volume Trends**:
     - Total logs over time (line chart)
     - Logs by level distribution (stacked area chart)
     - Peak hours heatmap (24x7 grid)
   - **Error Analysis**:
     - Top error messages across all tenants
     - Error rate trends (are errors increasing?)
     - Services with highest error rates
   - **Performance**:
     - Average log processing latency
     - Time from ingestion to queryable
     - Query response times

4. **Alert Analytics**:

   - Total alerts triggered (today, this week)
   - Alert resolution time (MTTR)
   - Most triggered alerts (by tenant, by alert rule)
   - Alert fatigue indicators (alerts ignored, false positives)

5. **AI Model Performance**:

   - Anomaly detection accuracy (precision, recall)
   - Pattern recognition effectiveness (manual validation)
   - Alert suggestion adoption rate (how many suggestions are used)
   - Model drift detection (performance over time)

6. **Capacity Planning** (Predictive AI):
   - Forecast storage needs (next 30/90 days)
   - Predict Kafka scaling requirements
   - Estimate database growth
   - Suggest infrastructure optimizations

#### Tenant-Facing Dashboard Features:

1. **Service Overview**:

   - List of services with health status
   - Log volume per service (bar chart)
   - Error rate per service (line chart with threshold)
   - Response time percentiles (if tracked in logs)

2. **Custom Dashboards**:

   - Drag-and-drop dashboard builder
   - Widgets: Time-series charts, pie charts, tables, big numbers
   - Query builder: Select metrics, filters, time range
   - Save and share dashboards with team

3. **Real-Time Monitoring**:

   - Live log feed (filtered by service/level)
   - Active alerts panel (current incidents)
   - Service health indicators (green/yellow/red)
   - Key metrics (requests/sec, error rate, etc.)

4. **Historical Analysis**:
   - Compare time periods (this week vs last week)
   - Identify trends (error rate increasing over 30 days?)
   - Correlation analysis (high traffic → high errors?)
   - Export data as CSV for external analysis

#### Implementation:

- **Materialized Views**:

  ```sql
  -- Hourly log volume by tenant
  CREATE MATERIALIZED VIEW analytics_hourly_logs AS
  SELECT
    tenant_id,
    service_id,
    date_trunc('hour', timestamp) as hour,
    level,
    COUNT(*) as log_count
  FROM logs
  WHERE timestamp > NOW() - INTERVAL '30 days'
  GROUP BY tenant_id, service_id, date_trunc('hour', timestamp), level;

  -- Refresh every hour
  REFRESH MATERIALIZED VIEW CONCURRENTLY analytics_hourly_logs;
  ```

- **Continuous Aggregates** (TimescaleDB):

  ```sql
  CREATE MATERIALIZED VIEW logs_1h
  WITH (timescaledb.continuous) AS
  SELECT
    time_bucket('1 hour', timestamp) AS bucket,
    tenant_id,
    service_id,
    level,
    COUNT(*) as count
  FROM logs
  GROUP BY bucket, tenant_id, service_id, level;

  -- Automatically updated as new data arrives
  ```

- **Real-Time Streaming**:

  - Kafka consumer writes metrics to Redis (current values)
  - WebSocket broadcasts updates to connected dashboards
  - Server-Sent Events for one-way updates (simpler than WebSocket)

- **Batch Processing**:
  - Hourly: Refresh materialized views, compute aggregations
  - Daily: Generate reports, clean up old data, update forecasts
  - Weekly: Tenant usage reports (email), capacity planning

#### Dashboard UI:

- **Admin Platform Dashboard**:
  - Top navigation: System Health, Tenants, Analytics, Alerts
  - Real-time metrics with auto-refresh (5 seconds)
  - Filterable tables (search tenants, services)
  - Export capabilities (CSV, PDF reports)
- **Tenant Dashboard**:
  - Service selector (dropdown)
  - Time range selector with presets
  - Custom dashboard builder (drag-and-drop)
  - Alert configuration interface
  - Settings: API keys, retention policies, integrations

#### Success Criteria:

- Admin dashboard loads metrics for 100 tenants in < 2 seconds
- Real-time metrics update within 1 second
- Custom dashboards render complex queries in < 3 seconds
- Capacity forecasts achieve 90%+ accuracy (within 10% error)
- Tenant can build custom dashboard without documentation (intuitive UI)

---

## Data Volume Simulation Strategy

### Initial Seed:

```javascript
- 100 tenants (mix of free/pro/enterprise plans)
- 500 services (5 per tenant average)
- 10,000,000,000 logs (10 billion, past 30 days)
- Log level distribution:
  - Debug: 20% (sampled to 1%)
  - Info: 60% (sampled to 10%)
  - Warn: 10% (kept 100%)
  - Error: 8% (kept 100%)
  - Fatal: 2% (kept 100%)
- After sampling: ~1 billion logs stored
- Temporal patterns: Peak 10am-4pm (70% of logs)
```

### Realistic Service Patterns:

- **Web Services**: High log volume (10K/min), mostly info
- **Background Jobs**: Low volume (100/min), occasional errors
- **APIs**: Medium volume (1K/min), structured logs

### Load Testing Scenarios:

1. **Normal Load**: 50,000 logs/second across 100 tenants
2. **Spike**: One tenant sends 500,000 logs/second (DDoS on their service)
3. **Query Load**: 10,000 concurrent users querying logs
4. **Dashboard Load**: 500 users viewing real-time dashboards simultaneously

### Tools:

- k6 for HTTP load testing
- Custom log generator (Kafka producer, realistic log patterns)
- Elasticsearch benchmark tools
- PostgreSQL/TimescaleDB benchmarking

---

## Key Learning Outcomes

1. **Multi-Tenancy**: Data isolation, resource allocation, billing
2. **Time-Series Data**: Efficient storage, query optimization, retention policies
3. **Stream Processing**: Kafka Streams, real-time aggregations
4. **Full-Text Search**: Elasticsearch integration, complex queries
5. **AI for Monitoring**: Anomaly detection, pattern recognition, intelligent alerting
6. **Data Visualization**: Building custom dashboards, real-time charts
7. **Scalability**: Handling billions of logs, horizontal scaling strategies

---

## Evaluation Criteria:

- **Architecture**: Clean multi-tenant design, proper data isolation
- **Performance**: 100K logs/sec ingestion, < 1s query latency
- **Scalability**: System scales with tenant count and log volume
- **AI Integration**: Anomaly detection 90%+ accuracy, useful insights
- **User Experience**: Intuitive dashboards, powerful search, low latency
- **Code Quality**: Well-structured services, comprehensive tests, monitoring
- **Documentation**: Setup guide, API docs, architecture diagrams

---

---

# Project 8: Distributed Task Queue System (Background Job Processor)

## Project Overview

Build a distributed task queue system similar to Celery/Bull/Sidekiq for processing background jobs at scale. The system handles job scheduling, priority queues, retries with exponential backoff, dead letter queues, and provides real-time monitoring of job execution. Perfect for learning about distributed systems, job orchestration, and handling failures gracefully.

---

## Tech Stack

- **Backend**: Node.js + Express (API) + Worker processes
- **Database**: PostgreSQL (job metadata, results) + Redis (job queues, locks)
- **Message Queue**: Kafka (job events, audit log) or Redis Streams (simpler alternative)
- **AI Integration**: Gemini/OpenAI for job optimization, failure prediction, and intelligent retry strategies
- **Monitoring**: Prometheus + Grafana or custom dashboard
- **Frontend**: React for job monitoring dashboard

---

## Roles

1. **Developer** - Submit jobs, monitor execution, configure retry policies
2. **Admin** - System health monitoring, worker management, queue analytics

---

## Progressive Tier Requirements

### **Tier 1: Core Job Queue System** (Week 1)

**Backend Focus: Job Submission, Processing, Basic Queues**

#### Features:

- Job submission API
- Multiple named queues (email, image-processing, reports, etc.)
- Worker processes that consume and execute jobs
- Job status tracking (pending, processing, completed, failed)
- Basic retry mechanism (fixed number of retries)
- Job results storage
- Simple job history

#### Database Schema:

```sql
-- PostgreSQL (job metadata and results)
jobs (
  id UUID PRIMARY KEY,
  queue_name TEXT NOT NULL,
  job_type TEXT NOT NULL, -- 'send_email', 'process_image', 'generate_report'
  payload JSONB NOT NULL,
  status TEXT NOT NULL, -- 'pending', 'processing', 'completed', 'failed'
  priority INT DEFAULT 0, -- Higher number = higher priority
  attempts INT DEFAULT 0,
  max_attempts INT DEFAULT 3,
  result JSONB, -- Job output
  error TEXT, -- Error message if failed
  created_at TIMESTAMP DEFAULT NOW(),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  scheduled_for TIMESTAMP DEFAULT NOW(), -- For delayed jobs
  INDEX idx_jobs_queue_status (queue_name, status, scheduled_for)
)

-- Redis (active queues - faster than PostgreSQL for queue operations)
-- ZSET for priority queue
queue:{queue_name} -> Sorted Set (score = priority * 1000000 + timestamp)

-- Hash for job data (temporary, deleted after processing)
job:{job_id} -> Hash {payload, metadata}

-- SET for processing jobs (for tracking which jobs are being worked on)
processing:{worker_id} -> Set of job_ids
```

#### Job Submission:

```javascript
POST /api/v1/jobs

Body:
{
  "queue": "email",
  "jobType": "send_welcome_email",
  "payload": {
    "userId": 123,
    "email": "user@example.com"
  },
  "priority": 5, // 0-10, default 5
  "maxAttempts": 3,
  "scheduledFor": "2024-01-16T10:00:00Z" // Optional: delayed job
}

Response:
{
  "jobId": "abc-123-def",
  "status": "pending",
  "queuePosition": 42
}
```

#### Worker Architecture:

```javascript
// Worker process (multiple instances can run concurrently)
class Worker {
  constructor(queueName, concurrency = 1) {
    this.queueName = queueName;
    this.concurrency = concurrency; // How many jobs to process simultaneously
    this.processing = new Set();
  }

  async start() {
    while (true) {
      if (this.processing.size < this.concurrency) {
        const job = await this.fetchJob();
        if (job) {
          this.processJob(job); // Non-blocking
        } else {
          await this.sleep(1000); // No jobs, wait 1 second
        }
      }
    }
  }

  async fetchJob() {
    // 1. Pop highest priority job from Redis
    const jobId = await redis.zpopmax(`queue:${this.queueName}`);
    if (!jobId) return null;

    // 2. Mark as processing
    await redis.sadd(`processing:${this.workerId}`, jobId);

    // 3. Update database
    await db.query(
      `UPDATE jobs SET status = 'processing', started_at = NOW()
       WHERE id = $1`,
      [jobId]
    );

    // 4. Fetch job data
    const job = await db.query(`SELECT * FROM jobs WHERE id = $1`, [jobId]);
    return job.rows[0];
  }

  async processJob(job) {
    this.processing.add(job.id);

    try {
      // Execute the actual job logic
      const result = await this.executeJob(job);

      // Mark as completed
      await this.completeJob(job.id, result);
    } catch (error) {
      // Handle failure and retry
      await this.failJob(job.id, error);
    } finally {
      this.processing.delete(job.id);
      await redis.srem(`processing:${this.workerId}`, job.id);
    }
  }

  async executeJob(job) {
    // Route to appropriate handler based on jobType
    const handler = jobHandlers[job.job_type];
    if (!handler) {
      throw new Error(`Unknown job type: ${job.job_type}`);
    }

    return await handler(job.payload);
  }

  async completeJob(jobId, result) {
    await db.query(
      `UPDATE jobs
       SET status = 'completed', result = $1, completed_at = NOW()
       WHERE id = $2`,
      [JSON.stringify(result), jobId]
    );
  }

  async failJob(jobId, error) {
    const job = await db.query(`SELECT * FROM jobs WHERE id = $1`, [jobId]);
    const attempts = job.rows[0].attempts + 1;

    if (attempts < job.rows[0].max_attempts) {
      // Retry: re-add to queue with delay (exponential backoff)
      const delay = Math.pow(2, attempts) * 1000; // 2^attempts seconds
      const retryAt = new Date(Date.now() + delay);

      await db.query(
        `UPDATE jobs
         SET status = 'pending', attempts = $1, scheduled_for = $2
         WHERE id = $3`,
        [attempts, retryAt, jobId]
      );

      // Re-add to Redis queue
      await redis.zadd(
        `queue:${job.rows[0].queue_name}`,
        Date.now() + delay,
        jobId
      );
    } else {
      // Max attempts reached, mark as failed
      await db.query(
        `UPDATE jobs
         SET status = 'failed', error = $1, completed_at = NOW()
         WHERE id = $2`,
        [error.message, jobId]
      );
    }
  }
}

// Start workers
const emailWorker = new Worker("email", 10); // Process 10 jobs concurrently
const imageWorker = new Worker("image-processing", 5);

emailWorker.start();
imageWorker.start();
```

#### Job Handlers (Example):

```javascript
const jobHandlers = {
  async send_welcome_email(payload) {
    const { userId, email } = payload;
    // Send email via SendGrid/Mailgun
    await emailService.send({
      to: email,
      subject: "Welcome!",
      body: "Thanks for signing up!",
    });
    return { emailId: "abc123", sentAt: new Date() };
  },

  async process_image(payload) {
    const { imageUrl, operations } = payload;
    // Download image, apply transformations, upload to CDN
    const processedUrl = await imageProcessor.process(imageUrl, operations);
    return { processedUrl };
  },
};
```

#### API Endpoints:

- `POST /api/v1/jobs` - Submit job
- `GET /api/v1/jobs/:id` - Get job status and result
- `GET /api/v1/jobs?queue=X&status=Y&page=1` - List jobs with filters
- `DELETE /api/v1/jobs/:id` - Cancel pending job
- `POST /api/v1/jobs/:id/retry` - Manually retry failed job

#### Success Criteria:

- Jobs submitted and processed correctly
- Workers handle concurrent jobs (up to concurrency limit)
- Failed jobs retry with exponential backoff
- Job status accurately reflects current state
- No job loss during worker restarts (jobs in Redis + PostgreSQL)

---

### **Tier 2: Advanced Features + High Volume** (Week 2)

**Backend Focus: Priority Queues, Dead Letter Queue, Job Dependencies, Rate Limiting**

#### Advanced Features:

**1. Priority Queues**:

```javascript
// Jobs with higher priority processed first
// Redis sorted set score = priority * 1000000 - timestamp
// This ensures: higher priority first, then FIFO within same priority

const score = job.priority * 1000000 - Date.now();
await redis.zadd(`queue:${queueName}`, score, jobId);
```

**2. Dead Letter Queue (DLQ)**:

```javascript
// Jobs that fail after max retries → Move to DLQ for manual review
async function moveToDeadLetterQueue(jobId) {
  await db.query(
    `UPDATE jobs SET status = 'dead_letter' WHERE id = $1`,
    [jobId]
  );

  await redis.zadd('queue:dead_letter', Date.now(), jobId);

  // Alert admins
  await notifyAdmins({
    type: 'dead_letter_job',
    jobId,
    message: 'Job moved to DLQ after max retries'
  });
}

// Admin can manually retry from DLQ
POST /api/v1/admin/jobs/:id/retry-from-dlq
```

**3. Job Dependencies (Job Chains)**:

```javascript
// Job B should only run after Job A completes
POST /api/v1/jobs

Body:
{
  "queue": "reports",
  "jobType": "generate_pdf_report",
  "payload": {...},
  "dependsOn": ["job-a-id"] // Wait for these jobs to complete first
}

// Worker checks dependencies before processing
async function canProcessJob(job) {
  if (!job.depends_on || job.depends_on.length === 0) return true;

  const dependencies = await db.query(
    `SELECT status FROM jobs WHERE id = ANY($1)`,
    [job.depends_on]
  );

  return dependencies.rows.every(dep => dep.status === 'completed');
}
```

**4. Job Batching**:

```javascript
// Submit multiple related jobs as a batch
// Track batch completion
POST /api/v1/job-batches

Body:
{
  "name": "Monthly Report Generation",
  "jobs": [
    { "queue": "reports", "jobType": "generate_pdf", "payload": {...} },
    { "queue": "reports", "jobType": "send_email", "payload": {...} },
    // ... 100 jobs
  ]
}

// Check batch status
GET /api/v1/job-batches/:batchId
Response: { completed: 85, failed: 5, pending: 10, total: 100 }
```

**5. Rate Limiting (per queue)**:

```javascript
// Limit jobs processed per second (e.g., API rate limits)
const rateLimits = {
  email: { limit: 10, window: 1000 }, // Max 10 emails per second
  "api-calls": { limit: 100, window: 60000 }, // Max 100 API calls per minute
};

async function canProcessJobNow(queueName) {
  const limit = rateLimits[queueName];
  if (!limit) return true;

  const key = `rate_limit:${queueName}`;
  const count = await redis.incr(key);

  if (count === 1) {
    await redis.expire(key, limit.window / 1000);
  }

  return count <= limit.limit;
}
```

**6. Scheduled/Cron Jobs**:

```javascript
// Recurring jobs (daily reports, weekly cleanups)
POST /api/v1/scheduled-jobs

Body:
{
  "name": "Daily User Report",
  "queue": "reports",
  "jobType": "generate_user_report",
  "payload": {...},
  "schedule": "0 9 * * *" // Cron format: every day at 9am
}

// Scheduler process (separate from workers)
const scheduler = new CronScheduler();
scheduler.add({
  schedule: '0 9 * * *',
  task: async () => {
    await submitJob({
      queue: 'reports',
      jobType: 'generate_user_report',
      payload: { date: new Date() }
    });
  }
});
```

#### Kafka Integration:

**Why Kafka**: Audit trail, job events for analytics, worker coordination

**Topics**:

- `jobs.submitted` (all job submissions)
- `jobs.completed` (successful completions)
- `jobs.failed` (failures for analysis)
- `jobs.retries` (retry events)

**Consumers**:

- **Analytics Service**: Aggregate job metrics
- **Audit Log**: Store all job events for compliance
- **Alert Service**: Trigger alerts on high failure rates

#### High Volume Data Simulation:

```javascript
Seed Data:
- 10 queues (email, sms, image-processing, video-encoding, reports, webhooks, etc.)
- 100,000,000 jobs (past 30 days)
- Job distribution:
  - 70% completed successfully
  - 15% failed then succeeded on retry
  - 10% pending/processing
  - 5% failed permanently (in DLQ)
- Average job duration:
  - Fast jobs (< 1s): 60% (email, webhook)
  - Medium jobs (1-10s): 30% (image processing)
  - Slow jobs (> 10s): 10% (video encoding, reports)
```

#### Load Testing:

- Submit 10,000 jobs/second
- Process 5,000 jobs/second across 50 worker instances
- Simulate worker crashes (graceful shutdown and recovery)
- Test queue backlog (1M pending jobs)

#### Success Criteria:

- Priority jobs processed before lower-priority jobs
- DLQ captures permanently failed jobs correctly
- Job dependencies enforced (no premature execution)
- Rate limiting prevents exceeding external API limits
- Scheduled jobs trigger at correct times
- System handles 10K job submissions/sec without data loss

---

### **Tier 3: AI-Powered Features + Monitoring Dashboard** (Week 3)

**AI Integration + Observability**

#### AI-Powered Features:

**1. Intelligent Retry Strategy** (AI):

```javascript
// AI learns which jobs are likely to succeed on retry
// Suggests optimal retry delays and max attempts

// Features for prediction:
- job_type
- error_type (timeout, connection_refused, validation_error)
- time_of_day (some external services fail more at night)
- previous_attempts
- queue_backlog

// Model output:
- retry_recommended: boolean
- suggested_delay: milliseconds
- success_probability: 0-1

// Apply AI recommendations
if (aiModel.shouldRetry(job, error)) {
  const delay = aiModel.suggestDelay(job, error);
  await scheduleRetry(job, delay);
} else {
  await moveToDeadLetterQueue(job); // Don't waste retries
}
```

**2. Job Failure Prediction** (AI):

```javascript
// Predict if a job is likely to fail based on historical patterns
// Endpoint: POST /api/v1/jobs/predict-success

const prediction = await aiModel.predictSuccess({
  jobType: 'process_large_video',
  payload: { videoSize: 5GB, duration: 120min },
  queueBacklog: 5000,
  workerLoad: 0.85
});

if (prediction.successProbability < 0.5) {
  // Warn user: "This job is likely to fail due to timeout"
  // Suggest: splitting into smaller jobs, increasing timeout
}
```

**3. Auto-Scaling Recommendations** (AI):

```javascript
// AI analyzes queue depth, job duration, worker utilization
// Suggests optimal worker count

const recommendation = await aiModel.suggestWorkerCount({
  queue: "image-processing",
  pendingJobs: 10000,
  averageJobDuration: 5000, // ms
  currentWorkers: 10,
  targetLatency: 60000, // Process within 1 minute
});

// recommendation: { suggestedWorkers: 25, reasoning: "..." }
```

**4. Job Optimization Suggestions**:

```javascript
// AI analyzes slow jobs and suggests optimizations
GET /api/v1/analytics/slow-jobs

Response:
{
  "slowJobs": [
    {
      "jobType": "process_image",
      "avgDuration": 12000, // 12 seconds
      "suggestion": "Consider using GPU-accelerated processing to reduce duration by 70%"
    }
  ]
}
```

**5. Anomaly Detection**:

```javascript
// Detect unusual patterns: sudden spike in failures, slow jobs, etc.
// Kafka consumer monitors job events in real-time

const anomaly = await detectAnomaly({
  metric: "failure_rate",
  queue: "email",
  currentValue: 0.25, // 25% failure rate
  historicalAverage: 0.02, // Usually 2%
});

if (anomaly.detected) {
  await alertAdmins({
    type: "anomaly_detected",
    message: `Email queue failure rate spiked to 25% (normal: 2%)`,
    possibleCauses: ["SMTP server down", "Rate limit exceeded"],
  });
}
```

#### Monitoring Dashboard (Frontend):

**1. Real-Time Queue Overview**:

- List of all queues with:
  - Pending jobs count
  - Processing jobs count
  - Completed today / Failed today
  - Average job duration
  - Worker count (active workers)
  - Health status (green/yellow/red)

**2. Job Timeline**:

- Gantt chart showing job execution over time
- Color-coded by status (green=success, red=failed, yellow=processing)
- Filter by queue, date range
- Click job to see details

**3. Worker Status Panel**:

- Table of active workers:
  - Worker ID, Queue, Status (idle/busy), Current job, Uptime
  - CPU/Memory usage (if tracked)
- Actions: Restart worker, Increase/decrease workers

**4. Job Details Drawer**:

- Click any job → Side panel opens
- Shows:
  - Job ID, Type, Queue, Status
  - Payload (formatted JSON)
  - Result (if completed)
  - Error (if failed)
  - Timeline: submitted → started → completed/failed
  - Retry history (all attempts)
- Actions: Retry, Cancel, View similar jobs

**5. Queue Metrics Charts**:

- Line chart: Jobs processed over time (by queue)
- Bar chart: Success vs failure rate (by queue)
- Heatmap: Job submissions by hour of day
- Histogram: Job duration distribution

**6. DLQ Management Interface**:

- Table of jobs in dead letter queue
- Filters: error type, job type, date range
- Bulk actions: Retry all, Delete, Export as CSV
- Root cause analysis (AI-powered insights)

**7. Alerts Configuration**:

- Create custom alerts:
  - Condition: "Failure rate > 10% for 5 minutes"
  - Action: Send email, Slack, webhook
  - Channels: Multiple recipients
- Alert history and status

#### API for Monitoring:

```javascript
GET /api/v1/metrics/queues
Response: { queues: [{ name, pending, processing, completed, failed }] }

GET /api/v1/metrics/workers
Response: { workers: [{ id, queue, status, currentJob, uptime }] }

GET /api/v1/metrics/jobs/timeline?from=X&to=Y&queue=Z
Response: { jobs: [{ id, start, end, status, duration }] }

GET /api/v1/metrics/job-duration-histogram?queue=X
Response: { buckets: [{ range: '0-1s', count: 1000 }, ...] }
```

#### Real-Time Updates:

- WebSocket connection to dashboard
- Server broadcasts events:
  - `job_completed`: { jobId, queue, duration }
  - `job_failed`: { jobId, queue, error }
  - `worker_started`: { workerId, queue }
  - `queue_backlog`: { queue, pendingCount }

#### Success Criteria:

- AI retry strategy reduces unnecessary retries by 30%+
- Failure prediction accuracy > 80%
- Dashboard loads metrics for 100M jobs in < 2 seconds
- Real-time updates appear within 500ms
- Workers can be scaled up/down from dashboard
- DLQ jobs can be bulk-retried efficiently

---

### **Tier 4: Admin Analytics Dashboard** (Week 4)

**Deep Analytics + System Optimization**

#### Admin Analytics Features:

**1. Job Performance Analytics**:

- **Execution Metrics**:
  - Total jobs processed (by day/week/month)
  - Success rate trends (line chart)
  - Average job duration by type (bar chart)
  - P50/P95/P99 latency percentiles
  - Slowest jobs (leaderboard with optimization suggestions)
- **Queue Health**:
  - Queue depth over time (are queues growing?)
  - Age of oldest pending job (staleness indicator)
  - Throughput (jobs/second by queue)
  - Worker utilization (busy vs idle time)

**2. Failure Analysis**:

- **Error Patterns**:
  - Most common error types (pie chart)
  - Error rate trends (increasing/decreasing?)
  - Jobs with highest failure rate (table)
  - Time-to-failure distribution (histogram)
- **Retry Analysis**:
  - Average retries per job type
  - Success rate by attempt number (1st, 2nd, 3rd attempt)
  - Cost of retries (wasted compute time)
  - AI suggestions for retry policy tuning

**3. Resource Utilization**:

- **Worker Metrics**:
  - Worker count over time (auto-scaled?)
  - CPU/Memory usage per worker (if tracked)
  - Worker idle time (underutilized workers?)
  - Worker crash rate
- **Queue Capacity**:
  - Redis memory usage (queue storage)
  - PostgreSQL disk usage (job metadata)
  - Kafka lag (if using Kafka)
  - Estimated time to clear backlog

**4. Cost Analysis** (if applicable):

- **Compute Costs**:
  - Worker hours by queue
  - Cost per job (estimate based on duration)
  - Most expensive job types
  - Optimization opportunities (AI-suggested)
- **Infrastructure**:
  - Database storage costs (job metadata growth)
  - Redis memory costs
  - Network egress (if workers call external APIs)

**5. SLA Monitoring**:

- **Latency SLAs**:
  - Jobs processed within SLA (e.g., 95% within 5 minutes)
  - SLA violations by queue
  - Trends: improving or degrading?
- **Availability**:
  - System uptime percentage
  - Downtime incidents (duration, cause)
  - MTTR (Mean Time To Recovery)

**6. Predictive Analytics** (AI):

- **Capacity Forecasting**:
  - Predict job volume for next 7/30 days
  - Worker capacity needed to meet SLAs
  - Cost projections
- **Anomaly Predictions**:
  - Predict future failure spikes (based on trends)
  - Identify queues at risk of overload
  - Suggest preemptive scaling

**7. Job Dependency Visualization**:

- Directed graph showing job dependencies
- Critical path analysis (which jobs block others?)
- Identify bottlenecks in job chains

#### Implementation:

```sql
-- Materialized views for fast analytics
CREATE MATERIALIZED VIEW analytics_daily_jobs AS
SELECT
  DATE(created_at) as date,
  queue_name,
  job_type,
  status,
  COUNT(*) as count,
  AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) as avg_duration,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (completed_at - started_at))) as p95_duration
FROM jobs
WHERE created_at > NOW() - INTERVAL '90 days'
GROUP BY DATE(created_at), queue_name, job_type, status;

-- Refresh hourly
REFRESH MATERIALIZED VIEW CONCURRENTLY analytics_daily_jobs;
```

#### Dashboard UI:

- **Executive Summary Page**:
  - Big numbers: Jobs processed today, Success rate, Avg duration
  - Trend indicators (up/down arrows with percentages)
  - Top 3 issues requiring attention (AI-identified)
- **Queue Deep Dive**:
  - Select queue → Detailed metrics
  - Compare queues side-by-side
  - Drill-down to individual job types
- **Worker Management**:
  - Auto-scaling configuration (min/max workers, triggers)
  - Manual scaling controls (+ / - buttons)
  - Worker logs and health checks
- **Cost Dashboard** (if applicable):
  - Monthly cost breakdown
  - Cost per queue/job type
  - Optimization recommendations (AI)
  - Cost trend projections

#### Success Criteria:

- Dashboard loads analytics for 100M jobs in < 3 seconds
- AI predictions achieve 85%+ accuracy
- Admins can identify and resolve issues within 5 minutes
- Cost analysis provides actionable optimization suggestions
- SLA compliance tracked accurately

---

## Data Volume Simulation Strategy

### Initial Seed:

```javascript
- 10 queues (email, sms, image, video, reports, webhooks, data-processing, ml-inference, notifications, cleanup)
- 100,000,000 jobs (past 30 days)
- Job type distribution:
  - Fast jobs (< 1s): 60%
  - Medium jobs (1-10s): 30%
  - Slow jobs (> 10s): 10%
- Success rate: 85% (first attempt), 10% succeed on retry, 5% permanent failure
- Temporal patterns: Peak hours 9am-5pm (70% of jobs)
```

### Load Testing Scenarios:

1. **Normal Load**: 1,000 jobs/sec submitted, 800 jobs/sec processed
2. **Spike**: 10,000 jobs/sec for 5 minutes (queue backlog test)
3. **Worker Crash**: Kill 50% of workers, test recovery
4. **DLQ Processing**: Retry 10,000 DLQ jobs simultaneously
5. **Long-Running Jobs**: Submit 1,000 jobs that take 5 minutes each

### Tools:

- k6 for API load testing
- Custom job submission scripts
- Redis benchmarking
- Worker crash simulations (SIGKILL)

---

## Key Learning Outcomes

1. **Distributed Systems**: Worker coordination, distributed locks, failure handling
2. **Queue Management**: Priority queues, rate limiting, backpressure
3. **Retry Logic**: Exponential backoff, idempotency, DLQ
4. **Job Orchestration**: Dependencies, batching, scheduling
5. **AI for Operations**: Failure prediction, auto-scaling, optimization
6. **Observability**: Monitoring, alerting, performance analysis

---

## Evaluation Criteria

- **Reliability**: No job loss, even with worker crashes
- **Performance**: Process 5K jobs/sec, low latency
- **Scalability**: Horizontal scaling (add workers → increase throughput)
- **AI Integration**: Intelligent retries, useful predictions
- **Monitoring**: Comprehensive dashboard, real-time updates
- **Code Quality**: Clean worker architecture, robust error handling, tests

---

---

# Project 9: Content Delivery Network (CDN) Simulation

## Project Overview

Build a simplified CDN system that demonstrates edge caching, origin server architecture, cache invalidation strategies, and geographic routing. The system serves static assets (images, videos, JavaScript, CSS) from multiple edge locations, implements intelligent caching policies, and provides analytics on cache performance. Focus on understanding cache hit rates, TTLs, and optimizing content delivery at scale.

---

## Tech Stack

- **Backend**: Node.js + Express (origin server + edge servers)
- **Database**: PostgreSQL (metadata, analytics) + Redis (cache storage)
- **Storage**: S3/MinIO (origin storage for assets)
- **Message Queue**: Kafka (cache events, analytics)
- **AI Integration**: Gemini/OpenAI for intelligent cache preloading, traffic prediction, and content optimization recommendations
- **Load Balancing**: Geographic DNS routing simulation or simple round-robin
- **Frontend**: React dashboard for CDN analytics and cache management

---

## Roles

1. **Content Publisher** - Upload assets, configure caching policies, purge cache
2. **Admin** - Monitor CDN health, analyze traffic, optimize cache strategies

---

## Progressive Tier Requirements

### **Tier 1: Core CDN Architecture** (Week 1)

**Backend Focus: Origin Server + Edge Caching**

#### Features:

- Origin server (stores all assets)
- Multiple edge servers (simulate different geographic locations)
- Cache-aside pattern (check cache → miss → fetch from origin → cache)
- Asset upload to origin
- Basic TTL-based cache expiration
- Cache statistics (hits, misses, hit rate)

#### Architecture:

```
User Request
    ↓
[Edge Server (NY)]  ← Cache (Redis)
    ↓ (cache miss)
[Origin Server]  ← S3/MinIO storage
```

#### Database Schema:

```sql
-- PostgreSQL (metadata)
assets (
  id UUID PRIMARY KEY,
  filename TEXT,
  content_type TEXT, -- 'image/jpeg', 'video/mp4', 'application/javascript'
  size_bytes BIGINT,
  storage_url TEXT, -- S3 URL
  cache_ttl INT DEFAULT 3600, -- seconds
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  INDEX idx_assets_filename (filename)
)

cache_policies (
  id UUID PRIMARY KEY,
  path_pattern TEXT, -- '/images/*', '/videos/*', '/static/js/*'
  ttl INT, -- Cache duration in seconds
  cache_control TEXT, -- 'public, max-age=3600'
  priority INT DEFAULT 5 -- For cache eviction (LRU with priority)
)

-- Redis (edge cache)
cache:{edge_location}:{asset_id} -> Binary data
cache_metadata:{edge_location}:{asset_id} -> Hash {size, content_type, expires_at, hit_count}
```

#### Asset Upload (to Origin):

```javascript
POST /api/v1/assets/upload
Headers: Content-Type: multipart/form-data

Body: FormData with file

Flow:
1. Upload file to S3/MinIO
2. Create database record
3. Return asset URL: https://cdn.example.com/{edge}/{asset_id}
```

#### Asset Request (from Edge):

```javascript
GET /cdn/{edge_location}/{asset_id}

Edge Server Logic:
1. Check Redis cache: cache:{edge}:{asset_id}
2. If HIT:
   - Increment hit_count
   - Return cached data with proper headers
3. If MISS:
   - Fetch from origin server (or S3 directly)
   - Store in Redis with TTL
   - Return data to user
   - Log cache miss event
```

#### Edge Server Implementation:

```javascript
// Edge server (multiple instances for different regions)
class EdgeServer {
  constructor(location, redisClient) {
    this.location = location; // 'us-east', 'eu-west', 'asia'
    this.redis = redisClient;
  }

  async handleRequest(assetId) {
    const cacheKey = `cache:${this.location}:${assetId}`;
    const metadataKey = `cache_metadata:${this.location}:${assetId}`;

    // Check cache
    const cached = await this.redis.get(cacheKey);
    const metadata = await this.redis.hgetall(metadataKey);

    if (cached && metadata && Date.now() < metadata.expires_at) {
      // Cache HIT
      await this.redis.hincrby(metadataKey, "hit_count", 1);
      await this.logCacheEvent("hit", assetId);

      return {
        data: cached,
        headers: {
          "Content-Type": metadata.content_type,
          "Cache-Control": `public, max-age=${metadata.ttl}`,
          "X-Cache": "HIT",
        },
      };
    }

    // Cache MISS - fetch from origin
    const asset = await this.fetchFromOrigin(assetId);

    // Store in cache
    const ttl = asset.cache_ttl || 3600;
    await this.redis.setex(cacheKey, ttl, asset.data);
    await this.redis.hmset(metadataKey, {
      size: asset.size,
      content_type: asset.content_type,
      expires_at: Date.now() + ttl * 1000,
      hit_count: 0,
    });
    await this.redis.expire(metadataKey, ttl);

    await this.logCacheEvent("miss", assetId);

    return {
      data: asset.data,
      headers: {
        "Content-Type": asset.content_type,
        "Cache-Control": `public, max-age=${ttl}`,
        "X-Cache": "MISS",
      },
    };
  }

  async fetchFromOrigin(assetId) {
    // Fetch from origin server or directly from S3
    const response = await fetch(`${ORIGIN_URL}/assets/${assetId}`);
    const data = await response.buffer();

    // Get metadata from database
    const metadata = await db.query("SELECT * FROM assets WHERE id = $1", [
      assetId,
    ]);

    return {
      data,
      size: data.length,
      content_type: metadata.rows[0].content_type,
      cache_ttl: metadata.rows[0].cache_ttl,
    };
  }

  async logCacheEvent(eventType, assetId) {
    // Log to Kafka for analytics
    await kafka.send({
      topic: "cdn.cache_events",
      messages: [
        {
          value: JSON.stringify({
            event: eventType,
            edge: this.location,
            asset_id: assetId,
            timestamp: Date.now(),
          }),
        },
      ],
    });
  }
}

// Start edge servers
const edgeNY = new EdgeServer("us-east", redisNY);
const edgeLondon = new EdgeServer("eu-west", redisLondon);
const edgeTokyo = new EdgeServer("asia", redisTokyo);
```

#### Geographic Routing (Simplified):

```javascript
// DNS-based routing simulation
// In reality, this would be done at DNS level (Geo-DNS)

app.get('/cdn/:asset_id', (req, res) => {
  const clientIP = req.ip;
  const edge = determineEdgeLocation(clientIP);

  // Route to appropriate edge server
  const edgeServer = edgeServers[edge];
  const asset = await edgeServer.handleRequest(req.params.asset_id);

  res.set(asset.headers);
  res.send(asset.data);
});

function determineEdgeLocation(ip) {
  // Simplified geolocation (in real CDN, use MaxMind GeoIP or similar)
  if (ip.startsWith('192.168.')) return 'us-east'; // Mock
  if (ip.startsWith('10.0.')) return 'eu-west';
  return 'asia';
}
```

#### API Endpoints:

- `POST /api/v1/assets/upload` - Upload asset to origin
- `GET /cdn/{asset_id}` - Fetch asset from CDN (with geo-routing)
- `GET /api/v1/assets/:id` - Get asset metadata
- `DELETE /api/v1/assets/:id` - Delete asset from origin
- `GET /api/v1/cache/stats?edge=X` - Get cache statistics

#### Success Criteria:

- Assets cached correctly at edge servers
- Cache hits return data from Redis (no origin request)
- Cache misses fetch from origin and populate cache
- TTL expiration works (stale data not served)
- Multiple edge locations handle requests independently

---

### **Tier 2: Advanced Caching + High Volume Simulation** (Week 2)

**Backend Focus: Cache Invalidation, Purging, LRU Eviction**

#### Advanced Caching Features:

**1. Manual Cache Purge**:

```javascript
POST /api/v1/cache/purge

Body:
{
  "assetId": "abc-123", // Optional: specific asset
  "edge": "us-east", // Optional: specific edge, or all edges
  "pattern": "/images/*" // Optional: purge by path pattern
}

// Purge asset from all edges
async function purgeAsset(assetId) {
  for (const edge of edgeLocations) {
    await redis[edge].del(`cache:${edge}:${assetId}`);
    await redis[edge].del(`cache_metadata:${edge}:${assetId}`);
  }

  await kafka.send({
    topic: 'cdn.cache_events',
    messages: [{
      value: JSON.stringify({
        event: 'purge',
        asset_id: assetId,
        timestamp: Date.now()
      })
    }]
  });
}
```

**2. Cache Invalidation Strategies**:

- **TTL-based**: Automatic expiration (already implemented)
- **Manual purge**: Publisher explicitly purges (API endpoint)
- **Versioned URLs**: Change asset URL when content updates
  ```javascript
  // Instead of /cdn/image.jpg
  // Use /cdn/image.jpg?v=2 (cache miss due to new URL)
  ```
- **Smart invalidation**: Kafka consumer invalidates cache when origin asset updated

**3. Cache Eviction (LRU with Priority)**:

```javascript
// When Redis reaches memory limit, evict least recently used items
// But consider priority (don't evict critical assets)

async function evictColdCache(edgeLocation) {
  // Find least accessed items
  const keys = await redis.keys(`cache_metadata:${edgeLocation}:*`);

  const items = await Promise.all(
    keys.map(async (key) => {
      const metadata = await redis.hgetall(key);
      return {
        key,
        hit_count: parseInt(metadata.hit_count) || 0,
        size: parseInt(metadata.size) || 0,
        priority: await getAssetPriority(key), // From cache_policies table
      };
    })
  );

  // Sort by (priority, hit_count) - evict low priority, low hit count first
  items.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return a.hit_count - b.hit_count;
  });

  // Evict bottom 10%
  const toEvict = items.slice(0, Math.ceil(items.length * 0.1));
  for (const item of toEvict) {
    const assetId = item.key.split(":")[2];
    await redis.del(`cache:${edgeLocation}:${assetId}`);
    await redis.del(item.key);
  }
}
```

**4. Cache Warming (Proactive Preloading)**:

```javascript
// Preload popular assets to cache before traffic spike
POST /api/v1/cache/warm

Body:
{
  "assetIds": ["id1", "id2", "id3"],
  "edges": ["us-east", "eu-west"] // Optional: specific edges
}

async function warmCache(assetIds, edges = allEdges) {
  for (const edge of edges) {
    for (const assetId of assetIds) {
      // Simulate a cache miss to populate cache
      await edgeServers[edge].handleRequest(assetId);
    }
  }
}
```

**5. Conditional Requests (ETag / If-Modified-Since)**:

```javascript
GET /cdn/{asset_id}
Headers:
  If-None-Modified: Wed, 15 Jan 2024 10:00:00 GMT
  OR
  If-None-Match: "abc123hash"

// Edge server checks if asset changed
if (asset.updated_at <= req.headers['if-none-modified']) {
  return res.status(304).send(); // Not Modified
}

res.set('ETag', asset.etag);
res.set('Last-Modified', asset.updated_at);
res.send(asset.data);
```

**6. Stale-While-Revalidate**:

```javascript
// Serve stale cached content while fetching fresh copy in background
Cache-Control: public, max-age=3600, stale-while-revalidate=86400

// If asset expired but within stale window:
if (cacheExpired && Date.now() < expiresAt + staleWindow) {
  // Serve stale data immediately
  res.send(cachedData);

  // Revalidate in background (non-blocking)
  refreshCacheInBackground(assetId);
}
```

#### High Volume Data Simulation:

```javascript
Seed Data:
- 1,000,000 assets (images, videos, JS, CSS)
- Asset size distribution:
  - Small (< 100KB): 60% (thumbnails, icons, CSS)
  - Medium (100KB - 10MB): 30% (images, JS bundles)
  - Large (> 10MB): 10% (videos, large images)
- 3 edge locations (US, Europe, Asia)
- 10 billion requests (past 30 days)
- Cache hit rate target: 90%+
```

#### Traffic Patterns:

- **Time-based**: Peak hours 9am-9pm (70% of traffic)
- **Geographic**: 50% US, 30% Europe, 20% Asia
- **Content type**: 60% images, 25% videos, 15% JS/CSS

#### Load Testing:

- 100,000 requests/second across all edges
- Test cache hit rate under load
- Simulate cache eviction (fill Redis to capacity)
- Test purge latency (how fast does purge propagate?)

#### Kafka Analytics Pipeline:

```javascript
// Consume cache events for real-time analytics
kafkaConsumer.on("message", async (message) => {
  const event = JSON.parse(message.value);

  // Aggregate cache hit rate by edge
  await incrementCacheMetric(event.edge, event.event); // 'hit' or 'miss'

  // Track popular assets
  if (event.event === "hit") {
    await redis.zincrby("popular_assets", 1, event.asset_id);
  }

  // Detect hot assets (sudden traffic spike)
  const recentRequests = await getRecentRequests(event.asset_id);
  if (recentRequests > THRESHOLD) {
    await alertAndPrecache(event.asset_id); // Warm cache on all edges
  }
});
```

#### Success Criteria:

- Cache hit rate > 90% under normal load
- Purge propagates to all edges within 5 seconds
- Cache eviction maintains high hit rate (evicts cold items)
- Cache warming preloads assets successfully
- System handles 100K requests/sec with low latency

---

### **Tier 3: AI-Powered Optimization + Analytics Dashboard** (Week 3)

**AI Integration + CDN Insights**

#### AI-Powered Features:

**1. Intelligent Cache Preloading** (Gemini/OpenAI):

```javascript
// Predict which assets will be requested soon based on patterns
// Features: time of day, day of week, historical traffic, trending content

const predictions = await aiModel.predictPopularAssets({
  time: new Date(),
  edge: "us-east",
  recent_popular: topAssets,
  upcoming_events: ["product_launch", "live_stream"],
});

// Preload predicted assets
await warmCache(predictions.assetIds, ["us-east"]);
```

**2. Traffic Prediction**:

```javascript
// Forecast traffic volume for capacity planning
const forecast = await aiModel.forecastTraffic({
  edge: "us-east",
  horizon: "7 days",
});

// forecast: [{ date, predicted_requests, confidence_interval }]

// Auto-scale Redis capacity if needed
if (forecast.peak > currentCapacity * 0.8) {
  await alertAdmins("Predicted traffic spike - consider scaling");
}
```

**3. Cache Policy Optimization**:

```javascript
// AI analyzes asset access patterns and suggests optimal TTLs
GET / api / v1 / analytics / cache - policy - suggestions;

const suggestions = await aiModel.suggestCachePolicies({
  assets: allAssets,
  access_patterns: historicalData,
});

// suggestions: [
//   { assetId: 'abc', currentTTL: 3600, suggestedTTL: 7200, reasoning: "Low update frequency, high hit rate" },
//   { assetId: 'def', currentTTL: 3600, suggestedTTL: 600, reasoning: "Frequently updated, serve fresh content" }
// ]
```

**4. Content Optimization Recommendations**:

```javascript
// Analyze assets and suggest optimizations
const recommendations = await aiModel.analyzeAssets({
  assetIds: ["image1", "video1", "bundle.js"],
});

// recommendations: [
//   { assetId: 'image1', suggestion: 'Convert to WebP format - reduce size by 40%' },
//   { assetId: 'video1', suggestion: 'Use adaptive bitrate streaming (HLS) - improve playback' },
//   { assetId: 'bundle.js', suggestion: 'Split into smaller chunks - improve cache hit rate' }
// ]
```

**5. Anomaly Detection**:

```javascript
// Detect unusual traffic patterns: DDoS, bot traffic, cache poisoning
const anomaly = await detectAnomaly({
  edge: "us-east",
  assetId: "image123",
  currentRequestRate: 100000, // requests/second
  historicalAverage: 1000,
});

if (anomaly.detected) {
  // Could be: DDoS, viral content, bot scraping
  await mitigateAnomaly(anomaly); // Rate limit, block IPs, etc.
}
```

#### Analytics Dashboard (Frontend):

**1. CDN Overview**:

- **Key Metrics** (big numbers):
  - Total requests today / this month
  - Cache hit rate (percentage gauge)
  - Bandwidth served (GB)
  - Average response time (ms)
- **Live Traffic Map**:
  - World map showing request volume by region
  - Real-time pulsing indicators for active edges

**2. Cache Performance**:

- **Hit Rate Trends** (line chart):
  - Cache hit rate over time (by edge, by content type)
  - Target line (e.g., 90% hit rate goal)
- **Cache Size and Evictions**:
  - Redis memory usage by edge (bar chart)
  - Eviction events over time
- **Top Cached Assets** (table):
  - Asset, Hit count, Size, Hit rate
  - Actions: Purge, Adjust TTL

**3. Traffic Analytics**:

- **Requests by Edge Location** (pie chart or bar chart)
- **Requests by Content Type** (pie chart)
- **Peak Hours Heatmap** (24x7 grid)
- **Response Time Distribution** (histogram)

**4. Asset Analytics**:

- **Most Popular Assets** (leaderboard):
  - Asset name, Requests, Bandwidth, Hit rate
- **Least Popular Assets** (candidates for eviction)
- **Largest Assets** (by size, bandwidth consumption)

**5. Cache Management Interface**:

- **Purge Tool**:
  - Select assets or path patterns
  - Purge single edge or all edges
  - Confirm before purging
- **Cache Warming Tool**:
  - Upload list of asset IDs
  - Select target edges
  - Monitor warming progress
- **TTL Configuration**:
  - Edit cache policies (path patterns, TTLs)
  - Preview impact (estimated hit rate change)

**6. Geographic Performance**:

- **Latency by Region** (world map with color coding)
- **Bandwidth by Region** (bar chart)
- **Cache hit rate by edge** (comparison table)

**7. Predictive Insights** (AI):

- **Traffic Forecast** (next 7 days, line chart with confidence bands)
- **Hot Content Predictions** (assets likely to spike soon)
- **Optimization Suggestions** (AI-generated, prioritized list)

#### Real-Time Updates:

- WebSocket for live metrics (requests/sec, hit rate)
- Server-Sent Events for traffic map updates
- Auto-refresh charts every 10 seconds

#### API Endpoints:

```javascript
GET /api/v1/analytics/overview
GET /api/v1/analytics/hit-rate?edge=X&start=Y&end=Z
GET /api/v1/analytics/traffic-by-edge
GET /api/v1/analytics/top-assets?limit=100
GET /api/v1/analytics/response-time-distribution
POST /api/v1/cache/purge (already defined)
POST /api/v1/cache/warm (already defined)
```

#### Success Criteria:

- AI preloading increases hit rate by 5%+
- Traffic predictions achieve 85%+ accuracy
- Cache policy suggestions improve performance measurably
- Dashboard loads analytics for 10B requests in < 3 seconds
- Real-time metrics update within 1 second

---

### **Tier 4: Admin Platform Dashboard + Advanced Features** (Week 4)

**System Monitoring + Content Delivery Optimization**

#### Admin Platform Features:

**1. System Health Monitoring**:

- **Edge Server Status**:
  - List of all edge servers (location, status, uptime)
  - Health checks (ping, response time)
  - Redis cluster health (memory, CPU, connections)
  - Actions: Restart server, Drain traffic, Add/remove edge
- **Origin Server Health**:
  - Storage usage (S3/MinIO)
  - API response times
  - Error rates
  - Database query performance

**2. Cost Analytics**:

- **Bandwidth Costs**:
  - Total bandwidth by edge (GB/TB)
  - Cost per edge (estimated based on pricing)
  - Trends: increasing or decreasing?
- **Storage Costs**:
  - Origin storage (S3)
  - Cache storage (Redis memory)
  - Growth rate projections
- **Optimization Opportunities**:
  - Large, rarely accessed assets (candidates for deletion)
  - Inefficient cache policies (high miss rate)
  - Bandwidth hogs (large assets with high traffic)

**3. Security & Access Control**:

- **Access Logs**:
  - All asset requests (IP, asset, timestamp, status)
  - Suspicious activity detection (bot traffic, scraping)
  - IP blocking interface
- **DDoS Protection**:
  - Rate limiting per IP (requests/second)
  - Geoblocking (block entire regions if needed)
  - Challenge-response for suspicious traffic (CAPTCHA)

**4. Content Management**:

- **Asset Library**:
  - Browse all assets (paginated, virtual scrolling)
  - Filters: content type, size range, upload date
  - Bulk actions: Delete, Update TTL, Purge cache
- **Upload History**:
  - Recent uploads (who, when, size)
  - Failed uploads (errors, retries)
- **Version Control**:
  - Track asset updates (versions)
  - Rollback to previous version
  - Compare versions (image diff, code diff)

**5. Performance Benchmarking**:

- **Response Time by Edge**:
  - Compare all edges side-by-side
  - Identify slow edges (network issues?)
  - P50/P95/P99 latency
- **Cache Efficiency**:
  - Hit rate by content type
  - Hit rate by TTL (are longer TTLs better?)
  - Eviction rate (too aggressive?)
- **Origin Load**:
  - Requests reaching origin (cache misses)
  - Origin response times
  - Origin bandwidth usage

**6. A/B Testing**:

- **Test Cache Policies**:
  - Split traffic: 50% uses TTL=3600, 50% uses TTL=7200
  - Compare hit rates, response times, user satisfaction
  - Automatically adopt better policy
- **Test Content Formats**:
  - Serve WebP to 50% users, JPEG to 50%
  - Measure performance impact

**7. Advanced Reporting**:

- **Daily/Weekly/Monthly Reports**:
  - Summary email: total requests, hit rate, bandwidth, costs
  - Trends and highlights
  - Action items (optimize these assets, scale these edges)
- **Custom Reports**:
  - Query builder (select dimensions, metrics, filters)
  - Save and schedule reports
  - Export as PDF/CSV

**8. Alerting & Notifications**:

- **Configure Alerts**:
  - Condition: "Hit rate < 85% for 10 minutes"
  - Channels: Email, Slack, PagerDuty, Webhook
  - Severity: Warning, Critical
- **Alert History**:
  - Past alerts with resolution notes
  - MTTR (Mean Time To Resolution)
- **Incident Management**:
  - Create incident from alert
  - Assign to team member
  - Track resolution steps

#### Implementation:

```sql
-- Analytics tables (aggregated from Kafka events)
CREATE TABLE analytics_hourly_traffic AS
SELECT
  date_trunc('hour', timestamp) as hour,
  edge,
  content_type,
  COUNT(*) as requests,
  SUM(CASE WHEN event = 'hit' THEN 1 ELSE 0 END) as cache_hits,
  SUM(CASE WHEN event = 'miss' THEN 1 ELSE 0 END) as cache_misses,
  SUM(response_size) as bandwidth_bytes
FROM cache_events
WHERE timestamp > NOW() - INTERVAL '90 days'
GROUP BY date_trunc('hour', timestamp), edge, content_type;

-- Materialized view for fast dashboard queries
REFRESH MATERIALIZED VIEW CONCURRENTLY analytics_hourly_traffic;
```

#### Dashboard UI:

- **Executive Dashboard**:
  - At-a-glance metrics (requests, hit rate, bandwidth, uptime)
  - Alerts panel (active incidents)
  - Quick actions (purge cache, view logs, scale edge)
- **Edge Management**:
  - Interactive map with edge locations
  - Click edge → Detailed metrics
  - Add new edge (select region, provision resources)
- **Cost Dashboard**:
  - Monthly cost breakdown (bandwidth, storage, compute)
  - Cost trends (increasing/decreasing?)
  - Savings opportunities (AI-suggested)

#### Success Criteria:

- Admin can diagnose and resolve issues within 5 minutes
- Cost analytics provides actionable insights (10%+ cost reduction opportunities)
- Security features detect and mitigate DDoS within 1 minute
- Performance benchmarking identifies bottlenecks accurately
- Reports export with all requested data (no missing metrics)

---

## Data Volume Simulation Strategy

### Initial Seed:

```javascript
- 1,000,000 assets (realistic mix of sizes and types)
- 3 edge locations (US-East, EU-West, Asia-Pacific)
- 10,000,000,000 requests (10 billion, past 30 days)
- Request distribution:
  - 60% images (thumbnails, photos)
  - 25% videos (various sizes)
  - 10% JavaScript/CSS
  - 5% other (fonts, JSON APIs)
- Cache hit rate: 85-95% (varies by edge and content type)
```

### Traffic Patterns:

- **Geographic**: 50% US, 30% Europe, 20% Asia
- **Temporal**: Peak hours (9am-9pm local time = 70%), off-peak (30%)
- **Content popularity**: Pareto (20% assets = 80% traffic)

### Load Testing Scenarios:

1. **Normal Load**: 50K requests/sec distributed across edges
2. **Viral Content**: One asset gets 500K requests/sec (cache warming test)
3. **Purge Storm**: Purge 10K assets simultaneously (propagation test)
4. **Cold Start**: All caches empty, sudden 100K requests/sec (origin load)

### Tools:

- k6 for HTTP load testing
- Custom request generator (simulate geographic distribution)
- Redis benchmarking
- S3/MinIO performance testing

---

## Key Learning Outcomes

1. **CDN Architecture**: Edge/origin design, geographic routing
2. **Caching Strategies**: TTL, LRU, cache invalidation, preloading
3. **Performance Optimization**: Cache hit rates, response times, bandwidth
4. **AI for CDN**: Traffic prediction, intelligent preloading, policy optimization
5. **Content Delivery**: Serving static assets at scale, compression, formats
6. **Monitoring**: Real-time analytics, performance benchmarking, cost tracking

---

## Evaluation Criteria

- **Cache Hit Rate**: Achieve 90%+ under normal load
- **Performance**: Edge response time < 50ms (cached), < 200ms (cache miss)
- **Scalability**: Handle 100K requests/sec across multiple edges
- **AI Integration**: Predictions improve performance measurably
- **Code Quality**: Clean edge server architecture, efficient caching logic
- **Dashboard**: Comprehensive analytics, actionable insights

---

---

# Project 10: Real-Time Collaborative Document Editor (Google Docs Clone)

## Project Overview

Build a real-time collaborative document editor where multiple users can simultaneously edit the same document. The system handles operational transformation (OT) or Conflict-Free Replicated Data Types (CRDTs) for conflict resolution, tracks document revisions, implements presence awareness (see who's online), and provides rich text editing capabilities. Focus on handling concurrent edits, maintaining consistency, and real-time synchronization.

---

## Tech Stack

- **Backend**: Node.js + Express + WebSocket (Socket.io)
- **Database**: PostgreSQL (documents, users, revisions) + Redis (presence, locks, operational transform queue)
- **Message Queue**: Kafka (document events, analytics, audit log)
- **AI Integration**: Gemini/OpenAI for smart suggestions, grammar checking, content summarization, and auto-completion
- **Frontend**: React with Slate.js or Draft.js (rich text editor) + WebSocket client
- **CRDT Library**: Yjs or Automerge for conflict-free collaborative editing

---

## Roles

1. **Editor** - Create, edit, and share documents, view collaborators
2. **Admin** - Monitor system health, view document analytics, manage users

---

## Progressive Tier Requirements

### **Tier 1: Core Document Editor** (Week 1)

**Backend Focus: Basic CRUD + Real-Time Sync**

#### Features:

- User authentication
- Create, read, update, delete documents
- Basic rich text editing (bold, italic, headings, lists)
- Real-time synchronization (multiple users see changes instantly)
- Presence awareness (show who's currently editing)
- Document permissions (private, shared with specific users)
- Simple conflict resolution (last-write-wins or operational transform)

#### Database Schema:

```sql
-- PostgreSQL
users (
  id UUID PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE,
  avatar_url TEXT,
  created_at TIMESTAMP
)

documents (
  id UUID PRIMARY KEY,
  title TEXT,
  content JSONB, -- Document structure (rich text)
  owner_id UUID,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  INDEX idx_documents_owner (owner_id)
)

document_collaborators (
  document_id UUID,
  user_id UUID,
  permission TEXT, -- 'view', 'edit', 'admin'
  added_at TIMESTAMP,
  PRIMARY KEY (document_id, user_id)
)

document_revisions (
  id UUID PRIMARY KEY,
  document_id UUID,
  content JSONB,
  author_id UUID,
  created_at TIMESTAMP,
  change_summary TEXT, -- "Added heading, edited paragraph 2"
  INDEX idx_revisions_document (document_id, created_at DESC)
)

-- Redis (real-time presence and operational transform)
presence:{document_id} -> Hash {user_id: {name, cursor_position, last_seen}}
ot_queue:{document_id} -> List of operations (for operational transform)
document_lock:{document_id} -> user_id (for optimistic locking)
```

#### Real-Time Synchronization Architecture:

```
User A (editing)
    ↓ WebSocket
[Server - Socket.io]
    ↓ Broadcast
User B, C, D (viewing/editing)
```

#### WebSocket Events:

```javascript
// Client → Server
{
  event: 'document:join',
  data: { documentId, userId }
}

{
  event: 'document:edit',
  data: {
    documentId,
    operation: { type: 'insert', position: 42, text: 'Hello' },
    timestamp: Date.now()
  }
}

{
  event: 'cursor:move',
  data: { documentId, userId, position: 42 }
}

// Server → Client
{
  event: 'document:operation',
  data: {
    operation: {...},
    author: { id, name, avatar },
    timestamp: Date.now()
  }
}

{
  event: 'presence:update',
  data: {
    online: [{ id, name, avatar, cursorPosition }]
  }
}
```

#### Operational Transform (Simplified):

```javascript
// Operational Transform handles concurrent edits
// Example: User A inserts "Hello" at position 0
//          User B simultaneously inserts "World" at position 0
// OT ensures both operations are applied correctly

class OperationalTransform {
  // Transform operation A against operation B
  static transform(opA, opB) {
    if (opA.type === "insert" && opB.type === "insert") {
      if (opA.position < opB.position) {
        // opB position shifts right
        return { ...opB, position: opB.position + opA.text.length };
      } else if (opA.position > opB.position) {
        // opA position shifts right
        return { ...opA, position: opA.position + opB.text.length };
      } else {
        // Same position - prioritize by timestamp or user ID
        return opA.timestamp < opB.timestamp ? opA : opB;
      }
    }

    if (opA.type === "delete" && opB.type === "insert") {
      // Handle delete vs insert conflicts
      // ... transformation logic
    }

    // ... more cases
  }

  // Apply operation to document
  static apply(document, operation) {
    switch (operation.type) {
      case "insert":
        return this.insertText(document, operation.position, operation.text);
      case "delete":
        return this.deleteText(document, operation.position, operation.length);
      case "format":
        return this.applyFormat(document, operation.range, operation.format);
      default:
        return document;
    }
  }

  static insertText(doc, position, text) {
    const content = doc.content;
    return {
      ...doc,
      content: content.slice(0, position) + text + content.slice(position),
    };
  }
}
```

#### WebSocket Server Implementation:

```javascript
// Socket.io server
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // Join document room
  socket.on("document:join", async ({ documentId, userId }) => {
    // Verify user has access
    const hasAccess = await checkDocumentAccess(documentId, userId);
    if (!hasAccess) {
      socket.emit("error", { message: "Access denied" });
      return;
    }

    // Join Socket.io room
    socket.join(`doc:${documentId}`);

    // Add to presence set
    await redis.hset(
      `presence:${documentId}`,
      userId,
      JSON.stringify({
        userId,
        name: socket.user.name,
        avatar: socket.user.avatar,
        joinedAt: Date.now(),
      })
    );

    // Send current document state
    const document = await getDocument(documentId);
    socket.emit("document:loaded", document);

    // Broadcast presence update to room
    const presence = await getPresence(documentId);
    io.to(`doc:${documentId}`).emit("presence:update", presence);

    // Log event to Kafka
    await kafka.send({
      topic: "document.events",
      messages: [
        {
          value: JSON.stringify({
            event: "user_joined",
            documentId,
            userId,
            timestamp: Date.now(),
          }),
        },
      ],
    });
  });

  // Handle document edits
  socket.on("document:edit", async ({ documentId, operation }) => {
    try {
      // Apply operational transform
      const transformedOp = await transformOperation(documentId, operation);

      // Apply to document in database
      await applyOperation(documentId, transformedOp);

      // Broadcast to all clients in room (except sender)
      socket.to(`doc:${documentId}`).emit("document:operation", {
        operation: transformedOp,
        author: {
          id: socket.user.id,
          name: socket.user.name,
          avatar: socket.user.avatar,
        },
      });

      // Acknowledge to sender
      socket.emit("operation:ack", { operationId: operation.id });

      // Log to Kafka
      await kafka.send({
        topic: "document.operations",
        messages: [
          {
            value: JSON.stringify({
              documentId,
              operation: transformedOp,
              userId: socket.user.id,
              timestamp: Date.now(),
            }),
          },
        ],
      });
    } catch (error) {
      socket.emit("error", { message: "Failed to apply operation" });
    }
  });

  // Handle cursor movement
  socket.on("cursor:move", async ({ documentId, position }) => {
    // Update presence
    await redis.hset(
      `presence:${documentId}`,
      socket.user.id,
      JSON.stringify({
        userId: socket.user.id,
        name: socket.user.name,
        avatar: socket.user.avatar,
        cursorPosition: position,
        lastSeen: Date.now(),
      })
    );

    // Broadcast cursor position
    socket.to(`doc:${documentId}`).emit("cursor:update", {
      userId: socket.user.id,
      position,
    });
  });

  // Handle disconnect
  socket.on("disconnect", async () => {
    // Remove from all presence sets
    const rooms = Array.from(socket.rooms);
    for (const room of rooms) {
      if (room.startsWith("doc:")) {
        const documentId = room.replace("doc:", "");
        await redis.hdel(`presence:${documentId}`, socket.user.id);

        // Broadcast presence update
        const presence = await getPresence(documentId);
        io.to(room).emit("presence:update", presence);
      }
    }
  });
});
```

#### API Endpoints:

```javascript
// Document CRUD
POST /api/v1/documents - Create new document
GET /api/v1/documents/:id - Get document
PUT /api/v1/documents/:id - Update document metadata (title, etc.)
DELETE /api/v1/documents/:id - Delete document
GET /api/v1/documents - List user's documents

// Collaboration
POST /api/v1/documents/:id/share - Share with user
GET /api/v1/documents/:id/collaborators - List collaborators
DELETE /api/v1/documents/:id/collaborators/:userId - Remove collaborator

// Revisions
GET /api/v1/documents/:id/revisions - List document revisions
GET /api/v1/documents/:id/revisions/:revisionId - Get specific revision
POST /api/v1/documents/:id/revert/:revisionId - Revert to revision
```

#### Auto-Save Mechanism:

```javascript
// Client-side: Save document every 5 seconds if changes detected
let hasUnsavedChanges = false;
let saveTimeout;

function onDocumentChange() {
  hasUnsavedChanges = true;
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(saveDocument, 5000);
}

async function saveDocument() {
  if (!hasUnsavedChanges) return;

  await fetch(`/api/v1/documents/${documentId}`, {
    method: "PUT",
    body: JSON.stringify({ content: editor.getContent() }),
  });

  hasUnsavedChanges = false;
}
```

#### Success Criteria:

- Multiple users can edit simultaneously without data loss
- Changes appear in real-time (< 500ms latency)
- Presence awareness shows who's online
- Basic conflict resolution works (no corrupted documents)
- Auto-save prevents data loss on disconnect

---

### **Tier 2: Advanced Collaboration + CRDT** (Week 2)

**Backend Focus: CRDT Implementation, Revision History, Comments**

#### CRDT Implementation (Using Yjs):

**Why CRDT over OT**: CRDTs guarantee eventual consistency without needing a central server for transformation. Better for peer-to-peer or decentralized architectures.

```javascript
// Server-side: Yjs document management
const Y = require("yjs");
const { WebsocketProvider } = require("y-websocket");

// Store Yjs documents in memory (or persist to database)
const documents = new Map();

function getYDoc(documentId) {
  if (!documents.has(documentId)) {
    const ydoc = new Y.Doc();

    // Load from database if exists
    loadDocumentFromDB(documentId).then((content) => {
      const ytext = ydoc.getText("content");
      ytext.insert(0, content);
    });

    documents.set(documentId, ydoc);
  }
  return documents.get(documentId);
}

// WebSocket provider for Yjs
const wsProvider = new WebsocketProvider(
  "ws://localhost:1234",
  "my-room",
  ydoc
);

// Persist changes to database
ydoc.on("update", async (update) => {
  // Persist to PostgreSQL
  await saveYjsUpdate(documentId, update);
});
```

```javascript
// Client-side: Yjs integration with rich text editor
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { yCollab } from "y-codemirror.next"; // Or y-prosemirror, y-quill

const ydoc = new Y.Doc();
const ytext = ydoc.getText("content");

// Connect to WebSocket server
const provider = new WebsocketProvider("ws://localhost:1234", documentId, ydoc);

// Bind to editor
const editor = new Editor({
  extensions: [yCollab(ytext, provider.awareness)],
});

// Yjs handles all conflict resolution automatically!
```

#### Advanced Features:

**1. Comments & Suggestions**:

```sql
-- PostgreSQL
comments (
  id UUID PRIMARY KEY,
  document_id UUID,
  author_id UUID,
  content TEXT,
  range_start INT, -- Character position
  range_end INT,
  status TEXT, -- 'open', 'resolved', 'deleted'
  parent_id UUID, -- For threaded replies
  created_at TIMESTAMP
)
```

```javascript
// WebSocket events for comments
socket.on("comment:add", async ({ documentId, range, content }) => {
  const comment = await createComment(
    documentId,
    socket.user.id,
    range,
    content
  );

  // Broadcast to all collaborators
  io.to(`doc:${documentId}`).emit("comment:added", comment);
});

socket.on("comment:resolve", async ({ commentId }) => {
  await resolveComment(commentId);
  io.to(`doc:${documentId}`).emit("comment:resolved", { commentId });
});
```

**2. Revision History with Snapshots**:

```javascript
// Create snapshot every N edits or every M minutes
async function createSnapshot(documentId) {
  const document = await getDocument(documentId);

  await db.query(
    `INSERT INTO document_revisions (document_id, content, author_id, change_summary)
     VALUES ($1, $2, $3, $4)`,
    [documentId, document.content, null, "Auto-save snapshot"]
  );
}

// Scheduled job: Create snapshots every 10 minutes
setInterval(() => {
  const activeDocuments = getActiveDocuments();
  for (const docId of activeDocuments) {
    createSnapshot(docId);
  }
}, 10 * 60 * 1000);
```

**3. Diff Visualization**:

```javascript
// Compare two revisions
GET /api/v1/documents/:id/revisions/diff?from=revisionA&to=revisionB

// Use diff-match-patch library
const dmp = new DiffMatchPatch();
const diffs = dmp.diff_main(revisionA.content, revisionB.content);
dmp.diff_cleanupSemantic(diffs);

return {
  diffs: diffs.map(([op, text]) => ({
    operation: op === 1 ? 'insert' : op === -1 ? 'delete' : 'equal',
    text
  }))
};
```

**4. Offline Support**:

```javascript
// Client-side: Queue operations when offline
const offlineQueue = [];

editor.on("change", (operation) => {
  if (!navigator.onLine) {
    offlineQueue.push(operation);
    showOfflineIndicator();
  } else {
    socket.emit("document:edit", { documentId, operation });
  }
});

// When back online, replay queued operations
window.addEventListener("online", () => {
  for (const operation of offlineQueue) {
    socket.emit("document:edit", { documentId, operation });
  }
  offlineQueue.length = 0;
  hideOfflineIndicator();
});
```

**5. Document Templates**:

```sql
document_templates (
  id UUID PRIMARY KEY,
  name TEXT,
  description TEXT,
  content JSONB,
  category TEXT,
  created_by UUID,
  is_public BOOLEAN DEFAULT false
)
```

```javascript
POST /api/v1/documents/from-template

Body:
{
  "templateId": "abc-123",
  "title": "My New Document"
}

// Creates new document with template content
```

**6. Export Formats**:

```javascript
GET /api/v1/documents/:id/export?format=pdf|docx|markdown|html

// Use libraries:
// - PDFKit for PDF generation
// - docxtemplater for DOCX
// - turndown for Markdown conversion
```

#### High Volume Data Simulation:

```javascript
Seed Data:
- 100,000 users
- 1,000,000 documents
- 50,000,000 document operations (edits) past 30 days
- 10,000,000 comments
- 5,000,000 document revisions
- Average document size: 5KB (2-3 pages)
- Average collaborators per document: 3
```

#### Load Testing:

- 10,000 concurrent users editing documents
- 1,000 users editing same document simultaneously
- Test CRDT conflict resolution with 100 simultaneous edits
- Measure synchronization latency under load
- Test offline → online sync with 1000 queued operations

#### Success Criteria:

- CRDT handles 100 concurrent edits without conflicts
- Synchronization latency < 200ms
- Revision history loads instantly (< 500ms)
- Comments thread correctly
- Offline mode queues and replays operations correctly
- Export to PDF/DOCX works for complex documents

---

### **Tier 3: AI-Powered Features + Performance Optimization** (Week 3)

**AI Integration + Scalability**

#### AI-Powered Features:

**1. Smart Auto-Complete** (Gemini/OpenAI):

```javascript
// As user types, suggest completions
socket.on(
  "autocomplete:request",
  async ({ documentId, text, cursorPosition }) => {
    const context = getDocumentContext(documentId, cursorPosition, 500); // 500 chars before cursor

    const suggestions = await aiModel.complete({
      context,
      partial: text,
    });

    socket.emit("autocomplete:suggestions", {
      suggestions: suggestions.slice(0, 3), // Top 3 suggestions
    });
  }
);
```

**2. Grammar & Spell Check**:

```javascript
// Real-time grammar checking
const grammarErrors = await aiModel.checkGrammar({
  text: paragraph,
  language: "en",
});

socket.emit("grammar:errors", {
  errors: grammarErrors.map((err) => ({
    range: [err.start, err.end],
    message: err.message,
    suggestions: err.replacements,
  })),
});
```

**3. Content Summarization**:

```javascript
POST /api/v1/documents/:id/summarize

const document = await getDocument(documentId);
const summary = await aiModel.summarize({
  text: document.content,
  maxLength: 200 // words
});

return { summary };
```

**4. Smart Formatting Suggestions**:

```javascript
// AI detects headings, lists, quotes and suggests formatting
const formatSuggestions = await aiModel.analyzeStructure({
  text: document.content,
});

// formatSuggestions: [
//   { range: [0, 20], suggestedFormat: 'heading1', confidence: 0.95 },
//   { range: [50, 150], suggestedFormat: 'bulletList', confidence: 0.85 }
// ]
```

**5. Intelligent Search**:

```javascript
GET /api/v1/documents/search?q=meeting notes from last week

// Semantic search using embeddings
const query = req.query.q;
const queryEmbedding = await aiModel.embed(query);

// Search documents by semantic similarity
const results = await searchDocumentsBySimilarity(queryEmbedding, userId);

return { documents: results };
```

**6. Writing Assistant**:

```javascript
// Suggest improvements to selected text
POST /api/v1/documents/:id/improve

Body:
{
  "text": "This is a sentence that could be better.",
  "style": "professional" // or "casual", "academic"
}

const improved = await aiModel.rewrite({
  text: body.text,
  style: body.style
});

return { suggestions: [improved] };
```

#### Performance Optimizations:

**1. Conflict-Free Data Structure (CRDT) Optimization**:

```javascript
// Use Yjs with efficient binary encoding
const stateVector = Y.encodeStateVector(ydoc);
const update = Y.encodeStateAsUpdate(ydoc, stateVector);

// Send compressed updates over WebSocket
socket.send(pako.deflate(update));
```

**2. Incremental Persistence**:

```javascript
// Don't save entire document on every change
// Instead, save only the operation/update

ydoc.on("update", async (update, origin) => {
  if (origin !== "load") {
    // Don't persist on load
    await db.query(
      `INSERT INTO document_updates (document_id, update_data, timestamp)
       VALUES ($1, $2, $3)`,
      [documentId, update, Date.now()]
    );
  }
});

// Periodically compact updates into snapshots
async function compactUpdates(documentId) {
  const updates = await getRecentUpdates(documentId);
  const ydoc = new Y.Doc();

  for (const update of updates) {
    Y.applyUpdate(ydoc, update);
  }

  const snapshot = Y.encodeStateAsUpdate(ydoc);

  // Save snapshot and delete old updates
  await saveSnapshot(documentId, snapshot);
  await deleteOldUpdates(documentId);
}
```

**3. Debounced Broadcasts**:

```javascript
// Don't broadcast every keystroke
// Batch operations and broadcast every 100ms

const operationBuffer = [];
let broadcastTimeout;

socket.on("document:edit", ({ documentId, operation }) => {
  operationBuffer.push(operation);

  clearTimeout(broadcastTimeout);
  broadcastTimeout = setTimeout(() => {
    // Broadcast batched operations
    socket.to(`doc:${documentId}`).emit("document:operations", {
      operations: operationBuffer,
      author: socket.user,
    });

    operationBuffer.length = 0;
  }, 100);
});
```

**4. Cursor Throttling**:

```javascript
// Throttle cursor position updates (max 10 per second)
const cursorThrottle = {};

socket.on("cursor:move", ({ documentId, position }) => {
  const key = `${socket.user.id}:${documentId}`;

  if (cursorThrottle[key] && Date.now() - cursorThrottle[key] < 100) {
    return; // Skip this update
  }

  cursorThrottle[key] = Date.now();

  // Broadcast cursor position
  socket.to(`doc:${documentId}`).emit("cursor:update", {
    userId: socket.user.id,
    position,
  });
});
```

**5. Lazy Loading Large Documents**:

```javascript
// Load document in chunks
GET /api/v1/documents/:id/content?range=0-10000

// Client requests initial chunk, then loads more as user scrolls
async function loadDocumentChunk(documentId, start, end) {
  const content = await db.query(
    `SELECT substring(content::text from $2 for $3) as chunk
     FROM documents
     WHERE id = $1`,
    [documentId, start, end - start]
  );

  return content.rows[0].chunk;
}
```

#### Frontend Optimizations:

**1. Virtual Scrolling for Long Documents**:

```javascript
// Only render visible portion of document
import { Virtuoso } from "react-virtuoso";

<Virtuoso
  totalCount={document.paragraphs.length}
  itemContent={(index) => (
    <Paragraph key={index} content={document.paragraphs[index]} />
  )}
/>;
```

**2. Collaborative Cursor Rendering**:

```javascript
// Show other users' cursors with names
function CollaboratorCursor({ user, position }) {
  return (
    <div
      className="cursor"
      style={{
        left: position.x,
        top: position.y,
        borderColor: user.color,
      }}
    >
      <div className="cursor-flag">{user.name}</div>
    </div>
  );
}
```

**3. Optimistic UI Updates**:

```javascript
// Apply changes locally immediately, rollback if server rejects
function applyOperation(operation) {
  // Apply to local editor state
  editor.applyOperation(operation);

  // Send to server
  socket.emit("document:edit", { documentId, operation }, (ack) => {
    if (!ack.success) {
      // Rollback if server rejected
      editor.undoOperation(operation);
      showError("Your change conflicted with another edit");
    }
  });
}
```

#### Success Criteria:

- AI auto-complete suggests relevant completions within 500ms
- Grammar checking processes 1000 words in < 1 second
- Summarization generates accurate summaries (human evaluation)
- Document with 100 concurrent editors synchronizes smoothly
- Large documents (10,000 words) load and scroll smoothly (60 FPS)
- WebSocket bandwidth < 10 KB/s per user (efficient updates)

---

### **Tier 4: Admin Dashboard + Analytics** (Week 4)

**System Monitoring + Usage Analytics**

#### Admin Dashboard Features:

**1. Real-Time System Health**:

- **Active Sessions**:
  - Total users online (live count)
  - Active documents being edited
  - WebSocket connections (count, health)
  - Server load (CPU, memory, connections)
- **Performance Metrics**:
  - Average synchronization latency (P50, P95, P99)
  - Operations per second (OPS)
  - Database query performance
  - Redis memory usage

**2. Document Analytics**:

- **Usage Metrics**:
  - Total documents created (by day/week/month)
  - Most edited documents (leaderboard)
  - Average document size (words, characters)
  - Collaboration rate (% of documents with >1 editor)
- **Revision Statistics**:
  - Total revisions created
  - Average revisions per document
  - Largest documents (by revision count)
- **Content Analysis**:
  - Word count distribution (histogram)
  - Most common document types (by content)
  - Document age distribution

**3. User Analytics**:

- **Engagement Metrics**:
  - Daily/monthly active users (DAU/MAU)
  - Average session duration
  - Documents per user (distribution)
  - Power users (top 10% by activity)
- **Collaboration Patterns**:
  - Average collaborators per document
  - Most collaborative users (share most)
  - Team activity (if teams/workspaces implemented)
- **Retention Analysis**:
  - User retention cohorts
  - Churn rate
  - Time to first document creation

**4. Collaboration Analytics**:

- **Real-Time Collaboration**:
  - Concurrent editors per document (max, average)
  - Conflict resolution rate (how often CRDTs resolve conflicts)
  - Comment activity (comments per document, response rate)
- **Edit Patterns**:
  - Peak editing hours (heatmap)
  - Average edits per session
  - Edit velocity (characters typed per minute)

**5. AI Feature Usage**:

- **Auto-Complete**:
  - Suggestions shown vs accepted (acceptance rate)
  - Most common completions
  - Time saved (estimated)
- **Grammar Check**:
  - Errors detected and fixed
  - Most common grammar issues
  - User correction rate
- **Summarization**:
  - Summaries generated
  - Average document length vs summary length
  - User feedback (thumbs up/down)

**6. System Capacity Planning** (Predictive AI):

- **Usage Forecast**:
  - Predict user growth (next 30/90 days)
  - Predict document storage needs
  - Estimate WebSocket connection capacity
- **Scaling Recommendations**:
  - Suggested server capacity
  - Database scaling needs
  - Redis memory requirements

**7. Performance Insights**:

- **Slow Documents**:
  - Documents with high synchronization latency
  - Large documents causing performance issues
  - Optimization suggestions (split document, reduce collaborators)
- **Network Analysis**:
  - WebSocket bandwidth usage by user
  - Reconnection frequency (network stability)
  - Geographic latency (by region)

#### Implementation:

```sql
-- Analytics materialized views
CREATE MATERIALIZED VIEW analytics_daily_documents AS
SELECT
  DATE(created_at) as date,
  COUNT(*) as documents_created,
  AVG(char_length(content::text)) as avg_document_size
FROM documents
WHERE created_at > NOW() - INTERVAL '90 days'
GROUP BY DATE(created_at);

CREATE MATERIALIZED VIEW analytics_user_activity AS
SELECT
  user_id,
  COUNT(DISTINCT document_id) as documents_edited,
  COUNT(*) as total_operations,
  MAX(timestamp) as last_active
FROM document_operations
WHERE timestamp > NOW() - INTERVAL '30 days'
GROUP BY user_id;

-- Refresh hourly
REFRESH MATERIALIZED VIEW CONCURRENTLY analytics_daily_documents;
```

```javascript
// Kafka consumer for real-time analytics
kafkaConsumer.on("message", async (message) => {
  const event = JSON.parse(message.value);

  switch (event.event) {
    case "user_joined":
      await incrementMetric("active_sessions");
      await trackUserActivity(event.userId);
      break;

    case "document_operation":
      await incrementMetric("operations_per_second");
      await trackDocumentEdit(event.documentId, event.userId);
      break;

    case "ai_autocomplete_accepted":
      await incrementMetric("ai_autocomplete_accepted");
      break;
  }
});
```

#### Dashboard UI:

**1. Overview Page**:

- Big numbers: Active users, Documents, Operations/sec
- Real-time charts: Active sessions over time, OPS
- Alerts: Performance issues, capacity warnings
- Quick stats: Top documents, Top users

**2. Documents Page**:

- Table of all documents (virtual scrolling)
- Filters: Date created, owner, size, collaborators
- Sort: By edits, by size, by collaborators
- Actions: View, Delete, Export analytics

**3. Users Page**:

- User list with activity metrics
- Search by name/email
- User detail view: Documents, Activity timeline, Collaboration network
- Actions: Suspend, Delete, View documents

**4. Real-Time Monitor**:

- Live feed of document edits (WebSocket stream)
- Active documents map (show which docs being edited)
- WebSocket connection status (by server)
- Performance graphs (auto-refresh every 5 seconds)

**5. Analytics Page**:

- Customizable date range
- Charts: Document creation trends, User growth, Collaboration rate
- Export reports (CSV, PDF)
- Scheduled reports (email daily/weekly)

**6. AI Insights Page**:

- AI feature usage statistics
- Model performance metrics (latency, accuracy)
- User feedback on AI suggestions
- A/B test results (if testing different AI models)

#### API Endpoints:

```javascript
GET /api/v1/admin/stats/overview
GET /api/v1/admin/stats/documents?from=X&to=Y
GET /api/v1/admin/stats/users?from=X&to=Y
GET /api/v1/admin/stats/collaboration?from=X&to=Y
GET /api/v1/admin/documents?page=1&sort=edits&filter=...
GET /api/v1/admin/users?page=1&sort=active&filter=...
GET /api/v1/admin/real-time/activity
```

#### Real-Time Dashboard Updates:

```javascript
// WebSocket for admin dashboard
io.of("/admin").on("connection", (socket) => {
  // Verify admin role
  if (!socket.user.isAdmin) {
    socket.disconnect();
    return;
  }

  // Send real-time metrics every second
  const interval = setInterval(async () => {
    const metrics = await getRealTimeMetrics();
    socket.emit("metrics:update", metrics);
  }, 1000);

  socket.on("disconnect", () => {
    clearInterval(interval);
  });
});
```

#### Success Criteria:

- Dashboard loads analytics for 1M documents in < 3 seconds
- Real-time metrics update within 1 second
- Admin can identify performance issues quickly
- Usage analytics provide actionable insights
- Capacity forecasts achieve 90%+ accuracy
- Reports export with complete data

---

## Data Volume Simulation Strategy

### Initial Seed:

```javascript
- 100,000 users
- 1,000,000 documents
- Average document: 1,000 words, 5KB
- 50,000,000 document operations (past 30 days)
- 10,000,000 comments
- 5,000,000 revisions
- Collaboration distribution:
  - 60% documents: 1 editor (private)
  - 30% documents: 2-5 editors
  - 10% documents: 6-20 editors (team documents)
```

### Realistic Patterns:

- Peak hours: 9am-5pm (80% of activity)
- Average edits per session: 50-200 operations
- Average session duration: 15 minutes
- Comment rate: 1 comment per 500 words

### Load Testing Scenarios:

1. **Normal Load**: 5,000 concurrent users editing
2. **Single Document Stress**: 100 users editing same document
3. **Reconnection Storm**: 10,000 users reconnect simultaneously
4. **Large Document**: 50,000-word document with 10 concurrent editors
5. **AI Burst**: 1,000 simultaneous auto-complete requests

### Tools:

- Socket.io load testing (artillery-plugin-socketio)
- Custom WebSocket client simulator
- k6 for HTTP API testing
- Database benchmarking

---

## Key Learning Outcomes

1. **Real-Time Collaboration**: WebSocket, operational transform, CRDT
2. **Conflict Resolution**: Handling concurrent edits, consistency
3. **Rich Text Editing**: Complex UI state management
4. **AI Integration**: Auto-complete, grammar checking, summarization
5. **Performance Optimization**: Efficient synchronization, lazy loading
6. **Scalability**: Horizontal scaling, load balancing WebSockets

---

## Evaluation Criteria

- **Real-Time Sync**: Changes propagate within 200ms
- **Conflict Handling**: CRDT resolves 100% of conflicts correctly
- **Scalability**: Handle 100 concurrent editors per document
- **AI Features**: Auto-complete acceptance rate > 30%
- **Performance**: Large documents (10K words) render smoothly
- **Code Quality**: Clean WebSocket handlers, efficient CRDT usage
- **Testing**: Unit tests, integration tests, WebSocket load tests

---

---

# Summary of All 10 Projects

You now have a comprehensive catalog of 10 backend-heavy projects, each with 4 progressive tiers that build skills in:

1. **Movie Ticket Booking** - Distributed locks, high-concurrency, event-driven architecture
2. **WhatsApp Clone** - Real-time messaging, typing indicators, message search
3. **Instagram Feed (Push)** - Fan-out on write, CDN, image delivery
4. **Facebook Newsfeed (Pull)** - Fan-in on read, caching, delta computation
5. **Gaming Leaderboard** - Real-time rankings, Redis sorted sets, time-windowed aggregations
6. **E-commerce Orders** - Saga pattern, microservices, fraud detection
7. **Log Aggregation** - Time-series data, stream processing, multi-tenancy
8. **Task Queue** - Job orchestration, retries, DLQ, distributed systems
9. **CDN Simulation** - Edge caching, cache invalidation, geographic routing
10. **Collaborative Editor** - CRDT, real-time sync, operational transform

Each project includes:

- ✅ Progressive tiers (Tier 1 → Tier 4)
- ✅ AI-powered features
- ✅ High volume data simulation strategies
- ✅ Multi-user support with roles
- ✅ Performant frontend with large datasets
- ✅ Admin dashboard with analytics
- ✅ Clear learning outcomes and evaluation criteria

These projects provide hands-on experience with production-grade backend systems and prepare your fellows for real-world software engineering challenges!

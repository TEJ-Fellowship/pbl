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

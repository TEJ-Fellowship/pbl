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

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

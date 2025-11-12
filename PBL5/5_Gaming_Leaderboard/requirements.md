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

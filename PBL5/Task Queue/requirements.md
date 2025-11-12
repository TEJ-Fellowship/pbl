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

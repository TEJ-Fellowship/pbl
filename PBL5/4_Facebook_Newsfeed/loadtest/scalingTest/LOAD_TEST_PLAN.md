# Realistic Load Testing Plan for 1200 Users

## Real-World Social Media Patterns

### User Activity Assumptions
- **Total Users**: 1200
- **Active Users**: 120 (10% - realistic for social media platforms)
- **Passive Users**: 1080 (90% - lurkers, occasional visitors)

### Realistic Activity Distribution
Based on real social media analytics:
- **Feed Browsing**: 65% of requests (most common - users scroll through feeds)
- **Post Creation**: 12% of requests (only 5-10% of users actively post)
- **Likes**: 18% of requests (common interaction, quick action)
- **Comments**: 5% of requests (less common, requires more engagement)

### Load Calculation for 120 Active Users

**Normal Usage Pattern:**
- Average user checks feed every 20-30 seconds
- Calculation: 120 users ÷ 25 seconds = **~5 req/s normal load**

**Active Usage Pattern:**
- Users actively browsing, checking feed every 10-15 seconds
- Calculation: 120 users ÷ 12 seconds = **~10 req/s active load**

**Peak Usage Pattern:**
- High engagement period (e.g., lunch break, evening)
- Users checking feed every 8-10 seconds
- Calculation: 120 users ÷ 9 seconds = **~13 req/s peak load**

**Stress Test:**
- Push system beyond normal to find breaking point
- **20-30 req/s** to test system limits

### Test Phases (Realistic)

1. **Warm-up** (60s): 3-5 req/s
   - Gradually start, warm up caches
   - Simulate system initialization

2. **Normal Load** (300s): 6-8 req/s
   - Typical daily usage pattern
   - Baseline performance measurement

3. **Active Load** (180s): 10-12 req/s
   - High engagement period
   - Simulates lunch break or evening activity

4. **Peak Load** (180s): 15-18 req/s
   - Peak usage time (e.g., viral post, trending topic)
   - Maximum realistic load

5. **Stress Test** (120s): 25-30 req/s
   - Push beyond normal to find breaking point
   - Identify system limits

6. **Slow Down** (120s): 8-5 req/s
   - Gradual decrease
   - Return to normal levels

7. **Cool-down** (60s): 3 req/s
   - Final phase
   - System recovery

### Expected Results
- **Normal Load**: Should handle smoothly (< 500ms response time)
- **Peak Load**: Should maintain performance (< 1s response time)
- **Stress Test**: May see degradation, identify bottlenecks

### Data Generation
- Generate enough test data for 10-minute test duration
- Ensure realistic distribution across 120 active users
- Post IDs should reference existing posts (1-6000 range)


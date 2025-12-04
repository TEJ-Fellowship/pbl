import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 10 },   // Ramp up to 10 RPS
    { duration: '1m', target: 10 },    // Stay at 10 RPS
    { duration: '30s', target: 20 },   // Ramp up to 20 RPS
    { duration: '1m', target: 20 },    // Stay at 20 RPS
    { duration: '30s', target: 50 },   // Ramp up to 50 RPS
    { duration: '1m', target: 50 },    // Stay at 50 RPS
    { duration: '30s', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95% of requests < 500ms, 99% < 1s
    http_req_failed: ['rate<0.01'],                  // Error rate < 1%
    errors: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';

export default function () {
  // Test 1: Create a post
  const postPayload = JSON.stringify({
    user_id: Math.floor(Math.random() * 100) + 1, // Random user 1-100
    content: `Load test post ${Date.now()}`,
  });

  const postParams = {
    headers: { 'Content-Type': 'application/json' },
    tags: { name: 'CreatePost' },
  };

  const postRes = http.post(`${BASE_URL}/api/posts`, postPayload, postParams);
  const postSuccess = check(postRes, {
    'post created status 201': (r) => r.status === 201,
    'post created response time < 500ms': (r) => r.timings.duration < 500,
  });
  errorRate.add(!postSuccess);

  sleep(1); // 1 second between requests

  // Test 2: Get feed
  const userId = Math.floor(Math.random() * 100) + 1;
  const feedRes = http.get(`${BASE_URL}/api/feed/${userId}`, {
    tags: { name: 'GetFeed' },
  });
  const feedSuccess = check(feedRes, {
    'feed status 200': (r) => r.status === 200,
    'feed response time < 300ms': (r) => r.timings.duration < 300,
  });
  errorRate.add(!feedSuccess);

  sleep(1);
}
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    stages: [
      { duration: '30s', target: 10 },   // Ramp up to 10 users
      { duration: '1m', target: 20 },    // Stay at 20 users
      { duration: '30s', target: 30 },   // Ramp up to 30 users
      { duration: '1m', target: 30 },    // Stay at 30 users (below 40 limit)
      { duration: '30s', target: 0 },    // Ramp down
    ],
    thresholds: {
      http_req_duration: ['p(95)<100'],  // 95% of requests < 100ms
      http_req_failed: ['rate<0.01'],    // Error rate < 1%
    },
  };

const BASE_URL = 'http://localhost:3001';

export default function () {
  // Test POST endpoint (create post)
  const postData = JSON.stringify({
    user_id: 1,
    content: `Load test post ${__VU}-${__ITER}`,
  });

  const params = {
    headers: { 'Content-Type': 'application/json' },
  };

  const postRes = http.post(`${BASE_URL}/api/posts`, postData, params);
  
  check(postRes, {
    'post status is 201': (r) => r.status === 201,
    'post response time < 100ms': (r) => r.timings.duration < 100,
    'post response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1); // Wait 1 second between requests
}
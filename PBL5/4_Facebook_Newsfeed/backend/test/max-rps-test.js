import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '1m', target: 100 },   // Ramp to 100 RPS
    { duration: '2m', target: 100 },   // Hold at 100 RPS
    { duration: '1m', target: 200 },   // Ramp to 200 RPS
    { duration: '2m', target: 200 },   // Hold at 200 RPS
    { duration: '1m', target: 500 },   // Ramp to 500 RPS
    { duration: '2m', target: 500 },   // Hold at 500 RPS
    { duration: '1m', target: 1000 },  // Ramp to 1000 RPS
    { duration: '2m', target: 1000 }, // Hold at 1000 RPS
    { duration: '1m', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'],
    http_req_failed: ['rate<0.05'], // Allow 5% errors at high load
    errors: ['rate<0.05'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';

export default function () {
  // Randomly choose an endpoint to test
  const endpoints = [
    {
      method: 'POST',
      url: `${BASE_URL}/api/posts`,
      body: JSON.stringify({
        user_id: Math.floor(Math.random() * 100) + 1,
        content: `Load test ${Date.now()}`,
      }),
      params: { headers: { 'Content-Type': 'application/json' } },
    },
    {
      method: 'GET',
      url: `${BASE_URL}/api/feed/${Math.floor(Math.random() * 100) + 1}`,
    },
    {
      method: 'GET',
      url: `${BASE_URL}/api/users/${Math.floor(Math.random() * 100) + 1}/posts?page=1`,
    },
  ];

  const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
  const res = endpoint.method === 'POST'
    ? http.post(endpoint.url, endpoint.body, endpoint.params)
    : http.get(endpoint.url);

  const success = check(res, {
    'status is 200 or 201': (r) => r.status === 200 || r.status === 201,
    'response time < 2000ms': (r) => r.timings.duration < 2000,
  });
  errorRate.add(!success);

  sleep(0.1); // 100ms between requests (10 RPS per virtual user)
}
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const postCreationTime = new Trend('post_creation_time');

export const options = {
  stages: [
    { duration: '30s', target: 50 },   // 50 concurrent users
    { duration: '1m', target: 50 },
    { duration: '30s', target: 100 },  // 100 concurrent users
    { duration: '1m', target: 100 },
    { duration: '30s', target: 200 },  // 200 concurrent users
    { duration: '1m', target: 200 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'],
    http_req_failed: ['rate<0.02'],
    post_creation_time: ['p(95)<500'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';

export default function () {
  const userId = Math.floor(Math.random() * 100) + 1;
  const payload = JSON.stringify({
    user_id: userId,
    content: `Stress test post ${Date.now()} from user ${userId}`,
  });

  const params = {
    headers: { 'Content-Type': 'application/json' },
    tags: { name: 'CreatePost' },
  };

  const startTime = Date.now();
  const res = http.post(`${BASE_URL}/api/posts`, payload, params);
  const duration = Date.now() - startTime;

  postCreationTime.add(duration);

  const success = check(res, {
    'post created': (r) => r.status === 201,
    'response time acceptable': (r) => r.timings.duration < 1000,
  });
  errorRate.add(!success);

  sleep(2); // 2 seconds between posts per user
}
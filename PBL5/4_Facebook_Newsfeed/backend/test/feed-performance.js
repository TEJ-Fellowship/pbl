import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const feedResponseTime = new Trend('feed_response_time');
const cacheHitRate = new Rate('cache_hits');

export const options = {
  stages: [
    { duration: '1m', target: 100 },   // 100 RPS
    { duration: '2m', target: 100 },
    { duration: '1m', target: 200 },   // 200 RPS
    { duration: '2m', target: 200 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    feed_response_time: ['p(95)<300', 'p(99)<500'],
    cache_hits: ['rate>0.5'], // At least 50% cache hits
    http_req_failed: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';

export default function () {
  const userId = Math.floor(Math.random() * 100) + 1;
  const res = http.get(`${BASE_URL}/api/feed/${userId}`, {
    tags: { name: 'GetFeed' },
  });

  feedResponseTime.add(res.timings.duration);

  const success = check(res, {
    'feed retrieved': (r) => r.status === 200,
    'fast response': (r) => r.timings.duration < 500,
  });

  // Check if response came from cache
  const body = JSON.parse(res.body);
  if (body.fromCache) {
    cacheHitRate.add(1);
  } else {
    cacheHitRate.add(0);
  }

  errorRate.add(!success);
  sleep(0.5); // 500ms between requests (2 RPS per user)
}
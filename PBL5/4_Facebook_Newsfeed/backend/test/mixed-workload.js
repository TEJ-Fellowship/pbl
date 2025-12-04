import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '2m', target: 50 },   // Ramp to 50 users
    { duration: '5m', target: 50 },   // Hold
    { duration: '2m', target: 100 },  // Ramp to 100 users
    { duration: '5m', target: 100 }, // Hold
    { duration: '2m', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'],
    http_req_failed: ['rate<0.02'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';

export default function () {
  const userId = Math.floor(Math.random() * 100) + 1;
  const postId = Math.floor(Math.random() * 1000) + 1;

  // 40% - Get feed
  if (Math.random() < 0.4) {
    const res = http.get(`${BASE_URL}/api/feed/${userId}`);
    check(res, { 'feed ok': (r) => r.status === 200 });
  }
  // 30% - Create post
  else if (Math.random() < 0.7) {
    const payload = JSON.stringify({
      user_id: userId,
      content: `Post ${Date.now()}`,
    });
    const res = http.post(`${BASE_URL}/api/posts`, payload, {
      headers: { 'Content-Type': 'application/json' },
    });
    check(res, { 'post created': (r) => r.status === 201 });
  }
  // 20% - Like post
  else if (Math.random() < 0.9) {
    const payload = JSON.stringify({ user_id: userId });
    const res = http.post(`${BASE_URL}/api/posts/${postId}/like`, payload, {
      headers: { 'Content-Type': 'application/json' },
    });
    check(res, { 'like ok': (r) => r.status === 200 || r.status === 201 });
  }
  // 10% - Get user posts
  else {
    const res = http.get(`${BASE_URL}/api/users/${userId}/posts?page=1`);
    check(res, { 'user posts ok': (r) => r.status === 200 });
  }

  sleep(1);
}
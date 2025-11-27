import http from "k6/http";
import { check } from "k6";

// Quick smoke test - minimal load to verify everything works
export const options = {
  vus: 1, // Single user
  duration: "10s",
  thresholds: {
    http_req_duration: ["p(95)<2000"],
    http_req_failed: ["rate<0.1"], // Allow up to 10% errors for smoke test
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";
const API_BASE = `${BASE_URL}/api`;

export default function () {
  // Health check
  const healthResponse = http.get(`${API_BASE}/health`);
  check(healthResponse, {
    "health check status 200": (r) => r.status === 200,
  });

  // Get products
  const productsResponse = http.get(`${API_BASE}/products?limit=5`);
  check(productsResponse, {
    "products status 200": (r) => r.status === 200,
    "products has data": (r) => {
      try {
        const data = JSON.parse(r.body);
        return data.success === true;
      } catch (e) {
        return false;
      }
    },
  });
}

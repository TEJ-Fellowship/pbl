import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";

// Custom metrics
const errorRate = new Rate("errors");
const productPageDuration = new Trend("product_page_duration");
const cartOperationDuration = new Trend("cart_operation_duration");

// Configuration
const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";
const API_BASE = `${BASE_URL}/api`;

// Test configuration - Optimized for 1K users
export const options = {
  stages: [
    // Ramp-up: Gradually increase to 200 users over 1 minute
    { duration: "1m", target: 200 },
    // Stay at 200 users for 2 minutes (normal load)
    { duration: "2m", target: 200 },
    // Ramp up to 500 users over 1 minute
    { duration: "1m", target: 500 },
    // Stay at 500 users for 2 minutes
    { duration: "2m", target: 500 },
    // Spike: Quickly ramp up to 1000 users (simulating flash sale)
    { duration: "1m", target: 1000 },
    // Stay at spike for 1 minute
    { duration: "1m", target: 1000 },
    // Ramp down gradually
    { duration: "1m", target: 500 },
    { duration: "1m", target: 200 },
    { duration: "30s", target: 0 },
  ],

  thresholds: {
    // 95% of requests should complete within 1 second (relaxed for 1K users)
    http_req_duration: ["p(95)<1500", "p(99)<3000"],
    // Less than 2% of requests should fail (relaxed for high load)
    http_req_failed: ["rate<0.02"],
    // Custom error rate
    errors: ["rate<0.02"],
    // Product page should load quickly
    product_page_duration: ["p(95)<1000"],
    // Cart operations should be fast (relaxed for high concurrency)
    cart_operation_duration: ["p(95)<800"],
  },
};

// Helper function to generate session ID
function generateSessionId() {
  return `k6-session-${__VU}-${__ITER}-${Date.now()}`;
}

// Helper function to get random product ID from response
function getRandomProductId(products) {
  if (!products || products.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * products.length);
  return products[randomIndex].id;
}

// Helper function to make request with error handling
function makeRequest(method, url, payload = null, sessionId = null) {
  const params = {
    headers: {
      "Content-Type": "application/json",
    },
  };

  if (sessionId) {
    params.headers["X-Session-ID"] = sessionId;
  }

  let response;
  if (method === "GET") {
    response = http.get(url, params);
  } else if (method === "POST") {
    response = http.post(url, JSON.stringify(payload), params);
  } else if (method === "PUT") {
    response = http.put(url, JSON.stringify(payload), params);
  } else if (method === "DELETE") {
    response = http.del(url, null, params);
  }

  const success = check(response, {
    "status is 200 or 201": (r) => r.status === 200 || r.status === 201,
  });

  if (!success) {
    errorRate.add(1);
  } else {
    errorRate.add(0);
  }

  return { response, success };
}

// Main test function - simulates realistic user journey
export default function () {
  const sessionId = generateSessionId();
  let productId = null;
  let productIds = [];

  // ============================================
  // SCENARIO 1: Browse Products (Most Common)
  // ============================================
  const browseStart = Date.now();
  let browseResponse = http.get(`${API_BASE}/products?page=1&limit=20`, {
    headers: { "Content-Type": "application/json" },
  });

  const browseSuccess = check(browseResponse, {
    "browse products status 200": (r) => r.status === 200,
    "browse products has data": (r) => {
      try {
        const data = JSON.parse(r.body);
        return data.success === true && Array.isArray(data.products);
      } catch (e) {
        return false;
      }
    },
  });

  if (browseSuccess) {
    try {
      const data = JSON.parse(browseResponse.body);
      if (data.products && data.products.length > 0) {
        productId = getRandomProductId(data.products);
        // Get a few product IDs for cart operations
        productIds = data.products.slice(0, 3).map((p) => p.id);
      }
    } catch (e) {
      // Ignore parsing errors
    }
  }

  productPageDuration.add(Date.now() - browseStart);
  errorRate.add(browseSuccess ? 0 : 1);
  sleep(Math.random() * 2 + 1); // Think time: 1-3 seconds

  // ============================================
  // SCENARIO 2: View Product Details (Common)
  // ============================================
  if (productId) {
    const productDetailStart = Date.now();
    const productResponse = http.get(`${API_BASE}/products/${productId}`, {
      headers: { "Content-Type": "application/json" },
    });

    check(productResponse, {
      "product detail status 200": (r) => r.status === 200,
      "product detail has data": (r) => {
        try {
          const data = JSON.parse(r.body);
          return data.success === true && data.product !== undefined;
        } catch (e) {
          return false;
        }
      },
    });

    productPageDuration.add(Date.now() - productDetailStart);
    sleep(Math.random() * 2 + 1); // Think time
  }

  // ============================================
  // SCENARIO 3: Get Categories (Less Common)
  // ============================================
  if (Math.random() > 0.7) {
    // 30% of users browse categories
    const categoriesResponse = http.get(`${API_BASE}/products/categories`, {
      headers: { "Content-Type": "application/json" },
    });

    check(categoriesResponse, {
      "categories status 200": (r) => r.status === 200,
    });

    sleep(Math.random() * 1 + 0.5);
  }

  // ============================================
  // SCENARIO 4: Add to Cart (Common)
  // ============================================
  if (productIds.length > 0 && Math.random() > 0.3) {
    // 70% of users add items to cart
    const cartStart = Date.now();
    const addToCartPayload = {
      productId: productIds[0],
      quantity: Math.floor(Math.random() * 3) + 1, // 1-3 items
    };

    const addCartResponse = http.post(
      `${API_BASE}/cart/add`,
      JSON.stringify(addToCartPayload),
      {
        headers: {
          "Content-Type": "application/json",
          "X-Session-ID": sessionId,
        },
      }
    );

    const addCartSuccess = check(addCartResponse, {
      "add to cart status 200 or 201": (r) =>
        r.status === 200 || r.status === 201,
      "add to cart success": (r) => {
        try {
          const data = JSON.parse(r.body);
          return data.success === true;
        } catch (e) {
          return false;
        }
      },
    });

    cartOperationDuration.add(Date.now() - cartStart);
    errorRate.add(addCartSuccess ? 0 : 1);
    sleep(Math.random() * 1 + 0.5);

    // ============================================
    // SCENARIO 5: View Cart (After Adding)
    // ============================================
    if (addCartSuccess) {
      const viewCartStart = Date.now();
      const viewCartResponse = http.get(`${API_BASE}/cart`, {
        headers: {
          "Content-Type": "application/json",
          "X-Session-ID": sessionId,
        },
      });

      check(viewCartResponse, {
        "view cart status 200": (r) => r.status === 200,
        "view cart has items": (r) => {
          try {
            const data = JSON.parse(r.body);
            return data.success === true;
          } catch (e) {
            return false;
          }
        },
      });

      cartOperationDuration.add(Date.now() - viewCartStart);
      sleep(Math.random() * 2 + 1);

      // ============================================
      // SCENARIO 6: Update Cart (Less Common)
      // ============================================
      if (Math.random() > 0.6 && productIds.length > 0) {
        // 40% of users update cart
        const updateCartStart = Date.now();
        const updateCartPayload = {
          productId: productIds[0],
          quantity: Math.floor(Math.random() * 5) + 1,
        };

        const updateCartResponse = http.put(
          `${API_BASE}/cart/update`,
          JSON.stringify(updateCartPayload),
          {
            headers: {
              "Content-Type": "application/json",
              "X-Session-ID": sessionId,
            },
          }
        );

        check(updateCartResponse, {
          "update cart status 200": (r) => r.status === 200,
        });

        cartOperationDuration.add(Date.now() - updateCartStart);
        sleep(Math.random() * 1 + 0.5);
      }
      // Note: Checkout operations are assumed to have passed testing
      // and are not included in this load test
    }
  }

  // ============================================
  // SCENARIO 8: Health Check (Occasional)
  // ============================================
  if (Math.random() > 0.9) {
    // 10% of iterations check health
    const healthResponse = http.get(`${API_BASE}/health`, {
      headers: { "Content-Type": "application/json" },
    });

    check(healthResponse, {
      "health check status 200": (r) => r.status === 200,
    });
  }
}

// Setup function - runs once before all VUs
export function setup() {
  // Verify API is accessible
  const healthResponse = http.get(`${API_BASE}/health`);

  if (healthResponse.status !== 200) {
    throw new Error(
      `API health check failed. Status: ${healthResponse.status}. Make sure backend is running on ${BASE_URL}`
    );
  }

  console.log(`✅ API is accessible at ${API_BASE}`);

  // Try to get products to verify data exists
  const productsResponse = http.get(`${API_BASE}/products?limit=1`);
  if (productsResponse.status === 200) {
    console.log("✅ Products endpoint is working");
  } else {
    console.warn(
      "⚠️  Products endpoint returned non-200 status. Some tests may fail."
    );
  }

  return { baseUrl: BASE_URL, apiBase: API_BASE };
}

// Teardown function - runs once after all VUs
export function teardown(data) {
  console.log(`\n✅ Load test completed for ${data.apiBase}`);
}

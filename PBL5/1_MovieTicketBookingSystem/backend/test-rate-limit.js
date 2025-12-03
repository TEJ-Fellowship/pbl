/**
 * Test script for rate limiting
 * Makes multiple requests quickly to test if rate limiting blocks after limit
 */

const axios = require("axios");

const BASE_URL = "http://localhost:3001";
const TEST_IP = "192.168.1.100"; // Simulated IP for testing

async function testRateLimiting() {
  console.log("🧪 Testing Rate Limiting\n");
  console.log("=".repeat(60));
  console.log(`Target: ${BASE_URL}/api/bookings`);
  console.log(`Simulated IP: ${TEST_IP}`);
  console.log(`Expected limit: 10 requests per minute (booking endpoint)`);
  console.log("=".repeat(60));
  console.log();

  const results = {
    success: 0,
    rateLimited: 0,
    errors: 0,
  };

  // Make 15 requests quickly (should exceed the 10 request limit)
  console.log("Making 15 requests quickly...\n");

  for (let i = 1; i <= 15; i++) {
    try {
      const response = await axios.post(
        `${BASE_URL}/api/bookings`,
        {
          seat_ids: [`seat${i}`],
        },
        {
          headers: {
            "X-Forwarded-For": TEST_IP, // Simulate same IP
          },
          validateStatus: () => true, // Don't throw on any status code
        }
      );

      if (response.status === 202 || response.status === 201) {
        results.success++;
        console.log(`✅ Request ${i}: Success (${response.status})`);
      } else if (response.status === 429) {
        results.rateLimited++;
        console.log(
          `🚫 Request ${i}: Rate Limited (429) - ${
            response.data.message || "Too Many Requests"
          }`
        );
        if (response.data.retryAfter) {
          console.log(`   Retry after: ${response.data.retryAfter} seconds`);
        }
      } else if (response.status === 409) {
        results.success++;
        console.log(
          `⚠️  Request ${i}: Conflict (409) - Seat already booked (expected)`
        );
      } else {
        results.errors++;
        console.log(`❌ Request ${i}: Unexpected status (${response.status})`);
        console.log(`   Response:`, response.data);
      }
    } catch (error) {
      results.errors++;
      if (error.code === "ECONNREFUSED") {
        console.log(`❌ Request ${i}: Server not running!`);
        console.log(`   Please start the server: npm run dev`);
        break;
      } else {
        console.log(`❌ Request ${i}: Error - ${error.message}`);
      }
    }

    // Small delay to avoid overwhelming
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  console.log();
  console.log("=".repeat(60));
  console.log("📊 Test Results:");
  console.log("=".repeat(60));
  console.log(`✅ Successful requests: ${results.success}`);
  console.log(`🚫 Rate limited requests: ${results.rateLimited}`);
  console.log(`❌ Errors: ${results.errors}`);
  console.log();

  // Analysis
  if (results.rateLimited > 0) {
    console.log("✅ Rate limiting is WORKING!");
    console.log(
      `   ${results.rateLimited} requests were blocked after limit exceeded.`
    );
    if (results.success <= 10) {
      console.log(
        `   ✅ First ${results.success} requests succeeded (within limit).`
      );
    }
  } else if (results.success > 10) {
    console.log("⚠️  Rate limiting might NOT be working!");
    console.log(
      `   ${results.success} requests succeeded (should be limited to 10).`
    );
    console.log("   Check if rate limiter middleware is properly configured.");
  } else {
    console.log("ℹ️  All requests succeeded (within limit).");
    console.log("   Try making more requests to test rate limiting.");
  }
  console.log();
}

// Run test
testRateLimiting().catch((error) => {
  console.error("Test failed:", error.message);
  process.exit(1);
});

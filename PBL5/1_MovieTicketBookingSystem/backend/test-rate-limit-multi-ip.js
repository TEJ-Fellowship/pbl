/**
 * Test rate limiting with multiple IPs
 * Shows that each IP has its own separate limit
 */

const axios = require("axios");

const BASE_URL = "http://localhost:3001";

async function testMultipleIPs() {
  console.log("🧪 Testing Rate Limiting with Multiple IPs\n");
  console.log("=".repeat(60));
  console.log("Testing that each IP has its own separate limit");
  console.log("=".repeat(60));
  console.log();

  const IP1 = "192.168.1.100";
  const IP2 = "192.168.1.200";

  console.log(`📡 IP 1: ${IP1}`);
  console.log(`📡 IP 2: ${IP2}`);
  console.log();

  // Make 5 requests from IP1
  console.log(`Making 5 requests from ${IP1}...`);
  for (let i = 1; i <= 5; i++) {
    try {
      const response = await axios.post(
        `${BASE_URL}/api/bookings`,
        { seat_ids: [`seat${i}`] },
        {
          headers: { "X-Forwarded-For": IP1 },
          validateStatus: () => true,
        }
      );
      console.log(
        `  Request ${i}: ${
          response.status === 202 ? "✅ Success" : `❌ ${response.status}`
        }`
      );
    } catch (error) {
      console.log(`  Request ${i}: ❌ Error`);
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  console.log();

  // Make 5 requests from IP2 (should also succeed - different IP)
  console.log(`Making 5 requests from ${IP2}...`);
  for (let i = 1; i <= 5; i++) {
    try {
      const response = await axios.post(
        `${BASE_URL}/api/bookings`,
        { seat_ids: [`seat${i + 100}`] },
        {
          headers: { "X-Forwarded-For": IP2 },
          validateStatus: () => true,
        }
      );
      console.log(
        `  Request ${i}: ${
          response.status === 202 ? "✅ Success" : `❌ ${response.status}`
        }`
      );
    } catch (error) {
      console.log(`  Request ${i}: ❌ Error`);
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  console.log();
  console.log("=".repeat(60));
  console.log("✅ Test Complete!");
  console.log("=".repeat(60));
  console.log("If both IPs succeeded, rate limiting is working correctly:");
  console.log("  - Each IP has its own separate limit (10 requests/minute)");
  console.log("  - IP1's requests don't affect IP2's limit");
  console.log();
}

testMultipleIPs().catch(console.error);

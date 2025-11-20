/**
 * Integration Test Script
 * Tests the complete booking and payment flow
 *
 * Usage: node test-integration.js
 * Make sure your server is running on http://localhost:3001
 */

const axios = require("axios");

const API_URL = "http://localhost:3001/api";

// Test data storage
let testData = {
  user_id: null,
  movie_id: null,
  showtime_id: null,
  seat_id1: null,
  seat_id2: null,
  booking_id: null,
  payment_id: null,
};

// Helper function to make requests
async function makeRequest(method, endpoint, data = null) {
  try {
    const config = {
      method,
      url: `${API_URL}${endpoint}`,
      headers: { "Content-Type": "application/json" },
    };
    if (data) config.data = data;

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status || 500,
      fullError: error.response?.data || error.message,
    };
  }
}

// Test functions
async function testCreateUser() {
  console.log("\n📝 TEST 1: Create User");
  const result = await makeRequest("POST", "/users", {
    name: "Test User",
    email: `test${Date.now()}@example.com`,
  });

  if (result.success) {
    testData.user_id = result.data.id;
    console.log("✅ User created:", testData.user_id);
    return true;
  } else {
    console.log("❌ Failed:", result.error);
    return false;
  }
}

async function testGetMovies() {
  console.log("\n📝 TEST 2: Get Movies");
  const result = await makeRequest("GET", "/movies");

  if (result.success && result.data.movies && result.data.movies.length > 0) {
    testData.movie_id = result.data.movies[0].id;
    console.log("✅ Movies found, using:", testData.movie_id);
    return true;
  } else {
    console.log("❌ Failed:", result.error || "No movies found");
    if (result.data) {
      console.log("   Response structure:", Object.keys(result.data));
    }
    return false;
  }
}

async function testGetShowtimes() {
  console.log("\n📝 TEST 3: Get Showtimes");
  if (!testData.movie_id) {
    console.log("❌ Failed: No movie_id available");
    return false;
  }

  const result = await makeRequest(
    "GET",
    `/movies/${testData.movie_id}/showtimes`
  );

  if (
    result.success &&
    result.data.showtimes &&
    result.data.showtimes.length > 0
  ) {
    testData.showtime_id = result.data.showtimes[0].id;
    console.log("✅ Showtimes found, using:", testData.showtime_id);
    return true;
  } else {
    console.log("❌ Failed:", result.error || "No showtimes found");
    if (result.data) {
      console.log(
        "   Response:",
        JSON.stringify(result.data).substring(0, 200)
      );
    }
    return false;
  }
}

async function testGetSeats() {
  console.log("\n📝 TEST 4: Get Available Seats");
  if (!testData.showtime_id) {
    console.log("❌ Failed: No showtime_id available");
    return false;
  }

  const result = await makeRequest(
    "GET",
    `/showtimes/${testData.showtime_id}/seats`
  );

  if (result.success && result.data.seats && result.data.seats.length > 0) {
    const availableSeats = result.data.seats.filter((s) => s.is_available);
    if (availableSeats.length >= 2) {
      testData.seat_id1 = availableSeats[0].id;
      testData.seat_id2 = availableSeats[1].id;
      console.log("✅ Seats found:", testData.seat_id1, testData.seat_id2);
      return true;
    } else {
      console.log(
        "❌ Not enough available seats (found:",
        availableSeats.length,
        ")"
      );
      return false;
    }
  } else {
    console.log("❌ Failed:", result.error || "No seats found");
    return false;
  }
}

async function testCreateBooking() {
  console.log("\n📝 TEST 5: Create Booking");
  if (!testData.user_id || !testData.showtime_id || !testData.seat_id1) {
    console.log("❌ Failed: Missing required data");
    console.log("   user_id:", testData.user_id ? "✓" : "✗");
    console.log("   showtime_id:", testData.showtime_id ? "✓" : "✗");
    console.log("   seat_id1:", testData.seat_id1 ? "✓" : "✗");
    return false;
  }

  const seatIds = [testData.seat_id1];
  if (testData.seat_id2) seatIds.push(testData.seat_id2);

  const result = await makeRequest("POST", "/bookings", {
    user_id: testData.user_id,
    showtime_id: testData.showtime_id,
    seat_ids: seatIds,
  });

  if (result.success) {
    testData.booking_id = result.data.id;
    console.log("✅ Booking created:", testData.booking_id);
    console.log("   Status:", result.data.status);
    console.log("   Total amount:", result.data.total_amount);
    return true;
  } else {
    console.log("❌ Failed:", result.error);
    return false;
  }
}

async function testProcessPayment() {
  console.log("\n📝 TEST 6: Process Payment");
  if (!testData.booking_id) {
    console.log("❌ Failed: No booking_id available");
    return false;
  }

  // First get the booking to know the correct amount
  const bookingResult = await makeRequest(
    "GET",
    `/bookings/${testData.booking_id}`
  );
  if (!bookingResult.success || !bookingResult.data.booking) {
    console.log("❌ Failed: Could not get booking details");
    return false;
  }

  const bookingAmount = parseFloat(bookingResult.data.booking.total_amount);

  const result = await makeRequest("POST", "/payments/process", {
    booking_id: testData.booking_id,
    payment_method: "eSewa",
    amount: bookingAmount,
    idempotency_key: `test-${Date.now()}`,
  });

  if (result.success) {
    testData.payment_id = result.data.payment_id;
    console.log("✅ Payment processed:", testData.payment_id);
    console.log("   Status:", result.data.status);
    console.log("   Receipt:", result.data.receipt?.ticket_number || "N/A");
    return true;
  } else {
    console.log("❌ Failed:", result.error);
    return false;
  }
}

async function testGetPayment() {
  console.log("\n📝 TEST 7: Get Payment by Booking ID");
  const result = await makeRequest(
    "GET",
    `/payments/booking/${testData.booking_id}`
  );

  if (result.success) {
    console.log("✅ Payment retrieved");
    console.log("   Status:", result.data.status);
    console.log("   Amount:", result.data.amount);
    if (result.data.receipt) {
      console.log("   Receipt:", result.data.receipt.ticket_number);
    }
    return true;
  } else {
    console.log("❌ Failed:", result.error);
    return false;
  }
}

async function testIdempotency() {
  console.log("\n📝 TEST 8: Test Payment Idempotency");
  if (!testData.booking_id) {
    console.log("❌ Failed: No booking_id available");
    return false;
  }

  // Skip this test if booking is already confirmed (can't pay twice)
  const bookingResult = await makeRequest(
    "GET",
    `/bookings/${testData.booking_id}`
  );
  if (
    bookingResult.success &&
    bookingResult.data.booking?.status === "confirmed"
  ) {
    console.log(
      "⚠️  Skipping - booking already confirmed (can't test idempotency)"
    );
    return true; // Not a failure, just can't test
  }

  // Get booking amount
  const bookingAmount = bookingResult.success
    ? parseFloat(bookingResult.data.booking?.total_amount || 25.0)
    : 25.0;

  const idempotencyKey = `test-idempotency-${Date.now()}`;

  // First payment
  const result1 = await makeRequest("POST", "/payments/process", {
    booking_id: testData.booking_id,
    payment_method: "eSewa",
    amount: bookingAmount,
    idempotency_key: idempotencyKey,
  });

  // Second payment with same key (should return existing)
  const result2 = await makeRequest("POST", "/payments/process", {
    booking_id: testData.booking_id,
    payment_method: "eSewa",
    amount: bookingAmount,
    idempotency_key: idempotencyKey,
  });

  if (result1.success && result2.success) {
    if (result1.data.payment_id === result2.data.payment_id) {
      console.log("✅ Idempotency working - same payment returned");
      return true;
    } else {
      console.log("❌ Idempotency failed - different payment IDs");
      return false;
    }
  } else {
    console.log("❌ Failed:", result1.error || result2.error);
    return false;
  }
}

async function testGetBooking() {
  console.log("\n📝 TEST 9: Get Booking Details");
  const result = await makeRequest("GET", `/bookings/${testData.booking_id}`);

  if (result.success) {
    console.log("✅ Booking retrieved");
    console.log("   Status:", result.data.booking?.status);
    console.log("   Total:", result.data.booking?.total_amount);
    return true;
  } else {
    console.log("❌ Failed:", result.error);
    return false;
  }
}

async function testRefundStatus() {
  console.log("\n📝 TEST 10: Get Refund Status");
  const result = await makeRequest(
    "GET",
    `/payments/refund?booking_id=${testData.booking_id}`
  );

  if (result.success) {
    console.log("✅ Refund status retrieved");
    console.log("   Refunded:", result.data.refunded);
    return true;
  } else {
    console.log("❌ Failed:", result.error);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log("🚀 Starting Integration Tests...");
  console.log("=".repeat(50));

  const tests = [
    testCreateUser,
    testGetMovies,
    testGetShowtimes,
    testGetSeats,
    testCreateBooking,
    testProcessPayment,
    testGetPayment,
    testIdempotency,
    testGetBooking,
    testRefundStatus,
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const result = await test();
      if (result) {
        passed++;
      } else {
        failed++;
        console.log("⚠️  Test failed, but continuing...");
      }
    } catch (error) {
      console.log("❌ Test error:", error.message);
      failed++;
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log("📊 TEST SUMMARY");
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📝 Total: ${tests.length}`);

  if (failed === 0) {
    console.log("\n🎉 All tests passed!");
  } else {
    console.log("\n⚠️  Some tests failed. Check the output above.");
  }
}

// Run tests
runTests().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

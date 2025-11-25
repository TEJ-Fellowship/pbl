/**
 * Seed Redis with dummy seats for load testing
 * Run: node backend/scripts/seedRedis.js
 */

const redis = require("../utils/redis");

async function seedRedis() {
  try {
    // Wait for Redis connection
    if (!redis.isReady) {
      console.log("Waiting for Redis connection...");
      await new Promise((resolve) => {
        redis.on("ready", resolve);
        setTimeout(resolve, 5000); // Timeout after 5 seconds
      });
    }

    if (!redis.isReady) {
      throw new Error("Redis connection failed");
    }

    console.log("✅ Redis connected");

    // Generate dummy seats (e.g., seat1, seat2, ..., seat1000)
    const totalSeats = 1000;
    const seatIds = [];
    for (let i = 1; i <= totalSeats; i++) {
      seatIds.push(`seat${i}`);
    }

    // Clear existing data (optional - comment out if you want to keep existing)
    await redis.del("available_seats");
    await redis.del("booked_seats");
    await redis.del("booking:pending");
    await redis.del("booking:confirmed");

    // Add all seats to available_seats SET
    if (seatIds.length > 0) {
      await redis.sAdd("available_seats", seatIds);
      console.log(`✅ Added ${seatIds.length} seats to available_seats`);
    }

    // Initialize empty booked_seats SET (Redis SETs don't need initialization)
    console.log("✅ Initialized booked_seats SET");

    // Get count to verify
    const availableCount = await redis.sCard("available_seats");
    console.log(`✅ Available seats count: ${availableCount}`);

    console.log("\n🎉 Redis seeded successfully!");
    console.log(`   - ${availableCount} seats available for booking`);
    console.log("   - Ready for load testing\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding Redis:", error);
    process.exit(1);
  }
}

seedRedis();


/**
 * Seed Redis with dummy seats for load testing
 * Also clears Kafka topic to remove old booking requests
 * Run: node backend/scripts/seedRedis.js
 */

const redis = require("../utils/redis");
const { recreateTopic } = require("../utils/kafka");
const config = require("../utils/config");

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

    // Recreate Kafka topic with correct partition count (removes old messages)
    console.log("🧹 Recreating Kafka topic with new partition count...");
    try {
      await recreateTopic(config.KAFKA_TOPIC_BOOKINGS, config.KAFKA_PARTITIONS);
      console.log(
        `✅ Kafka topic recreated with ${config.KAFKA_PARTITIONS} partitions`
      );
    } catch (kafkaError) {
      console.warn(
        "⚠️  Could not recreate Kafka topic (Kafka might not be running):",
        kafkaError.message
      );
      console.log("   Continuing with Redis seeding...");
    }

    // Generate dummy seats (e.g., seat1, seat2, ..., seat150000)
    // 150,000 seats ensures full booking flow testing (not just conflict checks)
    const totalSeats = 150000;
    const seatIds = [];
    for (let i = 1; i <= totalSeats; i++) {
      seatIds.push(`seat${i}`);
    }

    console.log(`📦 Generated ${seatIds.length} seat IDs`);

    // Clear existing data (optional - comment out if you want to keep existing)
    console.log("🧹 Clearing existing data...");

    // Clear sets
    await redis.del("available_seats");
    await redis.del("booked_seats");
    await redis.del("booking:pending");
    await redis.del("booking:confirmed");

    // Clear all individual booking keys using SCAN (non-blocking)
    console.log("   Clearing all booking keys...");
    let cursor = "0"; // SCAN cursor must be string in Redis v5
    let deletedCount = 0;
    do {
      const result = await redis.scan(cursor, {
        MATCH: "booking:*",
        COUNT: "100", // Must be string in Redis v5
      });
      cursor = String(result.cursor || result[0] || "0");
      const keys = result.keys || result[1] || [];

      if (keys.length > 0) {
        // Filter out set keys (we already deleted those)
        const keysToDelete = keys.filter(
          (key) =>
            key !== "booking:pending" &&
            key !== "booking:confirmed" &&
            !key.startsWith("booking:pending") &&
            !key.startsWith("booking:confirmed")
        );

        if (keysToDelete.length > 0) {
          await redis.del(keysToDelete);
          deletedCount += keysToDelete.length;
        }
      }
    } while (cursor !== "0");

    // Clear all lock keys
    console.log("   Clearing all lock keys...");
    cursor = "0";
    let lockDeletedCount = 0;
    do {
      const result = await redis.scan(cursor, {
        MATCH: "lock:*",
        COUNT: "100", // Must be string in Redis v5
      });
      cursor = String(result.cursor || result[0] || "0");
      const keys = result.keys || result[1] || [];

      if (keys.length > 0) {
        await redis.del(keys);
        lockDeletedCount += keys.length;
      }
    } while (cursor !== "0");

    // Clear rate limiting keys (optional - comment out if you want to keep rate limit counters)
    console.log("   Clearing rate limiting keys...");
    cursor = "0";
    let rateLimitDeletedCount = 0;
    do {
      const result = await redis.scan(cursor, {
        MATCH: "ratelimit:*",
        COUNT: "100", // Must be string in Redis v5
      });
      cursor = String(result.cursor || result[0] || "0");
      const keys = result.keys || result[1] || [];

      if (keys.length > 0) {
        await redis.del(keys);
        rateLimitDeletedCount += keys.length;
      }
    } while (cursor !== "0");

    if (deletedCount > 0) {
      console.log(`   ✅ Deleted ${deletedCount} booking keys`);
    }
    if (lockDeletedCount > 0) {
      console.log(`   ✅ Deleted ${lockDeletedCount} lock keys`);
    }
    if (rateLimitDeletedCount > 0) {
      console.log(`   ✅ Deleted ${rateLimitDeletedCount} rate limiting keys`);
    }

    // Add all seats to available_seats SET using chunks (faster for large datasets)
    if (seatIds.length > 0) {
      console.log(
        `📥 Adding ${seatIds.length} seats to available_seats (using chunks)...`
      );
      const chunkSize = 1000; // Add 1000 seats at a time
      let added = 0;
      const totalSeatsCount = seatIds.length;

      for (let i = 0; i < seatIds.length; i += chunkSize) {
        const chunk = seatIds.slice(i, i + chunkSize);
        await redis.sAdd("available_seats", chunk);
        added += chunk.length;
        // Show progress every 10,000 seats
        if (added % 10000 === 0 || added === totalSeatsCount) {
          const percent = ((added / totalSeatsCount) * 100).toFixed(1);
          console.log(
            `   Progress: ${added}/${totalSeatsCount} seats added (${percent}%)`
          );
        }
      }
      console.log(`✅ Added ${seatIds.length} seats to available_seats`);
    }

    // Initialize empty booked_seats SET (Redis SETs don't need initialization)
    console.log("✅ Initialized booked_seats SET");

    // Get count to verify
    const availableCount = await redis.sCard("available_seats");
    console.log(`✅ Available seats count: ${availableCount}`);

    console.log("\n🎉 Redis seeded successfully!");
    console.log(`   - ${availableCount} seats available for booking`);
    console.log("   - Kafka topic cleared (old messages removed)");
    console.log("   - Ready for load testing");
    console.log(
      "\n⚠️  Note: Restart your server to reconnect consumer to the new topic\n"
    );

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding Redis:", error);
    process.exit(1);
  }
}

seedRedis();

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

    // Recreate Kafka topics with correct partition count (removes old messages)
    console.log("🧹 Recreating Kafka topics with new partition count...");
    try {
      // Clear booking requests topic
      await recreateTopic(config.KAFKA_TOPIC_BOOKINGS, config.KAFKA_PARTITIONS);
      console.log(
        `✅ Kafka topic '${config.KAFKA_TOPIC_BOOKINGS}' recreated with ${config.KAFKA_PARTITIONS} partitions`
      );

      // Clear payment intent requests topic (10 partitions for payment intents)
      await recreateTopic(config.KAFKA_TOPIC_PAYMENT_INTENTS, 10);
      console.log(
        `✅ Kafka topic '${config.KAFKA_TOPIC_PAYMENT_INTENTS}' recreated with 10 partitions`
      );
    } catch (kafkaError) {
      console.warn(
        "⚠️  Could not recreate Kafka topics (Kafka might not be running):",
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
    await redis.del("available_seats");
    await redis.del("booked_seats");
    await redis.del("booking:pending");
    await redis.del("booking:confirmed");

    // Clear all locks (seat locks from previous requests)
    const lockKeys = await redis.keys("lock:*");
    if (lockKeys.length > 0) {
      await redis.del(lockKeys);
      console.log(`   Cleared ${lockKeys.length} locks`);
    }

    // Clear all booking keys (old bookings)
    const bookingKeys = await redis.keys("booking:*");
    if (bookingKeys.length > 0) {
      // Filter out set keys (booking:pending, booking:confirmed)
      const actualBookingKeys = bookingKeys.filter(
        (key) => key !== "booking:pending" && key !== "booking:confirmed"
      );
      if (actualBookingKeys.length > 0) {
        await redis.del(actualBookingKeys);
        console.log(`   Cleared ${actualBookingKeys.length} booking keys`);
      }
    }

    // Clear request_id mappings
    const requestKeys = await redis.keys("request:*");
    if (requestKeys.length > 0) {
      await redis.del(requestKeys);
      console.log(`   Cleared ${requestKeys.length} request_id mappings`);
    }

    // Clear failed booking attempts
    const failedBookingKeys = await redis.keys("booking:failed:*");
    if (failedBookingKeys.length > 0) {
      await redis.del(failedBookingKeys);
      console.log(
        `   Cleared ${failedBookingKeys.length} failed booking attempts`
      );
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
    console.log("   - Kafka topics cleared (old messages removed)");
    console.log("     * booking-requests topic recreated");
    console.log("     * payment-intent-requests topic recreated");
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

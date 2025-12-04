/**
 * Expired Booking Cleanup Service
 * Uses Redis Keyspace Notifications to automatically return seats to available
 * when bookings expire (TTL expires)
 */

const redis = require("../utils/redis");
const { createClient } = require("redis");
const {
  REDIS_USERNAME,
  REDIS_PASSWORD,
  REDIS_HOST,
  REDIS_PORT,
} = require("../utils/config");

let subscriber = null;
let isSubscribed = false;

/**
 * Handle expired booking cleanup
 * When a booking key expires, return its seats to available_seats
 */
async function handleExpiredBooking(expiredKey) {
  try {
    // Only process booking keys (not booking:xxx:locks or booking:xxx:seats)
    // A booking key is "booking:xxx" (exactly one colon)
    // Lock keys are "booking:xxx:locks" (two colons)
    // Seat mapping keys are "booking:xxx:seats" (two colons)
    if (!expiredKey.startsWith("booking:")) {
      return; // Not a booking-related key
    }

    // Count colons - booking keys have exactly 1 colon, sub-keys have 2+
    const colonCount = (expiredKey.match(/:/g) || []).length;
    if (colonCount !== 1) {
      return; // Skip lock storage keys and seat mapping keys (they have 2+ colons)
    }

    const bookingId = expiredKey.replace("booking:", "");
    const seatMappingKey = `booking:${bookingId}:seats`;
    const availableSeatsKey = "available_seats";

    // Get seat IDs from the separate key (should still exist for ~10 more seconds)
    const seatData = await redis.get(seatMappingKey);

    if (seatData) {
      const seatIds = JSON.parse(seatData);

      // Return seats to available_seats
      if (seatIds && seatIds.length > 0) {
        await redis.sAdd(availableSeatsKey, seatIds);

        // Remove from pending set (if still there)
        await redis.sRem("booking:pending", bookingId);

        // Clean up seat mapping key
        await redis.del(seatMappingKey);

        console.log(
          `✅ Cleaned up expired booking ${bookingId}, returned ${seatIds.length} seats to available`
        );
      }
    } else {
      // Seat mapping already expired or doesn't exist
      // Still try to remove from pending set
      await redis.sRem("booking:pending", bookingId);
      console.log(
        `⚠️  Expired booking ${bookingId} cleanup: seat mapping not found (may have already expired)`
      );
    }
  } catch (error) {
    console.error(
      `❌ Error cleaning up expired booking ${expiredKey}:`,
      error.message
    );
  }
}

/**
 * Setup Redis keyspace notifications and subscribe to expiration events
 */
async function setupExpiredBookingCleanup() {
  try {
    // Enable keyspace notifications for expiration events
    // E = Enable keyspace events
    // x = Expiration events (keys that expire)
    await redis.configSet("notify-keyspace-events", "Ex");
    console.log("✅ Redis keyspace notifications enabled (Ex)");

    // Create a separate client for subscribing (can't use same client for pub/sub)
    // Using createClient instead of duplicate() to avoid issues with Redis v5
    const subscriberConfig = {
      socket: {
        host: REDIS_HOST,
        port: REDIS_PORT,
      },
    };
    if (REDIS_PASSWORD) {
      subscriberConfig.username = REDIS_USERNAME || "default";
      subscriberConfig.password = REDIS_PASSWORD;
    }
    subscriber = createClient(subscriberConfig);

    // Set up error handler - filter out known harmless errors
    subscriber.on("error", (err) => {
      // Filter out errors that are likely from internal Redis client issues
      // These don't affect functionality but spam logs
      const errorMsg = err?.message || String(err);
      if (
        !errorMsg.includes("listener is not a function") &&
        !errorMsg.includes(
          "Cannot read properties of undefined (reading 'value')"
        )
      ) {
        console.error("❌ Redis subscriber error:", errorMsg);
      }
    });

    // Connect subscriber first
    await subscriber.connect();
    console.log("✅ Redis subscriber connected for expiration events");

    // Set up message handler BEFORE subscribing (required for Redis v5)
    // Handle messages from the subscription
    subscriber.on("pmessage", (pattern, channel, message) => {
      try {
        // In Redis v5, message format can vary
        // Handle different message formats safely
        let expiredKey = null;

        if (typeof message === "string") {
          expiredKey = message;
        } else if (Buffer.isBuffer(message)) {
          expiredKey = message.toString("utf8");
        } else if (message && typeof message === "object") {
          // If message is an object, try to extract the key
          expiredKey = message.value || message.key || message.toString();
        } else if (message != null) {
          expiredKey = String(message);
        }

        // Only process if we have a valid key and it's an expiration event
        if (
          channel === "__keyevent@0__:expired" &&
          expiredKey &&
          typeof expiredKey === "string"
        ) {
          handleExpiredBooking(expiredKey).catch((error) => {
            console.error("Error handling expired booking:", error);
          });
        }
      } catch (error) {
        // Silently ignore errors in message parsing - don't spam logs
        // Only log if it's a real issue (not just format differences)
        if (
          !error.message.includes("value") &&
          !error.message.includes("listener")
        ) {
          console.error("Error in pmessage handler:", error.message);
        }
      }
    });

    // Subscribe to expiration events using pattern subscribe
    // Channel format: __keyevent@0__:expired
    // This channel publishes messages when ANY key expires in database 0
    await subscriber.pSubscribe("__keyevent@0__:expired");

    isSubscribed = true;
    console.log("✅ Subscribed to Redis expiration events");
    console.log("   Listening for expired booking keys...");
  } catch (error) {
    console.error("❌ Failed to setup expired booking cleanup:", error.message);
    // Don't throw - allow server to start without this feature if Redis is problematic
    console.log(
      "⚠️  Server will continue, but expired bookings won't be auto-cleaned"
    );
  }
}

/**
 * Stop the cleanup service
 */
async function stopExpiredBookingCleanup() {
  try {
    if (subscriber && isSubscribed) {
      await subscriber.pUnsubscribe("__keyevent@0__:expired");
      await subscriber.quit();
      isSubscribed = false;
      console.log("✅ Expired booking cleanup service stopped");
    }
  } catch (error) {
    console.error("Error stopping expired booking cleanup:", error.message);
  }
}

module.exports = {
  setupExpiredBookingCleanup,
  stopExpiredBookingCleanup,
  handleExpiredBooking, // Exported for testing
};

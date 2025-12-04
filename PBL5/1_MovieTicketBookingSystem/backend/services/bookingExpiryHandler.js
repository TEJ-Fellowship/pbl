/**
 * Booking Expiry Handler
 * Uses Redis keyspace notifications to detect when bookings expire
 * and automatically releases seats back to available_seats
 */

const redis = require("../utils/redis");
const { releaseLocks } = require("../utils/redisLock");

let expirySubscriber = null;
let isInitialized = false;

/**
 * Initialize Redis keyspace notifications for expired bookings
 * This listens for when booking keys expire (after TTL)
 */
async function initializeExpiryHandler() {
  if (isInitialized) {
    console.log("⚠️  Booking expiry handler already initialized");
    return;
  }

  try {
    // Enable keyspace notifications in Redis
    // This needs to be done via Redis CLI or config, but we'll try to set it programmatically
    // Note: This requires Redis CONFIG command permissions
    try {
      await redis.configSet("notify-keyspace-events", "Ex");
      console.log("✅ Enabled Redis keyspace notifications for expired keys");
    } catch (configError) {
      console.warn(
        "⚠️  Could not enable keyspace notifications via CONFIG (may need Redis admin permissions)"
      );
      console.warn(
        "   You may need to set 'notify-keyspace-events Ex' in redis.conf or via redis-cli"
      );
      console.warn(
        "   Command: redis-cli CONFIG SET notify-keyspace-events Ex"
      );
    }

    // Create a separate Redis client for subscribing to keyspace notifications
    // We need a dedicated subscriber client (can't use the same client for pub/sub and commands)
    const { createClient } = require("redis");
    const config = require("../utils/config");

    const subscriberConfig = {
      socket: {
        host: config.REDIS_HOST,
        port: config.REDIS_PORT,
      },
    };

    if (config.REDIS_PASSWORD) {
      subscriberConfig.username = config.REDIS_USERNAME || "default";
      subscriberConfig.password = config.REDIS_PASSWORD;
    }

    expirySubscriber = createClient(subscriberConfig);

    expirySubscriber.on("error", (err) => {
      // Only log non-trivial errors to avoid spam
      if (
        !err.message?.includes("value") &&
        !err.message?.includes("Cannot read properties")
      ) {
        console.error("❌ Expiry subscriber error:", err.message);
      }
    });

    expirySubscriber.on("connect", () => {
      console.log("✅ Expiry subscriber connecting...");
    });

    expirySubscriber.on("ready", () => {
      console.log("✅ Expiry subscriber ready");
    });

    await expirySubscriber.connect();

    // Set up the message handler BEFORE subscribing
    // In node-redis v5, pmessage event signature is: (message, channel, pattern)
    // where message is the expired key name
    const messageHandler = async (message, channel, pattern) => {
      try {
        // Extract the expired key from the message
        // message can be a Buffer or string
        let expiredKey = null;

        if (message) {
          if (Buffer.isBuffer(message)) {
            expiredKey = message.toString("utf8");
          } else if (typeof message === "string") {
            expiredKey = message;
          } else if (message && typeof message === "object") {
            // Sometimes node-redis wraps it in an object
            expiredKey = message.toString?.() || String(message);
          }
        }

        // Only process booking keys (format: booking:uuid)
        if (
          expiredKey &&
          typeof expiredKey === "string" &&
          expiredKey.startsWith("booking:") &&
          !expiredKey.includes(":locks") &&
          !expiredKey.includes(":seats")
        ) {
          const bookingId = expiredKey.replace("booking:", "");
          await handleExpiredBooking(bookingId);
        }
      } catch (error) {
        // Silently ignore errors - the expiry handler is optional
        // Bookings will still expire via TTL even if this fails
        // Don't log to avoid spam
      }
    };

    expirySubscriber.on("pmessage", messageHandler);

    // Subscribe to expired key events for booking keys
    // Pattern: __keyevent@0__:expired (0 is the database number)
    await expirySubscriber.pSubscribe("__keyevent@*__:expired");

    isInitialized = true;
    console.log(
      "✅ Booking expiry handler initialized (listening for expired bookings)"
    );
  } catch (error) {
    console.error("❌ Error initializing expiry handler:", error);
    throw error;
  }
}

/**
 * Handle an expired booking
 * Releases seats back to available_seats and cleans up related data
 */
async function handleExpiredBooking(bookingId) {
  try {
    if (!redis.isReady) {
      console.warn(
        `⚠️  Redis not ready, skipping expiry handling for booking ${bookingId}`
      );
      return;
    }

    // Try to get seat_ids from the separate storage key
    // This key has a slightly longer TTL (310s vs 300s) to ensure we can read it
    const seatsKey = `booking:${bookingId}:seats`;
    const seatIdsJson = await redis.get(seatsKey);

    let seatIds = [];

    if (seatIdsJson) {
      try {
        seatIds = JSON.parse(seatIdsJson);
      } catch (parseError) {
        console.error(
          `❌ Error parsing seat_ids for expired booking ${bookingId}:`,
          parseError
        );
      }
    } else {
      // Fallback: Try to get from booking:pending set and check if it's still there
      // If not, the booking might have been confirmed or cancelled
      const isPending = await redis.sIsMember("booking:pending", bookingId);
      if (!isPending) {
        // Booking was likely confirmed or cancelled, don't release seats
        console.log(
          `ℹ️  Expired booking ${bookingId} is not in pending set (likely confirmed/cancelled), skipping seat release`
        );
        return;
      }
      // If we can't get seat_ids, log warning but continue cleanup
      console.warn(
        `⚠️  Could not retrieve seat_ids for expired booking ${bookingId}, seats may not be released`
      );
    }

    // Release locks if they exist
    const lockStorageKey = `booking:${bookingId}:locks`;
    const storedLocks = await redis.get(lockStorageKey);

    if (storedLocks) {
      try {
        const locks = JSON.parse(storedLocks);
        await releaseLocks(locks);
        await redis.del(lockStorageKey);
      } catch (lockError) {
        console.error(
          `❌ Error releasing locks for expired booking ${bookingId}:`,
          lockError
        );
      }
    }

    // Release seats back to available_seats
    if (seatIds && seatIds.length > 0) {
      const availableSeatsKey = "available_seats";
      await redis.sAdd(availableSeatsKey, seatIds);
      console.log(
        `♻️  Released ${
          seatIds.length
        } seat(s) back to available for expired booking ${bookingId}: ${seatIds.join(
          ", "
        )}`
      );
    }

    // Remove from pending set
    await redis.sRem("booking:pending", bookingId);

    // Clean up the seats storage key
    if (seatIdsJson) {
      await redis.del(seatsKey);
    }

    console.log(`✅ Cleaned up expired booking ${bookingId}`);
  } catch (error) {
    console.error(`❌ Error handling expired booking ${bookingId}:`, error);
  }
}

/**
 * Store seat_ids separately for expiry tracking
 * This key has a slightly longer TTL (310s) than the booking (300s)
 * to ensure we can read it when the booking expires
 */
async function storeSeatsForExpiry(bookingId, seatIds) {
  try {
    const expiryKey = `booking:${bookingId}:seats`;
    // Store with slightly longer TTL (310s vs 300s) to ensure we can read it on expiry
    await redis.setEx(expiryKey, 310, JSON.stringify(seatIds));
  } catch (error) {
    console.error(
      `❌ Error storing seats for expiry tracking ${bookingId}:`,
      error
    );
  }
}

/**
 * Cleanup: Disconnect the subscriber client
 */
async function disconnect() {
  try {
    if (expirySubscriber) {
      await expirySubscriber.quit();
      expirySubscriber = null;
      isInitialized = false;
      console.log("✅ Expiry handler disconnected");
    }
  } catch (error) {
    console.error("❌ Error disconnecting expiry handler:", error);
  }
}

module.exports = {
  initializeExpiryHandler,
  handleExpiredBooking,
  storeSeatsForExpiry,
  disconnect,
};

require("dotenv").config();
const { Kafka } = require("kafkajs");
const Redis = require("ioredis");
const { KAFKA_BROKERS, KAFKA_CLIENT_ID, REDIS_HOST, REDIS_PORT } = require("./config");

// Kafka client with connection pooling (KafkaJS handles this internally)
const kafka = new Kafka({
  clientId: KAFKA_CLIENT_ID,
  brokers: KAFKA_BROKERS.split(","),
  retry: {
    retries: 8,
    initialRetryTime: 100,
    multiplier: 2,
  },
});

// Create producer (reusable connection)
const producer = kafka.producer({
  maxInFlightRequests: 1,
  idempotent: true,
  transactionTimeout: 30000,
});

// Create consumer with connection pooling
const consumer = kafka.consumer({
  groupId: "leaderboard-updater",
  sessionTimeout: 30000,
  heartbeatInterval: 3000,
});

// Redis connection pool (ioredis handles pooling internally)
const redis = new Redis({
  host: REDIS_HOST,
  port: REDIS_PORT,
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  // Connection pool settings
  enableReadyCheck: true,
  lazyConnect: true,
});

// Redis error handling
redis.on("error", (err) => {
  console.error("Redis connection error:", err);
});

redis.on("connect", () => {
  console.log("Redis connected");
});

// Connect to all services
const connectToDatabase = async () => {
  try {
    // Connect Redis
    await redis.connect();
    const redisPing = await redis.ping();
    console.log("✅ Redis connected:", redisPing);

    // Connect Kafka producer
    await producer.connect();
    console.log("✅ Kafka producer connected");

    // Create topics if they don't exist
    const admin = kafka.admin();
    await admin.connect();
    try {
      await admin.createTopics({
        topics: [
          {
            topic: "score-submitted",
            numPartitions: 10,
            replicationFactor: 1,
          },
          {
            topic: "leaderboard-updated",
            numPartitions: 3,
            replicationFactor: 1,
          },
        ],
        waitForLeaders: true,
      });
      console.log("✅ Kafka topics created/verified");
    } catch (err) {
      // Topic might already exist, which is fine
      if (!err.message?.includes("already exists")) {
        console.warn("⚠️ Topic creation warning:", err.message);
      }
    }
    await admin.disconnect();

    // Connect Kafka consumer
    await consumer.connect();
    console.log("✅ Kafka consumer connected");

    // Note: Subscription happens in the consumer startup
    // We don't subscribe here to allow dynamic fromBeginning flag

    return { producer, consumer, redis, kafka };
  } catch (err) {
    console.error("❌ Failed to connect to services:", err);
    process.exit(1);
  }
};

/**
 * Reset consumer group offset to earliest available position
 * This allows replaying messages from Kafka to rebuild leaderboards
 */
const resetConsumerOffsetToEarliest = async () => {
  try {
    const admin = kafka.admin();
    await admin.connect();

    const groupId = consumer?.options?.groupId || "leaderboard-updater";

    console.log(`🔄 Resetting consumer group '${groupId}' offset to earliest...`);

    try {
      await consumer.disconnect();
      console.log("   Disconnected consumer");
    } catch (disconnectError) {
      console.log("   Consumer not connected, skipping disconnect");
    }

    try {
      await admin.deleteGroups([groupId]);
      console.log(`✅ Deleted consumer group '${groupId}' - offsets will reset to earliest`);
    } catch (deleteError) {
      if (deleteError.message && deleteError.message.includes("does not exist")) {
        console.log(`   Consumer group '${groupId}' does not exist yet (will start from beginning)`);
      } else {
        console.log(`⚠️ Could not delete consumer group: ${deleteError.message}`);
      }
    }

    await admin.disconnect();

    try {
      await consumer.connect();
      console.log("   Reconnected consumer");
    } catch (reconnectError) {
      console.error("❌ Error reconnecting consumer:", reconnectError);
      return false;
    }

    return true;
  } catch (error) {
    console.error("❌ Error resetting consumer offset:", error);
    try {
      await consumer.connect();
    } catch (reconnectError) {
      console.error("❌ Error reconnecting consumer:", reconnectError);
    }
    return false;
  }
};

// Graceful shutdown
const disconnect = async () => {
  try {
    await consumer.disconnect();
    await producer.disconnect();
    await redis.quit();
    console.log("✅ All connections closed");
  } catch (err) {
    console.error("Error disconnecting:", err);
  }
};

module.exports = {
  connectToDatabase,
  disconnect,
  producer,
  consumer,
  redis,
  kafka,
  resetConsumerOffsetToEarliest,
};
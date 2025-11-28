/**
 * Kafka Client Utility
 * Creates and exports Kafka client instance
 */

const { Kafka } = require("kafkajs");
const config = require("./config");

// Create Kafka client
const kafka = new Kafka({
  clientId: config.KAFKA_CLIENT_ID,
  brokers: config.KAFKA_BROKERS.split(","), // Support multiple brokers
});

// Create admin client for topic management
const admin = kafka.admin();

// Producer instance (lazy initialization)
let producer = null;

// Consumer instance (lazy initialization)
let consumer = null;

/**
 * Get or create Kafka producer
 * @returns {Promise<Producer>}
 */
async function getProducer() {
  if (!producer) {
    producer = kafka.producer({
      allowAutoTopicCreation: true,
      transactionTimeout: 30000,
    });
    await producer.connect();
    console.log("✅ Kafka producer connected");
  }
  return producer;
}

/**
 * Get or create Kafka consumer
 * @param {string} groupId - Consumer group ID
 * @returns {Promise<Consumer>}
 */
async function getConsumer(groupId = config.KAFKA_GROUP_ID) {
  if (!consumer) {
    consumer = kafka.consumer({
      groupId,
      // Performance optimizations
      sessionTimeout: 30000, // 30 seconds
      heartbeatInterval: 3000, // 3 seconds
      maxInFlightRequests: 1, // Process one batch at a time per partition
      minBytes: 1, // Minimum bytes to fetch (lower = faster response)
      maxBytes: 10485760, // 10MB max batch size
      maxWaitTimeInMs: 5000, // Wait max 5s for batch
    });
    await consumer.connect();
    console.log(`✅ Kafka consumer connected (group: ${groupId})`);
  }
  return consumer;
}

/**
 * Ensure Kafka topics exist
 * @param {Array<string>} topics - Array of topic names
 */
async function ensureTopics(topics) {
  try {
    await admin.connect();
    console.log("✅ Kafka admin connected");

    const existingTopics = await admin.listTopics();
    const topicsToCreate = topics.filter(
      (topic) => !existingTopics.includes(topic)
    );

    if (topicsToCreate.length > 0) {
      await admin.createTopics({
        topics: topicsToCreate.map((topic) => ({
          topic,
          numPartitions: 3, // 3 partitions for better parallelism
          replicationFactor: 1, // Single broker for local dev
        })),
      });
      console.log(`✅ Created Kafka topics: ${topicsToCreate.join(", ")}`);
    } else {
      console.log("✅ All Kafka topics already exist");
    }

    await admin.disconnect();
  } catch (error) {
    console.error("❌ Error ensuring Kafka topics:", error);
    throw error;
  }
}

/**
 * Disconnect all Kafka clients
 */
async function disconnect() {
  try {
    if (producer) {
      await producer.disconnect();
      producer = null;
      console.log("✅ Kafka producer disconnected");
    }
    if (consumer) {
      await consumer.disconnect();
      consumer = null;
      console.log("✅ Kafka consumer disconnected");
    }
  } catch (error) {
    console.error("❌ Error disconnecting Kafka clients:", error);
  }
}

module.exports = {
  kafka,
  admin,
  getProducer,
  getConsumer,
  ensureTopics,
  disconnect,
};

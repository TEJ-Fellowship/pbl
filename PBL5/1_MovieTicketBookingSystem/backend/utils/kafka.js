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

// Consumer instances (multiple consumers for parallel processing)
const consumers = new Map();

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
 * Get or create Kafka consumer instance
 * @param {string} groupId - Consumer group ID
 * @param {number} instanceId - Unique instance ID for multiple consumers
 * @returns {Promise<Consumer>}
 */
async function getConsumer(groupId = config.KAFKA_GROUP_ID, instanceId = 0) {
  const consumerKey = `${groupId}-${instanceId}`;

  if (!consumers.has(consumerKey)) {
    const consumer = kafka.consumer({
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
    console.log(
      `✅ Kafka consumer ${instanceId} connected (group: ${groupId})`
    );
    consumers.set(consumerKey, consumer);
  }
  return consumers.get(consumerKey);
}

/**
 * Ensure Kafka topics exist with specified partitions
 * @param {Array<string>} topics - Array of topic names
 * @param {number} numPartitions - Number of partitions (default from config)
 */
async function ensureTopics(topics, numPartitions = config.KAFKA_PARTITIONS) {
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
          numPartitions, // Configurable partitions for parallelism
          replicationFactor: 1, // Single broker for local dev
        })),
      });
      console.log(
        `✅ Created Kafka topics: ${topicsToCreate.join(
          ", "
        )} (${numPartitions} partitions each)`
      );
    } else {
      // Check if existing topic needs partition increase
      try {
        const metadata = await admin.fetchTopicMetadata({ topics });
        for (const topicMetadata of metadata.topics) {
          const topicName = topicMetadata.name;
          const partitionCount = topicMetadata.partitions.length;

          if (partitionCount < numPartitions) {
            console.log(
              `⚠️  Topic ${topicName} has ${partitionCount} partitions, but ${numPartitions} requested.`
            );
            console.log(
              `   Note: Kafka doesn't support reducing partitions. Delete and recreate topic to change partition count.`
            );
          } else {
            console.log(
              `✅ Topic ${topicName} exists with ${partitionCount} partitions`
            );
          }
        }
      } catch (metadataError) {
        // If metadata fetch fails, just log and continue
        console.log(
          `ℹ️  Could not fetch topic metadata: ${metadataError.message}`
        );
      }
    }

    await admin.disconnect();
  } catch (error) {
    console.error("❌ Error ensuring Kafka topics:", error);
    throw error;
  }
}

/**
 * Delete and recreate topic with new partition count
 * WARNING: This deletes all messages in the topic!
 * @param {string} topicName - Topic name
 * @param {number} numPartitions - Number of partitions
 */
async function recreateTopic(
  topicName,
  numPartitions = config.KAFKA_PARTITIONS
) {
  try {
    await admin.connect();
    console.log(`🗑️  Deleting topic ${topicName}...`);

    try {
      await admin.deleteTopics({ topics: [topicName], timeout: 5000 });
      console.log(`✅ Deleted topic: ${topicName}`);
    } catch (deleteError) {
      if (deleteError.message.includes("does not exist")) {
        console.log(`ℹ️  Topic ${topicName} doesn't exist (nothing to delete)`);
      } else {
        throw deleteError;
      }
    }

    // Wait a bit for deletion to complete
    await new Promise((resolve) => setTimeout(resolve, 2000));

    console.log(
      `🆕 Creating topic ${topicName} with ${numPartitions} partitions...`
    );
    await admin.createTopics({
      topics: [
        {
          topic: topicName,
          numPartitions,
          replicationFactor: 1,
        },
      ],
    });
    console.log(
      `✅ Created topic: ${topicName} with ${numPartitions} partitions`
    );

    await admin.disconnect();
  } catch (error) {
    console.error("❌ Error recreating topic:", error);
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
    // Disconnect all consumer instances
    for (const [key, consumer] of consumers.entries()) {
      await consumer.disconnect();
      console.log(`✅ Kafka consumer ${key} disconnected`);
    }
    consumers.clear();
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
  recreateTopic,
  disconnect,
};

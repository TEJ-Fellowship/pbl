const { Kafka, Partitioners } = require("kafkajs");
const { KAFKA_BROKER, NODE_ENV } = require("./config");

// Kafka client configuration optimized for 1K users
const kafka = new Kafka({
  clientId: "ecommerce-payment-service",
  brokers: [KAFKA_BROKER || "localhost:9092"],
  // Connection pool settings for high concurrency
  connectionTimeout: 10000,
  requestTimeout: 30000,
  retry: {
    initialRetryTime: 100,
    retries: 8,
    maxRetryTime: 30000,
    multiplier: 2,
  },
});

// Producer instance (singleton pattern)
let producerInstance = null;

/**
 * Get or create Kafka producer instance
 */
const getProducer = async () => {
  if (!producerInstance) {
    producerInstance = kafka.producer({
      // Producer configuration optimized for 1K users
      maxInFlightRequests: 5, // Allow more concurrent requests for better throughput
      idempotent: true, // Prevent duplicate messages
      transactionTimeout: 30000,
      // Use LegacyPartitioner to maintain consistent partitioning behavior
      createPartitioner: Partitioners.LegacyPartitioner,
      // Compression for better throughput
      compression: 1, // GZIP compression
      // Retry configuration for resilience
      retry: {
        retries: 5,
        initialRetryTime: 100,
        maxRetryTime: 30000,
      },
    });

    await producerInstance.connect();

    if (NODE_ENV === "development") {
      console.log("✅ Kafka producer connected");
    }
  }
  return producerInstance;
};

/**
 * Publish payment request to Kafka
 * @param {Object} paymentData - Payment request data
 * @returns {Promise<Object>} - Result with correlationId
 */
const publishPaymentRequest = async (paymentData) => {
  try {
    const producer = await getProducer();

    const message = {
      topic: "payments",
      messages: [
        {
          key: paymentData.orderId, // Partition by orderId for ordering
          value: JSON.stringify({
            ...paymentData,
            timestamp: new Date().toISOString(),
          }),
        },
      ],
      // Acks configuration: -1 (all replicas) required for idempotent producer
      // This ensures exactly-once semantics and prevents message loss
      acks: -1, // All replicas must acknowledge (required for idempotent producer)
    };

    const result = await producer.send(message);

    if (NODE_ENV === "development") {
      console.log(
        `✅ Payment request published for order ${paymentData.orderId}`,
        {
          partition: result[0].partition,
          offset: result[0].offset,
        }
      );
    }

    return {
      success: true,
      partition: result[0].partition,
      offset: result[0].offset,
    };
  } catch (error) {
    console.error("❌ Failed to publish payment request:", error);
    // Re-throw to allow caller to handle (fire-and-forget pattern in controller)
    throw error;
  }
};

/**
 * Create Kafka topic if it doesn't exist (optional - can be done manually)
 */
const ensureTopicExists = async (topicName = "payments", partitions = 3) => {
  try {
    const admin = kafka.admin();
    await admin.connect();

    const topics = await admin.listTopics();

    if (!topics.includes(topicName)) {
      const configEntries = [
        { name: "retention.ms", value: "604800000" }, // 7 days
        { name: "compression.type", value: "gzip" },
      ];

      // DLQ topics should have longer retention
      if (topicName.includes("dlq") || topicName.includes("DLQ")) {
        configEntries.push({ name: "retention.ms", value: "2592000000" }); // 30 days for DLQ
      }

      await admin.createTopics({
        topics: [
          {
            topic: topicName,
            numPartitions: partitions,
            replicationFactor: 1,
            configEntries,
          },
        ],
      });

      if (NODE_ENV === "development") {
        console.log(
          `✅ Kafka topic '${topicName}' created with ${partitions} partitions`
        );
      }
    }

    await admin.disconnect();
  } catch (error) {
    // Non-fatal - topic might already exist or be created manually
    if (NODE_ENV === "development") {
      console.warn(
        `⚠️  Topic creation check failed (non-fatal):`,
        error.message
      );
    }
  }
};

/**
 * Gracefully disconnect producer
 */
const disconnectProducer = async () => {
  if (producerInstance) {
    await producerInstance.disconnect();
    producerInstance = null;
    if (NODE_ENV === "development") {
      console.log("✅ Kafka producer disconnected");
    }
  }
};

module.exports = {
  kafka,
  getProducer,
  publishPaymentRequest,
  ensureTopicExists,
  disconnectProducer,
};

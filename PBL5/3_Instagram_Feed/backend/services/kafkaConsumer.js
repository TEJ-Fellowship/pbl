import {
  kafka,
  TOPICS,
  CONSUMER_GROUPS,
  isKafkaAvailable,
} from "../config/kafka.js";
import * as feedService from "./feedService.js";
import { Follow } from "../models/index.js";
import { KAFKA_CONFIG } from "../config/constants.js";
import { producer } from "./kafkaProducer.js";

/**
 * Kafka Consumer Service
 *
 * WHAT IS A CONSUMER?
 * ===================
 * A consumer is like a subscriber that reads messages from Kafka topics.
 * Consumers process events asynchronously, allowing your application to
 * handle heavy operations (like fan-out) without blocking the main request.
 *
 * HOW IT WORKS:
 * 1. Consumer subscribes to one or more topics
 * 2. Consumer reads messages from partitions
 * 3. Consumer processes the message (e.g., update feeds)
 * 4. Consumer commits the offset (marks message as processed)
 *
 * KEY CONCEPTS:
 * - Consumer Group: Multiple consumers working together (load balancing)
 * - Partition: Each partition is consumed by only ONE consumer in a group
 * - Offset: Position in partition (tracks what's been read)
 * - Commit: Saving the offset (marks message as processed)
 *
 * BENEFITS:
 * - Decoupling: Producers don't wait for consumers
 * - Scalability: Add more consumers to handle more load
 * - Reliability: Messages are persisted and can be replayed
 * - Ordering: Messages in same partition are processed in order
 */

// Create consumer instance for feed processing
const feedConsumer = kafka.consumer({
  groupId: CONSUMER_GROUPS.FEED_PROCESSOR,
  // Consumer configuration - optimized for faster startup
  sessionTimeout: 10000, // Reduced from 30s to 10s
  heartbeatInterval: 3000, // 3 seconds
  maxBytesPerPartition: 1048576, // 1MB per partition
  minBytes: 1,
  maxBytes: 10485760, // 10MB total
  maxWaitTimeInMs: 5000, // Wait up to 5 seconds for messages
  retry: {
    retries: 8,
    initialRetryTime: 100,
    multiplier: 2,
    maxRetryTime: 10000, // Reduced from default
  },
});

let isRunning = false;

// Retry tracking (in-memory for simplicity, could use Redis for distributed systems)
const retryCounts = new Map();
const MAX_RETRY_DELAY = KAFKA_CONFIG.MAX_RETRY_DELAY || 60000;

/**
 * Get retry count for a message
 */
function getRetryCount(messageKey) {
  return retryCounts.get(messageKey) || 0;
}

/**
 * Increment retry count for a message
 */
function incrementRetryCount(messageKey) {
  const count = getRetryCount(messageKey);
  retryCounts.set(messageKey, count + 1);
  return count + 1;
}

/**
 * Clear retry count for a message
 */
function clearRetryCount(messageKey) {
  retryCounts.delete(messageKey);
}

/**
 * Retry a function with exponential backoff
 */
async function retryWithBackoff(event, processFn, messageKey) {
  const retryCount = incrementRetryCount(messageKey);

  if (retryCount > KAFKA_CONFIG.MAX_RETRIES) {
    return false; // Max retries exceeded
  }

  // Calculate delay with exponential backoff
  const delay = Math.min(
    KAFKA_CONFIG.INITIAL_RETRY_DELAY *
      Math.pow(KAFKA_CONFIG.RETRY_MULTIPLIER, retryCount - 1),
    MAX_RETRY_DELAY
  );

  console.log(
    `🔄 [KAFKA] Retrying message (attempt ${retryCount}/${KAFKA_CONFIG.MAX_RETRIES}) after ${delay}ms`
  );

  // Wait before retrying
  await new Promise((resolve) => setTimeout(resolve, delay));

  try {
    await processFn(event);
    clearRetryCount(messageKey);
    return true; // Success
  } catch (error) {
    console.error(
      `❌ [KAFKA] Retry attempt ${retryCount} failed:`,
      error.message
    );
    // If we've hit max retries, return false
    if (retryCount >= KAFKA_CONFIG.MAX_RETRIES) {
      return false;
    }
    // Otherwise, recursively retry
    return await retryWithBackoff(event, processFn, messageKey);
  }
}

/**
 * Send message to Dead-Letter Queue (DLQ)
 */
async function sendToDLQ(event, originalError, retryCount) {
  try {
    const dlqTopic = `${TOPICS.POST_CREATED}${KAFKA_CONFIG.DLQ_TOPIC_SUFFIX}`;
    const dlqMessage = {
      originalEvent: event,
      originalError: {
        message: originalError.message,
        stack: originalError.stack,
      },
      retryCount,
      timestamp: new Date().toISOString(),
      reason: "Max retries exceeded",
    };

    await producer.send({
      topic: dlqTopic,
      messages: [
        {
          key: event.userId || event.postId || "unknown",
          value: JSON.stringify(dlqMessage),
          headers: {
            "content-type": "application/json",
            "x-original-topic": TOPICS.POST_CREATED,
            "x-retry-count": String(retryCount),
          },
        },
      ],
    });

    console.log(`📮 [DLQ] Message sent to ${dlqTopic}`);
  } catch (error) {
    console.error(`❌ [DLQ] Failed to send message to DLQ:`, error.message);
    // Don't throw - we don't want DLQ failures to crash the consumer
  }
}

/**
 * Initialize and start the feed consumer
 *
 * This consumer listens for POST_CREATED events and performs
 * the fan-out operation asynchronously.
 */
export async function startFeedConsumer() {
  if (isRunning) {
    return;
  }

  if (!isKafkaAvailable()) {
    return;
  }

  try {
    await feedConsumer.connect();

    // Subscribe to topics
    await feedConsumer.subscribe({
      topics: [
        TOPICS.POST_CREATED,
        TOPICS.USER_FOLLOWED,
        TOPICS.USER_UNFOLLOWED,
      ],
      fromBeginning: false, // Only read new messages (not historical)
    });

    // Start consuming messages
    await feedConsumer.run({
      // This function is called for each batch of messages
      eachBatch: async ({ batch, resolveOffset, heartbeat }) => {
        for (const message of batch.messages) {
          let processed = false;
          const messageKey = `${message.partition}:${message.offset}`;

          try {
            // Parse the message value
            const event = JSON.parse(message.value.toString());

            // Process based on event type
            await processEvent(event);

            // Clear retry count on success
            clearRetryCount(messageKey);
            processed = true;

            // Mark message as processed (commit offset) - ONLY on success
            resolveOffset(message.offset);

            // Send heartbeat to keep consumer alive
            await heartbeat();
          } catch (error) {
            console.error(
              `❌ [KAFKA] Error processing message at offset ${message.offset}:`,
              error.message
            );

            // Try to parse event for retry logic
            let event = null;
            try {
              event = JSON.parse(message.value.toString());
            } catch (parseError) {
              console.error(
                `❌ [KAFKA] Failed to parse message, sending to DLQ:`,
                parseError.message
              );
              // Can't retry if we can't parse - send to DLQ
              await sendToDLQ(
                { raw: message.value.toString() },
                error,
                getRetryCount(messageKey)
              );
              // Don't commit - let it retry or move to DLQ
              continue;
            }

            // Retry with exponential backoff
            const success = await retryWithBackoff(
              event,
              processEvent,
              messageKey
            );

            if (success) {
              // Successfully processed after retry
              processed = true;
              resolveOffset(message.offset);
            } else {
              // Max retries exceeded - send to DLQ
              console.error(
                `📮 [DLQ] Sending message to dead-letter queue after ${KAFKA_CONFIG.MAX_RETRIES} failed retries`
              );
              await sendToDLQ(event, error, KAFKA_CONFIG.MAX_RETRIES);

              // Only commit after sending to DLQ to prevent infinite retries
              // The message is now in DLQ for manual investigation
              resolveOffset(message.offset);
              clearRetryCount(messageKey);
            }

            // Send heartbeat to keep consumer alive
            await heartbeat();
          }
        }
      },
    });

    isRunning = true;
    console.log("✅ Kafka consumer started");
  } catch (error) {
    isRunning = false;
    const errorMessage =
      error.cause?.code === "ECONNREFUSED"
        ? "Connection refused - Kafka broker is not available"
        : error.message;
    console.error("❌ Error starting feed consumer:", errorMessage);
    throw error;
  }
}

/**
 * Process an event from Kafka
 *
 * @param {Object} event - Event data
 */
async function processEvent(event) {
  const { eventType } = event;

  switch (eventType) {
    case "POST_CREATED":
      await handlePostCreated(event);
      break;

    case "USER_FOLLOWED":
      await handleUserFollowed(event);
      break;

    case "USER_UNFOLLOWED":
      await handleUserUnfollowed(event);
      break;

    default:
      console.warn(`⚠️ [KAFKA] Unknown event type: ${eventType}`);
  }
}

/**
 * Handle POST_CREATED event
 *
 * When a post is created, we need to:
 * 1. Get all followers of the post creator
 * 2. Add the post to each follower's feed (fan-out)
 *
 * This is done asynchronously via Kafka, so the API response
 * doesn't wait for the fan-out to complete.
 */
async function handlePostCreated(event) {
  const { postId, userId, createdAt } = event;

  if (!postId || !userId || !createdAt) {
    throw new Error(
      `Invalid POST_CREATED event: missing required fields. postId: ${postId}, userId: ${userId}, createdAt: ${createdAt}`
    );
  }

  // Perform fan-out to followers' feeds
  // Errors will be caught by the retry mechanism above
  await feedService.fanOutToFollowers(userId, postId, new Date(createdAt));
}

/**
 * Handle USER_FOLLOWED event
 *
 * When user A follows user B, we need to:
 * 1. Backfill user A's feed with user B's recent posts
 *
 * This ensures new followers see recent content immediately.
 */
async function handleUserFollowed(event) {
  const { followerId, followingId } = event;

  try {
    // TODO: Implement feed backfill
  } catch (error) {
    console.error(`❌ [KAFKA] Error processing USER_FOLLOWED event:`, error);
    // Don't throw - just log
  }
}

/**
 * Handle USER_UNFOLLOWED event
 *
 * When user A unfollows user B, we need to:
 * 1. Remove user B's posts from user A's feed
 *
 * This keeps feeds clean and relevant.
 */
async function handleUserUnfollowed(event) {
  const { followerId, followingId } = event;

  try {
    // TODO: Implement post removal from feed
  } catch (error) {
    console.error(`❌ [KAFKA] Error processing USER_UNFOLLOWED event:`, error);
    // Don't throw - just log
  }
}

/**
 * Stop the feed consumer
 */
export async function stopFeedConsumer() {
  if (!isRunning) {
    return;
  }

  try {
    await feedConsumer.disconnect();
    isRunning = false;
  } catch (error) {
    console.error("❌ Error stopping feed consumer:", error);
    throw error;
  }
}

// Export consumer instance for advanced usage
export { feedConsumer };

/**
 * Smart Message Batcher
 * Batches messages for efficient Kafka producer throughput
 * Works for both low and high load scenarios
 */

const { sendBookingRequestsBatch } = require("./kafkaProducer");

class MessageBatcher {
  constructor(options = {}) {
    this.batchSize = options.batchSize || 10; // Send when batch reaches this size
    this.flushInterval = options.flushInterval || 100; // Send after this many ms (even if batch not full)
    this.batch = [];
    this.flushTimer = null;
    this.isFlushing = false;
  }

  /**
   * Add message to batch
   * @param {Object} message - Message to add
   * @returns {Promise} - Resolves when message is queued (not necessarily sent)
   */
  async add(message) {
    this.batch.push(message);

    // If batch is full, flush immediately
    if (this.batch.length >= this.batchSize) {
      await this.flush();
    } else {
      // Otherwise, ensure flush timer is running
      this.startFlushTimer();
    }
  }

  /**
   * Start flush timer (sends batch after timeout even if not full)
   */
  startFlushTimer() {
    // Clear existing timer
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
    }

    // Start new timer
    this.flushTimer = setTimeout(() => {
      this.flush().catch((error) => {
        console.error("[MessageBatcher] Error in scheduled flush:", error);
      });
    }, this.flushInterval);
  }

  /**
   * Flush batch to Kafka
   */
  async flush() {
    // Prevent concurrent flushes
    if (this.isFlushing || this.batch.length === 0) {
      return;
    }

    this.isFlushing = true;

    // Clear timer
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    // Get current batch and clear it
    const messagesToSend = [...this.batch];
    this.batch = [];

    try {
      // Send batch to Kafka
      await sendBookingRequestsBatch(messagesToSend);
    } catch (error) {
      console.error(
        `[MessageBatcher] Failed to send batch of ${messagesToSend.length} messages:`,
        error.message
      );
      // In production, you might want to retry or send to dead letter queue
    } finally {
      this.isFlushing = false;
    }
  }

  /**
   * Force flush (for graceful shutdown)
   */
  async forceFlush() {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
    await this.flush();
  }
}

// Singleton instance (shared across all requests)
let batcherInstance = null;

/**
 * Get or create batcher instance
 * @param {Object} options - Batcher options
 * @returns {MessageBatcher}
 */
function getBatcher(options = {}) {
  if (!batcherInstance) {
    batcherInstance = new MessageBatcher(options);
  }
  return batcherInstance;
}

/**
 * Add message to batch (convenience function)
 * @param {Object} message - Message to add
 */
async function addToBatch(message) {
  const batcher = getBatcher();
  await batcher.add(message);
}

/**
 * Force flush all pending messages
 */
async function flushBatch() {
  if (batcherInstance) {
    await batcherInstance.forceFlush();
  }
}

module.exports = {
  MessageBatcher,
  getBatcher,
  addToBatch,
  flushBatch,
};

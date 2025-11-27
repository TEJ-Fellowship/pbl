/**
 * Kafka Producer Service
 * Handles sending booking requests to Kafka queue
 */

const { getProducer } = require("../utils/kafka");
const config = require("../utils/config");

/**
 * Send booking request to Kafka queue
 * @param {Object} bookingRequest - Booking request data
 * @param {Array<string>} bookingRequest.seat_ids - Array of seat IDs
 * @param {string} bookingRequest.request_id - Unique request ID (for idempotency)
 * @param {Object} bookingRequest.metadata - Optional metadata (user_id, timestamp, etc.)
 * @returns {Promise<Object>} - Result with success status and message ID
 */
async function sendBookingRequest(bookingRequest) {
  try {
    const producer = await getProducer();

    const message = {
      key:
        bookingRequest.request_id || `booking-${Date.now()}-${Math.random()}`,
      value: JSON.stringify({
        ...bookingRequest,
        timestamp: new Date().toISOString(),
      }),
      headers: {
        "content-type": "application/json",
      },
    };

    const result = await producer.send({
      topic: config.KAFKA_TOPIC_BOOKINGS,
      messages: [message],
    });

    console.log(
      `✅ Booking request sent to Kafka: ${message.key} (partition: ${result[0].partition}, offset: ${result[0].offset})`
    );

    return {
      success: true,
      messageId: message.key,
      partition: result[0].partition,
      offset: result[0].offset,
    };
  } catch (error) {
    console.error("❌ Error sending booking request to Kafka:", error);
    throw error;
  }
}

/**
 * Send multiple booking requests in batch
 * @param {Array<Object>} bookingRequests - Array of booking requests
 * @returns {Promise<Object>} - Result with success count and failures
 */
async function sendBookingRequestsBatch(bookingRequests) {
  try {
    const producer = await getProducer();

    const messages = bookingRequests.map((request) => ({
      key: request.request_id || `booking-${Date.now()}-${Math.random()}`,
      value: JSON.stringify({
        ...request,
        timestamp: new Date().toISOString(),
      }),
      headers: {
        "content-type": "application/json",
      },
    }));

    const result = await producer.send({
      topic: config.KAFKA_TOPIC_BOOKINGS,
      messages,
    });

    console.log(
      `✅ Batch of ${bookingRequests.length} booking requests sent to Kafka`
    );

    return {
      success: true,
      count: bookingRequests.length,
      results: result[0],
    };
  } catch (error) {
    console.error("❌ Error sending batch booking requests to Kafka:", error);
    throw error;
  }
}

module.exports = {
  sendBookingRequest,
  sendBookingRequestsBatch,
};

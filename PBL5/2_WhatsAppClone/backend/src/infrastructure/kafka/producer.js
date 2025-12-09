// Kafka producer

import { producer } from '../../config/kafka.js';
import { TOPICS } from './topics.js';

// Connect producer on module load
let isConnected = false;
let connectionPromise = null;

export async function ensureProducerConnected() {
  if (isConnected) {
    return;
  }

  // If connection is in progress, wait for it
  if (connectionPromise) {
    return connectionPromise;
  }

  // Start new connection attempt
  connectionPromise = (async () => {
    try {
      await producer.connect();
      isConnected = true;
      console.log('[Kafka] Producer connected');
      connectionPromise = null;
    } catch (error) {
      connectionPromise = null;
      isConnected = false;
      console.error('[Kafka] Failed to connect producer:', error.message);
      throw error;
    }
  })();

  return connectionPromise;
}

// Initialize connection with retry logic
async function initializeProducer() {
  const maxRetries = 5;
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      await ensureProducerConnected();
      break;
    } catch (error) {
      retries++;
      if (retries >= maxRetries) {
        console.error('[Kafka] Failed to connect producer after', maxRetries, 'attempts');
        // Don't throw - let it fail gracefully on first use
        return;
      }
      const delay = Math.min(1000 * Math.pow(2, retries), 10000);
      console.log(`[Kafka] Retrying producer connection in ${delay}ms (attempt ${retries}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Initialize connection (non-blocking)
initializeProducer().catch(err => {
  console.error('[Kafka] Producer initialization error:', err);
});

// Publish message sent event
export async function publishMessageSent(data) {
  try {
    await ensureProducerConnected();
    await producer.send({
      topic: TOPICS.MESSAGE_SENT,
      messages: [{
        key: data.messageId,
        value: JSON.stringify({
          messageId: data.messageId,
          conversationId: data.conversationId,
          senderId: data.senderId,
          recipientIds: data.recipientIds || [],
          timestamp: data.timestamp || new Date().toISOString(),
        }),
      }],
    });
    console.log(`[Kafka] Published message-sent: ${data.messageId}`);
  } catch (error) {
    console.error('[Kafka] Error publishing message-sent:', error);
    throw error;
  }
}

// Publish message delivered event
export async function publishMessageDelivered(data) {
  try {
    await ensureProducerConnected();
    await producer.send({
      topic: TOPICS.MESSAGE_DELIVERED,
      messages: [{
        key: `${data.messageId}-${data.userId}`,
        value: JSON.stringify({
          messageId: data.messageId,
          conversationId: data.conversationId,
          userId: data.userId,
          timestamp: data.timestamp || new Date().toISOString(),
        }),
      }],
    });
    console.log(`[Kafka] Published message-delivered: ${data.messageId} for user ${data.userId}`);
  } catch (error) {
    console.error('[Kafka] Error publishing message-delivered:', error);
    throw error;
  }
}

// Publish message read event
export async function publishMessageRead(data) {
  try {
    await ensureProducerConnected();
    await producer.send({
      topic: TOPICS.MESSAGE_READ,
      messages: [{
        key: `${data.messageId}-${data.userId}`,
        value: JSON.stringify({
          messageId: data.messageId,
          conversationId: data.conversationId,
          userId: data.userId,
          timestamp: data.timestamp || new Date().toISOString(),
        }),
      }],
    });
    console.log(`[Kafka] Published message-read: ${data.messageId} for user ${data.userId}`);
  } catch (error) {
    console.error('[Kafka] Error publishing message-read:', error);
    throw error;
  }
}
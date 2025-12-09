// Kafka consumer

import { consumer } from '../../config/kafka.js';
import { TOPICS } from './topics.js';
import { updateMessageStatus } from '../../application/messageStatusService.js';

let ioInstance = null;
let isRunning = false;

export function setIOInstance(io) {
  ioInstance = io;
}

export async function startKafkaConsumer(io) {
  if (isRunning) {
    console.log('[Kafka] Consumer already running');
    return;
  }

  setIOInstance(io);

  const maxRetries = 5;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      await consumer.connect();
      console.log('[Kafka] Consumer connected');

      await consumer.subscribe({ 
        topics: Object.values(TOPICS),
        fromBeginning: false, // Only process new messages
      });

      await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          try {
            const data = JSON.parse(message.value.toString());
            const serverId = process.env.SERVER_ID || 'default';

            switch (topic) {
              case TOPICS.MESSAGE_SENT:
                // Message sent is already handled when saving to DB
                // This event is mainly for logging/analytics
                console.log(`[${serverId}] [Kafka] Message sent:`, data.messageId);
                break;

              case TOPICS.MESSAGE_DELIVERED:
                await handleMessageDelivered(data, serverId);
                break;

              case TOPICS.MESSAGE_READ:
                await handleMessageRead(data, serverId);
                break;
              default:
                console.warn(`[${serverId}] [Kafka] Unknown topic: ${topic}`);
            }
          } catch (error) {
            console.error(`[Kafka] Error processing message from ${topic}:`, error);
          }
        },
      });
  
      isRunning = true;
      console.log('[Kafka] Consumer started and subscribed to topics');
      return; // Success, exit retry loop
    } catch (error) {
      retries++;
      console.error(`[Kafka] Failed to start consumer (attempt ${retries}/${maxRetries}):`, error.message);
      
      if (retries >= maxRetries) {
        throw new Error(`Failed to start Kafka consumer after ${maxRetries} attempts: ${error.message}`);
      }
      
      // Wait before retrying with exponential backoff
      const delay = Math.min(1000 * Math.pow(2, retries), 10000);
      console.log(`[Kafka] Retrying consumer connection in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
  
  async function handleMessageDelivered(data, serverId) {
    try {
      // Update status in PostgreSQL
      await updateMessageStatus(
        data.messageId,
        data.conversationId,
        data.userId,
        'delivered'
      );
  
      // Notify sender via WebSocket
      if (ioInstance) {
        ioInstance.to(`user:${data.senderId}`).emit('message:status', {
          messageId: data.messageId,
          conversationId: data.conversationId,
          userId: data.userId,
          status: 'delivered',
          timestamp: data.timestamp,
        });
      }
  
      console.log(`[${serverId}] [Kafka] Message delivered: ${data.messageId} to ${data.userId}`);
    } catch (error) {
      console.error(`[${serverId}] [Kafka] Error handling message-delivered:`, error);
    }
  }

  async function handleMessageRead(data, serverId) {
    try {
      // Update status in PostgreSQL
      await updateMessageStatus(
        data.messageId,
        data.conversationId,
        data.userId,
        'read'
      );
  
      // Notify sender via WebSocket
      if (ioInstance) {
        ioInstance.to(`user:${data.senderId}`).emit('message:status', {
          messageId: data.messageId,
          conversationId: data.conversationId,
          userId: data.userId,
          status: 'read',
          timestamp: data.timestamp,
        });
      }
  
      console.log(`[${serverId}] [Kafka] Message read: ${data.messageId} by ${data.userId}`);
    } catch (error) {
      console.error(`[${serverId}] [Kafka] Error handling message-read:`, error);
    }
  }
  
  export async function stopKafkaConsumer() {
    try {
      await consumer.disconnect();
      isRunning = false;
      console.log('[Kafka] Consumer disconnected');
    } catch (error) {
      console.error('[Kafka] Error disconnecting consumer:', error);
    }
  }
// Kafka consumer

import { consumer } from '../../config/kafka.js';
import { TOPICS } from './topics.js';
import { updateMessageStatus } from '../../application/messageStatusService.js';
import client from '../../config/cassandra.js'; // ✅ NEW: Import Cassandra client
import { types } from 'cassandra-driver'; // ✅ NEW: Import types for TimeUuid

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
      console.log(`[${serverId}] [Kafka] Processing MESSAGE_DELIVERED:`, {
        messageId: data.messageId,
        conversationId: data.conversationId,
        userId: data.userId
      });

      // ✅ NEW: Get sender_id from Cassandra
      let senderId = null;
      try {
        // ✅ Convert messageId to TimeUUID if it's a string
        const messageIdUuid = typeof data.messageId === 'string' 
          ? types.TimeUuid.fromString(data.messageId)
          : data.messageId;
        
        const query = `SELECT sender_id FROM messages WHERE conversation_id = ? AND message_id = ? LIMIT 1`;
        const result = await client.execute(query, [
          data.conversationId,
          messageIdUuid
        ], { prepare: true });
        
        if (result.rows.length > 0) {
          senderId = result.rows[0].sender_id?.toString();
          console.log(`[${serverId}] [Kafka] ✅ Found sender_id: ${senderId} for message ${data.messageId}`);
        } else {
          console.warn(`[${serverId}] [Kafka] ❌ No message found with messageId: ${data.messageId}, conversationId: ${data.conversationId}`);
        }
      } catch (error) {
        console.error(`[${serverId}] [Kafka] Error fetching sender_id:`, error.message, error.stack);
      }

      // Update status in PostgreSQL
      await updateMessageStatus(
        data.messageId,
        data.conversationId,
        data.userId,
        'delivered'
      );
      console.log(`[${serverId}] [Kafka] ✅ Updated PostgreSQL status to 'delivered'`);

      // Notify sender via WebSocket
      if (!ioInstance) {
        console.error(`[${serverId}] [Kafka] ❌ ioInstance is null!`);
        return;
      }

      if (!senderId) {
        console.warn(`[${serverId}] [Kafka] ❌ Could not find sender_id for message ${data.messageId}`);
        return;
      }

      const roomName = `user:${senderId}`;
      const statusData = {
        messageId: data.messageId,
        conversationId: data.conversationId,
        userId: data.userId,
        status: 'delivered',
        timestamp: data.timestamp,
      };

      // ✅ Check if room exists
      const room = ioInstance.sockets.adapter.rooms.get(roomName);
      const roomSize = room ? room.size : 0;
      console.log(`[${serverId}] [Kafka] Room '${roomName}' has ${roomSize} socket(s)`);

      ioInstance.to(roomName).emit('message:status', statusData);
      console.log(`[${serverId}] [Kafka] ✅ Emitted message:status (delivered) to room: ${roomName}`, statusData);

      console.log(`[${serverId}] [Kafka] Message delivered: ${data.messageId} to ${data.userId}`);
    } catch (error) {
      console.error(`[${serverId}] [Kafka] Error handling message-delivered:`, error);
    }
  }

  async function handleMessageRead(data, serverId) {
    try {
      console.log(`[${serverId}] [Kafka] Processing MESSAGE_READ:`, {
        messageId: data.messageId,
        conversationId: data.conversationId,
        userId: data.userId
      });

      // ✅ NEW: Get sender_id from Cassandra
      let senderId = null;
      try {
        // ✅ Convert messageId to TimeUUID if it's a string
        const messageIdUuid = typeof data.messageId === 'string' 
          ? types.TimeUuid.fromString(data.messageId)
          : data.messageId;
        
        const query = `SELECT sender_id FROM messages WHERE conversation_id = ? AND message_id = ? LIMIT 1`;
        const result = await client.execute(query, [
          data.conversationId,
          messageIdUuid
        ], { prepare: true });
        
        if (result.rows.length > 0) {
          senderId = result.rows[0].sender_id?.toString();
          console.log(`[${serverId}] [Kafka] ✅ Found sender_id: ${senderId} for message ${data.messageId}`);
        } else {
          console.warn(`[${serverId}] [Kafka] ❌ No message found with messageId: ${data.messageId}, conversationId: ${data.conversationId}`);
        }
      } catch (error) {
        console.error(`[${serverId}] [Kafka] Error fetching sender_id:`, error.message, error.stack);
      }

      // Update status in PostgreSQL
      await updateMessageStatus(
        data.messageId,
        data.conversationId,
        data.userId,
        'read'
      );
      console.log(`[${serverId}] [Kafka] ✅ Updated PostgreSQL status to 'read'`);

      // Notify sender via WebSocket
      if (!ioInstance) {
        console.error(`[${serverId}] [Kafka] ❌ ioInstance is null!`);
        return;
      }

      if (!senderId) {
        console.warn(`[${serverId}] [Kafka] ❌ Could not find sender_id for message ${data.messageId}`);
        return;
      }

      const roomName = `user:${senderId}`;
      const statusData = {
        messageId: data.messageId,
        conversationId: data.conversationId,
        userId: data.userId,
        status: 'read',
        timestamp: data.timestamp,
      };

      // ✅ Check if room exists
      const room = ioInstance.sockets.adapter.rooms.get(roomName);
      const roomSize = room ? room.size : 0;
      console.log(`[${serverId}] [Kafka] Room '${roomName}' has ${roomSize} socket(s)`);

      ioInstance.to(roomName).emit('message:status', statusData);
      console.log(`[${serverId}] [Kafka] ✅ Emitted message:status (read) to room: ${roomName}`, statusData);

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
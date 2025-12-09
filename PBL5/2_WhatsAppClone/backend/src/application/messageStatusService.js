import { sequelize } from '../config/postgres.js';
import { publishMessageSent, publishMessageDelivered, publishMessageRead } from '../infrastructure/kafka/producer.js';

// Update message status in PostgreSQL
export async function updateMessageStatus(messageId, conversationId, userId, status) {
  const query = `
    INSERT INTO message_status (message_id, conversation_id, user_id, status, updated_at)
    VALUES (:messageId, :conversationId, :userId, :status, NOW())
    ON CONFLICT (message_id, user_id)
    DO UPDATE SET status = :status, updated_at = NOW()
  `;
  
  await sequelize.query(query, {
    replacements: { messageId, conversationId, userId, status },
    type: sequelize.QueryTypes.INSERT,
  });
}

// Mark message as sent for all recipients
export async function markMessageSent(messageId, conversationId, senderId, recipientIds) {
  try {
    // Mark as sent for sender
    await updateMessageStatus(messageId, conversationId, senderId, 'sent');
    
    // Mark as sent for all recipients
    for (const recipientId of recipientIds) {
      await updateMessageStatus(messageId, conversationId, recipientId, 'sent');
    }
    
    // Publish to Kafka
    await publishMessageSent({
      messageId,
      conversationId,
      senderId,
      recipientIds,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[MessageStatus] Error marking message as sent:', error);
    throw error;
  }
}

// Mark message as delivered
export async function markMessageDelivered(messageId, conversationId, userId) {
  try {
    await updateMessageStatus(messageId, conversationId, userId, 'delivered');
    await publishMessageDelivered({
      messageId,
      conversationId,
      userId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[MessageStatus] Error marking message as delivered:', error);
    throw error;
  }
}

// Mark message as read
export async function markMessageRead(messageId, conversationId, userId) {
  try {
    await updateMessageStatus(messageId, conversationId, userId, 'read');
    await publishMessageRead({
      messageId,
      conversationId,
      userId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[MessageStatus] Error marking message as read:', error);
    throw error;
  }
}

// Get message status for a user
export async function getMessageStatus(messageId, userId) {
  const query = `
    SELECT status, updated_at
    FROM message_status
    WHERE message_id = :messageId AND user_id = :userId
  `;
  
  const [results] = await sequelize.query(query, {
    replacements: { messageId, userId },
    type: sequelize.QueryTypes.SELECT,
  });
  
  return results || null;
}

// Get all statuses for a message (for group chats)
export async function getMessageStatuses(messageId) {
  const query = `
    SELECT user_id, status, updated_at
    FROM message_status
    WHERE message_id = :messageId
    ORDER BY updated_at DESC
  `;
  
  const results = await sequelize.query(query, {
    replacements: { messageId },
    type: sequelize.QueryTypes.SELECT,
  });
  
  return results;
}

// Mark multiple messages as read (when user opens conversation)
export async function markMessagesAsRead(conversationId, userId, lastReadMessageId) {
  try {
    // Get all unread messages up to lastReadMessageId
    const query = `
      UPDATE message_status
      SET status = 'read', updated_at = NOW()
      WHERE conversation_id = :conversationId
        AND user_id = :userId
        AND status != 'read'
        AND message_id <= :lastReadMessageId
    `;
    
    await sequelize.query(query, {
      replacements: { conversationId, userId, lastReadMessageId },
      type: sequelize.QueryTypes.UPDATE,
    });
    
    // Publish read events for each message (in production, batch this)
    // For now, we'll just update the last message status
    await publishMessageRead({
      messageId: lastReadMessageId,
      conversationId,
      userId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[MessageStatus] Error marking messages as read:', error);
    throw error;
  }
}
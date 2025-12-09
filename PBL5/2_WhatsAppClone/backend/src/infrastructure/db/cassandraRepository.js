// Cassandra repository implementation

import client from "../../config/cassandra.js";
import { IMessageRepository } from "../../domain/repositories/messageRepository.js";
import { types } from "cassandra-driver";
import { v4 as uuid } from "uuid";

const TABLE = "messages";

export class CassandraRepository extends IMessageRepository {
  constructor() {
    super();
  }

  async saveMessage({
    conversationId,
    senderId,
    content,
    messageType = "text",
    status = "sent",
  }) {
    // if (!conversationId) {
    //   conversationId = uuid();
    // }
    const messageId = types.TimeUuid.now();
    const createdAt = new Date();
    const query = `INSERT INTO ${TABLE} (conversation_id, message_id, sender_id, content, message_type, status, created_at)   VALUES ( ?, ?, ?, ?, ?, ?, ?)`;
    const params = [
      conversationId,
      messageId,
      senderId,
      content,
      messageType,
      status,
      createdAt,
    ];

    await client.execute(query, params, { prepare: true });
    return {
      conversationId,
      messageId,
      senderId,
      content,
      messageType,
      status,
      createdAt,
    };
  }

  async getMessages(conversationId, limit = 50) {
    const query = `SELECT * FROM ${TABLE} WHERE conversation_id = ? ORDER BY message_id DESC LIMIT ?`;
    const result = await client.execute(query, [conversationId, limit], {
      prepare: true,
    });

    return result.rows;
  }

  /**
   * Get messages with cursor-based pagination
   * @param {string} conversationId - The conversation ID
   * @param {number} limit - Number of messages to retrieve (default: 50)
   * @param {string} cursor - Optional cursor (message_id TimeUUID) for pagination
   * @returns {Promise<{messages: Array, hasMore: boolean, nextCursor: string|null}>}
   */
  async getMessagesPaginated(conversationId, limit = 50, cursor = null) {
    let query;
    let params;

    if (cursor) {
      // Convert cursor string to TimeUUID if it's a string
      const cursorTimeUuid = typeof cursor === 'string' 
        ? types.TimeUuid.fromString(cursor) 
        : cursor;
      
      // Get messages older than the cursor (since we order DESC, older = smaller TimeUUID)
      query = `SELECT * FROM ${TABLE} WHERE conversation_id = ? AND message_id < ? ORDER BY message_id DESC LIMIT ?`;
      params = [conversationId, cursorTimeUuid, limit + 1]; // Fetch one extra to check if there are more
    } else {
      // First page - get the most recent messages
      query = `SELECT * FROM ${TABLE} WHERE conversation_id = ? ORDER BY message_id DESC LIMIT ?`;
      params = [conversationId, limit + 1]; // Fetch one extra to check if there are more
    }

    const result = await client.execute(query, params, {
      prepare: true,
    });

    const rows = result.rows;
    const hasMore = rows.length > limit;
    
    // If we fetched one extra, remove it from the result
    const messages = hasMore ? rows.slice(0, limit) : rows;
    
    // The next cursor is the message_id of the oldest message in this batch
    // (last element since we order DESC - newest first, oldest last)
    // Only set cursor if there are more messages to fetch
    const nextCursor = hasMore && messages.length > 0 
      ? messages[messages.length - 1].message_id?.toString() 
      : null;

    return {
      messages,
      hasMore,
      nextCursor,
    };
  }
}

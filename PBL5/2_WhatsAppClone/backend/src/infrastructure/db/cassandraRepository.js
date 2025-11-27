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
}

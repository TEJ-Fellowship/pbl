// Cassandra repository implementation

import client from "../../config/cassandra.js";
import { IMessageRepository } from "../../domain/repositories/messageRepository.js";

const TABLE = "messages";

export class CassandraRepository extends IMessageRepository {
  constructor() {
    super();
  }

  async saveMessage({
    conversationId,
    messageId,
    senderId,
    content,
    createdAt,
  }) {
    const query = `INSERT INTO ${TABLE} (conversation_id, message_id, sender_id, content, created_at)   VALUES ( ?, ?, ?, ?, ?)`;
    const params = [conversationId, messageId, senderId, content, createdAt];

    await client.execute(query, params, { prepare: true });
    return messageId;
  }

  async getMessages(conversationId, limit = 50) {
    const query = `SELECT * FROM ${TABLE} WHERE conversation_id = ? ORDER BY message_id DESC LIMIT ?`;
    const result = await client.execute(query, [conversationId, limit], {
      prepare: true,
    });

    return result.rows;
  }
}

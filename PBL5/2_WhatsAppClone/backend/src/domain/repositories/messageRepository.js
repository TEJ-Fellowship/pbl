// Abstract message repository interface

export class IMessageRepository {
  /*
    save a message to database
    (Object) message { conversation_id, message_id, sender_id, content, createdAt}
  */
  async saveMessage(message) {
    throw new Error("Method not implemented.");
  }

  /*
    (String) chatId
    (number) limit
  */

  async getMessages(chatId, limit) {
    throw new Error("Method not implemented.");
  }
}

// // Entry point (HTTP + WS + Kafka consumers)

// import client from "./config/cassandra.js";

// async function test() {
//   const query = `
//     INSERT INTO messages (conversation_id, message_id, sender_id, content, message_type, status, created_at)
//     VALUES (?, now(), ?, ?, ?, ?, toTimestamp(now()));
//   `;

//   await client.execute(query, [
//     "550e8400-e29b-41d4-a716-446655440000",
//     "123e4567-e89b-12d3-a456-426614174000",
//     "Hello from Node.js!",
//     "text",
//     "sent",
//   ]);

//   console.log("Inserted!");
//   process.exit();
// }
// test();
import { CassandraRepository } from "./infrastructure/db/cassandraRepository.js";

const message = new CassandraRepository();

await message.saveMessage({
  conversationId: "550e8400-e29b-41d4-a716-446655440000",
  messageId: "123e4567-1234-12d3-a456-426614174000",
  senderId: "123e4567-e89b-12d3-a456-426614174000",
  content: "Hello from clean architecture!",
  createdAt: new Date(),
});

const messages = await message.getMessages(
  "550e8400-e29b-41d4-a716-446655440000",
  50
);
console.log(messages);

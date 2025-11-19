// Message controller

import { CassandraRepository } from "../../infrastructure/db/cassandraRepository.js";
const messageRepo = new CassandraRepository();

export const getMessages = async (req, res) => {
  const { conversationId } = req.params;
  const message = await messageRepo.getMessages(conversationId, 10);
  res.json(message);
};

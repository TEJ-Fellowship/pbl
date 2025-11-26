import { Kafka } from "kafkajs";

//creating kafka client
export const kafka = new Kafka({
  clientId: "kafka-app",
  brokers: ["localhost:9092"],
  connectionTimeout: 3000,
  requestTimeout: 30000,
});

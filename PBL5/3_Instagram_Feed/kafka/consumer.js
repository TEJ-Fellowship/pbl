import { kafka } from "./client.js";

async function main() {
  const consumer = kafka.consumer({ groupId: "my-consumer-group1" });
  console.log("Connecting to consumer");

  await consumer.connect();
  console.log("Connected to consumer successfully");

  await consumer.subscribe({ topic: "pos", fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      console.log({
        partition,
        offset: message.offset,
        value: message.value.toString(),
      });
    },
  });
}

main();

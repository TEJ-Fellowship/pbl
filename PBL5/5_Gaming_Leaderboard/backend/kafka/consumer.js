// kafka/consumer.js
const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'gaming-leaderboard-consumer',
  brokers: ['localhost:9092'],
});

const consumer = kafka.consumer({ groupId: 'leaderboard-service' });

async function initConsumer() {
  await consumer.connect();
  console.log('Kafka consumer connected');

  await consumer.subscribe({ topic: 'score-updates', fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const value = message.value.toString();
      const event = JSON.parse(value);

      // Here you would normally update your DB and push to clients.
      // For now, just log it (NO DB as requested).
      console.log('Received score update:', event);
    },
  });
}

module.exports = {
  initConsumer,
};
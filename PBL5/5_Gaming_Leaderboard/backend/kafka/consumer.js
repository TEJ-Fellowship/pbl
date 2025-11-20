// kafka/consumer.js
const { Kafka } = require('kafkajs');
const { redisClient, initRedis } = require('../redis/redisClient');

const kafka = new Kafka({
  clientId: 'gaming-leaderboard-consumer',
  brokers: ['localhost:9092'],
});

const consumer = kafka.consumer({ groupId: 'leaderboard-service' });

async function initConsumer() {
  await initRedis();       // ensure Redis connected
  await consumer.connect();
  console.log('Kafka consumer connected');

  await consumer.subscribe({ topic: 'score-updates', fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const value = message.value.toString();
      const event = JSON.parse(value);
      const { matchId, playerId, score } = event;

      // Store/update score in a Redis sorted set
      // key: "leaderboard:global", member: playerId, score: numeric score
      await redisClient.zAdd('leaderboard:global', {
        score: Number(score),
        value: playerId,
      });

      console.log('Updated Redis leaderboard for:', { matchId, playerId, score });
    },
  });
}

module.exports = {
  initConsumer,
};
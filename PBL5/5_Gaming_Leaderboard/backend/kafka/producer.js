// kafka/producer.js
const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'gaming-leaderboard-producer',
  brokers: ['localhost:9092'], // matches docker-compose
});

const producer = kafka.producer();

async function initProducer() {
  await producer.connect();
  console.log('Kafka producer connected');
}

// Send a score update event (no DB here)
async function sendScoreUpdate({ matchId, playerId, score }) {
  const message = {
    matchId,
    playerId,
    score,
    timestamp: Date.now(),
  };

  await producer.send({
    topic: 'score-updates',
    messages: [{ value: JSON.stringify(message) }],
  });

  console.log('Sent score update:', message);
}

module.exports = {
  initProducer,
  sendScoreUpdate,
};
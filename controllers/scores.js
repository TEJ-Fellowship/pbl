const router = require("express").Router();
const kafka = require('../kafka/client');
const crypto = require('crypto');
const { client } = require('../redis/redisClient');

const producer = kafka.producer();
producer.connect();

const consumer = kafka.consumer({ groupId: 'leaderboard-consumer' });

// Initialize consumer connection in an async function
(async () => {
  await consumer.connect();
})();

router.post("/submit", async (req, res) => {
  const { score } = req.body;
  const playerId = crypto.randomUUID();
  const message = {
    playerId,
    score,
    timestamp: Date.now(),
  };
  await producer.send({
    topic: 'submit-score',
    messages: [{ value: JSON.stringify(message) }],
  });
  res.json({ message: 'Score submitted successfully' });
  await producer.disconnect();
  consumer.subscribe({ topic: 'submit-score', fromBeginning: true });
  consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const value = message.value.toString();
      const data = JSON.parse(value);
      console.log(data);
      await client.zAdd('leaderboard:global', {
        score: data.score,
        member: data.playerId,
      });
    }
  });
  await client.zAdd('leaderboard:global', {
    score: data.score,
    member: data.playerId,
  });
  console.log('Kafka producer disconnected'); 
});


router.get("/leaderboard", async (req, res) => {
  const leaderboard = await client.zRevRange('leaderboard:global', 0, 99);
  res.json({ leaderboard });
});   


module.exports = router;

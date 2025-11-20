// index.js
const express = require('express');
const { initProducer, sendScoreUpdate } = require('./kafka/producer');
const { initConsumer } = require('./kafka/consumer');
const { redisClient, initRedis } = require('./redis/redisClient'); // NEW

const app = express();
app.use(express.json());

// Simple HTTP endpoint to publish score updates
app.post('/score', async (req, res) => {
  try {
    const { matchId, playerId, score } = req.body;
    await sendScoreUpdate({ matchId, playerId, score });
    res.status(200).json({ status: 'ok' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send score update' });
  }
});

// NEW: Get leaderboard from Redis
app.get('/leaderboard', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 10;

    // Get top N playerIds by score (highest first)
    const playerIds = await redisClient.zRevRange(
      'leaderboard:global',
      0,
      limit - 1
    );

    // Fetch scores for each playerId
    const leaderboard = [];
    for (const playerId of playerIds) {
      const scoreStr = await redisClient.zScore('leaderboard:global', playerId);
      leaderboard.push({
        playerId,
        score: Number(scoreStr),
      });
    }

    res.json(leaderboard);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

const PORT = process.env.PORT || 3000;

(async () => {
  await initRedis();     // ensure Redis ready
  await initProducer();
  await initConsumer();
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
})();
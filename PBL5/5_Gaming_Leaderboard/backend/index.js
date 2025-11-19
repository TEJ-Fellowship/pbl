// index.js
const express = require('express');
const { initProducer, sendScoreUpdate } = require('./kafka/producer');
const { initConsumer } = require('./kafka/consumer');

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

const PORT = process.env.PORT || 3000;

(async () => {
  await initProducer();
  await initConsumer(); // just logs messages for now
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
})();
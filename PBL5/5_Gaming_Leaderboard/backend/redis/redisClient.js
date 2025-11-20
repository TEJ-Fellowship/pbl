// redisClient.js
const { createClient } = require('redis');

const redisClient = createClient({
  url: 'redis://localhost:6379', // adjust if using Docker with a different host
});

redisClient.on('error', (err) => {
  console.error('Redis Client Error', err);
});

async function initRedis() {
  if (!redisClient.isOpen) {
    await redisClient.connect();
    console.log('Redis connected');
  }
}

module.exports = {
  redisClient,
  initRedis,
};
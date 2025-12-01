const express = require('express');
const router = express.Router();
const { getPrimary, getReadReplica, getPoolStats } = require('../utils/db');
const { redisClient, isRedisReady } = require('../utils/redis');
const { kafka } = require('../utils/kafka');

/**
 * Health check endpoint
 * Returns system health status with dependency checks
 */
router.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {},
  };

  let isHealthy = true;

  // Check Primary Database
  try {
    await getPrimary().authenticate();
    const poolStats = getPoolStats();
    health.services.database = {
      status: 'ok',
      primary: {
        connected: true,
        pool: poolStats.primary,
      },
      replica1: {
        connected: true,
        pool: poolStats.replica1,
      },
      replica2: {
        connected: true,
        pool: poolStats.replica2,
      },
    };
  } catch (error) {
    isHealthy = false;
    health.services.database = {
      status: 'error',
      error: error.message,
    };
  }

  // Check Redis
  try {
    if (isRedisReady()) {
      await redisClient.ping();
      health.services.redis = {
        status: 'ok',
        connected: true,
      };
    } else {
      isHealthy = false;
      health.services.redis = {
        status: 'error',
        connected: false,
        message: 'Redis not ready',
      };
    }
  } catch (error) {
    isHealthy = false;
    health.services.redis = {
      status: 'error',
      error: error.message,
    };
  }

  // Check Kafka (non-blocking, just verify connection)
  try {
    const admin = kafka.admin();
    await admin.connect();
    const topics = await admin.listTopics();
    await admin.disconnect();
    health.services.kafka = {
      status: 'ok',
      connected: true,
      topics: topics.length,
    };
  } catch (error) {
    // Kafka failure is not critical for basic health
    health.services.kafka = {
      status: 'warning',
      connected: false,
      error: error.message,
      message: 'Kafka unavailable - payment processing may be affected',
    };
  }

  // Overall health status
  health.status = isHealthy ? 'healthy' : 'degraded';

  // Return appropriate status code
  const statusCode = isHealthy ? 200 : 503;
  res.status(statusCode).json(health);
});

/**
 * Readiness probe - checks if service is ready to accept traffic
 */
router.get('/ready', async (req, res) => {
  try {
    // Check critical dependencies
    await getPrimary().authenticate();
    
    if (!isRedisReady()) {
      return res.status(503).json({
        status: 'not ready',
        message: 'Redis not available',
      });
    }

    res.json({
      status: 'ready',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      error: error.message,
    });
  }
});

/**
 * Liveness probe - checks if service is alive
 */
router.get('/live', (req, res) => {
  res.json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

module.exports = router;


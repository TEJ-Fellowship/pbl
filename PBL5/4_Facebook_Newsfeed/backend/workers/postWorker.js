const kafka = require('../config/kafka');
const { Follow } = require('../models/index');
const { setCache, deleteUserPostsCache, deleteFeedCache } = require('../utils/cache');
const { redisClient } = require('../config/redis');
const { NODE_ENV } = require('../utils/config');
const { createTopicsIfNotExist } = require('../utils/kafkaTopics');
const { Op } = require('sequelize');

class PostWorker {
  constructor() {
    this.consumer = null;
    this.isRunning = false;
  }

  async connect() {
    try {
      console.log('🔧 Ensuring Kafka topics exist...');
      await createTopicsIfNotExist();

      this.consumer = kafka.consumer({
        groupId: 'post-worker-group',
        sessionTimeout: 30000,
        heartbeatInterval: 3000,
      });

      await this.consumer.connect();
      console.log('✅ Kafka Consumer connected');

      // Subscribe to topics
      await this.consumer.subscribe({
        topics: ['post-created'],
        fromBeginning: false, // Only consume new messages
      });

      console.log('📋 Subscribed to topics: post-created');
    } catch (error) {
      console.error('❌ Kafka Consumer connection error:', error);
      throw error;
    }
  }

  async disconnect() {
    if (this.consumer) {
      await this.consumer.disconnect();
      this.isRunning = false;
      console.log('✅ Kafka Consumer disconnected');
    }
  }

  async processPostCreated(message) {
    try {
      const eventData = JSON.parse(message.value.toString());
      const { postId, userId, postData, timestamp } = eventData;

      console.log(`🔄 Processing post-created event for post ${postId} by user ${userId}`);

      // ============================================
      // PURE PULL MODEL: Cache the post itself
      // (for individual post lookups, not for feed pre-population)
      // ============================================
      await setCache(`post:${postId}`, postData, 900);
      console.log(`✅ Cached post ${postId}`);

      // ============================================
      // Invalidate user's own posts cache
      // ============================================
      await deleteUserPostsCache(userId);
      console.log(`🗑️ Invalidated user ${userId}'s own posts cache`);

      // ============================================
      // PURE PULL MODEL: SELECTIVE cache invalidation
      // Only invalidate caches of ACTIVE users who follow this post author
      // (NOT fan-out - we don't write to feeds, we just invalidate)
      // ============================================
      try {
        if (!redisClient.isOpen) {
          console.warn('⚠️ Redis not connected, skipping selective cache invalidation');
          return;
        }

        // Get all active users (users who viewed feed in last 5 minutes)
        const activeUserKeys = await redisClient.keys('active_users:*');

        if (activeUserKeys.length === 0) {
          console.log('📭 No active users found, skipping cache invalidation');
          return;
        }

        // Extract user IDs from keys
        const activeUserIds = activeUserKeys.map((key) =>
          parseInt(key.replace('active_users:', ''))
        );

        console.log(`👥 Found ${activeUserIds.length} active users`);

        // Check which active users follow the post author
        const followers = await Follow.findAll({
          where: {
            following_id: userId, // Post author
            follower_id: { [Op.in]: activeUserIds }, // Only active users
          },
          attributes: ['follower_id'],
        });

        const activeFollowerIds = followers.map((f) => f.follower_id);

        // Only invalidate caches of active followers
        if (activeFollowerIds.length > 0) {
          console.log(
            `🎯 Found ${activeFollowerIds.length} active followers for post author ${userId}`
          );
          console.time(`⏱️ Invalidate ${activeFollowerIds.length} caches`);

          const invalidatePromises = activeFollowerIds.map((id) =>
            deleteFeedCache(id)
          );
          await Promise.all(invalidatePromises);

          console.timeEnd(`⏱️ Invalidate ${activeFollowerIds.length} caches`);
          console.log(
            `✅ Invalidated ${activeFollowerIds.length} active follower caches for post ${postId}`
          );
        } else {
          console.log(
            `📭 No active followers found for post author ${userId} - no cache invalidation needed`
          );
        }
      } catch (invalidationError) {
        console.error(
          '❌ Error in selective cache invalidation:',
          invalidationError
        );
        // Don't throw - cache invalidation failure shouldn't break the worker
      }

      console.log(`✅ Successfully processed post-created event for post ${postId}`);
    } catch (error) {
      console.error('❌ Error processing post-created event:', error);
      throw error; // Will trigger retry mechanism
    }
  }

  async run() {
    if (this.isRunning) {
      console.log('⚠️ Worker is already running');
      return;
    }

    try {
      await this.connect();
      this.isRunning = true;

      console.log('🚀 Post Worker started. Waiting for messages...');

      await this.consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          try {
            const startTime = Date.now();

            switch (topic) {
              case 'post-created':
                await this.processPostCreated(message);
                break;
              default:
                console.warn(`⚠️ Unknown topic: ${topic}`);
            }

            const duration = Date.now() - startTime;
            if (NODE_ENV === 'development') {
              console.log(`✅ Processed ${topic} message in ${duration}ms`);
            }
          } catch (error) {
            console.error(`❌ Error processing message from ${topic}:`, error);
            // In production, you might want to send to a dead letter queue
          }
        },
      });
    } catch (error) {
      console.error('❌ Worker error:', error);
      this.isRunning = false;
      throw error;
    }
  }

  async stop() {
    await this.disconnect();
    this.isRunning = false;
  }
}

// Singleton instance
const postWorker = new PostWorker();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 Received SIGTERM, shutting down worker gracefully...');
  await postWorker.stop();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 Received SIGINT, shutting down worker gracefully...');
  await postWorker.stop();
  process.exit(0);
});

module.exports = postWorker;
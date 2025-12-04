const kafka = require('../config/kafka');
const { User, Follow } = require('../models/index');
const { batchAppendToFeedCache, setCache, deleteUserPostsCache } = require('../utils/cache');
const { NODE_ENV } = require('../utils/config');
const { createTopicsIfNotExist } = require('../utils/kafkaTopics');

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
      const { postId, userId, postData, followerIds, timestamp } = eventData;

      console.log(`🔄 Processing post-created event for post ${postId} (${followerIds.length} followers)`);

      // If followerIds not provided, fetch them
      let finalFollowerIds = followerIds;
      if (!followerIds || followerIds.length === 0) {
        const followers = await Follow.findAll({
          where: { following_id: userId },
          attributes: ['follower_id'],
        });
        finalFollowerIds = followers.map((f) => f.follower_id);
      }

      // Fan-out to Redis feed caches
      if (finalFollowerIds.length > 0) {
        console.time(`⏱️ Fan-out for post ${postId}`);
        await batchAppendToFeedCache(finalFollowerIds, postData, 100, 300);
        console.timeEnd(`⏱️ Fan-out for post ${postId}`);
        console.log(`✅ Appended post ${postId} to ${finalFollowerIds.length} feed caches`);
      }

      // Cache the post itself
      await setCache(`post:${postId}`, postData, 900);

      // Invalidate user's own posts cache
      await deleteUserPostsCache(userId);

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
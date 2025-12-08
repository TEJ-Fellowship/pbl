const kafka = require("../config/kafka");
const { NODE_ENV } = require("../utils/config");

class KafkaProducer {
  constructor() {
    this.producer = null;
    this.isConnected = false;
  }

  async connect() {
    if (this.isConnected) {
      return;
    }

    try {
      this.producer = kafka.producer();
      await this.producer.connect();
      this.isConnected = true;
      console.log("✅ Kafka Producer connected");
    } catch (error) {
      console.error("❌ Kafka Producer connection error:", error);
      throw error;
    }
  }

  async disconnect() {
    if (this.producer && this.isConnected) {
      await this.producer.disconnect();
      this.isConnected = false;
      console.log("✅ Kafka Producer disconnected");
    }
  }

  async sendMessage(topic, messages) {
    if (!this.isConnected) {
      await this.connect();
    }

    try {
      const result = await this.producer.send({
        topic,
        messages: Array.isArray(messages) ? messages : [messages],
        acks: 0, // No acknowledgement required
        timeout: 1000,
      });

      if (NODE_ENV === "development") {
        console.log(`📤 Sent message to topic "${topic}"`, result);
      }

      return result;
    } catch (error) {
      console.error(`❌ Error sending message to topic "${topic}":`, error);
      throw error;
    }
  }

  // ============================================
  // PURE PULL MODEL: Send post-created event for SELECTIVE cache invalidation
  // (NOT for fan-out - worker will handle selective invalidation)
  // ============================================
  async sendPostCreatedEvent(eventData) {
    // eventData structure: { postId, userId, postData, timestamp }
    const message = {
      key: eventData.userId.toString(), // Partition by user_id (post author)
      value: JSON.stringify({
        eventType: "post-created",
        postId: eventData.postId,
        userId: eventData.userId,
        postData: {
          id: eventData.postData.id,
          user_id: eventData.postData.user_id,
          content: eventData.postData.content,
          image_urls: eventData.postData.image_urls,
          likes_count: eventData.postData.likes_count || 0,
          comments_count: eventData.postData.comments_count || 0,
          created_at: eventData.postData.created_at,
          author: eventData.postData.author,
        },
        // REMOVED: followerIds - not needed in pure pull model
        // Worker will fetch active users and check follow relationships
        timestamp: eventData.timestamp || new Date().toISOString(),
      }),
    };

    return this.sendMessage("post-created", message);
  }

  async sendEngagementEvent(eventData) {
    const message = {
      key: eventData.postId.toString(),
      value: JSON.stringify({
        eventType: eventData.type, // 'like' or 'comment'
        postId: eventData.postId,
        userId: eventData.userId,
        action: eventData.action, // 'add' or 'remove'
        metadata: eventData.metadata || {},
        timestamp: new Date().toISOString(),
      }),
    };

    return this.sendMessage("engagement-events", message);
  }

  async sendFollowEvent(eventData) {
    const message = {
      key: eventData.followerId.toString(),
      value: JSON.stringify({
        eventType: "follow-changed",
        followerId: eventData.followerId,
        followingId: eventData.followingId,
        action: eventData.action, // 'follow' or 'unfollow'
        timestamp: new Date().toISOString(),
      }),
    };

    return this.sendMessage("follow-changed", message);
  }
}

// Singleton instance
const kafkaProducer = new KafkaProducer();

// Graceful shutdown
process.on("SIGTERM", async () => {
  await kafkaProducer.disconnect();
});

process.on("SIGINT", async () => {
  await kafkaProducer.disconnect();
  process.exit(0);
});

module.exports = kafkaProducer;
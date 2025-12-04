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

  // Convenience methods for specific events
  async sendPostCreatedEvent(postData) {
    const message = {
      key: postData.user_id.toString(), // Partition by user_id
      value: JSON.stringify({
        eventType: "post-created",
        postId: postData.id,
        userId: postData.user_id,
        postData: {
          id: postData.id,
          user_id: postData.user_id,
          content: postData.content,
          image_urls: postData.image_urls,
          likes_count: postData.likes_count || 0,
          comments_count: postData.comments_count || 0,
          created_at: postData.created_at,
          author: postData.author,
        },
        followerIds: postData.followerIds || [],
        timestamp: new Date().toISOString(),
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

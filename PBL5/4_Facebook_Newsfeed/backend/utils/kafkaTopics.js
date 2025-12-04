const kafka = require('../config/kafka');
const { NODE_ENV } = require('./config');

const topics = [
  {
    topic: 'post-created',
    numPartitions: 3,
    replicationFactor: 1,
  },
  {
    topic: 'engagement-events',
    numPartitions: 3,
    replicationFactor: 1,
  },
  {
    topic: 'follow-changed',
    numPartitions: 2,
    replicationFactor: 1,
  },
];

async function createTopicsIfNotExist() {
  const admin = kafka.admin();
  
  try {
    console.log('🔌 Connecting to Kafka Admin...');
    await admin.connect();
    console.log('✅ Kafka Admin connected');

    // Get existing topics
    const existingTopics = await admin.listTopics();
    console.log('📋 Existing topics:', existingTopics);

    // Filter out topics that already exist
    const topicsToCreate = topics.filter(
      (t) => !existingTopics.includes(t.topic)
    );

    if (topicsToCreate.length === 0) {
      console.log('✅ All topics already exist');
      return;
    }

    // Create topics
    console.log(`🔄 Creating ${topicsToCreate.length} topics...`);
    await admin.createTopics({
      topics: topicsToCreate,
      waitForLeaders: true,
    });

    console.log('✅ Topics created successfully:');
    topicsToCreate.forEach((t) => {
      console.log(`   - ${t.topic} (${t.numPartitions} partitions)`);
    });
  } catch (error) {
    console.error('❌ Error creating topics:', error);
    throw error;
  } finally {
    await admin.disconnect();
    console.log('✅ Kafka Admin disconnected');
  }
}

module.exports = { createTopicsIfNotExist, topics };
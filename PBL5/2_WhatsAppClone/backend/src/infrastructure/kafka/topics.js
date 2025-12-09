// Kafka topics configuration

import kafka from '../../config/kafka.js';

export const TOPICS = {
  MESSAGE_SENT: 'message-sent',
  MESSAGE_DELIVERED: 'message-delivered',
  MESSAGE_READ: 'message-read',
};

// Ensure topics exist (call this on server startup)
export async function createTopicsIfNotExists() {
  const admin = kafka.admin();
  
  try {
    await admin.connect();
    console.log('[Kafka] Admin client connected');

    const topicNames = Object.values(TOPICS);
    const existingTopics = await admin.listTopics();
    
    const topicsToCreate = topicNames.filter(topic => !existingTopics.includes(topic));
    
    if (topicsToCreate.length > 0) {
      await admin.createTopics({
        topics: topicsToCreate.map(topic => ({
          topic,
          numPartitions: 3,
          replicationFactor: 1,
          configEntries: [
            {
              name: 'retention.ms',
              value: '604800000', // 7 days
            },
            {
              name: 'cleanup.policy',
              value: 'delete',
            },
          ],
        })),
      });
      console.log(`[Kafka] Created topics: ${topicsToCreate.join(', ')}`);
    } else {
      console.log('[Kafka] All topics already exist');
    }
    
    console.log('[Kafka] Topics:', topicNames);
  } catch (error) {
    console.error('[Kafka] Error creating topics:', error);
    throw error;
  } finally {
    await admin.disconnect();
  }
}